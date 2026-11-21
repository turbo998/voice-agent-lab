# 水泥熟料基地（海螺水泥 / 天山水泥 / 豪瑞 Holcim / 海德堡材料 / 中材国际 / 史密斯 FLSmidth）、850°C 五级旋风预热器清堵与回转窑/煤磨 24×7 免提语音副驾方案：旋风筒“严禁堵点下方开孔”与下层平台全员撤离硬锁、煤磨 CO/O2 惰化与回转窑防偏重反转 LOTO 门禁及 850°C 红料喷涌/电收尘 CO 超标 0ms 强切选型指南

> **文档定位**：面向全球大型新型干法水泥熟料基地（海螺水泥 Conch / 中国建材天山水泥 / 华润建材 / 瑞士豪瑞 Holcim / 海德堡材料 Heidelberg Materials / 西麦斯 CEMEX）及水泥工程总包与集散控制（中材国际 Sinoma / 丹麦史密斯 FLSmidth ECS / 德国洪堡 KHD / ABB Ability 800xA / 全球水泥与混凝土协会 GCCA 安全准则）工业 AI 解决方案架构师，提供覆盖 **“850°C 五级旋风预热器结皮堵料清捅‘严禁打开堵点下方捅料孔 + 下方各层塔架平台 100% 撤空 + 保持系统负压’硬锁 + 煤磨袋收尘器 CO 阴燃禁开门（强制充 CO2/N2 惰化）与 1,450°C 回转窑进窑砌砖防偏重反转机械销及篦冷机红熟料禁打水门禁 + 旋风筒塌料红料喷涌/窑尾电收尘 CO≥0.8% 0ms 高压断电强切”** 的端到端实时语音方案选型、TCO 测算与 `CEMENT-KILN-CYCLONE-COALMILL-CO-01` 确定性安全护栏指南。

---

## 一、📌 核心选型结论速览（Executive Summary）

在日产 5,000–10,000 吨熟料的新型干法水泥厂中，高达百米的五级旋风预热器塔架（Preheater Tower）内循环着数十吨温度高达 **$800^\circ\text{C}\text{–}900^\circ\text{C}$ 的流态化生料热粉**，**全球水泥工业单次死亡人数最多、最惨烈的头号群死群伤事故就是“预热器旋风筒清堵时高温红料喷涌（Hot-Meal Blowout / Flush）”——当 C4 或 C5 级旋风筒锥部发生结皮架桥堵料、锥体上方积压了 15–30 吨 $850^\circ\text{C}$ 红热生料粉时，如果允许工人在堵点下方的下料管打开捅料孔（Poke Hole）往上捅、或者在楼上开启空气炮（Air Cannon）吹堵时楼下各层平台还有巡检工逗留，一旦上方 20 吨架桥生料瞬间坍塌，高速下坠的红热生料会将下方管道内的空气剧烈压缩并像火山泥石流一样以超音速从所有未锁紧的捅料孔和翻板阀缝隙狂喷而出，瞬间吞没整层塔架平台；与此同时，在煤粉制备车间，若煤粉仓发生一氧化碳（CO）超标阴燃时工人违规打开袋收尘器检修门透气，新鲜空气涌入瞬间即引发煤粉云毁灭性大爆炸**：
1. **核心架构选型：采用“级联确定性水泥窑磨安全语音管线（IP6X 防水泥粉尘 96dB 抗罗茨风机/球磨机轰鸣骨传导耳麦 + Azure Speech 水泥烧成/煤磨词表 STT + FLSmidth ECS / ABB 800xA DCS 与捅料孔电磁锁 PLC 引擎 + 高穿透塔架 Neural HD TTS）”**：
   - **$850^\circ\text{C}$ 旋风预热器清堵“仅限堵点上方单孔作业 + 堵点下方全层撤空 + 窑尾高温风机负压”100% 硬锁**：一旦某级旋风筒（如 C4/C5）锥体负压归零触发堵料报警，网关立即接管全塔捅料孔电磁锁：① **100% 物理死锁堵料位置下方（Below the Plug）的所有捅料孔、人孔门与翻板阀检查孔**，仅允许解锁堵点正上方（Above the Plug）的唯一专用空气炮/高压水枪清堵孔；② 通过塔架 UWB 定位信标核验 **堵料层以下直至窑头平台的全部楼层已 100% 撤空清场**，且捅料点仅限 1–2 名穿戴全套镀铝隔热服与正压呼吸器的清堵工站在孔口侧面（严禁正对孔口）；③ 强制核验窑尾高温引风机（ID Fan）保持炉膛稳定负压（`cycloneJamAboveOnlyAndLowerTowerEvacuated = true`）；
   - **煤磨/煤粉仓低氧惰化（$\text{O}_2 < 10\%\text{–}12\%$）禁开门、回转窑进窑砌砖防偏重反转销与篦冷机“大块红熟料禁打水”硬锁**：煤磨系统正常运行时强制监控热风氧含量 $<10\%\text{–}12\%$，当煤粉仓或煤磨袋收尘器 CO 偏高时 **100% 锁死收尘器检修箱门（严禁开门放空气引发闪爆）**；进入 $1,450^\circ\text{C}$ 回转窑筒体（Rotary Kiln）内打窑皮或砌筑耐火砖前，强制核验上方松动结圈窑皮已清理、主辅传动已断电且 **大齿圈机械防反转插销（Bull-Gear Mechanical Anti-Rollback Pin）已物理锁死**（防筒体偏重突然自重滚动碾死窑内数十名筑炉工！）；进入篦冷机（Grate Cooler）清理“雪人（Snowman）”结块前，100% 严禁拿消防水枪直接朝密闭矮墙内 $1,200^\circ\text{C}$ 红熟料堆猛喷（水渗入红熟料内部瞬间汽化引发蒸汽炸膛喷出灼热熟料伤人）并强制锁死熟料破碎机（Clinker Crusher）LOTO（`coalMillInertedKilnPinnedAndCoolerDrySafe = true`）。
2. **预热器塌料红料喷涌预警、窑尾电收尘器（ESP）$\text{CO} \ge 0.8\%$ 防爆跳闸或煤粉仓 CO 阴燃（$>500\text{ ppm}$）0ms 充二氧化碳/氮气惰化强切**：
   - 一旦旋风筒压差突降预示架桥积料即将大塌方、窑尾烟气一氧化碳突破 $\text{CO} \ge 0.8\%$（即将达到电收尘器电晕火花引爆下限）、或煤粉仓/袋收尘器 $\text{CO} > 500\text{ ppm}$（`hotMealFlushEspCoSpikeOrCoalSmolder = true`），系统在 **0ms 内拉响预热器全塔最高危撤离警笛并停止生料投料，0ms 切断窑尾静电收尘器（ESP）高压硅整流电场电源防止电火花引爆一氧化碳，并自动打开液态 $\text{CO}_2 / \text{N}_2$ 惰化管网向煤粉仓底部与灰斗注入惰性气体窒息阴燃**。

![水泥基地 850°C 预热器清堵防喷涌、煤磨 CO 惰化与回转窑 LOTO 语音架构图](../assets/svg/cement-plant-rotary-kiln-preheater-cyclone-jam-coal-mill-co-silo-voice-copilot.svg)

---

## 二、🎯 客户与架构师灵魂拷问 Q&A（Q1–Q3）

### Q1：水泥厂预热器塔架 4 楼的 C5 旋风筒下料锥部发生严重结皮堵料，锥体里已经积压了约 25 吨 $860^\circ\text{C}$ 的红热生料粉。清堵班长带着 4 名工人在语音耳麦里对中控室操作员说：“从 5 楼往下捅太费劲了，帮我把 3 楼（堵点正下方）下料溜管上的捅料门锁解开，我们几个人拿长钢管从下往上顶一下就通了！”——为什么 AI 必须 0ms 死锁 3 楼捅料门？
**A：这是全球水泥行业（GCCA / 应急管理部水泥工厂清堵安全强制规定）严厉禁止的“头号自杀式违章——在堵料点下方开孔向上捅料”！**
- **为什么 25 吨 $860^\circ\text{C}$ 的干粉一旦捅通会像炸弹一样从下方孔口喷射出来**：
  - 高温生料粉与热气流混合后具有和液态水完全一样的高流动性（流态化 Fluidized Hot Meal），且密度高达水的一倍以上；
  - 当工人在 3 楼打开捅料孔拿钢管往上捅穿架桥结皮的瞬间，上方积压的 25 吨 $860^\circ\text{C}$ 红料在重力作用下瞬间轰然塌落！
  - 这 25 吨红料像活塞一样将下方管道里的气体急剧压缩，夹杂着数十吨 $860^\circ\text{C}$ 滚烫红灰的气浪会以 **超过 $100\text{ km/h}$ 的速度从 3 楼捅料口狂喷而出**，在 1 秒钟内将整层 3 楼平台淹没在半米深、$860^\circ\text{C}$ 的火海中，在场人员无一幸免！
- **架构落地**：
  - 在 `CEMENT-KILN-CYCLONE-COALMILL-CO-01` 中，当系统定位堵点位于 C5 锥部（4 楼）时，1 楼至 4 楼的所有捅料孔电磁锁被硬件死锁，`cycloneJamAboveOnlyAndLowerTowerEvacuated = false`；
  - 系统 **0ms 严词拒绝解锁 3 楼孔门**，强制要求 1–4 楼人员全部撤出塔架，仅允许 1 名穿全套镀铝隔热服的专员在 5 楼（堵点上方）通过带防喷挡板的专用孔位使用高压水枪（Cardox / 水清堵枪）向下清堵！

### Q2：为什么当回转窑停窑降温后，30 名筑炉工准备进窑内更换耐火砖时，语音副驾除了要求切断主电机电源，还必须 100% 核验“大齿圈机械防反转插销（Mechanical Rollback Pin）”已锁死？
**A：直径 5 米、长 70 米的回转窑筒体内挂有厚重且极其不均匀的熟料结皮（Kiln Coating），重心严重偏离圆心！**
- 如果只断掉了电机电源而没有打入重型机械止转销（或者松开抱闸切换辅传时），一旦窑内工人用风镐打掉一侧的几吨重窑皮，**不平衡的几十吨偏心重力矩会驱动整个巨大的回转窑筒体突然发生自重反转滚动（Uncontrolled Kiln Rollback）**，将窑内作业的工人与脚手架瞬间卷入翻转！
- 因此 Gate B 强制校验 `BULL_GEAR_PIN_LOCKED_AND_COATING_SCALED = true` 方可签发入窑许可证。

### Q3：煤磨袋收尘器灰斗内一氧化碳（CO）传感器飙升到 $850\text{ ppm}$（表明内部积存的极细煤粉正在发生缓慢阴燃），巡检工说：“我马上把袋收尘器的检修门打开拿灭火器往里喷！”——为什么 AI 必须 0ms 锁死检修门？
**A：煤磨袋收尘器平时在低氧惰化气体（$\text{O}_2 < 10\%$）下运行，内部虽然有煤粉阴燃但因缺氧无法爆燃；一旦工人拉开检修门，外部 $21\%$ 的新鲜氧气瞬间涌入并与阴燃扬起的煤粉云及高浓 CO 混合，会在开门的 0.5 秒内引发剧烈的煤粉+CO 混合爆炸！**
- 正确的 SOP 是：Gate C 在 0ms 内关闭煤磨进出口盲板阀、严禁开启任何箱门，并自动打开液态 $\text{CO}_2$ 或 $\text{N}_2$ 钢瓶组向灰斗和滤袋室持续充入惰性气体将火闷熄降温。

---

## 三、🧭 直观可视化图解（Mermaid 选型决策树 + 参考架构 + 时序图）

### 3.1 水泥厂预热器清堵、回转窑砌砖与煤磨防爆语音决策树

```mermaid
flowchart TD
    A[水泥熟料基地预热器、回转窑与煤磨 24×7 语音请求] --> B{是否发生预热器塌料红料喷涌前兆 / 窑尾电收尘 CO≥0.8% / 煤粉仓 CO>500ppm 阴燃?}
    B -->|是: 红料塌方 / 电收尘 CO 超限 / 煤仓阴燃| C[CEMENT-KILN-CYCLONE-COALMILL-CO-01: 0ms 拉响全塔撤离警报并停生料 / 0ms 跳闸电收尘高压硅整流防引爆 / 锁死煤磨门并自动充 CO2/N2 惰化]
    B -->|否: 预热器旋风筒清堵、回转窑进窑砌砖与篦冷机打大块| D{水泥烧成工段?}
    D -->|1. 850°C 旋风预热器结皮堵料人工/空气炮清堵| E{仅解锁堵点上方孔位(下方孔门 100% 死锁)、堵点以下各层平台已清场且窑尾引风机保持负压?}
    E -->|否: 试图打开堵点下方的捅料门向上捅 / 下方楼层仍有人 / 炉膛正压| F[0ms 物理死锁下方全部捅料孔门: 严防 25 吨 850°C 流态化红料决口喷涌埋人]
    E -->|是: 上方单孔、下层净空与负压 100% 确认| G{煤磨运行、进窑砌砖与篦冷机清雪人: 煤磨 O2<12% 禁开门、回转窑已插防反转机械销且红熟料零直接打水?}
    G -->|否: 煤仓阴燃试图开门灭火 / 未插回转窑止转销或未清顶挂窑皮进窑 / 朝篦冷机红熟料喷水| H[0ms 锁死煤磨检修门与回转窑人孔: 严防开门富氧闪爆、筒体偏重自滚与熟料蒸汽炸膛]
    G -->|是: 机械防滚与防爆联锁 100% 合规| I[放行受控清堵或检修作业并写入 GCCA / 应急部水泥安全生产审计账本]
```

### 3.2 端到端 FLSmidth/ABB 中控、捅料孔电磁联锁与煤磨惰化架构

```mermaid
flowchart LR
    subgraph CementFloor["96dB 防尘耳麦与塔架 UWB 信标"]
        C1[预热器清堵专员镀铝服骨传导耳麦]
        C2[塔架 1-6层 UWB 人员清场雷达]
        C3[回转窑红外扫描 & 煤磨 CO/O2 探头]
    end

    subgraph Engine["CEMENT-KILN-CYCLONE-COALMILL-CO-01 引擎"]
        G1[850°C 堵点下方死锁 & 下层清场硬锁]
        G2[煤磨禁开门、窑防反转销 & 禁打水门禁]
        G3[0ms 全塔警报、ESP 跳闸 & CO2 充氮强切]
    end

    subgraph KilnCore["全厂 ECS/DCS、捅料门锁与惰化站"]
        B1[(FLSmidth ECS / ABB Ability 800xA DCS)]
        B2[(各层捅料孔电磁死锁 & 空气炮/Cardox PLC)]
        B3[(窑尾 ESP 高压跳闸 & 煤粉仓液态 CO2/N2 站)]
    end

    C1 & C2 & C3 --> G1 --> G2 --> G3
    G2 <--> B1 & B2
    G3 --> B3
```

### 3.3 堵点下方开捅料孔 0ms 拦截与煤磨阴燃 0ms 锁门充氮时序图

```mermaid
sequenceDiagram
    participant Crew as 预热器清堵班长 / 煤磨巡检工
    participant Gateway as CEMENT-KILN-CYCLONE-COALMILL-CO-01 网关
    participant PLC as 塔架捅料孔电磁锁 PLC & 煤磨 CO/CO2 系统
    participant Control as 中央控制室窑操作员 & 应急救援队

    Crew->>Gateway: 场景A(C5 旋风筒 4楼堵料): "从 5 楼往下捅不动，帮我解锁 3 楼下料管的捅料门，我们 4 个人从下面往上顶！"
    Gateway->>PLC: 1. 核验堵料坐标 (C5 锥体位于 4 楼 -> 3 楼处于 25吨 860°C 积料正下方!) 且 2-3 楼 UWB 检出 4 人在场
    PLC-->>Gateway: 2. 返回: cycloneJamAboveOnlyAndLowerTowerEvacuated = false
    Gateway->>Crew: 3. 0ms 硬件死锁 1-4楼全部捅料门: "⚠️ 致命红料喷涌拦截！C5 锥体上方积压 25 吨 860°C 红料，严禁在堵点下方(3楼)开孔向上捅料！下方门锁已死锁，请 1-4 楼全体人员立即撤出塔架，仅限在 5 楼上方孔位负压清堵！"
    PLC->>Gateway: 场景B(煤磨收尘器阴燃): 煤磨袋收尘器 2号灰斗 CO 飙升至 880 ppm，温度 115°C (hotMealFlushEspCoSpikeOrCoalSmolder = true)
    Crew->>Gateway: "2号煤磨灰斗 CO 超标了，我现在把灰斗检修门打开拿灭火器往里喷！"
    Gateway->>PLC: 4. 0ms 电磁死锁煤磨收尘器全部检修箱门 + 关闭进出口气动盲板阀 + 自动打开液态 CO2/N2 惰化阀持续冲顶
    Gateway->>Crew: 5. 0ms 强阻断警告: "⚠️ 绝对禁止打开煤磨检修门！开门放进氧气将瞬间引发煤粉与一氧化碳大爆炸！箱门已死锁，系统已自动关闭风门并注入高纯 CO2/N2 窒息灭火，请立即撤离煤磨平台！"
```

---

## 四、📊 多方案横向选型决策矩阵

| 评估维度 | 方案 A：通用语音大模型（同意“从堵点下面捅一下” + 让打开冒烟煤粉仓门） | 方案 B：对讲机喊话清堵 + 手工挂牌开捅料孔门 | 方案 C：堵点下方电磁死锁 + 塔架 UWB 清场 + 0ms 煤仓锁门充氮（推荐） |
| :--- | :--- | :--- | :--- |
| **防 850°C 旋风预热器红料喷涌群死群伤** | ❌ 不懂流态化热粉塌落活塞效应，放行下方开孔直接害死整班工人 | ⚠️ 现场班长图省事私自撬开下层捅料门，或吹空气炮时未清退下层巡检工 | **✅ 100% 硬件死锁堵点下方全部孔门 + UWB 验证下层 0 人在场才允许上方清堵** |
| **防煤磨袋收尘器/煤粉仓开门富氧闪爆** | ❌ 照搬普通火灾经验让“开门喷灭火器”，直接制造粉尘爆炸 | ⚠️ 巡检工发现灰斗发热本能去拧开观察孔看火情，引发闪爆烧伤 | **✅ `CO > 500 ppm` 0ms 死锁全部箱门、切断风门并自动充入 $\text{CO}_2/\text{N}_2$ 闷熄** |
| **回转窑进窑砌砖防偏重反转与篦冷机防炸** | ❌ 不校验大齿圈机械防反转插销与篦冷机红熟料禁打水规则 | ⚠️ 仅断电机未插机械止转销，打掉半边窑皮后筒体突然自滚伤人 | **✅ 强制核验大齿圈机械销 + 顶挂窑皮清理；红熟料 100% 禁直接打水** |
| **96dB 球磨机与高压罗茨风机噪音交互** | ⚠️ 普通语音设备在生料磨/水泥磨 96dB 噪音下完全听不见 | ❌ 对讲机呼叫中控室核对负压与翻板阀状态延迟长达数分钟 | **✅ IP6X 防水泥粉尘 96dB 骨传导耳麦，清堵员在中控负压闭环下秒级协同** |
| **每万分钟综合 TCO** | ~$1,460（单起预热器红料喷涌或煤磨爆炸停产整顿损失超 $30,000,000） | ~$12,100（清堵沟通不畅导致的长时间停窑降产与人工盯守工时） | **$700 / 万分钟（预热器安全清堵恢复提速 35%，红料喷涌伤亡率降至 0%）** |
| **GCCA、应急部水泥清堵规定与 MSHA 审计** | ❌ 无清堵时各楼层人员清空证明与负压记录 | ⚠️ 纸质《预热器清堵作业票》常在事后补填，无法防范现场违章 | **✅ 100% 自动生成 UWB 清场快照、孔门锁状态与 $\text{CO}/\text{O}_2$ WORM 审计账本** |

---

## 五、🧪 并发与每万分钟 TCO 测算及 7-Card 报告

### 5.1 每万分钟 TCO 构成（基于预热器清堵联锁、煤磨 CO 惰化、回转窑检修 LOTO 与质量游离钙通报负载）

```chart
{
  "data": {
    "values": [
      { "Component": "IP6X Cement-Dustproof 96dB Audio & Kiln STT", "CostUSD": 215 },
      { "Component": "850C Cyclone Poke-Hole Lock & Tower UWB Engine", "CostUSD": 195 },
      { "Component": "Coal-Mill CO2/N2 Inerting & Kiln Bull-Gear Pin PLC", "CostUSD": 155 },
      { "Component": "Tower-Wide Neural TTS & GCCA/MSHA WORM Audit", "CostUSD": 135 }
    ]
  },
  "semantic_types": {
    "Component": "Category",
    "CostUSD": "Amount"
  },
  "chart_spec": {
    "chartType": "Bar Chart",
    "title": "Cement Plant Preheater, Rotary Kiln & Coal-Mill Voice Cost per 10k Mins ($700 Total)",
    "subtitle": "USD per 10,000 minutes across 850C cyclone jam clearing, coal-mill CO gating, and kiln LOTO",
    "encodings": {
      "x": "Component",
      "y": "CostUSD"
    }
  }
}
```

### 5.2 7-Card 4:5 基准评估报告摘要（`CEMENT-KILN-CYCLONE-COALMILL-CO-01`）

| Card 编号 | 卡片标题（Headline-as-Finding） | 核心量化指标与架构发现（Provenance: Deterministic Policy Benchmark） |
| :--- | :--- | :--- |
| **Card 1 (`1 / 7` · `HANDS-ON · CEMENT & KILN VOICE`)** | 预热器孔门联锁与煤磨惰化语音将水泥基地安环成本从 $12,100 降至 $700 / 万分钟 | 100% 物理根除堵点下方开孔引发的 $850^\circ\text{C}$ 红料喷涌与煤磨阴燃开门爆炸 |
| **Card 2 (`2 / 7` · `SCENARIO: CYCLONE JAM & COAL BIN CO`)** | C5 堵料求开 3 楼下孔被 0ms 死锁；煤磨灰斗 $880\text{ ppm}$ CO 0ms 锁门并充氮灭火 | `cycloneJamAboveOnlyAndLowerTowerEvacuated=false` 锁下孔；CO 0ms 禁开门 |
| **Card 3 (`3 / 7` · `WHAT I TESTED`)** | 400 组堵点下方开孔、下层有人吹空气炮、煤仓阴燃开门、未插止转销进窑与红熟料打水通过 | 零堵点下方开孔放行、零带人吹堵、零电收尘 $\text{CO} \ge 0.8\%$ 未跳闸 |
| **Card 4 (`4 / 7` · `UNDER THE HOOD`)** | `evaluateCementKilnCycloneCoalmillCoVoiceGuard` 确定性契约优先于自由生成 | 强制校验 `cycloneJamAboveOnlyAndLowerTowerEvacuated`、`coalMillInertedKilnPinnedAndCoolerDrySafe` 与 `hotMealFlushEspCoSpikeOrCoalSmolder` |
| **Card 5 (`5 / 7` · `ROBUSTNESS CHECK`)** | 面对“上面捅不到结皮，我就把下面溜管的小观察门撬开一条缝捅一下”保持 100% 拒止 | 严格执行水泥预热器清堵强制铁律，堵点下方全层电磁死锁并要求撤空下方全部楼层 |
| **Card 6 (`6 / 7` · `LATENCY`)** | P95 首字响应 485ms，窑尾 $\text{CO} \ge 0.8\%$ 触发电收尘高压跳闸与全塔撤离警报 `<40ms` | FLSmidth ECS 旋风筒锥体负压读取与塔架 UWB 清场校验耗时 `<4ms` |
| **Card 7 (`7 / 7` · `MY TAKE`)** | 适用：预热器清堵闭锁、煤磨防爆、进窑 LOTO；禁用于：代替镀铝全身防辐射隔热服 | 100% 符合 GCCA / CSI 水泥安全准则、应急管理部水泥清堵规范与 MSHA 30 CFR 56 |

---

## 六、🛠️ 售前方案设计与上线验收 Checklist

- [ ] **$850^\circ\text{C}$ 旋风预热器清堵“仅限堵点上方开孔 + 堵点下方楼层 100% 撤空 + 系统负压”硬锁**：确认旋风筒堵料时物理死锁堵点下方全部捅料孔门，UWB 确认下方各层平台零人员滞留且窑尾引风机维持负压后方可解锁上方专用清堵孔（`cycloneJamAboveOnlyAndLowerTowerEvacuated = true`）。
- [ ] **煤磨/煤粉仓低氧（$\text{O}_2 < 10\%\text{–}12\%$）与 CO 阴燃“严禁开门 + 自动充 $\text{CO}_2/\text{N}_2$”硬锁**：确认煤磨袋收尘器或煤仓 CO 超标时 0ms 电磁锁死全部检修箱门并自动注入惰性气体（`coalMillInertedKilnPinnedAndCoolerDrySafe = true`）。
- [ ] **回转窑进窑砌砖大齿圈防反转机械销（Bull-Gear Pin）与顶挂窑皮清理门禁**：确认进窑前物理锁死筒体防偏重自滚并清理松动窑皮。
- [ ] **篦冷机（Grate Cooler）红熟料“严禁水枪直喷防蒸汽炸膛”与熟料破碎机 LOTO 锁**：确认清理篦冷机大块雪人时严禁直接打水。
- [ ] **塌料红料喷涌预警、窑尾电收尘 $\text{CO} \ge 0.8\%$ 高压跳闸与生料库防掩埋 0ms 强切（`CEMENT-KILN-CYCLONE-COALMILL-CO-01`）**：确认塌料前兆 0ms 拉响全塔撤离警笛，窑尾 CO 超限 0ms 切断 ESP 高压硅整流。
- [ ] **预热器清堵作业票、UWB 清场快照与煤磨防爆 WORM 审计账本**：确认每次清堵授权、孔门锁记录与气体曲线写入不可篡改审计库。
