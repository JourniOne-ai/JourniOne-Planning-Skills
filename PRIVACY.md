# 隐私与分享说明

本文件说明此 Skill 的资料使用方式，不替代网站或供应商的正式隐私政策。

- 规划过程中，AI 客户端读取你提供的想法、文档或照片。确认生成后，已确认行程与允许上传的材料会发送到 `https://journione.ai`。
- 初次行程链接用于公开查看，获得链接的人也可能访问内容。不要上传证件、精确住址、健康信息或未获许可的私人照片；本创建流程不支持私人媒体。
- 登录后保存或复用自己的日志，编辑权限属于当前账号。公开原件与个人修改分别处理；再次对外分享时使用页面提供的链接。
- 酒店、航班与地图查询会向相应服务发送必要的地点、日期或同行配置；提供方说明见 [依赖说明](DEPENDENCIES.md)。
- 本包不要求 JourniOne Token。订单所需身份信息通过对应服务处理，不放入公开行程。
- 开发排错中的请求和响应放当前任务的 `.tmp` 私有目录，不能上传到公开仓库。发布包不包含你的行程、账号、预订凭证或生成结果。

## Agent 服务体验上报

1.0.3 默认开启轻量上报。Agent 在真实到达「开始规划」「完成首版逐日草稿」「提交 Journal」这三个节点时，尽力向 `https://journione.ai/api/skill-experience` 发送事件。每次规划使用随机会话与事件 ID；批次只包含节点、观察时间、当前 Agent 名称及已知来源、Skill 版本、正式环境标识，以及提交结果。没有安装完成、Skill 读取、对话开始或每轮消息事件，因此这些数据不能用于计算安装人数或对话次数；网络失败也可能漏报。

上报不包含聊天内容、行程正文、目的地、日期、同行人数、酒店或航班、链接、文件路径、账号身份和凭证。需要关闭时运行 `node scripts/experience-report.mjs --off`；关闭选择保存在当前系统用户的 `~/.config/journione/travel-journal-creator/experience-preferences.json`，更新 Skill 后仍生效。明确选择重新开启时运行 `node scripts/experience-report.mjs --on`，脚本会保留关闭时间。也可为 Agent 进程设置 `JOURNIONE_EXPERIENCE_REPORTING=off`。关闭前的待发事件不会补报。详情见 [上报规则](references/agent-experience.md)。

The 1.0.3 release enables limited Agent experience reporting by default. It attempts to send only three observed milestones: planning started, first complete day-by-day draft ready, and Journal submitted. A batch contains random session and event IDs, the milestone and observed time, Agent name and known source, Skill version, production environment, and submission result. It does not send chat or itinerary content, personal identity, credentials, or travel details. There are no installation, Skill-read, conversation-start, or per-message events. Run `node scripts/experience-report.mjs --off` to persist an opt-out for the current system user across Skill updates, or set `JOURNIONE_EXPERIENCE_REPORTING=off` for the Agent process. Run `node scripts/experience-report.mjs --on` only when the user chooses to resume; events pending before the opt-out remain excluded.

本包没有承诺特定保存期限、自动删除机制或私有链接保护。正式站点条款与隐私政策应在发布时由维护者核验并提供，见 [上线检查](RELEASE-CHECKLIST.md)。
