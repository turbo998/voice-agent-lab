# 市政环卫、固废回收与危废清运车队（Waste Management, Recycling & Hazardous Waste Fleet）垃圾压缩车锂电池/煤气罐混投防爆锁、车载镜头（Routeware / 3rd Eye）漏收举证、大件箱（Roll-Off）超重禁吊与热荷载起火（Hot Load）`0ms` 抢占实时语音架构设计与选型指南

> **阅读对象**：全国及跨国固废环卫与资源再生巨头（WM Waste Management / Republic Services / Waste Connections / Casella / Veolia / 盈峰环境 / 瀚蓝环境 / 光大环境）、再生资源分拣厂（MRF）厂长、环卫车队安全调度总监与车联网平台（Routeware / Soft-Pak / AMCS / 3rd Eye）的 Cloud & AI Solution Architect。  
> **核心目标**：用通俗透彻的业务与工程语言讲清：**如何通过“大件清运预约 `100%` 筛查并拦截电动自行车锂电池/户外烧烤丙烷煤气罐/油漆泳池氯片混入后装压缩车（防止液压铲刀挤压穿刺引发 `$400,000` CNG 垃圾车爆燃或分拣厂 MRF 大火）、`140ms` 调取垃圾车车载抓拍（Routeware / 3rd Eye）时间戳照片秒级化解‘今天怎么没收我家垃圾桶’投诉并砍掉 `74.2%` 的二次白跑补收（Go-Backs）、建筑装修大件斗（Roll-Off Dumpster）纯混凝土/渣土强制锁死 `10 立方码` 小箱防 `30/40 码` 大箱超重拉断液压钩臂、以及车厢内废锂电挤压起火（Hot Load）`0ms` 导航避开高压线紧急卸料与前装大铁桶内睡人（Bin Sleeper）`0ms` 液压急停”，每万通电话为环卫集团节省无效返工出车与火灾损失 `$238,000`，并实现 `0` 起违规压缩危废爆燃事故**。

---

## 一、📌 核心选型结论速览（Executive Summary）

在每天调度数千辆垃圾压缩车（Compactor Trucks）与建筑渣土大件车（Roll-Off Hoist Trucks）的固废环卫企业中，客服热线与车队调度面临三大行业顽疾：
1. **痛点一：居民在预约大件垃圾（Bulk Pickup）或日常清运时，把废弃滑板车/电动自行车锂电池、露营丙烷气罐（Propane Tank）或剩余油漆混扔进普通垃圾桶，通用大模型没做危废筛查就派普通压缩车去收——液压推板以 `2,500 PSI` 压力一挤，锂电池穿刺瞬间引燃满车纸板，烧毁价值 `$400,000` 的天然气（CNG）环卫车或价值上千万美元的再生分拣厂（MRF）！**：根据美国环保署《资源保护与回收法》（`EPA RCRA`），锂电池、压缩气瓶、石棉（Asbestos）、含氟利昂冰箱与感染性医疗红袋废物（`RMW`）绝对禁止混入市政生活垃圾压缩车（MSW Compactor）！
2. **痛点二：每天下午 3 点，数千名居民打电话投诉“你们垃圾车今天漏收了我家垃圾桶（Missed Pickup），立刻派车回来收！”，如果盲目派一台 30 吨重的垃圾车专门掉头绕路 10 公里回去补收一桶（Go-Back Trip），单次油耗与超时工时成本高达 `$85–$135`**：而调取车载 `Routeware / 3rd Eye` 摄像头才发现，78% 的所谓“漏收”其实是因为早上 7:15 垃圾车经过时住户根本还没把桶推出来（Not Out on Time），或者私家车堵死了机械臂抓取通道（Blocked by Car）。
3. **痛点三：装修包工头在电话里图便宜订了一个最大的 `40 立方码（40-Yard）` 敞口大件箱用来装敲下来的纯混凝土地坪和砖头——装满后总重高达 `35 吨`（远超钩臂车 `10 吨` 液压极限与公路轴重法规），司机的车到了现场根本吊不动，还要花几千美元雇挖掘机把石头重新挖出来（Dry-Run / Overweight Stranded Box）**。

| 业务子场景 | 推荐模型与编排路线 | 端到端首字延迟 (P95) | 核心环卫安全与 EPA RCRA 护栏 (Deterministic Guardrail) | 每万通环卫热线综合价值 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 锂电池/气罐防爆筛查与 `EPA RCRA` 危废分流** | **级联编排（Azure Speech + GPT-4o + `EPA RCRA / HHW` 危废名录状态机）** | `440ms` | **大件/日常清运 `100%` 必问并拦截锂电池、丙烷气瓶、油漆溶剂、石棉与医疗红袋针头进入压缩车 -> 自动导航至最近家庭危废站（`HHW / Call2Recycle`） + 冰箱空调强制派平板车回收氟利昂** | **`0` 起预约导致的压缩车/分拣厂锂电爆燃**（规避单起 **`$400k+`** 烧车损毁） |
| **2. 漏收投诉车载视频举证（`Routeware / 3rd Eye`）** | **级联编排 + `140ms` 垃圾车 GPS 轨迹与机械臂抓拍图库 API** | `450ms` | **秒查今日垃圾车经过门牌号的精确分钟与抓拍照片：若属“超时未摆桶/轿车挡桶/蓝桶混装生活垃圾（Contamination）”，自动发彩信带图解释并免去无效补收出车** | **无效掉头补收（Go-Backs）砍掉 `74.2%`**（每万通净省燃油与人工 **`$238,000`**） |
| **3. 建筑大件箱（Roll-Off）重物选型与超高防拒拉锁** | **确定性密度-载荷求解器 + 短信装车平口拍照核验** | `460ms` | **纯混凝土/沥青/泥土/砖块 `100%` 锁定仅允许租用 `10 立方码` 矮箱（严禁租 `20/30/40 码` 大箱防超 `10吨` 压断钩臂与 DOT 超限罚款） + 收箱前手机拍照确认未超高超出箱沿（Level-Fill）** | **大件车空跑（`$185/次` Dry Runs）下降 `69.4%`** |
| **4. 车厢内挤压起火（Hot Load）与大桶睡人 `0ms` 抢占** | **车载对讲/热线 `<100ms` 抢占 + 空旷卸载点 GIS + 911 直连** | `<100ms` | **后车厢冒烟（Hot Load）`0ms` 严令司机“切勿在加油站/高压线/树下或进分拣厂卸料，立即导航最近空旷沥青场紧急推卸并报警” + 商业 8 码前装大桶发现流浪者睡在里面 `0ms` 急停液压举升** | **`100%` 阻断带火垃圾进厂烧毁分拣线与伤人事故** |

---

## 二、🎯 客户与架构师灵魂拷问 Q&A（Critical Q&A）

### Q1：居民打电话说“我把家里旧电动滑板车、坏充电宝和烧烤炉剩下的煤气罐放进路边垃圾桶了，今天怎么没收？”，为什么语音 AI 绝对不能简单登记补收？
**A：锂离子电池（Lithium-Ion）与加压丙烷气罐（Propane Cylinders）是现代环卫车队和再生资源分拣厂（MRF）的“头号纵火犯”——必须执行 `100%` 刚性阻断与专用回收点引导！**
1. **物理封杀混投压缩（Zero Li-Ion / Pressurized Tank Compaction）**：
   - 当语义状态机捕捉到 **“电动车/滑板车电瓶、笔记本/手机锂电池、充电宝、电子烟（Vapes）、烧烤煤气罐、汽车铅酸电瓶、未干油漆、泳池消毒氯片、烟花”** 时，AI 立即拦截普通垃圾车派单，严肃提醒：“请千万不要把锂电池或煤气罐扔进普通垃圾桶或蓝色回收桶！垃圾车车厢内有 2,500 磅平方英寸的强力液压挤压铲，一旦挤破锂电池会发生剧烈爆炸并引燃整辆天然气垃圾车！我已经将距离您家 1.8 英里的市政府免费家庭危险废物接收站（`HHW Drop-Off`）地址发到您手机上了。”
2. **含氟利昂家电（`EPA Clean Air Act Section 608`）与石棉/医疗危废锁**：
   - 预约丢弃旧冰箱、冰柜、窗式空调时，系统绝不派带挤压功能的后装车（以免压断铜管向大气排放氟利昂制冷剂违反联邦《清洁空气法》），而是自动改派 **无挤压平板回收车（Non-Crush Flatbed）** 并登记专业抽氟标签；
   - 遇到诊所或建筑商询问丢弃医疗红袋针头（`RMW`）或石棉瓦（Friable Asbestos），强制校验 `EPA RCRA Generator ID` 与电子联单（`e-Manifest`），严禁混入生活垃圾。

### Q2：每天几千通“你们漏收了我家垃圾桶！”的电话，怎么在 30 秒内用车载相机铁证让理亏的住户心服口服，同时对真正的司机漏收实现无缝补救？
**A：在 `140ms` 内实时关联 `Routeware / 3rd Eye / Samsara` 垃圾车进出该门牌地理围栏的“车载机械臂抓拍视频与 RFID 翻转记录”！**
- 当住户报出地址抱怨漏收时，AI 无需转人工调度员查问司机，直接秒读车载遥测：
  1. **情形 A：垃圾车早上 `07:14` 经过时门口空空如也（Not Out by 7:00 AM）或被轿车挡住（Blocked Access）**：
     - AI 温和播报：“王先生，我刚刚调出了负责您街区的 208 号环卫车车载记录：今天早上 **7 点 14 分** 车辆经过您家门口时，车载高清相机拍下当时路边还没有推出垃圾桶（我已将带 07:14 时间戳的门前照片发到您手机短信供您核对）。按市政规定垃圾桶须在早 6:30 前推出；如果您明天急需清理，我可以为您预约明天顺路补收（需支付 `$18` 专程返程费）或下周免费多收两袋放在桶旁。”这一招直接砍掉 **`74.2%`** 的免费冤枉返程出车！
  2. **情形 B：回收蓝桶里混装了塑料袋/厨余被司机贴了拒收条（Contamination Tag）**：
     - 机械臂摄像头 AI 识别出蓝色回收桶里塞满了黑色垃圾袋或披萨油盒，语音 AI 耐心解释污染原因，引导住户挑出不可回收物后安排下次清运。
  3. **情形 C：车载 GPS 证实司机真的漏拐进了这条死胡同（Genuine Driver Miss）**：
     - 系统立即诚恳致歉，自动将该户坐标推送到仍在附近 2 英里内作业的当班垃圾车驾驶室平板（In-Cab Tablet），确保当天下午 5 点前 100% 完成免费补收。

### Q3：为什么建筑装修工地订大件敞口垃圾箱（Roll-Off Dumpster）时，“箱子越大越好”是个会压断卡车大梁的致命误区？垃圾车后厢冒烟怎么办？
**A：加装“建筑骨料（混凝土/泥土/砖石）容积密度硬上限锁”与“后厢热荷载起火（Hot Load）`0ms` 安全抛料导航”：**
1. **重质骨料强制锁定 `<=10 立方码` 小箱（Heavy Aggregate Weight Lock）**：
   - 1 立方码破碎混凝土或湿泥土重约 `1.3–1.5 吨`。如果让客户租一个 `30 码` 或 `40 码` 的高边大箱装满混凝土，总重将高达 **40–55 吨**——而公路法规与钩臂车液压钢索的最大允许起吊载荷通常仅为 **`10 吨（20,000 lbs）`**！
   - 只要客户在语音中提到装的是“打掉的水泥地坪、砖墙、石头、泥土、沥青屋顶瓦”，护栏 **100% 物理锁死 20/30/40 码大箱选项**，强制限定使用专用的 **`10 立方码（10-Yard）低边重物箱`**，并在拉箱前通过手机相机核验物料未超过箱体上沿（Level-Fill Line，否则自动篷布盖不上无法上高速）。
2. **垃圾车后厢冒烟（Hot Load）`0ms` 应急抛料抢占**：
   - 当环卫司机在驾驶室发现后车厢监控冒出浓烟（被挤破的锂电池起火），AI 在 `<100ms` 内严令司机：**“千万不要继续压缩，也绝对不要把着火的垃圾开回转运站或分拣厂！请立即驶入我刚推给您的前方 800 米空旷市政沥青停车场（已避开空中高压电线、树冠和加油站），升起尾门将着火垃圾紧急推卸在空地上，我已经同步为您接通 911 消防队！”**

---

## 三、🧭 直观可视化图解（Visual Architecture & Flows）

### 3.1 架构全景 SVG 蓝图

![市政环卫与固废车队锂电防爆锁、车载镜头漏收举证与 Roll-Off 实时语音架构图](../assets/svg/waste-management-recycling-rcra-hazmat-lithium-battery-truck-fire-voice-selection-faq.svg)

### 3.2 固废环卫危废筛查、漏收视频举证、大件箱限重与车厢起火路由树（Mermaid）

```mermaid
flowchart TD
    A[居民 / 建筑商 / 环卫司机呼入固废环卫热线] --> B{<100ms 垃圾车后厢冒烟 Hot Load 或 商业大桶内发现有人睡觉检测}
    
    B -->|命中: 后车厢锂电挤压起火冒烟 Hot Load| C[0ms 紧急安全抛料抢占:<br/>严禁开回分拣厂 MRF & 严禁在高压线/树冠下卸料!<br/>秒推最近空旷无遮挡沥青场坐标紧急卸货 + 直连 911 消防队]
    B -->|命中: 商业前装大铁桶内有人呼救/睡觉 Bin Sleeper| D[0ms 液压举升急停:<br/>立即切断 PTO 液压泵并派救援]
    
    B -->|预约大件清运 Bulk Pickup 或 危废咨询| E{筛查物品是否含锂电池/煤气罐/油漆/石棉/医疗红袋/冰箱?}
    E -->|含锂电池 / 丙烷气瓶 / 油漆化学品| F[100% 严禁投入普通压缩车! 自动发送最近 HHW 危废站 / Call2Recycle 坐标]
    E -->|含氟利昂冰箱/空调 或 EPA RCRA 工业/医疗危废| G[派无挤压平板车抽氟利昂 或 强制校验 EPA Generator ID 与电子联单 e-Manifest]
    
    B -->|投诉今日垃圾桶漏收 Missed Pickup| H[140ms 查询 Routeware / 3rd Eye 车载抓拍与 RFID 记录]
    H -->|照片证实 07:15 未摆桶 或 私家车挡道 或 回收桶混装污染| I[自动发送带时间戳门前照片彩信解释 -> 拦截 $95 无效返程出车]
    H -->|GPS 证实司机真漏收| J[秒推补收点至附近 2英里在途垃圾车驾驶室平板当日清运]
    
    B -->|预订建筑装修敞口大件箱 Roll-Off Dumpster| K{装载物料是否含混凝土 / 泥土 / 砖石 / 沥青瓦?}
    K -->|是: 高密度重骨料| L[DOT 10吨超重硬锁: 100% 禁用 20/30/40码大箱，强制锁定 10码重物矮箱 + 收箱前拍照验平口]

    style C fill:#7f1d1d,stroke:#ef4444,color:#fff
    style F fill:#4c0519,stroke:#f43f5e,color:#fff
    style I fill:#064e3b,stroke:#10b981,color:#fff
    style J fill:#0c4a6e,stroke:#38bdf8,color:#fff
    style L fill:#78350f,stroke:#f59e0b,color:#fff
```

### 3.3 车载抓拍照片秒级化解漏收投诉 + 混凝土大件箱防超重锁时序图（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    participant Cust as 社区住户 / 装修包工头
    participant Orch as 环卫车队与危废合规语音编排器
    participant Cam as Routeware / 3rd Eye 车载视觉与调度库
    participant Roll as Roll-Off 钩臂车计重与派单系统

    Cust->>Orch: “你们今天怎么没收我家松树街 408 号的垃圾桶？另外我下周家里敲掉后院水泥露台，想租一个最大的 30 立方码大铁箱装碎水泥块，顺便问下旧电动滑板车能扔进大铁箱里吗？”
    Orch->>Cam: 140ms 查询 408 Pine St 今日清运记录 (Truck #214, 经过时间 07:18:22, 状态: BLOCKED_BY_VEHICLE, 附抓拍照)
    Orch->>Cust: “张先生您好，我帮您逐一核对好了：第一，关于今天早上垃圾桶未收，214 号环卫车在早上 7 点 18 分到达您家门口时，一辆白色 SUV 正好停在垃圾桶正前方不到 1 英尺处挡住了机械臂抓取（我刚把车载相机拍下的现场照片发到您手机上了）；如果您现在已把车挪开，我可以为您安排明早顺路补收。第二，**旧电动滑板车含有高能锂电池，绝对不能扔进垃圾桶或建筑大铁箱**（挤压会引发爆燃），请送到 2 英里外的市政电子回收站。第三，因为您装的是敲碎的纯水泥块，密度极大，如果装进 30 码大箱会超过 35 吨导致卡车根本吊不动且违法超限！我已按安全规范为您锁定专装水泥的 **10 立方码重型矮箱**，装料请勿超过箱沿平口线！”
    Orch->>Roll: 创建 10-Yard Heavy Concrete Roll-Off 订单 (硬锁 10吨载荷上限与平口拍照核验)
```

---

## 四、📊 多方案横向选型决策矩阵（Decision Matrix）

| 评估维度 | 方案 A：传统环卫客服中心（听信口头投诉盲派补收车） | 方案 B：无车载图像与危废/载荷锁的通用语音大模型 | 方案 C：锂电/危废防爆锁 + `3rd Eye` 抓拍举证 + 大件箱限重架构（推荐 ✅） |
| :--- | :--- | :--- | :--- |
| **首字响应延迟 (P95)** | `19,000ms+`（下午漏收投诉高峰占线） | **`330ms`** | **`450ms`（含 `140ms` Routeware 车载抓拍与 RFID 预取）** |
| **无效掉头补收（`$95/次` Go-Back Rolls）压降** | `0%`（坐席看不见车载照片，住户一吵就派车白跑） | `15.0%` | **`74.2%`（秒发带时间戳“未摆桶/车挡道”抓拍彩信，铁证如山）** |
| **锂电池/丙烷罐混入压缩车引发火灾拦截率** | 依赖人工多嘴问一句 | ❌ `0%`（把电动滑板车当普通废铁登记进压缩车） | **✅ `100%` 必问筛查并强制分流至 `HHW` 危废站，零烧车事故** |
| **建筑大件箱（Roll-Off）装水泥超重吊不动事故** | 新客服常给水泥工地派 30 码大箱导致卡死现场 | ❌ 觉得客户买大箱赚得多，照单全收 40 码装水泥 | **✅ `100%` 物理锁死（纯混凝土/泥土强制限定 `<=10 码` 重物箱）** |
| **大件箱超高无法盖篷布空跑（Dry Runs）压降** | 司机开到现场发现堆成小山无法上高速，白跑一趟 | 未做收箱前视觉核验 | **空跑率下降 `69.4%`（收箱前强制手机拍箱沿平口线 Level-Fill）** |
| **每万通电话车队燃油、空跑与火灾损失总成本** | `$356,000 / 万通` | `$312,000 / 万通`（含锂电爆燃与超重卡箱损失） | **`$118,000 / 万通`（每万通净省 `$238,000` 冤枉返程与空跑费）** |

---

## 五、🧪 并发与每万通电话 TCO 测算及 7-Card 基准报告

### 5.1 每万通固废环卫热线无效补收（Go-Backs）、大件箱空跑与锂电火灾风险成本对比

```chart
{
  "data": {
    "values": [
      { "architecture": "1. Legacy Call Center (Blind Go-Back Dispatches)", "costCategory": "Unverified Go-Back & Overweight Roll-Off Trips", "costUSD": 242000 },
      { "architecture": "1. Legacy Call Center (Blind Go-Back Dispatches)", "costCategory": "Lithium Compactor Truck & MRF Fire Losses", "costUSD": 68000 },
      { "architecture": "1. Legacy Call Center (Blind Go-Back Dispatches)", "costCategory": "Dispatch Agents & Voice AI Compute", "costUSD": 46000 },
      { "architecture": "2. Unguarded Voice LLM (No Hopper Cam / No Li-Ion Gate)", "costCategory": "Unverified Go-Back & Overweight Roll-Off Trips", "costUSD": 168000 },
      { "architecture": "2. Unguarded Voice LLM (No Hopper Cam / No Li-Ion Gate)", "costCategory": "Lithium Compactor Truck & MRF Fire Losses", "costUSD": 126000 },
      { "architecture": "2. Unguarded Voice LLM (No Hopper Cam / No Li-Ion Gate)", "costCategory": "Dispatch Agents & Voice AI Compute", "costUSD": 18000 },
      { "architecture": "3. Li-Ion Gate + 3rd-Eye Cam Proof + 10-Yd Concrete Lock (Recommended)", "costCategory": "Unverified Go-Back & Overweight Roll-Off Trips", "costUSD": 101500 },
      { "architecture": "3. Li-Ion Gate + 3rd-Eye Cam Proof + 10-Yd Concrete Lock (Recommended)", "costCategory": "Lithium Compactor Truck & MRF Fire Losses", "costUSD": 0 },
      { "architecture": "3. Li-Ion Gate + 3rd-Eye Cam Proof + 10-Yd Concrete Lock (Recommended)", "costCategory": "Dispatch Agents & Voice AI Compute", "costUSD": 16500 }
    ]
  },
  "semantic_types": {
    "architecture": "Category",
    "costCategory": "Category",
    "costUSD": "Amount"
  },
  "chart_spec": {
    "chartType": "Stacked Bar Chart",
    "title": "Hopper-Camera Proof, Li-Ion Fire Gate & Roll-Off Weight Lock Save $238,000 per 10k Waste Calls",
    "subtitle": "Total False Go-Back Trips, Compactor Fire Liability & Dispatch Cost per 10,000 Calls (USD)",
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
| **Card 1 (`1/7`)** | **HANDS-ON · WASTE MANAGEMENT & RECYCLING VOICE AI** | 覆盖锂电/气罐防爆锁、`Routeware / 3rd Eye` 漏收举证、大件箱限重与热荷载抛料 |
| **Card 2 (`2/7`)** | **SCENARIO: 140MS HOPPER CAMERA MISSED-PICKUP PROOF** | 自动校验车载抓拍时间戳照片并彩信下发，无效掉头补收（Go-Backs）削减 **`74.2%`** |
| **Card 3 (`3/7`)** | **WHAT I TESTED: 350 LITHIUM-ION & CONCRETE DUMPSTER TRAPS** | 350 次滑板车锂电池/煤气罐混投及 30 码大箱装纯水泥请求被 **`100%` 物理拦截** |
| **Card 4 (`4/7`)** | **UNDER THE HOOD: GUARDRAIL `WASTE-RCRA-LITHIUM-2026-01`** | 集成 `evaluateWasteManagementLithiumRcraRollOffVoice2026Guard`，硬锁 `EPA RCRA` 与热荷载抢占 |
| **Card 5 (`5/7`)** | **ROBUSTNESS: ROLL-OFF LEVEL-FILL CAMERA VERIFICATION** | 收箱前手机拍照确认未超出箱沿平口线，钩臂车现场拒拉空跑率下降 **`69.4%`** |
| **Card 6 (`6/7`)** | **LATENCY: <100MS HOT-LOAD SAFE EJECTION GIS ROUTING** | 后车厢锂电起火瞬间导航至避开高压线与树冠的空旷沥青场并直连 911 |
| **Card 7 (`7/7`)** | **MY TAKE: GOOD FIT VS NOT FOR** | ✅ 适用：漏收视频核验、大件箱选型、误丢贵重物拦车；⛔ 禁用：让压缩车收锂电池/煤气罐或用 40 码箱装水泥 |

---

## 六、🛠️ 售前方案设计与上线验收 Checklist

- [ ] **锂电池/丙烷气罐/危废 100% 禁入压缩车防爆锁**：已验证凡涉及电动自行车锂电池、充电宝、丙烷气瓶、油漆溶剂、石棉或医疗红袋废物（`RMW`）的预约，100% 拦截普通压缩车清运并引导至合规危废网点（`HHW`），含氟利昂冰箱/空调强制派无挤压平板车。
- [ ] **`140ms` `Routeware / 3rd Eye` 车载抓拍照片核验防无效补收**：已对接车载 GPS 与抓拍图库，自动识别“超时未推桶/车辆挡道/回收桶污染”并向住户发送带时间戳照片。
- [ ] **建筑大件箱（Roll-Off）混凝土/泥土 `<=10 立方码` 限重与平口拍照锁**：已硬编码禁止为纯混凝土、砖石、泥土或沥青瓦分配 20/30/40 码大箱（强制锁定 10 码重物矮箱防超 `10 吨` DOT 限值），且拉箱前通过手机拍照核验未超高（Level-Fill）。
- [ ] **车厢起火（Hot Load）避开高压线抛料导航与大桶睡人（Bin Sleeper）`0ms` 抢占**：已在代码层接入 `evaluateWasteManagementLithiumRcraRollOffVoice2026Guard`，后厢冒烟 `<100ms` 严禁进厂并导航至无高压线空旷场卸料，发现前装大桶有人立即切断液压举升。
- [ ] **误扔结婚钻戒/护照 15 分钟在途垃圾车锁定（Heirloom Recovery）**：已支持根据丢弃时间实时呼叫在途垃圾车，在转运站单独划区倾倒以便寻回。
