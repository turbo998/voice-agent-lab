# 企业私有化开源语音模型（Faster-Whisper / SenseVoice + CosyVoice 2 / Fish Speech 1.5 / Kokoro-82M）GPU 并发测算与云端 TCO 临界点选型指南（`OSS-VOICE-GPU-01`）

> **导读**：在架构评审中，几乎每一位 CTO 或财务总监都会问解决方案架构师同一个问题：**“现在开源的 Whisper、SenseVoice、CosyVoice 2、Fish Speech 1.5 和 Kokoro-82M 效果这么好，我们为什么要付钱买云端 Azure AI Speech 或 ElevenLabs？我们自己租几张 NVIDIA L40S / A10G 显卡跑开源语音模型，岂不是能把每分钟成本降到零？”** 然而，大量盲目自建开源语音集群的团队在上线第一个月就掉进了三大深坑：**① 客户电话那头沉默了 3 秒钟，开源 Whisper 突然在转写流里凭空吐出一句“字幕由 Amara.org 社区提供 / 请点赞订阅我的频道”，导致大模型瞬间脑抽胡言乱语！② 用原生 PyTorch 跑开源 TTS，一张 `$1,200/月` 的显卡只能同时服务 3 个并发电话，第 4 个人打进来延迟直接飙到 6 秒！③ 呼叫中心只有白天 9:00–18:00 有电话，半夜 12 小时显卡 100% 空转烧电费，算上 GPU 闲置率和 1 名运维工程师的工资，月话务量不到 35 万分钟时自建反而比买云 API 贵了 2.4 倍！** 本文以硬核架构师视角，算清开源 vs 云端的真实 GPU 并发账与 TCO 盈亏平衡点。

![企业自建开源语音模型 GPU 并发与云端 TCO 临界点全景图](../assets/svg/open-source-local-tts-stt-cosyvoice-fishspeech-kokoro-whisper-vllm.svg)

---

## 1. 📌 核心选型结论速览（Executive Summary）

- **开源语音识别（STT）与语音合成（TTS）主力模型选型定音（`OSS-VOICE-GPU-01`）**：
  1. **开源 STT（语音转文字）双雄选型**：
     - **多语种全球化场景（99 语种）**：首选 **`Faster-Whisper Large-v3-Turbo`（CTranslate2 Int8/FP16 引擎）**——将解码层从 32 层裁减至 4 层，速度比原版 Large-v3 快 **5.4 倍**（单张 L40S 可支撑 **65–85 路** 实时并发）；
     - **中文普通话/粤语/英日韩高并发与情绪事件检测**：首选阿里开源 **`SenseVoice-Small` 或 `Paraformer-Streaming`**——非自回归架构推理速度比 Whisper 快 **15 倍**（10 秒音频仅需 `70ms`，单卡可跑 **180+ 路** 并发），且原生输出 `[Laughter]`、`[Cry]`、`[Cough]` 副语言标签！
  2. **开源 TTS（文字转语音）四小龙选型**：
     - **企业级双向流式与高表现力首选**：**`CosyVoice 2.0 (0.5B)`（Apache 2.0）**——原生支持 LLM 吐出 5 个字就开始流式合成音频（首包延迟 **`<= 150ms`**），支持跨语种零样本克隆与粤语/四川话方言；
     - **多语种免音素（Zero-G2P）戏剧张力首选**：**`Fish Speech 1.5`**——彻底抛弃传统音素转换词典，中英日韩法德阿混读极自然（**注意：需核查其最新权重的商业闭源授权条款！**）；
     - **有声书/视频配音非流式高保真首选**：**`F5-TTS`（MIT 协议，基于流匹配 Flow-Matching）**——零样本音色克隆还原度极高，但因需全句迭代去噪，不适合 `<300ms` 电话实时对话；
     - **边缘 CPU / 极致性价比轻量首选**：**`Kokoro-82M`（Apache 2.0）**——仅 8,200 万参数却达到媲美大模型的主观听感（MOS `4.25`），在普通 CPU 或千元级边缘盒上即可跑出 `< 80ms` 首包！
- **云端 API vs 自建开源 GPU 的“35 万分钟/月”黄金盈亏平衡点**：
  - **当月度总语音时长 `< 350,000 分钟/月`（日均 `< 11,500 分钟`）时**：**100% 优先选云端 `Azure AI Speech` / `Deepgram`**——因为话务具有强烈的峰谷效应（白天峰值是夜间 15 倍），自建 GPU 平均利用率不足 25%，加上高可用冗余双机与运维人力，云端按秒计费反而省 **40%–65%**！
  - **当月度总语音时长 `> 500,000 分钟/月`（或有批量离线录音质检/海外短剧配音任务填满夜间空闲算力）时**：采用 **“2–4 张 L40S 开源/容器跑稳态基荷（`$0.006/分钟`）+ 白天突发洪峰溢出至云端 API”** 的混合架构，综合成本直降 **68%**！

---

## 2. 🎯 客户与架构师灵魂拷问 Q&A（Deep-Dive Q&A）

### Q1：为什么自己部署开源 Whisper 上线电话客服后，客户不说话的时候屏幕上会莫名其妙蹦出“谢谢观看”、“字幕制作：XXX”、“请订阅我的频道”？怎么 100% 根治这种致命幻觉？
- **揭秘 Whisper 的“YouTube 字幕组先验幻觉（Silence Hallucination）”**：
  - OpenAI Whisper 在训练时使用了数百万小时带有人工字幕的网络视频。在视频结尾的纯静音或背景音乐片段中，人类字幕员往往会打上 *"Subtitles by Amara.org"*、*"Thank you for watching"*、*"字幕由 XX 提供"*。
  - 结果，当你把电话线里的 2 秒钟底噪或静音直接切块送进 Whisper 解码器时，模型发现没有清晰人声，就会触发自回归先验，以 `99%` 的高置信度凭空捏造出这些字幕组签名！
- **根治 Whisper 幻觉的四道工程铁闸（`OSS-VOICE-GPU-01`）**：
  1. **铁闸一（前置 `Silero VAD` 硬切分）**：绝不允许把未检测到人声的静音帧送进 Whisper！必须在前端挂载 `Silero VAD v5`（仅占 1MB 内存，耗时 `< 1ms`），仅将 `speech_prob >= 0.5` 的有效语音段送入 GPU；
  2. **铁闸二（强制设置 `condition_on_previous_text = False`）**：防止一旦某一句发生轻微重复，后续整通电话陷入无限复读机死循环；
  3. **铁闸三（联合校验 `no_speech_prob > 0.6` 与 `compression_ratio > 2.4`）**：若解码出的文本 gzip 压缩比大于 `2.4`（说明在疯狂重复同一个词）或无语音概率高，直接丢弃该块；
  4. **铁闸四（字幕黑名单正则过滤）**：在出口拦截“谢谢观看 / 字幕提供 / Amara.org”等 40 个高频幻觉短语。

### Q2：很多团队在 GitHub 下载了 `CosyVoice 2` 或 `Fish Speech`，用官方 `demo.py` 一跑发现单次合成要 1.2 秒，而且一张 24GB 显卡跑 3 路并发就显存溢出（OOM）或卡死，问题出在哪？
- **从“研究代码（Research Repo）”到“生产级高并发推理引擎”的三步改造**：
  1. **告别原生 PyTorch 逐 Token 循环——启用 `vLLM / TensorRT-LLM` 音频 Token 加速**：
     - 现代神经编码器 TTS（如 CosyVoice 2 / Fish Speech）前半段本质上是一个自回归 Transformer 语言模型（将文本预测为离散 Speech Tokens）。直接用原生 HuggingFace/PyTorch 跑，没有 `PagedAttention` 和 `Continuous Batching（连续批处理）`，GPU 算力利用率不到 12%！
     - 将前半段 LLM 注册进 **`vLLM` 或 `TensorRT-LLM`**，后半段流匹配/声码器（Flow-Matching + HiFi-GAN）编译为 **`TensorRT FP16`** 引擎，单卡 L40S 并发路数从 `3 路` 直接飙升至 **`36 路`**，首包延迟从 `1,200ms` 骤降至 **`135ms`**！
  2. **参考声纹向量预提取缓存（Speaker Embedding Pre-Caching）**：
     - 严禁每次调用 TTS 都重新加载 5 秒钟的 `.wav` 参考音频做编码！在服务启动时将企业标准音色的 `speaker_embedding` 预编译为 `.pt` 常量驻留显存，每次请求立省 `180ms`。

### Q3：如果客户是大型国有银行、军工院所或三甲医院，既要求“语音数据 100% 不出机房内网”，又没有专业的 AI 编译器工程师去维护开源模型和修幻觉 Bug，该怎么选？
- **断网/内网合规场景的免运维王牌：`Azure AI Speech Disconnected Containers`（微软官方本地语音容器）**！
  - 直接在客户内网 Kubernetes / Docker 服务器上拉起微软官方构建好的 `stt` 与 `neural-tts` 镜像：
    - **无需自己折腾 vLLM/TensorRT 编译与 Whisper 防幻觉调优**，开箱即享与公有云完全一致的流式低延迟、热词定制与微软官方企业级补丁支持；
    - 支持完全断网（Disconnected）运行，或仅通过 `1 kbps` 极窄带上报月度分钟数账单，是金融/政务私有化的稳妥首选！

---

## 3. 🧭 直观可视化图解（Mermaid 决策树、开源语音 GPU 架构与 TCO 曲线）

### 3.1 云端商用 API vs 本地官方容器 vs 自建开源模型选型决策树

```mermaid
flowchart TD
    A["企业规划 STT 与 TTS 语音基础设施"] --> B{"数据驻留合规与月度话务规模？"}
    B -->|"1. 月话务量 < 35万分钟 或 业务处于快速迭代期"| C["首选云端全托管 API<br/>(Azure AI Speech / Deepgram / ElevenLabs)<br/>零 GPU 闲置浪费 · 140+ 语种开箱即用 · 免运维"]
    B -->|"2. 金融/医院/政务强监管要求音频 100% 不出内网"| D{"企业是否有专职推理加速 (vLLM/TRT) 团队？"}
    D -->|"无专职语音算法运维团队 (求稳、求官方 SLA)"| E["首选 Azure AI Speech Containers 本地容器<br/>内网私有化部署 + 微软官方维护 + 与云端 API 100% 兼容"]
    D -->|"有成熟 GPU 运维团队 或 月产 > 50万分钟规模降本"| F["自建开源 GPU 推理集群 (OSS-VOICE-GPU-01)<br/>• STT: Silero VAD + Faster-Whisper-Turbo / SenseVoice<br/>• TTS: CosyVoice 2 (vLLM + TensorRT) / Kokoro-82M<br/>+ 白天突发洪峰自动溢出至 Azure 云端兜底"]
```

### 3.2 生产级高并发自建开源 STT + TTS 推理集群与云端弹性溢出架构图（`OSS-VOICE-GPU-01`）

```mermaid
flowchart LR
    subgraph Ingress["1. 预处理与防幻觉门禁"]
        Audio["20ms PCM 音频流"]
        VAD["Silero VAD v5 切分器<br/>(100% 拦截纯静音送入 Whisper！)"]
        Audio --> VAD
    end

    subgraph GPUCluster["2. 自建 GPU 推理池 (2× NVIDIA L40S 基荷)"]
        STT["STT 引擎池 (CTranslate2 / ONNX)<br/>• Faster-Whisper-Turbo (多语种)<br/>• SenseVoice-Small (中文+情绪)<br/>condition_on_previous_text=False"]
        TTS["TTS 引擎池 (vLLM + TensorRT FP16)<br/>• CosyVoice 2.0 双向流式 (<=150ms)<br/>• Kokoro-82M (轻量高频播报)"]
        VAD -->|"基荷队列 <80%"| STT --> TTS
    end

    subgraph CloudBurst["3. 尖峰流量云端弹性溢出层"]
        Azure["Azure AI Speech / Voice Live API<br/>(当本地 GPU 队列等待 >120ms 时<br/>0秒无感分流至云端 PayGo)"]
        VAD -.->|"尖峰溢出 (>80% 负载)"| Azure
    end
```

### 3.3 自建开源语音集群：防静音幻觉、vLLM 流式合成与 GPU 过载云端溢出时序图

```mermaid
sequenceDiagram
    autonumber
    participant Caller as 来电客户
    participant Gate as OSS-VOICE-GPU-01 调度与防幻觉网关
    participant LocalGPU as 本地 L40S 集群 (Whisper-Turbo + CosyVoice 2)
    participant Cloud as Azure AI Speech 云端溢出池

    Caller->>Gate: 1. 呼入后先沉默了 2.5 秒找单据 (仅有电话底噪)
    Gate->>Gate: Silero VAD 判定 speech_prob = 0.04 (< 0.5) -> 0ms 丢弃静音帧！(绝不喂给 Whisper 触发“谢谢观看”幻觉)
    Caller->>Gate: 2. 开口说话："帮我查一下昨天那笔退款到账没"
    Gate->>Gate: 检查本地 GPU 队列深度：active_streams = 42 / 60 (负载 70%，未超载)
    Gate->>LocalGPU: 3. 送入本地 SenseVoice / Whisper-Turbo (耗时 65ms 转写完成)
    LocalGPU->>LocalGPU: LLM 流式吐出前 5 个字 -> 触发 CosyVoice 2 (vLLM Continuous Batching)
    LocalGPU-->>Caller: 4. (145ms 首包音频) 流式播报高自然度回复！
    Note over Gate,Cloud: 若正值双十一上午 10 点，本地 GPU 队列等待 > 120ms -> 自动将新呼入路由至 Azure 云端 API！
```

---

## 4. 📊 主流开源与商用 STT / TTS 横向选型决策矩阵（Open-Weight vs. Commercial Matrix）

### 4.1 语音识别（STT）横向选型对比表

| 评估维度 | Faster-Whisper Large-v3-Turbo（开源多语种霸主） | 阿里 SenseVoice-Small / Paraformer（开源中文与情绪霸主） | Azure AI Speech STT（云端 API & 本地容器，**企业合规首选**） | Deepgram Nova-3（云端极速英文/西语首选） |
| :--- | :--- | :--- | :--- | :--- |
| **开源协议与商用授权** | **MIT 协议（100% 免费商用闭源）** | **Apache 2.0（100% 免费商用）** | 商用按量计费 / 专属容器承诺优惠 | 商用按量计费 |
| **中/英/多语种准确率与特点** | **99 语种通用极强**；需配合 `LocalAgreement-2` 改造成真流式 | **中文/粤语准确率极高**，且原生输出哭/笑/咳嗽/掌声事件标签 | **140+ 语种全双工流式**，支持动态注入 5,000 个企业专有热词 | 英文/西班牙语极速流式，吞吐极高 |
| **静音段“字幕幻觉”风险** | **高（未配前置 VAD 时极易吐出“谢谢观看”）** | **极低（非自回归 CTC/AED 架构不产生自回归续写幻觉）** | **零幻觉（内置工业级端到端声学门控）** | 极低 |
| **单张 L40S (48GB) 实时并发路数** | **`65 – 85 路`（Int8 动态批处理）** | **`180 – 240 路`（ONNX / TensorRT 极轻量化）** | 容器版单节点支持高密度 CPU/GPU 部署 | 全托管免算力规划 |

### 4.2 语音合成（TTS）横向选型对比表

| 评估维度 | CosyVoice 2.0 (0.5B)（**开源流式对话首选**） | Fish Speech 1.5（开源多语种表现力先锋） | Kokoro-82M（**开源超轻量边缘/CPU 神器**） | Azure Speech DragonHD / CNV & ElevenLabs（商用标杆） |
| :--- | :--- | :--- | :--- | :--- |
| **开源协议与商用红线** | **Apache 2.0（可安心免费商用）** | 代码 Apache 2.0，**注意核查模型权重 `CC-BY-NC` 商业限制！** | **Apache 2.0（82M 小体积，完全免费商用）** | 商用 SLA 保障 + 演员版权合规水印 |
| **流式首包延迟（TTFB）** | **`130ms – 160ms`（原生支持双向流式）** | `180ms – 260ms`（需挂载 vLLM/SGLang 加速） | **`55ms – 90ms`（架构极简，CPU 都能跑流式）** | **`75ms – 150ms`（全球边缘节点加速）** |
| **零样本音色克隆与情绪控制** | **极高（3秒音频跨语种克隆 + 细粒度笑声/呼吸指令）** | **极高（无音素依赖，戏剧哭笑张力极强）** | 内置数十种高质量预训练音色（不支持零样本克隆） | 行业最高标准（含防盗用口头授权锁） |
| **单张 L40S 实时并发路数** | **`32 – 45 路`（必须开启 vLLM + TensorRT）** | `25 – 38 路` | **`160+ 路`（显存占用 `< 1.5 GB`！）** | 云端无限弹性并发 |

---

## 5. 🧪 云端 API vs 自建开源 GPU 百万分钟 TCO 精算及 7-Card 报告（Benchmark & TCO）

### 5.1 不同月度通话量级下：全云端 PayGo vs 纯自建峰值 GPU vs “基荷自建 + 云端溢出”总成本（TCO）对比

> **精算假设**：包含 STT + TTS 双工总成本；自建方案采用双机高可用 `NVIDIA L40S`（`$1,150/卡/月` 含机柜电费），分摊 0.3 名 MLOps 运维人力（`$3,500/月`）；考虑呼叫中心昼夜峰谷比（纯自建需按峰值准备 3.2 倍冗余显卡）。

| 月度总语音时长（分钟/月） | 方案 A：100% 云端商用 API（零固定成本） | 方案 B：100% 纯自建开源 GPU（按白天峰值备卡 + 运维分摊） | **方案 C：混合架构（2张 L40S 跑 70% 基荷 + 30% 尖峰溢出云端）** | 架构师最优决策建议 |
| :--- | :--- | :--- | :--- | :--- |
| **50,000 分钟 / 月**（初创/中型企业） | **$1,250 / 月**（`$0.025/分`） | $5,800 / 月（GPU 90% 时间闲置 + 运维成本倒挂！） | $4,900 / 月 | **无脑选方案 A（全云端 API，省 78%）** |
| **200,000 分钟 / 月**（大型企业热线） | **$4,800 / 月** | $6,950 / 月（白天峰值需 4 卡，夜间空转亏损） | $5,400 / 月 | **选方案 A（云端承诺包更划算且零运维）** |
| **350,000 分钟 / 月（黄金盈亏平衡点）** | **$8,050 / 月** | $8,100 / 月 | **$6,200 / 月（开始反超纯云端！）** | **35万分钟是启动混合自建的分水岭** |
| **2,000,000 分钟 / 月**（超大规模外呼/配音） | $42,000 / 月 | $16,400 / 月 | **$11,800 / 月（等效 `$0.0059/分钟`！）** | **必选方案 C（混合基荷自建，年省 $36 万！）** |

### 5.2 7-Card (4:5) 视觉基准报告摘要（Open-Weight Voice GPU Benchmark）

> **数据溯源与口径声明（Provenance & Measurement Scope）**：以下指标源自 `turbo998/voice-agent-lab` 开源语音模型 GPU 推理与 TCO 基准规范（`OSS-VOICE-GPU-01`，标注为 `anonymized_reported` / `synthetic`，`independently_reproduced=false`）。所有零值延迟或幻觉计数均遵守严格测量边界：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`。

1. **Card 1 (`1 / 7` · `HANDS-ON · OPEN-WEIGHT-VOICE-GPU`) — 核心发现**：在单卡 `NVIDIA L40S (48GB)` 压测中，**通过 `Silero VAD + Faster-Whisper-Turbo (CTranslate2 Int8)` 与 `CosyVoice 2.0 (vLLM + TensorRT FP16)` 组合，单卡可同时承载 `36 路` 全双工流式语音会话（STT+TTS 总延迟 `210ms` P50），并在月话务量突破 `350,000 分钟` 后实现显著 TCO 净节省**。
2. **Card 2 (`2 / 7` · `SCENARIO: WHISPER-SILENCE-HALLUCINATION-KILL`) — 单例深潜（拦截 3 秒电话静音段触发的“谢谢观看”字幕幻觉）**：当客户在电话里沉默翻找保单时，前置 `Silero VAD` 在 `0.8ms` 内判定 `speech_prob = 0.04 < 0.5`，拦截静音帧进入 Whisper 解码器，配合 `condition_on_previous_text = False` 将静音幻觉率从 `19.4%` 压降至 **`0.0%`**（动作标签：`Act automatically`）。
3. **Card 3 (`3 / 7` · `WHAT I TESTED`) — 4 类开源语音自建核心陷阱实测矩阵**：
   - `WHISPER-SILENCE-SUBTITLE-HALLUCINATION`（向 Whisper 喂入 3 秒电话底噪）：裸跑 Whisper `✕ 19.4% 概率凭空输出“字幕由 Amara 提供/谢谢观看”` vs 前置 Silero VAD + 压缩比门禁 **0.0% 静音幻觉**；
   - `PYTORCH-EAGER-TTS-OOM`（用原生 PyTorch 跑开源自回归 TTS）：原生脚本 `✕ 单卡仅 3 路并发，第 4 路延迟飙至 4.8s` vs `vLLM Continuous Batching + TensorRT` **单卡 36 路并发且首包 `<= 150ms`**；
   - `CC-BY-NC-COMMERCIAL-LICENSE-TRAP`（在商业闭源客服中直接部署非商用授权权重）：无合规审计 `✕ 面临知识产权下架诉讼` vs 严格锁定 `Apache 2.0 / MIT` 模型（`CosyVoice 2 / Whisper / SenseVoice / Kokoro`）**100% 商用合规**；
   - `SUB-350K-MIN-IDLE-GPU-LOSS`（月话务仅 5 万分钟却自建 2 张全天候 GPU）：盲目自建 `✕ 算力空转成本比云端 API 贵 3.6 倍` vs `<35万分钟` 走云端 PayGo / `>35万分钟` 混合基荷 **TCO 最优**。
4. **Card 4 (`4 / 7` · `UNDER THE HOOD`) — 开源语音防幻觉、许可证核验与云端溢出契约**：
   ```json
   {
     "oss_voice_gpu_guard": {
       "policy_id": "OSS-VOICE-GPU-01",
       "stt_engine": "Faster_Whisper_Large_v3_Turbo_Int8",
       "silero_vad_pre_filter_enabled": true,
       "condition_on_previous_text": false,
       "tts_engine": "CosyVoice_2_0_5B_vLLM_TRT",
       "model_license": "Apache-2.0",
       "gpu_queue_wait_ms": 145,
       "burst_overflow_to_azure_speech": true
     }
   }
   ```
5. **Card 5 (`5 / 7` · `ROBUSTNESS CHECK`) — 促销洪峰本地 GPU 队列打满 0 秒无感云端溢出测试**：
   - 当本地 L40S 集群并发达到 90%、推理排队等待超过 `120ms` 时，网关自动将溢出请求热切换至 `Azure AI Speech`（绑定相同参考音色），实现 **0 通话排队掉线**。
6. **Card 6 (`6 / 7` · `LATENCY`) — 原生 PyTorch vs `vLLM + TensorRT` 开源 TTS 首包延迟对比（30 路并发下）**：
   - 原生 PyTorch Eager 模式（30 路并发排队）：P50 `2,850ms` / P95 `5,400ms`；
   - **`vLLM + TensorRT FP16 + 声纹预缓存`（30 路并发）**：**P50 `142ms` / P95 `215ms`（提速 20 倍！）**。
7. **Card 7 (`7 / 7` · `MY TAKE`) — 适用场景与架构师红线建议**：
   - **✅ 强烈推荐自建/混合（Good Fit）**：月话务量 `> 350,000 分钟` 的大型外呼/客服中心、月产数万分钟的短剧出海译制与有声书工厂、边缘离线硬件（`Kokoro-82M / SenseVoice`）。
   - **⛔ 严禁盲目自建（Not For）**：月话务量 `< 350,000 分钟` 的常规企业热线（直接用云端 API 更便宜省心）；无专职 MLOps 团队的强监管银行/医院内网（优先选微软官方维护的 `Azure Speech Containers`）。

---

## 6. 🛠️ 售前方案设计与生产上线验收 Checklist

- [ ] **1. 35 万分钟/月 TCO 盈亏平衡测算（`OSS-VOICE-GPU-01`）**：在决定自建 GPU 之前，是否已计入昼夜峰谷闲置率（通常仅 25% 利用率）、双机高可用冗余与运维人力成本？
- [ ] **2. Whisper 静音幻觉四道锁**：自建 Whisper 是否已强制前置 `Silero VAD` 过滤静音帧、设置 `condition_on_previous_text = False`，并拦截 `compression_ratio > 2.4` 的复读输出？
- [ ] **3. TTS 生产级推理引擎改造**：自建 `CosyVoice 2 / Fish Speech` 是否已通过 `vLLM / TensorRT-LLM` 开启连续批处理，并将参考声纹向量预缓存于显存？
- [ ] **4. 开源模型商业许可证红线核验**：进入商业生产环境的模型权重是否已确认为 `Apache 2.0` 或 `MIT`（严防误用 `CC-BY-NC-SA` 非商用权重）？
- [ ] **5. 本地 GPU 过载 `> 120ms` 云端弹性溢出**：是否为本地开源 GPU 池配置了云端 `Azure AI Speech` 溢出回路，防止高峰期显卡排队导致通话卡顿？
