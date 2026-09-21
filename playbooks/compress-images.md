# Playbook: 压缩 Skill 图片

## 目的
减少 Skill 文件和 ZIP 体积，保留全部图片、原分辨率、透明度和可用的本地引用。

## 前提条件
- Python 3、Pillow 的 WebP 编码支持、Node.js 可用。
- 从待优化提交用 `git archive` 导出纯净副本到 `.tmp/`，不含 `.git`、`.tmp`、依赖或凭证。
- 原图副本保留，目标目录与旁附的 `.images.json` 不存在，目标不位于源目录内部。
- 已运行 `node scripts/test-poster-contract.mjs` 取得基线。

## 步骤
1. `python3 scripts/compress-skill-images.py --source <原始副本> --output <优化副本> --quality 80` — 输出完整优化副本和逐图记录。
2. 查看展示图和小字区域，核对原始与优化图；检查图片数量、尺寸、透明度和默认封面像素。
3. 将记录中的优化图片和必要的引用变更复制回工作分支；保留原始副本供比较。
4. 运行 `node scripts/test-poster-contract.mjs` 和 Skill 结构校验。按原流程打包时复用 `package-directory.py`，只选择纯净发布副本。
5. 回读 ZIP 并核对逐文件哈希、图像解码和引用；报告包含与不包含 ZIP 压缩的实际体积。

## 判断标准
- README 展示图为 PNG 或 WebP → 保持原尺寸，使用质量 80 的 WebP；小字或画面损伤明显则从原始副本提高质量重做。
- 新文件没有变小 → 保留原文件；非展示用途 WebP 保留原字节。
- 默认封面 PNG → 无损优化，文件名和像素不变。
- SVG → 仅清理无文本节点图形的标签间空白。
- 已经有损压缩的图片 → 每次试验都从保留的原始副本开始，不对候选结果反复编码。

## 验证
- 全部图片可解码，数量、尺寸与透明度一致；默认封面的 RGBA 像素一致。
- 18 组离线契约测试及 Skill 结构校验通过，全部本地 Markdown 图片引用可解析。
- ZIP 不包含临时文件、Git 历史、原图备份或依赖，并通过哈希回读。
- 本流程完成本地优化，不自动提交、推送或发布。
