# 活动与预定共享记录契约

## 目的
POI 是地点主体，活动 / 预定是地点的附加信息。行程按地点展示，预订页集中管理同一条记录。

## 数据与识别
演唱会、餐厅预约、展览预约、活动票务或用户提供的预定链接写入 `trip_snapshot.services.reservations[]`，不要再复制到 `days[].activities[]` 作为独立活动节点。场馆、餐厅、博物馆等真实地点仍在 `days[].activities[]` 中，使用稳定 ID、`map_role: poi` 和真实 `location.name`。

只有名称必填；日期、时间、封面、说明、外部链接和关联地点均可省略。没有真实价格、链接或时间时留空，不编造占位。保留原始状态，建议不等于已预订。

```json
{
  "id": "concert-01",
  "name": "Taylor Swift Concert",
  "poi_id": "tokyo-dome",
  "date": "2026-09-12",
  "time": "18:30",
  "description": "用户保留的演出计划，尚未订票。",
  "status": "suggested"
}
```

示例只说明结构，不证明该演出真实存在或当天有场次。`poi_id` 引用已有 POI 的稳定 ID；优先使用明确 ID、场馆名和用户已确认的对应关系，多个同名地点不猜。没有匹配地点时省略 `poi_id` 或使用空字符串，作为未关联记录，用户可以稍后关联。不得为了关联而虚构新 POI 或错误挂到附近地点。已有酒店可用 `hotel:<hotel_stay.id>` 关联酒店胶囊，例如 Spa 或酒店餐厅预约。

- `cover_url`：真实封面图片的 HTTP / HTTPS URL，可选。
- `url`：真实外部预定入口的 HTTP / HTTPS URL，可选；原供应商 URL 不拼接、不替换。
- `date`：YYYY-MM-DD，可选。
- `time`：HH:mm，本地时间，可选。
- `description`：文字说明，可保留入场缓冲、候选条件和核验结果，不再另建一张预定事件卡片。
- `guests`：已有预约人数可原样保留，可选。

## 修改与兼容
新增、改名、改时间、重新关联和删除只操作同一 ID 的记录。删除预定不删除 POI；删除 POI 后保留预定，显示未关联。显式空 `services.reservations: []` 表示全部删除，不能回退历史服务重新生成。

旧 `services.activities`、餐厅服务和引用这些服务的事件由产品兼容迁移；新的 Skill 只写统一 `services.reservations`。不要同时创建两份副本。机票和酒店住宿仍使用原 `services.flights` / `services.hotel_stays`，机场手续、入住胶囊规则保持原契约。
