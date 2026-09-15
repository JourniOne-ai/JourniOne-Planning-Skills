# Travel Journal 行程卡 稳定渲染契约

## 目标

让同一份行程在支持对话内可视化的宿主中始终得到同一结构的卡片，并在能力不足时得到可读的 Markdown。禁止由 Agent 临时设计卡片、拼 CSS 或把 HTML 标签直接写进普通回复。

## 渲染优先级

### 1. 宿主支持对话内 Visualization

1. 读取当前 Skill 的 `scripts/render-roadbook-card.mjs`；不要重写或复制其中的 HTML、CSS、JavaScript。
2. 组装输入 JSON，并把 fragment 输出到宿主要求的任务专属可视化目录。
3. 使用宿主原生 inline visualization 引用嵌入当前回复；不得返回 HTML 文件链接或截图。
4. 渲染脚本失败一次后立即进入 Markdown 降级，不修补临时 HTML、不重试另一种卡片样式。

默认这是必需交付，不因“先给 Preview”而省略。卡片沿用示例图的结构：宽屏封面在左、日期/目的地及标题简介标签在右，主按钮“打开 Travel Journal”并列“Google Maps 逐日路线”；窄屏纵向排列。地图初始折叠，展开后按天显示短标题链接与点位入口。示例图的展开状态不是默认展开要求，图内旅行文字不作为待生成行程。

输入字段：

```json
{
  "mode": "poster",
  "title": "东京两天电车巡礼",
  "date_label": "Day 1–Day 2",
  "destination": "东京",
  "overview": "从百年车站与多线并行，走到都电、车辆基地与东京单轨。",
  "tags": ["东京", "铁路巡礼", "都电"],
  "preview_url": "https://journione.ai/preview/trip_...",
  "cover_status": "placeholder",
  "cover_path": "",
  "days": [
    {
      "label": "Day 1",
      "title": "Day 1｜百年车站、多线并行与都电",
      "map_url": "https://www.google.com/maps/dir/..."
    }
  ]
}
```

`mode` 只接受 `poster`，缺省也为 poster；用户按钮显示 Travel Journal。页面内分别称 Journal 视图与 Map 视图；视图切换不改变卡片模式，卡片主按钮仍为“打开 Travel Journal”。

`preview_url` 必须是接口实际返回的 `/preview/<trip_id>` 绝对链接，不含用户名、密码、查询串或 hash；不接受其他字段代替。`/share/<snapshot_id>` 是用户后续另建的只读快照，不能充当 Preview。

`cover_path` 只接受卡片开始渲染时已经存在且可读取的本地图片。不要为了卡片等待或轮询 `cover_url`，也不要把外部图片 URL 直接塞入 Visualization。

### 从同一 Snapshot 确定性生成地图

优先传入与请求完全相同的 `trip_snapshot`，代替手工填写 `days`。脚本导出的 `buildGoogleMapsDays(trip_snapshot)` 只按 `days[].activities[]` 的现有顺序读取正式节点，不重新规划；返回每一天的 `label`、`title`、`map_url`、`points`（具名点位与单点 `map_url`）和 `missing_points`。两种输入同时存在时以 Snapshot 为准，避免旧的手工地图覆盖当前路线。

调用方只把已核验、完成必要坐标系转换的坐标写入 `location.lat/lng`，并标记 `location.coordinate_system: "WGS84"` 或 `"WGS-84"`。脚本不证明坐标正确，不把未知坐标系当 WGS-84。日期未知时照常生成 Day N；正式活动不得混入备选。

两个及以上有效点生成 `/maps/dir/{lat},{lng}/...`；只有一个有效点使用 `/maps/search/?api=1&query={lat},{lng}`；无有效点的天次显示“地图待核实”。未知或非 WGS-84 点名写入 `missing_points`，随该天一起显示，不能静默过滤天次。已有合规 `days[].map_url` 输入保持兼容，但仍须提供每一天，并保留缺失说明。Markdown 使用同一组地图数据，不另编一套顺序。

### 2. 宿主不支持对话内 Visualization

使用固定 Markdown，不输出 `<details>`、`<summary>`、`<style>`、`<script>`、`<div>` 或其他原始 HTML：

```markdown
![<标题> Travel Journal 封面](<已可用封面；否则固定兜底封面>)

### <标题>

<日期或 Day 范围> · <目的地>

<1–2 句 Overview>

`<标签 1>` `<标签 2>`

[打开 Travel Journal](<preview_url>)

#### Google Maps 逐日路线

- [Day 1｜<当天标题>](<map_url>)
- [Day 2｜<当天标题>](<map_url>)

点位入口可列在对应天次下：`[地点名称](已核验的单点 Google Maps)`。只有一个点时当天链接即单点入口；无坐标则保留“Day N｜当天标题 · 地图待核实”，部分缺失逐项列明。
```

Markdown 不具备可靠折叠能力时就正常展示列表，不写“展开/折叠”，也不伪造交互。

Markdown 的兜底封面也必须可渲染：使用当前已安装 Skill `assets/default-roadbook-cover.png` 的绝对文件路径，或由宿主附件功能展示该文件；不猜测网站静态资源路径。宿主不能展示本地图片时保留文字卡片、主链接和逐日地图，并省略图片语法。不得把相对文件名或空图片语法交给用户。

## 封面兜底

- 卡片必须始终显示一张封面，不允许空白图片区或破图。
- 只有 `cover_status` 为 `ready | completed | available`，且生成封面在渲染前已经成为有效本地文件时才使用生成封面。
- 其他所有情况——缺少 `cover_url`、仍在生成、`placeholder`、`error`、远程下载失败、文件不存在、格式无法识别或图像宽高为零——立即使用 `assets/default-roadbook-cover.png`。
- 渲染脚本把所选图片内嵌为 data URI，避免 Visualization 的外链 CSP 导致静默破图。
- 兜底图不代表整份路书失败，不等待、不重试，不延迟 `preview_url`。

## Google Maps 交互

- Visualization 中只用真实 `<button type="button">` 控制路线区，初始 `aria-expanded="false"`，对应路线容器带 `hidden`。
- 点击后同步切换 `aria-expanded`、`hidden` 和“展开/收起”文字。
- 禁止使用 `<details>` / `<summary>`；部分宿主会把标签原样显示。
- 折叠时不显示 Day 路线行、分隔线或裸三角；展开后才显示链接列表。
- 链接标题统一为 `Day N｜当天标题` 或 `日期｜当天标题`，不把全部点名塞进标题。输入标题已带 `Day N` 时先去重，日期标签与 Day 标题并用也需去重。具名单点链接放在对应天次下；无地图天次和未包含的点名仍须可见。

## 唯一结构

- 一条回复最多一张 Travel Journal 行程卡。
- `preview_url` 在卡片中只出现一次；卡片成功渲染后，不在卡片上方或下方重复“打开 Travel Journal”。
- 固定顺序：封面 → 日期/目的地 → 标题 → Overview → 2–5 个标签 → 主链接与地图按钮 → 折叠路线区。
- 用户文案统一使用 Travel Journal，不另起成品名称，不展示内部版本或技术模式。
- 不添加“Travel Journal 已生成”等重复状态标题，不把 Day 摘要同时放在折叠区外。
- 卡片后直接开始 `## 行程 Overview`、`## 最终行程`、`## 出发前需要确认` 和 `## Tips`。
