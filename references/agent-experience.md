# Agent 服务体验优化（正式）

为了在不同 Agent 中提供更好的旅行规划体验，JourniOne 会记录并上报少量功能使用事件，包括当前 Agent、规划阶段和发生时间，用于改进服务适配。不会上报聊天正文、身份信息或预订凭证，不影响正常规划；用户可以关闭此功能。遵守宿主权限，不隐藏工具提示或绕过授权。不接入 TourEye，不建立个人画像。

## 使用规则

仅在实际处理规划、首版完整逐日草稿随本轮交付、真实 Journal 提交三个节点记录。事件分别为 `planning_started`、`itinerary_draft_ready`、`journal_submitted`。仅读取 Skill、酒店/机票查询、修改草稿、准备 JSON 不触发；直接提交已有行程不补报草稿。节点判断由 Agent 做，脚本不读取或分析聊天。

同一旅行沿用一个 `.tmp/` 下的状态文件，例如 `.tmp/current-trip/experience.json`，跨轮恢复保留路径。新的独立旅行才创建新状态；状态遗失不凭空补报历史节点。每个自然回复回合使用一个稳定标识（如 `reply-1`、`reply-2`），同轮所有调用复用。标识只保存在本地，不上报。当前宿主由已提供的上下文判断，无法确认使用 `unknown`；不扫描系统寻找身份或版本。

先记录实际已发生的节点；在该轮交付前一次合批发送。第一轮既规划又交付完整草稿时：

```bash
node scripts/experience-report.mjs --state .tmp/current-trip/experience.json --turn reply-1 --agent codex --source runtime_context --events planning_started,itinerary_draft_ready --flush
```

这里只是执行格式示例，不表示每轮都同时发生两个节点。刚开始研究尚未产出草稿时只传 `planning_started`；已交付的节点不重复执行。若同轮还要提交 Journal，先记录节点时省略 `--flush`，让下面的真实提交完成后合为一个批次；没有提交则在本轮结束前 flush，不跨轮等凑批。

普通 Journal 提交用包装脚本，沿用原冻结请求、原幂等键、原响应路径和原进度，附同一状态文件与本轮标识：

```bash
node scripts/submit-poster-with-experience.mjs --base https://journione.ai --request .tmp/current-trip/request.json --key ORIGINAL_KEY --output .tmp/current-trip/accepted.json --state .tmp/current-trip/experience.json --turn reply-2 --agent codex --source runtime_context
```

脚本仅在真正调用生成接口时记录提交，保留第一次调用的时间；响应通过原校验才为 `accepted`，HTTP 拒绝为 `rejected`，传输超时或无效接受响应为 `unknown`。接受不代表 Journal 已生成；同键重试不重复上报。不修改生成 JSON、哈希、幂等键或第三方参数。

若宿主用其他已授权的工具实际提交，则在调用后记录 `journal_submitted`，结果默认 `unknown`；不要仅因打算提交就记事件。网络权限、脚本或配置不可用直接跳过，不寻替代端点、不增加用户回合。

## 关闭与失败

用户明确要求关闭时，立即执行 `node scripts/experience-report.mjs --off`，此系统用户后续规划停止上报；关闭时间之前的待发事件不会在重新启用后补发。持久选择保存在 `~/.config/journione/travel-journal-creator/experience-preferences.json`，Skill 更新不会覆盖。也可设置进程环境 `JOURNIONE_EXPERIENCE_REPORTING=off`；该进程访问的状态会丢弃待发事件。包内 `scripts/experience-config.json` 只提供默认配置，不修改它来关闭。重新启用仅在用户明确选择后执行 `node scripts/experience-report.mjs --on`；脚本保留关闭时间，以丢弃关闭前遗留的待发事件。不得自行删除偏好文件或重置关闭选择。

每个规划节点最多记录并尝试发送一次，同轮最多一批，整趟最多三批。先落盘尝试状态，再发不超过 2 KB 的请求；1 秒超时、不自动重试。脚本静默失败且不阻断规划，不为漏报创建新会话。宿主可能展示命令调用，不能承诺完全不可见。

## 最小契约

固定 `journione-experience@1`；批次包含随机规划 ID、当前 Agent 名称及已知来源、安装时的 Skill 内容版本、`prod` 环境，最多三条事件。每条仅含随机事件 ID、节点名、UTC 记录时间、`time_source: observed` 和可选 Journal 结果；这是脚本观察节点的时间，不冒充精确的对话开始时间。未知 Agent 为 `unknown`；不伪造版本。服务端补 `received_at` 并按事件 ID 和规划节点双重去重。

不上报目的地、出行日期、人数、酒店、航班、URL、文件路径、身份、凭证、聊天或行程正文。服务器接口为配置中的 `/api/skill-experience`；当前没有可捎带元数据的生成接口，所以采用独立小批次，不改原生成契约。统计是“已观测规划会话数／阶段到达数”，不是独立用户数；匿名来源可伪造，缺报不等于流失。

## 环境配置

本正式安装固定 `environment: prod` 与正式端点。生产标识统一为 `prod`，对应 `https://journione.ai/api/skill-experience`；服务端须先部署支持版本，并显式配置 `SKILL_EXPERIENCE_ENVIRONMENT=prod`。本安装已按用户授权启用；不从当前对话或域名推断环境。客户端拒绝环境与端点错配，服务端拒绝跨环境批次；旧名称 `production` 不再接受。环境配置变更仅用于新规划，不复用另一环境的待发状态。
