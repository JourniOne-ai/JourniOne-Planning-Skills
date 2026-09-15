#!/usr/bin/env node
// 用途：提交已冻结的请求，输出真实等待进度并保存经过校验的 Preview 响应。
// 参数：--request 请求文件 --key 原幂等键 --output 新响应文件；可选 --base 显式测试目标。
// 输出：中文安全进度；响应文件权限 0600。退出码：0=成功，1=失败。
// Known Issues: 仅传输失败最多同键重试一次；不等待后台素材，不替代真实页面验收；响应域名与请求环境不同则拒绝交付，不改写链接。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePosterAccepted, REQUEST_SCHEMA} from './prepare-poster-request.mjs';

export const DEFAULT_BASE_URL = 'https://journione.ai';

export async function submitPosterRequest({base=DEFAULT_BASE_URL, serialized, key, fetchImpl=fetch, onProgress=()=>{}, timeoutMs=25000, pulseMs=10000}) {
  const url = new URL(base);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname))) || url.username || url.password || url.search || url.hash || !['','/'].includes(url.pathname)) throw new Error('目标必须为已确认的 HTTPS 站点根地址或本机开发地址');
  if (typeof key !== 'string' || key.trim() !== key || key.length<8 || key.length>160 || /[\r\n]/.test(key)) throw new Error('幂等键格式错误');
  if (JSON.parse(serialized).schema_version !== REQUEST_SCHEMA) throw new Error('请求 schema 错误');
  const started = Date.now();
  for (let attempt=1; attempt<=2; attempt++) {
    onProgress({stage:'submitting',attempt,elapsed_ms:Date.now()-started});
    const timer=setInterval(()=>onProgress({stage:'waiting',attempt,elapsed_ms:Date.now()-started}),pulseMs);
    let response, raw;
    try {
      response=await fetchImpl(new URL('/api/skill-roadbook',url), {method:'POST',redirect:'error',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:serialized,signal:AbortSignal.timeout(timeoutMs)});
      raw=await response.text();
    } catch (error) {
      if (attempt===2) throw new Error('提交连接中断或超时；请求与原幂等键已保留，尚不能确认是否已创建');
      continue;
    } finally { clearInterval(timer); }
    if (![200,202].includes(response.status)) {
      const retryAfter=response.headers.get('retry-after');
      throw new Error(`生成接口返回 HTTP ${response.status}${retryAfter?`；Retry-After=${retryAfter}`:''}；保留请求，按对应错误处理`);
    }
    let accepted;
    try { accepted=JSON.parse(raw); } catch { throw new Error('生成接口未返回合法 JSON，不能交付 Preview'); }
    validatePosterAccepted(accepted,response.status);
    if (new URL(accepted.preview_url).origin !== url.origin) throw new Error('行程链接与请求站点不一致；请核对服务端公开链接配置，不能改写链接或重新创建行程');
    const elapsed_ms=Date.now()-started;
    onProgress({stage:'accepted',attempt,elapsed_ms});
    return {accepted,http_status:response.status,elapsed_ms,attempts:attempt};
  }
}
function arg(name){const at=process.argv.indexOf(name);return at<0?'':process.argv[at+1];}
async function main(){
  const output=arg('--output');
  if(!output || !arg('--request'))throw new Error('缺少请求或响应文件路径');
  if(fs.existsSync(output))throw new Error('响应文件已存在，未覆盖；请读取并核验原响应');
  const result=await submitPosterRequest({base:arg('--base') || undefined,serialized:fs.readFileSync(arg('--request'),'utf8'),key:arg('--key'),onProgress:({stage,attempt,elapsed_ms})=>{
    const labels={submitting:'正在整理已确认的行程',waiting:'正在准备你的旅行日志链接',accepted:'旅行日志链接已就绪，图片和地图将在页面继续更新'};
    console.log(`${labels[stage]}；第 ${attempt} 次传输，已等待 ${(elapsed_ms/1000).toFixed(1)} 秒`);
  }});
  fs.writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
