# [兼容导航入口] Round 6 单专题指南索引：电话支付边缘 `RFC 4733` DTMF 旁路范围界定 (`P725`) 与 `SIPREC` 敏感音频归档脱敏 (`P726`)

> **⚠️ 纯兼容导航说明（Compatibility Navigation Only）**：  
> 为严格遵循**“每篇文档只讲透 1 个独立架构决策主题”**的规范，并明确区分**“采集侧实时 AI 流隔离（`P725`）”**与**“归档侧 `SIPREC` 录音延迟消音（`P726`）”**两条正交、可叠加的保护边界，原混合入口已完全拆分为以下 **2 篇独立的中英双语六段式 FAQ 指南**。本页面仅保留为历史旧链接与锚点的轻量跳转入口，不再重复承载正文、图表或评测表格（本仓库演示与离线策略检查不构成 PCI-DSS / QSA 合规认证）。

---

## 📚 请直接访问拆分后的两篇独立单专题指南

### 1. 专题 6A（电话支付按键旁路与 PCI-DSS 范围分界评估 · `P725`）
- **中文版**：[**《企业语音智能体电话支付采集旁路与 PCI-DSS 范围界定架构选型 FAQ》** (`docs/voice-pci-dtmf-scope-faq.md`)](./voice-pci-dtmf-scope-faq.md)
- **English Edition**: [**Enterprise Voice Agent Telephone Payment Capture Bypass & PCI-DSS Scope Demarcation FAQ** (`docs/voice-pci-dtmf-scope-faq.en.md`)](./voice-pci-dtmf-scope-faq.en.md)
- **单一决策边界**：聚焦**边缘 SBC/媒体网关 `RFC 4733` 带外 DTMF 截流 + 支付窗口暂停 ASR/LLM 上行音频 + Token Vault 旁路（`P725`）**，目标是减少下游 LLM 暴露面（`rawPanDigitsExposedToLlm = 0`）；明确实际 PCI-DSS 范围与 `SAQ-A` 资格须由收单方/QSA 依据 [PCI SSC 官方电话支付安全指南](https://blog.pcisecuritystandards.org/industry-guidance-on-accepting-telephone-payments-securely) 与 [PCI-DSS v4.0 SAQ-A 官方资格文件](https://www.pcisecuritystandards.org/documents/PCI-DSS-v4-0-SAQ-A.pdf)（完整外包给经认证 TPSP、分界点 Demarcation Points、商户自控 SBC 范围、录音与异常旁路）核定，且授权后严禁以任何形式存储 CVV/SAD（即使加密也违规）。

### 2. 专题 6B（合规双录 `SIPREC` 延迟环形缓冲消音与 Fail-Closed 隔离 · `P726`）
- **中文版**：[**《企业语音智能体合规双录（SIPREC）敏感音频归档脱敏架构选型 FAQ》** (`docs/siprec-pii-audio-redaction-faq.md`)](./siprec-pii-audio-redaction-faq.md)
- **English Edition**: [**Enterprise Voice Agent SIPREC Sensitive Audio Archival Redaction FAQ** (`docs/siprec-pii-audio-redaction-faq.en.md`)](./siprec-pii-audio-redaction-faq.en.md)
- **单一决策边界**：聚焦**双流分叉下 `SIPREC` 录音支路的内存延迟环形缓冲（`>= 600ms` 合成策略预算）+ 双向声学安全垫（`>= 150ms` 合成策略预算）+ Fail-Closed 加密隔离重扫（`P726`）**；明确仅消音 `SIPREC` 录音不会净化 `0ms` 实时 AI 对话流，涵盖 NER 识别迟到/漏检与客户抢跑口述 PAN 的实时流 Abort 及上下文清洗兜底。

---

## 🔗 旧锚点兼容跳转（Legacy Anchor Redirects）

- <a id="p725"></a>**`#p725` / 边缘 `RFC 4733` DTMF 旁路与 PCI 范围分界评估** ➔ 请跳转至 [`docs/voice-pci-dtmf-scope-faq.md`](./voice-pci-dtmf-scope-faq.md)
- <a id="p726"></a>**`#p726` / `SIPREC` 延迟环形缓冲消音与 Fail-Closed 归档** ➔ 请跳转至 [`docs/siprec-pii-audio-redaction-faq.md`](./siprec-pii-audio-redaction-faq.md)
- **配套可视化 SVG**：[`assets/svg/10-pci-dtmf-dual-stream-redaction-2026-11-08.svg`](../assets/svg/10-pci-dtmf-dual-stream-redaction-2026-11-08.svg)
- **English Compatibility Hub**: [`docs/pci-dtmf-dual-stream-redaction-faq.en.md`](./pci-dtmf-dual-stream-redaction-faq.en.md)

