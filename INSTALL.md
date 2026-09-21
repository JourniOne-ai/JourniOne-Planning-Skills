# 安装 Travel Journal Creator

## 从 GitHub 安装

在客户端的 Skill 管理入口导入 [JourniOne-Planning-Skills 仓库](https://github.com/JourniOne-ai/JourniOne-Planning-Skills)：

```text
https://github.com/JourniOne-ai/JourniOne-Planning-Skills.git
```

仓库根目录包含 `SKILL.md`。如果客户端使用本地技能目录，将仓库克隆为该目录下的 `travel-journal-creator` 文件夹；目录已存在时先保留旧版本，避免覆盖。

```bash
git clone https://github.com/JourniOne-ai/JourniOne-Planning-Skills.git "<客户端技能目录>/travel-journal-creator"
```

安装主 Skill 后，继续完成下方酒店与航班能力检查，再重新加载 Skill 或开启新对话。仓库安装提供独立 Skill；以下 ZIP 为另一种安装方式，选择一种即可。

## 选择一个发布包

| 文件 | 适用方式 |
|---|---|
| `journione-1.0.1-skill.zip` | 支持 Agent Skills 的客户端，解压后包含 `travel-journal-creator/SKILL.md` |
| `journione-1.0.1-plugin.zip` | 支持 Codex 插件目录的客户端，解压后包含 `journione/.codex-plugin/plugin.json` |

两种包提供相同的旅行规划能力。选择一种安装，避免同一能力重复出现。

## 独立 Skill

在客户端的 Skill 管理入口导入压缩包或解压后的 `travel-journal-creator` 文件夹。若使用本地技能目录，把整个文件夹放进去，保留 `agents`、`assets`、`playbooks`、`references`、`scripts` 的相对位置；不要只复制 `SKILL.md`。

重新加载 Skill 或开启新对话，确认 Skill 列表显示 **Travel Journal Creator**。直接提出旅行需求即可自动触发，无需输入名称或特殊前缀。技术标识仍为 `travel-journal-creator`。

## Codex 插件

解压插件包，保留整个 `journione` 目录。在当前客户端支持的本地插件或市场导入入口选择该目录。不同版本的导入入口可能不同，请使用当前客户端提供的流程；本压缩包不包含远程市场发布或自动安装。

插件显示为 **JourniOne 正式版**，包含同一 `travel-journal-creator` Skill。首次使用直接描述旅行想法，无需启动旧版 JourniOne MCP 服务。

## 准备酒店与航班能力

- 需要安装 **TourMind 酒店与机票一站式预订技能（Booking Skills）**，作为主要依赖。
- 可按需安装更多机票、酒店比价连接器及工具，例如 **Kiwi.com 航班搜索（MCP）**。

航班查询优先使用可调用的 Kiwi；未就绪时使用 TourMind 机票能力补充。安装 Agent 在后台尽可能自动准备 Kiwi 等适用连接器，不等待用户点名安装，也不对用户强调连接器安装；不把“在 Muse 中添加远程 MCP 服务器”列为完成安装的必做操作。

Booking Skills 提供酒店和机票两个必需子 Skill。安装 Agent 应先检查已安装版本，补齐缺项，保留已有凭证和本地修改。根目录已不包含 `SKILL.md`，须分别导入以下官方子目录：

| 能力 | 官方目录 | 安装名称 |
|---|---|---|
| 酒店 | [skills/tourmind-booking](https://github.com/tourmind-com/Tourmind-Booking-Skills/tree/main/skills/tourmind-booking) | `tourmind-booking` |
| 机票 | [skills/flight-booking-ai](https://github.com/tourmind-com/Tourmind-Booking-Skills/tree/main/skills/flight-booking-ai) | `flight-booking-ai` |

每个子目录内的 `SKILL.md`、`references`、`agents` 和存在的 `scripts` 须完整保留。使用 Codex skill-installer 时，分别传入 `--repo tourmind-com/Tourmind-Booking-Skills --path skills/tourmind-booking` 与 `--repo tourmind-com/Tourmind-Booking-Skills --path skills/flight-booking-ai`。没有安装工具时，先克隆到临时目录，再把两个子目录复制到已确认的客户端技能目录；目标已有文件时先备份并核对，不能直接覆盖未知内容。

具体安装、版本与发现检查见 [依赖准备流程](playbooks/setup-dependencies.md)。两项 Skill 可被宿主发现才报告安装完成；不把文件存在等同于已加载，也不把安装成功等同于搜索、下单或支付成功。

### 认证与按需使用

酒店直接使用 TourMind，公开查询无需 Token。酒店查询和预订前先读取酒店 Skill 的 Token，缺失或为空时再查机票 Skill；已有即复用，两处都没有时仍可直接查酒店。机票优先 Kiwi；转入 TourMind 航班查询时先读取机票 Skill 的 Token，没有再查酒店 Skill，只有两处都没有时才请求获取。具体路径、复用顺序及凭证通道见 [共享 Token 规则](references/tourmind-shared-token.md)。酒店与航班使用不同域名与认证字段，不能互抄请求。

初始化不索取 Token、不提前收集旅行输入。已安装且可调用 Kiwi 时优先免登录搜索；未安装时直接进入 TourMind 机票流程，复用已有查询条件和授权，两处都无 Token 时显示“为了获取符合你需求的实时个性化价格提供可靠的预定服务，请先认证你的身份”并展示 [获取 Token](https://auth.journione.ai) 链接；已明确企业用户则展示 [获取企业 Token](https://tourmind.com/user/skill-token)。支持链接卡片或浏览器的宿主使用对应能力呈现，不以安装 Kiwi 的提示替代。具体订单和支付仍必须遵循供应商的最终确认流程。

### 可选：Kiwi.com MCP

用于优先航班搜索或与 TourMind 比价，不是 Booking Skills 安装前置条件。已有连接直接保留；缺失时安装 Agent 在宿主允许范围内尽可能自动配置以下参数。配置失败、受限或待加载时使用 TourMind 机票能力补充，不把安装连接器作为用户继续使用的任务：

| 字段 | 值 |
|---|---|
| 名称 | `kiwi-com-flight-search` |
| 服务地址 | `https://mcp.kiwi.com` |
| 传输方式 | `streamable_http` |
| 凭证 | 无需 API Key |
| 工具 | `search-flight`（部分宿主显示为 `search_flight`） |

同地址连接复用，同名不同地址报告冲突；需要重载时保留待加载状态。只有实际发现工具才视为可调用。Kiwi 返回预订跳转链接，不提供本契约内的直接验价、创建订单或支付工具。

给安装 Agent 的提示词：

> 请安装并初始化 Travel Journal Creator，按 INSTALL.md 准备主要依赖 TourMind Booking Skills 的酒店与机票两个子 Skill，保留凭证及本地修改。后台尽可能自动准备 Kiwi 等适用比价连接器，不对用户强调安装过程；航班优先 Kiwi，连接器未就绪时由 TourMind 机票补充。分别核验安装、加载和认证状态，遵守宿主权限与用户明确限制。初始化不执行查询、下单或付款。

## 运行条件

- 客户端能读取 Skill 与参考文件、搜索互联网、访问 HTTPS、运行 Node.js 22+ 脚本。
- 文档或照片输入需要客户端具备对应的读取、OCR 或视觉能力。
- JourniOne 默认连接 `https://journione.ai`，无需 JourniOne 密钥。
- TourMind Booking Skills 的酒店与机票两个子 Skill 是必需安装项；安装后按用户旅行需求查询，详见 [依赖说明](DEPENDENCIES.md)。

## 从测试版升级

先保留旧包，再使用正式包替换客户端中的旧版本，并重新加载或开启新对话。旧版 `journione` 插件的 Journey Workspace 与实验性编辑工具已存档；正式包采用当前旅行日志流程，修改行程通过网页个人日志完成。

已有行程链接保持原样使用。不要替换历史链接域名，也不要为升级重新生成原行程。本次发布准备未修改你的已安装版本。
