# Azure Speech 本地容器部署：联网白名单、计费与延迟评估指南

> **适用范围**：面向金融、保险、政企、医疗及智能制造等有严格内网边界要求的客户与合作伙伴，基于 Microsoft Learn 官方公开文档整理。

## 1. 核心架构结论速查

| 客户核心关切 | 架构师标准结论 |
| :--- | :--- |
| **本地容器部署还需要连接 Azure 吗？** | **标准联网版需要。** 语音识别（STT）与语音合成（TTS）推理 100% 在客户本地内网进行，但容器必须持续具备向 Azure 计量/计费端点（HTTPS/TCP 443）通信的能力。 |
| **音频和识别文本是否会因为计费上传到云端？** | **不会。** 官方明确说明计量上报仅发送容器版本、容器 ID、请求数量与 API 类型等用量元数据，**绝不上传客户待识别音频、合成文本或识别结果**。 |
| **能否通过防火墙域名白名单严格收敛出站？** | **可以。** 仅需放行出站 TCP 443 至官方指定的计量域名范围，无需开放任何入站公网端口。 |
| **如果机房是完全气隙隔离（Air-Gapped）怎么办？** | 申请 **Disconnected Containers（断开连接的离线容器）**，获批后购买对应的承诺用量计划（Commitment Tier）并导入离线许可证文件，不可将标准联网版直接断网充当离线版。 |
| **本地容器平均延迟是多少毫秒？** | **必须区分阶段指标，不存在单一“平均延迟”。** 应分别测量 STT 中间结果（`recognizing`）、STT 句尾最终结果（`recognized`）、TTS 首音频块到达（`SynthesisFirstByteLatencyMs`）与完整合成时间。 |

---

## 2. 防火墙域名白名单规范

建议将 **持续运行期所需连接** 与 **镜像安装/升级期所需连接** 分开审批：

| 阶段 | 出站目标 FQDN | 协议 / 端口 | 用途说明 |
| :--- | :--- | :---: | :--- |
| **持续运行期（必选）** | `*.cognitive.microsoft.com` | HTTPS / TCP 443 | Azure AI 容器计量与计费上报端点范围之一 |
| **持续运行期（必选）** | `*.cognitiveservices.azure.com` | HTTPS / TCP 443 | Azure AI 资源自定义子域名与计费端点范围之一 |
| **镜像拉取期（可选内网中转）** | `mcr.microsoft.com` | HTTPS / TCP 443 | Microsoft Container Registry 镜像元数据入口 |
| **镜像拉取期（可选内网中转）** | `*.data.mcr.microsoft.com` | HTTPS / TCP 443 | MCR 镜像数据层分发端点 |

### 容器启动关键参数示例

```text
Billing=https://<your-region>.api.cognitive.microsoft.com/
ApiKey=<your-speech-resource-key-injected-via-secret-store>
Eula=accept
```

- **安全边界提醒**：
  1. **出站单向通信**：无需为 Azure 计费向公网开放本地容器的 `5000` 端口。
  2. **禁用 TLS 深度包检测（DPI）篡改**：企业出口防火墙若对容器到 Microsoft 计量端点的 TLS 通道进行证书替换解密，会导致计量握手失败；需为上述 FQDN 配置 TLS 直通例外。
  3. **計费周期与断网容忍度**：标准容器约每 **10～15 分钟** 上报一次用量；若连续 10 个周期无法连接计费端点，容器将拒绝后续业务调用直至计费网络恢复。
  4. **防止 SDK 误调云端**：客户端 Speech SDK 必须显式指定本地容器 `host`（如 `ws://<internal-host>:5000` 或内网 WSS 网关），切勿继续使用 `fromSubscription(key, region)` 初始化，否则流量仍会发往公网云端。

---

## 3. STT 与 TTS 延迟科学评估口径

### 3.1 语音转文字（STT）关键延迟分解

1. **中间识别结果延迟（Interim `recognizing`）**：用户开口说话到收到增量文字流的时间，通常在百毫秒级，可用于前端实时字幕展示与投机意图预判。
2. **句尾最终结果延迟（Final `recognized`）**：包含 **静音分段判定时间（`Speech_SegmentationSilenceTimeoutMs`）+ 剩余解码时间 + 网络传输**。
   - 官方默认静音分段阈值典型值为 **500ms**（可调范围 `100ms–5,000ms`）。
   - 在 Voice Agent 强交互场景下，可将静音分段调优至 `250ms–350ms` 或结合语义断句（Semantic Endpointing），避免客户停顿思考时被过早截断。

### 3.2 文字转语音（TTS）关键指标与硬件选型

使用 Azure Speech SDK 内置遥测属性精确采集：
- `SpeechServiceResponse_SynthesisFirstByteLatencyMs`：客户端收到首帧音频块延迟（含网络）—— **决定用户体感响应速度的核心指标**。
- `SpeechServiceResponse_SynthesisServiceLatencyMs`：服务端合成首帧音频块耗时。
- `SpeechServiceResponse_SynthesisFinishLatencyMs`：完整音频合成耗时。

| 容器类型 | 推荐起步硬件规格 | 性能与并发调优准则 |
| :--- | :--- | :--- |
| **Speech to Text (STT)** | 8 vCPU + 8 GB RAM（另预留 4–8 GB 模型内存） | 要求 x64 AVX2 指令集、主频 $\ge 2.6\text{ GHz}$；启动后执行预热请求消除首次模型加载冷启动 |
| **Neural TTS (NTTS)** | 8 vCPU + 16～24 GB RAM | 单并发下合成速度可达约 **10x 实时速度**；并发升至 5 时降至约 **3x 实时速度**。高并发场景应采用多容器实例水平扩展，而非单容器堆叠并发 |
