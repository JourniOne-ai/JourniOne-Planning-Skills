#!/usr/bin/env node
// 用途：离线验证 Skill 请求、接受响应、卡片及文件引用；可与 dev 源码契约对照。
// 参数：可选 --server-root <dev 源码目录>。
// 输出：中文测试摘要；退出码：0=成功，1=失败。
// Known Issues: 2026-09-15 修正已更名的显示名称断言，并覆盖多语言 README 引用； 地点名优先检索并保留活动标题；不调用真实生成，不代替部署配置和浏览器验收；引用检查排除代码块内示例占位符；正式默认域名与跨域响应使用注入传输验证。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {preparePosterRequest,validatePosterAccepted,validatePreviewUrl,ACCEPTED_SCHEMA} from './prepare-poster-request.mjs';
import {renderRoadbookCard,buildGoogleMapsDays} from './render-roadbook-card.mjs';
import {submitPosterRequest} from './submit-poster-request.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const input={trip_snapshot:{schema_version:'flipmind-trip-snapshot@1.0.0',input_mode:'exact',title:'京都两日散步',language:'zh',trip_meta:{destination:{name:'京都'},display_currency:'HKD'},days:[{id:'day-1',title:'伏见',activities:[{id:'poi-1',order:1,title:'伏见稻荷大社',location:{name:'伏见稻荷大社'}}]},{id:'day-2',title:'清水寺',activities:[{id:'poi-2',order:1,title:'清水寺',time:'09:00',location:{name:'清水寺'}}]}],privacy:{visibility:'link',contains_private_media:false,consent_confirmed:true}},attachments:[{name:'行程.pdf',media_type:'application/pdf',authorized:true,extracted_text:'第一天伏见稻荷，第二天09:00清水寺。'}]};
let passed=0;
function check(name,fn){fn();passed++;console.log(`通过：${name}`);}
const key='travel-journal-offline-test';
check('无酒店机票、日期与人数仍可构造完整请求',()=>{
 const before=JSON.stringify(input);const r=preparePosterRequest(input,key);
 assert.equal(r.body.input_mode,'structured');assert.deepEqual(r.body.trip_snapshot.services,{flights:[],hotel_stays:[],activities:[]});
 assert.equal(r.body.trip_snapshot.days.length,2);assert.equal(r.body.trip_snapshot.days[1].activities[0].time,'09:00');assert.equal(r.body.attachments[0].extracted_text,input.attachments[0].extracted_text);
 assert.equal(JSON.stringify(input),before);assert.deepEqual(r,preparePosterRequest(input,key));assert.equal(r.headers['Idempotency-Key'],key);assert.equal(Object.keys(r.headers).length,2);
});
const services={flights:[{id:'flight-1',status:'suggested',flight_number:'TEST123',booking_url:'https://example.org/flight'}],hotel_stays:[{id:'hotel-1',status:'selected',hotel_name:'用户已选酒店',check_in:'2026-10-01',check_out:'2026-10-03'}],activities:[]};
const withServices=structuredClone(input);withServices.trip_snapshot.services=services;
check('已有服务、港币与建议状态保留',()=>{const r=preparePosterRequest(withServices,key);assert.deepEqual(r.body.trip_snapshot.services,services);assert.equal(r.body.trip_snapshot.trip_meta.display_currency,'HKD');});
const jazz=structuredClone(input);
jazz.attachments=[];
jazz.trip_snapshot.days=[{id:'day-1',title:'爵士散步',city:'东京',activities:[{id:'jam-1',order:1,title:'下午 Session 旁听计划：窗口待核对',location:{name:'J-flow',address:'東京都墨田区亀沢3-13-6'},status:'planned',place_search_aliases:['ジャズ J-flow']}]}];
jazz.trip_snapshot.services={flights:[],hotel_stays:[],activities:[{id:'jam-service',activity_id:'jam-1',status:'suggested',booking_status:'not_booked',schedule_status:'to_be_verified'}]};
check('真实失败回归：服务 planned 在本地拒绝，活动 planned 与待预订标签保留',()=>{
 for(const field of ['flights','hotel_stays','activities']){
  for(const status of ['planned','confirmed','selected_not_booked',42,null]){
   const x=structuredClone(jazz);x.trip_snapshot.services[field]=[{id:'invalid-service',status}];
   assert.throws(()=>preparePosterRequest(x,key),/服务.*status/);
  }
  const x=structuredClone(jazz);x.trip_snapshot.services[field]=[null];assert.throws(()=>preparePosterRequest(x,key),/服务/);
 }
 const r=preparePosterRequest(jazz,key);assert.deepEqual(r.body.trip_snapshot.services,jazz.trip_snapshot.services);
 assert.equal(r.body.trip_snapshot.days[0].activities[0].status,'planned');
});
check('描述标题与地点身份分离，地点名传入搜索别名且不改变原稿',()=>{
 const before=JSON.stringify(jazz);const r=preparePosterRequest(jazz,key);const a=r.body.trip_snapshot.days[0].activities[0];
 assert.equal(a.title,jazz.trip_snapshot.days[0].activities[0].title);assert.deepEqual(a.location,jazz.trip_snapshot.days[0].activities[0].location);
 assert.deepEqual(a.place_search_aliases,['J-flow','ジャズ J-flow']);assert.equal(JSON.stringify(jazz),before);assert.deepEqual(r,preparePosterRequest(jazz,key));
 const duplicate=structuredClone(jazz);duplicate.trip_snapshot.days[0].activities[0].place_search_aliases=['J-flow','J-flow','ジャズ J-flow'];
 assert.deepEqual(preparePosterRequest(duplicate,key).body.trip_snapshot.days[0].activities[0].place_search_aliases,['J-flow','ジャズ J-flow']);
 const invalid=structuredClone(jazz);invalid.trip_snapshot.days[0].activities[0].place_search_aliases='J-flow';assert.throws(()=>preparePosterRequest(invalid,key),/place_search_aliases/);
});
check('禁止空点位、无授权、私人媒体与控制字段',()=>{
 for(const change of [x=>x.trip_snapshot.days=[],x=>x.trip_snapshot.days[0].activities[0].title='',x=>x.attachments[0].authorized=false,x=>x.trip_snapshot.privacy.contains_private_media=true,x=>x.options={resolve_all_pois:false},x=>x.trip_snapshot.generation={},x=>x.trip_snapshot.owner_id='someone',x=>x.trip_snapshot.days[0].activities[0].location={lat:1,lng:1},x=>x.attachments[0]={name:'x',authorized:true,data_url:'wrong'},x=>x.source_text='x'.repeat(100001)]){
  const x=structuredClone(input);change(x);assert.throws(()=>preparePosterRequest(x,key));
 }
});
check('超限和错误图片拒绝，图片原字节保留',()=>{
 const x=structuredClone(input);x.trip_snapshot.days=Array.from({length:22},(_,i)=>({id:`day-${i}`,activities:[]}));assert.throws(()=>preparePosterRequest(x,key));
 const data=`data:image/png;base64,${fs.readFileSync(path.join(root,'assets/default-roadbook-cover.png')).toString('base64')}`;
 const image=structuredClone(input);image.attachments=[{name:'封面.png',media_type:'image/png',authorized:true,data}];assert.equal(preparePosterRequest(image,key).body.attachments[0].data,data);
 image.attachments[0].data='data:image/png;base64,YWJj';assert.throws(()=>preparePosterRequest(image,key));
 assert.throws(()=>preparePosterRequest(input,'short'));
});
const accepted={schema_version:ACCEPTED_SCHEMA,mode:'poster',job_id:'job-example',trip_id:'skill-poster-example',status:'accepted',idempotent_replay:false,preview_url:'https://example.org/preview/skill-poster-example'};
check('接受响应严格匹配行程预览链接',()=>{
 assert.equal(validatePosterAccepted(accepted),accepted.preview_url);
 assert.equal(validatePosterAccepted({...accepted,idempotent_replay:true},200),accepted.preview_url);
 for(const u of ['https://example.org/share/skill-poster-example','https://example.org/preview/other','https://example.org/preview/skill-poster-example?x=1','https://example.org/preview/skill-poster-example#x','https://user:password@example.org/preview/skill-poster-example','http://example.org/preview/skill-poster-example'])assert.throws(()=>validatePosterAccepted({...accepted,preview_url:u}));
 assert.throws(()=>validatePosterAccepted({...accepted,preview_url:undefined}));assert.throws(()=>validatePosterAccepted(accepted,503));assert.throws(()=>validatePosterAccepted({...accepted,mode:'invalid'}));
 assert.equal(validatePreviewUrl('http://127.0.0.1:5174/preview/local'),'http://127.0.0.1:5174/preview/local');
});
check('卡片保留封面、转义、单一链接与地图折叠',()=>{
 const data={title:'<旅行>',overview:'完整内容',preview_url:accepted.preview_url,mode:'poster',days:[{label:'Day 1',title:'Day 1｜伏见',map_url:'https://www.google.com/maps/dir/1,2/3,4'}]};
 const html=renderRoadbookCard(data);assert.ok(html.includes('data-cover-source="fallback"'));assert.ok(html.includes('&lt;旅行&gt;'));assert.ok(html.includes('aria-expanded="false"'));assert.ok(html.includes('Day 1｜伏见'));assert.ok(!html.includes('Day 1｜Day 1'));assert.equal(html.split(accepted.preview_url).length-1,1);assert.throws(()=>renderRoadbookCard({...data,mode:'invalid'}));assert.throws(()=>renderRoadbookCard({...data,preview_url:undefined}));
});
const mapSnapshot={days:[
 {title:'Day 1｜河岸与街区',date:'2026-10-01',activities:[{title:'地点甲',location:{lat:25.04123456,lng:121.53123456,coordinate_system:'WGS84'}},{title:'地点乙',location:{lat:25.06123456,lng:121.51123456,coordinate_system:'WGS-84'}}]},
 {title:'书店与小店',activities:[{title:'地点丙',location:{lat:25.05,lng:121.52,coordinate_system:'WGS84'}},{title:'待核验小店',location:{name:'待核验小店'}}]},
 {title:'最后一天',activities:[{title:'其他坐标系点位',location:{lat:25,lng:121,coordinate_system:'GCJ02'}},{title:'无坐标系标记',location:{lat:25,lng:121}},{title:'无效坐标',location:{lat:91,lng:181,coordinate_system:'WGS84'}}]}
]};
check('地图保留顺序与精度，单点和缺失天次不丢失',()=>{
 const before=JSON.stringify(mapSnapshot),days=buildGoogleMapsDays(mapSnapshot);
 assert.equal(JSON.stringify(mapSnapshot),before);assert.equal(days.length,3);
 assert.equal(days[0].map_url,'https://www.google.com/maps/dir/25.04123456,121.53123456/25.06123456,121.51123456');
 assert.deepEqual(days[0].points.map(p=>p.title),['地点甲','地点乙']);assert.equal(days[0].label,'10月1日');
 assert.equal(days[1].map_url,'https://www.google.com/maps/search/?api=1&query=25.05,121.52');assert.deepEqual(days[1].missing_points,['待核验小店']);
 assert.equal(days[2].map_url,'');assert.deepEqual(days[2].missing_points,['其他坐标系点位','无坐标系标记','无效坐标']);
 const html=renderRoadbookCard({title:'地图模拟',overview:'仅供离线验证',preview_url:accepted.preview_url,trip_snapshot:mapSnapshot,days:[{title:'旧版不应出现',map_url:'https://www.google.com/maps/dir/1,2/3,4'}]});
 assert.ok(html.includes('打开 Travel Journal'));assert.ok(!html.includes('Journey Story'));assert.ok(!html.includes('旧版不应出现'));
 assert.ok(html.includes('10月1日｜河岸与街区'));assert.ok(!html.includes('10月1日｜Day 1'));
 assert.ok(html.includes('Day 3｜最后一天 · 地图待核实'));assert.ok(html.includes('地图未包含：待核验小店'));
 for(const day of days)for(const point of day.points)assert.ok(html.includes(point.title));
 assert.throws(()=>renderRoadbookCard({title:'无逐日数据',overview:'不允许省略地图',preview_url:accepted.preview_url}));
});
check('卡片实际执行脚本后地图可展开并再次收起',()=>{
 const html=renderRoadbookCard({title:'交互模拟',overview:'仅供离线验证',preview_url:accepted.preview_url,trip_snapshot:mapSnapshot});
 const attrs={'aria-expanded':'false'},panel={hidden:true};let click;
 const button={getAttribute:key=>attrs[key],setAttribute:(key,value)=>attrs[key]=value,addEventListener:(event,handler)=>{assert.equal(event,'click');click=handler;},textContent:'Google Maps 逐日路线 展开'};
 const document={getElementById:()=>({querySelector:selector=>selector.endsWith('-button')?button:panel})};
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];vm.runInNewContext(script,{document});
 assert.equal(typeof click,'function');assert.equal(panel.hidden,true);
 click();assert.equal(attrs['aria-expanded'],'true');assert.equal(panel.hidden,false);assert.equal(button.textContent,'Google Maps 逐日路线 收起');
 click();assert.equal(attrs['aria-expanded'],'false');assert.equal(panel.hidden,true);assert.equal(button.textContent,'Google Maps 逐日路线 展开');
});
check('全部本地 Markdown 引用可解析',()=>{
 const files=fs.readdirSync(root,{recursive:true}).filter(x=>x.endsWith('.md')).map(x=>path.join(root,x));
 for(const file of files){const text=fs.readFileSync(file,'utf8').replace(/```[\s\S]*?```/g,'');for(const match of text.matchAll(/\]\(([^)]+)\)/g)){
  const target=match[1];if(target.startsWith('http')||target.startsWith('#')||target.includes('<'))continue;
  assert.ok(fs.existsSync(path.resolve(path.dirname(file),target.split('#')[0])),`引用缺失：${path.basename(file)} → ${target}`);
 }}
 const entry=fs.readFileSync(path.join(root,'SKILL.md'),'utf8');assert.ok(entry.startsWith('---\nname: travel-journal-creator\n'));
 const meta=fs.readFileSync(path.join(root,'agents/openai.yaml'),'utf8');assert.ok(meta.includes('display_name: "Travel Journal Creator"'));assert.ok(meta.includes('allow_implicit_invocation: true'));
});
check('CLI 不覆盖既有请求，输出不泄露正文或链接',()=>{
 const tempRoot=path.resolve(root,'..','.tmp');fs.mkdirSync(tempRoot,{recursive:true});
 const dir=fs.mkdtempSync(path.join(tempRoot,'travel-journal-contract-'));
 const source=path.join(dir,'input.json'),out=path.join(dir,'request.json');fs.writeFileSync(source,JSON.stringify(input));
 const args=[path.join(root,'scripts/prepare-poster-request.mjs'),'--input',source,'--key',key,'--output',out];
 const first=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(first.status,0,first.stderr);assert.ok(!first.stdout.includes(input.trip_snapshot.title));assert.deepEqual(JSON.parse(fs.readFileSync(out,'utf8')),preparePosterRequest(input,key).body);
 const again=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(again.status,1);assert.ok(again.stderr.includes('未覆盖'));
 for(const f of [source,out])fs.unlinkSync(f);fs.rmdirSync(dir);
});
const at=process.argv.indexOf('--server-root');
if(at>=0){
 const serverRoot=path.resolve(process.argv[at+1]);
 const {normalizeExternalSkillPosterRequest}=await import(pathToFileURL(path.join(serverRoot,'api/_lib/skill-v2/contracts.js')));
 check('新请求被真实 dev 规范化器接受，服务完整保留',()=>{
  for(const fixture of [input,withServices]){
   const r=preparePosterRequest(fixture,key);const normalized=normalizeExternalSkillPosterRequest(r.body,key);
   assert.equal(normalized.generation_profile,'external_skill_poster_v1');assert.equal(normalized.generation_features.poi_detail_images,'skip');assert.equal(normalized.trip_snapshot.days.length,2);assert.equal(normalized.trip_snapshot.days[1].activities[0].title,'清水寺');assert.equal(normalized.request_origin,'travel-journal-creator@1');
   assert.equal(normalized.trip_snapshot.services.flights.length,fixture.trip_snapshot.services?.flights.length||0);assert.equal(normalized.trip_snapshot.services.hotel_stays.length,fixture.trip_snapshot.services?.hotel_stays.length||0);
  }
 });
 check('真实失败回归与全部服务状态通过 dev 规范化器',()=>{
  for(const status of ['booked','selected','suggested','searching','needs_input','current','stale','unavailable']){
   const x=structuredClone(jazz);x.trip_snapshot.services.activities[0].status=status;
   const normalized=normalizeExternalSkillPosterRequest(preparePosterRequest(x,key).body,key);
   assert.equal(normalized.trip_snapshot.services.activities[0].status,status);
   assert.equal(normalized.trip_snapshot.services.activities[0].booking_status,'not_booked');
   assert.deepEqual(normalized.trip_snapshot.days[0].activities[0].place_search_aliases,['J-flow','ジャズ J-flow']);
  }
 });
 const {resolveSkillV2Locations}=await import(pathToFileURL(path.join(serverRoot,'api/_lib/skill-v2/intake.js')));
 const calls=[];
 const candidate=normalizeExternalSkillPosterRequest(preparePosterRequest(jazz,key).body,key).trip_snapshot;
 const resolved=await resolveSkillV2Locations(candidate,{}, {resolvePlace:async ({expectedName})=>{
  calls.push(expectedName);
  // 仅为离线身份匹配 fixture，不是实际场馆坐标。
  return {name:expectedName==='J-flow'?'J-flow':'Unrelated Museum',lat:35.7,lng:139.8,place_id:'offline-jam-fixture',provider:'google_places'};
 }});
 check('dev 优先检索真实地点名，一次定位且保留描述标题',()=>{
  assert.equal(resolved.audit.status,'passed');
  assert.deepEqual(calls,['J-flow']);
  assert.equal(resolved.snapshot.days[0].activities[0].title,jazz.trip_snapshot.days[0].activities[0].title);
  assert.equal(resolved.evidence[0].resolved_by_alias,true);
 });
 check('文档中的请求和响应示例均可执行校验',()=>{
  const doc=fs.readFileSync(path.join(root,'references/trip-snapshot-contract.md'),'utf8');
  const examples=[...doc.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));
  const request=examples.find(x=>x.schema_version?.includes('request@'));
  const response=examples.find(x=>x.schema_version===ACCEPTED_SCHEMA);
  assert.ok(request&&response);assert.equal(normalizeExternalSkillPosterRequest(request,key).generation_features.poi_detail_images,'skip');validatePosterAccepted(response);
 });
}
check('地图排除事件且提交拒绝无实体与悬空服务引用',()=>{
 const x=structuredClone(input);
 x.trip_snapshot.days[0].activities.push({id:'meal',order:2,title:'午餐自行选择',map_role:'event',location_ref:'poi-1'});
 const r=preparePosterRequest(x,key);
 assert.equal(r.body.trip_snapshot.days[0].activities.length,2);
 assert.deepEqual(buildGoogleMapsDays(r.body.trip_snapshot)[0].missing_points,['伏见稻荷大社']);
 for(const patch of [{map_role:'poi',location:{name:'附近的餐厅'}},{location_ref:'missing'},{service_id:'missing'}]){
  const invalid=structuredClone(x);Object.assign(invalid.trip_snapshot.days[0].activities[1],patch);
  assert.throws(()=>preparePosterRequest(invalid,key));
 }
});
{
 const serialized=preparePosterRequest(input,key).serialized;
 const calls=[],progress=[];
 const accepted={schema_version:ACCEPTED_SCHEMA,mode:'poster',job_id:'job_fixture',trip_id:'fixture',status:'accepted',preview_url:'https://example.org/preview/fixture',idempotent_replay:true};
 const result=await submitPosterRequest({base:'https://example.org',serialized,key,pulseMs:2,onProgress:p=>progress.push(p),fetchImpl:async (url,init)=>{
  calls.push(init);
  if(calls.length===1)throw new TypeError('模拟断连');
  await new Promise(resolve=>setTimeout(resolve,12));
  return new Response(JSON.stringify(accepted),{status:200});
 }});
 check('请求断连后同字节同键重试并持续显示真实等待，接受后立即返回',()=>{
  assert.equal(result.attempts,2);assert.deepEqual(result.accepted,accepted);
  assert.equal(calls[0].body,calls[1].body);assert.deepEqual(calls[0].headers,calls[1].headers);
  assert(progress.some(p=>p.stage==='waiting'));assert.equal(progress.at(-1).stage,'accepted');
  assert(!JSON.stringify(progress).includes('/preview/'));
 });
 let calls429=0;
 await assert.rejects(()=>submitPosterRequest({base:'https://example.org',serialized,key,fetchImpl:async ()=>{calls429++;return new Response('{}',{status:429,headers:{'retry-after':'30'}});}}),/HTTP 429.*30/);
 assert.equal(calls429,1);
 await assert.rejects(()=>submitPosterRequest({base:'https://example.org',serialized,key,fetchImpl:async ()=>new Response(JSON.stringify({...accepted,preview_url:'https://example.org/share/fixture'}),{status:202})}),/Preview/);
 passed++;console.log('通过：HTTP 错误不盲重试，错误 Preview 不交付');
}
check('预定记录仅名称必填、可未关联，错误链接和空名称拒绝',()=>{
 const x=structuredClone(input);x.trip_snapshot.services={reservations:[{name:'晚餐预约'}]};
 const result=preparePosterRequest(x,key);
 assert.equal(result.body.trip_snapshot.services.reservations[0].name,'晚餐预约');
 assert.deepEqual(result.body.trip_snapshot.days,x.trip_snapshot.days);
 for(const record of [{name:' '},{name:'票务',url:'javascript:alert(1)'},{name:'展览',time:'25:00'}]){
  const invalid=structuredClone(x);invalid.trip_snapshot.services.reservations=[record];assert.throws(()=>preparePosterRequest(invalid,key));
 }
});
{
 const serialized=preparePosterRequest(input,key).serialized;
 const accepted={schema_version:ACCEPTED_SCHEMA,mode:'poster',job_id:'job_release',trip_id:'release',status:'accepted',preview_url:'https://journione.ai/preview/release',idempotent_replay:false};
 const r=await submitPosterRequest({serialized,key,fetchImpl:async (url,init)=>{
  assert.equal(String(url),'https://journione.ai/api/skill-roadbook');
  assert.equal(init.body,serialized);assert.equal(init.headers['Idempotency-Key'],key);
  assert.equal(init.headers.Authorization,undefined);assert.equal(init.redirect,'error');
  return new Response(JSON.stringify(accepted),{status:202});
 }});
 assert.equal(r.accepted.preview_url,accepted.preview_url);
 passed++;console.log('通过：无域名参数时请求正式域名，保留原文原键且不发送认证凭证');
 let calls=0;
 for(const badUrl of ['https://old.example/preview/release','https://journione.ai.evil.example/preview/release','https://journione.ai:444/preview/release']){
  await assert.rejects(()=>submitPosterRequest({serialized,key,fetchImpl:async()=>{calls++;return new Response(JSON.stringify({...accepted,preview_url:badUrl}),{status:202});}}),/行程链接与请求站点不一致/);
 }
 assert.equal(calls,3);
 const local=await submitPosterRequest({base:'http://127.0.0.1:5174',serialized,key,fetchImpl:async(url)=>{
  assert.equal(String(url),'http://127.0.0.1:5174/api/skill-roadbook');
  return new Response(JSON.stringify({...accepted,preview_url:'http://127.0.0.1:5174/preview/release'}),{status:202});
 }});
 assert.equal(local.accepted.preview_url,'http://127.0.0.1:5174/preview/release');
 passed++;console.log('通过：旧域名、相似域名和错误端口不交付不重试，显式本机测试仍可用');
}
console.log(`完成：${passed} 组离线测试通过；未调用真实生成。`);
