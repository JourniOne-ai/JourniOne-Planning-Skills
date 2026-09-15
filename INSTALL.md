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

以下两项是必需安装项。安装 Agent 应在初始化一开始检查并自动补齐，已有的直接复用，不另问是否安装；即使暂时只规划路线，也应准备好酒店与航班能力。复制主 Skill 文件不会自动安装第三方依赖，`agents/openai.yaml` 中的 MCP 声明也不能代替当前客户端的连接验证。替用户安装的 Agent 应执行 [依赖准备流程](playbooks/setup-dependencies.md)，不要只导入主仓库就宣布全部完成。

### 酒店：TourMind Booking Skill

优先由安装 Agent 通过当前客户端安装工具自动导入完整的 [TourMind 官方仓库](https://github.com/tourmind-com/Tourmind-Booking-Skills)，安装名称为 `tourmind-booking`。使用本地技能目录的客户端可执行：

```bash
git clone https://github.com/tourmind-com/Tourmind-Booking-Skills.git "<客户端技能目录>/tourmind-booking"
```

先确认目标目录不存在；已安装时直接核对现有版本，保留原有凭证与文件。根目录的 `SKILL.md`、配套 `references`、`scripts` 等须完整保留，重载后确认宿主能够发现该 Skill。TourMind 通过 HTTPS 查询，不需要额外酒店 MCP。个人公开查询与企业认证范围按实际安装版本的官方契约确认；不要为可用的公开查询要求登录，也不要将企业版误称为免登录版。

### 航班：Kiwi.com MCP

优先由安装 Agent 使用客户端 MCP 管理接口自动添加；只有必须用户在 UI 操作时才提示以下参数：

| 字段 | 值 |
|---|---|
| 名称 | `kiwi-com-flight-search` |
| 服务地址 | `https://mcp.kiwi.com` |
| 传输方式 | `streamable_http` |
| 凭证 | 无需 API Key |
| 需要的工具 | `search-flight`（有些宿主显示为 `search_flight`） |

已有同地址连接则复用。保存并按客户端要求重载，确认 Agent 实际能发现航班搜索工具；只看到配置项不等于已连接。客户端不支持远程 MCP 时明确说明必需依赖尚未就绪，不能报告完整安装成功。

### 安装完成时告诉用户

两项均被宿主发现后，用一句话确认安装完成。正常初始化无感进行；需要用户授权、点击或重载时才合并提示一次，保留“初始化未完成/待重载”状态，给出最短下一步。这里只检查依赖，不要求用户提前提供旅行日期，不发起订单，也不把安装成功当作实时查询成功。

给安装 Agent 的提示词：

> 请安装并初始化 Travel Journal Creator，按 INSTALL.md 自动准备两项必需依赖，无需另问是否安装：从官方仓库安装缺少的 tourmind-booking Skill，连接缺少的 Kiwi.com 远程 MCP。复用已有安装与连接，保留已有文件和配置。完成后核验酒店 Skill 可被发现、Kiwi 的 search-flight 工具可用；需要我在客户端操作或重新加载时，明确给出步骤，并分别报告两项状态。

## 运行条件

- 客户端能读取 Skill 与参考文件、搜索互联网、访问 HTTPS、运行 Node.js 22+ 脚本。
- 文档或照片输入需要客户端具备对应的读取、OCR 或视觉能力。
- JourniOne 默认连接 `https://journione.ai`，无需 JourniOne 密钥。
- TourMind 酒店 Skill 和 Kiwi.com MCP 是必需安装项；安装后按用户旅行需求查询，详见 [依赖说明](DEPENDENCIES.md)。

## 从测试版升级

先保留旧包，再使用正式包替换客户端中的旧版本，并重新加载或开启新对话。旧版 `journione` 插件的 Journey Workspace 与实验性编辑工具已存档；正式包采用当前旅行日志流程，修改行程通过网页个人日志完成。

已有行程链接保持原样使用。不要替换历史链接域名，也不要为升级重新生成原行程。本次发布准备未修改你的已安装版本。
