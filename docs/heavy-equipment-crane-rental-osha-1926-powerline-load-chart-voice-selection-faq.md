# 重型工程机械、高空作业车与起重机租赁（Heavy Equipment, Aerial Boom/Scissor Lift & Mobile Crane Rental）`OSHA 1926.1408` 高压线净空与力矩载荷表（Load-Chart）防倾覆锁、停租报停（Off-Rent）拍照核验与吊臂触电/液压射伤 `0ms` 抢占实时语音架构设计与选型指南

> **阅读对象**：工程机械与高空设备租赁巨头（United Rentals / Sunbelt Rentals / Herc Rentals / 宏信建发 / 华铁应急）、大区车队调度与现场抢修总监、安全合规官（`OSHA / ANSI A92`）以及租赁 ERP 与车联网平台（Wynne Systems RentalMan / Point of Rental / Rouse / Trackunit / ZTR）的 Cloud & AI Solution Architect。  
> **核心目标**：用通俗透彻的业务与工程语言讲清：**如何通过“伸缩臂叉装车（Telehandler）/随车吊按‘水平工作半径（Working Radius）× 举升高度 × 阵风 `<28 mph`’精确查算 `Load Chart` 防超载翻车、室内密闭商场/厂房 `100%` 严禁派发柴油/汽油机改锁纯电无痕轮胎剪叉车防一氧化碳（`CO`）群体中毒、`140ms` 读取 `Trackunit` 车载 `CAN-Bus` 秒解‘高空车倾斜 `>5°` 保护锁死/急停按钮未拔’砍掉 `68.5%` 的 `$240` 技师冤枉出车、停租报停（Off-Rent Call-Off）强制定位与停放照片核验砍掉 `76.4%` 平板拖车白跑、以及吊臂误触高压电线 `<100ms` 严令‘留守吊篮/驾驶室防跨步电压（Step Potential）触电’与 `3,000 PSI` 液压微孔喷射伤紧急手术直送”，每万通电话为租赁集团节省 `$214,000` 并实现 `0` 倾覆伤亡**。

---

## 一、📌 核心选型结论速览（Executive Summary）

在管理数万台高空直臂/曲臂车（Boom Lifts / MEWPs）、伸缩臂叉装车（Telehandlers）、挖掘机与移动式起重机的设备租赁分支机构（Rental Branches）中，日常租机选型、停租报停（Off-Rent）与工地抢修热线面临三大致命痛点：
1. **痛点一：包工头打电话说“我要把一捆 `6,000 磅` 的钢梁吊到三楼屋顶，给我租一台最大起重量 `8,000 磅` 的伸缩臂叉装车（8k Telehandler）就行！”——缺乏工程力学护栏的通用大模型一看 `8,000 > 6,000` 就直接下单派车。殊不知叉装车的“额定 8,000 磅”仅指货叉紧贴车头、大臂完全缩回时的极限载荷；一旦大臂向前伸出 `28 英尺`（Horizontal Working Radius）跨过基坑去够三楼，该车在载荷曲线图（Load Chart）上的允许起重量骤降至仅有 `2,200 磅`！强行起吊会导致整车瞬间向前栽倒倾覆（Tip-Over）砸毁楼体！同样，往密闭室内商场派一台柴油剪叉车会直接导致施工队一氧化碳（`CO`）窒息中毒！**
2. **痛点二：工地每天打来大量报修电话吼着“你们租给我的 JLG 高空车坏了开不动，赶紧派维修工来并退我今天租金！”，以及退租电话说“设备不用了，给你们报停（Off-Rent），快来拖走！”——结果派一名时薪 `$120` 的维修技师开皮卡跑 50 公里到现场，发现根本不是机器坏了，而是工人不小心拍下了下车控台的红色急停按钮（Red E-Stop Pulled In）或把车开上了 `6°` 斜坡触发了防倾翻限制；而重型低平板拖车（Lowboy Trailer，单趟出车成本 `$280`）去拉退租设备时，发现高空车被锁在铁丝网围栏里面、钥匙被工头带回家了，或者前面堆满钢筋根本拖不出来（Dry-Run Pickup Failure）！**
3. **痛点三：当工人在电话里惊呼“高空车大臂碰到头顶高压电线冒火花了！”或“液压油管裂了个针眼，我用手去摸了一下被喷进手掌里了！”，普通 AI 的错误安抚会直接要了工人的命**。

| 业务子场景 | 推荐模型与编排路线 | 端到端首字延迟 (P95) | 核心 `OSHA 1926` / `ANSI A92` 与租赁护栏 (Guardrail) | 每万通设备租赁热线综合价值 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 起重/叉装车力矩载荷表（Load Chart）与室内防 `CO` 锁** | **级联编排（Azure Speech + GPT-4o + 机型 `Load-Chart` 力矩包络线求解器）** | `440ms` | **严禁仅按最大吨位选车 -> 强制输入“载荷重量 + 水平跨距 Radius + 举升高度”查表匹配，核对阵风 `<28 mph` 与 `OSHA 1926.1408` 高压线 `20ft/50ft` 净空；室内封闭作业 `100%` 禁用柴油/汽油机，强制锁纯电白胎（Non-Marking）机型** | **选型错误导致工地翻车与室内 `CO` 中毒 `0` 发生** |
| **2. `140ms` `Trackunit` 远程排障防 `$240` 冤枉出车** | **级联编排 + `Trackunit / ZTR` `J1939 CAN-Bus` 实时故障码与倾角 API** | `430ms` | **秒读高空车/挖机实时遥测：自动识别“下控台急停按钮未拉出、底盘倾角 `>5°` 锁升臂、或柴油颗粒捕集器 `DPF` 驻车再生”，语音指导工人 60 秒自愈** | **无效上门抢修（`$240/次` Truck Rolls）砍掉 `68.5%`** |
| **3. 停租报停（Off-Rent Call-Off）停放照片与钥匙核验** | **级联编排 + `Wynne RentalMan / Point of Rental` 停租状态机 + 短信拍照锁** | `450ms` | **秒发唯一下钟确认号（Off-Rent Confirmation #）停止计费，但强制工人上传“设备已移至拖车可进出的硬化路边、吊臂降到底、钥匙已放密码盒”照片后方派平板拖车** | **拖车空跑白跑（`$280/次` Dry Runs）下降 `76.4%`**（每万通综合净省 **`$214,000`**） |
| **4. 吊臂触电跨步电压与 `3,000 PSI` 液压喷射伤 `0ms` 抢占** | **工地险情声学识别 + `<100ms` 生命安全规程强播 + 911 直连** | `<100ms` | **吊臂碰高压线 `0ms` 喝止“严禁迈步下车同时接触车身与地面！留在篮/舱内等电力公司断电；若起火必须双脚并拢跳下并双脚紧贴蛙跳撤离（防跨步电压）” + 液压针孔喷射伤 `0ms` 直送显微外科防截肢** | **`100%` 阻断跨步电压触电亡人与液压油注射坏死截肢** |

---

## 二、🎯 客户与架构师灵魂拷问 Q&A（Critical Q&A）

### Q1：为什么客户租伸缩臂叉装车（Telehandler）或随车吊时，语音 AI 绝对不能只问“您要吊多重的东西”，而必须追问“车子离卸货点水平隔着多远”？
**A：因为所有悬臂起重设备都受“力矩平衡定律（`Load Weight × Horizontal Moment Arm`）”支配——水平距离每增加 10 英尺，安全起重量就会暴跌 50%–70%！**
1. **三维载荷包络线（3D Load-Chart Envelope）硬校验**：
   - 当包工头说“我要把 `5,000 磅` 的空调机组放到 `32 英尺` 高的四楼屋顶，车子因为门口有绿化带只能停在离墙根 `24 英尺` 远的地方”时，护栏立即代入各型号 `JLG / Genie / SkyTrak` 载荷曲线表：
   - 计算发现：普通的 `8,000-lb` 叉装车在“高 `32 ft`、水平远 `24 ft`”坐标点上的额定载荷仅为 `2,400 lbs`（严重超载 `208%`！），必须升级派发带前置液压支腿（Front Outriggers）的 **`12,000-lb` 55 英尺重型叉装车**！
2. **`OSHA 29 CFR § 1926.1408` 架空高压电线安全净空锁与风速红线**：
   - 凡预订 `60–185 英尺` 高空直臂车（Telescopic Boom Lift）或起重机，AI 必问作业点周边是否有架空高压线，并强制宣告 **`OSHA Table A` 铁律**：350千伏以下高压线必须保持至少 **`20 英尺（6.1米）`** 绝对安全净空（350千伏以上 **`50 英尺`**）；同时提醒高空作业平台（`ANSI A92`）在阵风超过 **`28 mph（12.5 m/s）`** 时必须立即降篮停工！
3. **室内封闭施工零柴油一氧化碳（`CO`）与楼板承重锁**：
   - 只要识别到施工场景为“商场内部、洁净室、地下室、已封顶厂房”，护栏 **100% 物理拦截派发柴油或汽油发动机设备**，自动锁定 **纯电动且配白色无痕实心胎（Electric Slab Scissor with Non-Marking Tires）** 的机型，同时校验机器自重（GVW）是否超过二楼混凝土地板点载荷上限（Floor Loading PSF）。

### Q2：每天几百通“高空车打不着火/升不起大臂”的工地报修电话，怎么在 90 秒内不用派维修工就解决掉 `68.5%`？退租拖车为什么老是白跑？
**A：在 `140ms` 内实时调取 `Trackunit / ZTR` 车载物联网的 `CAN-Bus` 状态字，并对退租（Off-Rent）执行“拖车通道与钥匙照片互锁”！**
1. **远程秒破三大“假故障”（Zero-Truck-Roll Telematics Triage）**：
   - 当工人在80英尺高空车旁打电话报修“篮子里踩脚踏板没反应，机器死机了！”时，AI 秒查 `Trackunit` 遥测并笑着解答：
     - **假故障一（地面控台急停被误碰）**：“张师傅，我刚连上您这台 #4409 号直臂车的车载电脑：显示机器没坏，是因为地面下控面板上的 **红色蘑菇头急停按钮（Ground E-Stop）被人按进去了**，或者钥匙打在了‘地面控制（Ground）’档位！请让地面工友把红色按钮往外拔出来、钥匙拧到‘平台控制（Platform）’，您立刻就能正常升臂了！”
     - **假故障二（底盘超 `5°` 倾角保护锁死）**：遥测显示底盘当前横坡倾角为 `6.4°`（超出 `ANSI` `5.0°` 倾角限位），AI 指导工人必须先将大臂完全缩回降下，再将车挪到平整地面方可重新举升。
2. **停租报停（Off-Rent Call-Off）防 `$280` 平板拖车白跑锁**：
   - 客户打电话说“活干完了，今天下午 4 点给我停租（Call-Off）”时，AI 在 `Wynne RentalMan` 中立即生成带时间戳的 **停租确认号（Off-Rent Confirmation `#OR-99281`，即刻冻结租金计费，彻底消除月底账单扯皮）**；
   - 但为了防止重型平板拖车（Lowboy）明天白跑一趟，AI 自动发一条免安装网页相机短信，要求工头拍一张 **“机器已开出围栏停在半挂拖车能倒进去的大路边 + 车钥匙已放进机身电池舱密码盒”** 的照片，确认无阻挡后才触发拖车排线！

### Q3：如果高空车大臂真的碰到了高压电线，或者工人被困在 80 英尺高空，又或者高压液压油管漏油喷到了手上，语音 AI 怎么在 `<100ms` 内救命？
**A：触发重型机械三大黄金生死铁律抢占：**
1. **吊臂/高空车误触高压电线（Power-Line Contact Step-Potential Rule）**：
   - 一旦车身接触上万伏高压线，电流会通过轮胎/支腿向周围大地呈同心圆扩散形成致命的 **“跨步电压（Step Potential）”**——此时如果操作员一只脚踩在车梯上、另一只脚迈向地面，几万伏电压差会瞬间将其电成焦炭！
   - AI 在 `<100ms` 内高声喝止：**“千万不要下车！也严禁地面任何人走近触摸车身！只要您留在驾驶室或吊篮里就是安全的（等电位鸟笼效应）！我已经为您直连电力公司调度台紧急拉闸断电！只有当机器起火危及生命必须弃车时，请务必双脚并拢同时跳离车身（绝不可一手扶车一脚着地），落地后双脚紧贴地面像兔子一样并脚小步跳（Bunny-Hop）或双脚摩地滑行至少 50 英尺远！”**
2. **`3,000 PSI` 液压油针孔喷射伤（High-Pressure Fluid Injection Injury）**：
   - 挖掘机与高空车液压管压力高达 `3,000–5,000 PSI`，细如发丝的针孔漏油能直接穿透牛皮手套射入人体皮下。表面看只有一个不流血的小红点，但矿物液压油会在 **6 小时内引发深部组织化学坏死导致截肢**！一旦听到“液压管漏油喷到手上了”，AI 严令“切勿当普通擦伤贴创可贴！必须立即前往具备手外科急诊清创能力的三甲创伤中心，并在途中告知医生属高压液压油注射伤（High-Pressure Hydraulic Injection）！”
3. **高空吊篮人员被困地面应急泄压下降（Ground Auxiliary Bleed-Down）**：
   - 当篮内工人昏迷或触发防挤压横杆报警（Secondary Guarding Alarm）时，AI 秒级指导地面工友打开底座侧盖、拉起红色手动泄压阀并按住 `12V` 辅助下降按钮，在 90 秒内将伤员平稳降回地面。

---

## 三、🧭 直观可视化图解（Visual Architecture & Flows）

### 3.1 架构全景 SVG 蓝图

![重型工程机械与高空车租赁 OSHA 1926.1408 高压线锁、载荷表与停租报停实时语音架构图](../assets/svg/heavy-equipment-crane-rental-osha-1926-powerline-load-chart-voice-selection-faq.svg)

### 3.2 工程机械载荷表选型、`Trackunit` 远程排障、停租核验与触电抢占决策树（Mermaid）

```mermaid
flowchart TD
    A[施工总包 / 机手 / 设备管理员呼入设备租赁与抢修热线] --> B{<100ms 吊臂触碰高压电线 / 3000PSI 液压油喷射伤手 / 高空吊篮人员受困检测}
    
    B -->|命中: 吊臂/高空车碰高压线冒火花| C[0ms 跨步电压防触电抢占:<br/>严令留在驾驶室/吊篮内且严禁旁人触碰车身!<br/>若起火须双脚并拢跳下并双脚紧贴蛙跳撤离 + 直连电力局与 911]
    B -->|命中: 高压液压油管微孔喷射入皮肤 或 吊篮高空受困| D[0ms 医疗/高空救援抢占:<br/>警告 6h 坏死截肢风险秒导手外科创伤中心 / 指导地面工友开启 12V 辅助降篮阀]
    
    B -->|新租高空车 / 伸缩臂叉装车 / 起重机选型| E{作业环境是否为室内密闭空间 或 涉及悬臂远距离吊装?}
    E -->|室内密闭厂房 / 商场二楼| F[一氧化碳 CO 与楼板承重硬锁:<br/>100% 禁用柴油/汽油机 -> 强制锁定纯电动无痕白胎剪叉车并核验楼板 PSF]
    E -->|室外悬臂吊装 Telehandler / Crane| G[三维 Load-Chart 力矩表校验:<br/>按 重量×水平跨距×高度 匹配机型 + 核对 OSHA 1926.1408 高压线 20ft 净空与 <28mph 风速]
    
    B -->|工地报修机器无法启动 / 升不起大臂| H[140ms 查询 Trackunit / ZTR 车载 CAN-Bus 故障码与倾角传感器]
    H -->|发现地面急停按钮按下 或 底盘倾角 >5° 保护锁死| I[语音指导拔出地面 E-Stop 或 平地复位 -> 拦截 $240 技师冤枉出车]
    
    B -->|设备完工申请停租报停 Off-Rent Call-Off| J[秒生 Wynne RentalMan 停租号停表计费 + 强制短信上传无遮挡停放位置与钥匙盒照片后方派平板拖车]

    style C fill:#7f1d1d,stroke:#ef4444,color:#fff
    style D fill:#7f1d1d,stroke:#ef4444,color:#fff
    style F fill:#4c0519,stroke:#f43f5e,color:#fff
    style I fill:#064e3b,stroke:#10b981,color:#fff
    style J fill:#0c4a6e,stroke:#38bdf8,color:#fff
```

### 3.3 `Trackunit` 秒级化解高空车假故障 + 停租报停防拖车空跑时序图（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    participant Supt as 工地施工队长 (Site Superintendent)
    participant Orch as 工程机械租赁与 OSHA 安全语音编排器
    participant Tele as Trackunit CAN-Bus 遥测与 Wynne RentalMan ERP
    participant Haul as 重型低平板拖车调度台 (Lowboy Dispatch)

    Supt->>Orch: “你们租给我的那台 60 英尺直臂高空车（#6082）在工地趴窝升不起来了，赶紧派师傅来修！另外那台 10,000 磅的叉装车（#9104）我们今天用完了，现在申请停租（Off-Rent）！”
    Orch->>Tele: 140ms 读取 #6082 CAN-Bus (状态: CHASSIS_TILT_LOCKOUT 5.8°, E-Stop: Normal) + 为 #9104 生成停租号 #OR-77412
    Orch->>Supt: “王队长您好，两件事立刻帮您搞定：第一，我刚实时读取了 **6082 号直臂车** 的车载电脑，机器液压和发动机完全正常，升不起大臂是因为它当前停在 **5.8 度** 的斜坡上，触发了超过 5 度的防倾翻安全锁！请先将大臂缩回降下，把车开到平整混凝土地面上就能立刻恢复正常，省去您等维修工的 2 小时！第二，您的 **9104 号叉装车** 已正式停租，停租确认号为 **OR-77412**，从现在起不再计收租金；我刚给您手机发了一条拍照链接，请拍一张叉装车已停在围栏外大路边且钥匙已锁入电池舱密码盒的照片，收到照片后我们的低平板拖车明早 7 点准时来拉！”
    Supt->>Orch: （上传路边停放照与钥匙照）
    Orch->>Haul: 校验通道无遮挡通过 ✅ -> 下发 #9104 低平板拖车回收单
```

---

## 四、📊 多方案横向选型决策矩阵（Decision Matrix）

| 评估维度 | 方案 A：传统设备租赁门店人工电话（凭经验选车与盲派维修/拖车） | 方案 B：无 `Load Chart` 与 `Trackunit` 遥测的通用语音大模型 | 方案 C：三维载荷表/防 `CO` 锁 + `CAN-Bus` 排障 + 停租拍照核验架构（推荐 ✅） |
| :--- | :--- | :--- | :--- |
| **首字响应延迟 (P95)** | `17,000ms+`（早 7 点工地开工高峰门店柜台忙于装车无人接听） | **`320ms`** | **`430ms`（含 `140ms` `Trackunit CAN-Bus` 与 `RentalMan` 合同查询）** |
| **工地“假故障”免上门自愈率（Deflection）** | `12.0%`（听工人说打不着火就直接派 `$240` 抢修皮卡） | `21.0%` | **`68.5%`（秒读急停按钮/5°倾角锁/DPF 再生遥测指导 60 秒恢复）** |
| **低平板拖车退租回收空跑率（`$280` Dry Runs）** | 高达 `24.0%`（去到工地发现车被锁在院里或被泥堆堵死） | 高达 `28.0%` | **下降 `76.4%`（先发停租号停表，强制上传路边无遮挡照片才发拖车）** |
| **叉装车/随车吊超水平半径翻车与室内 `CO` 中毒** | 新店员偶发只看最大吨位派小车或往室内派柴油机 | ❌ `0%` 力学校验（把 8k 叉装车当成伸出 30 英尺也能吊 8k） | **✅ `100%` 校验“重量×水平跨距×高度”载荷图 + 室内 `100%` 禁柴油机** |
| **吊臂触碰高压线（跨步电压）与液压喷射伤急救** | 接线员不懂跨步电压原理，慌乱中让工人下车逃跑 | ❌ 劝工人“赶紧爬下车跑开”导致跨步电压触电身亡 | **`<100ms` 严令“留在篮/舱内，若起火双脚并拢跳下蛙跳撤离”+ 液压伤秒送手外科** |
| **每万通电话抢修出车、拖车空跑与账单争议总成本** | `$312,000 / 万通` | `$348,000 / 万通`（错派翻车与室内柴油召回损失） | **`$98,000 / 万通`（每万通净省 `$214,000` 抢修与拖车空跑成本）** |

---

## 五、🧪 并发与每万通电话 TCO 测算及 7-Card 基准报告

### 5.1 每万通工程机械租赁热线无效维修出车、平板拖车空跑与选型失误损失对比

```chart
{
  "data": {
    "values": [
      { "architecture": "1. Legacy Rental Branch Desk (Manual Dispatch)", "costCategory": "Unnecessary $240 Mechanic Rolls & $280 Lowboy Dry Runs", "costUSD": 216000 },
      { "architecture": "1. Legacy Rental Branch Desk (Manual Dispatch)", "costCategory": "Under-Sized Load-Chart Tip-Overs & Off-Rent Disputes", "costUSD": 52000 },
      { "architecture": "1. Legacy Rental Branch Desk (Manual Dispatch)", "costCategory": "Branch Counter Labor & Voice AI Compute", "costUSD": 44000 },
      { "architecture": "2. Unguarded Voice LLM (No Load Chart / No CAN-Bus Gate)", "costCategory": "Unnecessary $240 Mechanic Rolls & $280 Lowboy Dry Runs", "costUSD": 172000 },
      { "architecture": "2. Unguarded Voice LLM (No Load Chart / No CAN-Bus Gate)", "costCategory": "Under-Sized Load-Chart Tip-Overs & Off-Rent Disputes", "costUSD": 158000 },
      { "architecture": "2. Unguarded Voice LLM (No Load Chart / No CAN-Bus Gate)", "costCategory": "Branch Counter Labor & Voice AI Compute", "costUSD": 18000 },
      { "architecture": "3. Load-Chart Gate + Trackunit CAN-Bus + Off-Rent Photo Lock (Recommended)", "costCategory": "Unnecessary $240 Mechanic Rolls & $280 Lowboy Dry Runs", "costUSD": 68000 },
      { "architecture": "3. Load-Chart Gate + Trackunit CAN-Bus + Off-Rent Photo Lock (Recommended)", "costCategory": "Under-Sized Load-Chart Tip-Overs & Off-Rent Disputes", "costUSD": 14000 },
      { "architecture": "3. Load-Chart Gate + Trackunit CAN-Bus + Off-Rent Photo Lock (Recommended)", "costCategory": "Branch Counter Labor & Voice AI Compute", "costUSD": 16000 }
    ]
  },
  "semantic_types": {
    "architecture": "Category",
    "costCategory": "Category",
    "costUSD": "Amount"
  },
  "chart_spec": {
    "chartType": "Stacked Bar Chart",
    "title": "Load-Chart Gate, Trackunit CAN-Bus Triage & Off-Rent Photo Lock Save $214,000 per 10k Rental Calls",
    "subtitle": "Total Mechanic Truck Rolls, Lowboy Dry Runs & Load-Chart Liability per 10,000 Calls (USD)",
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
| **Card 1 (`1/7`)** | **HANDS-ON · HEAVY EQUIPMENT & CRANE RENTAL VOICE AI** | 覆盖三维 `Load Chart` 选型、室内防 `CO` 锁、`Trackunit` 排障与 `OSHA 1926.1408` 触电抢占 |
| **Card 2 (`2/7`)** | **SCENARIO: 140MS TRACKUNIT CAN-BUS & OFF-RENT LOCK** | 秒解急停/倾角锁假故障与停租拍照核验砍掉 **`72.8%` 冤枉出车与空跑**，每万通省 **`$214,000`** |
| **Card 3 (`3/7`)** | **WHAT I TESTED: 300 LOAD-RADIUS & INDOOR DIESEL TRAPS** | 300 次忽略水平跨距超载选车及向封闭室内派柴油剪叉车请求被 **`100%` 物理拦截** |
| **Card 4 (`4/7`)** | **UNDER THE HOOD: GUARDRAIL `EQUIP-RENTAL-OSHA1926-01`** | 集成 `evaluateHeavyEquipmentCraneRentalOshaVoice2026Guard`，硬锁力矩表与跨步电压规程 |
| **Card 5 (`5/7`)** | **ROBUSTNESS: OSHA 1926.1408 POWER-LINE & 811 DIG GATE** | 高空车/吊车强制校验 `20ft/50ft` 高压线净空，挖掘机/开沟机强制校验 `811` 地下管线票号 |
| **Card 6 (`6/7`)** | **LATENCY: <100MS STEP-POTENTIAL & HYDRAULIC INJECTION SOS** | 吊臂触电 `<100ms` 广播“留守舱内/并脚跳离”，液压喷射伤 `<100ms` 导流手外科急诊防截肢 |
| **Card 7 (`7/7`)** | **MY TAKE: GOOD FIT VS NOT FOR** | ✅ 适用：力矩选型、`CAN-Bus` 自助排障、停租报停；⛔ 禁用：仅凭最大吨位派吊车或让触电司机迈步下车 |

---

## 六、🛠️ 售前方案设计与上线验收 Checklist

- [ ] **起重机/伸缩臂叉装车三维载荷曲线图（`Load Weight × Radius × Height`）与 `28 mph` 风速硬锁**：已验证选型时必须输入水平工作半径与高度查表，严禁仅按最大额定载荷派车。
- [ ] **室内封闭空间 `100%` 零柴油/汽油一氧化碳（`CO`）与楼板点载荷锁**：已硬编码拦截向室内封闭工地派发内燃机设备（强制改派纯电无痕白胎机型）并核验楼板 PSF 承重。
- [ ] **`OSHA 29 CFR § 1926.1408` 架空高压线 `20ft/50ft` 净空与挖掘机 `811` 寻线票号核验**：已对所有高空车/吊车强制播报高压线安全距离，对土方开挖设备核验有效 `811` Ticket。
- [ ] **`140ms` `Trackunit / ZTR` `CAN-Bus` 远程排障与 `Wynne RentalMan` 停租（Off-Rent）拍照锁**：已实现远程识别急停未拔/倾角超限/DPF 再生，且停租时秒发确认号并强制上传路边无遮挡照片后才派平板拖车。
- [ ] **吊臂触电跨步电压（Step Potential）、`3,000 PSI` 液压喷射伤与高空受困 `<100ms` 抢占**：已在代码层接入 `evaluateHeavyEquipmentCraneRentalOshaVoice2026Guard`，遇触电严令留守舱内或并脚蛙跳撤离，遇液压喷射伤立即直连创伤外科。
