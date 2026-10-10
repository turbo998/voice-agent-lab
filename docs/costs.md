# 成本核验与用量边界

官方来源：[Azure Retail Prices API](https://prices.azure.com/api/retail/prices)。
查询日期：2026-10-10；USD、Consumption、按区域过滤，每项一页、无截断。
零价格搜索结果或 MCP 错误都不是免费/不限量的证明。

## 本次核对的零售计量

| 区域 | 产品 / ARM SKU | Meter | 单位 | USD | 生效时间 |
|---|---|---|---|---|---|
| southindia | Azure OpenAI Media / Live 1 Gl | Live 1 Gl Unit | 1 Hour | 3.00 | 2026-09-01 |
| southeastasia | Azure OpenAI GPT5 / 54 mini Inp Dz | 5.4 mini Inp Dz 1M Tokens | 1M | 0.90 | 2026-06-01 |
| southeastasia | Azure OpenAI GPT5 / 54 mini Opt Dz | 5.4 mini Opt Dz 1M Tokens | 1M | 5.40 | 2026-06-01 |
| southeastasia | Azure OpenAI GPT5 / 54 mini cd Inp Dz | 5.4 mini cd Inp Dz 1M Tokens | 1M | 0.09 | 2026-06-01 |

上述四项均标记 `isPrimaryMeterRegion=true`。Meter ID 分别是：

- Live：`2e5b0a5c-3723-50a8-ba75-a5473f702fc1`
- Mini 输入：`4e88c12e-656a-5877-92e0-f2f60a52a88c`
- Mini 输出：`397c6f1b-d94d-572b-89b5-6da7615f016a`
- Mini 缓存输入：`ddab15c5-961e-5395-829e-34cf96b20e4c`

**这些是当前匹配的零售 meter，不是已部署 SKU 的完整计费证明。**
SEA 表内仅为 DataZone 命名，不能直接用作 GlobalStandard 的精确费率。
Live 1 Gl 与所选模型版本、部署 SKU、实际按会话小时计费的映射仍需核验；
推理单独计费，沉默/等待也可能计入语音时间。账单延迟与合同价格可能不同。
不以猜测值填写真实调用的 readiness/rate 字段。

## 预算设计

新增 Azure 月目标低于 USD 150；采用 Consumption Container Apps min 0 /
max 1、Standard_LRS 小存储、标准 Key Vault、受限日志、Search **Free**。
不用 PTU、AKS、GPU、Dedicated 或付费 Search Basic 自动兜底。
基础服务与网络成本尚未全部核验，不能把资源清单当作已获证的总价。

应用持久化预留：Live USD 10 / 60 分钟，推理 USD 20/月。
不确定请求保留预留与并发；Live 的 provider 过期窗口也需预留，不能只用
前端三分钟计时器声称 provider 硬限时。预算告警不是硬 cap，也不允许绕过
组织关机策略。新用途在映射/控制未证实时关闭。

Retell 独立试用门禁：USD 5 / 15 voice 分钟，USD 2 text，USD 3 保留，
每次最多三分钟；最近余额/无卡/无自动充值证据需要重新获取。
长上下文可能导致 Retell LLM 计费按 prompt token 比例放大，完整 voice/
model/add-on 上界未证实时不能仅用基础每分钟价启用。

本文由 GitHub Copilot 辅助编写；部署前需再次核验价格与实际限制。
