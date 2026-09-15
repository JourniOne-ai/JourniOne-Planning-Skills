# TourMind 查询依赖

## 官方来源与已核验版本

- 来源：[Tourmind-Booking-Skills](https://github.com/tourmind-com/Tourmind-Booking-Skills)。
- 2026-09-07 核验默认分支 `main`，版本 `1.0.6`，归档提交 `8d5474752d2c026c10a6a45a580dea2cc02e0c87`。
- 依赖本机 `tourmind-booking/SKILL.md` 及其 `references/parameter_guide.md`；构造请求前读取对应端点参数。它是通过宿主 HTTPS 调用的 Skill，不要求额外安装名为 `tourmind` 的 MCP。
- 后续按官方 Skill 的首次使用或间隔 24 小时版本检查规则执行；检查失败不阻塞酒店查询。核验时公开版本接口返回 `latest_version=1.0.0`、`available=false`，与源码声明不同，不能据此把已安装的 `1.0.6` 降级或声称服务端版本相同。

2026-09-08 发布准备时再次读取官方 main，当前声明为 `1.0.7`。本次没有升级或执行该版本，以下查询交接仍记录已核验的 `1.0.6` 契约；具体调用以实际安装 Skill 的参数指南为准。官方 README 的企业 Token 入门不能成为个人无凭证查询的前置门槛。

## 无凭证查询与认证边界

API 根地址为 `https://api.tourmind.com`，请求使用 HTTPS POST 和 JSON。

| 已有凭证状态 | 查询通道 | 规则 |
|---|---|---|
| `skill_token.txt` 不存在或为空 | 公开个人 ToC | 直接调用 `/skill/toc/*` 查询，不传 `token`、`user_key` 或登录 Header，不索取 Token |
| 已有 `uk_` 凭证 | 个人 ToC | 仅在官方端点接受或要求时传 `user_key`；公开位置、详情、验价和版本检查不传 |
| 已有 `sk_` 凭证 | 企业 ToB | 调用 `/skill/tob/*`，按契约传 `token`；不能把企业接口改成免认证 |

无凭证时可调用 `check_skill_update`、`search_location`、`search_hotels`、`get_hotel_detail`、`query_room_rates`、`batch_query_room_rates` 和 `check_room_availability`。仅因没有 Token 或没有 MCP，不能宣称缺少实时查询能力；宿主可发 HTTPS 且已安装该 Skill 就可查询。

`create_booking`、`query_booking`、`cancel_booking` 和 `pay_order` 仍需对应通道的身份凭证；创建订单、付款与取消另需用户明确授权。无凭证查询时不前置询问个人或企业身份。未知凭证格式、401 与企业权限 403 按官方 Skill 处理，不静默切换通道。切换 ToC/ToB 后，旧报价、`rate_code`、取消政策和库存失效，重新查询与验价；已创建订单始终使用创建通道。

凭证由 TourMind 自己管理，不进入住宿搜索包、Trip Snapshot、请求日志或分享链接。

## 与 Travel Journal 的交接

- 无 Token 不影响按已授权服务查询；日期与入住配置仅在用户接受酒店推荐后收集。
- 多店实时报价使用 `batch_query_room_rates`，每批最多 20 家、客户端最多同时 3 批；单店使用 `query_room_rates`。逐项保留成功、无匹配房型与错误，不能把某项超时解释为无房，也不为替换失败项无条件追加单店查询。
- 每房成人、儿童数与年龄按官方参数传递；多房请求重复同一入住配置。分配不均须先确认，分别构造各配置的搜索包，不发送不存在的 `room_occupancies`，也不暗示一次请求能承载混合配置。
- 搜索预算 `lowest_price`、`highest_price` 必须为 CNY、覆盖全部晚数与全部房间。非 CNY 预算先查当前汇率；每房每晚金额乘汇率、晚数及房间数，全程总预算不重复相乘。此筛选币种不改变 Journal 的展示币种：按 [currency-display-contract.md](currency-display-contract.md) 确定并显式交给酒店展示层，保留供应商原币金额。
- 区域住宿先检查 `search_location.data.regions` 的准确匹配；车站、入口、坐标或明确半径使用 `data.place`，保留实际 `search_scope`，不猜坐标或用全城搜索冒充附近。
- 列表链接来自 `search_hotels.data.web_url`；单店链接来自 `query_room_rates.data.web_url` 或成功批量项的 `data.web_url`。同时保留对应 `web_url_expires_at` 和 `web_url_one_time`；字段缺失就省略，不为补链接索取 Token，不读取旧 `presentation.view_url`。
- 保留完整候选池并按已核验房型排名最多 5 家，Journal 首次仅显示每段首选及该店链接。列表链接和其余候选仅在当前任务缓存，用户要求更多时再展示；遵循 [accommodation-area-and-hotel-handoff.md](accommodation-area-and-hotel-handoff.md)。
