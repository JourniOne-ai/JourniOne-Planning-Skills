<p align="center">
  <a href="https://journione.ai/"><img src="assets/journione-lockup.svg" alt="JourniOne" width="360"></a>
</p>

# JourniOne · Travel Journal Creator

[English](README.md) · **[简体中文](README.zh-CN.md)** · [日本語](README.ja.md) · [Español](README.es.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [العربية](README.ar.md)

**把想去的地方，变成一趟真正能出发的旅行。**

[官方网站](https://journione.ai/) · [安装说明](INSTALL.md) · [使用示例](EXAMPLES.md) · [常见问题](FAQ.md)

从一句旅行想法开始，JourniOne 帮你排好每天怎么玩，找到适合路线与预算的酒店，再把整趟旅程做成和 Flipbook 一样精美、可探索、可分享的 **Travel Journal 可交互旅行手册**。少花时间做攻略，多一点对目的地的了解，让旅行更省心，也让预算花得更值。

![JourniOne 可视化路书封面：东京、北京、黄金海岸、马尔代夫等旅行主题](assets/readme/journione-travel-journal-covers.webp)

## 从旅行想法，到能照着走的计划

告诉 JourniOne 你想去哪里、喜欢什么、和谁出发，或把已有行程、照片与资料交给它。它会围绕你的兴趣与节奏安排逐日路线，核实关键地点与交通，兼顾游玩、吃饭、移动和休息，让计划更贴近真实出行。

![JourniOne 规划能力展示：来源信息、机酒查询与可探索的旅行内容](assets/readme/journione-planning-features.webp)

确认后，行程会成为一份像翻阅旅行手册一样、可以继续探索细节的可视化路书：在 **Journal 视图**看图文与每日安排，在 **Map 视图**看地点和路线，点开感兴趣的地点了解更多信息。出发前用它认识目的地，旅途中用它查看接下来的安排。

![川西行程的 Map 视图：地图点位与逐日安排并列查看](assets/readme/journione-map-itinerary.webp)

*在地图上查看地点分布，并对照每天的行程与交通安排。*

还没定日期、没订机票酒店，也可以先排好路线。你可以随时调整，决定生成时再说：“按这版生成旅行日志。”

## 比较酒店渠道价格，把合适的住宿订下来

JourniOne 通过 **TourMind 酒店查询与预订服务**，查询聚合携程、飞猪、美团、同程、去哪儿、Agoda、Expedia、Booking.com 等全球 100+ 酒店渠道的报价。结合你的路线、住宿偏好和预算，比较可查渠道的实时房价，帮你找到价格与入住条件都合适的选择。

比价会一起看房型、餐食、税费、取消政策与可订状态，避免只看一个低价数字。推荐时说明为什么适合你、总共要花多少，以及预订前需要留意什么；具体渠道覆盖、价格与库存以当次查询结果为准。

选定酒店后，可在支持的预订通道中继续下单。你确认房型、金额和订单条款，并完成所需认证与付款后，以订单确认结果为准。订单由对应平台及供应商按约定履约，售后退改遵循所选房型与订单规则，让预订条件和后续处理有据可查。

需要机票时，JourniOne 也能通过 **Kiwi.com** 查询航班，把抵离时间、机场接驳和住宿安排接回同一份行程。酒店和航班只在你需要时查询；生成路书或暂选机酒不会自动下单。

![川西路书的 Bookings 面板：在同一行程中查看酒店、航班与费用](assets/readme/journione-hotel-flight-bookings.webp)

*酒店与航班接回同一份路书。截图中的价格与状态仅用于展示界面。*

## 把旅行想法分享出去

把精美的路书、行程卡片或分享链接发给朋友，也可以发布到社交媒体。别人既能欣赏你的旅行想法，也能了解每天怎么玩、地点在哪里，让一份计划成为同行讨论的起点，或启发下一趟旅行。

![川西可视化路书与目的地概览：图文呈现每天的体验和旅行亮点](assets/readme/journione-journal-overview.webp)

*一份可探索的图文路书，让朋友看懂你的旅行想法与路线亮点。*

行程链接可免登录查看；登录后可以保存为自己的日志，继续调整，再通过页面分享。Google Maps 逐日路线方便查看当天的地点与顺序。图片和地图效果请以页面实际状态为准。

分享前去掉不希望公开的个人资料、照片与文档内容。获得公开链接的人也可能访问其中的信息，详见 [隐私与分享](PRIVACY.md)。

## 开始使用

1. 在客户端的 Skill 管理入口导入 [JourniOne-Planning-Skills](https://github.com/JourniOne-ai/JourniOne-Planning-Skills)，或按 [安装说明](INSTALL.md) 使用发布包。Skill 显示名称为 **Travel Journal Creator**。
2. 安装 Agent 自动检查并准备必需的 **TourMind 酒店 Skill** 与 **Kiwi MCP**，已有能力直接复用；只有需要你授权、操作或重载时才提示。两项均可被客户端发现后，初始化才算完成。
3. 直接说出旅行需求，无需输入 Skill 名称。先看玩法与每天的安排，随时调整；确认后生成可视化路书，机酒按需查询和预订。

创建 JourniOne 路书无需配置 JourniOne Token 或本地 JourniOne MCP 服务，默认连接 [journione.ai](https://journione.ai/)。运行随包脚本需要 Node.js 22 或更新版本，客户端需支持联网搜索、文件读取、HTTPS 请求与远程 MCP。酒店下单与支付的认证要求按对应通道执行，详见 [依赖说明](DEPENDENCIES.md)。

## 试着这样说

> 想去东京玩四天，喜欢爵士和街区散步，但不想每天都听现场。先给我两种玩法，日期以后再定。

> 把这份京都行程整理得轻松一点，保留已经订好的活动，再按路线帮我找交通方便、可以免费取消的酒店。

> 比较这几家酒店当前可订房型的总价和取消条件，推荐最适合我的一个，先不要下单。

> 就按刚才这版生成路书，我想发给朋友，一起看看每天怎么玩。

更多场景见 [使用示例](EXAMPLES.md)。

## 版本与帮助

本包版本为 **1.0.1**。发布包准备与历史线上验收记录见 [上线检查](RELEASE-CHECKLIST.md)；其中标注日期的检查是当时的记录，不代表当前服务状态。实际生成、查询和预订结果以对应服务返回为准。

[常见问题](FAQ.md) · [版本变化](CHANGELOG.md) · [依赖说明](DEPENDENCIES.md) · [Agent 操作说明](SKILL.md)
