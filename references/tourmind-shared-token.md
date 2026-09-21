# TourMind 酒店与机票共享 Token

## 查询入口

- 酒店直接使用 TourMind。查询不以获取 Token 为前置条件；先静默检查已有共享 Token，有则按官方通道复用，没有则直接使用公开个人查询。
- 航班优先使用已就绪 Kiwi，使用 Kiwi 不索取或传递 TourMind Token。后台仍尽可能准备连接器，不向用户强调安装。
- Kiwi 缺失、安装未完成或待加载时使用 TourMind 机票补充。先检查机票与酒店两处已有 Token，只有两处都没有时才展示下方取 Token 提示和链接。已有 Token 不重复索取。
- 用户明确指定供应商时尊重其选择。Kiwi 搜索报错或零结果不是“未安装”，不擅自改条件或套用缺失流程。

## 双向读取与复用

在每次酒店查询流程、酒店预订和其他受保护操作前检查共享凭证；TourMind 航班查询及每次受保护操作前同样检查。先检查当前 Skill，再检查相邻另一项 Skill：

| 当前操作 | 首先读取 | 首处缺失或为空时读取 | 两处都缺失或为空 |
|---|---|---|---|
| 酒店查询 | `tourmind-booking/skill_token.txt` | `flight-booking-ai/skill_token.txt` | 直接公开查询，不询问 Token |
| 酒店预订、订单及支付 | `tourmind-booking/skill_token.txt` | `flight-booking-ai/skill_token.txt` | 此时才按酒店官方流程获取授权 |
| TourMind 航班查询、验价、预订、订单及支付 | `flight-booking-ai/skill_token.txt` | `tourmind-booking/skill_token.txt` | 先获取 Token，不发送无凭证受保护请求 |
| Kiwi 航班查询 | 不需要 TourMind Token | 不为 Kiwi 读取或传递共享 Token | 正常查询 |

路径相对于宿主已确认的两个相邻安装目录，不是任意名字含“酒店”的项目目录。只读取这两个官方 Skill 的 `skill_token.txt`，不扫描工作区、备份、日志、历史或环境变量。

- 当前文件非空即按其选择凭证；格式错误或曾被拒绝时按官方恢复流程处理，不绕过它偷偷尝试另一处 Token。
- 两处都有不同 Token 时当前 Skill 的文件优先，不覆盖或合并；既有报价、订单和支付仍绑定原通道，不能因找到另一份 Token 而跨通道复用。
- 记录实际凭证来源路径，直接复用，不因共享而复制文件或要求用户再提交一遍。保存新 Token 时由对应 Skill 按官方规则处理，不要求用户手动维护文件。
- `uk_` / `sk_` 仅用于选择个人 / 企业通道，不代表认证已验证。酒店依端点契约使用 `user_key` / `token`；航班仅使用 `X-Skill-Token` 请求头。酒店公开端点不接受凭证时仍不附加字段。
- 共享 Token 不共享 `rate_code`、`offer_id`、验价会话或订单上下文。Token 不进入输出、日志、URL、Trip Snapshot 或分享页面。
- 认证拒绝按官方流程处理实际来源文件，停止受影响请求；企业机票 `20105`、酒店权限不足等不误判为 Token 缺失，不重复弹出取 Token 提示。

## 机票缺 Token 时的对外提示

只有已进入用户授权的 TourMind 航班查询、并确认两处都无 Token 时，显示以下文案；它替代泛化的“接口需要认证”提示，不在初始化、Kiwi 查询或公开酒店查询时出现：

> 为了获取符合你需求的实时个性化价格提供可靠的预定服务，请先认证你的身份 [获取 Token](https://auth.journione.ai)

已明确为企业用户时，将按钮改为 [获取企业 Token](https://tourmind.com/user/skill-token)；企业用户尚无账号时补充 [注册企业账号](https://tourmind.com/admin/skillSignup)。身份未明确时默认展示个人入口，同时可提供简短的企业入口，不先增加身份选择问答。

同轮呈现可点击链接；宿主支持链接卡片、按钮或内嵌浏览器时，使用对应能力展示或打开官方入口；不支持弹窗时至少给出上述可点击链接，不能只说“去获取 Token”，也不能声称已弹出未实际展示的窗口。链接不携带 Token 或个人资料，不以安装 Kiwi 的教程替代此提示。

“实时个性化价格”说明本次授权查询用途，不保证更低价格、专属折扣或特定库存。已有 Token 时跳过此提示并继续正常流程，保留既有路线、日期、人数和用户意图；凭证配置、搜索成功、订单创建和支付成功分别判断。

## 验收场景

- 两处都没有 Token，用户只查酒店 → 公开查询，无取 Token 提示。
- 酒店无 Token、机票有 Token，用户查酒店或预订 → 读取并复用机票 Token，不重复索取。
- 机票无 Token、酒店有 Token，Kiwi 不可用 → 复用酒店 Token 执行已授权的 TourMind 航班查询。
- Kiwi 可用且用户普通查机票 → Kiwi 搜索，无 TourMind 取 Token 提示。
- Kiwi 不可用、两处都没有 Token → 同轮显示个性化价格文案与获取 Token 链接。
- 仅出现权限不足或已存 Token 被拒绝 → 执行对应恢复流程，不当作从未配置而反复尝试两个通道。
