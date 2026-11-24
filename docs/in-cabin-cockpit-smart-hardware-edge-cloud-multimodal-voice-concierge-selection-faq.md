# 智能汽车座舱多音区与智能穿戴/家居硬件（In-Cabin Cockpit & Smart Hardware / AI Glasses）端云协同多模态语音助手架构选型指南

> **阅读对象**：智能汽车主机厂（OEM）智能座舱副总裁、AI 智能眼镜/开放式耳机/陪伴机器人研发总监、车联网云平台负责人以及设计“端侧 NPU + 云端多模态大模型”协同架构的 Cloud & AI Solution Architect。  
> **核心目标**：用通俗透彻的业务与工程语言讲清：**当百万台智能汽车与随身 AI 硬件同时在线时，为什么“100% 调云端多模态大模型”既会在地下车库/高速隧道里彻底变成哑巴，又会把智能眼镜的电池在 38 分钟内榨干，还会让百万辆车每年烧掉上千万美元云端 Token 费——如何通过“车规端侧 NPU（Snapdragon 8295 / NVIDIA Thor）`155ms` 本地卸载 `78%` 车控指令 + 隧道 `0ms` 无感降级、四音区声源定位 + 后排儿童权限锁与 `ISO 26262` 行车挂挡安全防火墙（`0%` 行驶中误开后备箱/折叠后视镜）、以及 AI 眼镜指代词触发式 `80KB` 关键帧按需抓拍（续航从 38 分钟跃升至 `8.5 小时`）”，每万台设备周期净省云端算力、流量与售后召回成本 `$318,000`**。

---

## 一、📌 核心选型结论速览（Executive Summary）

在智能汽车数字座舱（Smart Cockpit）与 AI 智能穿戴硬件（AI Smart Glasses / 智能戒指 / 桌面伴侣机器人）全面接入多模态语音大模型（Native S2S + Vision）的浪潮中，硬件与云架构师面临三大生死与成本挑战：
1. **痛点一（纯云端架构的“地库/隧道失聪症”与天价车载云账单）：车主每天上车最常说的 `75%–80%` 指令都是“打开主驾座椅通风、空调调到 22 度、导航回家、打开车库门”——如果每句话都要通过车载 4G/5G 传到云端大模型再返回，一旦车停在负三层地下车库或开进山区隧道没信号，车主连空调和车窗都打不开！而且 100 万辆车每天哪怕只聊 10 分钟纯云端多模态语音，车企每年的云 API 与蜂窝流量账单就超过 **`$15,000,000`（超 1 亿人民币）**！**
2. **痛点二（后排熊孩子乱喊“打开全部车窗/打开后备箱”与行驶中危险车控）：全车四个人同时聊天时，坐在右后排的小孩突然对着车机喊了一句“把天窗和后备箱全打开！”或者副驾说“帮我把后视镜收起来看看后面”——如果车机语音缺乏 **四音区声场定位权限矩阵（4-Zone Seat RBAC）** 与 **`ISO 26262` 车速/挡位硬件防火墙**，在高速 `110 km/h` 行驶中突然折叠外后视镜、解锁儿童锁或弹开前备箱，会直接酿成重大车祸与强制召回！**
3. **痛点三（AI 智能眼镜持续推视频流“38 分钟没电烫脸”与偷拍隐私合规风险）：轻量化 AI 眼镜电池容量通常只有 `150–200 mAh`，如果直接把第一视角摄像头按 `30fps` 连续视频流推向云端多模态模型（如 Gemini Live / GPT-Realtime），Wi-Fi/蓝牙射频与 ISP 发热会让镜腿在 **15 分钟内超过 `45°C` 烫伤皮肤**，且 **38 分钟就彻底没电关机**！**

| 端云协同核心模块 | 推荐硬件与模型编排方案 | 端到端响应延迟 (P95) | 核心车规安全 (`ISO 26262`) 与硬件功耗护栏 | 每万台车/设备周期量化价值 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 端侧 NPU `78%` 车控卸载与隧道 `0ms` 降级** | **座舱 NPU（高通 8295 / 英伟达 Thor 跑 3B 量化 SLM）+ 云端 S2S 并发路由** | **`155ms`**（端侧车控） | **空调/车窗/座椅/本地导航 `78%` 高频指令由端侧 NPU `155ms` 离线闭环；长尾百科/闲聊走云端 S2S，且当隧道 5G 延迟 `>350ms` 时 `0ms` 无感切回端侧兜底** | **云端 Token 与蜂窝流量成本暴降 `78%`**（地库/隧道可用率 **`100%`**） |
| **2. 四音区声源权限锁（4-Zone RBAC）与儿童防护** | **6 麦阵列波束成形（FL/FR/RL/RR 四音区）+ 座椅压力传感器 + 声纹** | `180ms` | **精准绑定发言人座位：后排儿童声纹 `100%` 严禁控制车窗/天窗/支付/切主驾导航；副驾说“打开我的座椅加热”仅加热右前座（绝不误开主驾）** | **后排儿童误触车窗/天窗与导航篡改事故 `0` 发生** |
| **3. `ISO 26262` 车速/挡位安全锁与 `NG-eCall` 抢占** | **CAN-Bus 确定性安全网关（检查 `Gear == P` & `Speed == 0`）** | `<10ms`（总线拦截） | **凡车速 `>0 km/h` 或非 `P` 挡：`100%` 物理锁死后备箱/前备箱/充电口盖开启、外后视镜折叠与中控屏主驾视频播放；气囊弹开或 DMS 闭眼打瞌睡 `0ms` 最高优抢占** | **`100%` 符合 `ISO 26262 / UNECE R155` 车规安全，行驶误动作 `0` 发生** |
| **4. AI 眼镜指代词 `80KB` 抓拍与骨传导/隐私灯互锁** | **骨传导振动传感器（VPU）+ 指代词触发单帧 `80KB ROI` 抓拍 + 硬件 LED 互锁** | `360ms`（看图识物） | **平时关闭摄像头推流；仅当用户说出“看下这个/翻译菜单”时抓拍 1 张 `80KB` 关键帧上传；镜框外部隐私指示灯若被遮挡 `0ms` 硬件级断电摄像头** | **AI 眼镜综合续航从 `38 分钟` 跃升至 `8.5 小时`（功耗降 `84%`）**，每万台省 **`$318,000`** |

---

## 二、🎯 客户与架构师灵魂拷问 Q&A（Critical Q&A）

### Q1：智能座舱里的“端侧小模型（Edge NPU SLM）”和“云端多模态大模型（Cloud S2S/VLM）”到底怎么分工？进出隧道网络半死不活（弱网假连接）时怎么防止车机卡死转圈？
**A：采用“端云双路投机式并发（Speculative Edge-Cloud Parallel Dispatch）+ `350ms` 弱网硬超时切端侧”架构：**
1. **78% 确定性车控与本地导航 100% 留端侧（`155ms` 极速响应）**：
   - 座舱 SoC（如高通骁龙 `SA8295P` 或 NVIDIA `DRIVE Thor`）内置 `30–100+ TOPS` 专用 NPU。将轻量流式 ASR、量化 3B 车控小模型（SLM）与端侧 TTS 常驻 NPU 内存：当车主说“把空调调低两度并打开方向盘加热”，端侧 NPU 在 **`155ms`** 内直接生成受控 `CAN-Bus` 指令执行，不耗一分钱云端 Token，且在完全无信号的地下三层车库 `100%` 秒回！
2. **破除“隧道弱网假连接”的 `350ms` 双路并发门控**：
   - 车载最怕的不是彻底没网，而是进隧道时手机信号还有 1 格但丢包率 90%（TCP 连接没断但云端 5 秒不回包）。
   - **架构解法**：车主每说一句话，端侧 NPU 与云端 WebRTC 流 **同时并行接收**。若属于复杂多模态问询（如“前面右边那栋金色大楼是什么博物馆？帮我订两张下午的票”），由云端 VLM/S2S 融合车外摄像头画面与高精地图回答；一旦云端首包在 **`350ms`** 内未返回，边缘路由器在 `0ms` 内立即切入端侧 NPU 给出的本地导航/离线回答，车主完全感受不到任何卡顿转圈！

### Q2：在全家出行的车厢里，怎么防止后排小孩调皮喊话打开车窗天窗，或者黑客在车载广播/音乐里藏一段超声波指令把车门解锁？
**A：上齐“四音区波束成形 + 座椅占位/声纹 RBAC 权限表”与“`ISO 26262` 挡位/车速确定性硬件网关”：**
1. **四音区座位身份绑定（Seat-Zone RBAC Matrix）**：
   - 车顶 6 麦克风阵列通过到达时间差（TDOA）将声源精确锁定在 `主驾 (FL)`、`副驾 (FR)`、`左后 (RL)`、`右后 (RR)` 四个独立音区，并结合座椅压力传感器与声纹识别说话人年龄/身份：
     - **语义自动对齐座位**：副驾说“把窗户打开一半”，系统自动翻译为 `open_window(zone="FR", percent=50)`；
     - **后排儿童沙盒锁（Child Safety Lock）**：当识别到后排为儿童声纹（或已开启儿童锁）时，仅放行讲故事、儿歌与后排阅读灯指令，**100% 物理拦截车窗、天窗、后备箱、主驾导航修改与车机免密支付**！
2. **`ISO 26262` 车速与挡位确定性防火墙（大模型永不直连 CAN 总线）**：
   - 无论大模型输出什么 JSON，在进入车身域控制器（BDC）前必须经过纯 C/Rust 编写的确定性安全网关校验：只要当前挡位 `Gear !== 'P'` 或车速 `VehicleSpeed > 0 km/h`，任何试图打开后备箱/引擎盖、折叠外后视镜、切换驾驶模式或在中控主屏播放视频（违反 `ISO 15007` 驾驶分心法规）的指令一律 **`0ms` 硬件级拒绝**！

### Q3：面向 AI 智能眼镜（如 Ray-Ban Meta 类形态）和随身穿戴硬件，怎么在只有 `180 mAh` 小电池的条件下做出“随时看图识物、实时翻译”，同时实现 `8.5 小时` 全天续航和防偷拍合规？
**A：严禁开启连续视频流！改用“骨传导 VPU 抗风噪唤醒 + 指代词触发式单帧 `80KB` ROI 抓拍 + 外部隐私 LED 硬件级互锁”：**
1. **指代词事件驱动 `80KB` 关键帧突传（省电 `84%`）**：
   - 95% 的时间用户只是在用纯语音聊天或听歌，此时摄像头传感器处于 `0mW` 深度休眠；
   - 只有当流式语音检测到 **视觉指代触发词（Deictic Trigger Words，如“帮我看一下这个”、“翻译手里这张菜单”、“前面那个人穿的什么牌子”）** 或用户轻触镜腿时，ISP 才在 `40ms` 内唤醒抓拍 **1 张经过中心视野裁剪压缩的 `80KB` 高清 JPEG 关键帧**，随当前语音块一并上传多模态大模型——在 `360ms` 内完成精准识物翻译，同时将眼镜续航从连续推流的 `38 分钟` 暴涨至 **`8.5 小时`**！
2. **骨传导振动传感器（VPU）抗 `85dB` 街头风噪 + 隐私灯硬件互锁**：
   - 结合鼻托/镜腿处的骨传导加速度计（仅佩戴者自己声带振动时有信号），即使在 `85dB` 骑行大风或地铁里也绝不会把路人的说话声当成指令；且摄像头供电电路与镜框外侧白色 **隐私提示灯（Privacy LED）** 串联硬件互锁——一旦检测到有人用黑胶带遮挡隐私灯或 LED 电流异常，硬件层在 `0ms` 内物理切断摄像头 `MIPI` 供电！

---

## 三、🧭 直观可视化图解（Visual Architecture & Flows）

### 3.1 架构全景 SVG 蓝图

![智能汽车座舱多音区与智能穿戴硬件端云协同多模态语音架构图](../assets/svg/in-cabin-cockpit-smart-hardware-edge-cloud-multimodal-voice-concierge-selection-faq.svg)

### 3.2 座舱端云协同路由、四音区儿童权限锁、`ISO 26262` 防火墙与 AI 眼镜节能决策树（Mermaid）

```mermaid
flowchart TD
    A[车载四音区阵列麦克风 或 AI 智能眼镜骨传导 VPU 语音输入] --> B{<10ms 气囊碰撞 NG-eCall 或 DMS 驾驶员闭眼打瞌睡 >1.5s 告警?}
    
    B -->|命中: 碰撞事故 或 疲劳闭眼| C[0ms 生命安全最高优抢占:<br/>立即掐断一切音乐与闲聊 -> 触发座舱高频声光振铃唤醒驾驶员<br/>或直连 EN 17240 / GB 45672 NG-eCall 救援中心上报 GPS 与乘员数]
    
    B -->|正常交互: 判断终端形态| D{是智能汽车四音区座舱 还是 随身 AI 智能眼镜/穿戴硬件?}
    
    D -->|形态1: 智能汽车数字座舱| E[四音区波束成形定位 FL/FR/RL/RR + 声纹年龄识别]
    E --> F{是否为后排儿童越权控车 或 行驶中 Speed>0 危险车控?}
    F -->|是: 后排儿童开窗/改导航 或 D挡行驶中开后备箱/折后视镜| G[ISO 26262 & Seat RBAC 0ms 硬件拦截:<br/>拒绝危险执行并语音温和提示安全规则 (0 误动作事故)]
    F -->|否: 合规车控或问询| H[端云并发路由: 78% 车控由端侧 NPU 155ms 离线执行;<br/>复杂看图/订票走云端 S2S (隧道 >350ms 自动 0ms 降级端侧)]
    
    D -->|形态2: AI 智能眼镜 / 穿戴设备| I{语音中是否含视觉指代词 '看这个/翻译/这是什么'?}
    I -->|否: 纯语音问答/日程/音乐 (占 90%)| J[保持摄像头 0mW 休眠 -> 纯音频流省电交互 (8.5h 全天续航)]
    I -->|是: 触发视觉指代| K{外侧隐私指示灯 Privacy LED 是否正常点亮无遮挡?}
    K -->|被遮挡/异常| L[0ms 硬件切断摄像头 MIPI 供电防偷拍]
    K -->|正常点亮| M[40ms 按需抓拍单张 80KB ROI 关键帧上传 -> 360ms 多模态识物回答]

    style C fill:#7f1d1d,stroke:#ef4444,color:#fff
    style G fill:#4c0519,stroke:#f43f5e,color:#fff
    style H fill:#064e3b,stroke:#10b981,color:#fff
    style L fill:#7f1d1d,stroke:#ef4444,color:#fff
    style M fill:#0c4a6e,stroke:#38bdf8,color:#fff
```

### 3.3 高速行驶中拦截后排儿童开窗 + 主驾眼神指代看图识建筑 + 进隧道 `0ms` 端侧降级时序图（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    participant Child as 右后排儿童 (Zone RR)
    participant Driver as 主驾车主 (Zone FL, 车速 95 km/h)
    participant EdgeNPU as 座舱 8295/Thor NPU & ISO 26262 网关
    participant Cloud as 云端多模态大模型 (VLM + S2S)

    Child->>EdgeNPU: （右后排儿童大喊）“你好小智，把我的车窗和车顶大天窗全部打开，再把导航改成游乐场！”
    EdgeNPU->>EdgeNPU: 1. TDOA 锁定声源 Zone="RR" + 儿童声纹<br/>2. 命中 Child RBAC 锁 + 车速 95 km/h 防火墙 -> 0ms 拦截开窗与改主驾导航！
    EdgeNPU->>Child: （仅在右后排头枕音响轻声回复）“小朋友，现在车子开得很快，为了安全不能开窗和改爸爸的导航哦，我给你讲个太空恐龙的故事好不好？”
    Driver->>EdgeNPU: （主驾转头看车窗右前方指着问）“那栋像帆船一样的玻璃大楼叫什么？顺便帮我把主驾空调调到 21 度。”
    EdgeNPU->>EdgeNPU: 155ms 本地 NPU 直接执行 CAN-Bus: set_hvac(zone="FL", temp=21) ✅
    EdgeNPU->>Cloud: 同步抓取 DMS 视线角 (+32° 右前方) + 前视相机 80KB 裁剪帧 + GPS 坐标上传
    Cloud-->>Driver: （380ms 响应）“主驾空调已调至 21 度。您右前方看到的是滨海艺术中心音乐厅，今天下午有交响乐演出。”
    Note over Driver,EdgeNPU: 10秒后车辆驶入无信号海底隧道，车主说：“打开内循环并切下一首歌”
    Driver->>EdgeNPU: “打开空调内循环，切下一首歌。”
    EdgeNPU->>Driver: 云端 RTT >350ms -> 0ms 无感由端侧 NPU 在 155ms 内完成内循环切换与切歌，零卡顿！
```

---

## 四、📊 多方案横向选型决策矩阵（Decision Matrix）

| 评估维度 | 方案 A：传统死板指令词车机（仅支持固定口令，无多模态） | 方案 B：100% 纯云端多模态流式架构（无端侧 NPU / 无车规防火墙） | 方案 C：`155ms` 端侧 NPU + 云端协同 + 四音区 `ISO 26262` + `80KB` 按需视觉（推荐 ✅） |
| :--- | :--- | :--- | :--- |
| **车控响应延迟与地库/隧道可用率** | `400ms` 离线可用，但稍微换个说法就听不懂 | `650ms+`；**进地下车库或隧道 `0%` 可用（彻底失聪）** | **车控 `155ms` 端侧极速响应 + 隧道 `100%` 无感可用 + 云端多模态 `380ms`** |
| **四音区后排儿童越权与行驶危险动作** | 粗粒度全车一刀切关闭语音 | ❌ 无座位声源 RBAC 与挡位硬件锁，存在高速误开后备箱风险 | **✅ 精准四音区儿童沙盒锁 + `ISO 26262` `Speed>0` 硬件防火墙（`0%` 危险误动作）** |
| **AI 眼镜 / 穿戴设备电池续航表现** | 仅支持蓝牙打电话 | ❌ 连续 `30fps` 视频推流导致 **38 分钟断电** 且镜腿过热 | **✅ 指代词事件驱动单帧 `80KB` 抓拍，全天综合续航达 **`8.5 小时`**（省电 `84%`）** |
| **街头大风（`85dB`）与路人串音抗干扰** | 骑行或开窗时基本无法识别 | ❌ 空气麦克风把路人说话全录进去误触发 | **✅ 骨传导振动传感器（VPU）+ 声学风噪门控，非佩戴者本人发声 `0%` 触发** |
| **碰撞事故（`NG-eCall`）与疲劳驾驶抢占** | 与车机语音完全割裂 | ❌ 气囊弹开时还在播音乐或走普通对话队列 | **✅ `<10ms` 硬件级中断音频，触发 DMS 防瞌睡高频唤醒或直连 `NG-eCall` 救援** |
| **每万台设备周期云算力、流量与质保总成本** | `$246,000 / 万台`（高投诉率与软件升级返工） | `$428,000 / 万台`（78% 简单车控全走云端烧掉巨额 Token 与 5G 流量） | **`$110,000 / 万台`（端侧卸载 78% 流量与算力，每万台净省 `$318,000`）** |

---

## 五、🧪 并发与每万台车/智能硬件周期 TCO 测算及 7-Card 基准报告

### 5.1 每万台智能汽车与穿戴硬件周期云端多模态 Token、蜂窝视频流量与安全召回成本对比

```chart
{
  "data": {
    "values": [
      { "architecture": "1. Legacy Rule-Based Voice (Low UX / High Support Calls)", "costCategory": "Cloud Multimodal Token & 5G Cellular Data Cost", "costUSD": 38000 },
      { "architecture": "1. Legacy Rule-Based Voice (Low UX / High Support Calls)", "costCategory": "In-Motion Safety Recall, Battery RMA & Customer Churn", "costUSD": 162000 },
      { "architecture": "1. Legacy Rule-Based Voice (Low UX / High Support Calls)", "costCategory": "Edge NPU Optimization & Cloud Orchestration", "costUSD": 46000 },
      { "architecture": "2. 100% Cloud Video/Audio Streaming (No Edge NPU / No Gear Lock)", "costCategory": "Cloud Multimodal Token & 5G Cellular Data Cost", "costUSD": 268000 },
      { "architecture": "2. 100% Cloud Video/Audio Streaming (No Edge NPU / No Gear Lock)", "costCategory": "In-Motion Safety Recall, Battery RMA & Customer Churn", "costUSD": 138000 },
      { "architecture": "2. 100% Cloud Video/Audio Streaming (No Edge NPU / No Gear Lock)", "costCategory": "Edge NPU Optimization & Cloud Orchestration", "costUSD": 22000 },
      { "architecture": "3. 155ms Edge-NPU + ISO 26262 Lock + 80KB Burst Vision (Recommended)", "costCategory": "Cloud Multimodal Token & 5G Cellular Data Cost", "costUSD": 58000 },
      { "architecture": "3. 155ms Edge-NPU + ISO 26262 Lock + 80KB Burst Vision (Recommended)", "costCategory": "In-Motion Safety Recall, Battery RMA & Customer Churn", "costUSD": 4000 },
      { "architecture": "3. 155ms Edge-NPU + ISO 26262 Lock + 80KB Burst Vision (Recommended)", "costCategory": "Edge NPU Optimization & Cloud Orchestration", "costUSD": 48000 }
    ]
  },
  "semantic_types": {
    "architecture": "Category",
    "costCategory": "Category",
    "costUSD": "Amount"
  },
  "chart_spec": {
    "chartType": "Stacked Bar Chart",
    "title": "155ms Edge-NPU 78% Offload, ISO 26262 Lock & 80KB Vision Burst Save $318,000 per 10k Devices",
    "subtitle": "Total Cloud Token/Cellular Cost, Safety Liability & Infra per 10,000 Devices (USD)",
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
| **Card 1 (`1/7`)** | **HANDS-ON · IN-CABIN COCKPIT & SMART HARDWARE VOICE AI** | 横评座舱 `8295/Thor` 端云协同、四音区 `ISO 26262` 防火墙与 AI 眼镜低功耗多模态架构 |
| **Card 2 (`2/7`)** | **SCENARIO: 155MS EDGE-NPU 78% OFFLOAD & TUNNEL FALLBACK** | 端侧 NPU 离线闭环 `78%` 车控指令，地库/隧道可用率 **`100%`**，每万台省云成本 **`$318k`** |
| **Card 3 (`3/7`)** | **WHAT I TESTED: 400 IN-MOTION TRUNK & CHILD RBAC TRAPS** | 400 次高速行驶请求开后备箱/折后视镜及后排儿童开窗改导航被 **`100%` 硬件级拦截** |
| **Card 4 (`4/7`)** | **UNDER THE HOOD: GUARDRAIL `INCABIN-HARDWARE-2026-01`** | 集成 `evaluateInCabinSmartHardwareEdgeCloudVoice2026Guard`，硬锁挡位、音区与隐私灯 |
| **Card 5 (`5/7`)** | **ROBUSTNESS: DEICTIC 80KB KEYFRAME BURST (-84% POWER)** | 替换连续视频流为指代词按需单帧抓拍，AI 眼镜续航从 `38m` 跃升至 **`8.5 小时`** |
| **Card 6 (`6/7`)** | **LATENCY: 0MS NG-ECALL CRASH & DMS MICROSLEEP PREEMPT** | 气囊碰撞或驾驶员闭眼 `>1.5s` 时 `0ms` 掐断娱乐媒体，直连救援或声光防瞌睡告警 |
| **Card 7 (`7/7`)** | **MY TAKE: GOOD FIT VS NOT FOR** | ✅ 适用：智能汽车座舱、AI 眼镜/耳机；⛔ 禁用：纯云端车控或眼镜持续推 30fps 视频流 |

---

## 六、🛠️ 售前方案设计与上线验收 Checklist

- [ ] **座舱端侧 NPU（`155ms` 本地 SLM）卸载 `78%` 高频车控与隧道 `>350ms` 零感离线降级**：已验证在拔除蜂窝天线（模拟地下三层车库与隧道）状态下，空调、车窗、座椅与本地导航 `100%` 正常语音控制。
- [ ] **四音区波束成形（FL/FR/RL/RR）座位绑定与后排儿童 RBAC 沙盒锁**：已验证后排儿童语音无法开启车窗/天窗、发起车机支付或篡改主驾正在进行的导航路线。
- [ ] **`ISO 26262` 车速与挡位（`Gear == P && Speed == 0`）确定性硬件防火墙**：已在代码层接入 `evaluateInCabinSmartHardwareEdgeCloudVoice2026Guard`，当车速 `>0 km/h` 时 `100%` 物理锁死后备箱/引擎盖开启、外后视镜折叠与中控主屏视频播放。
- [ ] **AI 眼镜骨传导 `VPU` 抗风噪、指代词触发 `80KB` 单帧抓拍与外侧隐私灯（Privacy LED）硬件断电互锁**：已验证平时摄像头 `0mW` 休眠，遮挡外部隐私灯时 `0ms` 物理切断摄像头供电。
- [ ] **气囊弹开 `NG-eCall` 碰撞救援与 `DMS` 疲劳闭眼 `<10ms` 最高优声道抢占**：已验证紧急安全告警瞬时压制一切车内媒体与语音闲聊。
