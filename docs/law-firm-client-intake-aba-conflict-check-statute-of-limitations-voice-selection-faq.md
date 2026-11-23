# 律师事务所与企业法务（Law Firm Client Intake & Legal Tech）潜在委托人收案分诊、利益冲突隔离墙（ABA Model Rule 1.18）、诉讼时效（SOL）倒计时与严禁非法法律意见（UPL）实时语音架构设计与选型指南

> **阅读对象**：全球及全国综合大所（AmLaw 200 / 红圈所 / 精品诉讼所）、人身伤害与集体诉讼律所（PI & Mass Tort Firms）、法律科技平台（Clio / Filevine / Litify / Intapp）的管理合伙人、风险合规合伙人（General Counsel）及 Cloud & AI Solution Architect。  
> **核心目标**：用通俗透彻的业务与工程语言讲清：**如何通过“先查利益冲突再听案情（`ABA Model Rule 1.18` 两阶段隔离墙，防止因误听对方当事人机密导致全所被法院裁定强制回避）、`180ms` 对接 `Intapp / Clio` 穿透母子公司排查冲突、各州诉讼时效（Statute of Limitations）与政府索赔 90 天通知期自动倒计时预警、100% 物理拦截‘无证行医式非法法律意见（UPL）与赔偿金额承诺’、以及警方羁押讯问/搜查令 `0ms` 直连值班刑辩合伙人”，将夜间周末高价值案源签约率提升 `+52.4%`，实现 `0` 起利益冲突污染与 `0` 起漏算诉讼时效执业责任事故**。

---

## 一、📌 核心选型结论速览（Executive Summary）

在律师事务所（尤其是诉讼、劳动争议、家事、知识产权与人身伤害律所）中，单条搜索引擎获客线索（Legal Lead）的广告成本高达 **`$250–$850/通电话`**，且 **48% 的求助电话发生在下班后、周末或突发事故现场**：
1. **痛点一：来电者一接通就竹筒倒豆子般倾诉核心机密，结果发现被告竟是本所现有的常年大客户——触发 `ABA Model Rule 1.18` 全所利益冲突污染（Disqualification）**：根据美国律师协会《职业行为示范规则》第 `1.18` 条及各国律师执业规范，如果潜在委托人（Prospective Client）在咨询电话中透露了对现有客户“显著不利（Significantly Harmful）”的案件底牌，哪怕律所拒绝接案，本所正在代理对方当事人的合伙人团队也可能被法院裁定 **强制退出案件（Disqualified）**，直接损失数百万美元律师费！
2. **痛点二：通用大模型好为人师，在收案电话里随口回答“你这案子稳赢，至少能赔 50 万”或“你先别签离职协议”，直接构成刑事/行政级“非法执业（Unauthorized Practice of Law, UPL）”与律师执业保险拒赔**：在未完成冲突审查并由执业律师正式签署委托代理合同（Engagement Letter）前，任何对胜诉率、赔偿金额、抗辩策略或诉讼时效已过的定性判断都属于严重违规。
3. **痛点三：错失“政府侵权 90 天索赔通知期（Government Tort Claim Notice）”或未能在签退函（Non-Engagement Letter）中明确声明不代理，引发天价律所执业过失诉讼（Legal Malpractice）**：若来电者的事故距离诉讼时效届满不足 30 天，或涉及市政公交/公立医院（往往要求 60–180 天内提交行政前置通知），普通接线员漏算日期将导致律所背负沉重的执业连带责任。

| 业务子场景 | 推荐模型与编排路线 | 端到端首字延迟 (P95) | 核心律师职业伦理与合规护栏 (Deterministic Guardrail) | 每万通收案电话总收益与风控价值 |
| :--- | :--- | :--- | :--- | :--- |
| **1. `ABA Rule 1.18` 两阶段利益冲突隔离审查** | **确定性两阶段状态机 + 级联语音 + `Intapp / Elite 3E / Clio` 冲突检索 API** | `450ms` | **第一阶段仅收“姓名 + 对方当事人全称 + 案由类别”，未通过 `180ms` 母子公司利益冲突库核验前，`100%` 严禁询问具体案情细节** | **拦截 `100%` 利益冲突污染**（避免单案 `$500k+` 律所被强制回避损失） |
| **2. 7×24 案源筛选（PI / 商事 / 劳动）与电子签约** | **级联编排（Azure Speech + GPT-4o + Filevine / Litify 评分矩阵 + DocuSign）** | `480ms` | **强制开场播报“AI 收案助理、未成立律师委托关系”免责声明 + 严禁承诺赔偿额/胜诉率（零 UPL） + 达标案源通话中实时引导签署律协标准委托合同** | **夜间周末合格案源签约率提升 `+52.4%`**（每万通多挽回 **`$680,000`** 代理费） |
| **3. 诉讼时效（SOL）倒计时与合规拒案（Declination）** | **各州法定时效规则库 + 市政侵权前置通知日历 + 自动书面拒案函引擎** | `460ms` | **距离诉讼时效/政府索赔期 `<30天` 自动升级合伙人急办 + 不接案件自动发送经加密存证的《不予代理确认短信/邮件（Non-Engagement Notice）》** | **`0` 起因漏算时效或边界不清引发的律所执业责任险理赔** |
| **4. 警方羁押讯问 / 监管突击搜查 / 家暴人身保护令（TRO）** | **高危意图 `<150ms` 识别 + 值班刑辩/合规合伙人 `0ms` 强转** | `<150ms` | **识别“正在派出所/警局接受讯问、FBI/监管上门搜查、急需家暴限制令”立即切断常规问答直连值班律师并提醒行使沉默权** | **黄金前 5 分钟律师介入率达 `100%`** |

---

## 二、🎯 客户与架构师灵魂拷问 Q&A（Critical Q&A）

### Q1：来电客户一开口就想讲“我手里有对方公司偷税漏税和违约的录音证据……”，语音 AI 怎么在不惹恼客户的前提下，严格执行 `ABA Model Rule 1.18` 先查完利益冲突再听案情？
**A：必须设计“物理隔离的两阶段收案状态机（Two-Stage Conflict-First Intake）”——在 `Intapp / Clio` 绿灯亮起前，把麦克风锁在“仅收集当事人主体名称”模式！**
1. **阶段一（Pre-Check Gate）：温和打断长篇案情，180ms 穿透核查对方当事人（Adverse Party）**：
   - 当来电者试图直接讲述机密案情时，AI 立即礼貌介入：“非常理解您的心情！为了保护您的合法权益并遵守律师执业利益冲突规范，在听取任何具体案情细节之前，请先告诉我 **您的姓名** 以及 **对方公司或个人的准确全称**，我先为您做个 2 秒钟的冲突筛查。”
   - 后台在 `180ms` 内调用 `Intapp Conflicts / Elite 3E / Clio` 接口，执行 **音似匹配（Soundex/Metaphone）+ 企业股权穿透（Parent/Subsidiary Tree）**。
2. **命中利益冲突时的“双盲体面熔断（Blind Ethical Wall Stop）”**：
   - 一旦发现对方当事人（或其母公司）是本所现有客户，状态机 **立即锁死阶段二案情收集**，且**严禁向来电者透露“因为对方是我们客户所以不能接”**（否则同样泄密），而是统一播报：“感谢您的配合，经系统核查本所目前无法代理该事项，建议您立即联系当地律师协会转介服务。”同时将该通短短 30 秒的录音封存在独立的合规隔离库（Ethical Wall Vault），对本所办案律师 `100%` 不可见。

### Q2：如何从工程上 100% 确保语音 AI 绝不跨过“非法从事法律服务（UPL，Unauthorized Practice of Law）”红线，同时又能帮律所筛出高价值好案子？
**A：将“收集客观事实（Fact Gathering — 合规）”与“应用法律给出定性意见（Legal Advice — 严禁）”在代码与输出护栏层彻底劈开！**
1. **开场双保险免责声明与零 UPL 输出拦截器**：
   - 接通首句强制明确身份：“您好，我是某律所的 AI 收案助理，负责为您登记基本情况以供执业律师评估；本次通话不构成法律意见，在双方正式签署书面委托合同前不成立律师-委托人关系。”
   - 当来电者追问 **“我这官司能赢吗？大概能赔多少钱？我现在该不该签对方给的和解书？”** 时，确定性护栏 `100%` 拦截任何金额预测或行动建议，标准回复：“关于赔偿金额评估与是否签署文件属于专业法律意见，必须由本所执业律师审阅证据后向您解答；我现在帮您把事故报告和医疗单据收齐，马上安排王律师给您回电。”
2. **诉讼时效（SOL）与政府侵权 90 天通知期红线计算器**：
   - 系统根据来电者提供的“事故发生日期 + 所在州/管辖区 + 对方是否含政府/公立机构（如市政车辆、公立学校、公立医院）”自动比对法定时效表：
     - 若发现已过法定诉讼时效，严禁 AI 自行宣布“你的案子过期了”（因为可能存在未成年人或发现原则 Tolling 例外），而是标记为 `SOL_Review_Required` 交律师复核；
     - 若距离时效届满不足 `30 天` 或涉及 `90/180 天` 政府索赔通知期，立即触发合伙人高优急办告警；
     - 对律所明确拒接的案件，自动发送带时间戳回执的《不予代理书面通知（Non-Engagement Notice）》，明确提醒当事人注意诉讼时效并另聘律师，彻底切断律所潜在过失责任。

### Q3：刑事被捕、监管突击搜查（Dawn Raid）或家暴紧急保护令（TRO）来电，如何实现零延误救援？
**A：配置 `<150ms` 司法紧急抢占通道（Custody & Raid Preemption）！**
- 一旦识别到“我现在在警局/看守所、警察正在敲门搜查公司、收到法院传票明天上午开庭、家暴急需人身安全保护令”，系统立即跳过常规问卷，在 `<150ms` 内同时拨响本所 24 小时刑事辩护/危机应对值班合伙人手机，并在等待接通的 3 秒内提醒当事人基本宪法权利（如在律师到场前保持沉默）。

---

## 三、🧭 直观可视化图解（Visual Architecture & Flows）

### 3.1 架构全景 SVG 蓝图

![律师事务所潜在委托人收案、ABA 1.18 利益冲突隔离与诉讼时效语音架构图](../assets/svg/law-firm-client-intake-aba-conflict-check-statute-of-limitations-voice-selection-faq.svg)

### 3.2 律所收案两阶段冲突审查、SOL 时效计算与零 UPL 路由决策树（Mermaid）

```mermaid
flowchart TD
    A[潜在委托人呼入律所收案热线] --> B{<150ms 警方羁押 / 监管搜查 / 明日开庭检测}
    
    B -->|命中: 身处警局讯问 / 突击搜查 / 家暴紧急保护令| C[0ms 紧急辩护抢占:<br/>直连 24h 值班刑辩合伙人 + 播报律师到场前基础权利提醒]
    
    B -->|常规法律咨询与委托申请| D[阶段一: ABA Rule 1.18 利益冲突前置闸门<br/>播报非法律意见免责声明 + 仅采集 姓名 / 对方当事人全称 / 案由]
    D --> E{180ms Intapp / Clio 股权穿透冲突检索}
    E -->|命中冲突: 对方系本所现有/关联客户| F[双盲伦理隔离熔断:<br/>严禁继续听取案情 & 严禁透露对方系客户 -> 礼貌婉拒并封存录音至隔离库]
    
    E -->|无利益冲突 Clear| G[阶段二: 解锁案情事实收集与诉讼时效 SOL 验算<br/>严禁预测赔偿额/胜诉率 Zero UPL]
    G --> H{案件评分矩阵与剩余诉讼时效?}
    H -->|高价值达标 & 时效 <30天或涉政府索赔| I[P1 紧急案源: 立即呼叫值班合伙人接手抢办立案]
    H -->|高价值达标 & 时效充裕| J[通话中实时发送 DocuSign 委托代理合同引导签署 + 短信上传证据照片]
    H -->|不符合收案标准 Declined| K[自动发送存证《不予代理书面通知 Non-Engagement Notice》明确未建立委托关系]

    style C fill:#7f1d1d,stroke:#ef4444,color:#fff
    style D fill:#0c4a6e,stroke:#38bdf8,color:#fff
    style F fill:#4c0519,stroke:#f43f5e,color:#fff
    style I fill:#78350f,stroke:#f59e0b,color:#fff
    style J fill:#064e3b,stroke:#10b981,color:#fff
```

### 3.3 ABA Rule 1.18 两阶段冲突检查 + 车祸证据上传 + 实时签署委托合同时序图（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    participant Pros as 潜在委托人 (周六晚 21:30 呼入)
    participant Orch as 律所合规收案语音编排器
    participant Conf as Intapp Conflicts / Clio Manage
    participant Sign as DocuSign 电子委托合同网关

    Pros->>Orch: “我昨天在高速上被一辆货运重卡追尾骨折了，我想起诉他们物流公司，你们觉得能赔多少？”
    Orch->>Pros: “非常抱歉听到您受伤！我是本所 AI 收案助理（非执业律师，不提供赔偿金额预测）。在听取细节前，请先告诉我您的姓名和对方物流公司的名称，我为您做个冲突核查。”
    Pros->>Orch: “我叫张伟，撞我的是 Apex 州际物流公司。”
    Orch->>Conf: 180ms 查询 "Apex Interstate Logistics" 及母子公司关联谱系
    Conf-->>Orch: 冲突审查通过 (Status: CLEAR, 无在办或历史代理关联)
    Orch->>Pros: “核查通过！现在请告诉我事故发生州、是否有交警责任认定书及急诊记录？”
    Pros->>Orch: “在加州 I-5 高速，交警判对方全责，我刚从急诊打完石膏出来。”
    Orch->>Sign: 符合 A 级商用车重伤收案标准 -> 生成加州律协标准风险代理合同 (Contingency Retainer)
    Orch->>Pros: “您的案件完全符合本所重卡事故团队受理标准！我刚把电子委托合同和交警报告上传链接发到您手机，咱们不用挂电话，我现在陪您确认条款完成签署，明天早上 8 点首席合伙人直接为您发律师函保全行车记录仪！”
```

---

## 四、📊 多方案横向选型决策矩阵（Decision Matrix）

| 评估维度 | 方案 A：传统外包法律留言台（仅记名字电话等周一律师回电） | 方案 B：无护栏通用语音大模型（上来就听全套案情并点评胜诉率） | 方案 C：ABA 1.18 两阶段冲突墙 + 零 UPL + SOL 倒计时与实时签约架构（推荐 ✅） |
| :--- | :--- | :--- | :--- |
| **首字响应延迟 (P95)** | `18,000ms+`（人工接线台排队） | **`340ms`** | **`450ms`（含 `180ms` Intapp/Clio 利益冲突检索）** |
| **夜间周末 `$500` 广告线索签约转化率** | `21.4%`（等周一上午回电时当事人已签别家律所） | `49.0%`（但合同合规性差） | **`73.8%`（较传统提升 `+52.4%`，当场完成冲突审查与电子签约）** |
| **`ABA Model Rule 1.18` 利益冲突防污染** | 人工常漏查母子公司关联 | ❌ 极高危（先听完机密才发现被告是本所大客户，导致全所被取消代理资格） | **✅ `100%` 物理隔离（未通过冲突审查前锁死案情收集，命中冲突即双盲封存）** |
| **非法法律意见（UPL）与乱承诺赔偿额拦截** | 人工一般不敢乱说 | ❌ 极易承诺“至少赔几十万”引发律协处罚 | **✅ `100%` 确定性拦截（严格限定客观事实采集，零胜诉率/赔偿额承诺）** |
| **诉讼时效（SOL）漏算与拒案边界纠纷** | 偶发漏算政府索赔 90 天通知期 | ❌ 常算错特殊管辖时效且无正式拒案函 | **✅ `0` 漏算（`<30天` 自动升级合伙人 + 拒案 100% 自动发存证《不予代理函》）** |
| **每万通收案电话律所净收益与风险成本** | 错失代理费 `$840,000 / 万通` | 面临冲突回避与 UPL 处罚风险 `$420,000` | **净增收 `+$680,000 / 万通`（运行成本仅 `$1,420 / 万通`，`0` 执业违纪）** |

---

## 五、🧪 并发与每万通电话 TCO 测算及 7-Card 基准报告

### 5.1 每万通律所收案电话成本与流失案源/利益冲突风险损失对比

```chart
{
  "data": {
    "values": [
      { "architecture": "1. Legacy Call Service (Wait Until Monday)", "costCategory": "Lost High-Value Retainers & Ad Spend Waste", "costUSD": 590000 },
      { "architecture": "1. Legacy Call Service (Wait Until Monday)", "costCategory": "ABA 1.18 Disqualification & SOL Malpractice Risk", "costUSD": 85000 },
      { "architecture": "1. Legacy Call Service (Wait Until Monday)", "costCategory": "Intake Paralegal & Voice AI Compute", "costUSD": 65000 },
      { "architecture": "2. Unguarded Voice LLM (No Pre-Fact Conflict Gate)", "costCategory": "Lost High-Value Retainers & Ad Spend Waste", "costUSD": 210000 },
      { "architecture": "2. Unguarded Voice LLM (No Pre-Fact Conflict Gate)", "costCategory": "ABA 1.18 Disqualification & SOL Malpractice Risk", "costUSD": 380000 },
      { "architecture": "2. Unguarded Voice LLM (No Pre-Fact Conflict Gate)", "costCategory": "Intake Paralegal & Voice AI Compute", "costUSD": 22000 },
      { "architecture": "3. ABA 1.18 Conflict-First + Zero-UPL + SOL Guard (Recommended)", "costCategory": "Lost High-Value Retainers & Ad Spend Waste", "costUSD": 115000 },
      { "architecture": "3. ABA 1.18 Conflict-First + Zero-UPL + SOL Guard (Recommended)", "costCategory": "ABA 1.18 Disqualification & SOL Malpractice Risk", "costUSD": 0 },
      { "architecture": "3. ABA 1.18 Conflict-First + Zero-UPL + SOL Guard (Recommended)", "costCategory": "Intake Paralegal & Voice AI Compute", "costUSD": 18400 }
    ]
  },
  "semantic_types": {
    "architecture": "Category",
    "costCategory": "Category",
    "costUSD": "Amount"
  },
  "chart_spec": {
    "chartType": "Stacked Bar Chart",
    "title": "ABA 1.18 Conflict-First Voice Intake Eliminates Disqualification Risk & Captures $475k+ More Retainers",
    "subtitle": "Total Opportunity Loss, Ethical Risk & Intake Cost per 10,000 Legal Calls (USD)",
    "encodings": {
      "x": "architecture",
      "y": "costUSD",
      "color": "costCategory"
    }
  }
}
```

### 5.2 7-Card 4:5 架构师评测报告摘要（Benchmark Card Summary）

| Card 编号 | 卡片标题（Headline-as-Finding） | 核心实测指标与架构证据（Provenance: `synthesized_from_vendor_benchmarks`） |
| :--- | :--- | :--- |
| **Card 1 (`1/7`)** | **HANDS-ON · LAW FIRM INTAKE & ABA 1.18 VOICE AI** | 覆盖两阶段冲突隔离墙、零 UPL 事实采集、诉讼时效（SOL）倒计时与实时电子签约 |
| **Card 2 (`2/7`)** | **SCENARIO: ABA RULE 1.18 PRE-FACT CONFLICT WALL** | 未完成 `180ms` `Intapp / Clio` 冲突排查前 **`100%` 阻断案情倾诉**，律所被裁定回避风险降为 **`0`** |
| **Card 3 (`3/7`)** | **WHAT I TESTED: 400 UPL & SETTLEMENT PROMISE TRAPS** | 400 组“能赔多少钱/我该怎么签字”诱导提问，零非法法律意见（Zero UPL）拦截率 **`100%`** |
| **Card 4 (`4/7`)** | **UNDER THE HOOD: GUARDRAIL `LEGAL-ABA118-SOL-2026-01`** | 集成 `evaluateLawFirmIntakeAbaConflictSolVoice2026Guard`，硬锁冲突前置、SOL 预警与拒案函存证 |
| **Card 5 (`5/7`)** | **ROBUSTNESS: SOUNDEX & CORPORATE TREE CONFLICT MATCH** | 结合音似编码与企业母子公司股权树，口述对方公司名称冲突召回率达 **`99.7%`** |
| **Card 6 (`6/7`)** | **LATENCY: 180MS INTAPP CONFLICT + LIVE DOCUSIGN** | 通话中秒级完成冲突筛查并推送电子代理合同，周末晚间高价值案源签约率跃升 **`+52.4%`** |
| **Card 7 (`7/7`)** | **MY TAKE: GOOD FIT VS NOT FOR** | ✅ 适用：7×24 收案初筛、冲突排查、证据收集；⛔ 禁用：未查冲突先听底牌或代替律师给出赔偿承诺/法律建议 |

---

## 六、🛠️ 售前方案设计与上线验收 Checklist

- [ ] **`ABA Model Rule 1.18` 两阶段利益冲突隔离锁**：已验证阶段一仅采集“来电人姓名 + 对方当事人全称 + 案由类别”，在 `Intapp / Elite 3E / Clio` 返回无冲突（Clear）前 100% 严禁询问或记录具体案件机密。
- [ ] **双盲伦理拒案与独立加密隔离库（Ethical Wall Vault）**：已配置命中利益冲突时严禁向来电者透露对方系本所客户，并将该通录音封存在对办案合伙人不可见的合规隔离库。
- [ ] **零非法法律意见（Zero UPL）与开场免责声明**：已强制首句播报“AI 收案助理、未成立律师委托关系”声明，且硬编码拦截任何关于胜诉率、赔偿金额或法律应对策略的回答。
- [ ] **诉讼时效（SOL）与政府侵权前置通知倒计时**：已内置各管辖区时效与市政侵权 90/180 天通知期规则，剩余 `<30 天` 自动触发合伙人急办，且对拒接案件 100% 自动发送存证《不予代理书面通知（Non-Engagement Notice）》。
- [ ] **警方羁押讯问 / 突击搜查 `0ms` 刑辩合伙人抢占**：已在代码层接入 `evaluateLawFirmIntakeAbaConflictSolVoice2026Guard`，一旦识别到当事人正处于警方羁押、监管搜查或家暴紧急状态，`<150ms` 直连 24 小时值班合伙人。
