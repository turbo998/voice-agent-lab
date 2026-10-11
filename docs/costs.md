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

### 原公共端点方案估算（已被实际网络治理阻塞，不计共享免费额度）

基础阶段不部署 app/job/model，语音和推理产生的使用费为零；
不把 S0 空账号当成已完成模型集成。官方零售查询另外匹配 SEA：
Analytics Logs ingestion USD2.99/GB（5GB 以上价格阶梯，保守忽略免费额度；
2018-02-01 生效）、Standard Key Vault Operations USD0.03/10K
（2015-08-01）、General Block Blob v2 Hot LRS USD0.02/GB/月、
写入 USD0.05/10K、读取 USD0.004/10K，Queues v2 Standard LRS
USD0.045/GB/月、Class1/Class2 USD0.004/10K。
这些产品/区域匹配行部分 `isPrimaryMeterRegion=false`，并非零价缺失；
HSM、证书续期、Key Rotation、Files、层次命名空间费用不是本方案用途。

| 完整运行阶段项目 | 保守月额 USD | 假设 |
|---|---:|---|
| 两个应用 CPU/内存 | 55.19 | 两个0.25CPU/0.5Gi副本连续730小时；无免费额度 |
| 队列任务 CPU/内存 | 27.60 | 一个0.25CPU/0.5Gi副本连续730小时上界 |
| 推理与 Live 预留 | 30.00 | 用途须另外验证后开启，不等于计费硬 cap |
| 日志 | 9.27 | 0.1GB/日 × 31日 × USD2.99；每日限额可能短暂超收 |
| Blob/Queue 容量及操作 | 2.00 | 合成小数据≤1GB、低频操作；不是存储服务硬 cap |
| Key Vault 操作 | 0.30 | 每月≤100K次，不使用HSM/付费轮换 |
| 网络、请求、治理差额及余量 | 13.42 | 需对新增政策强制服务再检查 |
| **合计** | **137.78** | 不超过150目标；不含不可预测/未批准的新服务 |

实际组织 modify Policy 已将新 Storage/KV 公网关闭。上述137.78估算不能
继续作为私网方案总价。当前是**部分基础设施部署，无应用/模型运行时**；
空环境/空账号、KV和小存储仍应监控实际账单，不是“从未部署”。
新的私网网络固定成本、现有环境状态和受限用量档见
[网络决策依据](network-decision.md)。2026-10-11批准的3PE/3DNS、
专用VNet/新外部Consumption环境已实际部署，原环境保留；Storage/KV
Disabled未覆盖。实际托管资源为1Standard Regional LB/2规则和1Static
IPv4；保留候选两IP估算的余量，后续部署应用再核对。
本次仅针对新lab RG的 ActualCost/MonthToDate 查询成功，返回0行、
无下一页；新资源账单延迟，因此不是USD0的证明，也不能据空数据推断
实际账单货币。随后实际Billing Property与预算currentSpend.unit均确认
USD；现已创建USD150月预算，筛选仅lab与其ACA托管RG（固定网络费用
不能漏算），Actual75/100/120金额通知已读回，各仅1位用户批准的私密
收件人。预算创建与配置验证不等于邮件已送达或费用硬cap。

Consumption-only 环境不选择 Dedicated、private endpoint 或 planned
maintenance；这些功能可能增加环境管理费。若组织要求新增这些功能或
付费 Search，先重新核算，不自动改 SKU、修改策略或绕过网络要求。
小流量估算不是对恶意客户端攻击的账单硬上限；告警与日志每日限额亦不是。

应用持久化预留：Live USD 10 / 60 分钟，推理 USD 20/月。
不确定请求保留预留与并发；Live 的 provider 过期窗口也需预留，不能只用
前端三分钟计时器声称 provider 硬限时。预算告警不是硬 cap，也不允许绕过
组织关机策略。新用途在映射/控制未证实时关闭。

Retell 独立试用门禁：USD 5 / 15 voice 分钟，USD 2 text，USD 3 保留，
每次最多三分钟；最近余额/无卡/无自动充值证据需要重新获取。
长上下文可能导致 Retell LLM 计费按 prompt token 比例放大，完整 voice/
model/add-on 上界未证实时不能仅用基础每分钟价启用。

本文由 GitHub Copilot 辅助编写；部署前需再次核验价格与实际限制。
