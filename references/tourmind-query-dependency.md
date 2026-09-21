# TourMind 查询依赖

## 官方来源与已核验版本

- 来源：[TourMind Booking Skills](https://github.com/tourmind-com/Tourmind-Booking-Skills)；酒店入口为 `skills/tourmind-booking`，机票为 `skills/flight-booking-ai`。
- 2026-09-21 核对官方提交 `fbfd8688a3cb6cf6f6f9fcfb0095031f608e3408`，两个入口的 `metadata.version` 均为 `1.0.8`；这表示源码核验，不代表本机安装或订单验收。
- 酒店调用前读取已安装 `tourmind-booking/SKILL.md` 及 `references/parameter_guide.md`，通过 HTTPS 使用，无需额外酒店 MCP。
- 酒店查询和预订前均按 [共享 Token 规则](tourmind-shared-token.md) 静默检查：先酒店 Skill 的 `skill_token.txt`，缺失或为空时查相邻 `flight-booking-ai/skill_token.txt`；有则直接复用，不再向用户索取。两处都没有时酒店查询直接走公开通道，不能为了查询要求先获取 Token。共享凭证不代表两个 API 的认证字段相同。
- 更新检查遵循实际 Skill 的首次使用或相隔 24 小时规则；版本服务与源码不同步时不得自动降级。
- 航班另见 [航班路由](flight-booking-routing.md)，不能把酒店免登录查询规则套到机票搜索。

## 无凭证查询与认证边界

API 根地址为 `https://api.tourmind.com`，请求使用 HTTPS POST 和 JSON。

| 已有凭证状态 | 查询通道 | 规则 |
|---|---|---|
| 酒店和机票两处 `skill_token.txt` 均不存在或为空 | 公开个人 ToC | 直接调用 `/skill/toc/*` 查询，不传 `token`、`user_key` 或登录 Header，不索取 Token |
| 已有 `uk_` 凭证 | 个人 ToC | 仅在官方端点接受或要求时传 `user_key`；公开位置、详情、验价和版本检查不传 |
| 已有 `sk_` 凭证 | 企业 ToB | 调用 `/skill/tob/*`，按契约传 `token`；不能把企业接口改成免认证 |

无凭证时可调用 `check_skill_update`、`search_location`、`search_hotels`、`get_hotel_detail`、`query_room_rates`、`batch_query_room_rates` 和 `check_room_availability`。仅因没有 Token 或没有 MCP，不能宣称缺少实时查询能力；宿主可发 HTTPS 且已安装该 Skill 就可查询。

`create_booking`、`query_booking`、`cancel_booking` 和 `pay_order` 仍需对应通道的身份凭证；操作前再次检查酒店和机票共享 Token，已有则复用，两处都没有时才进入酒店授权流程。创建订单、付款与取消另需用户明确授权。无凭证查询时不前置询问个人或企业身份。未知凭证格式、401 与企业权限 403 按官方 Skill 处理，不静默切换通道。切换 ToC/ToB 后，旧报价、`rate_code`、取消政策和库存失效，重新查询与验价；已创建订单始终使用创建通道。

凭证由 TourMind 自己管理，不进入住宿搜索包、Trip Snapshot、请求日志或分享链接。

## 与 Travel Journal 的交接

- 无 Token 不影响已授权的公开酒店查询；日期与入住配置仅在用户接受酒店推荐后收集。
- 多店实时报价使用 `batch_query_room_rates`，每批最多 20 家、客户端最多同时 3 批；单店使用 `query_room_rates`。逐项保留成功、无匹配房型与错误，不能把某项超时解释为无房，也不为替换失败项无条件追加单店查询。
- 每房成人、儿童数与年龄按官方参数传递；多房请求重复同一入住配置。分配不均须先确认，分别构造各配置的搜索包，不发送不存在的 `room_occupancies`，也不暗示一次请求能承载混合配置。
- 搜索预算 `lowest_price`、`highest_price` 必须为 CNY、覆盖全部晚数与全部房间。非 CNY 预算先查当前汇率；每房每晚金额乘汇率、晚数及房间数，全程总预算不重复相乘。此筛选币种不改变 Journal 的展示币种：按 [currency-display-contract.md](currency-display-contract.md) 确定并显式交给酒店展示层，保留供应商原币金额。
- 区域住宿先检查 `search_location.data.regions` 的准确匹配；车站、入口、坐标或明确半径使用 `data.place`，保留实际 `search_scope`，不猜坐标或用全城搜索冒充附近。
- 列表链接来自 `search_hotels.data.web_url`；单店链接来自 `query_room_rates.data.web_url` 或成功批量项的 `data.web_url`。同时保留对应 `web_url_expires_at` 和 `web_url_one_time`；字段缺失就省略，不为补链接索取 Token，不读取旧 `presentation.view_url`。
- `1.0.8` 允许且要求按回复语言替换返回酒店链接中 `/zh-CN/skills/access` 的语言段：中文 `zh-CN`、英文 `en-US`、日文 `ja`、韩文 `ko`、西文 `es`、阿文 `ar`、其余 `en-US`。仅此语言段可变，其余域名、路径、查询参数、完整片段及票据必须原样保留；预期语言段不存在则不改。这不适用于航班预订或支付 URL。
- 保留完整候选池并按已核验房型排名最多 5 家，Journal 首次仅显示每段首选及该店链接。列表链接和其余候选仅在当前任务缓存，用户要求更多时再展示；遵循 [accommodation-area-and-hotel-handoff.md](accommodation-area-and-hotel-handoff.md)。
