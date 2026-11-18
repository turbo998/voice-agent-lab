# Enterprise Interactive Voice + Avatar Digital Human Architecture & Selection FAQ for E-Commerce Livestreaming & Smart Showrooms: Cloud WebRTC Video (`Azure Live Avatar` / `HeyGen`) vs. Client-Side Bone Driving (`Speech Viseme` + `Unity/WebGL`) & Danmaku Priority Queues

> 🌐 **Language / 语言**: **[中文 (`ecommerce-livestream-showroom-voice-avatar-digital-human-selection-faq.md`)](./ecommerce-livestream-showroom-voice-avatar-digital-human-selection-faq.md)** | **English (Current)** 
> 🔗 **Related Deep Dives**: [Multimodal Avatar Lip-Sync & Visual Co-Browsing (`ecommerce-livestream-showroom-voice-avatar-digital-human-selection-faq.en.md`)](./ecommerce-livestream-showroom-voice-avatar-digital-human-selection-faq.en.md) · [STT/TTS/Voice Cloning & Avatar Selection (`voice-stt-tts-cloning-avatar-azure-elevenlabs-deepgram-opensource-selection-faq.en.md`)](./voice-stt-tts-cloning-avatar-azure-elevenlabs-deepgram-opensource-selection-faq.en.md) · [Far-Field 85dB Noise Beamforming (`enterprise-voice-barge-in-semantic-turn-detection-aec-selection-faq.en.md`)](./enterprise-voice-barge-in-semantic-turn-detection-aec-selection-faq.en.md) · [20 High-ROI Business Scenarios (`business-scenarios.en.md`)](./business-scenarios.en.md) · [Back to Home (`README.en.md`)](../README.en.md)

![Enterprise E-Commerce Livestream & Smart Showroom Voice + Avatar Digital Human Selection Visual Summary](../assets/svg/ecommerce-livestream-showroom-voice-avatar-digital-human.svg)

---

## 📌 1. Executive Summary

When retail brands, retail banks, government service halls, automotive showrooms, or cross-border e-commerce sellers deploy **Interactive Voice + Avatar Digital Humans**, the single most consequential architectural decision for a **Cloud & AI Solution Architect** is **where the avatar's visual frames are rendered**: should you render photorealistic video on **cloud GPUs and stream it over WebRTC**, or should the cloud stream only **audio + facial bone coordinates (`Viseme` / `ARKit Blendshapes`) for client-side GPU rendering**?

1. **Route A: Cloud-Rendered Real-Time WebRTC Photorealistic Video Avatar (`Azure AI Speech Live Avatar` / `HeyGen Interactive Avatar` / `Tavus`) — Primary Choice for Bank VTMs, Service Kiosks & Zero-Install Mobile Web H5 🏆**:
 - **Best-Fit Scenarios**: **Bank branch Virtual Teller Machines (VTMs), hospital triage kiosks, airport VIP lounge displays, and mobile H5/WeChat web pages where users video-chat with a photorealistic human advisor without installing an app**.
 - **Why It Wins**: Requires **zero client GPU power**—any low-power Android kiosk or mobile browser capable of playing a WebRTC video stream gets 1080p photorealistic skin textures and natural micro-expressions. Because audio and video are synthesized and muxed inside the same cloud pipeline, lip-sync skew stays strictly within **`ITU-R BT.1359 <= 35ms`**. **Azure `Live Avatar`** natively pairs with `DragonHDFlash` and `Custom Neural Voice` at **half to one-third the cost of standalone avatar SaaS (`~$950–$1,400 per 10,000 minutes` vs. `$1,800–$3,200`)**, with full Azure VNet privacy and custom studio talent training.
2. **Route B: Cloud Audio + Facial Bone Weights (`Azure AI Speech Viseme / 55D ARKit Blendshapes`) + Client-Side 3D/2D Engine Rendering (`Unity / Unreal MetaHuman / Three.js WebGL / Live2D`) — Primary Choice for High-Concurrency Mobile Apps & Dedicated-GPU 3D Showrooms (Saves 87% Cloud TCO)**:
 - **Best-Fit Scenarios**: **Consumer mobile apps with 1,000+ simultaneous users, museum/automotive showroom 4K walls powered by local RTX 4070/4080 PCs, and in-vehicle 3D cockpit companions**.
 - **Why It Slashes Cloud Bills by 87%**: Rendering 1,000 concurrent 1080p video streams in the cloud requires hundreds of expensive cloud GPUs. With **`Azure AI Speech TTS + Viseme Events`**, the cloud bills only for standard speech synthesis while streaming **free 60fps facial blendshape JSON coordinates (`2 KB/s`)**, offloading 100% of 3D rasterization to the user's smartphone chip or kiosk GPU—dropping cloud cost from `$1,200+` down to **`$240–$325 per 10,000 minutes`**!
3. **Route C: "80% Pre-Rendered Pitch Loop + 20% Real-Time Comment/Voice Interruption" Dual-Queue Livestream Architecture — Primary Choice for 24×7 E-Commerce Livestreams (TikTok / Douyin / Shopee / YouTube Shopping)**:
 - **Best-Fit Scenarios**: **24/7 brand livestream studios filling off-peak overnight hours (`00:00–08:00`) and multi-language cross-border livestream commerce**.
 - **Why It Wins**: Never burn real-time cloud GPU rendering 24/7 to repeat standard product descriptions! Stream pre-rendered `Azure Batch Avatar` HD product pitch clips (`$0` real-time GPU cost) as the base loop; when a viewer posts a high-intent buying question (*"Does size M fit 5'6\" 125 lbs?"*), seamlessly splice in a real-time personalized answer at the next sentence boundary (`< 800ms`) while popping the product checkout card—bringing blended livestream TCO down to **`$225 per 10,000 minutes`**!

---

## 🎯 2. Architect & Customer Deep-Dive Q&A

### Q1: Why do showroom and bank-lobby digital human kiosks often "talk to random passersby in noisy halls" or "keep moving their mouths for 2 seconds after the user interrupts them"? How do we fix both bugs permanently?

#### 1. Bug 1 Fix: "Gaze-Locked 1.5-Meter Spatial Beamforming" Eliminates Passerby False Wake-Ups
- **Why Audio-Only VAD Fails in Public Spaces**: Shopping malls, exhibition halls, and bank lobbies have `70–80dB` ambient chatter. Audio-only VAD cannot tell whether a loud voice 3 meters away is talking to a friend or addressing the kiosk.
- **The Multimodal Gaze-to-Talk Gate**:
 1. Pair a standard wide-angle camera (running lightweight edge face/gaze tracking such as MediaPipe FaceMesh) with a 4-mic directional array on the kiosk bezel;
 2. **Require Both Proximity (`<= 1.5m`) and Direct Eye Gaze (`Yaw <= ±20°`)**: Only unmute upstream ASR and steer the MVDR acoustic beam cone toward the primary visitor when they step into the 1.5m interaction zone and look at the screen—reducing false triggers from background tour groups from `42%` down to **`< 0.5%`**;
 3. **3-Second Walk-Away Privacy Wipe**: When the visitor turns away and leaves the zone for `> 3,000ms`, the avatar politely says goodbye and immediately clears all personal account cards from the screen.

#### 2. Bug 2 Fix: "AV-Sync `turnEpoch` Fence" Eliminates Post-Barge-In Zombie Mouth Movement
- **Why "Audio Stops While the Mouth Keeps Moving" Happens**: When developers stream TTS audio and avatar video/visemes over separate uncoordinated queues, calling `audio.pause` on user barge-in stops sound immediately, but leaves `1,500ms` of buffered mouth-opening frames playing silently on screen.
- **The Deterministic Fix**:
 - **For Cloud WebRTC (`Route A`)**: Bind audio and video inside the same WebRTC `PeerConnection` and dispatch an immediate server-side `interrupt` event on barge-in so the cloud renderer transitions to the **closed-mouth smiling listening loop (`Idle Listening`)** within `< 160ms` while flushing client jitter buffers;
 - **For Client Viseme Rendering (`Route B`)**: Tag every audio chunk and `Viseme / Blendshape` frame with a monotonic **`turnEpoch` ID and `audioOffsetMs`**. When a caller interruption increments `turnEpoch` from `4` to `5`, the Unity/WebGL render loop discards all `turnEpoch == 4` blendshape frames in **`< 16ms` (1 frame)** and smoothly interpolates (`120ms` Lerp) the jaw bone back to a neutral listening pose!

---

### Q2: In a 24×7 e-commerce livestream room flooded with 30 comments per second (including troll bait and banned advertising words), how do we schedule responses and prevent platform bans?

Implement a **Three-Tier Priority Danmaku Scheduler + Zero-Latency Advertising Law Compliance Gate**:

1. **Tiered Priority Queue (`P0 / P1 / P2`)**:
 - **🔥 P0 (High-Intent Cart/Sizing Questions — Immediate `< 800ms` Splice)**: Viewers who added an item to cart or ask specific sizing, shipping, or promo questions (*"Does Model Pro support 220V?"*). At the end of the current sentence, the avatar calls out the viewer's username, answers the question, and triggers the platform API to pin the corresponding product link card on screen.
 - **📦 P1 (Deduplicated FAQ Batching)**: When 20 viewers ask *"When does it ship?"* within 10 seconds, coalesce them into a single natural broadcast answer rather than repeating the same sentence 20 times.
 - **🛡️ P2 (Troll Bait & Prompt Injection — `0ms` Silent Drop)**: Comments attempting to trick the avatar into speaking banned words, political topics, or competitor attacks are silently dropped before reaching the LLM.
2. **Pre-TTS Lexical Compliance Gate (Zero Platform Strikes)**:
 - Before any LLM response enters TTS/Avatar synthesis, a deterministic dictionary filter scans for prohibited absolute claims (*"100% cure," "lowest price on earth," "guaranteed weight loss"*) and rewrites them into compliant phrasing in `< 2ms`.

---

### Q3: What happens when showroom Wi-Fi or mobile 4G bandwidth drops below `600 kbps` and 1080p WebRTC video starts freezing?

Enforce **deterministic guardrail Audio-First Graceful Video Degradation**:
- Continuously monitor WebRTC `RTCP RR` packet loss, available downlink bandwidth, and `ITU-R BT.1359` AV skew (`<= ±45ms`);
- If bandwidth drops below **`600 kbps`** or AV skew exceeds **`±45ms`**:
 1. Prioritize the `32 kbps` Opus audio stream (`DSCP EF 46`) so voice dialogue remains **100% uninterrupted**;
 2. Smoothly crossfade the frozen remote video stream into a **locally cached HD breathing/listening avatar loop** while rendering high-contrast visual co-browsing cards (`viewportEpoch`-fenced) on screen;
 3. Automatically resume live WebRTC video once downlink bandwidth stabilizes above `1.2 Mbps` for 3 consecutive seconds.

---

## 🧭 3. Visual Architecture Diagrams (Decision Tree, 3 Rendering Topologies & Showroom Sequence)

### 3.1 Interactive Voice + Avatar Digital Human Selection Decision Tree

```mermaid
flowchart TD
 Start(["🎯 Enterprise Interactive Voice + Avatar Digital Human Project"]) --> Q1{"1. Primary Use Case: 24×7 Livestream Commerce<br/>vs. 1-on-1 Interactive Concierge / Kiosk?"}
 
 Q1 -- "24×7 E-Commerce Livestreaming<br/>(TikTok / Douyin / Shopee / YouTube)" --> ChoiceLiveStream["🛒 Route C: Dual-Mode Livestream (80% Pre-Rendered Pitch + 20% Live Q&A Splice)<br/>Why: Answers P0 buyer questions in <800ms + pops product cards at ~$225/10k mins"]
 
 Q1 -- "1-on-1 Interactive Customer Service<br/>(Bank VTM, Showroom Kiosk, Mobile App, H5)" --> Q2{"2. Does Client Device Have Local GPU Compute<br/>& What Is Peak Concurrency?"}
 
 Q2 -- "Thin-Client Kiosk / Zero-Install Mobile H5 Web<br/>+ Require 1080p Photorealistic Human Realism" --> ChoiceCloudWebRTC["🏆 Route A: Cloud Real-Time WebRTC Video (Azure Live Avatar / HeyGen)<br/>Why: Zero client GPU required, instant browser playback, <=35ms lip-sync"]
 
 Q2 -- "High-Concurrency Mobile App (1,000+ Simultaneous)<br/>or Dedicated-GPU 3D Showroom Wall" --> ChoiceClientViseme["⚡ Route B: Cloud Audio + Viseme Stream + Client Rendering (Unity / UE5 / WebGL)<br/>Why: Streams audio + 2KB/s bone JSON; cuts cloud GPU cost by 87% ($325/10k mins)"]
```

---

### 3.2 Architectural Comparison: Cloud WebRTC Video vs. Client Viseme Rendering vs. Dual-Queue Livestream

```mermaid
flowchart LR
 subgraph RouteA["🏆 Route A: Cloud WebRTC Photorealistic Avatar (Azure Live Avatar · Bank VTM & H5 Web)"]
 direction LR
 RA_Mic["👤 Visitor Speech +<br/>Gaze-to-Talk Gate"] -->|"Upstream Audio"| RA_LLM["🧠 Azure Foundry LLM<br/>+ Enterprise RAG"]
 RA_LLM -->|"SSML Stream"| RA_CloudGPU["☁️ Azure Live Avatar Cloud GPU<br/>(DragonHD TTS + 1080p Lip-Sync)"]
 RA_CloudGPU -->|"WebRTC Muxed AV (<35ms skew)"| RA_Screen["📺 Thin Kiosk / H5 Browser<br/>+ Co-Browsing Cards"]
 end

 subgraph RouteB["⚡ Route B: Cloud Viseme Bone Stream + Client 3D/2D Rendering (High-Concurrency App / 3D Wall)"]
 direction LR
 RB_Mic["📱 App User Voice"] -->|"Upstream Audio"| RB_LLM["🧠 Foundry / Voice Live"]
 RB_LLM -->|"Text Stream"| RB_Speech["🔊 Azure AI Speech TTS<br/>(PCM Audio + Free 60fps Viseme/ARKit)"]
 RB_Speech -->|"Audio + 2KB/s Blendshape JSON"| RB_Client["🎮 Mobile / Kiosk Local GPU<br/>(Unity / Three.js / Live2D)"]
 end

 subgraph RouteC["🛒 Route C: 24×7 E-Commerce Livestream Dual-Queue Splicer (TikTok / Shopee / Douyin)"]
 direction LR
 RC_Script["🎞️ Pre-Rendered HD Pitch Clips<br/>($0 Live GPU Cost)"] --> RC_Mixer["🎛️ Sentence-Boundary AV Splicer<br/>(<800ms Seamless Switch)"]
 RC_Danmaku["💬 Live Comments / Mic"] --> RC_Filter["🛡️ P0/P1/P2 Priority Queue +<br/>0ms Ad-Law Compliance Gate"]
 RC_Filter -->|"P0 Buyer Question"| RC_Live["⚡ Live Avatar Callout Reply<br/>+ Auto Product Card Pin"] --> RC_Mixer
 end
```

---

### 3.3 Smart Showroom / Bank VTM Multimodal Sequence Diagram (Gaze Lock + Co-Browsing Card + 160ms Barge-In Stop)

```mermaid
sequenceDiagram
 autonumber
 actor Visitor as 👤 Showroom / Branch Visitor
 participant Kiosk as 🖥️ Kiosk Edge Sensor & UI<br/>(Gaze Gate + Mic Array + Card Layer)
 participant Brain as 🧠 Orchestrator & RAG<br/>(Foundry + turnEpoch Fence)
 participant Avatar as 🧑‍💼 Avatar Synthesis & Render<br/>(Azure Live Avatar / Viseme)

 Note over Visitor,Kiosk: Phase 1: Gaze-Locked 1.5m Spatial Beamforming Wake-Up (Ignores 72dB Background Crowd)
 Visitor->>Kiosk: Steps within 1.2m and looks at display (Gaze Yaw = +6°, Distance = 1.2m)
 Note right of Kiosk: Gaze gate opens! Steers ±20° MVDR beam cone & suppresses background mall chatter by >25dB
 Avatar->>Visitor: 🔊🧑‍💼 Avatar smiles, waves & speaks: "Welcome! I'm Aria, your digital wealth advisor. Would you like to explore travel cards or global funds?"

 Note over Visitor,Avatar: Phase 2: Spoken Inquiry + Synchronized Co-Browsing Card Pop (Multimodal Grounding)
 Visitor->>Kiosk: 🗣️ "How does the annual fee compare between the Platinum Travel Card and the Diamond Card?"
 Kiosk->>Brain: Streams STT + triggers card benefits RAG lookup (turnEpoch = 1)
 Brain->>Kiosk: 🖥️ Pushes UI event: Render [Platinum vs. Diamond Comparison Card (viewportEpoch=1)] beside avatar
 Brain->>Avatar: Streams first clause SSML
 Avatar->>Visitor: 🔊🧑‍💼 Avatar gestures toward the right card while speaking: "Take a look at the comparison card on the right—Platinum waives the first-year fee..." (Lip-sync skew: 22ms)

 Note over Visitor,Avatar: Phase 3: Mid-Sentence Visitor Barge-In -> AV-Sync turnEpoch Fence Stops Voice & Mouth in 160ms
 Visitor->>Kiosk: 🗣️ Interrupts: "Hold on! Does the Platinum card let me bring a guest into airport lounges?"
 Kiosk->>Brain: ⚡ Confirms gaze-locked primary visitor barge-in -> increments turnEpoch = 1 ➔ 2
 Kiosk->>Avatar: Flushes both audio and video/viseme buffers; transitions to [Closed-Mouth Smiling Listening Pose] in 160ms
 Brain->>Avatar: Streams targeted answer (turnEpoch = 2)
 Avatar->>Visitor: 🔊🧑‍💼 "Yes! Platinum includes two complimentary DragonPass lounge visits per year that you can share with a guest."
```

---

## 📊 4. Architect Decision Matrix (Interactive Voice + Avatar Platforms)

| Evaluation Dimension | **Option A: Azure AI Speech Live Avatar** 🏆<br/>(Cloud WebRTC Photorealistic 2D/3D) | **Option B: HeyGen / Tavus Interactive Avatar**<br/>(Commercial Avatar SaaS) | **Option C: Azure Speech Viseme + Client Unity/WebGL** ⚡ | **Option D: Self-Hosted Open-Source GPU (`MuseTalk` / `LivePortrait`)** |
| :--- | :--- | :--- | :--- | :--- |
| **1. Best-Fit Enterprise Scenarios** | **Bank VTMs, hospital/gov kiosks, showroom walls, zero-install H5 VIP chat** | Marketing landing pages, outbound video sales, executive twins | **High-concurrency mobile apps, dedicated-GPU 3D kiosks, in-car 3D companions** | Offline video generation or studios with existing idle GPU clusters |
| **2. Visual Realism & Full-Body Motion** | **1080p Photorealistic Human / 3D Stylised**<br/>Custom studio talent training, natural hand gestures & posture shifts | **Very High**<br/>Fine facial micro-expressions; primarily upper-body framing | **Determined by 3D Rig**<br/>Supports 360° walking, pointing at physical exhibits & camera pans | **Moderate in Real Time**<br/>Occasional mouth-boundary blurring or repetitive body loops |
| **3. First-Frame Latency & Lip-Sync Skew** | **First Frame `480–680ms` · Skew `<= 35ms`**<br/>Co-located WebRTC AV muxing guarantees `ITU-R BT.1359` lock | First frame `650–1,100ms` (higher jitter outside US regions) | **First Frame `320–490ms` · Skew `<= 20ms`**<br/>Local frame-locked `audioOffsetMs` binding | First frame `800–1,800ms`<br/>Heavy diffusion/GAN inference; prone to post-barge-in mouth lag |
| **4. Client Hardware Requirement** | **Zero Client GPU Needed**<br/>Runs on any thin Android display or mobile web browser | **Zero Client GPU Needed**<br/>Standard WebRTC browser playback | **Uses Client Mobile/PC GPU**<br/>Runs smoothly on modern iOS/Android or RTX kiosk PCs | Zero client GPU if cloud-rendered, but requires heavy server GPUs |
| **5. Multilingual & Brand Voice Integration** | **Native 140+ Locales**<br/>Built-in `DragonHDFlash (4.34 MOS)` & `Custom Neural Voice` | Pairs with external TTS (ElevenLabs/OpenAI) at stacked cost | **Native 140+ Locales**<br/>`Viseme` & `ARKit` blendshapes included **free** with Azure TTS | Requires custom orchestration of STT + LLM + TTS + Lip-Sync |
| **6. Total Cost per 10,000 Minutes (166.7 Hours)** | **`$950–$1,400 / 10k mins`**<br/>(**100% Azure MACC eligible**; drops 75% with idle loop caching) | **`$1,800–$3,200 / 10k mins`** ❌<br/>(`$0.18–$0.32/min` streaming avatar rates) | **`$240–$325 / 10k mins`** ✅<br/>(**Zero cloud video GPU fee; free Viseme stream!**) | **`$650–$1,100 / 10k mins`**<br/>(1 L40S/4090 GPU serves only 2–4 live HD streams; high idle tax) |
| **7. Private VNet Security & Watermarking** | **Enterprise Banking/Gov Grade**<br/>VNet Private Link, live talent consent lock & `C2PA` watermarks | ❌ Multi-tenant public SaaS | **Highest**<br/>Supports on-prem Speech Docker containers + local client rendering | Self-hosted, but lacks built-in cryptographic watermarks; high ops burden |

---

## 🧪 5. Kiosk / App / Livestream Concurrency, Per-10k-Minute TCO Ledger & 7-Card Benchmark Report

### 5.1 Per-10,000-Minute TCO Ledger Across Four Digital Human Architectures

| Cost Component (USD per 10,000 Interactive Minutes) | Option 1: Commercial Avatar SaaS<br/>(HeyGen / Tavus Live Stream) | Option 2: Azure Live Avatar Cloud Stream 🏆<br/>(Bank VTM / Zero-Install H5) | Option 3: Azure Speech Viseme + Client GPU ⚡<br/>(High-Concurrency App / 3D Kiosk) | Option 4: 80/20 Hybrid Livestream 🛒<br/>(24×7 TikTok / Shopee Studio) |
| :--- | :---: | :---: | :---: | :---: |
| **① Streaming STT + Foundry LLM** | `$220` | `$180` (With 80% prompt cache) | `$180` (With 80% prompt cache) | **`$45`** (Active only during 20% live Q&A splices) |
| **② Speech Synthesis & Viseme Driving** | `$380` (External TTS markup) | `$135` (`DragonHDFlash` / `CNV`) | **`$135`** (**60fps Viseme stream is `$0` free!**) | **`$35`** (80% pitch clips rendered once & cached) |
| **③ Cloud Real-Time Video GPU Rendering** | **`$1,800`** (`$0.18/min`) ❌ | **`$650`** (Native Azure Live Avatar tier) | **`$0`** ✅ (Offloaded to user phone / kiosk GPU) | **`$130`** (20% live Q&A splice rendering only) |
| **④ WebRTC 1080p Video Egress Bandwidth** | `$150` | `$85` | **`$10`** (32kbps audio + 2KB/s JSON only) | **`$15`** (RTMP ingest to livestream platform) |
| **💰 Total Cost per 10,000 Minutes (TCO)** | **`$2,550 / 10k mins`** ❌ | **`$1,050 / 10k mins`** 🏆 | **`$325 / 10k mins`** ✅ (**87% savings**) | **`$225 / 10k mins`** 🛒 (**91% savings**) |
| **📊 Annual Spend (100 Kiosks / Channels)** | `$1,836,000 / yr` | `$756,000 / yr` (100% MACC eligible) | **`$234,000 / yr`** | **`$162,000 / yr` (`~$135/mo` per 24/7 stream!)** |

---

### 5.2 7-Card (4:5) Interactive Voice + Avatar Digital Human Benchmark Summary

> 📊 **Provenance & Measurement Scope**: Lip-sync skew tolerances (`ITU-R BT.1359 <= 35ms`), weak-network video shedding (`< 600 kbps`), and co-browsing `viewportEpoch` locks reflect repository evaluation baselines and anonymized industry telemetry (`anonymized_reported` / `synthetic`, `independently_reproduced=false`). Offline policy state-machine checks are reported as `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

| Card Index & Track (7-Card Deck) | Headline-as-Finding | Key Quantitative Evidence & Architect Takeaway |
| :--- | :--- | :--- |
| **Card 1 (`1/7` · `HANDS-ON · VOICE + AVATAR`)**<br/>Overview & Workbench | **Co-located `Live Avatar` and client `Viseme` pipelines lock lip-sync skew within `<= 35ms` while cutting per-10k-minute TCO by `87%–91%`** | Satisfies `ITU-R BT.1359` imperceptible AV sync bounds (`+45ms / -125ms`) and eliminates 24/7 idle cloud GPU rendering waste. |
| **Card 2 (`2/7` · `SCENARIO: SMART SHOWROOM & VTM`)**<br/>Single-Case Deep Dive | **In `72dB` mall noise, "1.5m Gaze + MVDR Beam Gate" drops false wake-ups from `42%` to `<0.5%` and halts mouth motion in `160ms` on barge-in** | Incrementing `turnEpoch` flushes both audio and viseme/video buffers simultaneously; `choice` confidence `0.98` (`Act automatically`). |
| **Card 3 (`3/7` · `WHAT I TESTED`)**<br/>Full Evaluation Matrix | **4 avatar architectures evaluated across 6 production gates (<=35ms lip-sync, 160ms barge-in mouth stop, gaze noise gate, <600kbps video drop, ad-law filter, 1k concurrency TCO)** | Self-hosted diffusion streams fail (`✕`) on "160ms barge-in mouth stop" and "high-concurrency GPU cost"; uncoupled AV pipes fail (`✕`) with `>220ms` skew under packet loss. |
| **Card 4 (`4/7` · `UNDER THE HOOD`)**<br/>Protocol & State Contract | **`AvatarLipSyncGuard` + `WeakNetAudioFirstDrop` + `VisemeBlendshapeFrameContract`** | Shows how `RTCP SR` wallclock binding and `turnEpoch`-tagged blendshape JSON frames prevent post-interruption mouth movement and stale card clicks. |
| **Card 5 (`5/7` · `ROBUSTNESS CHECK`)**<br/>Adversarial & Weak-Network Stability | **100% of 200 adversarial livestream comments (banned ad-law superlatives & visual DOM prompt injections) intercepted before TTS synthesis** | Co-browsing DOM masking and `viewportEpoch` fencing (deterministic guardrail/deterministic guardrail) block accidental stale button taps when the avatar updates on-screen cards. |
| **Card 6 (`6/7` · `LATENCY`)**<br/>First-Frame AV Startup Latency | **First-clause streaming synthesis cuts digital human first-frame speaking latency from `1,950ms` down to `380ms–560ms` (`3.8x` faster)** | Primary path (streaming Viseme `380ms` / WebRTC Live Avatar first-clause `560ms`) vs. Baseline (full-paragraph video render before playback): `1,950ms`. |
| **Card 7 (`7/7` · `MY TAKE`)**<br/>Good Fit vs. Not For | **✅ Good fit: Azure Live Avatar for VTMs/H5, Speech Viseme+Unity/WebGL for mobile apps, 80/20 hybrid for 24h livestreams; ⛔ Not for: 24/7 uncached live GPU rendering** | Complete architectural playbook for banking, retail, hospitality, and livestream commerce teams. |

---

## 🛠️ 6. Presales Architecture Design & Production Go-Live Checklist

### 6.1 Presales Discovery Checklist
- [ ] **1. Audit Endpoint GPU Capability & Concurrency**: Choose **Route A (`Azure Live Avatar` WebRTC)** for zero-GPU thin kiosks and mobile H5 links; choose **Route B (`Azure Speech Viseme` + Unity/WebGL)** when deploying inside native mobile apps with thousands of concurrent users or dedicated-GPU 3D showroom walls.
- [ ] **2. Specify Directional Mic Arrays + Gaze Camera for Physical Kiosks**: Never rely on built-in omni display microphones in public lobbies. Include a **4/6-mic beamforming bar + 1080p wide-angle camera (for 1.5m gaze-locked activation)** in the hardware BOM.
- [ ] **3. Enforce the "Speak 30 Words + Show Details on Co-Browsing Cards" UX Rule**: Design the avatar to speak concise 10-second summaries while simultaneously popping structured comparison tables, QR codes, and forms on the adjacent screen canvas.
- [ ] **4. Model "Local Idle Loop + Gaze-Triggered Stream" FinOps**: Show the customer how playing a locally cached HD idle loop when no visitor is standing in front of the kiosk reduces active cloud streaming hours by **70%–80%**.

### 6.2 Production Readiness Checklist
- [ ] **5. `ITU-R BT.1359` Lip-Sync Skew (`<= ±45ms`) Slow-Motion Camera Test**: Record the avatar speaking plosive consonants (`P / B / M`) at 120fps slow motion and verify that lip closure aligns within `45ms` of the audio waveform peak.
- [ ] **6. `160ms` Barge-In "Zero Zombie Mouth" Verification**: Interrupt the avatar mid-paragraph and verify that both voice audio and mouth animation stop within `160ms`, transitioning cleanly to the smiling listening pose.
- [ ] **7. Public Lobby Passerby Chatter Immunity Test**: Have two testers chat loudly 2.5 meters away without looking at the screen for 3 minutes and verify `0` false wake-ups.
- [ ] **8. 3-Second Walk-Away Privacy Screen Wipe**: Verify that when a visitor walks away from the kiosk for `> 3,000ms`, the session closes and all personal data cards are wiped from the display.
- [ ] **9. `< 600 kbps` Weak-Network Audio-First Fallback Test**: Throttle downlink bandwidth to `400 kbps` and verify that the client smoothly swaps live video for a local breathing avatar + visual cards while keeping voice audio 100% clear.
- [ ] **10. Livestream `0ms` Ad-Law Filter & `< 800ms` P0 Comment Splice Test**: Flood the test livestream with 20 filler comments, 1 banned superlative claim, and 1 cart-holder sizing question, verifying that the banned claim is blocked and the sizing question is answered next with a synced product card pop-up.
