#!/usr/bin/env python3
# 用途：验证航班探测器日期、人数、认证和只读请求边界，不访问网络。
# 参数：无，使用 unittest 运行。
# 输出：测试结果。
# 退出码：0=通过，1=失败。
# Known Issues: 不验证供应商真实库存或交易。
import contextlib
import copy
import datetime as dt
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('probe', Path(__file__).resolve().parents[1] / 'scripts/probe-flight-search.py')
probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)


class ProbeTests(unittest.TestCase):
    def setUp(self):
        self.today = dt.date(2026, 9, 21)
        self.body = {'trip_type': 'one_way', 'flight_type': 'direct', 'cabin_class': 'Y', 'adults': 1, 'children': 0, 'infants': 0,
                     'legs': [{'departure': 'HKG', 'arrival': 'NRT', 'departure_date': '2026-10-20'}]}

    def test_inclusive_date_boundaries(self):
        for date in ('2026-09-21', '2027-09-21'):
            self.body['legs'][0]['departure_date'] = date
            probe.validate_search(self.body, self.today)

    def test_invalid_dates(self):
        for date in ('2026-09-20', '2027-09-22', '2027-02-29', '20/10/2026'):
            with self.subTest(date=date), self.assertRaises(ValueError):
                self.body['legs'][0]['departure_date'] = date
                probe.validate_search(self.body, self.today)

    def test_decreasing_round_trip(self):
        self.body['trip_type'] = 'round_trip'
        self.body['legs'].append({'departure': 'NRT', 'arrival': 'HKG', 'departure_date': '2026-10-19'})
        with self.assertRaises(ValueError):
            probe.validate_search(self.body, self.today)

    def test_real_passenger_counts(self):
        for counts in ((0, 1, 0), (1, 0, 2), (True, 0, 0), (1, -1, 0), (1, None, 0)):
            with self.subTest(counts=counts), self.assertRaises(ValueError):
                self.body.update(zip(('adults', 'children', 'infants'), counts))
                probe.validate_search(self.body, self.today)

    def test_kiwi_parameters_not_accepted(self):
        self.body['currency'] = 'CNY'
        with self.assertRaises(ValueError):
            probe.validate_search(self.body, self.today)
        del self.body['currency']
        self.body['cabin_class'] = 'M'
        with self.assertRaises(ValueError):
            probe.validate_search(self.body, self.today)

    def test_invalid_primary_does_not_fall_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp) / 'flight-booking-ai'
            hotel = base.parent / 'tourmind-booking'
            base.mkdir(); hotel.mkdir()
            (hotel / 'skill_token.txt').write_text('uk_test_fixture')
            self.assertEqual(probe.credential(base), 'uk_test_fixture')
            (base / 'skill_token.txt').write_text('invalid_fixture')
            self.assertIsNone(probe.credential(base))

    def run_cases(self, cases, credential=None, response=None):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / 'cases.json'; out = Path(tmp) / 'result.json'
            src.write_text(json.dumps(cases))
            argv = ['probe', '--cases', str(src), '--output', str(out), '--skill-dir', tmp, '--timezone', 'Asia/Shanghai']
            with patch('sys.argv', argv), patch.object(probe, 'credential', return_value=credential), patch.object(probe.urllib.request, 'urlopen', return_value=response) as network, contextlib.redirect_stdout(io.StringIO()):
                probe.main()
                return json.loads(out.read_text()), network.call_count

    def future_case(self):
        body = copy.deepcopy(self.body)
        body['legs'][0]['departure_date'] = (dt.datetime.now(probe.ZoneInfo('Asia/Shanghai')).date() + dt.timedelta(days=10)).isoformat()
        return {'name': '固定测试', 'operation': 'search_flights', 'request': body}

    def test_no_credential_never_sends_search(self):
        rows, calls = self.run_cases([self.future_case()])
        self.assertEqual(calls, 0)
        self.assertTrue(rows[0]['状态'].startswith('未执行'))

    def test_transactions_rejected(self):
        with self.assertRaises(ValueError):
            self.run_cases([{'name': '拒绝交易', 'operation': 'create_booking', 'request': {}}])

    def test_business_failure_stops_batch_and_redacts(self):
        response = io.BytesIO(b'{"code":20105,"message":"uk_test_fixture"}')
        response.status = 200
        rows, calls = self.run_cases([self.future_case(), self.future_case()], credential='uk_test_fixture', response=response)
        self.assertEqual(calls, 1)
        self.assertEqual(rows[0]['状态'], '失败')
        self.assertTrue(rows[1]['状态'].startswith('未执行'))
        self.assertNotIn('uk_test_fixture', json.dumps(rows))


if __name__ == '__main__':
    unittest.main()
