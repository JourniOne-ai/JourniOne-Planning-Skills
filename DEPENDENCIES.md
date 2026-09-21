# 必需依赖与运行能力

对用户统一表述：

- 需要安装 **TourMind 酒店与机票一站式预订技能（Booking Skills）**，作为主要依赖。
- 可按需安装更多机票、酒店比价连接器及工具，例如 **Kiwi.com 航班搜索（MCP）**。

内部尽可能自动准备 Kiwi 等适用机酒比价连接器，对用户不强调安装过程。航班优先使用可调用的 Kiwi；缺失、安装未完成或待加载时由 TourMind 机票能力补充，不要求用户先完成 Kiwi 安装。TourMind 航班搜索先复用机票或酒店 Skill 已有的共享 Token；两处都没有时，按 [共享 Token 规则](references/tourmind-shared-token.md) 展示实时个性化价格提示与获取链接，不增加 Kiwi 安装要求。酒店查询同样检查双向共享 Token，有则复用，没有仍直接公开查询。

| 能力 | 提供方 | 使用条件 |
|---|---|---|
| 创建旅行日志 | [JourniOne](https://journione.ai/) | HTTPS 可达，无需用户登录或 Token |
| 酒店查询与预订 | [TourMind Booking Skills](https://github.com/tourmind-com/Tourmind-Booking-Skills) 中的 `tourmind-booking` | 必需安装；公开酒店查询免登录，订单操作需认证和明确授权 |
| 航班查询与预订 | 同一仓库中的 `flight-booking-ai` | 必需安装；机场查询公开，航班搜索、验价、订单和支付需 Token |
| 可选航班搜索与比价 | [Kiwi.com MCP](https://mcp.kiwi.com) | 可选连接；已就绪时用于默认普通航班推荐，免登录查询并跳转预订 |
| 地点与逐日路线 | Google Maps | 使用已核实坐标构造地图链接；导航需要联网 |
| 地点事实与资料导入 | AI 客户端 | 联网搜索、文档读取、必要时 OCR 或图片理解 |

Booking Skills 是包含酒店与机票两个 Skill 的套件，并非名为 `bookingskill` 的单一入口。本包不捆绑第三方实现；从官方仓库分别安装 `skills/tourmind-booking` 和 `skills/flight-booking-ai`，保留各自完整配套目录。不能再将仓库根目录直接安装为酒店 Skill。

安装或首次初始化时，按 [安装说明](INSTALL.md#准备酒店与航班能力) 与 [依赖初始化](playbooks/setup-dependencies.md) 补齐两项 Skill。已有完整、兼容版本直接复用；旧版升级保留凭证及本地修改。两项可被宿主发现才算安装完成，安装完成、认证已配置、实时查询成功分别记录。初始化不要求 Token、不搜机酒、不收集日期人数，也不下单或创建行程。

2026-09-21 核对官方提交 `fbfd8688a3cb6cf6f6f9fcfb0095031f608e3408`：两个 Skill 的版本均为 `1.0.8`。该记录表示源码契约核验，不表示本机安装或订单支付实测通过。调用前读取实际安装版本的参数指南；酒店与航班认证方式不同，见 [酒店依赖](references/tourmind-query-dependency.md) 和 [航班路由](references/flight-booking-routing.md)。

Kiwi 为独立的公开搜索能力，已有连接保留。按 [航班路由](references/flight-booking-routing.md) 选择来源，不静默切换供应商，不共享报价、会话、凭证或订单。第三方 URL 保持原样，酒店结果页仅允许官方契约规定的语言路径替换。
