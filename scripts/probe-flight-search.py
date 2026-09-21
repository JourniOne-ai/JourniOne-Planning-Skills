#!/usr/bin/env python3
# 用途：按固定案例只读探测 TourMind 机场与航班查询，保存脱敏请求和响应。
# 参数：--cases 案例 JSON；--output 不存在的结果文件；--skill-dir 官方机票 Skill 目录；--timezone 用户时区。
# 输出：每项的执行状态、HTTP 状态与业务码；原始诊断保存在结果文件。
# 退出码：0=探测完成（含接口失败或缺凭证跳过），1=输入或执行环境错误。
# Known Issues: 仅测试机场和搜索，不创建订单、验证会话或支付；网络响应依赖供应商实时状态。无凭证时不发送受保护请求；受保护请求失败后停止该批后续搜索，凭证恢复交由官方 Skill 流程处理。
import argparse
import calendar
import datetime as dt
import json
from pathlib import Path
import sys
import time
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo

BASE = 'https://airxapi.hlzinterface.cn/skill/flight/v1/'


def validate_search(body, today):
    allowed = {'trip_type', 'flight_type', 'cabin_class', 'adults', 'children', 'infants', 'legs'}
    if set(body) - allowed:
        raise ValueError('搜索包含官方契约以外的参数')
    counts = [body.get(k) for k in ('adults', 'children', 'infants')]
    if any(type(v) is not int for v in counts) or counts[0] < 1 or counts[1] < 0 or not 0 <= counts[2] <= counts[0]:
        raise ValueError('须明确有效的成人、儿童、婴儿人数')
    if body.get('cabin_class') not in {'Y', 'C', 'F'} or body.get('flight_type') not in {'all', 'direct', 'transfer'}:
        raise ValueError('舱等或航班偏好无效')
    legs = body.get('legs', [])
    kind = body.get('trip_type')
    if not ((kind == 'one_way' and len(legs) == 1) or (kind == 'round_trip' and len(legs) == 2) or (kind == 'multi_city' and len(legs) >= 2)):
        raise ValueError('行程类型与航段数量不一致')
    latest = today.replace(year=today.year + 1, day=min(today.day, calendar.monthrange(today.year + 1, today.month)[1]))
    previous = today
    for leg in legs:
        if set(leg) != {'departure', 'arrival', 'departure_date'}:
            raise ValueError('航段字段不符合官方契约')
        for key in ('departure', 'arrival'):
            value = leg[key]
            if not isinstance(value, str) or len(value) != 3 or not value.isascii() or not value.isalpha():
                raise ValueError('须使用机场查询返回的三字代码')
        if leg['departure'].upper() == leg['arrival'].upper():
            raise ValueError('出发地和目的地不能相同')
        date = dt.date.fromisoformat(leg['departure_date'])
        if date.isoformat() != leg['departure_date'] or not previous <= date <= latest:
            raise ValueError('日期须为用户时区的今日至一年后，且各段日期不得递减')
        previous = date


def credential(base):
    for file in (base / 'skill_token.txt', base.parent / 'tourmind-booking' / 'skill_token.txt'):
        if file.is_file():
            value = file.read_text().strip()
            if value:
                return value if value.startswith(('uk_', 'sk_')) else None
    return None


def main():
    parser = argparse.ArgumentParser(description='只读测试 TourMind 航班接口')
    parser.add_argument('--cases', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--skill-dir', required=True)
    parser.add_argument('--timezone', required=True)
    args = parser.parse_args()
    output = Path(args.output)
    if output.exists():
        raise ValueError('结果文件已存在，不覆盖')
    cases = json.loads(Path(args.cases).read_text())
    zone = ZoneInfo(args.timezone)
    rows = []
    protected_stopped = False
    for case in cases:
        operation, body = case['operation'], case['request']
        if operation not in {'search_airports', 'search_flights'}:
            raise ValueError('本脚本只允许机场和航班只读查询')
        if operation == 'search_airports':
            if set(body) != {'keyword'} or not isinstance(body['keyword'], str) or not body['keyword'].strip():
                raise ValueError('机场查询只接受非空 keyword')
        else:
            validate_search(body, dt.datetime.now(zone).date())
        row = {'案例': case['name'], '接口': operation, '请求': body, '核验时间': dt.datetime.now(zone).isoformat()}
        token = credential(Path(args.skill_dir)) if operation == 'search_flights' else None
        if operation == 'search_flights' and (protected_stopped or token is None):
            row['状态'] = '未执行：前序受保护请求失败，需先处理' if protected_stopped else '未执行：缺少有效格式的已配置凭证'
        else:
            headers = {'Content-Type': 'application/json'}
            if token:
                headers['X-Skill-Token'] = token
            request = urllib.request.Request(BASE + operation, data=json.dumps(body).encode(), headers=headers)
            started = time.monotonic()
            try:
                with urllib.request.urlopen(request, timeout=60) as response:
                    row['HTTP'] = response.status
                    raw = response.read().decode()
            except urllib.error.HTTPError as error:
                row['HTTP'] = error.code
                raw = error.read().decode(errors='replace')
            except (urllib.error.URLError, TimeoutError) as error:
                raw = str(error)
                row['HTTP'] = None
            row['耗时毫秒'] = round((time.monotonic() - started) * 1000)
            if token:
                raw = raw.replace(token, '[已移除凭证]')
            try:
                row['响应'] = json.loads(raw)
            except json.JSONDecodeError:
                row['响应'] = {'诊断': raw}
            row['状态'] = '成功' if row.get('HTTP') == 200 and isinstance(row['响应'], dict) and row['响应'].get('code') == 0 else '失败'
            if operation == 'search_flights' and row['状态'] == '失败':
                protected_stopped = True
        rows.append(row)
        print(json.dumps({k: row[k] for k in ('案例', '状态', 'HTTP', '耗时毫秒') if k in row}, ensure_ascii=False))
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('x') as handle:
        json.dump(rows, handle, ensure_ascii=False, indent=2)
        handle.write('\n')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'探测失败：{error}', file=sys.stderr)
        sys.exit(1)
