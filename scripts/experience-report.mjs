#!/usr/bin/env node
// 用途：将三个实际规划节点去重、合批并尽力上报，不改变业务流程。
// 参数：--state 本地状态 --turn 本轮标识 --events 逗号分隔节点 --agent 宿主 --source 来源 --flush；--off/--on 设置当前用户偏好。
// 输出：默认静默，显式更改偏好时给出中文结果；退出码：0=继续业务（含跳过或上报失败），1=偏好写入失败。
// Known Issues: 一秒超时且不重试，允许漏报；崩溃遗留锁时跳过，不新建身份补报。
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {SCHEMA, EVENTS, ENVIRONMENTS, UUID, MAX_BYTES, validateBatch, agentInfo} from './experience-contract.mjs';

const configPath = fileURLToPath(new URL('./experience-config.json', import.meta.url));
const preferencePath = path.join(os.homedir(), '.config', 'journione', 'travel-journal-creator', 'experience-preferences.json');
function validPreference(value) {
  return value && ['on', 'off'].includes(value.experience_reporting) &&
    typeof value.disabled_at === 'string' &&
    new Date(value.disabled_at).toISOString() === value.disabled_at;
}
export function readConfig() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  try {
    const preference = JSON.parse(fs.readFileSync(preferencePath, 'utf8'));
    if (validPreference(preference)) return {...config,
      experience_reporting: preference.experience_reporting, disabled_at: preference.disabled_at};
    return {...config, experience_reporting: 'off'};
  } catch (error) {
    if (error.code !== 'ENOENT') return {...config, experience_reporting: 'off'};
  }
  return config;
}
function allowedEndpoint(value, environment) {
  const endpoints = {
    dev: 'https://flipmind-2503271672.asia-northeast1.run.app/api/skill-experience',
    prod: 'https://journione.ai/api/skill-experience',
  };
  const url = new URL(value);
  return !url.username && !url.password && !url.search && !url.hash &&
    url.pathname === '/api/skill-experience' &&
    (url.href === endpoints[environment] ||
      (url.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)));
}
function save(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value), {mode: 0o600, flag: 'wx'});
    fs.renameSync(temporary, file);
  } finally { fs.rmSync(temporary, {force: true}); }
}
function stateOperation(options, operation) {
  const {statePath, config = readConfig()} = options;
  if (!statePath || !ENVIRONMENTS.includes(config.environment)) return {status: 'skipped'};
  const file = path.resolve(statePath), lock = `${file}.lock`;
  fs.mkdirSync(path.dirname(file), {recursive: true, mode: 0o700});
  try { fs.mkdirSync(lock, {mode: 0o700}); } catch { return {status: 'skipped'}; }
  try {
    let state;
    if (fs.existsSync(file)) {
      if (fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size > 16_384) throw new Error('状态文件无效');
      state = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (state.schema !== 'experience-state@1' || !UUID.test(state.session) ||
        !Array.isArray(state.events) || state.events.length > 3 || !Array.isArray(state.turns) || state.turns.length > 3) throw new Error('状态文件无效');
    } else state = {schema: 'experience-state@1', session: randomUUID(), events: [], turns: []};
    const disabled = config.experience_reporting !== 'on' || process.env.JOURNIONE_EXPERIENCE_REPORTING === 'off';
    for (const item of state.events) {
      if (disabled || (config.disabled_at && item.event.occurred_at <= config.disabled_at)) item.attempted = true;
    }
    if (disabled) { state.events = state.events.map(item => ({...item, attempted: true})); save(file, state); return {status: 'disabled'}; }
    const result = operation(state, config);
    save(file, state);
    return result;
  } finally { fs.rmdirSync(lock); }
}

export function recordEvents(options = {}) {
  try {
    return stateOperation(options, (state) => {
      for (const name of options.events || []) {
        if (!EVENTS.includes(name)) throw new Error('节点不支持');
        if (state.events.some(item => item.event.name === name)) continue;
        const event = {event_id: randomUUID(), name, occurred_at: new Date().toISOString(), time_source: 'observed'};
        if (name === 'journal_submitted') event.result = 'unknown';
        state.events.push({event, attempted: false});
      }
      return {status: 'recorded'};
    });
  } catch { return {status: 'skipped'}; }
}
export function journalResult(options, result) {
  try { return stateOperation(options, state => {
    const item = state.events.find(item => item.event.name === 'journal_submitted' && !item.attempted);
    if (item && ['accepted', 'rejected', 'unknown'].includes(result)) item.event.result = result;
    return {status: 'recorded'};
  }); } catch { return {status: 'skipped'}; }
}
export async function flushEvents(options = {}) {
  let prepared;
  try {
    prepared = stateOperation(options, (state, config) => {
      if (!options.turn || typeof options.turn !== 'string' || options.turn.length > 128 || state.turns.includes(options.turn)) return {status: 'skipped'};
      const items = state.events.filter(item => !item.attempted);
      if (!items.length || state.turns.length >= 3 || !allowedEndpoint(config.endpoint, config.environment)) return {status: 'skipped'};
      const batch = {schema_version: SCHEMA, planning_session_id: state.session,
        agent: agentInfo(options.agent, options.source), skill_version: config.skill_version || 'unknown',
        environment: config.environment, events: items.map(item => item.event)};
      // 过期/损坏事件不补报，也不放进有效批次。
      items.forEach(item => { item.attempted = true; });
      state.turns.push(options.turn);
      try { validateBatch(batch); } catch { return {status: 'skipped'}; }
      const body = JSON.stringify(batch);
      if (Buffer.byteLength(body) > MAX_BYTES) return {status: 'skipped'};
      return {endpoint: config.endpoint, body};
    });
  } catch { return {status: 'skipped'}; }
  if (!prepared?.endpoint) return prepared || {status: 'skipped'};
  // 在发送前持久化已尝试状态；响应丢失和跨轮恢复均不重发。
  const controller = new AbortController();
  let timer;
  try {
    const operation = (async () => {
      const response = await (options.fetchImpl || fetch)(prepared.endpoint, {method: 'POST',
        redirect: 'error', headers: {'Content-Type': 'application/json'}, body: prepared.body, signal: controller.signal});
      if (response.body) await response.body.cancel();
      return {status: response.status === 202 ? 'accepted' : 'unavailable'};
    })();
    return await Promise.race([operation, new Promise(resolve => {
      timer = setTimeout(() => { controller.abort(); resolve({status: 'timeout'}); }, 1000);
    })]);
  } catch { return {status: 'unavailable'}; }
  finally { clearTimeout(timer); }
}

export function disableReporting() {
  fs.mkdirSync(path.dirname(preferencePath), {recursive: true, mode: 0o700});
  save(preferencePath, {experience_reporting: 'off', disabled_at: new Date().toISOString()});
}
export function enableReporting() {
  let preference;
  try { preference = JSON.parse(fs.readFileSync(preferencePath, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (!validPreference(preference)) throw new Error('关闭设置无效，未重新启用');
  if (preference.experience_reporting === 'off') {
    save(preferencePath, {...preference, experience_reporting: 'on'});
  }
}
function arg(flag) { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; }
async function main() {
  if (process.argv.includes('--off') && process.argv.includes('--on')) throw new Error('不能同时开启和关闭上报');
  if (process.argv.includes('--off')) { disableReporting(); console.log('已关闭服务体验上报；此前尚未发送的事件不会再发送。'); return; }
  if (process.argv.includes('--on')) { enableReporting(); console.log('已重新启用服务体验上报；关闭前的事件不会补发。'); return; }
  const options = {statePath: arg('--state'), turn: arg('--turn'), agent: arg('--agent'), source: arg('--source'),
    events: (arg('--events') || '').split(',').filter(Boolean)};
  if (options.events.length) recordEvents(options);
  if (process.argv.includes('--flush')) await flushEvents(options);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => {
  if (process.argv.includes('--off') || process.argv.includes('--on')) {
    console.error('上报偏好写入失败；本轮请停止上报并保留用户关闭选择。'); process.exitCode = 1;
  }
});
