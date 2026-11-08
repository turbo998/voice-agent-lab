# [Compatibility Navigation Hub] Round 6 Standalone Guide Index: Telephone Payment Edge `RFC 4733` DTMF Scope Demarcation (`P725`) & `SIPREC` Sensitive Audio Archival Redaction (`P726`)

> **⚠️ Pure Compatibility Navigation Notice**:  
> To strictly follow the **one standalone architectural decision topic per guide** standard—and to clearly separate **real-time upstream AI stream isolation during payment capture (`P725`)** from **delayed `SIPREC` archival recording redaction (`P726`)** as distinct, composable protection boundaries—this legacy entry has been split into **2 standalone bilingual 6-part FAQ guides**. This page serves solely as a lightweight redirect hub for legacy links and anchors and no longer duplicates body sections, diagrams, or benchmark tables (this repository's demo and offline policy checks are not a PCI-DSS / QSA compliance certification).

---

## 📚 Access the Two Standalone Single-Topic Guides

### 1. Topic 6A (Telephone Payment Capture Bypass & PCI-DSS Scope Demarcation · `P725`)
- **English Edition**: [**Enterprise Voice Agent Telephone Payment Capture Bypass & PCI-DSS Scope Demarcation FAQ** (`docs/voice-pci-dtmf-scope-faq.en.md`)](./voice-pci-dtmf-scope-faq.en.md)
- **中文版**：[**《企业语音智能体电话支付采集旁路与 PCI-DSS 范围界定架构选型 FAQ》** (`docs/voice-pci-dtmf-scope-faq.md`)](./voice-pci-dtmf-scope-faq.md)
- **Single Decision Boundary**: Focuses on **Edge SBC/Media-Gateway `RFC 4733` Out-of-Band DTMF Intercept + Upstream ASR/LLM Pause + Token Vault Bypass (`P725`)** aimed at reducing downstream LLM cardholder data exposure (`rawPanDigitsExposedToLlm = 0`). Clarifies that actual PCI-DSS scope and `SAQ-A` eligibility must be evaluated by the acquirer/QSA based on [PCI SSC Official Guidance on Accepting Telephone Payments Securely](https://blog.pcisecuritystandards.org/industry-guidance-on-accepting-telephone-payments-securely) and [PCI-DSS v4.0 SAQ-A Eligibility Criteria (`PCI-DSS-v4-0-SAQ-A.pdf`)](https://www.pcisecuritystandards.org/documents/PCI-DSS-v4-0-SAQ-A.pdf) (full outsourcing to PCI-validated TPSPs, demarcation points, merchant-controlled SBC scope, recording/failover paths), and that CVV/SAD must never be stored after authorization even if encrypted.

### 2. Topic 6B (`SIPREC` Delayed Ring-Buffer Audio Redaction & Fail-Closed Quarantine · `P726`)
- **English Edition**: [**Enterprise Voice Agent SIPREC Sensitive Audio Archival Redaction FAQ** (`docs/siprec-pii-audio-redaction-faq.en.md`)](./siprec-pii-audio-redaction-faq.en.md)
- **中文版**：[**《企业语音智能体合规双录（SIPREC）敏感音频归档脱敏架构选型 FAQ》** (`docs/siprec-pii-audio-redaction-faq.md`)](./siprec-pii-audio-redaction-faq.md)
- **Single Decision Boundary**: Focuses on **Dual-Stream `SIPREC` Lookahead RAM Ring-Buffer Redaction (`>= 600ms` synthetic policy budget) + Bidirectional Acoustic Padding (`>= 150ms` synthetic policy budget) + Fail-Closed Quarantine (`P726`)**. Clarifies that redacting the `SIPREC` recording fork never sanitizes the `0ms` real-time AI dialogue leg, and covers NER lag/miss fail-closed quarantine plus real-time LLM turn abort and volatile context purge when callers blurt out unprompted PAN digits.

---

## 🔗 Legacy Anchor Redirects

- <a id="p725"></a>**`#p725` / Edge `RFC 4733` DTMF Bypass & PCI Scope Demarcation** ➔ Redirect to [`docs/voice-pci-dtmf-scope-faq.en.md`](./voice-pci-dtmf-scope-faq.en.md)
- <a id="p726"></a>**`#p726` / `SIPREC` Delayed Ring-Buffer Redaction & Fail-Closed Quarantine** ➔ Redirect to [`docs/siprec-pii-audio-redaction-faq.en.md`](./siprec-pii-audio-redaction-faq.en.md)
- **Visual Architecture Summary SVG**: [`assets/svg/10-pci-dtmf-dual-stream-redaction-2026-11-08.svg`](../assets/svg/10-pci-dtmf-dual-stream-redaction-2026-11-08.svg)
- **中文兼容导航页**: [`docs/pci-dtmf-dual-stream-redaction-faq.md`](./pci-dtmf-dual-stream-redaction-faq.md)

