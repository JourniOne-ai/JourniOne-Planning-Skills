# 必需依赖与运行能力

| 能力 | 提供方 | 使用条件 |
|---|---|---|
| 创建旅行日志 | [JourniOne](https://journione.ai/) | HTTPS 可达，无需用户登录或 Token |
| 酒店查询 | [TourMind Booking Skill](https://github.com/tourmind-com/Tourmind-Booking-Skills) | 必需安装；初始化时自动补齐，按实际官方契约查询 |
| 航班查询 | [Kiwi.com MCP](https://mcp.kiwi.com) | 必需连接；初始化时自动配置并验证 `search-flight` 可被发现 |
| 地点与逐日路线 | Google Maps | 使用已核实坐标构造地图链接；导航需要联网 |
| 地点事实与资料导入 | AI 客户端 | 联网搜索、文档读取、必要时 OCR 或图片理解 |

本包不捆绑 TourMind 或 Kiwi 的实现，两项均为必需安装依赖。安装或首次初始化时，由宿主 Agent 按 [安装说明](INSTALL.md#准备酒店与航班能力) 自动补齐并验证；已有能力直接复用，不增加是否安装的问答。只有必须授权、手动操作、重载或遇到阻塞时才提示。两项可被宿主发现后才算初始化完成；依赖声明本身不是自动安装钩子。缺失时保留未完成状态和用户旅行需求，不能等到查询时才告知。详细流程见 [依赖初始化](playbooks/setup-dependencies.md)。

安装必需，查询按需：初始化不搜酒店或航班，不收集日期人数，不下单或创建行程。

TourMind 的查询交接当前保留此前核验的 `1.0.6` 契约。2026-09-08 读取官方 `main` 时，源码已声明 `1.0.7`；本次参考其能力介绍、安装说明、场景示例和帮助文档结构，未升级本机依赖或声称验证新版订单流程。调用前应读取实际安装版本与 [查询依赖契约](references/tourmind-query-dependency.md)。

第三方地址保持供应商原域名。正式域名迁移只针对 JourniOne 请求和产品入口，不改写酒店、航班预订链接。
