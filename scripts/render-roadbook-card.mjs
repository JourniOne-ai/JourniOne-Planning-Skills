#!/usr/bin/env node
// 用途：从固定 JSON 数据生成稳定的对话内 Travel Journal 行程卡 HTML fragment。
// 参数：--input <JSON 文件或 ->；可选 --output <HTML fragment 文件>。
// 输出：HTML fragment；指定 --output 时在 stderr 返回生成路径。
// 退出码：0=成功，1=输入或渲染失败。
// Known Issues: 事件不作为地图缺失点；不下载远程封面；没有已就绪的本地封面时固定使用自带图；仅接受经过验证的海报 Preview 主链接。无坐标天次保留并提示，不再静默过滤；坐标核验与坐标系转换由调用方完成。

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validatePreviewUrl } from "./prepare-poster-request.mjs";
import { isTimelineOnly } from "./place-binding.mjs";

const DEFAULT_COVER_PATH = fileURLToPath(new URL("../assets/default-roadbook-cover.png", import.meta.url));
const READY_COVER_STATUSES = new Set(["", "ready", "completed", "available"]);

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function text(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolvePreviewUrl(data) {
  return validatePreviewUrl(data.preview_url, data.trip_id);
}

function optionalMapUrl(value) {
  if (!text(value)) return "";
  const candidate = new URL(text(value));
  if (candidate.protocol !== "https:" || !/(^|\.)google\.[a-z.]+$/iu.test(candidate.hostname) || !candidate.pathname.startsWith("/maps/")) {
    throw new Error("Google Maps 路线必须使用官方 https 地图链接");
  }
  return candidate.toString();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function normalizeDayTitle(label, title) {
  const rawTitle = text(title);
  if (!rawTitle) return label;
  return rawTitle.replace(new RegExp(`^${escapeRegExp(label)}\\s*[|｜·:：—-]\\s*`, "iu"), "").replace(/^Day\s*\d+\s*[|｜·:：—-]\s*/iu, "").trim() || label;
}

// Snapshot 的 activities 数组就是已确认的游览顺序；这里不排序、不猜坐标、不包含备选。
export function buildGoogleMapsDays(snapshot) {
  if (!Array.isArray(snapshot?.days) || snapshot.days.length === 0) throw new Error("缺少已确认的逐日行程");
  return snapshot.days.map((day, index) => {
    const points = [];
    const missing = [];
    for (const [pointIndex, activity] of (day.activities || []).entries()) {
      if (isTimelineOnly(activity)) continue;
      const title = text(activity.title || activity.location?.name) || `点位 ${pointIndex + 1}`;
      const location = activity.location || {};
      const { lat, lng } = location;
      const system = text(location.coordinate_system).toUpperCase().replaceAll("-", "");
      if (system !== "WGS84" || typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        missing.push(title);
        continue;
      }
      points.push({ title, lat, lng, map_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` });
    }
    const mapUrl = points.length > 1
      ? `https://www.google.com/maps/dir/${points.map(point => `${point.lat},${point.lng}`).join("/")}`
      : points[0]?.map_url || "";
    const date = text(day.date).match(/^\d{4}-(\d{2})-(\d{2})$/u);
    return {
      label: date ? `${Number(date[1])}月${Number(date[2])}日` : `Day ${index + 1}`,
      title: text(day.title), map_url: mapUrl, points, missing_points: missing,
    };
  });
}

function imageMime(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  return "image/png";
}

function imageDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 10 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (buffer.length >= 12 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]).has(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) break;
      offset += 2 + segmentLength;
    }
  }
  return null;
}

function validImagePath(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return false;
    const stats = fs.statSync(filePath);
    if (!stats.isFile() || stats.size === 0) return false;
    const dimensions = imageDimensions(filePath);
    return Boolean(dimensions && dimensions.width > 0 && dimensions.height > 0);
  } catch {
    return false;
  }
}

function resolveCover(data) {
  const status = text(data.cover_status).toLowerCase();
  const requestedPath = text(data.cover_path);
  const useRequested = READY_COVER_STATUSES.has(status) && validImagePath(requestedPath);
  const selectedPath = useRequested ? requestedPath : DEFAULT_COVER_PATH;
  if (!validImagePath(selectedPath)) throw new Error("固定兜底封面缺失或为空");
  return {
    source: useRequested ? "generated" : "fallback",
    dataUri: `data:${imageMime(selectedPath)};base64,${fs.readFileSync(selectedPath).toString("base64")}`,
  };
}

export function renderRoadbookCard(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("输入必须是 JSON 对象");
  const title = text(data.title);
  const overview = text(data.overview);
  if (!title) throw new Error("缺少 title");
  if (!overview) throw new Error("缺少 overview");

  const shareUrl = resolvePreviewUrl(data);
  const mode = text(data.mode) || "poster";
  if (mode !== "poster") throw new Error("mode 只接受 poster");
  const journeyLabel = "Travel Journal";
  const cover = resolveCover(data);
  const rootId = `roadbook-card-${crypto.createHash("sha256").update(shareUrl).digest("hex").slice(0, 10)}`;
  const routePanelId = `${rootId}-routes`;
  const routeButtonId = `${rootId}-routes-button`;
  const meta = [text(data.date_label), text(data.destination)].filter(Boolean).join(" · ");
  const tags = [...new Set((Array.isArray(data.tags) ? data.tags : []).map(text).filter(Boolean))].slice(0, 5);
  const inputDays = data.trip_snapshot ? buildGoogleMapsDays(data.trip_snapshot) : data.days;
  if (!Array.isArray(inputDays) || inputDays.length === 0) throw new Error("缺少 days 或 trip_snapshot，不能省略逐日地图");
  const days = inputDays.map((day, index) => {
    const label = text(day?.label) || `Day ${index + 1}`;
    return {
      label,
      title: normalizeDayTitle(label, day?.title),
      mapUrl: optionalMapUrl(day?.map_url),
      points: (day?.points || []).map(point => ({ title: text(point.title), mapUrl: optionalMapUrl(point.map_url) })),
      missing: (day?.missing_points || []).map(text).filter(Boolean),
    };
  });

  const tagMarkup = tags.map((tag) => `<span class="viz-badge">${escapeHtml(tag)}</span>`).join("\n");
  const routeItems = days.map((day) => {
    const heading = `${escapeHtml(day.label)}｜${escapeHtml(day.title)}`;
    const main = day.mapUrl ? `<a href="${escapeHtml(day.mapUrl)}" target="_blank" rel="noreferrer">${heading}</a>` : `<span>${heading} · 地图待核实</span>`;
    const points = day.points.filter(point => point.mapUrl).map(point => `<a href="${escapeHtml(point.mapUrl)}" target="_blank" rel="noreferrer">${escapeHtml(point.title)}</a>`).join(" · ");
    const missing = day.missing.length ? `<p class="text-small text-muted">坐标待核实，地图未包含：${day.missing.map(escapeHtml).join("、")}</p>` : "";
    return `<li>${main}${points ? `<p class="text-small">${points}</p>` : ""}${missing}</li>`;
  }).join("\n");
  const routeButton = days.length > 0
    ? `<button id="${routeButtonId}" class="btn" type="button" aria-expanded="false" aria-controls="${routePanelId}">Google Maps 逐日路线 展开</button>`
    : "";
  const routePanel = days.length > 0
    ? `<div id="${routePanelId}" hidden>\n<hr>\n<ul>\n${routeItems}\n</ul>\n</div>`
    : "";
  const routeScript = days.length > 0
    ? `<script>\n(() => {\n  const root = document.getElementById("${rootId}");\n  const button = root?.querySelector("#${routeButtonId}");\n  const panel = root?.querySelector("#${routePanelId}");\n  if (!button || !panel) return;\n  button.addEventListener("click", () => {\n    const expanded = button.getAttribute("aria-expanded") === "true";\n    button.setAttribute("aria-expanded", String(!expanded));\n    button.textContent = expanded ? "Google Maps 逐日路线 展开" : "Google Maps 逐日路线 收起";\n    panel.hidden = expanded;\n  });\n})();\n</script>`
    : "";

  return `<style>\n#${rootId} .roadbook-cover { display: block; width: 100%; height: auto; aspect-ratio: 316 / 201; object-fit: cover; }\n</style>\n<div id="${rootId}" class="card" data-cover-source="${cover.source}">\n  <div class="viz-grid">\n    <img class="roadbook-cover" src="${cover.dataUri}" alt="${escapeHtml(title)}的 ${journeyLabel} 封面">\n    <section>\n      <p class="text-small text-muted">${escapeHtml([journeyLabel, meta].filter(Boolean).join(" · "))}</p>\n      <h2>${escapeHtml(title)}</h2>\n      <p>${escapeHtml(overview)}</p>\n      ${tags.length > 0 ? `<div class="viz-row">\n${tagMarkup}\n      </div>` : ""}\n      <div class="viz-row">\n        <a class="btn btn-primary" href="${escapeHtml(shareUrl)}" target="_blank" rel="noreferrer">打开 ${journeyLabel}</a>\n        ${routeButton}\n      </div>\n    </section>\n  </div>\n  ${routePanel}\n</div>\n${routeScript}\n`;
}

async function main() {
  const inputPath = readArg("--input");
  const outputPath = readArg("--output");
  if (!inputPath) throw new Error("必须提供 --input <JSON 文件或 ->");
  const inputText = inputPath === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(inputPath, "utf8");
  const fragment = renderRoadbookCard(JSON.parse(inputText));
  if (outputPath) {
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
    fs.writeFileSync(outputPath, fragment, "utf8");
    process.stderr.write(`已生成 Travel Journal 行程卡：${path.resolve(outputPath)}\n`);
  } else {
    process.stdout.write(fragment);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`生成失败：${error.message}\n`);
    process.exit(1);
  });
}
