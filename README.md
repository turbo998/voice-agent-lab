# 🎙️ Voice Agent 全栈工程实验室与售前实战套件（Azure Voice Live API & GPT-Live-1）

> 🌐 **Language / 语言切换**: **[中文 (当前)](README.md)** | **[English (`README.en.md`)](README.en.md)**

---

## ⚡ 执行摘要与核心指标（Executive Overview Summary）

**`voice-agent-lab`** 是面向企业级实时语音智能体（Real-Time Voice Agents）的**全栈工程验证实验室、确定性安全护栏引擎与售前架构套件**。本项目将 **Azure Voice Live API** 的三大控制层与四条统一语音通道（① 全双工 `GPT-Live-1`、② 原生 S2S `gpt-realtime-1.5`、③ 混合语义 VAD `Phi4-mm-realtime`、④ 级联 `Azure STT + LLM + HD Dragon TTS`）与 **398 个实时 POC 陷阱探针（398 Live POC Trap Probes，`A01–P350+`）** 深度结合，解决实时语音落地中最致命的**打断抢话、半开工具脏写、金融双录篡改、PCI 语音泄密与按分钟计费高昂 TCO** 五大痛点。

- 🌐 **交互式售前门户与实时沙箱**：[**`https://turbo998.github.io/voice-agent-lab/`**](https://turbo998.github.io/voice-agent-lab/)（支持简/繁/英切换、4 通道延迟模拟、BOM 推荐器与 TCO 计算器）
- 📊 **12 页高管汇报演示文稿（16:9 Deck）**：[**`https://turbo998.github.io/voice-agent-lab/deck.html`**](https://turbo998.github.io/voice-agent-lab/deck.html)（零外部依赖 HTML 幻灯片，支持键盘翻页与 PDF 打印）
- 🃏 **7-Card (4:5) 视觉模型基准报告（Voice Live & 多模型路由）**：[**`https://turbo998.github.io/voice-agent-lab/benchmark-cards.html`**](https://turbo998.github.io/voice-agent-lab/benchmark-cards.html)（基于 Azure East US 2 实测与 `site/data/voice-agent-benchmark-report.json` 密封评测数据）
- 🎙️ **7-Card (4:5) Azure Speech 说话人分离与双声道归属 PoC 报告**：[**`https://turbo998.github.io/voice/diarization-benchmark-cards.html`**](https://turbo998.github.io/voice/diarization-benchmark-cards.html)（对应 [`docs/azure-speech-diarization-poc.md`](docs/azure-speech-diarization-poc.md) 与独立仓 [`turbo998/azure-speech-diarization-poc`](https://github.com/turbo998/azure-speech-diarization-poc)）
- 🎬 **GPT-Live (`gpt-live-1`) 4 分 20 秒 Azure 实录视频与售前演示手册**：[**在线播放 (`GPT-Live-Azure-demo.mp4`)**](https://turbo998.github.io/voice/GPT-Live-Azure-demo.mp4) · [**售前演示手册 (`docs/gpt-live-partner-demo-handbook.md`)**](docs/gpt-live-partner-demo-handbook.md)
- 💍 **行业标杆案例深度研究（智能硬件出海 6 语种 AI 语音客服 · 25 万→75 万台智能戒指）**：[**在线深度案例专页 (`case-study.html`)**](https://turbo998.github.io/voice/case-study.html) · [**中文深度研究 (`docs/smart-hardware-global-voice-cs-case-study.zh-CN.md`)**](docs/smart-hardware-global-voice-cs-case-study.zh-CN.md) · [**English Case Study (`docs/smart-hardware-global-voice-cs-case-study.md`)**](docs/smart-hardware-global-voice-cs-case-study.md)
- 🧭 **架构师选型与原理解析 FAQ 旗舰二十三篇单专题指南（严格对标 `ib-vs-ethernet-roce-selection-faq.md` 六段式单专题标杆）**：
  1. **核心对话与大脑层（级联 `STT+LLM+TTS` vs 原生端到端 `Speech-to-Speech` 怎么选？语义级判停 EOU 与合规双轨热切换底层原理解析 · `P715–P716`）**：[**中文单专题 FAQ (`docs/cascaded-vs-s2s-voice-agent-architecture-faq.md`)**](docs/cascaded-vs-s2s-voice-agent-architecture-faq.md) · [**English FAQ (`docs/cascaded-vs-s2s-voice-agent-architecture-faq.en.md`)**](docs/cascaded-vs-s2s-voice-agent-architecture-faq.en.md)（兼容入口：[`docs/cascaded-vs-s2s-semantic-turn-faq.md`](docs/cascaded-vs-s2s-semantic-turn-faq.md)）
  2. **接入网与通信链路层（`WebRTC` vs `WebSocket` vs `SIP 电话网中继` 怎么选？TCP 队头阻塞、NetEQ 自适应抗抖动与 8kHz 带限多相抗混叠重采样原理解析 · `P717–P718`）**：[**中文单专题 FAQ (`docs/webrtc-vs-websocket-vs-sip-voice-transport-faq.md`)**](docs/webrtc-vs-websocket-vs-sip-voice-transport-faq.md) · [**English FAQ (`docs/webrtc-vs-websocket-vs-sip-voice-transport-faq.en.md`)**](docs/webrtc-vs-websocket-vs-sip-voice-transport-faq.en.md)（兼容入口：[`docs/webrtc-vs-websocket-vs-sip-ingress-selection-faq.md`](docs/webrtc-vs-websocket-vs-sip-ingress-selection-faq.md)）
  3. **只读知识库语音检索层（句尾串行语音 RAG vs 投机式只读预检索 `Speculative Voice RAG` 怎么选？120-Token 语音微切片与句尾改口二次核验原理解析 · `P719`）**：[**中文单专题 FAQ (`docs/speculative-voice-rag-faq.md`)**](docs/speculative-voice-rag-faq.md) · [**English FAQ (`docs/speculative-voice-rag-faq.en.md`)**](docs/speculative-voice-rag-faq.en.md)
  4. **写状态异步工具取消与回滚层（同步阻塞工具 vs 异步工具单调递增 `turnEpoch` 写栅栏与 Saga 逆向补偿怎么选？三级零死寂前导话术原理解析 · `P720`）**：[**中文单专题 FAQ (`docs/voice-tool-epoch-fence-faq.md`)**](docs/voice-tool-epoch-fence-faq.md) · [**English FAQ (`docs/voice-tool-epoch-fence-faq.en.md`)**](docs/voice-tool-epoch-fence-faq.en.md)（纯兼容导航入口：[`docs/speculative-voice-rag-zero-dead-air-faq.md`](docs/speculative-voice-rag-zero-dead-air-faq.md)）
  5. **全双工打断声学隔离层（基础线性 `AEC3+VAD` vs 双讲非线性残余回声门禁与目标说话人提取主叫锁定 `TSE` 怎么选？免提防自打断与旁人/电视防串音原理解析 · `P721–P722`）**：[**中文单专题 FAQ (`docs/barge-in-echo-crosstalk-faq.md`)**](docs/barge-in-echo-crosstalk-faq.md) · [**English FAQ (`docs/barge-in-echo-crosstalk-faq.en.md`)**](docs/barge-in-echo-crosstalk-faq.en.md)
  6. **AI 转人工坐席交接层（冷盲转 `SIP REFER` vs 单腿热转接 + 签名工单弹屏 vs 双腿协商热转接 + 私密单向耳语简报怎么选？零复述交接与防耳语串音原理解析 · `P723–P724`）**：[**中文单专题 FAQ (`docs/warm-transfer-whisper-handoff-faq.md`)**](docs/warm-transfer-whisper-handoff-faq.md) · [**English FAQ (`docs/warm-transfer-whisper-handoff-faq.en.md`)**](docs/warm-transfer-whisper-handoff-faq.en.md)
  7. **电话支付采集旁路与 PCI 范围界定层 [Topic 6A]（口述卡号直通 ASR/LLM vs 边缘 `RFC 4733` 带外按键旁路 + Token 化怎么选？降低下游 AI 集群暴露目标与收单机构/QSA 范围核定边界解析 · `P725`）**：[**中文单专题 FAQ (`docs/voice-pci-dtmf-scope-faq.md`)**](docs/voice-pci-dtmf-scope-faq.md) · [**English FAQ (`docs/voice-pci-dtmf-scope-faq.en.md`)**](docs/voice-pci-dtmf-scope-faq.en.md)
  8. **双录敏感音频归档脱敏与失败隔离层 [Topic 6B]（事后离线批处理消音 vs `SIPREC` 双流延迟环形缓冲 + `±150ms` 填充 + NER 滞后/漏检 Fail-Closed 隔离归档怎么选？实时 AI 流与归档流非互斥叠加边界解析 · `P726`）**：[**中文单专题 FAQ (`docs/siprec-pii-audio-redaction-faq.md`)**](docs/siprec-pii-audio-redaction-faq.md) · [**English FAQ (`docs/siprec-pii-audio-redaction-faq.en.md`)**](docs/siprec-pii-audio-redaction-faq.en.md)（纯兼容导航入口：[`docs/pci-dtmf-dual-stream-redaction-faq.md`](docs/pci-dtmf-dual-stream-redaction-faq.md)）
  9. **智能外呼机器检测（AMD）与 TCPA 合规双门禁层 [Topic 7]（传统阻塞式 AMD 死寂 vs 并行流式声学+语义 AMD + 乐观微问候 + 留言信箱 `Beep` 相位锁 & TCPA 最严双时区/RND 拨号前阻断怎么选？ · `P727–P728`）**：[**中文单专题 FAQ (`docs/outbound-amd-voicemail-tcpa-faq.md`)**](docs/outbound-amd-voicemail-tcpa-faq.md) · [**English FAQ (`docs/outbound-amd-voicemail-tcpa-faq.en.md`)**](docs/outbound-amd-voicemail-tcpa-faq.en.md)
  10. **高危字母数字串（工单号/车架号/运单号）识别与复诵消歧层 [Topic 8]（无约束自由语音 vs 动态短语语法槽位偏置 + 声学易混对门禁 + Luhn/ISO 3779 校验位预检 + SSML 分段拼读复诵怎么选？ · `P729–P730`）**：[**中文单专题 FAQ (`docs/voice-alphanumeric-disambiguation-faq.md`)**](docs/voice-alphanumeric-disambiguation-faq.md) · [**English FAQ (`docs/voice-alphanumeric-disambiguation-faq.en.md`)**](docs/voice-alphanumeric-disambiguation-faq.en.md)
  11. **通话中容灾接管与跨厂商毫秒级热逃生层 [Topic 9]（有状态 Pod 绑定掉线 vs 信令媒体解耦 `SIP re-INVITE / ICE Restart` + Redis 热检查点续写 + 跨厂商 `S2S → Cascaded` 熔断降级怎么选？ · `P731–P732`）**：[**中文单专题 FAQ (`docs/voice-midcall-failover-session-recovery-faq.md`)**](docs/voice-midcall-failover-session-recovery-faq.md) · [**English FAQ (`docs/voice-midcall-failover-session-recovery-faq.en.md`)**](docs/voice-midcall-failover-session-recovery-faq.en.md)
  12. **多人同场与三方通话流式说话人分离及角色权限隔离层 [Topic 10]（物理双声道/波束分轨 vs 单麦流式 `EEND` 重叠分离 + `<speaker role>` 归因 + 主叫声纹角色写锁与旁人插话隔离复核怎么选？ · `P733–P734`）**：[**中文单专题 FAQ (`docs/voice-multiparty-diarization-role-isolation-faq.md`)**](docs/voice-multiparty-diarization-role-isolation-faq.md) · [**English FAQ (`docs/voice-multiparty-diarization-role-isolation-faq.en.md`)**](docs/voice-multiparty-diarization-role-isolation-faq.en.md)
  13. **多语种与句内中英粤混说（Code-Switching）解码及同音色合成层 [Topic 11]（整句静态 LID 单语锁 vs `<=240ms` 帧级统一子词解码 + `10–16dB` 跨语种短语偏置 + 同音色 SSML `<lang>` 零爆音平滑切换怎么选？ · `P735–P736`）**：[**中文单专题 FAQ (`docs/voice-multilingual-codeswitch-dialect-faq.md`)**](docs/voice-multilingual-codeswitch-dialect-faq.md) · [**English FAQ (`docs/voice-multilingual-codeswitch-dialect-faq.en.md`)**](docs/voice-multilingual-codeswitch-dialect-faq.en.md)
  14. **端云混合量化容器部署与主权断网逃生层 [Topic 12]（纯公有云直连 vs 非对称混合精度量化容器 `FP16+INT8/FP8` + `<=400ms` 隧道弱网本地逃生 + 原声本地终结与 `<=35ms` 令牌化零声纹出境怎么选？ · `P737–P738`）**：[**中文单专题 FAQ (`docs/voice-edge-cloud-quantized-container-failover-faq.md`)**](docs/voice-edge-cloud-quantized-container-failover-faq.md) · [**English FAQ (`docs/voice-edge-cloud-quantized-container-failover-faq.en.md`)**](docs/voice-edge-cloud-quantized-container-failover-faq.en.md)
  15. **抗深伪活体检测（Anti-Deepfake Liveness）与多因子零摩擦电话核身层 [Topic 13]（被动声纹+静态 KBA 盘问 vs `AASIST` 声码器子带相位伪影检测 + `<=1,200ms` 动态随机挑战 + 运营商 `>=72h` 换卡锁与带外 `FIDO2` 硬件签名怎么选？ · `P739–P740`）**：[**中文单专题 FAQ (`docs/voice-anti-deepfake-liveness-auth-faq.md`)**](docs/voice-anti-deepfake-liveness-auth-faq.md) · [**English FAQ (`docs/voice-anti-deepfake-liveness-auth-faq.en.md`)**](docs/voice-anti-deepfake-liveness-auth-faq.en.md)
  16. **长通话音频上下文裁剪（Audio Context Pruning）与 PTU/PAYGO 弹性容量 FinOps 层 [Topic 14]（无界音频 $O(N^2)$ 重传 vs `<=4` 轮音频滑窗 + 顶置 `Pinned Slot JSON` 脱水（省 `74%`）+ Erlang-C `54%` PTU 黄金分界线与 `>85%` 洪峰溢出怎么选？ · `P741–P742`）**：[**中文单专题 FAQ (`docs/voice-finops-audio-context-pruning-ptu-faq.md`)**](docs/voice-finops-audio-context-pruning-ptu-faq.md) · [**English FAQ (`docs/voice-finops-audio-context-pruning-ptu-faq.en.md`)**](docs/voice-finops-audio-context-pruning-ptu-faq.en.md)
  17. **多模态数字人唇音同步（Avatar Lip-Sync）与同屏协办（Co-Browsing）安全防注入层 [Topic 15]（纯语音 vs 语音+同屏协办卡片 `viewportEpoch` 防误触锁 vs 2D/3D 数字人 `ITU-R BT.1359 <=45ms` 唇音对齐與 `<600 kbps` 弱网保音弃画怎么选？ · `P743–P744`）**：[**中文单专题 FAQ (`docs/voice-multimodal-avatar-cobrowsing-sync-faq.md`)**](docs/voice-multimodal-avatar-cobrowsing-sync-faq.md) · [**English FAQ (`docs/voice-multimodal-avatar-cobrowsing-sync-faq.en.md`)**](docs/voice-multimodal-avatar-cobrowsing-sync-faq.en.md)
  18. **情感韵律安抚（Affective Prosody De-Escalation）、EU AI Act 职场红线与哭泣长静音门禁层 [Topic 16]（欢快默认音色+600ms 抢话 vs 盛怒 `0.88x–0.94x` 降速安抚+禁推销 + 坐席声道禁生物情绪识别 + 哭泣 `>=1800ms` 判停展宽与危机零留存转接怎么选？ · `P745–P746`）**：[**中文单专题 FAQ (`docs/voice-affective-prosody-emotion-deescalation-faq.md`)**](docs/voice-affective-prosody-emotion-deescalation-faq.md) · [**English FAQ (`docs/voice-affective-prosody-emotion-deescalation-faq.en.md`)**](docs/voice-affective-prosody-emotion-deescalation-faq.en.md)
  19. **话后口头承诺与落库工单对账（Promise-vs-Ticket Reconciliation）及 100 分确定性全量质检层 [Topic 17]（挂机即忘+1% 人工盲抽 vs 挂机 `<=3000ms` 口头承诺比对 CRM 真实已提交记录（`$0` 漂移）+ `60/40` 时间戳原文引证全量质检怎么选？ · `P747–P748`）**：[**中文单专题 FAQ (`docs/voice-postcall-promise-ticket-reconciliation-qa-faq.md`)**](docs/voice-postcall-promise-ticket-reconciliation-qa-faq.md) · [**English FAQ (`docs/voice-postcall-promise-ticket-reconciliation-qa-faq.en.md`)**](docs/voice-postcall-promise-ticket-reconciliation-qa-faq.en.md)
  20. **多智能体语音协同编排（前台唯一主播+后台无头专家）与防乒乓死循环及权限隔离层 [Topic 18]（多 Bot 轮流接麦踢皮球 vs 前台单一人设锚定 + 后台 `<=650ms` 无头专家 `<=2` 跳防环路 + 只读子 Agent 零写权限污点隔离怎么选？ · `P749–P750`）**：[**中文单专题 FAQ (`docs/voice-multi-agent-swarm-handoff-loop-guard-faq.md`)**](docs/voice-multi-agent-swarm-handoff-loop-guard-faq.md) · [**English FAQ (`docs/voice-multi-agent-swarm-handoff-loop-guard-faq.en.md`)**](docs/voice-multi-agent-swarm-handoff-loop-guard-faq.en.md)
  21. **85dB 强噪远场拾音（快餐 Drive-Thru / 座舱 / 工厂）MVDR 波束成形与工业免提 LOTO 互锁层 [Topic 19]（全向单麦串音+强噪脑补幻觉 vs `<=±25°` MVDR 空间波束锥 + `<6dB` 防脑补追问 + 骨传导与 `OSHA 1910.147` 4位挑战码物理互锁怎么选？ · `P751–P752`）**：[**中文单专题 FAQ (`docs/voice-farfield-industrial-drivethru-noise-beamforming-faq.md`)**](docs/voice-farfield-industrial-drivethru-noise-beamforming-faq.md) · [**English FAQ (`docs/voice-farfield-industrial-drivethru-noise-beamforming-faq.en.md`)**](docs/voice-farfield-industrial-drivethru-noise-beamforming-faq.en.md)
  22. **金丝雀影子流量灰度（Canary Shadow Rollout）与跨通话长期记忆防投毒隔离层 [Topic 20]（全量直推+自由文本按 `ANI` 记忆 vs 影子流 `Dry-Run` 静音双跑 + `<=500ms` 金丝雀回滚 + 记忆权限字段清零与 `<=90天` TTL 隔离怎么选？ · `P753–P754`）**：[**中文单专题 FAQ (`docs/voice-canary-shadow-rollout-memory-poisoning-faq.md`)**](docs/voice-canary-shadow-rollout-memory-poisoning-faq.md) · [**English FAQ (`docs/voice-canary-shadow-rollout-memory-poisoning-faq.en.md`)**](docs/voice-canary-shadow-rollout-memory-poisoning-faq.en.md)
  23. **无障碍言语障碍自适应（EAA/ADA Disfluency Adaptive Turn-Taking）与紧急呼叫 E911/112 `PIDF-LO` 零鉴权抢占层 [Topic 21]（600ms 截断口吃+3次挂机 vs `>=2200ms` 声门阻塞展宽 + `RFC 4103 RTT` 双模态回退 + 危急 `<=200ms` 零鉴权抢占直连属地 `PSAP` 怎么选？ · `P755–P756`）**：[**中文单专题 FAQ (`docs/voice-accessibility-disfluency-e911-pidflo-bridge-faq.md`)**](docs/voice-accessibility-disfluency-e911-pidflo-bridge-faq.md) · [**English FAQ (`docs/voice-accessibility-disfluency-e911-pidflo-bridge-faq.en.md`)**](docs/voice-accessibility-disfluency-e911-pidflo-bridge-faq.en.md)
  24. **实时跨语种同声传译极性/剂量保真与多租户专属热词 `WFST` 隔离层 [Topic 22]（零等待贪婪 S2S 漏译 `NOT`+全局共享热词池泄密 vs 子句边界 `Wait-k` (`<=3` tokens, `<=650ms`) 极性/数值双 AST 门禁 + 单会话租户瞬态 `WFST` 浅层融合 `[1.0, 4.5]` 与音素距离 `>=2` 怎么选？ · `P757–P758`）**：[**中文单专题 FAQ (`docs/voice-realtime-interpreter-polarity-hotword-isolation-faq.md`)**](docs/voice-realtime-interpreter-polarity-hotword-isolation-faq.md) · [**English FAQ (`docs/voice-realtime-interpreter-polarity-hotword-isolation-faq.en.md`)**](docs/voice-realtime-interpreter-polarity-hotword-isolation-faq.en.md)
- 🔥 **2026-11-09 每日最热能力突破与五大支柱深度日报（级联 vs 原生 S2S 合规泳道切换 · WebRTC vs WebSocket vs SIP 接入与 8kHz 带限抗混叠重采样 · 只读投机语音 RAG [3A] & 异步写工具纪元栅栏 [3B] · 全双工免提非线性回声门禁与主叫声纹防串音 [4] · AI 转人工双腿热转接与单向耳语零复述交接 [5] · PCI 电话支付采集旁路范围界定 [6A] & SIPREC 敏感音频归档脱敏与 Fail-Closed 隔离 [6B] · 智能外呼并行流式 AMD 与 TCPA 最严双时区合规门禁 [7] · 高危字母数字串语音采集与 SSML 分段拼读复诵消歧 [8] · 通话中容灾接管与跨厂商毫秒级热逃生 [9] · 多人同场流式说话人分离与主叫声纹角色写权限锁 [10] · 句内中英粤混说统一子词解码与同音色跨语种合成 [11] · 端云混合量化语音容器与主权原声不出域断网逃生 [12] · 抗深伪活体检测与多因子零摩擦电话核身 [13] · 长通话 4 轮音频滑窗钉扎与 PTU/PAYGO 弹性 FinOps [14] · 多模态数字人唇音同步与同屏协办防注入 [15] · 情感韵律降速安抚与 EU AI Act 职场红线及哭泣长静音门禁 [16] · 话后口头承诺对账与 100 分确定性全量质检 [17] · 多智能体前台单一人设与防乒乓死循环及权限隔离 [18] · 85dB 强噪远场 MVDR 波束成形与工业 LOTO 安全互锁 [19] · 金丝雀影子流量回滚与跨通话长期记忆防投毒 [20] · 无障碍言语自适应判停与紧急呼叫 E911/112 PIDF-LO 抢占 [21] · 实时同传极性/剂量 AST 门禁与多租户热词 WFST 隔离 [22] · Stage 361–382 `P715–P758` · 385 大评测维度里程碑）**：[**中文日报 (`docs/daily/2026-11-09.md`)**](docs/daily/2026-11-09.md) · [**English Daily (`docs/daily/2026-11-09.en.md`)**](docs/daily/2026-11-09.en.md) · 往期：[`2026-11-08`](docs/daily/2026-11-08.md) · [`2026-11-05`](docs/daily/2026-11-05.md) · [`2026-11-04`](docs/daily/2026-11-04.md) · [`2026-11-03`](docs/daily/2026-11-03.md)

![2026-11-08 Enterprise Voice Agent Architecture Selection & Principle Deep-Dive FAQ Visual Summary](assets/svg/05-daily-breakthrough-2026-11-08.svg)

![2026-11-08 Enterprise Voice Agent Ingress Architecture Selection FAQ & Stage 362 Visual Summary](assets/svg/06-webrtc-vs-websocket-vs-sip-2026-11-08.svg)

![2026-11-08 Enterprise Voice Agent Speculative Voice RAG & Zero-Dead-Air Tool Calling FAQ & Stage 363 Visual Summary](assets/svg/07-speculative-voice-rag-2026-11-08.svg)

![2026-11-08 Enterprise Voice Agent Full-Duplex Barge-in Acoustic Isolation FAQ & Stage 364 Visual Summary](assets/svg/08-barge-in-echo-crosstalk-2026-11-08.svg)

![2026-11-08 Enterprise Voice Agent Warm Transfer & Whisper Handoff FAQ & Stage 365 Visual Summary](assets/svg/09-warm-transfer-whisper-handoff-2026-11-08.svg)

![2026-11-08 Enterprise Voice Agent PCI-DSS DTMF Bypass & Dual-Stream SIPREC Audio Redaction FAQ & Stage 366 Visual Summary](assets/svg/10-pci-dtmf-dual-stream-redaction-2026-11-08.svg)

![2026-11-08 Enterprise Voice Agent Outbound Parallel AMD & TCPA Safe-Harbor FAQ & Stage 367 Visual Summary](assets/svg/11-outbound-amd-voicemail-tcpa-2026-11-08.svg)

![2026-11-08 Enterprise Voice Agent Alphanumeric Entity Disambiguation & SSML Phonetic Readback FAQ & Stage 368 Visual Summary](assets/svg/12-voice-alphanumeric-disambiguation-2026-11-08.svg)

![2026-11-08 Enterprise Voice Agent Mid-Call Crash Recovery, SIP/WebRTC Media Re-Anchoring & Cross-Provider Failover FAQ & Stage 369 Visual Summary](assets/svg/13-voice-midcall-failover-session-recovery-2026-11-08.svg)

![2026-11-09 Enterprise Voice Agent Multi-Party Streaming Diarization & Speaker Role Privilege Isolation FAQ & Stage 370 Visual Summary](assets/svg/14-voice-multiparty-diarization-role-isolation-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Intra-Sentence Code-Switching & Multilingual Prosody Continuity FAQ & Stage 371 Visual Summary](assets/svg/15-voice-multilingual-codeswitch-dialect-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Edge-Cloud Quantized Speech Container & Sovereign Residency FAQ & Stage 372 Visual Summary](assets/svg/16-voice-edge-cloud-quantized-container-failover-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Anti-Deepfake Liveness & Multi-Factor Telecom Authentication FAQ & Stage 373 Visual Summary](assets/svg/17-voice-anti-deepfake-liveness-auth-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Long-Call Audio Context Pruning & PTU/PAYGO Elastic FinOps FAQ & Stage 374 Visual Summary](assets/svg/18-voice-finops-audio-context-pruning-ptu-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Multimodal Avatar Lip-Sync & Visual Co-Browsing FAQ & Stage 375 Visual Summary](assets/svg/19-voice-multimodal-avatar-cobrowsing-sync-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Affective Prosody De-Escalation, EU AI Act Workplace Compliance & Crisis Distress Silence FAQ & Stage 376 Visual Summary](assets/svg/20-voice-affective-prosody-emotion-deescalation-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Post-Call Promise-vs-Ticket Reconciliation & 100-Point Deterministic QA Rubric FAQ & Stage 377 Visual Summary](assets/svg/21-voice-postcall-promise-ticket-reconciliation-qa-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Multi-Agent Swarm Orchestration, Ping-Pong Loop Guard & Sub-Agent Least-Privilege Isolation FAQ & Stage 378 Visual Summary](assets/svg/22-voice-multi-agent-swarm-handoff-loop-guard-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Far-Field 85dB MVDR Beamforming & Industrial OSHA LOTO Safety Interlock FAQ & Stage 379 Visual Summary](assets/svg/23-voice-farfield-industrial-drivethru-noise-beamforming-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent Canary Shadow Rollout Auto-Rollback & Cross-Call Memory Poisoning Isolation FAQ & Stage 380 Visual Summary](assets/svg/24-voice-canary-shadow-rollout-memory-poisoning-2026-11-09.svg)

![2026-11-09 Enterprise Voice Agent EAA/ADA Speech Accessibility & Emergency E911/112 PIDF-LO Preemption FAQ & Stage 381 Visual Summary](assets/svg/25-voice-accessibility-disfluency-e911-pidflo-bridge-2026-11-09.svg)

### 核心工程与商业指标速览

| 评测与架构维度 | 实测 / 架构验证指标 | 核心技术机制与竞争优势 | 对应资产与代码入口 |
| :--- | :--- | :--- | :--- |
| **全双工打断响应（Barge-in Flush）** | **`< 170ms`**（端到端音频首包 `P50 = 310ms`） | `GPT-Live-1` 边听边说 + 客户端音频缓冲即时排空 + 单调递增 `turnEpoch` 状态机 | [`docs/solution-architecture.md`](docs/solution-architecture.md) |
| **僵尸工具副作用拦截率** | **`100%`**（`0` 脏写提交） | 用户打断瞬间递增 `turnEpoch`，自动吊销在途工具回调与过期音频帧（`T07` / `P01–P90`） | [`packages/business-core/enterprise-guardrails.ts`](packages/business-core/enterprise-guardrails.ts) |
| **说话人分离与双声道归属一致率** | **`100%` 覆盖 (`8/8` & `28/28`) · `100%` 声道对齐** | 修复 `azure-ai-transcription==1.0.0` `diarization.enabled=true` 序列化 + `--locale auto`（`RTF = 0.057`，快于实时 **17.5×**） | [`docs/azure-speech-diarization-poc.md`](docs/azure-speech-diarization-poc.md) |
| **金融双录与合规原文保真度** | **`100% Verbatim`**（零自由改写） | 触发法定风险揭示条款时动态切入 **通道 ④ 级联 `HD Dragon TTS`** 并锁定 `<=1.15x` 语速（`P60` / `P181–P270`） | [`docs/business-scenarios.md`](docs/business-scenarios.md) |
| **生产级护栏与 POC 探针覆盖** | **4 大分类 / 386 个实时 POC 探针** | 覆盖声学打断、SIP/WebRTC 弱网、PCI/HIPAA/双录合规、多 Agent 工具幂等与工业安全互锁 | [`docs/presales-playbook.md`](docs/presales-playbook.md) |
| **企业级 FinOps 单位分钟 TCO** | **`$0.048 – $0.076 / min`**（节省 **`65%–78%`**） | 混合语义 VAD（`Phi4-mm-realtime`）+ 80% 提示词缓存 + 4 轮音频滑窗裁剪（对比按分钟计费 SaaS `$0.18–$0.25/min`） | [`docs/competitive-analysis.md`](docs/competitive-analysis.md) |

---

## 🏗️ 1. Azure Voice Live API 三层四通道全景架构

![Azure Voice Live API 3-Layer & 4-Lane Enterprise Architecture](assets/svg/01-azure-voice-live-4-lane-architecture.svg)

### 三层四通道（3-Layer & 4-Lane）工程解构

1. **Layer 1 · 6 大企业行业域与 20 个高 ROI 生产场景（Ingress & Scenarios）**
   - 通过统一的 WebRTC、SIP Trunk（SBC）与 Azure Communication Services（ACS PSTN）接入层，支撑 **全渠道客服中心（Contact Center）**、**车载智能座舱与 eCall 救援（In-Vehicle eCall）**、**快餐免下车点餐（QSR Drive-Thru）**、**银行财富管理双录（Financial Dual-Recording）**、**航旅异常退改签与 PCI 支付（Travel & PCI Pay）** 以及 **140+ 语种政务热线（Public Services）** 六大领域共 20 个高价值场景。
2. **Layer 2 · 4 条统一实时语音通道（4 Unified Voice Lanes）**
   - **通道 ① 全双工 `GPT-Live-1`（Full-Duplex）**：支持原生“边听边说（Listen-While-Speaking）”，精准区分用户附和声（Backchannel 如“嗯、好的”）与真实打断（True Barge-in），实现 **`<170ms` 打断响应** 与 **`P50 = 310ms`** 极低延迟。
   - **通道 ② 原生端到端语音大模型 `gpt-realtime-1.5`（Native S2S）**：端到端语音 Token 直接推理，保留副语言情绪、语调与共情韵律（**`P50 = 420ms`**），适合 VIP 礼宾、财富顾问与高共情安抚场景。
   - **通道 ③ 混合语义端点检测 `Phi4-mm-realtime`（Hybrid Semantic VAD）**：基于多模态小模型实时判断语义说完点（Semantic EOU），在保持 **`P50 = 540ms`** 流畅交互的同时，将音频 Token 成本降低 **65%–78%**，是高并发餐饮点餐与智能分诊的 FinOps 最优解。
   - **通道 ④ 确定性级联管道 `Azure STT + LLM + HD Dragon TTS`（Cascaded Deterministic）**：结合 Azure Fast STT 自定义热词表（Phrase List）、文本层确定性合规审计/PII 脱敏与 Azure HD Dragon TTS 超拟真合成（**`P50 = 680ms`**），满足金融双录、医疗处方复诵等 **100% 逐字受控** 强监管要求。
3. **Layer 3 · 确定性状态机、安全熔断与 Foundry 多智能体委托（Governance & Tool Fabric）**
   - **`turnEpoch` 单调世代锁**：每次用户真实打断立即推进 `turnEpoch`，未对齐当前世代的异步工具写操作与残留 TTS 音频帧被 `0ms` 丢弃，彻底根除“话没说完钱已扣”的僵尸事务。
   - **Strict JSON Schema + SHA-256 幂等护栏**：所有写操作强制 Schema 校验与幂等键绑定，涉及金额、航司改签、工业阀门的操作必须经过北约字母/数字逐位复诵确认（Readback Verification）。
   - **`K01–K12` 安全熔断器与 Azure AI Foundry 异步委托**：内置实时声学/文本越狱拦截、PCI 卡号/CVV 媒体面旁路消音，以及面向慢速复杂推理的 Foundry Agent 异步桥接（自动播放舒适等待音效/話术掩蔽延迟）。

---

## 🎛️ 2. 四条统一实时语音通道（4 Unified Voice Lanes）选型对标

| 语音通道（Voice Lane） | 底层模型与协议引擎 | 端到端首字延迟（P50 / P95） | 打断响应（Barge-in） | 单位通话成本（FinOps） | 副语言特征与合规可控性 | 最佳适用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **通道 ① 全双工 `GPT-Live-1`** | `GPT-Live-1` 全双工音频流（WebRTC / WebSocket） | **`310ms`** / `490ms` | **`< 170ms`**（原生边听边说） | `$0.076 / min`（含 80% 提示词缓存） | 原生感知情绪、语调、呼吸与背景噪音；区分附和声与真打断 | 车载 eCall、VIP 财富助理、高敏情绪安抚、复杂多轮协商 |
| **通道 ② 原生 S2S `gpt-realtime-1.5`** | `gpt-realtime-1.5` 端到端语音 Token | **`420ms`** / `640ms` | `< 220ms`（服务端语义 VAD） | `$0.082 / min`（含滑窗裁剪） | 极高自然度与角色表现力；适合外语口语陪练与高端礼宾 | 连锁酒店多语种礼宾（`HOSP-PMS-01`）、游戏实时 NPC、出海售后 |
| **通道 ③ 混合语义 VAD `Phi4-mm-realtime`** | `Phi4-mm-realtime` 语义端点 + 轻量推理 | **`540ms`** / `780ms` | `< 260ms`（多模态 EOU 判定） | **`$0.048 / min`**（**FinOps 最优**） | 兼顾抗噪语义理解与结构化 JSON 输出，Token 消耗降低 68% | 快餐免下车点餐（QSR Drive-Thru）、高频物流改约、政务 12345 分诊 |
| **通道 ④ 确定性级联管道（Cascaded）** | `Azure Fast STT` + `LLM` + `HD Dragon TTS` | **`680ms`** / `950ms` | `< 300ms`（TTS 流式截断） | `$0.054 / min`（按字符/音频计费） | **100% 文本层可审计与逐字锁定**；支持自定义发音词典（Lexicon） | 银行财富管理双录（`WM-DUAL-01`）、航旅 PCI 支付、医疗处方复诵 |

---

## 🌐 3. 六大行业域与 20 个高 ROI 生产场景矩阵（`S1–S20`）

| 行业分域（Domain） | 场景编号与名称 | 核心痛点与业务挑战 | 推荐 Voice Live 通道 | 绑定的确定性生产护栏（Guardrail ID） | 量化 ROI / 业务收益 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. 全渠道客服中心 (Contact Center)** | `S1` 智能硬件出海售后 (`LumaNest`)<br>`S2` 电信 eSIM 防劫持 (`TELCO-ESIM-01`)<br>`S3` 金融云 NOC 战情室 (`CLOUD-NOC-01`)<br>`S4` IT/HR 吹哨与服务台 | 跨国口音识别率低、SIM 卡社工盗号、Sev-1 故障误操作、人工坐席流失率高 | 通道 ① `GPT-Live-1` + 通道 ③ 混合 VAD | `T07` (`turnEpoch`), `P09` (耳语热转接), `P97` (CPNI/SIM-Swap 24h 锁), `P113` (吹哨人匿名) | 首次呼叫解决率（FCR）提升 **+28%**，坐席单通处理时长（AHT）缩短 **42%** |
| **2. 车载座舱与紧急救援 (In-Vehicle eCall)** | `S5` 车规级碰撞 eCall 救援<br>`S6` 座舱四音区免提控车<br>`S7` L4 自动驾驶远程安全员 (`AUTO-TELEOP-01`) | 高速风噪/胎噪干扰、后排儿童误触发车窗/尾门、碰撞瞬间 0ms 抢占与位置上报 | 通道 ① `GPT-Live-1` + 本地边缘容器（范式 D） | `P31` / `P99` (ISO 26262 / eCall 0ms 抢占), `P27` / `P32` (四音区波束隔离), `P50` (连环碰撞锁) | 紧急救援响应提速 **3.2x**，座舱后排串音误操作率降至 **0.0%** |
| **3. 餐饮零售与物流 (QSR & Logistics)** | `S8` 快餐 Drive-Thru 免下车点餐<br>`S9` 跨境物流异常改约与 AMD 外呼<br>`S10` 跨境冷链电放提单 (`LOG-COLD-01`) | 柴油引擎噪音、复杂加料口音改单、语音信箱（AMD）抢话泄密、无单放货欺诈 | 通道 ③ `Phi4-mm-realtime` 混合语义 VAD | `P25` (TCPA 宵禁 / AMD 防泄密), `P58` (跨端购物车 CAS 防重扣), `P83` (海关 HS 与制裁筛查) | 单车道小时吞吐量提升 **+19%**，单位订单语音 AI 成本 **`<$0.03`** |
| **4. 金融双录与保险理赔 (BFSI & Dual-Rec)** | `S11` 银行财富双录质检 (`WM-DUAL-01`)<br>`S12` 车险报案定损 (`FNOL`)<br>`S13` 对公财资四眼原则复核<br>`S14` 零售银行非授权转账争议 | 风险等级错配（C2 买 R5）、LLM 自由缩写免责条款导致合规罚款、声纹伪造盗刷 | 通道 ④ 级联 `HD Dragon TTS`（合规锁）+ 通道 ① | `P60` (MiFID II 逐字播报 `<=1.15x`), `P43` (Maker-Checker 四眼原则), `P91` (Reg E 争议垫付), `S08` (防深伪) | 双录一次合格率从 68% 升至 **99.4%**，合规审计人工复核成本下降 **75%** |
| **5. 航旅酒店与 PCI 支付 (Travel & PCI Pay)** | `S15` 跨国航司大面积航延 (`AIR-IRROPS-01`)<br>`S16` 连锁酒店多语种礼宾 (`HOSP-PMS-01`)<br>`S17` 机酒语音 PCI 授信支付 | 台风/罢工万级并发涌入、口述信用卡号流入大模型日志违反 PCI-DSS v4.0、跨房查单隐私泄露 | 通道 ①/② + 通道 ④（支付脱敏段） | `P11` / `P68` (PCI-DSS SAQ-A 400Hz 旁路掩蔽), `P87` (DOT 24h 现金退票 / 轮椅 CRO 升级) | 航延高峰自助改签分流率 **86%**，大模型持卡人敏感数据暴露 **0 字节** |
| **6. 政务医疗与工业能源 (Public & Industrial)** | `S18` 政务 12345 热线与燃气应急 (`GOV-GAS-01`)<br>`S19` 临床随访与药物警戒 (`PHARMA-PV-01`)<br>`S20` 高端制造与智能电网互锁 (`IND-FIELD-01` / `GRID-STORM-01`) | 危化/燃气泄漏 0ms 抢占、临床双盲试验破盲风险、带电合闸/高压阀门误操作致命风险 | 通道 ③/④ + 离线主权语音容器（`P53`） | `P33` / `P101` (988/急诊 0ms 热转接), `P89` / `P111` (FDA 24h SAE / 防破盲), `P121–P139` (三段式复诵 + LOTO) | 140+ 语种全天候覆盖，高危工业/医疗指令 **100% 强制双人/复诵门禁** |

---

## 🛡️ 4. 四大生产护栏分类（`P01–P350+`）与 FinOps TCO 对标

![Voice Agent Production Guardrail Taxonomy & FinOps TCO Comparison](assets/svg/02-voice-guardrail-taxonomy-and-tco.svg)

### 四大生产护栏分类矩阵（替代单行文本堆砌的精简分类索引）

我们将 `packages/business-core/enterprise-guardrails.ts` 与 [`docs/solution-architecture.md`](docs/solution-architecture.md) 中的 **498 个实时 POC 陷阱探针（498 Live POC Trap Probes）** 系统化收敛为四大工程分类：

| 护栏分类编号 | 生产护栏领域 | 覆盖的核心工程陷阱与协议标准 | 确定性拦截机制与 SLA | 详细架构文档链接 |
| :--- | :--- | :--- | :--- | :--- |
| **分类一 (`P01–P90`)** | **声学前端、自适应 VAD 与全双工打断控制** | 扬声器回声自打断（`AEC3 ERLE`）、车载多音区串音、咳嗽/背景人声误触发、残障/口吃人群停顿被抢话（`EAA/ADA`）、`>16kHz` 超声波注入（DolphinAttack）、原生 S2S 咆哮情绪传染 | **`<170ms`** 缓冲排空 · `turnEpoch` 投机取消 · `2100–2400ms` 无障碍自适应端点窗口 · `-16 LUFS` 响度钳制 | [`docs/solution-architecture.md`](docs/solution-architecture.md) |
| **分类二 (`P91–P180`)** | **电信网联（SIP/SBC）、WebRTC 弱网韧性与抗丢包** | PSTN/SIP ↔ WebRTC 互操作、`RFC 3261/3264/3515` 信令环路与转接劫持、`Opus FEC/PLC` 突发丢包脑补幻觉、`RFC 8656 TURN` 放大攻击、`SRTP ROC` 回绕失步、蓝牙 `HFP` 切换爆音 | **`<=150ms`** 死亡 SBC 故障切换 · `RFC 5761 rtcp-mux` 强制复用 · `ITU-T G.107 MOS-LQO` 实时降级纯音频保底 | [`docs/solution-architecture.md`](docs/solution-architecture.md) |
| **分类三 (`P181–P270`)** | **金融双录合规、PCI-DSS 4.0 脱敏与行业监管门禁** | `PCI-DSS v4.0 SAQ-A` 卡号/CVV 媒体面旁路消音（`400Hz` 掩蔽）、`MiFID II / FINRA / Reg BI` 适当性与逐字风险揭示、`RFC 7866 SIPREC` 双录分流、`HIPAA / FDA 21 CFR Part 11` 医疗隐私与 `BIPA` 声纹销毁 | **`0 明文`** 持卡人数据落盘 · 法定条款 **`100%` 逐字锁定** · `SEC 17a-4` 7 年 WORM 不可篡改审计封存 | [`docs/solution-architecture.md`](docs/solution-architecture.md) |
| **分类四 (`P271–P350+`)** | **多智能体工具安全、关键基础设施互锁与 FinOps 治理** | MCP 间接提示词注入与多步 Saga 逆向补偿、4 眼原则（Maker-Checker）FIDO2 复核、4 轮音频滑窗与 Erlang-C 弹性溢出（`PTU + PAYGO`）、电网/核电/半导体/航空/铁路三段式复诵与 `0ms` 急停互锁 | **`<2ms`** 三层零信任统一护栏流水线（`P08`）· 单位通话成本降低 **`65%–78%`** · 关键指令 **100% 复诵闭环** | [`docs/solution-architecture.md`](docs/solution-architecture.md) |

---

## 📚 3. 售前与架构交付物全景导航（Documentation Matrix）

| 交付物名称 | 在线体验 / 仓库路径 | 核心内容摘要 |
| :--- | :--- | :--- |
| **交互式 H5 售前门户与实时语音沙箱** | [**`https://turbo998.github.io/voice-agent-lab/`**](https://turbo998.github.io/voice-agent-lab/) (`site/index.html`) | 内置 **简体中文 / 繁體中文 / English (`zh-CN` / `zh-TW` / `en`)** 切换；含 **20 大行业场景 (`S1–S20`)**、4 大参考架构、交互式 BOM 选型器、7 大竞品攻防卡、**Web Audio 实时语音沙箱（含 554 Live POC Trap Probes）** 与 **FinOps TCO 计算器** |
| **企业语音智能体架构选型与原理解析单专题 FAQ 矩阵（24 篇独立单专题指南）** | [`大脑编排`](docs/cascaded-vs-s2s-semantic-turn-faq.md) · [`接入网`](docs/webrtc-vs-websocket-vs-sip-ingress-selection-faq.md) · [`只读投机 RAG`](docs/speculative-voice-rag-faq.md) · [`异步工具纪元栅栏`](docs/voice-tool-epoch-fence-faq.md) · [`全双工打断声学隔离`](docs/barge-in-echo-crosstalk-faq.md) · [`AI转人工热转接耳语`](docs/warm-transfer-whisper-handoff-faq.md) · [`PCI支付采集旁路`](docs/voice-pci-dtmf-scope-faq.md) · [`SIPREC音频脱敏`](docs/siprec-pii-audio-redaction-faq.md) · [`智能外呼AMD与TCPA`](docs/outbound-amd-voicemail-tcpa-faq.md) · [`字母数字串复诵消歧`](docs/voice-alphanumeric-disambiguation-faq.md) · [`通话中容灾接管与热逃生`](docs/voice-midcall-failover-session-recovery-faq.md) · [`多人通话流式分离与角色锁`](docs/voice-multiparty-diarization-role-isolation-faq.md) · [`句内中英粤混说与同音色合成`](docs/voice-multilingual-codeswitch-dialect-faq.md) · [`端云量化容器与主权逃生`](docs/voice-edge-cloud-quantized-container-failover-faq.md) · [`抗深伪活体与多因子核身`](docs/voice-anti-deepfake-liveness-auth-faq.md) · [`长通话音频裁剪与FinOps`](docs/voice-finops-audio-context-pruning-ptu-faq.md) · [`多模态数字人与同屏协办`](docs/voice-multimodal-avatar-cobrowsing-sync-faq.md) · [`情感韵律安抚与EU合规`](docs/voice-affective-prosody-emotion-deescalation-faq.md) · [`话后承诺对账与全量质检`](docs/voice-postcall-promise-ticket-reconciliation-qa-faq.md) · [`多Agent协同防环路与权限隔离`](docs/voice-multi-agent-swarm-handoff-loop-guard-faq.md) · [`85dB远场波束与工业LOTO互锁`](docs/voice-farfield-industrial-drivethru-noise-beamforming-faq.md) · [`金丝雀影子灰度与记忆防投毒`](docs/voice-canary-shadow-rollout-memory-poisoning-faq.md) · [`无障碍自适应与E911急救抢占`](docs/voice-accessibility-disfluency-e911-pidflo-bridge-faq.md) · [`同传极性剂量锁与热词WFST隔离`](docs/voice-realtime-interpreter-polarity-hotword-isolation-faq.md) | 严格对标 `ib-vs-ethernet-roce-selection-faq.md` 单专题六段式结构：通俗讲透级联 vs 原生 `S2S`、`WebRTC vs WebSocket vs SIP`、只读投机式语音 RAG (`P719`)、异步写工具 `turnEpoch`/Saga (`P720`)、双讲非线性回声抑制 (`P721`) 与主呼人声纹锁 (`P722`)、双腿热转接签名上下文 (`P723`) 与单向耳语 (`P724`)、边缘 DTMF 支付旁路与 PCI 范围缩减条件 (`P725`)、SIPREC 环形缓冲脱敏与 Fail-Closed 隔离 (`P726`)、外呼并行流式 AMD (`P727`) 与 TCPA 双时区门禁 (`P728`)、高危字母数字串声学消歧 + 校验位预检 (`P729`) 与 SSML 分段拼读复诵 (`P730`)、通话中媒体重锚定 + Redis 检查点续写 (`P731`) 与跨厂商熔断热逃生 (`P732`)、多人流式重叠分离 (`P733`) 与主叫声纹角色写权限锁 (`P734`)、句内中英粤混说帧级子词解码 (`P735`) 与同音色跨语种平滑合成 (`P736`)、边缘非对称混合量化断网逃生 (`P737`) 与主权原声本地终结 (`P738`)、声码器子带相位伪影活体检测 (`P739`) 与电信换卡锁 + `FIDO2` 阶梯鉴权 (`P740`)、4 轮音频滑窗钉扎压缩 (`P741`) 与 `54%` PTU 黄金分界线弹性溢出 (`P742`)、数字人 `<=45ms` 唇音对齐保音弃画 (`P743`) 与同屏客户端遮罩防误触锁 (`P744`)、盛怒 `0.88x–0.94x` 降速安抚与 EU AI Act 职场声道隔离 (`P745`)、哭泣 `>=1800ms` 判停展宽与危机零留存转接 (`P746`)、挂机 `<=3000ms` 口头承诺对账补偿 (`P747`)、`60/40` 时间戳引证全量质检 (`P748`)、前台唯一主播+无头专家 `<=2` 跳防环路 (`P749`)、子 Agent 零写权限污点剥离 (`P750`)、`<=±25°` MVDR 空间波束防脑补 (`P751`)、工业 LOTO 挑战码互锁 (`P752`)、影子流 Dry-Run 与 `<=500ms` 金丝雀回滚 (`P753`)、跨通话长期记忆权限清零防投毒 (`P754`)、口吃 `>=2200ms` 自适应展宽 + RTT 回退 (`P755`)、急救 `<=200ms` 零鉴权 `PIDF-LO` 抢占 (`P756`)、同传子句 `Wait-k` 极性/剂量 AST 锁 (`P757`) 及多租户热词 `WFST` 浅层融合隔离 (`P758`) |
| **12 页 Azure 高管汇报 Deck (16:9)** | [**`https://turbo998.github.io/voice-agent-lab/deck.html`**](https://turbo998.github.io/voice-agent-lab/deck.html) (`site/deck.html`) | 遵循 `azure-style-presentation` 规范的零依赖 HTML 演示文稿：涵盖 2026 语音智能体拐点、4 通道架构、`turnEpoch` 投机取消、Sierra / Retell / ElevenLabs / Nova Sonic 竞品对比与 2 周 POC 验收标准 |
| **7-Card (4:5) 视觉模型基准评测报告** | [**`https://turbo998.github.io/voice-agent-lab/benchmark-cards.html`**](https://turbo998.github.io/voice-agent-lab/benchmark-cards.html) (`site/benchmark-cards.html`) | 遵循 7-Card 4:5 竖版评测规范：基于 Azure East US 2 实测 (`gpt-4.1-mini` / `gpt-4.1` / `gpt-5.4-mini` / `gpt-live-1`) 与密封评测数据 (`site/data/voice-agent-benchmark-report.json`) |
| **Azure Speech 说话人分离与双声道归属 PoC (7-Card + 源码)** | [**`https://turbo998.github.io/voice/diarization-benchmark-cards.html`**](https://turbo998.github.io/voice/diarization-benchmark-cards.html) · [`中文报告`](docs/azure-speech-diarization-poc.md) · [`EN`](docs/azure-speech-diarization-poc.en.md) | 定位并修复 `azure-ai-transcription==1.0.0` `diarization.enabled=true` 序列化缺陷；官方双人样本 `0/8 → 8/8` (`100%`)，客户 `224.8s` 双声道录音 `28/28` (`RTF=0.057`) 且声道归属一致率 `100%` |
| **GPT-Live (`gpt-live-1`) 客户演示手册与 4m20s 实录视频** | [**`https://turbo998.github.io/voice/GPT-Live-Azure-demo.mp4`**](https://turbo998.github.io/voice/GPT-Live-Azure-demo.mp4) · [`中文手册`](docs/gpt-live-partner-demo-handbook.md) · [`EN`](docs/gpt-live-partner-demo-handbook.en.md) | 涵盖三平面逻辑架构、6 分钟标准现场演示脚本、打断与事务边界、Azure Retail Prices API 成本核算（月均 `$20.41`）及 4 分 20 秒实机录像 |
| **四范式方案架构与电信网联指南** | [`docs/solution-architecture.md`](docs/solution-architecture.md) · [`EN`](docs/solution-architecture.en.md) | 顶置 **核心架构概览与双 SVG 架构图**；对比 Paradigm A–D 四大范式，详解 PSTN/SIP ↔ ACS 时序、弱网抗损曲线、`turnEpoch` 状态机及 **四大类生产护栏（`P01–P350+`）** |
| **售前实战打单手册与 POC 交付指南** | [`docs/presales-playbook.md`](docs/presales-playbook.md) · [`EN`](docs/presales-playbook.en.md) | 首轮客户 5 维 Discovery 问卷、竞对设伏提问、15 分钟现场演示脚本、2 周 POC 验收标准、**586 个现场照妖镜探针（A01–P758）** 与存量竞品两阶段替换剧本 |
| **20 大行业业务场景与 ROI 白皮书** | [`docs/business-scenarios.md`](docs/business-scenarios.md) · [`EN`](docs/business-scenarios.en.md) | 深度拆解智能硬件出海、快餐 Drive-Thru、车险 FNOL、车载 eCall、航旅 PCI 支付、政务热线、财富双录 (`WM-DUAL-01`)、酒店礼宾 (`HOSP-PMS-01`) 等 20 大场景端到端呼叫流与 TCO 模型 |
| **全球语音 AI 竞品深度拆解与攻防手册** | [`docs/competitive-analysis.md`](docs/competitive-analysis.md) · [`EN`](docs/competitive-analysis.en.md) | 深度拆解 **Sierra AI**、**Retell AI**、**ElevenLabs**、**Vapi / LiveKit**、**PolyAI / Bland AI**、**Cartesia / Deepgram / Hume** 与 **AWS Nova Sonic / Google CES** 的隐性计费乘数与迁移路径 |
| **全量资产总表与每日演进日志** | [`docs/asset-catalog.md`](docs/asset-catalog.md) · [`EN`](docs/asset-catalog.en.md) | 跨仓资产索引（`voice-agent-lab`、`gpt-live-1-demo`、`benchmark-harness-engineering`）与分阶段工程演进记录 |

---

## 🧪 4. LumaNest 全栈语音工程实验室与本地快速开始

本仓库同时包含原创合成品牌 **LumaNest**（智能硬件出海东南亚）的全栈浏览器语音实验室，覆盖售前咨询、订单查询、安全故障诊断、运营审批工单与同意后的回访计划（纯合成数据，不发生真实外部拨号或扣款）。

### 两个独立实验对比

| 实验模块 | 技术实现与协议路径 | 当前验证状态与证据 |
| :--- | :--- | :--- |
| **Retell-native** | Conversation Flow、严格业务函数、可选只读 MCP、实时字幕与主管控制 | 完整通过离线测试与构建；Webhook 签名校验针对原始字节与时间戳 |
| **GPT Live** | 保留 MIT 上游独立 UI 与 `/live/sessions` 协议，增加受保护云适配器（详见 [`experiments/gpt-live/PROVENANCE.json`](experiments/gpt-live/PROVENANCE.json)） | 通过 33 项独立单元测试与发布安全扫描 |
| **Foundry Agent** | 固定版本 Prompt Agent + Responses API + Azure AI Search 简单查询 | 完成确定性业务闭环与审批幂等键校验（详见 [`docs/delivery-status.md`](docs/delivery-status.md)） |

### 本地安装与离线业务演练（Node.js 22+）

```powershell
npm ci --no-audit --no-fund
npm run setup:local
npm run build
npm run dev
```

打开 `http://127.0.0.1:8080`，使用 `.private\operator.password.txt` 中的本地密码登录（请勿将该文件或 `.private\lab.env` 提交至 GitHub）。可选择新加坡合成客户与 Cam Air 运行端到端业务演练：查询订单 `LN-SG-1001`、诊断 5 GHz 配网失败、审阅草稿后批准固定版本并提交幂等工单。

### 自动化验证与回归测试套件

```powershell
npm run typecheck
npm test
npm run build
npm run test:gpt-live
npm run check:gpt-live
npm run check:public
```

<details>
<summary><b>🔎 展开查看确定性护栏编号完整索引（P01–P710，对应 <code>docs/solution-architecture.md</code>）</b></summary>

- **分类一：声学、VAD 与全双工打断控制 (`P01–P90`)**：`P01`, `P02`, `P03`, `P04`, `P05`, `P06`, `P07`, `P08`, `P09`, `P10`, `P11`, `P12`, `P13`, `P14`, `P15`, `P16`, `P17`, `P18`, `P19`, `P20`, `P21`, `P22`, `P23`, `P24`, `P25`, `P26`, `P27`, `P28`, `P29`, `P30`, `P31`, `P32`, `P33`, `P34`, `P35`, `P36`, `P37`, `P38`, `P39`, `P40`, `P41`, `P42`, `P43`, `P44`, `P45`, `P46`, `P47`, `P48`, `P49`, `P50`, `P51`, `P52`, `P53`, `P54`, `P55`, `P56`, `P57`, `P58`, `P59`, `P60`, `P61`, `P62`, `P63`, `P64`, `P65`, `P66`, `P67`, `P68`, `P69`, `P70`, `P71`, `P72`, `P73`, `P74`, `P75`, `P76`, `P77`, `P78`, `P79`, `P80`, `P81`, `P82`, `P83`, `P84`, `P85`, `P86`, `P87`, `P88`, `P89`, `P90`
- **分类二：电信 SIP/SBC 与 WebRTC 弱网韧性 (`P91–P180`)**：`P91`, `P92`, `P93`, `P94`, `P95`, `P96`, `P97`, `P98`, `P99`, `P100`, `P101`, `P102`, `P103`, `P104`, `P105`, `P106`, `P107`, `P108`, `P109`, `P110`, `P111`, `P112`, `P113`, `P114`, `P115`, `P116`, `P117`, `P118`, `P119`, `P120`, `P121`, `P122`, `P123`, `P124`, `P125`, `P126`, `P127`, `P128`, `P129`, `P130`, `P131`, `P132`, `P133`, `P134`, `P135`, `P136`, `P137`, `P138`, `P139`, `P140`, `P141`, `P142`, `P143`, `P144`, `P145`, `P146`, `P147`, `P148`, `P149`, `P150`, `P151`, `P152`, `P153`, `P154`, `P155`, `P156`, `P157`, `P158`, `P159`, `P160`, `P161`, `P162`, `P163`, `P164`, `P165`, `P166`, `P167`, `P168`, `P169`, `P170`, `P171`, `P172`, `P173`, `P174`, `P175`, `P176`, `P177`, `P178`, `P179`, `P180`
- **分类三：金融双录合规、PCI 脱敏与行业监管 (`P181–P270`)**：`P181`, `P182`, `P183`, `P184`, `P185`, `P186`, `P187`, `P188`, `P189`, `P190`, `P191`, `P192`, `P193`, `P194`, `P195`, `P196`, `P197`, `P198`, `P199`, `P200`, `P201`, `P202`, `P203`, `P204`, `P205`, `P206`, `P207`, `P208`, `P209`, `P210`, `P211`, `P212`, `P213`, `P214`, `P215`, `P216`, `P217`, `P218`, `P219`, `P220`, `P221`, `P222`, `P223`, `P224`, `P225`, `P226`, `P227`, `P228`, `P229`, `P230`, `P231`, `P232`, `P233`, `P234`, `P235`, `P236`, `P237`, `P238`, `P239`, `P240`, `P241`, `P242`, `P243`, `P244`, `P245`, `P246`, `P247`, `P248`, `P249`, `P250`, `P251`, `P252`, `P253`, `P254`, `P255`, `P256`, `P257`, `P258`, `P259`, `P260`, `P261`, `P262`, `P263`, `P264`, `P265`, `P266`, `P267`, `P268`, `P269`, `P270`
- **分类四：多智能体工具安全、关键设施互锁与 FinOps (`P271–P350`)**：`P271`, `P272`, `P273`, `P274`, `P275`, `P276`, `P277`, `P278`, `P279`, `P280`, `P281`, `P282`, `P283`, `P284`, `P285`, `P286`, `P287`, `P288`, `P289`, `P290`, `P291`, `P292`, `P293`, `P294`, `P295`, `P296`, `P297`, `P298`, `P299`, `P300`, `P301`, `P302`, `P303`, `P304`, `P305`, `P306`, `P307`, `P308`, `P309`, `P310`, `P311`, `P312`, `P313`, `P314`, `P315`, `P316`, `P317`, `P318`, `P319`, `P320`, `P321`, `P322`, `P323`, `P324`, `P325`, `P326`, `P327`, `P328`, `P329`, `P330`, `P331`, `P332`, `P333`, `P334`, `P335`, `P336`, `P337`, `P338`, `P339`, `P340`, `P341`, `P342`, `P343`, `P344`, `P345`, `P346`, `P347`, `P348`, `P349`, `P350`
- **扩展行业与协议深水区探针 (`P351–P704`)**：`P351`, `P352`, `P353`, `P354`, `P355`, `P356`, `P357`, `P358`, `P359`, `P360`, `P361`, `P362`, `P363`, `P364`, `P365`, `P366`, `P367`, `P368`, `P369`, `P370`, `P371`, `P372`, `P373`, `P374`, `P375`, `P376`, `P377`, `P378`, `P379`, `P380`, `P381`, `P382`, `P383`, `P384`, `P385`, `P386`, `P387`, `P388`, `P389`, `P390`, `P391`, `P392`, `P393`, `P394`, `P395`, `P396`, `P397`, `P398`, `P399`, `P400`, `P401`, `P402`, `P403`, `P404`, `P405`, `P406`, `P407`, `P408`, `P409`, `P410`, `P411`, `P412`, `P413`, `P414`, `P415`, `P416`, `P417`, `P418`, `P419`, `P420`, `P421`, `P422`, `P423`, `P424`, `P425`, `P426`, `P427`, `P428`, `P429`, `P430`, `P431`, `P432`, `P433`, `P434`, `P435`, `P436`, `P437`, `P438`, `P439`, `P440`, `P441`, `P442`, `P443`, `P444`, `P445`, `P446`, `P447`, `P448`, `P449`, `P450`, `P451`, `P452`, `P453`, `P454`, `P455`, `P456`, `P457`, `P458`, `P459`, `P460`, `P461`, `P462`, `P463`, `P464`, `P465`, `P466`, `P467`, `P468`, `P469`, `P470`, `P471`, `P472`, `P473`, `P474`, `P475`, `P476`, `P477`, `P478`, `P479`, `P480`, `P481`, `P482`, `P483`, `P484`, `P485`, `P486`, `P487`, `P488`, `P489`, `P490`, `P491`, `P492`, `P493`, `P494`, `P495`, `P496`, `P497`, `P498`, `P499`, `P500`, `P501`, `P502`, `P503`, `P504`, `P505`, `P506`, `P507`, `P508`, `P509`, `P510`, `P511`, `P512`, `P513`, `P514`, `P515`, `P516`, `P517`, `P518`, `P519`, `P520`, `P521`, `P522`, `P523`, `P524`, `P525`, `P526`, `P527`, `P528`, `P529`, `P530`, `P531`, `P532`, `P533`, `P534`, `P535`, `P536`, `P537`, `P538`, `P539`, `P540`, `P541`, `P542`, `P543`, `P544`, `P545`, `P546`, `P547`, `P548`, `P549`, `P550`, `P551`, `P552`, `P553`, `P554`, `P555`, `P556`, `P557`, `P558`, `P559`, `P560`, `P561`, `P562`, `P563`, `P564`, `P565`, `P566`, `P567`, `P568`, `P569`, `P570`, `P571`, `P572`, `P573`, `P574`, `P575`, `P576`, `P577`, `P578`, `P579`, `P580`, `P581`, `P582`, `P583`, `P584`, `P585`, `P586`, `P587`, `P588`, `P589`, `P590`, `P591`, `P592`, `P593`, `P594`, `P595`, `P596`, `P597`, `P598`, `P599`, `P600`, `P601`, `P602`, `P603`, `P604`, `P605`, `P606`, `P607`, `P608`, `P609`, `P610`, `P611`, `P612`, `P613`, `P614`, `P615`, `P616`, `P617`, `P618`, `P619`, `P620`, `P621`, `P622`, `P623`, `P624`, `P625`, `P626`, `P627`, `P628`, `P629`, `P630`, `P631`, `P632`, `P633`, `P634`, `P635`, `P636`, `P637`, `P638`, `P639`, `P640`, `P641`, `P642`, `P643`, `P644`, `P645`, `P646`, `P647`, `P648`, `P649`, `P650`, `P651`, `P652`, `P653`, `P654`, `P655`, `P656`, `P657`, `P658`, `P659`, `P660`, `P661`, `P662`, `P663`, `P664`, `P665`, `P666`, `P667`, `P668`, `P669`, `P670`, `P671`, `P672`, `P673`, `P674`, `P675`, `P676`, `P677`, `P678`, `P679`, `P680`, `P681`, `P682`, `P683`, `P684`, `P685`, `P686`, `P687`, `P688`, `P689`, `P690`, `P691`, `P692`, `P693`, `P694`, `P695`, `P696`, `P697`, `P698`, `P699`, `P700`, `P701`, `P702`, `P703`, `P704`, `P705`, `P706`, `P707`, `P708`, `P709`, `P710`, `P711`, `P712`, `P713`, `P714`, `P715`, `P716`, `P717`, `P718`, `P719`, `P720`, `P721`, `P722`, `P723`, `P724`, `P725`, `P726`, `P727`, `P728`, `P729`, `P730`, `P731`, `P732`, `P733`, `P734`, `P735`, `P736`, `P737`, `P738`, `P739`, `P740`, `P741`, `P742`, `P743`, `P744`, `P745`, `P746`, `P747`, `P748`, `P749`, `P750`, `P751`, `P752`, `P753`, `P754`, `P755`, `P756`, `P757`, `P758`

</details>
