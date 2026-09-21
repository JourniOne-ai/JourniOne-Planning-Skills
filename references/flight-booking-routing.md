# 航班路由与 Booking Skills 交接

## 供应商选择

- “帮我加机票”“查对应日期的国泰往返”等请求进入已授权的航班搜索；国泰等航司是筛选条件，不是选择 TourMind 渠道。先发现可用的 Kiwi `search-flight`（宿主可能显示为 `search_flight`），输入完整即调用；缺输入时只补缺项，不用网页时刻表代替搜索，也不把已给起降时间视为已出票。
- 只有用户明确说已订、只核对航班号/时刻或只整理其票据时，才走记录与时刻核验而不搜索替代。普通搜索中，官网可补核航站楼等缺失字段；网页匹配只能记为静态参考，不能宣称已经完成实时机票查询。读取路由失败时先核对本 Skill 的 `references/` 目录和实际链接，恢复读取后再选渠道；文件名错误不证明 Kiwi 不可用。
- [Booking Skills](https://github.com/tourmind-com/Tourmind-Booking-Skills/tree/main/skills/flight-booking-ai) 提供 `flight-booking-ai` 航班预订依赖；酒店继续由同套件的 `tourmind-booking` 处理。不得把 `bookingskill` 当成真实安装名称。
- 普通航班推荐优先复用可调用的 Kiwi，契约见 [kiwi-flight-search.md](kiwi-flight-search.md)。初始化后台按 [依赖准备](../playbooks/setup-dependencies.md) 尽可能自动安装连接；当前仍缺失、安装失败或待加载时直接采用 `flight-booking-ai` 补充，说明当前来源，继承已授权查询和已确认条件，不增加“是否换供应商”的确认，不把安装 Kiwi 作为用户任务。已有配置但未加载时如实区分，不误报未安装。
- 用户指定 TourMind、要求在对话中预订或明确要求比价时，也可进入 `flight-booking-ai`。用户明确限定仅使用某供应商时尊重限制；Kiwi 查询报错或零结果不等于未安装，不按缺失规则自动换源或改变条件。
- 进入 TourMind 航班查询前先按 [共享 Token 规则](tourmind-shared-token.md) 读取当前 `flight-booking-ai/skill_token.txt`，缺失或为空时读取相邻 `tourmind-booking/skill_token.txt`。已有则复用，不重复索取；只有两处都没有时才显示“为了获取符合你需求的实时个性化价格提供可靠的预定服务，请先认证你的身份”并同轮展示官方获取链接。
- 个人默认入口为 [获取 Token](https://auth.journione.ai)，已明确企业用户使用 [获取企业 Token](https://tourmind.com/user/skill-token)。按共享规则展示链接卡片、按钮或可点击链接，不把安装 Kiwi 作为前置任务；认证尚未完成不影响已有路线与公开酒店查询。
- 只有用户选择航班补充后才收集输入；不重问已有日期、人数和出发地。首次 TourMind 搜索要明确成人、儿童、婴儿各项人数，包括零；行程生成授权不等于机票查询或交易授权。

## 两套请求契约

2026-09-21 核对 TourMind 官方提交 `fbfd8688a3cb6cf6f6f9fcfb0095031f608e3408`，机票 Skill 为 `1.0.8`；运行时以实际安装版本参数指南为准。

| 项目 | TourMind Flight Booking AI | Kiwi MCP |
|---|---|---|
| 传输 | HTTPS POST `https://airxapi.hlzinterface.cn/skill/flight/v1/*` | MCP `https://mcp.kiwi.com` 的 `search-flight` |
| 认证 | 机场查询公开；搜索起使用 `X-Skill-Token`，接受官方 `uk_` / `sk_` | 公开搜索，无凭证 |
| 地点 | 先 `search_airports`；全城用返回 `city_code`，指定机场用 `airport_code` | `flyFrom` / `flyTo` 支持城市、机场名称和代码，工具解析 |
| 日期与类型 | `legs[].departure_date` 为 `YYYY-MM-DD`；`one_way` / `round_trip` / `multi_city` | `departureDate` / `returnDate` 为 `DD/MM/YYYY`；单程或往返 |
| 舱等 | `cabin_class`: `Y` / `C` / `F` | `cabinClass`: `M` / `W` / `C` / `F` |
| 中转 | `flight_type`: `all` / `direct` / `transfer` | `max_sector_stopovers`，自助中转、过夜、换机场独立控制 |
| 其他筛选 | 当前搜索 DTO 无币种、语言、行李数量、航司、价格上限、时段或浮动日期参数 | 提供币种、语言、行李数量、航司、价格、时段、浮动日期等参数 |
| 成功判断 | `code == 0`；HTTP 200 单独不足以证明成功 | 同时检查工具错误和结构化 `error`；零结果与工具失败区分 |
| 报价 | `data.offers`，`total_price` 为十进制字符串，使用返回币种；最多返回最低价 50 条 | `itineraries`，数值 `price`、`priceFormatted`、`bookingUrl`；保留实际结果数量 |
| 行李 | 分航段、旅客类型、件数、公斤数等规则；缺失不等于不含 | `baggage` 是全部旅客包含件数的合计，不能推断公斤数 |
| 后续动作 | `verify_offer` → 用户审阅确认 → `create_booking` → 查询订单 → 单独支付确认 | 原样打开 `bookingUrl` 继续预订；当前 MCP 没有直接创建订单与支付工具 |

不能向 TourMind 发送 Kiwi 的 `currency`、`locale`、`bookingUrl`、日期格式或经济舱代码 `M`；不能向 Kiwi 发送 TourMind Token、`offer_id` 或验价会话。TourMind 未提供的筛选须保留为用户约束，在结果层确认是否满足，不能宣称已由服务端过滤。豪华经济舱等无等价选项时不能默默降舱。

## TourMind 搜索与验价

1. 构造请求前读取安装版本的 `SKILL.md`、`references/parameter_guide.md`、人数规则与展示模板。凭证仅从当前机票 Skill、再从相邻酒店 Skill 读取，首个非空但格式错误时停止；不扫描其他位置。
2. 机场查询必须先成功，地点名称与代码只采用返回值。以用户时区校验每段日期在今日至一年后（含边界），各段日期不得递减；至少 1 成人，婴儿数不超过成人数。请求前确认真实人数，不篡改乘客类型通过校验。
3. 搜索成功后保持 API 价格升序及默认前 10 条展示，遵循官方七列表格和逐航段当地时间、出发航站楼、实际舱等与托运行李规则。不要套用 Kiwi 的“仅一条主选＋其余缓存”展示规则。
4. 选择报价授权验价，不授权下单。报价仅在成功搜索后的 20 分钟内、条件和人数不变时可验价；到期或条件改变先废弃报价与会话，在用户授权后重新查询。不能把旧响应当新搜索结果。
5. 创建订单、订单查询与支付完全交给官方 Skill 的旅客信息、验价、完整审阅和独立支付确认流程。TourMind 搜索不保证返回预订链接；不能把 `offer_id` 当 URL，不能为了生成链接提前创建订单或支付。
6. `20105` 为企业航班预订权限不足，保留凭证并停止受限验价/预订流程，不按凭证失效处理。认证失败、不确定订单和不确定支付按官方恢复流程处理，不自动重试交易。
7. 航班取消、改签、退票、附加服务和手动出票不属于当前 Skill 支持范围；酒店具备取消接口不能推广到机票。

## 回到同一 Travel Journal

- 服务结果回复前按 [机酒衔接](../playbooks/service-to-journal.md#判断标准) 检查收尾，说明当前 Journal 状态和下一动作；酒店与航班独立保留各自成功、失败或待认证状态。供应商结果模板之后仍由主 Skill 完成引导，不能以“首末日已衔接、其他安排不变”结束。
- 统一记录供应商、查询条件、核验时间、原币总价、人数口径、全部航段当地时间与行李。展示币种不同只做带来源和时间的汇率参考，不覆盖支付原币或把换算价当供应商报价。
- 用户选中后同步首末日、机场接驳、住宿晚数和固定活动；未选中为建议，暂选不等于出票，付款链接不等于已付款。
- JourniOne 只保存公开旅行事实和实际返回的可用行动链接；Token、护照、联系资料、`offer_id`、验价会话及支付上下文不进入 Snapshot 或公开页面。内部预订上下文由供应商 Skill 管理。
- 没有预订 URL 时允许 `booking_url` 为空，不因缺 URL 丢掉真实航班，也不编造链接。Kiwi 有返回时保留原样 `bookingUrl`。

## 对比和测试

对比须统一机场、日期、人数年龄分组、实际舱等、直飞条件、行李和总价口径。不能因同一城市或同一天就认为两条报价相同；结果条数也不等于完整库存覆盖。

只读测试流程见 [航班能力对比 Playbook](../playbooks/compare-flight-providers.md)。没有凭证只能核验 TourMind 公共机场接口和请求契约，不报告其票价、验价、订单或支付实测成功。
