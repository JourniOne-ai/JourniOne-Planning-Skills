# 活动分类与视觉选择契约

## 目的

让同一份确认行程同时服务完整路书、Card Visual 和 Trip Visual。正式地点及非预定类时间线安排传入 `days[].activities[]`，票务和预约写入 `services.reservations[]`（见 [活动与预定契约](activity-bookings.md)），不创建独立活动节点；分类只决定视觉是否选用，不能删除酒店、机场、接驳或普通餐次等旅程真值。

## 地点与事件

`map_role: poi` 表示路线采用或具体推荐的具名实体，不要求用户逐店确认或已预订。`location.name` 是可检索的真实名称，精确地址、当地名、已有 place_id 和可靠坐标原样保留。不能传“附近的餐厅”“值机”“降落”等作为实体名。

`map_role: event` 表示无需独立地点的时间线安排，保留 title/time/description，不检索、不计地图缺口、不生成独立视觉点。值机、降落手续与取行李可用 `location_ref` 指向同一个机场 POI；入住退房、接驳过程及下述餐饮例外可作为事件。餐厅尚未查到是规划缺口，不能为省略研究而把普通用餐全部改成 event。`service_id` 关联同一 Snapshot 的机酒服务，不复制报价为另一条独立服务。引用不存在时提交校验失败。旧请求缺少 map_role 时按已有分类兼容，新的 Skill 必须显式填写。

机场角色由实际服务航段和显式 category_detail 确定；单程只包含实际出发与抵达机场，不人为补返程。已经选定的酒店与航班在 services 保留原始 provider 字段、链接、价格口径和状态；后续修改地点或问餐厅不能重写服务。

## 具体日程的活动与餐饮落点

先区分体验类型，再判断是否需要地图实体；`category` 与 `map_role` 不是同一维度。以下规则从首次展开某天具体时间线起适用，Overview 和尚未展开的天次可先写主线。

- **餐饮要有具体店铺。** 已安排的早餐、午餐、晚餐、下午茶、咖啡、酒吧或“喝点东西坐坐”，默认找一家适合时段、预算、饮食限制及动线的真实店铺，写成“时间 · 午餐／下午茶／晚餐｜店名（必要时分店）”。无需名店或专程体验才值得推荐；不能只写“新宿午餐”“附近晚餐”“喝点东西”。不额外凑未安排的三餐，也不让用户逐餐选店。
- **店铺可检索、可定位。** 查询并打开具体来源核实店名、分店、地址或明确位置，以及该时段提供的餐饮；保留当地名、来源链接与已有地址。连锁品牌名、城市名或餐饮品类不能代替分店 POI，不用车站坐标冒充餐厅。时间线链接到已核验店铺/地图页，地址可放详情，不在每行展开长地址。地点已明确但坐标暂缺时仍为 poi 并保留地图缺口，不猜坐标、不伪装成 event。
- **活动可落在公园、街道或街区。** “新宿御苑慢走”“吉祥寺中道通逛小店”这类可定位的活动可保留，不必改成购票项目或商店巡礼。“吉祥寺逛街”可作为街区游览，但需补明确可检索的商店街、游览范围或入口锚点；只写“附近散步”“自由逛逛”不能冒充已定位活动。公园和街区不要求虚构展览或节目；展会、演出、博物馆继续按自身内容核实规则。
- **餐饮例外按实际需要保留。** 便利店补给、赶车快餐、机上餐、已含酒店早餐、自备餐食或用户明确想临时决定，可保留用餐事件；已有具体店铺或酒店时引用实际地点。不把所有普通餐次改名“快速解决”来绕过选店。用户没主动选餐厅、没有美食偏好或预算未知，都不等于要求不推荐。
- **自由时段也要说明在哪里、做什么。** 时间线采用“建议时间＋明确地点或范围＋具体可做的事”；不能单独写“自由活动”“自由休息”“晚餐后自由安排”。自由逛街给可检索的街道/商店街和一两种顺手可做的事，例如逛小店、看看橱窗，不要求逐店打卡；接着有演出或交通时说清何时收尾、往哪里走，不把自由时间排成密集任务。
- **休息可以是事件，但位置与动作不能省。** 回已选住处午睡、在已核实公园的休息区域坐坐，都说明所依附地点及如何休息，复用已有 POI 或服务引用，不必另造“休息”地图点。酒店尚未确定或未到可入住时间时，不默认用户能进房间午睡；可安排在已核实的顺路地点休息，或把返回住处明确写成条件式建议，不为休息强迫查酒店。座椅、休息区和开放条件未核实不写成保证可用。“喝东西休息”应找具体咖啡馆等，不能改叫自由休息后省略店铺。
- **地点明确不等于强迫消费。** 自由休息可就地坐坐、放空，不必塞咖啡或购物；已有明确地点与动作就足够。用户明确要求这一段完全自行决定时保留其意愿，标为用户自留时段，不擅自指定活动，也不将其当作规划遗漏。
- **同场活动与用餐要核实两种用途。** 演出场地名称明确不等于提供晚餐；只有核实菜单和供餐时段后才可把“入场＋晚餐”安排在同处，否则另找顺路餐厅。按需要拆时间段、复用同一真实地点身份，不虚构第二个 POI 或重复算移动时间。
- **逐批落实，不最后补店。** 当前展开的 1–2 天先补齐实际餐饮时段的首选与活动地点，足够匹配即可停止扩展，再继续后续天次。暂时查不到时回显已完成部分与具体缺口，不称该天完整；可靠候选仍缺或用户明确只要现有稿时如实保留待定项，不编造店名、不隐瞒缺口，也不无限搜索。

具名餐饮使用 `dining / specific_restaurant / poi`，包括咖啡馆、茶室和酒吧；可定位游览使用 `activity_shopping / activity或shopping / poi`。便利用餐或用户自主决定等例外继续使用现有 `dining / area_dining / event`，无需新增枚举。已确定的活动与餐饮 POI 一起进入地点核验、Snapshot 与既有逐日地图流程；保留普通事件但不伪造地图点。

## 活动字段

每个 `days[].activities[]` 节点必须包含：

```json
{
  "category": "flight",
  "category_detail": "entry_airport",
  "visual_targets": ["card_visual"],
  "airport_context": {
    "role": "entry_airport",
    "code": "ICN",
    "name": "仁川国际机场",
    "flight_service_id": "flight-outbound"
  }
}
```

- `category`：稳定的大类；
- `category_detail`：该大类下的具体动作；
- `visual_targets`：由分类规则派生，只允许 `card_visual`、`trip_visual`；空数组表示完整行程保留但两个视觉都不选；
- `airport_context`：只用于机票相关节点，机场名称与代码必须来自关联的 `services.flights[]`，不得凭目的地猜测。

## 分类表

| `category` | `category_detail` | 例子 |
| --- | --- | --- |
| `flight` | `departure_airport` | 出发机场：香港国际机场（HKG） |
| `flight` | `entry_airport` | 入境机场：仁川国际机场（ICN） |
| `flight` | `exit_airport` | 离境机场：金海国际机场（PUS） |
| `flight` | `return_airport` | 返回机场：香港国际机场（HKG） |
| `intercity_transport` | `ktx` 或 `rail` | KTX 前往釜山 |
| `transfer_transport` | `airport_express` 或 `local_transfer` | 机场快线 AREX 前往首尔站 |
| `hotel` | `check_in`、`rest`、`check_out` | 入住、午休、退房 |
| `activity_shopping` | `activity` 或 `shopping` | 景福宫、南浦洞购物 |
| `dining` | `specific_restaurant` | 具名餐厅、咖啡馆、茶室或酒吧，必要时含分店 |
| `dining` | `area_dining` | 便利店补给、赶车简餐或用户明确自行决定的用餐事件 |
| `other` | `other` | 不属于以上类型但仍需保留的正式节点 |

显式机场 poi 同样解析为真实 POI 对象，检索以机场实体名为准，不强加当天城市，也不把远端出发机场作为城市内地点的搜索中心。机场保留在行程与 Journal 示意中，城内地图连线仍仅使用游玩地点；手续事件只引用机场，不重复解析。

## 机场角色

往返行程按 `services.flights[]` 的真实航段确定四个机场角色：

1. 第一段主选航班的起点 → `departure_airport`；
2. 第一段主选航班的终点 → `entry_airport`；
3. 最后一段返程航班的起点 → `exit_airport`；
4. 最后一段返程航班的终点 → `return_airport`。

Day 1 要明确写出出发机场和入境机场；最后一天要明确写出离境机场和返回机场。多程或开口航线不得把入境机场复制成离境机场；以实际首尾航段为准。航班未确定时，节点与服务同时标记 `needs_input` 或“建议航班 / 待确认”，不要编造机场。

## 视觉选择

所有活动完整传输，然后分别选择：

- Card Visual：非事件的 `flight`、`intercity_transport`、`activity_shopping`、`specific_restaurant`；
- Trip Visual：`activity_shopping`、`transfer_transport`、仅 `specific_restaurant` 的 `dining`；
- `hotel` 不进入 Card Visual 或 Trip Visual，但仍完整保留在 Snapshot、Services 和完整路书；
- `area_dining` 的餐饮例外事件不进入 Card Visual、Trip Visual 或地图；历史未定餐次兼容此分类，但新规划应按落点规则选店，不能把餐饮街区当餐厅；具体区域游览另有明确区域实体时使用 poi；
- `intercity_transport` 进入 Card Visual，不进入 Trip Visual；机场快线等 `transfer_transport` 进入 Trip Visual，不进入 Card Visual。

映射成 Brief 后，`route.nodes` 保留全部活动；`card_visual.nodes` 与 `trip_visual.nodes` 是各自重新编号的派生清单，并保留 `source_index` 与 `source_activity_id` 以便回写原活动。

## 验证

- 四个机场节点的名称、代码和 `flight_service_id` 与 `services.flights[]` 一致；
- `route.nodes` 数量与全部正式活动数量一致；
- Card Visual 与 Trip Visual 的节点集合符合上表；
- 酒店节点没有因为视觉筛选从 Snapshot 或 Services 消失；
- 具名分店按 `specific_restaurant / poi` 处理；普通“附近的餐厅”是需要补店的规划缺口，不能因转成 event 就认定完成；餐饮例外可按 `area_dining / event` 保留。
- 截图类型回归：“新宿午餐”“晚餐”“喝点东西”需查店；“新宿御苑慢走”“吉祥寺中道通逛小店”保留活动 POI；自由休息须说明依附地点与动作后才可作为事件；演出场地兼用餐需核实菜单。
