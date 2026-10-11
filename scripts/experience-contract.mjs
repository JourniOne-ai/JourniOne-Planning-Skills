export const SCHEMA = 'journione-experience@1';
export const ENVIRONMENTS = ['dev', 'prod'];
export const EVENTS = ['planning_started', 'itinerary_draft_ready', 'journal_submitted'];
export const MAX_BYTES = 2048;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const agents = ['codex', 'workbuddy', 'doubao', 'claude_code', 'chatgpt', 'claude', 'cursor', 'gemini', 'unknown'];
function requireValue(ok) { if (!ok) throw new Error('上报字段不符合最小数据契约'); }
function object(value, keys) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value));
  requireValue(Object.keys(value).every(key => keys.includes(key)));
}
export function validateBatch(batch, now = Date.now()) {
  object(batch, ['schema_version', 'planning_session_id', 'agent', 'skill_version', 'environment', 'events']);
  requireValue(Buffer.byteLength(JSON.stringify(batch)) <= MAX_BYTES);
  requireValue(batch.schema_version === SCHEMA && UUID.test(batch.planning_session_id));
  requireValue(ENVIRONMENTS.includes(batch.environment));
  requireValue(typeof batch.skill_version === 'string' && /^(unknown|[a-zA-Z0-9][a-zA-Z0-9.+_-]{0,63})$/.test(batch.skill_version));
  object(batch.agent, ['name', 'source', 'version']);
  requireValue(agents.includes(batch.agent.name));
  requireValue(['host_metadata', 'runtime_context', 'unknown'].includes(batch.agent.source));
  requireValue((batch.agent.name === 'unknown') === (batch.agent.source === 'unknown'));
  if ('version' in batch.agent) requireValue(typeof batch.agent.version === 'string' && /^[0-9][a-zA-Z0-9.+_-]{0,31}$/.test(batch.agent.version));
  requireValue(Array.isArray(batch.events) && batch.events.length >= 1 && batch.events.length <= 3);
  const names = new Set(), ids = new Set();
  for (const event of batch.events) {
    object(event, ['event_id', 'name', 'occurred_at', 'time_source', 'result']);
    requireValue(UUID.test(event.event_id) && EVENTS.includes(event.name));
    requireValue(!names.has(event.name) && !ids.has(event.event_id));
    names.add(event.name); ids.add(event.event_id);
    const at = Date.parse(event.occurred_at);
    requireValue(typeof event.occurred_at === 'string' && Number.isFinite(at) && new Date(at).toISOString() === event.occurred_at);
    requireValue(at <= now + 300_000 && at >= now - 30 * 86400_000);
    if ('time_source' in event) requireValue(event.time_source === 'observed');
    if ('result' in event) requireValue(event.name === 'journal_submitted' && ['accepted', 'rejected', 'unknown'].includes(event.result));
  }
  return batch;
}
export function agentInfo(name = 'unknown', source = 'unknown') {
  return agents.includes(name) && name !== 'unknown' && ['host_metadata', 'runtime_context'].includes(source)
    ? {name, source} : {name: 'unknown', source: 'unknown'};
}
