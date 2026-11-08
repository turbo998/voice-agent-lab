# [兼容导航入口] Round 3 单专题指南索引：投机式只读语音检索 (`P719`) 与写状态工具 `turnEpoch` 世代围栏 (`P720`)

> **⚠️ 纯兼容导航说明（Compatibility Navigation Only）**：  
> 为严格遵循**“每篇文档只讲透 1 个独立架构决策主题”**的规范，原混合入口已完全拆分为以下 **2 篇独立的中英双语六段式 FAQ 指南**。本页面仅保留为历史旧链接与锚点的轻量跳转入口，不再重复承载正文、图表或评测表格。

---

## 📚 请直接访问拆分后的两篇独立单专题指南

### 1. 专题 3A（只读知识检索选型 · `P719`）
- **中文版**：[**《投机式语音 RAG（Speculative Voice RAG）与零死寂查库架构选型及原理解析 FAQ》** (`docs/speculative-voice-rag-faq.md`)](./speculative-voice-rag-faq.md)
- **English Edition**: [**Speculative Voice RAG & Zero-Dead-Air Read-Only Retrieval Architecture Selection FAQ** (`docs/speculative-voice-rag-faq.en.md`)](./speculative-voice-rag-faq.en.md)
- **单一决策边界**：聚焦**句尾串行语音 RAG vs. 投机式流式只读预检索（Speculative Voice RAG）**、语音微切片预算（`<= 120 Tokens/块`）与句尾提交前语义等价核验（`P719`，`cos >= 0.88`）。

### 2. 专题 3B（写状态异步工具取消与 Saga 回滚 · `P720`）
- **中文版**：[**《实时语音写状态工具调用世代围栏（`turnEpoch` Fence）与 Saga 冲正架构选型及原理解析 FAQ》** (`docs/voice-tool-epoch-fence-faq.md`)](./voice-tool-epoch-fence-faq.md)
- **English Edition**: [**Voice Agent State-Mutating Tool `turnEpoch` Fence, Idempotency & Saga Compensation Selection FAQ** (`docs/voice-tool-epoch-fence-faq.en.md`)](./voice-tool-epoch-fence-faq.en.md)
- **单一决策边界**：聚焦**同步阻塞写工具 vs. 异步单调递增 `turnEpoch` 世代写栅栏 + 幂等键 + Saga 逆向补偿回滚（`P720`）**，防止客户打断反悔后后台发生孤儿写入。

---

## 🔗 旧锚点兼容跳转（Legacy Anchor Redirects）

- <a id="p719"></a>**`#p719` / 只读投机预检索与句尾改口废止** ➔ 请跳转至 [`docs/speculative-voice-rag-faq.md`](./speculative-voice-rag-faq.md)
- <a id="p720"></a>**`#p720` / 写状态工具 `turnEpoch` 世代栅栏与 Saga 冲正** ➔ 请跳转至 [`docs/voice-tool-epoch-fence-faq.md`](./voice-tool-epoch-fence-faq.md)
- **配套可视化 SVG**：[`assets/svg/07-speculative-voice-rag-2026-11-08.svg`](../assets/svg/07-speculative-voice-rag-2026-11-08.svg)
- **English Compatibility Hub**: [`docs/speculative-voice-rag-zero-dead-air-faq.en.md`](./speculative-voice-rag-zero-dead-air-faq.en.md)

