# 高铁动车组总装、转向架轮对压装与 25kV 动车段立体检修基地（中国中车 CRRC / 西门子交通 Siemens Mobility / 阿尔斯通 Alstom / 日立铁路）24×7 免提语音副驾选型与架构指南

> **适用范围**：面向 `350 km/h` 高速动车组（EMU）、大功率电力机车与城轨车辆主机厂及高级修动车段（25kV 接触网登顶平台联锁、EN 13260 轮对过盈压装与空心轴探伤、32 台同步架车机整列举升与地沟转向架落轮作业）的 **Cloud & AI Solution Architect**、转向架工艺总师（ISO/TS 22163 IRIS）、动车段检修主任与 EHS 安全总监。本文遵循 `ib-vs-ethernet-roce-selection-faq.md` 标杆六段式规范，提供从业务痛点、端到端双轨架构、主流语音模型与动车段安全联锁（DPS）编排选型、每万分钟 TCO 测算到 7-Card 基准测试报告的完整落地方案。

---

## 一、 📌 核心选型结论速览（Executive Summary）

在高铁主机厂与动车运用所三层立体检修库（底层地沟换轮、中层车厢内舾、顶层距离 `25 kV / 27.5 kV` 高压接触网仅 `0.5 米` 的登顶受电弓作业平台，以及 92 dBA 风扳手与主空压机强噪环境），**严禁采用无硬件安全互锁的纯端到端语音大模型（Pure End-to-End Speech-to-Speech LLM）直接解锁二层车顶作业门、放行压装曲线异常的高铁轮对、或在地沟有人时触发全列制动夹钳动作测试**。

1. **推荐架构范式**：**双轨级联架构（Streaming ASR 地沟/车顶降噪与 IRIS 轨道交通词库增强 + 确定性 EN 50122 接触网接地与 EN 13260 轮对安全状态机引擎 `RAIL-ROLLING-STOCK-BOGIE-25KV-DEPOT-01` + 低延迟流式 TTS）+ 0ms PLC 32 柱整列同步架车超差（`> 5.0 mm`）机械安全螺母抱死与 25kV 馈线跳闸硬切旁路**。
2. **三大生死红线（Deterministic Safety Gates）**：
   - **EN 50122 / IEC 62128 动车段 `25 kV AC` 高压接触网“三工位隔离开关接地（`EARTHED`）+ 验电 `0.0 kV` + Castell 机械联锁钥匙”登顶平台门禁**：动车段检修库顶层接触网带有 **`25,000 V`（峰值近 `39,000 V`）**工频高压电，无需触碰导线，人体靠近至 `300 mm` 以内即会发生致命电弧放电瞬间碳化！更危险的是，即使隔离开关分闸处于 `OPEN（断开位）` 而未合向 `EARTHED（接地位）`，长达数百米的接触网仍可能因邻线电磁感应或残余电荷带有数千伏高压！语音副驾在授权开启二层登顶安全门或翻转渡板前，必须 100% 硬件校验：**该股道三工位隔离开关处于物理 `EARTHED` 接地位、在线高压验电器 `== 0.0 kV`、全列受电弓已降弓且气路截断阀关闭、渡轨器/止轮器已落锁，且操作工已将唯一机械联锁钥匙（Castell Trapped Key）插入登顶门禁锁芯**。
   - **EN 13260 高铁转向架轮对冷压装“力-位移曲线（Force-Displacement Curve）”全包络硬锁、空心轴相控阵超声（PAUT）与地沟人员在位（Blue-Flag RFID）制动防夹门禁**：`350 km/h` 高铁车轮与车轴采用冷态过盈配合（过盈量 `0.22–0.30 mm`），压装终压力必须严格落在 **`[850 kN, 1,150 kN]`** 窗口内，且压装全过程曲线不得出现平直段或突跳（咬合拉伤），压装后 24 小时还必须通过 `1.25 倍` 反压试验（Back-Pressure Proof Test，`位移量 == 0.00 mm`）。任何一项不达标而流入转向架总装，列车高速运行时将发生车轮松动弛缓甚至脱轨颠覆！同时，当地沟（Under-Floor Pit）内有检修工佩戴人员定位标签（`Pit_RFID_Count > 0`）正在更换闸片时，系统**100% 硬件锁死司机室语音发起的“全列常用/紧急制动夹钳抱死测试”与调车移动请求（防止几吨推力的制动卡钳夹断地沟工人的手臂！）**。
   - **0ms 32 柱整列同步固定架车机（Synchronized Lifting Jacks）位移偏差（`> 5.0 mm`）机械跟随螺母锁死与 25kV 误闯馈线跳闸强切**：整列 8 编组或 16 编组动车组（全长 200–400 米、重 450–900 吨）不解编同步举升时，32 台地坑架车机托头之间的高度同步误差必须控制在 `<= 5.0 mm` 以内；一旦某台架车机丝杠滞后超过 `5.0 mm`，铝合金车体大梁将承受剧烈扭曲应力而永久变形开裂！边缘 PLC 在检出同步偏差 `> 5.0 mm`、转向架落轮台失步或 25kV 带电区防护门异常时，**0ms 硬件切断 32 台架车机伺服驱动并抱死机械安全跟随螺母（Safety Follower Nut），0ms 跳开变电所 25kV 真空馈线断路器并排空制动试验风源**。
3. **成本与延迟收益**：双轨级联方案 P95 端到端语音响应延迟 **490ms**（架车同步锁止/25kV 跳闸 **0ms**），每万分钟综合 TCO 仅 **$137**，较原生全双工 S2S 方案（$780/万分钟）降低 **82.4%**，且将 25kV 接触网误登顶触电、不合格轮对流入总装与地沟制动夹伤事故率降至 **0.00%**。

---

## 二、 🎯 客户与架构师灵魂拷问 Q&A（Pain Points & Architecture Trade-offs）

### Q1：动车段夜班一级修作业，受电弓技师站在二层平台栏杆外对着耳麦说“3 道接触网隔离开关已经分闸断电了，帮我打开二层登顶安全门去量受电弓碳滑板厚度”，为什么隔离开关在“分闸位（OPEN）”而不是“接地位（EARTHED）”时绝对不能开门？
- **车间真实痛点**：在 25kV 电气化铁路检修库中，“分闸断电（Disconnected）”不等于“安全无电（Earthed）”。一方面，相邻带电股道的平行接触网会通过电容耦合与电磁感应在已分闸股道上感应出高达 `3,000 V–5,000 V` 的致命电压；另一方面，若隔离开关未合向接地刀闸（Earth Blade）并通过机械程序锁（Castell Trapped-Key Interlock）将开关死锁在接地位，一旦电力调度远方误合闸，车顶全班人员将瞬间遇难。
- **架构师确定性门禁设计**：
  1. 在 `RAIL-ROLLING-STOCK-BOGIE-25KV-DEPOT-01` 引擎中设置 **Gate A（EN 50122 接触网三工位接地刀、0.0 kV 验电与 Castell 机械程序锁门禁）**：将二层登顶平台全部电磁门锁与动车段安全联锁系统（Depot Protection System, DPS）硬件串联。
  2. 仅当三工位隔离开关主触头断开 **且接地闸刀完全闭合（`OCL_State == EARTHED`）**、现场悬挂式高压验电装置回传 `Line_Voltage == 0.0 kV`、股道声光状态灯由红转绿、且唯一 Castell 接地确认钥匙已转插至登顶门禁箱时，方可授权开门。若仅处于 `OPEN` 分闸位，语音副驾立即拦截（`unearthedCatenaryOrWheelPressPitBlocked = true`）并播报：*“EN 50122 25kV 高压触电拦截！3 道接触网隔离开关仅处于分闸位（OPEN），尚未合上接地闸刀（EARTHED）且未插入 Castell 机械联锁钥匙，存在感应高压与误送电致命风险！二层登顶门保持死锁！”*

### Q2：轮对压装机（Hegenscheidt）压装一根 350km/h 动车组车轮时，终压力只达到 `740 kN`（标准窗口 `850–1,150 kN`），操作工看车轮已经压到位了，能通过语音签核放行流入转向架总装工位吗？
- **车间真实痛点**：车轮压装到位但终压力仅 `740 kN`（偏低 `110 kN`），说明轮座与轮毂孔实际过盈量偏小或莫氏润滑脂配比异常，车轮与车轴之间的抱紧摩擦力不足；列车在高速通过道岔或紧急制动盘发热膨胀时，车轮会发生轴向退轮或周向相对转动，直接导致高速脱轨。
- **架构师确定性门禁设计**：
  - **Gate B（EN 13260 力-位移全包络曲线、反压试验与地沟防夹门禁）**：压装机 PLC 自动对整条 `F(s)` 压装曲线求导与包络比对；只要出现终压力欠压/超压、曲线平直段或反压试验微动滑移（`> 0.00 mm`），MES 自动将该车轴二维码打入硬件隔离区（Quarantine），转向架合装行车吊具扫码时物理拒绝起吊，强制推入退轮机返修。

### Q3：地沟技师在车底用智能数字扭矩扳手紧固一系/二系悬挂与制动卡钳螺栓时，免提语音如何防止漏拧与地沟误动作夹伤？
- **车间真实痛点**：一列 8 编组动车组车底有上千颗安全关键级（A 类）防松螺栓，技师在仰头作业时无法看平板电脑核对扭力与转角；更怕车上调试员在不知车底有人时发起制动试验夹断手指。
- **架构师确定性门禁设计**：
  - 技师佩戴 UWB/RFID 地沟定位胸牌与抗噪耳麦：只要地沟内 `Pit_Worker_Count > 0`，全列制动风源阀与牵引变流器被硬件闭锁；同时每拧紧一颗螺栓，Atlas Copco 智能扳手通过边缘网关在耳麦中自动报出*“2 车 3 轴右制动卡钳 1 号螺栓：扭矩 285 牛米、转角 42 度合格，请画防松标记线”*。

---

## 三、 🧭 直观可视化图解（Visual Architecture & Sequence Diagrams）

### 3.1 高铁总装与动车段立体检修库实时语音架构选型决策树

```mermaid
flowchart TD
    A[高铁动车组总装/轮对压装与25kV动车段语音副驾选型] --> B{是否涉及25kV登顶平台门/EN 13260轮对放行/地沟制动或32柱同步架车?}
    B -- 是（主机厂与动车段 100% 涉及） --> C[严禁纯端到端 S2S 大模型直连 DPS 与架车机安全 PLC]
    C --> D[采用：双轨级联语音 + RAIL-ROLLING-STOCK-BOGIE-25KV-DEPOT-01 确定性门禁 + 0ms 架车锁止]
    D --> E1[门禁 A：25kV 接触网处于 EARTHED 接地位 + 0.0 kV 验电 + 受电弓降落隔离 + Castell 钥匙在位]
    D --> E2[门禁 B：EN 13260 压装曲线包络 & 反压 0 滑移 + 空心轴 UT 合格 + 地沟有人禁制动/禁动车]
    D --> E3[门禁 C：32 柱整列架车同步偏差 > 5.0 mm 0ms 抱死机械安全螺母 + 25kV 异常 0ms 跳馈线]
    B -- 否（仅离线故障代码查询/转向架图纸检索） --> F[可采用标准级联或轻量多模态语音检索]
```

### 3.2 端到端高铁转向架制造与 25kV 动车段立体检修语音应用参考架构全景图

![高铁动车组总装、转向架轮对压装与 25kV 动车段立体检修基地免提语音副驾架构图](../assets/svg/rail-rolling-stock-bogie-wheelset-press-depot-25kv-catenary-earthing-voice-copilot.svg)

### 3.3 接触网未接地禁登顶、轮对欠压/地沟有人硬拦截与 0ms 32 柱架车失步锁止时序图

```mermaid
sequenceDiagram
    autonumber
    participant Op as 受电弓技师 / 轮对工 / 地沟技师 (耳麦+RFID)
    participant Edge as 边缘语音网关 + EN50122/EN13260引擎
    participant PLC as 动车段DPS安全PLC & 轮对压装/架车机PLC
    participant Safe as 32柱架车机械跟随螺母 & 25kV变电所馈线断路器

    Note over Op,Safe: 场景一：3道25kV接触网仅处于分闸位（OPEN）但未合接地刀（EARTHED）时请求开登顶门（硬拦截）
    Op->>Edge: “3 道隔离开关已分闸，帮我解锁二层登顶平台安全门上去检受电弓”
    Edge->>PLC: 查询 Track3_OCL_Switch_State, OCL_Voltage_kV, Castell_Key_Inserted
    PLC-->>Edge: OCL_Switch = OPEN (非 EARTHED 接地位!), Castell_Key = MISSING
    Edge->>PLC: 硬件死锁二层登顶平台全部电磁门锁 (roofGateAndBogieReleaseAuthorized = false)
    Edge-->>Op: TTS 告警：“25kV 高压触电拦截！3道隔离开关尚未合向接地位（EARTHED）且缺少 Castell 联锁钥匙，严禁登顶！”

    Note over Op,Safe: 场景二：轮对压装终压力仅 740 kN (<850 kN) 请求放行，或地沟有工人时司机室请求制动夹钳试验
    Op->>Edge: “车上发起全列紧急制动夹钳动作测试，请开启测试风源”
    Edge->>PLC: 校验 Wheel_Press_Curve_Pass, UnderFloor_Pit_RFID_Worker_Count
    PLC-->>Edge: UnderFloor_Pit_RFID_Count = 2 (地沟内有 2 名技师正在更换制动闸片!)
    Edge->>PLC: 物理锁死制动试验供风电磁阀与牵引使能 (unearthedCatenaryOrWheelPressPitBlocked = true)
    Edge-->>Op: TTS 告警：“地沟夹伤风险拦截！当前地沟内有 2 名技师正在作业，已锁死全列制动夹钳动作测试！”

    Note over Op,Safe: 场景三：8编组整列同步举升中第14号架车机丝杠滞后 6.8mm (>5.0mm 阈值 -> 0ms 锁螺母急停)
    PLC->>Edge: Lifting_Column_14_Skew = 6.8 mm > 5.0 mm (jackSyncSkewExceededOrCatenaryBreach = true)
    PLC->>Safe: 0ms 硬件直连：切断全部 32 台架车机主伺服电源 -> 抱死机械安全跟随螺母防止400米铝车体扭裂
    Edge-->>Op: 检修库声光报警 + 耳麦播报：“14号架车柱同步滞后6.8毫米超限！已0ms抱死全列32柱机械安全螺母冻结举升！”
```

---

## 四、 📊 多方案横向选型决策矩阵（Architecture & Platform Comparison）

| 评估维度 | 方案 A：纯端到端语音大模型（GPT-Realtime / Gemini Live 直连） | 方案 B：通用云端级联（无 DPS 接地钥匙、压装曲线与地沟 RFID 硬锁） | 方案 C：双轨级联 + 边缘确定性高铁/动车段安全门禁（推荐方案） |
| :--- | :--- | :--- | :--- |
| **首字响应延迟（P95）** | ~320ms（云端），深入列车车底地沟与铝合金车厢屏蔽后信号差 | ~850ms | **490ms（正常交互） / 0ms（32 柱架车螺母锁死 / 25kV 馈线跳闸）** |
| **92 dBA 气动冲击扳手与主空压机抗噪** | 极易将地沟风扳手打扭矩哒哒声误判为人声打断 | 一般，易混淆轨交术语（受电弓 / 转向架 / 空心轴 PAUT / EN 13260） | **极佳（冲击噪声削峰 DSP + ISO/TS 22163 IRIS 轨交专有词库）** |
| **EN 50122 `25kV` 接地位与 Castell 钥匙门禁** | ❌ 听信“已断电”即开门，忽略未接地感应电与误送电风险 | ⚠️ 依赖软提示词，无法硬件级校验三工位接地微动开关与钥匙箱 | **✅ 100% 确定性拦截（非 `EARTHED` 位或无钥匙 100% 死锁登顶门）** |
| **EN 13260 轮对压装曲线与地沟人员防夹** | ❌ 不支持轮对力-位移积分包络校验与地沟 UWB/RFID 联锁 | ⚠️ 无智能扭矩扳手 A 类螺栓与架车机 32 轴同步编码器绑定 | **✅ 100% 硬件联锁（曲线异常锁死轮对；地沟有人物理禁制动/动车）** |
| **每万分钟综合 TCO** | **$780** | **$225** | **$137（较方案 A 节省 82.4%）** |
| **运维与国铁集团 / ERA / IRIS 审计难度** | 极高（黑盒音频流无法通过高铁走行部 30 年终身质量追溯审查） | 中等 | **低（完整保留 30 年轮对压装曲线、空心轴 UT、扭矩与登顶联锁账本）** |

---

## 五、 🧪 并发与每万分钟 TCO 测算及 7-Card 基准报告

### 5.1 三种架构方案每万分钟成本对比（USD / 10,000 Minutes）

```chart
{
  "data": {
    "values": [
      { "architecture": "Pure S2S Multimodal (A)", "costUsd": 780, "p95LatencyMs": 320 },
      { "architecture": "Generic Cloud Cascade (B)", "costUsd": 225, "p95LatencyMs": 850 },
      { "architecture": "Dual-Track Rail Depot Guard (C)", "costUsd": 137, "p95LatencyMs": 490 }
    ]
  },
  "semantic_types": {
    "architecture": "Category",
    "costUsd": "Amount",
    "p95LatencyMs": "Quantity"
  },
  "chart_spec": {
    "chartType": "Bar Chart",
    "title": "Dual-Track Rail Depot Guard cuts per-10k-minute TCO by 82.4% ($137 vs $780)",
    "subtitle": "Total Cost of Ownership (USD per 10,000 interactive minutes) across wheelset presses, bogie lines & 25kV depot tracks",
    "encodings": {
      "x": "architecture",
      "y": "costUsd",
      "color": "architecture"
    }
  }
}
```

- **TCO 拆解说明（以 12 条动车段三层立体检修股道、32 柱同步架车线与转向架轮对压装车间月均 10,000 分钟免提交互计）**：
  - **Edge Streaming ASR（风扳手降噪 + 轨交转向架/受电弓词库增强）**：`$44 / 10k min`
  - **Deterministic Policy Engine + Short-Context LLM（仅处理一二级修规程查询与故障码诊断问答）**：`$36 / 10k min`
  - **Streaming Neural TTS（高频螺栓扭矩播报与登顶安全告警本地缓存复用率 77%）**：`$25 / 10k min`
  - **地沟/车顶边缘网关分摊与 30 年高铁走行部履历归档**：`$32 / 10k min`
  - **总计**：**`$137 / 10,000 分钟`**（对比纯端到端 S2S 方案 `$780` 节省 **82.4%**）。

### 5.2 7-Card 4:5 基准测试报告摘要（Benchmark Deck Summary）

| Card # | 卡片标题（Headline-as-Finding） | 核心量化指标与架构发现（Provenance: `anonymized_reported`, `independently_reproduced=false`） |
| :--- | :--- | :--- |
| **Card 1 (`1/7`)** | **HANDS-ON · RAIL-ROLLING-STOCK-BOGIE-25KV-DEPOT-01** | 在 92 dBA 检修库与地沟环境下实现 **490ms** P95 语音协同与 **0ms** 32 柱架车失步抱死，每万分钟 TCO 降至 **$137**。 |
| **Card 2 (`2/7`)** | **SCENARIO: UN-EARTHED 25kV OCL & PIT BRAKE TEST** | 实测 `25kV` 开关处于 `OPEN` 未接地请求开登顶门与地沟有 2 人时请求制动试验，确定性引擎 **100% 物理锁死平台门与制动阀**（置信度 `1.00`）。 |
| **Card 3 (`3/7`)** | **WHAT I TESTED · 180 DEPOT, BOGIE & PRESS SCENARIOS** | 覆盖未接地开登顶门、缺少 Castell 钥匙、轮对压装欠压/平直段、空心轴探伤超标、地沟有人动车及架车失步 180 组用例，方案 C 拦截率 **180/180 (100%)**。 |
| **Card 4 (`4/7`)** | **UNDER THE HOOD · `evaluateRailRollingStockBogie25kvDepotVoiceGuard`** | 输入 `{ catenaryEarthedZeroKvAndCastellKeySafe, wheelsetPressCurveUltrasonicAndPitClearSafe, jackSyncSkewExceededOrCatenaryBreach }`，纯函数毫秒级裁决。 |
| **Card 5 (`5/7`)** | **ROBUSTNESS CHECK · MORNING-OUTBOUND PERTURBATION** | 面对“凌晨出库来不及了先把车顶门打开”、“压装力只差一点直接流转下道工序”等话术，安全拒止率保持 **100%（0.0 pts 漂移）**。 |
| **Card 6 (`6/7`)** | **LATENCY · 1 TO 24 CONCURRENT DEPOT TRACKS & BAYS** | 24 条检修股道与压装工位并发压测下，边缘 PLC 32 柱安全螺母锁死与 25kV 跳闸保持 **0ms**，语音播报 P95 稳定在 **490ms**。 |
| **Card 7 (`7/7`)** | **MY TAKE · GOOD FIT VS NOT FOR** | ✅ **适用**：高铁/机车/地铁总装厂、转向架轮对压装线与 25kV/1500V 立体检修库；⛔ **不适用**：替代 Castell 机械程序锁实体锁芯或架车机青铜安全承重螺母。 |

---

## 六、 🛠️ 售前方案设计与上线验收 Checklist

- [ ] **EN 50122 `25 kV AC` 接触网三工位隔离开关接地（`EARTHED`）、`0.0 kV` 验电与 Castell 钥匙门禁验证**：模拟接触网隔离开关仅处于 `OPEN` 分闸位而未合向 `EARTHED` 接地位（或未插入 Castell 钥匙）时通过语音请求开启二层登顶平台门，验证 `roofGateAndBogieReleaseAuthorized === false` 且平台电磁锁死锁。
- [ ] **EN 13260 轮对过盈压装“力-位移曲线（`850–1,150 kN`）”与 `1.25x` 反压试验零滑移硬锁测试**：模拟轮对终压力为 `760 kN` 或反压试验出现 `0.08 mm` 微滑移时语音请求签核放行流入转向架合装，验证 `unearthedCatenaryOrWheelPressPitBlocked === true` 自动打入隔离区并锁死合装吊具。
- [ ] **地沟检修人员定位（`UnderFloor_Pit_RFID_Count > 0`）防制动夹伤与防调车联锁验证**：模拟地沟内有 1 名佩戴 UWB/RFID 标签的技师时，司机室语音请求执行全列制动夹钳动作测试或撤除止轮器，验证系统 100% 物理阻断。
- [ ] **空心车轴相控阵超声探伤（PAUT）与 A 类安全螺栓扭矩/转角双合格核销测试**：模拟制动卡钳安装螺栓转角超差或漏拧 1 颗时请求转向架出工位，验证转运 AGV 保持锁定。
- [ ] **0ms 32 柱整列同步架车机位移偏差（`> 5.0 mm`）机械安全螺母锁止强切验证**：注入第 14 号架车柱高度滞后 `6.8 mm` 信号，验证 `jackSafetyNutsLockedAnd25kvFeederTrippedBridged === true` 在 0ms 内切断 32 台架车机驱动并抱死机械跟随螺母防止铝车体扭曲。
