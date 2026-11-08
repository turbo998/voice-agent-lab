# [Compatibility Navigation Hub] Round 3 Standalone Guide Index: Speculative Read-Only Voice RAG (`P719`) & State-Mutating Tool `turnEpoch` Fence (`P720`)

> **⚠️ Pure Compatibility Navigation Page**:  
> To strictly follow the **one architectural decision topic per standalone guide** rule, the original combined document has been split into the **2 standalone bilingual 6-part FAQ guides** listed below. This page is preserved solely as a lightweight navigation and anchor redirect hub without duplicating body text, diagrams, or quantitative tables.

---

## 📚 Direct Links to the Two Standalone Single-Topic Guides

### 1. Topic 3A (Read-Only Knowledge Retrieval Selection · `P719`)
- **English Edition**: [**Speculative Voice RAG & Zero-Dead-Air Read-Only Retrieval Architecture Selection FAQ** (`docs/speculative-voice-rag-faq.en.md`)](./speculative-voice-rag-faq.en.md)
- **中文版**：[**《投机式语音 RAG（Speculative Voice RAG）与零死寂查库架构选型及原理解析 FAQ》** (`docs/speculative-voice-rag-faq.md`)](./speculative-voice-rag-faq.md)
- **Single Decision Scope**: **Serial Post-EOU Voice RAG vs. Speculative Streaming Read-Only Voice RAG**, Voice Micro-Chunking (`<= 120 Tokens/chunk`), and Pre-Commit EOU Equivalence Verification (`P719`, `cos >= 0.88`).

### 2. Topic 3B (State-Mutating Async Tool Cancellation & Saga Rollback · `P720`)
- **English Edition**: [**Voice Agent State-Mutating Tool `turnEpoch` Fence, Idempotency & Saga Compensation Selection FAQ** (`docs/voice-tool-epoch-fence-faq.en.md`)](./voice-tool-epoch-fence-faq.en.md)
- **中文版**：[**《实时语音写状态工具调用世代围栏（`turnEpoch` Fence）与 Saga 冲正架构选型及原理解析 FAQ》** (`docs/voice-tool-epoch-fence-faq.md`)](./voice-tool-epoch-fence-faq.md)
- **Single Decision Scope**: **Synchronous Blocking Write Tools vs. Monotonic `turnEpoch` Write Fence + Idempotency Keys + Saga Compensating Rollback (`P720`)** on mid-call barge-in.

---

## 🔗 Legacy Anchor Redirects

- <a id="p719"></a>**`#p719` / Read-Only Speculative Prefetch & Late-Utterance Pivot Eviction** ➔ See [`docs/speculative-voice-rag-faq.en.md`](./speculative-voice-rag-faq.en.md)
- <a id="p720"></a>**`#p720` / State-Mutating `turnEpoch` Write Fence & Saga Compensation** ➔ See [`docs/voice-tool-epoch-fence-faq.en.md`](./voice-tool-epoch-fence-faq.en.md)
- **Visual Summary SVG**: [`assets/svg/07-speculative-voice-rag-2026-11-08.svg`](../assets/svg/07-speculative-voice-rag-2026-11-08.svg)
- **中文兼容导航页**：[`docs/speculative-voice-rag-zero-dead-air-faq.md`](./speculative-voice-rag-zero-dead-air-faq.md)

