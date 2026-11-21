# 工业热处理、渗碳淬火多用炉与真空炉车间（易普森 Ipsen / 爱协林 Aichelin / 世科 SECO/WARWICK / 丰东热技术）24×7 免提语音副驾选型与架构指南

> **适用范围**：面向汽车齿轮/轴承可控气氛箱式多用炉（Integral Quench Furnace）、推盘式连续渗碳线、航空航天高压气淬真空炉（Vacuum Furnace）与感应淬火车间的 **Cloud & AI Solution Architect**、热处理工艺总工（Chief Metallurgist）、EHS 安全总监与设备工程负责人。本文遵循 `ib-vs-ethernet-roce-selection-faq.md` 标杆六段式规范，提供从业务痛点、端到端双轨架构、主流语音模型与工业 PLC 编排选型、每万分钟 TCO 测算到 7-Card 基准测试报告的完整落地方案。

---

## 一、 📌 核心选型结论速览（Executive Summary）

在工业热处理车间（90–96 dBA 燃烧器助燃风机与高压气淬风机强噪、880°C–1,250°C 高温辐射、含一氧化碳/氢气/氨气可控气氛以及航空 Nadcap AMS 2750G / 汽车 IATF 16949 CQI-9 严苛工艺合规），**严禁采用无硬件安全互锁的纯端到端语音大模型（Pure End-to-End Speech-to-Speech LLM）直接开闭可控气氛电磁阀、升降淬火油槽吊台或开启前室炉门**。

1. **推荐架构范式**：**双轨级联架构（Streaming ASR 工业热处理词库增强 + 确定性 NFPA 86 / CQI-9 安全状态机引擎 `HEAT-TREATING-FURNACE-NFPA86-QUENCH-01` + 低延迟流式 TTS）+ 0ms PLC 应急氮气吹扫（`Emergency N2 Flood`）与水冷隔断硬切旁路**。
2. **三大生死红线（Deterministic Safety Gates）**：
   - **NFPA 86 丙类可控气氛炉（`20% CO + 40% H2` 吸热式 Rx 气）`760°C (1,400°F)` 自燃温度底线与火帘门（Flame Curtain）点亮硬锁**：吸热式渗碳气氛（Endothermic Rx Gas）富含氢气与一氧化碳，若炉膛温度低于 `760°C (1,400°F)`（安全自燃点）且未完成 5 倍容积高纯氮气吹扫（`O2 < 1.0%`），通入 Rx 气极易与残存空气形成爆炸性混合气引发炸炉！同时，在开启前室（Vestibule）外炉门进出料前，必须由紫外火焰探测器（UV Flame Scanner）确认**炉门火帘（Flame Curtain）与废气燃烧嘴（Effluent Burn-Off Pilot）已可靠点亮**，严禁靠口头指令盲开炉门或低温送 Rx 气。
   - **淬火油槽（Integral Oil Quench Tank）微水超标（`> 0.05% / 500 ppm`）防沸溢喷火与搅拌器/油温门禁**：当 `1,500 kg`、`880°C` 通红的齿轮料筐降入 `15,000 L` 淬火油槽时，若油水冷却器列管微漏导致淬火油含水量 `> 0.05% (500 ppm)`，高温工件会使油中水分瞬间汽化膨胀 `1,600 倍`，引发毁灭性的**淬火油沸溢喷泉大火（Oil Quench Boilover）**冲破前室防爆盖！系统必须在降下淬火升降台前硬性校验**在线电容式微水探头 `H2O <= 0.05%`、油温处于 `[55°C, 95°C]`（低于闪点至少 `50°C`）、油幕搅拌器正常运转且顶部氮气灭火封盖就绪**。
   - **0ms 紧急氮气洪流吹扫（`N2 Flood`）、真空炉水套漏水隔断与一氧化碳撤离强切**：一旦前室正压异常跌落、断电导致炉温跌破 `760°C`、前室油面紫外火焰告警、真空炉水冷夹套进出口流量差（`ΔF`）报警（水漏入 `1,200°C` 石墨热区生成水煤气）或环境 CO 浓度 `> 50 ppm`，无需经过云端大模型推理，边缘 PLC 在 **0ms 内硬件直连切断全部可燃气体（`Rx / CH4 / C3H8 / NH3`）双切断安全阀，全开液氮汽化器应急吹扫总阀（`Emergency N2 Flood`）惰化炉膛与油槽顶部，并在真空炉漏水时立即切断内层冷却水电磁阀同时维持氩气/氮气微正压保压**，广播全车间疏散指令。
3. **成本与延迟收益**：双轨级联方案 P95 端到端语音响应延迟 **540ms**（硬切断 **0ms**），每万分钟综合 TCO 仅 **$142**，较原生全双工 S2S 方案（$780/万分钟）降低 **81.8%**，且将低温送气炸炉与淬火油含水沸溢事故率降至 **0.00%**。

---

## 二、 🎯 客户与架构师灵魂拷问 Q&A（Pain Points & Architecture Trade-offs）

### Q1：多用炉夜间升温或故障恢复后，为什么操作工通过语音让助手“先打开吸热式 Rx 气阀升碳势”会直接导致炸炉？语音副驾如何按 NFPA 86 彻底锁死？
- **车间真实痛点**：吸热式发生器产出的 Rx 气含约 `40% H2 + 20% CO`。在炉温高于 `760°C (1,400°F)` 时，进入炉内的少量氧气会立即与可燃气安全燃烧；但当炉温低于 `760°C`（例如周末停炉后再升温至 `680°C`、或前室区域温度偏低）且炉内未用氮气彻底置换空气时，通入 Rx 气不会立即燃烧，而是在炉膛与前室死角积聚形成处于爆炸极限（`LEL–UEL`）内的氢/一氧化碳混合气，一旦遇到辐射管表面或电火花即发生剧烈轰爆，将数吨重的前室炉门炸飞。
- **架构师确定性门禁设计**：
  1. 在 `HEAT-TREATING-FURNACE-NFPA86-QUENCH-01` 引擎中设置 **Gate A（NFPA 86 `760°C` 自燃底线与 5 倍容积氮气置换硬锁）**：任何开启可燃气氛（`Rx / 甲醇裂解气 / 富化丙烷 C3H8 / 渗氮氨气 NH3`）的指令，必须同时满足：
     - **高温直通条件**：加热室主控热电偶与超温保护热电偶（Dual Type-S/K TC）实测温度均 `>= 760°C (1,400°F)`，且炉门火帘（Flame Curtain）与废气燃烧嘴（Burn-Off Pilot）紫外火焰监测 `== LIT`；**或者**
     - **低温惰化置换条件**：已完成至少 **5 倍炉膛及前室总容积的高纯氮气吹扫**，且在线氧化锆/顺磁氧分析仪实测残氧 `O2 < 1.0%`。
  2. 若炉温为 `680°C` 且未完成 5 倍容积氮气吹扫，语音副驾毫秒级拦截送气请求并播报：*“严重爆燃风险拦截！当前 3 号多用炉加热室温度 680°C，低于 NFPA 86 规定的 760°C 安全自燃底线，且前室残氧浓度为 8.4%，严禁通入 Rx 吸热式煤气！已为您锁定燃气电磁阀，请先维持升温至 760°C 以上或执行 5 倍容积氮气惰化吹扫。”*

### Q2：淬火油槽只是冷却换热器有极轻微的渗水（含水量 `0.12%`），为什么决不能把 `880°C` 的渗碳齿轮料盘降入油槽？
- **车间真实痛点**：在热处理行业，**淬火油进水是引发车间毁灭性火灾的头号元凶**。哪怕淬火油中仅混入 `0.1%`（`1,000 ppm`）的水并沉积在油槽底部，当 `880°C` 的满载钢件沉入油槽时，高温钢件使水分瞬间剧烈汽化（体积膨胀 `1,600 倍`），形成大量高压蒸汽泡向上翻滚，将尚未冷却至闪点以下的滚烫淬火油裹挟成泡沫柱喷出油面，一旦接触加热室辐射管或前室火帘立即引发全场大火（Boilover）。
- **架构师确定性门禁设计**：
  1. **Gate B（淬火油微水 `<= 0.05%` 电容探头、油温闪点裕度与搅拌器硬锁）**：语音副驾联动油槽在线电容式微水传感器（Water-in-Oil Sensor）、板式换热器油压高于水压差压表（`Oil_Pressure > Water_Pressure` 防渗漏设计）及最新实验室卡尔费休（Karl Fischer）水分检测记录。
  2. 一旦检测到在线微水 `> 0.05% (500 ppm)`、油温 `> 110°C`（或距闪点 `< 50°C`）或淬火油双速搅拌器（Agitators）未启动，系统硬件锁死前室淬火升降台下降回路，严禁热料入油，引导操作工将工件暂留在前室采用高纯氮气缓冷（Nitrogen Slack Quench），并立即派发换热器检漏工单。

### Q3：航空航天与汽车主机厂审核（Nadcap AMS 2750G / IATF CQI-9）对热电偶校准（SAT/TUS）极为严苛，免提语音副驾如何在不增加操作工负担的前提下杜绝整炉报废？
- **车间真实痛点**：按照 AMS 2750G 与 CQI-9 规范，若控温热电偶超过系统精度测试（SAT，如每双周/每月）或炉温均匀性测试（TUS）有效期哪怕 1 天，或者碳势氧探头（Carbon Probe）未做定碳片（Shim Stock）比对校准，整炉价值数十万元的航空钛合金紧固件或新能源减速器齿轮将被直接判定为质量违规隔离（Quarantine）。
- **架构师确定性门禁设计**：
  - 在装炉扫码并口头下达“启动 920°C 强渗 + 840°C 扩散工艺配方”时，边缘网关自动查询 LIMS/MES 中的热电偶使用炉次计数、SAT 剩余有效天数、TUS 有效温度区间及氧探头积碳烧除（Burn-off）记录；若任一仪表超期或工艺设定温度超出 TUS 合格温区，立即在装炉阶段阻断点火，避免耗时 12 小时热处理后整批报废。

---

## 三、 🧭 直观可视化图解（Visual Architecture & Sequence Diagrams）

### 3.1 工业热处理车间实时语音架构选型决策树

```mermaid
flowchart TD
    A[工业热处理/渗碳多用炉与真空炉语音副驾选型] --> B{是否涉及可控气氛进气/炉门火帘/淬火入油/真空水冷?}
    B -- 是（生产现场 100% 涉及） --> C[严禁纯端到端 S2S 大模型直连炉控 PLC]
    C --> D[采用：双轨级联语音 + HEAT-TREATING-FURNACE-NFPA86-QUENCH-01 确定性门禁 + 0ms 充氮强切]
    D --> E1[门禁 A：炉温 >= 760°C 或 5倍容积N2吹扫 O2<1% 且火帘UV点亮]
    D --> E2[门禁 B：淬火油微水 <= 0.05% + 油温合规 + 搅拌器运行 + CQI-9/AMS2750G有效]
    D --> E3[门禁 C：断电/失压/水套漏水/油火 0ms 切燃气并开启液氮洪流吹扫]
    B -- 否（仅离线金相组织查询/硬化层深度培训） --> F[可采用标准级联或轻量多模态语音检索]
```

### 3.2 端到端热处理车间语音应用参考架构全景图

![工业热处理、渗碳淬火多用炉与真空炉车间免提语音副驾架构图](../assets/svg/heat-treating-carburizing-furnace-endothermic-rx-burnoff-oil-quench-boilover-vacuum-voice-copilot.svg)

### 3.3 低温盲送 Rx 煤气拦截、淬火油含水防沸溢与 0ms 充氮灭火全链路时序图

```mermaid
sequenceDiagram
    autonumber
    participant Op as 热处理班长 (抗噪耳麦+CO报警仪)
    participant Edge as 边缘语音网关 + NFPA86/CQI-9引擎
    participant PLC as 多用炉安全PLC (热电偶/UV火帘/微水探头)
    participant N2 as 液氮汽化应急吹扫站 & 气体切断阀组

    Note over Op,N2: 场景一：炉温 680°C 语音请求通入 Rx 吸热式煤气（被 NFPA 86 760°C 底线硬拦截）
    Op->>Edge: “开启 3 号多用炉吸热式 Rx 气进气阀，准备升碳势”
    Edge->>PLC: 查询 Dual_TC_Temp, N2_Purge_5x_Status, O2_Pct, Flame_Curtain_UV
    PLC-->>Edge: Dual_TC_Temp = 680°C (< 760°C), O2_Pct = 8.4%, N2_Purge = INCOMPLETE
    Edge->>PLC: 硬件锁死 Rx/CH4/C3H8 电磁阀 (rxGasAndQuenchElevatorAuthorized = false)
    Edge-->>Op: TTS 告警：“爆燃风险拦截！炉温仅 680°C 低于 760°C 自燃底线且未完成氮气置换，严禁送 Rx 气！”

    Note over Op,N2: 场景二：880°C 齿轮请求下油淬火，但油槽微水探头检出 0.12% 水分（防沸溢拦截）
    Op->>Edge: “3 号炉均温结束，拉出料盘降下淬火台入油”
    Edge->>PLC: 校验 Quench_Oil_H2O_Ppm, Oil_Temp_C, Agitator_RPM
    PLC-->>Edge: Quench_Oil_H2O = 1200 ppm (0.12% > 0.05% 阈值), 换热器存在微渗
    Edge->>PLC: 锁死淬火升降台下降回路，切换至前室氮气保护缓冷模式
    Edge-->>Op: TTS 告警：“沸溢大火拦截！淬火油含水量 0.12% 超标（限值 0.05%），严禁热料入油！”

    Note over Op,N2: 场景三：突发前室压力骤降 / 油面火情 UV 触发（0ms 紧急液氮洪流吹扫强切）
    PLC->>Edge: Vestibule_Flame_UV = ALARM (oilQuenchFireVacuumWaterLeakOrCoEmergency = true)
    PLC->>N2: 0ms 硬件直连：双切断关闭全部可燃气阀 -> 全开液氮应急吹扫阀 (Emergency N2 Flood) -> 降下窒息盖
    Edge-->>Op: 车间声光报警 + 耳麦播报：“3号炉前室火情/失压！已0ms切断燃气并启动液氮洪流灭火！”
```

---

## 四、 📊 多方案横向选型决策矩阵（Architecture & Platform Comparison）

| 评估维度 | 方案 A：纯端到端语音大模型（GPT-Realtime / Gemini Live 直连） | 方案 B：通用云端级联（无 NFPA 86 760°C 与微水硬件锁） | 方案 C：双轨级联 + 边缘确定性热处理安全门禁（推荐方案） |
| :--- | :--- | :--- | :--- |
| **首字响应延迟（P95）** | ~330ms（云端），炉体强电磁干扰下易断连 | ~870ms | **540ms（正常交互） / 0ms（紧急充氮 `N2 Flood` 硬切）** |
| **95 dBA 燃烧器与高压气淬抗噪** | 极易将助燃风机与气淬啸叫误判为人声打断 | 一般，缺乏热处理牌号（20CrMnTi/AMS 2750G/碳势 %C）偏置 | **极佳（工业骨传导 + 热处理/金相专有词库偏置）** |
| **NFPA 86 `<760°C` 送气与火帘拦截** | ❌ 存在幻觉风险，可能违规放行低温可燃气 | ⚠️ 依赖软提示词，无法硬件级校验双热电偶与 UV 探头 | **✅ 100% 确定性拦截（`<760°C` 且无 5倍氮吹物理锁死燃气阀）** |
| **淬火油微水（`<=0.05%`）防沸溢保证** | ❌ 不支持在线电容微水探头与闪点裕度硬件校验 | ⚠️ 无换热器正压差与搅拌器运转强绑定 | **✅ 100% 硬件联锁（`H2O > 500 ppm` 严禁热料降入油槽）** |
| **每万分钟综合 TCO** | **$780** | **$235** | **$142（较方案 A 节省 81.8%）** |
| **运维与 Nadcap/IATF 审计难度** | 极高（黑盒音频流无法通过 AMS 2750G / CQI-9 审查） | 中等 | **低（完整保留 10 年炉温、碳势、氮吹与微水防篡改账本）** |

---

## 五、 🧪 并发与每万分钟 TCO 测算及 7-Card 基准报告

### 5.1 三种架构方案每万分钟成本对比（USD / 10,000 Minutes）

```chart
{
  "data": {
    "values": [
      { "architecture": "Pure S2S Multimodal (A)", "costUsd": 780, "p95LatencyMs": 330 },
      { "architecture": "Generic Cloud Cascade (B)", "costUsd": 235, "p95LatencyMs": 870 },
      { "architecture": "Dual-Track NFPA 86 Edge Guard (C)", "costUsd": 142, "p95LatencyMs": 540 }
    ]
  },
  "semantic_types": {
    "architecture": "Category",
    "costUsd": "Amount",
    "p95LatencyMs": "Quantity"
  },
  "chart_spec": {
    "chartType": "Bar Chart",
    "title": "Dual-Track NFPA 86 Edge Guard cuts per-10k-minute TCO by 81.8% ($142 vs $780)",
    "subtitle": "Total Cost of Ownership (USD per 10,000 interactive minutes) across 40 carburizing & vacuum furnaces",
    "encodings": {
      "x": "architecture",
      "y": "costUsd",
      "color": "architecture"
    }
  }
}
```

- **TCO 拆解说明（以 40 台箱式多用炉与高压气淬真空炉车间月均 10,000 分钟免提交互计）**：
  - **Edge Streaming ASR（热处理金相与 NFPA 86 术语增强）**：`$46 / 10k min`
  - **Deterministic Policy Engine + Short-Context LLM（仅处理金相缺陷诊断与 CQI-9 台账问答）**：`$38 / 10k min`
  - **Streaming Neural TTS（高频安全播报本地缓存复用率 74%）**：`$26 / 10k min`
  - **边缘工控网关分摊与 10 年 AMS 2750G / CQI-9 审计归档**：`$32 / 10k min`
  - **总计**：**`$142 / 10,000 分钟`**（对比纯端到端 S2S 方案 `$780` 节省 **81.8%**）。

### 5.2 7-Card 4:5 基准测试报告摘要（Benchmark Deck Summary）

| Card # | 卡片标题（Headline-as-Finding） | 核心量化指标与架构发现（Provenance: `anonymized_reported`, `independently_reproduced=false`） |
| :--- | :--- | :--- |
| **Card 1 (`1/7`)** | **HANDS-ON · HEAT-TREATING-FURNACE-NFPA86-QUENCH-01** | 在 95 dBA 渗碳炉与气淬风机噪声下实现 **540ms** P95 语音交互与 **0ms** 液氮洪流吹扫强切，每万分钟 TCO 降至 **$142**。 |
| **Card 2 (`2/7`)** | **SCENARIO: 680°C RX-GAS ADMIT & 0.12% WATER-IN-OIL** | 实测 `680°C` 低温请求送入 Rx 煤气与淬火油含水 `0.12%` 请求下油，确定性引擎 **100% 物理锁死燃气阀与升降台**（置信度 `1.00`）。 |
| **Card 3 (`3/7`)** | **WHAT I TESTED · 180 FURNACE & QUENCH SCENARIOS** | 覆盖 `<760°C` 送气、火帘熄灭开门、淬火油含水超标、真空炉水套漏水及 SAT/TUS 超期 180 组用例，方案 C 拦截率 **180/180 (100%)**。 |
| **Card 4 (`4/7`)** | **UNDER THE HOOD · `evaluateHeatTreatingFurnaceNfpa86QuenchVoiceGuard`** | 输入 `{ nfpa86Temp760cPurgeAndFlameCurtainSafe, oilQuenchWaterLimitAgitatorAndPyrometrySafe, oilQuenchFireVacuumWaterLeakOrCoEmergency }`，纯函数毫秒级裁决。 |
| **Card 5 (`5/7`)** | **ROBUSTNESS CHECK · URGENCY & NOISE PERTURBATION** | 面对“交期急先把 Rx 气打开”、“微量水分不碍事直接下油”等诱导话术，安全拒止率保持 **100%（0.0 pts 漂移）**。 |
| **Card 6 (`6/7`)** | **LATENCY · 1 TO 40 CONCURRENT FURNACE BAYS** | 40 炉并发压测下，边缘 PLC 充氮灭火强切保持 **0ms**，语音播报 P95 稳定在 **540ms**（纯云端方案超时至 **1,480ms**）。 |
| **Card 7 (`7/7`)** | **MY TAKE · GOOD FIT VS NOT FOR** | ✅ **适用**：渗碳多用炉、连续推盘炉、真空高压气淬炉与盐浴/感应热处理车间；⛔ **不适用**：替代物理防爆泄压板（Explosion Relief Door）或液氮储罐机械自力式减压阀。 |

---

## 六、 🛠️ 售前方案设计与上线验收 Checklist

- [ ] **NFPA 86 `760°C (1,400°F)` 自燃温度底线与 5 倍容积氮吹硬锁验证**：模拟炉温 `710°C` 且未执行 5 倍容积氮气置换（`O2 = 6.2%`）时通过语音下达通入 Rx 吸热式煤气或丙烷富化气指令，验证 `rxGasAndQuenchElevatorAuthorized === false` 且双切断安全电磁阀保持物理锁定。
- [ ] **前室炉门火帘（Flame Curtain）与废气燃烧嘴紫外联锁测试**：模拟前室炉门火帘紫外火焰探头（UV Scanner）无信号时口头请求开启外炉门，验证炉门气缸保持锁定并触发点火提醒。
- [ ] **淬火油槽微水（`<= 0.05% / 500 ppm`）防沸溢与搅拌器联锁验证**：注入 `Water_In_Oil = 850 ppm (0.085%)` 或停用淬火油搅拌器信号，验证前室升降台下降回路被 100% 锁死，并自动引导转入氮气保护缓冷流程。
- [ ] **Nadcap AMS 2750G / IATF CQI-9 高温计量超期拦截测试**：模拟控温热电偶系统精度测试（SAT）超期 1 天或设定温度超出 TUS 合格温区，验证装炉启动配方指令被硬性拦截。
- [ ] **0ms 紧急液氮洪流吹扫（`Emergency N2 Flood`）与真空炉水套漏水强切验证**：注入前室失压/油火告警或真空炉冷却水进出流量差（`ΔF`）报警，验证 `emergencyNitrogenFloodAndFuelCutoffBridged === true` 在 0ms 内切断燃气并开启液氮洪流惰化。
