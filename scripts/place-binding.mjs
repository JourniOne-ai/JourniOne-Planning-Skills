// 地点身份与时间线事件共用的确定性判定；显式契约优先，旧数据按已有分类兼容。
export function isTimelineOnly(activity = {}) {
  if (activity.map_role === "event") return true;
  if (activity.map_role === "poi") return false;
  if (activity.category_detail === "area_dining") return true;
  const title = String(activity.title || activity.name || "").trim();
  if (/^(?:自由活动|自由时间|自由用餐|自行用餐|早餐|午餐|晚餐|休息|待定餐厅)$/.test(title)) return true;
  if (/^(?:办理值机|值机|安检|登机|取行李|提取行李|领取行李|行李提取|check[ -]?in|baggage claim|boarding)(?:\b|[，、：\s]|$)/i.test(title)) return true;
  return false;
}

export function validatePlaceBindings(days = [], services = {}) {
  const activities = days.flatMap((day) => day.activities || []);
  const byId = new Map(activities.map((activity) => [activity.id, activity]));
  const serviceIds = new Set(Object.values(services).filter(Array.isArray).flat().map((s) => s.id || s.service_id));
  const fail = (message) => { throw Object.assign(new Error(message), { code: "invalid_place_binding", status: 422 }); };
  for (const activity of activities) {
    if (activity.map_role !== undefined && !["poi", "event"].includes(activity.map_role)) fail(`活动 ${activity.id} 的 map_role 必须为 poi 或 event。`);
    if (activity.map_role === "poi") {
      const name = String(activity.location?.name || "").trim();
      if (!name || /^(?:待定|待定餐厅|餐厅|酒店|早餐|午餐|晚餐|自由活动|值机|降落)$/.test(name) || /(?:附近|周边|一带)的?(?:餐厅|酒店)$/.test(name)) fail(`地点 ${activity.id} 需要明确的 location.name，未定安排请标为 event。`);
    }
    if (activity.location_ref !== undefined) {
      const target = byId.get(activity.location_ref);
      if (activity.map_role !== "event" || !target || target === activity || isTimelineOnly(target)) fail(`事件 ${activity.id} 的 location_ref 必须引用已有地点。`);
    }
    if (activity.service_id !== undefined && !serviceIds.has(activity.service_id)) fail(`活动 ${activity.id} 引用了不存在的服务。`);
  }
}
