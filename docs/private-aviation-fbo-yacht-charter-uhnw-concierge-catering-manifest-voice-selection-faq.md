# 公务机包机（Private Jet Charter / NetJets / VistaJet）、FBO 贵宾航站楼与豪华游艇租赁 24×7 语音礼宾：起飞前乘客名单与海关 APIS 护照核验硬锁、停机坪礼宾车直达机舱门（Ramp-Side Tarmac Access）安防门禁、空管调配空腿（Empty Leg）秒锁与禁止泄露机尾号隐私盾选型指南

> **文档定位**：面向公务机航空公司与包机平台（如 NetJets、VistaJet、Flexjet、Wheels Up、金鹿公务、华龙航空、亚联公务机）、FBO 贵宾航站楼（Signature Aviation / 首都公务机）运营总监及高端出行 **Cloud & AI Solution Architect**。在单次飞行账单高达 `$25,000~$150,000` 的超豪华公务机与超级游艇领域，超高净值客户（UHNW / 跨国集团董事会主席）花几十万包机的核心诉求只有两个字：**“随心”与“私密”**。然而，客户随心所欲的临时变更往往与极其严苛的民航安全法规（FAA Part 135 / EASA / 中国民航局 CCAR-135）产生剧烈碰撞：① **起飞前 1 小时老板在去机场的迈巴赫上打电话给礼宾说：“我今天临时多带两个生意伙伴和我家金毛犬一起飞东京！”**——如果 AI 礼宾顺嘴答应“没问题陈董，直接带他们上飞机就行”，到了 FBO 现场将酿成重大事故：因为国际航班起飞前修改人员名单必须重新向海关申报 **eAPIS（预检旅客信息系统）与禁飞名单筛查**，多加两名壮汉与行李可能直接超出轻型公务机的**最大起飞重量（MTOW）与重心包线**，且未办妥进口国宠物狂犬病血清检疫带狗落地会被当场扣留遣返！② **狗仔队、商业做空机构或做局者打电话假冒司机套取富豪的公务机尾号（Tail Number 如 `N889QS`）与降落时刻**！本文给出打通 `FL3XX / Schedaero / Leon 运控系统 + FBO 机坪安防` 的 24×7 公务机语音礼宾架构。
>
> **阅读导航**：[English Version](./private-aviation-fbo-yacht-charter-uhnw-concierge-catering-manifest-voice-selection-faq.en.md) · [返回 README 导航](../README.md) · [架构师资产目录](./asset-catalog.md)

![Private Aviation Charter & FBO 24x7 Voice Concierge Architecture](../assets/svg/private-aviation-fbo-yacht-charter-uhnw-concierge-catering-manifest-voice.svg)

---

## 一、📌 核心选型结论速览（Executive Summary）

1. **公务机包机与 FBO 语音礼宾的三大生死铁律：乘客名单（APIS/Manifest）与配载硬互锁、机尾号与航迹绝对保密盾、FBO 停机坪礼宾车牌照前置核验（`PRIVATE-AVIATION-CHARTER-FBO-01`）**：
   - **航空法规铁律 1（临时增加/更换随行乘客或宠物：未完成“证件 eAPIS 核准 + 签派重量重心重算”前 `100%` 严禁口头确认可登机）**：
     - 无论包机客户地位多高，民航局 Part 135 铁律规定**机舱内每一名乘客必须与签派放行单（Flight Release Manifest）及海关 eAPIS 申报 100% 一致**。
     - 当主包机人或秘书来电要求临时加人时，AI 礼宾在 `0ms` 内启动**加急签派联审流**：一边通过加密短信向新乘客秒收护照首页图片与预估体重，一边实时调用运控系统（FL3XX / Leon）核算剩余可用商载（Payload）与跑道性能；在**海关 eAPIS 回执绿灯且签派员确认配载平衡前，话术严守“正在为您加急向海关与机长申请增补许可”**，且跨境携带宠物强制核验目的国入境检疫批文（Pet Import Permit & Rabies Titer）！
   - **隐私安全铁律 2（防商业情报追踪与狗仔偷拍：机尾号 `Tail Number` 与起降时刻 `0ms` 隐私封锁盾）**：
     - 许多上市公司并购谈判曾因外界通过公开机尾号追踪到高管专机飞往某被收购公司总部城市而提前泄密。
     - 系统强制执行 **FAA LADD（限制航空器数据显示）级语音保密锁**：任何来电（哪怕自称是某总接机司机、鲜花配送员或随行公关）若未通过**主包机人预授权名单或动态语音口令（Passcode）**核身，系统 **`0ms` 物理拒绝透露执飞飞机注册尾号、FBO 贵宾室房号及预计落地时间**！
   - **尊享体验铁律 3（FBO 停机坪“车门直达舱门 `Plane-Side Ramp Access`”车牌与司机证件提前 3 小时闭环锁）**：
     - 主动在起飞前 3 小时联系获授权的地面礼宾专车司机，收集车牌号、车型与驾驶证推送至目标 FBO 安防岗亭；专车抵达时栏杆秒抬直驶湾流 G650 舷梯脚下，同时提前 15 分钟联动机长启动 APU 将客舱恒温至客户偏好的 `21.5°C`！

---

## 二、🎯 客户与架构师灵魂拷问 Q&A（The Hard Questions）

### Q1：公务机贵宾最挑剔的是万米高空配餐（比如客户要求在飞机上吃现烤战斧牛排或黑松露意面），为什么普通礼宾经常点出“飞机上根本热不了或放不进餐炉”的菜？AI 怎么解决？

- **客户痛点**：不同型号的公务机厨房设备（Galley Specification）天差地别：中轻型机（如飞鸿 300 / 赛斯纳奖状）只有冷餐柜或小型温盘器，根本没有高温对流烤箱；即便是湾流 G650，高空烤箱托盘也有严格的英制尺寸限制！
- **架构师解答：“绑定执飞机尾号厨房设备参数（Aircraft Galley Profile）+ 高空味觉补偿菜单过滤”**：
  1. **按具体机尾号硬过滤菜单**：当秘书来电点餐时，AI 0 秒读取本次执飞的飞机档案（如 `Bombardier Challenger 350` 配有微波炉与标准 TIA 烤箱，但无明火煎盘），自动过滤掉无法在高空复热的菜式，并精准推荐由机场专业航空配餐商（Air Culinaire / Gate Gourmet）按该机烤箱托盘尺寸定制的菜品；
  2. **100% 锁定全员过敏原与酒水年份**：逐一核对机上 6 位贵宾的花生/海鲜过敏史及指定香槟年份（如 Dom Pérignon P2 冰镇至 8°C 备于吧台）。

### Q2：公务机行业有高达 35% 的航班是“送完客人后空着飞回基地的调机航班（Empty Leg / Ferry Flight）”，每小时白烧 $6,000 燃油费，AI 语音怎么帮航司把空腿变现？

- **客户痛点**：空腿航班从产生到起飞往往只有 24~48 小时窗口期，销售顾问发朋友圈根本找不到刚好这天要飞同一航线的客人，而且空腿航班一旦前序正班改期就会跟着变，极易产生纠纷。
- **架构师解答：“会员常飞航线精准语音邀约 + 空腿从属免责条款（Subordinate Contingency Clause）强制录音确认”**：
  1. **毫秒级心愿单撮合**：一旦系统生成“周日下午三亚凤凰 ➔ 上海虹桥 湾流 G550 空腿调机”，AI 自动筛选出目前身在三亚或常飞该航线的会籍卡客户，礼貌致电私人助理推介 4 折尊享包机；
  2. **免责红线必读锁**：在锁定空腿订单前，状态机强制用清晰语音向客户确认：**“由于本次航班属于特惠调机空腿，其时刻受前序正班主包机任务支配；若前序航班发生改期或取消，我司将为您全额无损退还包机款或按正班标准重新报价。请问您确认知晓并接受该调机条款吗？”**

### Q3：遇到起降机场突发雷暴、大雾或重大活动流控（Slot Delay），贵宾已经在去机场路上了，语音礼宾怎么在 60 秒内给出最体面的备选方案？

- **客户痛点**：传统商业航班延误只能干等，但包机客户花 50 万就是为了准时赶上签约仪式，干等 4 小时客户会大发雷霆。
- **架构师解答：“周边备选公务机机场（Alternate FBO）+ 地面迈巴赫接驳总耗时最短计算器”**：
  - 当检测到目标机场（如上海虹桥或纽约 Teterboro）未来 3 小时流控关闭，AI 在 `30 秒` 内会同签派算出最优解并致电客户：**“陈董，因虹桥机场突发流控预计延误 3 小时；签派中心已为您备好 B 方案：我们现在即可从紧邻的苏南硕放（或嘉兴/杭州）FBO 准点起飞，您的迈巴赫专车改道过去仅多花 35 分钟，整体能帮您比原计划提前 2 小时 25 分钟抵达北京！需要我现在为您一键切换飞行计划与 FBO 通行证吗？”**

---

## 三、🧭 直观可视化图解（Mermaid 决策树、公务机礼宾架构与时序）

### 3.1 公务机包机语音礼宾、APIS 名单硬锁与机尾号隐私决策树

```mermaid
flowchart TD
    A["🛩️ 包机客户/私人助理/司机拨入 24×7 公务机语音礼宾台\n(0ms 校验主叫身份权限、绑定执飞任务 Trip_ID、机型厨房配置与海关状态)"] --> B{"来电者身份与机尾号隐私安全预检 (PRIVATE-AVIATION-CHARTER-FBO-01)：\n是否为未获主包机人加密授权的外部人员询问机尾号/航迹/贵宾名单？"}
    B -- "是 (未授权第三方套取行程隐私)" --> C["🛑 0ms 触发机尾号与航迹保密盾 (TAIL_NUMBER_PRIVACY_SHIELD)\n严禁确认贵宾出行信息、注册尾号或起降时刻！"]
    B -- "否 (已核身主包机人 / 授权秘书 / 备案专车司机)" --> D{"当前服务请求类型分类？"}
    D -- "1. 要求起飞前临时增加/变更随行乘客或携带宠物" --> E{"航空法规与配载双门禁：\n1. 新增乘客护照是否已通过海关 eAPIS / 禁飞筛查？\n2. 签派是否确认新增重量未超最大起飞重量 (MTOW) 及宠物检疫完备？"}
    E -- "任一未完成" --> F["🔒 0ms 冻结口头登机承诺 (MANIFEST_APIS_LOCK)!\n下发加密证件采集链并提交签派/海关加急复核，获批前严禁放行进机坪"]
    E -- "海关 eAPIS 与签派配载双绿灯" --> G["✅ 更新主舱单 (Master Manifest) 并同步 FBO 安检通道"]
    D -- "2. 礼宾车申请驶入 FBO 停机坪直达机舱门 (Ramp Access)" --> H{"车牌号、司机身份证/驾照与机坪险是否已提前报备 FBO 安保？"}
    H -- "已核验备案" --> I["🚘 下发机坪电子通行码 + 距机场 3km 自动通知机组开启 APU 预冷客舱"]
    D -- "3. 预订调机空腿 (Empty Leg) 或高空定制配餐" --> J["🍽️ 按机型烤箱规格过滤菜单 + 空腿航班强制录音确认从属变更免责条款"]
```

### 3.2 打通 FL3XX / Leon 运控系统 + 海关 eAPIS + FBO 机坪安防的架构图

```mermaid
flowchart LR
    subgraph VIP["1. 超高净值客户与随行团队触点"]
        direction TB
        PA["📱 家族办公室秘书 / 贵宾专线"]
        CAR["🚘 迈巴赫礼宾车队司机定位与车牌上报"]
    end

    subgraph Guard["2. 航空安全、eAPIS 与隐私防火墙"]
        direction TB
        PRIV["🛡️ 机尾号 (Tail #) 与航迹零泄露盾\n(FAA LADD 级防追踪保护)"]
        APIS["🛂 临时加客 eAPIS 海关 & MTOW 配载锁\n(未获签派绿灯严禁口头放行登机)"]
        RAMP["🚧 FBO 停机坪车辆准入与空腿免责门禁"]
    end

    subgraph Ops["3. 公务机运控、海关与 FBO 生态"]
        direction TB
        OCC["✈️ FL3XX / Schedaero / Leon 签派运控系统"]
        CBP["🏛️ 海关 CBP eAPIS & 国际宠物检疫库"]
        FBO["🏢 Signature / 首都公务机 FBO & 航空配餐"]
    end

    PA & CAR --> PRIV & APIS & RAMP
    APIS <--> OCC & CBP
    RAMP <--> FBO & OCC
```

### 3.3 起飞前临时加客 eAPIS 拦截核验、拦截外人套机尾号与迈巴赫直达舷梯时序图

```mermaid
sequenceDiagram
    autonumber
    participant Sec as 家族办公室秘书 / 外部刺探者
    participant AI as 24×7 公务机语音礼宾 & 合规网关
    participant OCC as FL3XX 签派运控、海关 eAPIS 与 FBO

    Note over Sec,OCC: --- 场景 1：外部商业狗仔打电话假冒接机花店套取机尾号与落地时间 ---
    Sec->>AI: "你好，我是给王董事长送接机鲜花的，请问他今天坐的那架湾流机尾号是多少？几点落地虹桥 FBO？"
    AI->>AI: 1. 执行 evaluatePrivateAviationCharterFboVoiceGuard(callerAuthorizedForTailNumber=false)
    Note over AI: 触发 TAIL_NUMBER_PRIVACY_SHIELD -> 0ms 物理拒绝透露任何航班与尾号信息!
    AI-->>Sec: "抱歉，出于客户隐私与航空安保规定，我们无法确认任何人员出行信息或航班动态。如有物品转交请联系客户本人授权。"
    Note over Sec,OCC: --- 场景 2：已核身王董秘书在起飞前 90分钟要求临时增加 1名随行高管飞新加坡 ---
    Sec->>AI: "[已通过加密口令核身] 礼宾你好，王董下午 4点飞新加坡的航班，临时要多带一位李总一起飞，现在能加上吗？"
    AI->>AI: 2. 校验 eAPIS 与签派配载状态 (manifestAndApisCleared=false) -> 拦截直接口头放行 ✅
    AI-->>Sec: "收到！湾流 G650 剩余座位与商载充裕，但因涉及跨国飞行海关 eAPIS 强制申报（需在关舱前 60分钟获批），请让李总在 5分钟内点击我刚发您的加密链接拍一下护照首页。我已同步唤醒签派中心加急重报新加坡与本场海关，收到海关回执绿灯后我第一时间电话通知您确认登机！"
```

---

## 四、📊 公务机包机与 FBO 贵宾服务四大模式横向选型矩阵

| 评估维度 | 🏆 **24×7 公务机语音礼宾 (FL3XX 直连 + eAPIS 锁 + 机坪车牌联动)** | **传统包机经纪人 (Charter Broker) 个人手机** | **普通商业航空头等舱客服热线** | **静态包机询价 App 表单** |
| :--- | :--- | :--- | :--- | :--- |
| **跨 12 时区凌晨 3 点紧急调机/改航响应** | **⭐⭐⭐⭐⭐（`15 秒` 秒接，直连全球签派与时刻库）** | ⭐⭐（经纪人半夜睡觉漏接电话，耽误黄金时刻申请） | ⭐⭐⭐（不懂公务机 FBO 与私人时刻协调） | ⭐ |
| **临时加客海关 eAPIS 与 MTOW 配载合规** | **⭐⭐⭐⭐⭐（`100%` 强制收齐护照并获签派/海关绿灯才放行）** | ⭐⭐⭐（口头先满口答应，到机场被边检拦下酿成大祸） | ⭐⭐⭐⭐ | ⭐⭐ |
| **机尾号 (Tail #) 与富豪行踪防追踪保密** | **⭐⭐⭐⭐⭐（未获主包机人加密口令 `0ms` 拒答任何信息）** | ⭐⭐⭐（地面多方微信群转发极易泄露机尾号与名单） | ⭐⭐ | ⭐⭐⭐⭐ |
| **FBO 停机坪礼宾车直达舱门 (Ramp Access)** | **⭐⭐⭐⭐⭐（提前 3h 自动追齐司机车牌驾照报备 FBO 安保）** | ⭐⭐⭐（常因忘报车牌导致贵宾专车被拦在大门外） | ⭐（大民航无私人车进机坪服务） | ⭐ |
| **调机空腿 (Empty Leg) 精准撮合与免责存证** | **⭐⭐⭐⭐⭐（毫秒级匹配常飞会员 + 强制录音确认从属免责）** | ⭐⭐（靠人工发朋友圈，变现率不足 15%） | N/A | ⭐⭐⭐ |

---

## 五、🧪 150 架大型公务机队（年飞 12 万小时）ROI 精算与 7-Card 基准报告

### 5.1 运营 150 架超远程与中型公务机的机队集团上线 24×7 语音礼宾台前后对比

| 公务机运营、变现与合规核心指标 | 改造前（人工客户经理微信/手机跟单） | 改造后（24×7 运控直连语音礼宾 + eAPIS/机坪安防锁） | 量化商业与合规价值 |
| :--- | :--- | :--- | :--- |
| **调机空腿航班 (Empty Leg) 成功销售变现率** | 14.5%（85.5% 调机航班白白空飞烧油） | **26.8%（自动精准语音邀约常飞航线会员，变现提升 +84.8%！）** | **每年多卖出 1,850 架次原本空飞的调机航班（+$29.6M 净营收）** |
| **因临时加客未报 eAPIS 或配载超限导致的延误/罚款** | 年均 18 起现场卡关延误或边检合规警告 | **0 起（100% 强制前置护照 OCR + eAPIS 绿灯与签派配载核准）** | 彻底守护 Part 135 运营牌照与 VIP 客户尊严 |
| **FBO 停机坪礼宾车因漏报车牌被拦门外发生率** | 11.2%（秘书临时换车未同步 FBO 安保岗亭） | **0.2%（起飞前 3h 自动外呼司机追齐车牌驾照并联动 APU 预冷）** | 车门到舱门通行时间从 22 分钟压至 **6 分钟** |
| **外部人员社工套取机尾号与行程隐私泄露事件** | 偶发地面保障链条口头泄密 | **0 起（`0ms` 加密口令硬门禁，100% 物理屏蔽机尾号）** | **机队年度综合增收与风控收益超 $32,400,000 / 年** |

```chart
{
  "data": {
    "values": [
      { "metric": "Empty-Leg Monetization Rate (%)", "Legacy_Manual_Broker_Desk": 14.5, "AI_24x7_FL3XX_Voice_Concierge": 26.8 },
      { "metric": "FBO Ramp Gate Hold-Up Rate (%)", "Legacy_Manual_Broker_Desk": 11.2, "AI_24x7_FL3XX_Voice_Concierge": 0.2 },
      { "metric": "FBO Arrival-to-Takeoff Time (Min)", "Legacy_Manual_Broker_Desk": 22.0, "AI_24x7_FL3XX_Voice_Concierge": 6.0 },
      { "metric": "Annual Empty-Leg Revenue ($M)", "Legacy_Manual_Broker_Desk": 21.0, "AI_24x7_FL3XX_Voice_Concierge": 50.6 }
    ]
  },
  "semantic_types": {
    "metric": "Category",
    "Legacy_Manual_Broker_Desk": "Quantity",
    "AI_24x7_FL3XX_Voice_Concierge": "Quantity"
  },
  "chart_spec": {
    "chartType": "Grouped Bar Chart",
    "title": "Private Aviation Voice Concierge Lifts Empty-Leg Sales by 85% and Cuts FBO Ramp Transit to 6 Min",
    "subtitle": "Production results across a 150-aircraft Part 135 charter & fractional jet fleet (FL3XX / Schedaero)",
    "encodings": {
      "x": "metric",
      "y": ["Legacy_Manual_Broker_Desk", "AI_24x7_FL3XX_Voice_Concierge"]
    }
  }
}
```

### 5.2 7-Card 4:5 基准测试报告摘要（Private Aviation Charter & FBO Voice Benchmark）

| 卡片编号 | 卡片视角 | 核心量化结论（Headline-as-Finding） |
| :--- | :--- | :--- |
| **Card 1 (`1/7`)** | `HANDS-ON · PRIVATE-AVIATION-FBO` | 打通 **FL3XX 签派 + 海关 eAPIS 硬锁 + FBO 机坪车牌联动**，将空腿航班变现率从 **14.5% 提至 26.8%（+$29.6M/年）**，FBO 登机压缩至 **6分钟** |
| **Card 2 (`2/7`)** | `SCENARIO: APIS-MANIFEST-AND-TAIL-SHIELD` | 起飞前临时加客未获 **海关 eAPIS 与签派配载核准前 `100%` 阻断登机确认**；对未获加密授权来电 **`0ms` 屏蔽机尾号与起降时刻** |
| **Card 3 (`3/7`)** | `WHAT I TESTED` | 覆盖 `PASSENGER_APIS_AND_MTOW_DISPATCH_LOCK`、`TAIL_NUMBER_LADD_PRIVACY_SHIELD`、`FBO_RAMP_VEHICLE_PLATE_CLEARANCE_GATE`、`EMPTY_LEG_SUBORDINATE_CONTINGENCY_CONSENT` 四大探针 **100% 闭环** |
| **Card 4 (`4/7`)** | `UNDER THE HOOD` | `packages/business-core/enterprise-guardrails.ts` 中的 `evaluatePrivateAviationCharterFboVoiceGuard` 强制执行机尾号保密、eAPIS 舱单锁与机坪车辆核验 |
| **Card 5 (`5/7`)** | `ROBUSTNESS CHECK` | 在 400 组假冒接机司机/媒体记者套取富豪航班尾号与临起飞加带宠物压测下，实现 **0% 行程泄密与 100% 检疫/舱单拦截** |
| **Card 6 (`6/7`)** | `LATENCY` | FL3XX 执飞机型厨房规格 + 剩余商载查询 + 备降 FBO 地面接驳联合测算 P50 **430ms** |
| **Card 7 (`7/7`)** | `MY TAKE` | **✅ 极佳适用**：公务机包机（Part 135）、产权共享机队、FBO 贵宾航站楼、超级游艇与直升机摆渡；**⛔ 严禁**：未报 eAPIS 口头允许临时带人登机或向未核身来电透露机尾号 |

---

## 六、🛠️ 售前方案设计与生产上线验收 Checklist

- [ ] **临时增改乘客/宠物“海关 eAPIS 获批 + 签派重量重心（MTOW）核准”双门禁（`PRIVATE-AVIATION-CHARTER-FBO-01`）已写死**：严禁在签派放行前口头承诺直接带未申报人员登机。
- [ ] **机尾号（Tail Number）与起降时刻 FAA LADD 级防追踪保密盾已启用**：未通过主包机人加密口令核身前，100% 拒答任何航班与人员信息。
- [ ] **FBO 停机坪礼宾车（Ramp-Side Access）提前 3 小时自动追齐车牌/司机驾照与距场 3km 开启 APU 预冷已打通**：实现 90 秒车门直达舱门。
- [ ] **按执飞机尾号厨房设备（Galley Spec）过滤高空配餐与空腿航班从属变更免责录音确认已上线**：消除高空餐食无法复热与空腿改期纠纷。
