#!/usr/bin/env node
// 用途：校验并组装海报创建请求，或校验创建响应；不联网、不调用模型。
// 参数：--input 输入 JSON --key 幂等键 --output 请求文件；--check-accepted 响应文件可选 --status 202。
// 输出：仅安全摘要；请求文件为 JSON。退出码：0=成功，1=校验失败。
// Known Issues: 已增加地点/事件与服务引用校验；已修复服务 planned 漏检与 location.name 未传搜索别名；仍不替代地点核验和真实生成验收，不修改输入、不生成随机键。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {validatePlaceBindings} from './place-binding.mjs';

export const REQUEST_SCHEMA = 'flipmind-skill-poster-request@2.0.0';
export const ACCEPTED_SCHEMA = 'flipmind-skill-poster-accepted@2.0.0';
export const SERVICE_STATUSES = Object.freeze(['booked','selected','suggested','searching','needs_input','current','stale','unavailable']);
const MiB=1024*1024;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const fail = message => {throw new Error(message);};
function keys(value, allowed, label){
  if(!object(value)) fail(`${label} 必须是对象`);
  for(const key of Object.keys(value)) if(!allowed.includes(key)) fail(`${label} 包含不支持字段：${key}`);
}
function stringLimit(value, max, label){
  if(value !== undefined && (typeof value !== 'string' || value.length>max)) fail(`${label} 格式或长度错误`);
}
function preparePlaceSearch(activity){
  const aliases=activity.place_search_aliases;
  if(aliases!==undefined&&(!Array.isArray(aliases)||aliases.length>6||aliases.some(x=>!nonempty(x))))fail(`活动 ${activity.id} 的 place_search_aliases 必须是最多 6 个非空地名`);
  const name=activity.location?.name;
  const seen=new Set([activity.title.trim().normalize('NFKC').toLowerCase()]);
  const merged=[...(nonempty(name)?[name]:[]),...(aliases||[])].map(x=>x.trim()).filter(x=>{
    const key=x.normalize('NFKC').toLowerCase();if(seen.has(key))return false;seen.add(key);return true;
  });
  if(merged.length>6)fail(`活动 ${activity.id} 的地点名与 place_search_aliases 合计超过 6 个，请合并重复别名`);
  if(merged.length||aliases!==undefined)activity.place_search_aliases=merged;
}
function inspect(value){
  if(Array.isArray(value)){for(const item of value)inspect(item);return;}
  if(!object(value))return;
  for(const [key,item] of Object.entries(value)){
    if(['__proto__','constructor','prototype','generation','entry_mode','presentation_mode','renderer_variant','generation_profile','generation_features','research_flights','research_hotels','resolve_all_pois','owner','owner_id','owner_user_id','owner_provider','authorization','access_token','edit_token'].includes(key.toLowerCase()))fail('输入包含服务端控制字段或凭证');
    inspect(item);
  }
}
function attachments(value=[]){
  if(!Array.isArray(value)||value.length>12)fail('附件必须为数组且最多 12 项');
  let total=0;
  for(const a of value){
    keys(a,['name','media_type','authorized','extracted_text','data'],'附件');
    if(a.authorized!==true)fail('附件必须明确授权');
    stringLimit(a.name,255,'附件名');stringLimit(a.media_type,127,'媒体类型');stringLimit(a.extracted_text,100000,'附件原文');
    if(!nonempty(a.extracted_text)&&!nonempty(a.data))fail('附件需提供提取文本或图片数据');
    if(a.data!==undefined){
      if(typeof a.data!=='string')fail('图片数据格式错误');
      const m=a.data.match(/^data:image\/(png|jpeg|webp);base64,([a-z0-9+/=\s]+)$/i);
      if(!m)fail('图片仅支持 PNG/JPEG/WebP Data URL');
      const encoded=m[2].replace(/\s/g,'');const b=Buffer.from(encoded,'base64');
      if(!b.length||b.toString('base64')!==encoded)fail('图片 Base64 无效');
      const kind=m[1].toLowerCase();
      const valid=kind==='png'?b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):kind==='jpeg'?b[0]===255&&b[1]===216&&b[2]===255:b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
      if(!valid || (a.media_type && a.media_type.toLowerCase()!==`image/${kind}`))fail('图片魔数与媒体类型不一致');
      if(b.length>8*MiB)fail('单图超过 8 MiB');total+=b.length;
    }
  }
  if(total>16*MiB)fail('图片总量超过 16 MiB');
  return value;
}
export function preparePosterRequest(input,key){
  keys(input,['trip_snapshot','source_text','attachments','options'],'输入');
  if(typeof key!=='string'||key.trim()!==key||key.length<8||key.length>160||/[\r\n]/.test(key))fail('幂等键必须为 8–160 字符且不含首尾空格或换行');
  inspect(input);
  const snapshot=structuredClone(input.trip_snapshot);
  if(!object(snapshot)||snapshot.schema_version!=='flipmind-trip-snapshot@1.0.0')fail('Snapshot schema 不正确');
  if(!['exact','complete_missing'].includes(snapshot.input_mode))fail('Snapshot 必须明确 exact 或 complete_missing');
  if(!nonempty(snapshot.title))fail('缺少行程标题');
  const privacy=snapshot.privacy;
  if(!object(privacy)||privacy.visibility!=='link'||privacy.contains_private_media!==false||privacy.consent_confirmed!==true)fail('需确认链接可见性、无私人媒体及上传同意');
  if(!Array.isArray(snapshot.days)||!snapshot.days.length||snapshot.days.length>21)fail('行程需包含 1–21 天');
  let count=0;const ids=new Set();
  for(const day of snapshot.days){
    if(!object(day)||!nonempty(day.id)||!Array.isArray(day.activities)||day.activities.length>12)fail('天次需稳定 id、活动数组且每天最多 12 项');
    if(ids.has(day.id))fail('天次或活动 id 重复');ids.add(day.id);
    for(const a of day.activities){
      if(!object(a)||!nonempty(a.id)||!nonempty(a.title)||!Number.isInteger(a.order)||a.order<1)fail('活动需稳定 id、具名标题与正整数顺序');
      if(ids.has(a.id))fail('天次或活动 id 重复');ids.add(a.id);count++;
      if(a.location){
        if(!object(a.location))fail(`活动 ${a.id} 的 location 必须为对象`);
        const {lat,lng,coordinate_system}=a.location;
        if(lat!=null||lng!=null){
          if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||coordinate_system!=='WGS84')fail('坐标需完整有效且明确 WGS84；未知时省略坐标');
        }
      }
      preparePlaceSearch(a);
    }
  }
  if(count<1||count>126)fail('正式活动需包含 1–126 项');
  snapshot.services??={};
  if(!object(snapshot.services))fail('服务必须是对象');
  let serviceCount=0;
  for(const field of ['flights','hotel_stays','activities',...['reservations','restaurants'].filter(field=>snapshot.services[field]!==undefined)]){
    snapshot.services[field]??=[];
    if(!Array.isArray(snapshot.services[field]))fail('服务集合必须为数组');
    for(const [index,service] of snapshot.services[field].entries()){
      if(!object(service))fail(`服务 ${field}[${index}] 必须为对象`);
      if(field==='reservations'){
        if(!nonempty(service.name))fail('活动 / 预定名称必填');
        if(service.poi_id!==undefined&&typeof service.poi_id!=='string')fail('关联 POI 需使用稳定 ID 字符串');
        for(const key of ['url','cover_url'])if(service[key]){let u;try{u=new URL(service[key]);}catch{fail('活动 / 预定链接格式无效');}if(!['http:','https:'].includes(u.protocol))fail('活动 / 预定链接仅支持 HTTP 或 HTTPS');}
        if(service.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(service.date)||!Number.isFinite(Date.parse(service.date))||new Date(service.date).toISOString().slice(0,10)!==service.date))fail('活动 / 预定日期无效');
        if(service.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(service.time))fail('活动 / 预定时间无效');
      }
      if(service.status!==undefined&&!SERVICE_STATUSES.includes(service.status))fail(`服务 ${field}[${index}] 的 status 无效：仅支持 ${SERVICE_STATUSES.join('、')}；计划且未选择用 suggested，暂选用 selected，已预订用 booked`);
    }
    serviceCount+=snapshot.services[field].length;
  }
  if(serviceCount>200)fail('服务记录超过 200 项');
  validatePlaceBindings(snapshot.days,snapshot.services);
  if(Buffer.byteLength(JSON.stringify(snapshot))>MiB)fail('Snapshot 超过 1 MiB');
  stringLimit(input.source_text,100000,'source_text');
  const options=structuredClone(input.options||{});
  keys(options,['language','art_style'],'options');
  if(options.language!==undefined&&!['zh','en','fr','es'].includes(options.language))fail('当前语言只支持 zh/en/fr/es');
  if(options.art_style!==undefined&&!['watercolor','illustration','realistic'].includes(options.art_style))fail('当前画风只支持 watercolor/illustration/realistic');
  const body={schema_version:REQUEST_SCHEMA,input_mode:'structured',source_text:input.source_text||'',trip_snapshot:snapshot,attachments:structuredClone(attachments(input.attachments)),options,request_origin:'travel-journal-creator@1'};
  const serialized=JSON.stringify(body);
  if(Buffer.byteLength(serialized)>24*MiB)fail('请求超过 24 MiB');
  return {body,headers:{'Content-Type':'application/json','Idempotency-Key':key},serialized};
}
export function validatePreviewUrl(value,tripId){
  if(!nonempty(value))fail('缺少 preview_url');
  let u;try{u=new URL(value);}catch{fail('Preview 链接无效');}
  const local=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
  if(u.protocol!=='https:'&&!(u.protocol==='http:'&&local))fail('Preview 需要 HTTPS（本机开发除外）');
  if(u.username||u.password||u.search||u.hash||!/^\/preview\/[A-Za-z0-9_-]+$/.test(u.pathname))fail('Preview 链接路径或附加字段无效');
  if(tripId!==undefined&&(!nonempty(tripId)||u.pathname!==`/preview/${encodeURIComponent(tripId)}`))fail('Preview 与 Trip 不匹配');
  return value;
}
export function validatePosterAccepted(body,status=202){
  if(![200,202].includes(status)||!object(body)||body.schema_version!==ACCEPTED_SCHEMA||body.mode!=='poster')fail('不是新版海报接受响应');
  if(!nonempty(body.job_id)||!nonempty(body.trip_id)||!nonempty(body.status)||body.status==='failed'||typeof body.idempotent_replay!=='boolean')fail('接受响应字段不完整或状态失败');
  return validatePreviewUrl(body.preview_url,body.trip_id);
}
function arg(name){const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];}
function main(){
  const accepted=arg('--check-accepted');
  if(accepted){validatePosterAccepted(JSON.parse(fs.readFileSync(accepted,'utf8')),Number(arg('--status')||202));console.log('海报接受响应校验通过（链接未写入日志）');return;}
  const input=arg('--input'),output=arg('--output');
  if(!input||!output)fail('需提供 --input、--key 与 --output');
  const r=preparePosterRequest(JSON.parse(fs.readFileSync(input,'utf8')),arg('--key'));
  fs.writeFileSync(output,r.serialized,{flag:'wx',mode:0o600});
  console.log(JSON.stringify({schema:r.body.schema_version,days:r.body.trip_snapshot.days.length,sha256:createHash('sha256').update(r.serialized).digest('hex'),written:true}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main();}catch(e){console.error(`校验失败：${e.code==='EEXIST'?'输出已存在，未覆盖':e.message}`);process.exitCode=1;}
}
