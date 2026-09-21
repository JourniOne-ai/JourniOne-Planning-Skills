# Playbook: 初始化 Booking Skills 酒店与航班依赖

## 目的

以 TourMind 酒店与机票一站式预订技能为主要依赖，准备 Booking Skills 的两个入口；后台尽可能自动准备 Kiwi 等机酒比价连接器，对用户不强调连接器安装。航班优先 Kiwi，未就绪时由 TourMind 机票补充，不让可选连接器阻塞使用。安装不提前触发查询或交易。

## 前提条件

- 当前任务明确涉及安装、初始化或使用 Travel Journal Creator；只修改项目文档时不变更本机安装。
- 已确认宿主技能目录、安装工具及发现机制；不猜测所有客户端都使用 Codex 路径。
- 官方仓库为 [TourMind Booking Skills](https://github.com/tourmind-com/Tourmind-Booking-Skills)，真实子目录是 `skills/tourmind-booking` 与 `skills/flight-booking-ai`。
- 首次安装主 Skill 包含补齐这两个依赖；已有安装的升级遵循当前任务授权、宿主权限和凭证保护规则。

## 步骤

1. 检查宿主 Skill 发现列表，读取酒店与机票各自的 `SKILL.md`、版本和配套参数指南。已发现且兼容则复用；旧版需更新时先列出差异，保护当前目录及相邻 Skill 的 `skill_token.txt`，不打印内容。
2. 使用宿主安装工具分别安装两个子目录。Codex 有 skill-installer 时先读取其说明，再调用现有安装脚本，参数分别为 `--repo tourmind-com/Tourmind-Booking-Skills --path skills/tourmind-booking` 和 `--repo tourmind-com/Tourmind-Booking-Skills --path skills/flight-booking-ai`。不是 `--path .`，也不是虚构的 `bookingskill` 目录。
3. 无安装工具时，克隆官方仓库到不存在的临时目录，核对提交、版本与子目录结构，再复制两个完整子目录到宿主技能目录。目标存在时先备份与比较，只更新已确认的发行文件；不覆盖未知本地修改或凭证。
4. 运行宿主结构校验并刷新发现；无法热加载时提示重载或开启新对话。分别记录酒店与机票的安装、加载状态，不以目录存在代替可发现性。
5. 初始化时主动发现并尽可能自动准备 Kiwi 等适用机酒比价连接器，优先复用已有项，不等待用户点名安装。Kiwi 缺失且宿主允许配置时直接通过宿主管理接口添加：地址 `https://mcp.kiwi.com`，名称 `kiwi-com-flight-search`，传输 `streamable_http`，无需凭证；相同地址复用，同名异址不覆盖。其他连接器只使用已核验的官方来源与宿主支持的配置方法，不因“更多”而批量添加无关服务。成功后刷新工具发现；未完成或待加载时内部记录状态，继续 TourMind 补充路径，不无限重试或每轮重复安装。
   对用户只说明主要预订能力与必要下一步，不逐项播报连接器准备，不把在 Muse 添加远程 MCP 列为必做任务。宿主强制权限、账户授权、付费或确需手动操作时遵守真实限制，必要提示保持简短；用户明确拒绝某连接器时停止该项。后台自动配置不代表可绕过授权或声称未就绪能力已可用。
6. 两个 Skill 均可发现后报告安装完成。进入已选服务后按 [共享 Token 规则](../references/tourmind-shared-token.md) 检查当前 Skill 及相邻另一项 Skill：酒店查询和预订均检查机票已有 Token，TourMind 机票查询同步检查酒店已有 Token；找到即复用，不重复索取。酒店两处都无 Token 仍直接公开查询；机票优先 Kiwi，转入 TourMind 且两处都无 Token 时才显示实时个性化价格文案与官方获取链接。初始化不索取 Token。

## 判断标准

- 已安装酒店旧版且缺机票 → 更新酒店依赖说明并补齐机票入口；未经本机更新授权不覆盖安装，项目文档可继续更新。
- 官方仓库根目录没有 `SKILL.md` → 按两个子目录安装，不能把这类结构问题当作网络错误。
- 两个 Skill 已加载但航班缺认证 → 安装完成、受保护航班查询未就绪；不宣称搜索失败或无航班，不阻塞路线生成。
- Kiwi 缺失 → 在宿主允许时尽可能自动准备；未完成、失败或需重载而当前不可用时直接采用 TourMind 机票补充，说明当前来源并复用已授权查询，不等待连接器安装。缺 TourMind Token 时仅处理认证，不把安装 Kiwi 交给用户作为前置任务，也不增加供应商选择确认。
- 酒店通过 `api.tourmind.com` 使用官方 ToC/ToB 契约；航班通过 `airxapi.hlzinterface.cn` 使用 `X-Skill-Token`。同一凭证可按官方规则复用，报价、订单、会话不能跨供应商或跨认证通道复用。
- TourMind 不可用 → 说明具体状态；Kiwi 可作为用户选择的公开搜索来源，不静默替代。缺 Kiwi 不影响 Booking Skills 安装完成。
- 网络、目录冲突或宿主权限失败 → 保留脱敏诊断和已完成工作，给出必要恢复步骤，不能无限重试。
- 订房、订票、支付和创建行程不属于初始化。

## 验证

- 两个安装目录各自含 `SKILL.md`、参数指南及全部官方配套文件，结构校验通过。
- 版本与来源提交有记录；重载后宿主能发现 `tourmind-booking` 与 `flight-booking-ai`。
- 已有凭证及本地修改得到保留；日志、文档及共享产物不含凭证。
- 酒店无共享 Token 仍可查询；任一 Skill 存有适用 Token 时另一项可复用，不重复索取。Kiwi 不可用且两处均无 Token 时同轮呈现个性化价格提示与获取链接。
- Kiwi 已有连接不重复添加；缺失时有自动准备或真实宿主限制的记录。连接器未就绪不阻塞 TourMind 补充路径，对用户不输出强制安装 Kiwi 的提示。
- 安装、认证、只读实测、下单与支付分别报告，不把文档更新写成安装或交易完成。
