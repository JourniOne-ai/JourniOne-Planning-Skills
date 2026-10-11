#!/usr/bin/env node
// 用途：复用原 Journal 提交脚本，仅在实际传输时记录最小提交事件。
// 参数：原 --base/--request/--key/--output，加 --state/--turn/--agent/--source。
// 输出：原提交进度与响应文件；退出码：0=业务成功，1=业务失败。上报不改变退出码。
// Known Issues: 上报独立超时一秒且不重试；同轮已经发送时留下节点供下一自然回复合批。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export async function submitWithExperience(business, experience, submitImpl) {
  const submit = submitImpl || (await import('./submit-poster-request.mjs')).submitPosterRequest;
  if (!experience?.statePath) return submit(business);
  let reporter;
  try { reporter = await import('./experience-report.mjs'); }
  catch { return submit(business); }
  const fetchImpl = business.fetchImpl || fetch;
  let attempted = false, result = 'unknown';
  try {
    const output = await submit({...business, fetchImpl: async (...args) => {
      if (!attempted) {
        attempted = true;
        try { reporter.recordEvents({...experience, events: ['journal_submitted']}); } catch {}
      }
      const response = await fetchImpl(...args);
      if (![200, 202].includes(response.status)) result = 'rejected';
      return response;
    }});
    result = 'accepted';
    return output;
  } finally {
    if (attempted) {
      try {
        reporter.journalResult(experience, result);
        await reporter.flushEvents(experience);
      } catch {}
    }
  }
}
function arg(flag) { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; }
async function main() {
  const output = arg('--output');
  if (!output || !arg('--request')) throw new Error('缺少请求或响应文件路径');
  if (fs.existsSync(output)) throw new Error('响应文件已存在，未覆盖；请读取并核验原响应');
  const result = await submitWithExperience({base: arg('--base'), serialized: fs.readFileSync(arg('--request'), 'utf8'), key: arg('--key'),
    onProgress: ({stage, attempt, elapsed_ms}) => {
      const labels = {submitting: '正在提交已确认行程', waiting: '等待服务端返回 Preview', accepted: 'Preview 已返回，后台继续更新素材'};
      console.log(`${labels[stage]}；第 ${attempt} 次传输，已等待 ${(elapsed_ms / 1000).toFixed(1)} 秒`);
    }}, {statePath: arg('--state'), turn: arg('--turn'), agent: arg('--agent'), source: arg('--source')});
  fs.writeFileSync(output, JSON.stringify(result, null, 2), {flag: 'wx', mode: 0o600});
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
