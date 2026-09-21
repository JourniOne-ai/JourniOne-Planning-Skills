# 价格展示币种契约

## 目的

为航班、酒店、活动和路书预算确定唯一展示币种。Card Visual、预订页、Travel Journal 网页 与 PDF 必须读取同一个 `trip_meta.display_currency`，不得各自判断。

供应商原币和原始金额始终保留。展示币种只影响换算后的主价格，不覆盖原始报价。TourMind 机票搜索 DTO 没有 `currency` 参数，不传入 Kiwi 字段；采用返回币种，在 Journal 需要时按已核验汇率显示参考换算及来源时间。验价、订单和支付始终保留供应商原币，不能用参考换算价替代。

## 决策顺序

按以下顺序选择，命中后停止：

1. **用户明确指定**：用户说“用欧元显示”“全部换算成人民币”，或明确给出预算币种时，采用用户指定币种。
2. **可确定的出发地**：
   - 香港出发 → `HKD`
   - 日本出发 → `JPY`
3. **用户提问所用语言**：
   - 中文提问 → `CNY`，对外可写“人民币”或 `RMB`
   - 英文提问 → `USD`
4. **默认值**：以上都不能确定时使用 `USD`。

出发地规则优先于对话语言。例如中文提问但明确从香港出发，展示币种仍为 `HKD`。

葡萄牙语、西班牙语及其他无法唯一映射国家和币种的语言，不得仅凭语言推断 `BRL`、`EUR`、`MXN` 等币种。用户没有指定、出发地也不能确定时使用 `USD`；用户之后提出币种要求，再按要求转换。

## 用户修改

用户随时可以改变展示币种。收到明确要求后：

1. 将 `trip_meta.display_currency` 更新为用户指定的 ISO 4217 代码。
2. 将 `trip_meta.display_currency_source` 更新为 `user_explicit`。
3. 保留每项服务的 `source_amount` 和 `source_currency`。
4. 使用同一汇率服务重新计算展示金额。
5. 通过 TripPatch 更新同一 Trip 和固定 Preview Link，不创建新 Trip。

币种别名规范化：

| 用户表达 | 数据代码 |
| --- | --- |
| 人民币、RMB、¥（明确指人民币） | `CNY` |
| 美元、美金、US Dollar | `USD` |
| 港币、港元、HK Dollar | `HKD` |
| 日元、日币、Japanese Yen | `JPY` |

符号 `¥` 同时可能指人民币或日元。无法结合用户明确文字、出发地或上下文消除歧义时，不单独依赖符号判断。

## Snapshot 字段

Skill 冻结 Snapshot 时写入：

```json
{
  "conversation_language": "zh",
  "trip_meta": {
    "display_currency": "HKD",
    "display_currency_source": "origin"
  }
}
```

`display_currency_source` 允许：

- `user_explicit`
- `origin`
- `conversation_language`
- `default`

`conversation_language` 表示用户提问语言，不等同于用户要求的路书输出语言。中文提问并要求输出英文路书时，如果没有更高优先级条件，展示币种仍为 `CNY`。

## 换算与展示

- 汇率换算由服务端完成，保存 Provider、汇率和 `observed_at`。
- 主金额明确标注“总价”，并说明覆盖人数、房间数、晚数以及税费口径。
- Card Visual、预订页、H5 与 PDF 不重复计算汇率。
- 当日汇率过期或不可用时，保留供应商原币，标记待刷新，不编造换算金额。
