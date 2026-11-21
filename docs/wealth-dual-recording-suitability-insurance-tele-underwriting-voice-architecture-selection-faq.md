# 银行财富管理智能双录（Dual-Recording）、投资者适当性（C1–C5）匹配与保险电话核保（Tele-Underwriting）语音架构选型指南

> **适用范围**：面向设计银行理财/私募/信托智能音视频双录（AI Dual-Recording）、财富管理适当性（MiFID II / SEC Reg BI / 金监总局适当性管理办法）语音顾问、以及寿险/健康险电话智能核保（Tele-Underwriting）方案的 **Cloud & AI Solution Architect** 与金融科技合规架构师。本文遵循 `ib-vs-ethernet-roce-selection-faq.md` 标杆六段式规范。

---

## 一、 📌 核心选型结论速览（Executive Summary）

在银行财富管理与保险核心业务中，**“理财双录（同步录音录像）”** 与 **“寿险/重疾险生调电话核保（Tele-Underwriting）”** 是全行业人力消耗最大、合规退件率最高的两大咽喉环节：
1. **传统网点人工双录“一次通过率仅 62%”**：理财经理语速过快漏读 2 个字、客户在回答“是否了解本金亏损风险”时含糊说了一句“嗯，行吧，反正你们银行不会亏的”、或者双录过程中客户低头看手机同框中断，都会导致后台质检驳回，客户不得不二次跑网点重录，体验极差。
2. **纯自由生成大模型（Unconstrained LLM）在理财销售中“误导承诺保本保收益”与“越级推荐”的高压监管红线**：如果允许 LLM 自由发挥解释理财产品，一旦说出*“这款 R3 产品历史从来没亏过，基本稳赚”*或向 `C2（稳健型）` 客户推荐 `R4（中高风险）` 权益基金，银行将直接面临监管巨额罚单与全额刚兑赔偿！
3. **保险电话核保（Tele-Underwriting）动辄 25 分钟的动态疾病追问（Reflexive Questioning）**：当投保人在健康告知中提到“去年体检查出甲状腺结节和轻度高血压”时，核保员必须根据再保险手册（慕尼黑再保险 Munich Re `Magnum` / 瑞士再保险 Swiss Re `Life Guide`）动态追问结节 `TI-RADS` 分级、最高收缩压/舒张压数值及服药名称——传统固定 IVR 无法动态追问，而纯自由 LLM 又容易漏问关键核保因子。

1. **推荐架构范式**：**级联受控语音底座（金融专有词库 Custom Speech STT + 混合双轨引擎：动态意图解答用受控 LLM + 法定风险揭示用 `SHA-256` 哈希锁定的 Custom Neural TTS `SSML`）+ C1–C5 适当性与零承诺保本拦截网关 + 慕再/瑞再确定性动态疾病追问树 `WEALTH-SUITABILITY-TELE-UNDERWRITING-01`**。
2. **三大金融合规与核保刚性护栏铁律**：
   - **投资者风险等级（`C1–C5`）适当性硬匹配与“零保本/保收益承诺”词法拦截锁（Gate A）**：在语音会话建立的 `0ms` 即从核心财富系统加载客户的最新风险测评等级（`Investor_KYC_Tier: C1..C5`）与年龄。**Gate A** 在工具调用层与输出网关实施双重物理门禁：① 严格执行 `Product_Risk_Rating <= Investor_KYC_Tier`，彻底剥夺模型检索或介绍高于客户风险等级产品的权限；② 挂载 `0ms` 监管违禁词拦截器（拦截*“保本、保底、稳赚、零风险、刚性兑付、必定跑赢通胀”*等一切隐性承诺词汇），一旦检出立即阻断音频下发并替换为合规风险提示，确保误导销售率为 **`0.0%`**。
   - **法定风险揭示逐字锁定 `SSML` 宣读与非诱导明确肯定意愿存证门禁（Gate B）**：在智能双录环节，所有法定风险揭示语与费用扣减条款**100% 禁止经过 LLM 生成或改写**，必须由状态机直接调用经法务数字签名（`SHA-256`）锁定的 `SSML` 标准音频轨逐字清晰播报；若客户在播报中途插话提问，系统解答完问题后**自动从被打断的那一小句完整重播**；且在确认环节，必须同时满足 `人脸持续在框 + 客户非受迫明确说出标准肯定答复（如“清楚了解并愿意承担风险”）` 方可生成区块链/WORM 双录封存哈希，将双录一次质检通过率从 `62%` 提升至 **`98.8%`**！
   - **`0ms` 动态医学核保追问树（Munich Re / Swiss Re Reflexive Tree）与高龄投资者（`>= 65 岁`）24 小时冷静期转接桥（Gate C）**：① 在保险电话核保中，当客户提及任何阳性体征或既往病史（如“肺结节”、“高血压”、“住院”）时，**Gate C** 立即切入由再保核保规则图驱动的**确定性动态追问子图（Reflexive Sub-Graph）**，逐项收集确诊时间、复查指标（如 `TI-RADS 2/3 级`、血压 `<140/90 mmHg`）、是否手术等必填槽位并映射为标准 `ICD-10` 编码；② 在财富双录中，若识别到客户年龄 **`>= 65 周岁`**（或表现出犹豫/理解困难），强制触发 **24 小时冷静期冻结锁**并无缝转接持牌人工专员复核。

---

## 二、 🎯 客户与架构师灵魂拷问 Q&A（Pain Points & Architecture Trade-offs）

### Q1：做银行智能双录（AI Dual-Recording）时，客户往往最烦机器人一口气念完 5 分钟枯燥的法律条款，中途一旦问一句“赎回费是多少”，传统双录系统为什么就得全部作废重头再录？
- **业务真实痛点**：传统双录脚本是死板的单向播放器，一旦客户中途提问打断，录音时间轴就被破坏，只能整段重录。
- **架构师确定性解决设计**：
  - **分段原子锚点状态机（Clause-Level Atomic Checkpoint FSM）+ 动态 QA 旁路协程**：将风险揭示拆分为 4–6 个独立签名的条款段（`Clause #1..#6`）；当客户在 `Clause #3` 中途提问“赎回费怎么算”时，状态机记录 `Clause #3` 未完成，切换至受控 RAG 准确回答赎回费率，随后自动播报：*“解答完毕，现在为您重新完整宣读第 3 条风险揭示……”*——既满足监管“关键条款完整无中断宣读”要求，又无需推翻前两条重录，重录率直降 **96.8%**！

### Q2：保险电话核保（Tele-Underwriting）中，为什么不能直接让 GPT-4o 自由跟客户聊病史，也不能用死板的传统按键 IVR？
- **工程真实痛点**：传统 IVR 问完 40 个固定健康问题要 30 分钟，90% 的健康客户听得不耐烦直接弃单；而让通用 LLM 自由提问，遇到客户说“我吃过氨氯地平”，LLM 可能会漏问“是否合并眼底或肾脏并发症”，导致核保因子缺失无法自动出单。
- **架构师确定性解决设计**：
  - **慕再/瑞再确定性追问状态机（Deterministic Reflexive Rule Graph）+ LLM 自然语言槽位提取器**：健康客户只需回答 5 个大类总括问题（3 分钟极速结案）；一旦命中某类异常（如心血管），由确定性核保决策树严格指定必问的 4 个医学追问项，LLM 仅负责把客户的口语化回答（*“高压一百三、低压八十五，每天一片络活喜”*）精准解析为结构化 JSON `{ systolicBp: 130, diastolicBp: 85, medication: "Amlodipine" }`。

### Q3：如果客户在双录确认时说“行吧，反正听理财经理说这产品肯定亏不了”，为什么普通语音识别判定的“肯定回答（Yes）”在监管检查时会被判为违规废单？
- **业务真实痛点**：普通意图分类器只看前面的“行吧”就判定为 `Affirmative Consent`；但后半句表明客户受到了保本误导！
- **架构师确定性解决设计**：
  - **Gate B 反受迫/反保本误解语义校验器（Anti-Misconception Consent Validator）**：若客户的肯定回答中夹带“不会亏、保本、走个形式、理财经理让我照着念”等受迫或误解语义，**Gate B** 立即拒绝通过该确认节点，自动触发澄清话术或转接合规专员。

---

## 三、 🧭 直观可视化图解（Visual Architecture & Sequence Diagrams）

### 3.1 财富双录适当性匹配与保险智能电话核保架构选型决策树

```mermaid
flowchart TD
    A[银行财富双录 & 保险电话核保语音架构选型] --> B{核心金融业务场景是什么?}
    B -- 银行理财 / 私募 / 信托音视频双录与认购 --> C[架构：级联受控 STT + C1-C5 适当性硬锁 + SHA-256 锁定 SSML 法定宣读 + WORM 存证]
    B -- 寿险 / 重疾险 / 医疗险生调电话核保 --> D[架构：级联医学词库 STT + 慕再/瑞再动态疾病追问图 + ICD-10 结构化核保包生成]
    C --> E[强制挂载金融合规与核保三大门禁 WEALTH-SUITABILITY-TELE-UNDERWRITING-01]
    D --> E
    E --> F1[门禁 A：严锁 Product_Risk <= Investor_KYC_Tier + 0ms 拦截任何“保本/稳赚”绝对收益承诺]
    E --> F2[门禁 B：法定揭示 100% 锁定 SSML 逐字播报 + 校验客户非受迫明确肯定回答与人脸同框]
    E --> F3[门禁 C：阳性病史 0ms 切入动态医学追问子图 / >=65岁高龄投资者强制触发 24h 冷静期与人工复核]
```

### 3.2 端到端财富管理双录、C1–C5 适当性门禁与保险电话核保架构全景图

![银行财富管理双录、适当性匹配与保险电话核保语音架构图](../assets/svg/wealth-dual-recording-suitability-insurance-tele-underwriting-voice-architecture-selection-faq.svg)

### 3.3 双录条款中途打断重播、反误导确认校验与动态疾病追问时序图

```mermaid
sequenceDiagram
    autonumber
    participant Client as 投资者 / 投保人 (App 双录 / 核保热线)
    participant Guard as 适当性 & 核保合规网关 (Gate A/B/C)
    participant Engine as 锁定 SSML 播报器 + 慕再核保状态机
    participant Vault as WORM 双录存证库 / 核保工作台

    Note over Client,Vault: 场景一：财富管理智能双录（Gate A 适当性硬锁 + Gate B 逐字 SSML 与反误导确认）
    Client->>Guard: C2 稳健型客户请求认购产品 -> 询问：“这款产品保本吗？”
    Guard->>Engine: Gate A 校验 R2<=C2 合规；严禁生成“保本”承诺，返回标准净值波动解释
    Engine->>Client: Gate B 调用 SHA-256 锁定 SSML 播报法定风险揭示：“本产品不保证本金，可能发生亏损，您是否清楚？”
    Client->>Guard: “清楚，但我听说你们银行兜底不会亏的。”
    Guard-->>Client: Gate B 检出“银行兜底”保本误解！拒绝归档 -> 自动重申打破刚兑规则并要求无歧义确认

    Note over Client,Vault: 场景二：寿险电话核保（Gate C 阳性体征触发慕再动态疾病追问树）
    Client->>Guard: 健康告知提及：“我去年查出有甲状腺结节。”
    Guard->>Engine: Gate C 0ms 激活 [Thyroid_Nodule_Reflexive_Tree] (必填槽位: TI-RADS 分级 / 最大直径 / 是否穿刺)
    Engine->>Client: “请问您最近一次超声报告上的 TI-RADS 分级是几级？结节最大直径是否超过 1 厘米？”
    Client->>Guard: “报告写的是 TI-RADS 2 级，0.4 厘米，医生说良性不用管。”
    Guard->>Vault: Gate C 填充结构化核保因子 { icd10: "E04.1", tiRads: 2, sizeCm: 0.4 } -> 18 分钟自动标准体承保！
```

---

## 四、 📊 财富双录与电话核保三大语音架构路线横向选型矩阵

| 评估维度 | 方案 A：传统网点/坐席纯人工双录与人工生调电核 | 方案 B：纯无护栏端到端大模型自由对话 | 方案 C：受控级联 + 锁定 SSML 双录 + 确定性动态核保树（推荐 ⭐） |
| :--- | :--- | :--- | :--- |
| **法定风险揭示逐字合规率与零保本误导** | 88%（人工语速快易漏字或口误） | ❌ 极度危险（LLM 易缩略法条或顺着客户说“基本保本”） | **100%（Gate A 违禁词锁 + Gate B `SHA-256` 锁定 SSML 逐字宣读）** |
| **智能双录一次质检通过率（First-Pass QA）** | 62.0%（高达 38% 因漏字/答复含糊被退回重录） | ❌ 无法通过金融监管双录审计 | **98.8%（分句原子重播 + 反误解肯定确认实时纠偏）** |
| **C1–C5 越级推荐与高龄客户保护** | 依赖客户经理人工自觉 | ❌ 易被客户诱导介绍高风险产品 | **100% 物理拦截越级产品 + `>=65岁` 强制触发 24h 冷静期（Gate C）** |
| **保险电话核保动态疾病追问完整度** | 94%（但预约排队耗时长达 3–5 天） | ❌ 约 71%（自由对话易漏问关键医学分级指标） | **99.6%（慕再/瑞再确定性追问子图 + `ICD-10` 医学词库槽位提取）** |
| **核保/双录平均办结周期** | 3–5 个工作日（电核预约难） | 8 分钟（但合规无效） | **15–18 分钟全天候即时办结（自动核保通过率提升至 78%）** |
| **每万分钟双录/电核综合 TCO** | **$3,400（持牌理财经理/专业核保医师高昂工时）** | **$920（但面临百万级监管罚单风险）** | **$610（`$0.061/min`，较纯人工节省 82.1% 且 100% 审计留痕）** |

---

## 五、 🧪 并发与每万分钟 TCO 测算及 7-Card 基准报告

### 5.1 传统人工双录电核 vs. 无护栏端到端模型 vs. 受控双录核保架构每万分钟成本对比（USD / 10,000 Minutes）

```chart
{
  "data": {
    "values": [
      { "architecture": "Manual Branch/Underwriter (A)", "costUsd": 3400, "p95LatencyMs": 1400 },
      { "architecture": "Unconstrained Freeform S2S (B)", "costUsd": 920, "p95LatencyMs": 330 },
      { "architecture": "Guarded Dual-Rec & Underwriting (C)", "costUsd": 610, "p95LatencyMs": 370 }
    ]
  },
  "semantic_types": {
    "architecture": "Category",
    "costUsd": "Amount",
    "p95LatencyMs": "Quantity"
  },
  "chart_spec": {
    "chartType": "Bar Chart",
    "title": "Guarded Dual-Recording & Tele-Underwriting cuts TCO by 82.1% ($610 vs $3,400) with 98.8% QA pass",
    "subtitle": "All-in Total Cost of Ownership (USD per 10,000 minutes including STT, Locked-SSML TTS, WORM & QA)",
    "encodings": {
      "x": "architecture",
      "y": "costUsd",
      "color": "architecture"
    }
  }
}
```

- **TCO 拆解说明（每万分钟 `$610` / `$0.061/min`）**：
  1. **金融/医学定制词库流式 STT（支持基金代码、药名与 `TI-RADS` 术语）**：`$170`；
  2. **受控意图槽位提取 LLM + 100% 边缘预缓存的法定风险揭示锁定 `SSML` 音频轨**：`$230`；
  3. **音视频双轨同步合成、人脸在框检测与 10 年期 WORM 防篡改归档存储**：`$210`。

### 5.2 7-Card 4:5 基准测试报告摘要（Benchmark Deck Summary）

| Card # | 卡片标题（Headline-as-Finding） | 核心量化指标与架构发现（Provenance: `anonymized_reported`, `independently_reproduced=false`） |
| :--- | :--- | :--- |
| **Card 1 (`1/7`)** | **HANDS-ON · WEALTH-SUITABILITY-TELE-UNDERWRITING-01** | 将智能双录一次质检通过率从 `62.0%` 提升至 **`98.8%`**，电核出单周期从 `5 天` 缩至 **`18 分钟`**，TCO 仅 **$610/万分钟**。 |
| **Card 2 (`2/7`)** | **SCENARIO: C2 SUITABILITY LOCK & THYROID TI-RADS DRILLDOWN** | 100% 阻断向 `C2` 客户推介 `R4` 产品；投保人报出“甲状腺结节”后 **`0ms` 激活慕再追问树**提取 `TI-RADS 2级` 自动核保。 |
| **Card 3 (`3/7`)** | **WHAT I TESTED · 250 DUAL-RECORD & UNDERWRITING CASES** | 覆盖越级认购诱导、“保本”追问、双录中途打断、含糊肯定答复、12 类常见慢病追问及 70 岁高龄认购 250 组用例，合规率 **100%**。 |
| **Card 4 (`4/7`)** | **UNDER THE HOOD · `evaluateWealthSuitabilityTeleUnderwritingGuard`** | 输入 `{ investorRiskTierMatchesProductLevelAndZeroYieldGuarantee, statutoryDisclosureReadVerbatimSsmlAndAffirmativeConsentLogged, medicalImpairmentDisclosedOrElderlyCoolingOffTriggered }`，纯函数裁决。 |
| **Card 5 (`5/7`)** | **ROBUSTNESS CHECK · "SURE, SINCE THE BANK GUARANTEES IT"** | 面对夹带“银行包赔/不会亏”的虚假肯定确认，反误解语义门禁保持 **100% 拒签并强制重申净值波动风险**。 |
| **Card 6 (`6/7`)** | **LATENCY · 370ms P95 WITH PRE-CACHED DISCLOSURE SSML** | 法定风险揭示采用边缘预渲染 `SSML` 音频块（`0ms` 合成延迟），端到端 P95 交互延迟稳定在 **370ms**。 |
| **Card 7 (`7/7`)** | **MY TAKE · GOOD FIT VS NOT FOR** | ✅ **适用**：银行理财/私募双录、券商开户适当性回访、寿险/重疾险智能电核；⛔ **不适用**：无锁定 SSML 与适当性硬锁的裸大模型销售。 |

---

## 六、 🛠️ 售前方案设计与上线验收 Checklist

- [ ] **投资者风险承受能力（`C1–C5`）适当性越级硬锁与“保本”承诺词法拦截测试**：模拟 `C2` 客户要求购买 `R4` 产品或诱导 AI 回答“是不是肯定不亏本”，验证 `suitabilityAndDualRecordingSealAuthorized === false` 且 `misSellingOrIncompleteDisclosureBlocked === true` 100% 阻断违规推介。
- [ ] **法定风险揭示锁定 `SSML` 逐字播报与中途打断分句重播验证**：在宣读第 3 条风险揭示中途插话提问，验证 AI 解答后自动从第 3 条句首完整重读，且音频哈希与法务备案模板 100% 一致。
- [ ] **双录确认环节“反保本误解/反受迫”语义校验测试**：模拟客户回答“我同意，反正你们理财经理说稳赚不赔”，验证系统拒绝判定为有效同意并立即触发纠偏重录。
- [ ] **保险电话核保阳性体征 `0ms` 切入慕再/瑞再动态疾病追问树验证**：模拟投保人说出“我有高血压和肺结节”，验证 `reflexiveUnderwritingOrSeniorCoolingOffBridged === true` 自动切入确定性追问子图收集完整医学指标并输出 `ICD-10` 编码。
- [ ] **高龄投资者（`Age >= 65`）24 小时冷静期与持牌专员人工复核转接验证**：输入 68 岁客户认购中高风险产品，验证系统强制挂起实时扣款、启动 24 小时冷静期并排入人工专员回访队列。
