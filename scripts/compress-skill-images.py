#!/usr/bin/env python3
# 用途：复制发布目录并压缩图片，更新展示图引用，输出逐图压缩记录。
# 参数：--source 原始目录；--output 不存在的目标目录；--quality WebP 质量。
# 输出：JSON 压缩记录，目标旁附同名 .images.json。
# 退出码：0=成功，1=出错。
# Known Issues: WebP 展示图需要宿主支持；仅适用于静态 PNG、WebP 和 SVG。WebP 有损压缩必须从保留的原始副本运行，避免重复转码累积失真。
import argparse
import io
import json
import re
import shutil
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, features


def main():
    parser = argparse.ArgumentParser(description='压缩发布包图片并保留原目录')
    parser.add_argument('--source', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--quality', type=int, default=80)
    args = parser.parse_args()
    source, output = Path(args.source).resolve(), Path(args.output).resolve()
    report = output.with_suffix('.images.json')
    if not source.is_dir() or output.exists() or report.exists():
        raise ValueError('源目录必须存在，输出目录和记录必须不存在')
    if source == output or source in output.parents:
        raise ValueError('输出不能位于源目录内部')
    if not 1 <= args.quality <= 100 or not features.check('webp'):
        raise ValueError('需要有效质量参数和 WebP 编码支持')
    if any(p.is_symlink() for p in source.rglob('*')):
        raise ValueError('源目录包含符号链接')
    if any(p.is_dir() and p.name in {'.git', '.tmp', 'node_modules'} for p in source.rglob('*')):
        raise ValueError('请先导出纯净源目录，不能包含 .git、.tmp 或 node_modules')
    shutil.copytree(source, output)
    rows, replacements = [], {}
    for file in sorted(output.rglob('*')):
        if not file.is_file() or file.suffix.lower() not in {'.png', '.webp', '.svg'}:
            continue
        original = file.read_bytes()
        target = file
        if file.suffix.lower() in {'.png', '.webp'}:
            with Image.open(io.BytesIO(original)) as im:
                im.load()
                if getattr(im, 'n_frames', 1) != 1:
                    raise ValueError(f'不支持动画：{file}')
                encoded = io.BytesIO()
                if 'readme' in file.relative_to(output).parts:
                    im.save(encoded, format='WEBP', quality=args.quality, method=6, exact=True)
                    target = file.with_suffix('.webp')
                    if target != file and target.exists():
                        raise ValueError(f'目标图片已存在：{target}')
                    operation = f'原分辨率 WebP，质量 {args.quality}'
                elif file.suffix.lower() == '.png':
                    im.save(encoded, format='PNG', optimize=True, compress_level=9)
                    operation = 'PNG 无损优化'
                else:
                    # 非展示用途的 WebP 不改变，避免影响运行时资源。
                    encoded.write(original)
                    operation = '保留非展示用途 WebP'
                candidate = encoded.getvalue()
                with Image.open(io.BytesIO(candidate)) as check:
                    check.load()
                    assert check.size == im.size, '图片尺寸发生变化'
                    if target.suffix == '.png':
                        assert check.convert('RGBA').tobytes() == im.convert('RGBA').tobytes(), 'PNG 像素变化'
                    else:
                        assert check.convert('RGBA').getchannel('A').tobytes() == im.convert('RGBA').getchannel('A').tobytes(), '透明度变化'
                dimensions = list(im.size)
        else:
            svg = ET.fromstring(original)
            # 含文本的 SVG 保留原样，避免改变文本空格语义。
            text_nodes = any(e.tag.rsplit('}', 1)[-1] in {'text', 'tspan', 'textPath', 'foreignObject'} for e in svg.iter())
            candidate = original if text_nodes else re.sub(rb'>\s+<', b'><', original).strip()
            ET.fromstring(candidate)
            operation, dimensions = 'SVG 清理标签间空白', None
        if len(candidate) < len(original):
            target.write_bytes(candidate)
            if target != file:
                replacements[file.name] = target.name
                file.unlink()
        else:
            target, candidate, operation = file, original, '已足够紧凑，保留原文件'
        rows.append({'文件': file.relative_to(output).as_posix(), '输出': target.relative_to(output).as_posix(), '原字节': len(original), '新字节': len(candidate), '尺寸': dimensions, '处理': operation})
    changed = []
    for file in sorted(output.rglob('*')):
        if not file.is_file() or file.suffix.lower() not in {'.md', '.yaml', '.yml', '.json', '.html', '.mjs', '.js', '.css'}:
            continue
        original = file.read_text(encoding='utf-8')
        updated = original
        for old, new in replacements.items():
            updated = updated.replace(old, new)
        if updated != original:
            file.write_text(updated, encoding='utf-8')
            changed.append(file.relative_to(output).as_posix())
    result = {'源目录': str(source), '输出目录': str(output), '质量': args.quality, '图片': rows, '引用更新': changed}
    report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'压缩失败：{error}', file=sys.stderr)
        sys.exit(1)
