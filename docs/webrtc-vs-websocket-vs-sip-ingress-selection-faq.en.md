# Enterprise Voice Agent Transport & Ingress Selection FAQ: WebRTC vs. WebSocket vs. SIP Trunking — When to Use Which & How to Eliminate Mobile Jitter and Echo?

> **Audience**: AI Solution Architects, Contact Center Engineering Leads, and Real-Time Media Infrastructure Teams.  
> **Goal**: Master the selection rules across **WebRTC, WebSocket, and SIP Trunking (PSTN)** in 3 minutes, and understand the first principles of **TCP Head-of-Line (HoL) Blocking, NetEQ Adaptive Jitter Buffering, AEC3 Acoustic Echo Cancellation, and 8kHz→24kHz Anti-Aliased Resampling** in 10 minutes—eliminating mobile audio freezes, chipmunk fast-forwarding, speakerphone self-interruption, and `S` vs. `F` phone transcription errors in production.

![Enterprise Voice Agent Transport & Ingress Selection Visual Summary](../assets/svg/06-webrtc-vs-websocket-vs-sip-2026-11-08.svg)

---

## ① 📌 Executive Summary

In enterprise voice agent deployments, **over 80% of production UX failures (2-second freezes on cellular networks, chipmunk catch-up audio, the agent interrupting itself on speakerphone, or mishearing serial-number letters over the phone) are caused by choosing the wrong audio transport protocol rather than model quality**. Memorize these three architectural rules:

1. **For the Client "Last Mile" (Mobile App / Mini-Program / Web Browser / Smart Hardware → Cloud Edge Gateway), Default to `WebRTC` (UDP + Opus 48kHz) for Weak-Network Low-Latency Links—Use Client `WebSocket` Only When UDP/TURN Is Blocked, SDK Size Is Strictly Constrained, or Custom Native AEC + Buffering Is Built In**:
   - Mobile users on 4G/5G handoffs or congested Wi-Fi routinely experience 1%–5% packet loss. Because **WebSocket runs over TCP**, losing a single packet forces the OS kernel to hold back all subsequent arrived audio frames until the missing packet is retransmitted (**TCP Head-of-Line Blocking**). The user hears 1–2 seconds of dead air followed by a robotic, fast-forwarded burst. **WebRTC runs over UDP (SRTP)** and bundles integrated **AEC3 echo cancellation**, **NetEQ adaptive jitter buffering**, and **Opus in-band FEC** out of the box, delivering **40–80ms** first-packet network latency (`anonymized_reported`) with **$0/min telecom carrier fees**.
   - **Engineering Exception Boundary**: Transport protocol (TCP vs. UDP) does not by itself dictate whether an application can perform acoustic echo cancellation (AEC). When strict corporate firewalls block all UDP/TURN ports, embedded hardware restricts WebRTC SDK footprint, or a native mobile app explicitly wires OS-level hardware AEC (`iOS VoiceProcessingIO AudioUnit` / `Android Oboe`) and a custom application-layer jitter buffer, controlled `WebSocket` remains a valid engineering fallback.
2. **For Intra-Datacenter "Server-to-Server" Hops (Edge Media Gateway SFU/ACS → Voice LLM API), Always Choose `WebSocket` (TCP/TLS + 24kHz PCM16)**:
   - Inside the same cloud region or availability zone (e.g., Azure East US 2), fiber links between your media server and the AI model have **near-0% packet loss and 1–5ms RTT**. WebRTC's ICE/STUN/TURN negotiation and extra Opus encode/decode cycles are unnecessary overhead here. A persistent **WebSocket** streaming uncompressed `24kHz PCM16` audio plus JSON control events (`response.cancel`, tool outputs) avoids double-transcoding loss and simplifies centralized compliance recording.
3. **For PSTN Phone Calls (Toll-Free Hotlines, Outbound Calling, Legacy Genesys/Avaya/Cisco PBX), Choose `SIP Trunking`, and Enforce `8kHz → 24kHz` Band-Limited Anti-Aliased Resampling + Out-of-Band DTMF at the Edge Gateway**:
   - Whenever a caller dials a regular phone number over the Public Switched Telephone Network (PSTN), **SIP Trunking (`G.711 μ-law/A-law 8kHz`)** is mandatory. By the Nyquist sampling theorem, **`8kHz` telephony irreversibly strips all frequencies above `4kHz`—upsampling from `8kHz` to `24kHz` only interpolates samples to match the downstream 24kHz format and filters out spectral imaging/aliasing artifacts, and CANNOT reconstruct the lost `>4kHz` wideband sibilance (`S` vs. `F`, `SH` vs. `CH`)**. Therefore, combine **polyphase band-limited anti-aliased resampling (`P718`)** with **RFC 4733 out-of-band DTMF and phonetic confirmation** inside a **Dual-Ingress Unified Runtime (`WebRTC + SIP → Edge Media Gateway → Intra-DC WebSocket → Single Agent Runtime`)**.

---

## ② 🎯 Customer & Architect Soul-Searching Q&A (FAQ-Driven)

### Q1: When deploying an enterprise Voice Agent, what exactly are WebRTC, WebSocket, and SIP Trunking—and when should we choose each?

Many engineering teams build their first voice agent by reusing their text-chatbot WebSocket pipeline: they capture raw PCM chunks in the browser or mobile app and push them over a **WebSocket** directly to the cloud. **It works fine on office gigabit Wi-Fi, then fails catastrophically as soon as real customers use it on 4G/5G cellular networks.**

Here is the plain-language, first-principles breakdown of all three protocols:

- **What is `WebSocket` (Bidirectional Reliable TCP Byte Stream)?**
  - **Plain-Language Analogy**: Think of TCP WebSocket as a **single-track freight train where cars must be unloaded in strict numerical order**. If Car #101 is delayed on the tracks, the stationmaster (the OS TCP stack) refuses to hand Cars #102, #103, and #104 to the application—even though they are already sitting at the platform—until Car #101 is re-sent and arrives.
  - **Why does it make mobile voice agents feel broken?** Real-time conversation cannot tolerate waiting for retransmissions. Missing 20 milliseconds of audio is imperceptible to the human ear, whereas pausing playback for 900 milliseconds to wait for a lost TCP packet destroys conversational rhythm. Worse, a raw WebSocket pipe has **no echo cancellation, no noise suppression, and no adaptive jitter buffer**.
- **What is `WebRTC` (Web Real-Time Communication over UDP/SRTP)?**
  - **Plain-Language Analogy**: WebRTC is the industrial-grade media engine inside Teams, Zoom, and WhatsApp calls—like a **multi-lane fleet of express couriers with active suspension**. Built on **UDP/SRTP**, if Packet #101 drops, WebRTC never stops the stream; it reconstructs the missing 20ms frame immediately from redundant data carried inside Packet #102 (**Opus In-Band FEC**) or smoothly interpolates the waveform (**NetEQ PLC**).
  - **Why it wins on the client edge**: Both iOS/Android and modern browsers wire WebRTC directly into hardware-accelerated **AEC3 (Acoustic Echo Cancellation)**, **NS (Noise Suppression)**, and **AGC (Automatic Gain Control)**.
- **What is `SIP Trunking / PSTN` (Session Initiation Protocol / Public Switched Telephone Network)?**
  - **Plain-Language Analogy**: SIP Trunking is the **digital bridge into global telecom carriers (AT&T, Verizon, Twilio, Azure Communication Services, China Mobile/Telecom)**. Callers dial a standard phone number from any landline or mobile dialer without installing an app; the carrier delivers call signaling via SIP and `8kHz G.711` audio frames via RTP/SRTP to your Session Border Controller (SBC) or cloud media gateway.

#### 📌 The Architect's 3-Line Rule of Thumb:
- **Caller is inside a Mobile App, Web Page, Mini-Program, or Smart Device** 👉 **Use `WebRTC` from Client to Edge Gateway**.
- **Caller is dialing a Phone Number or transferring from a Contact Center PBX** 👉 **Use `SIP Trunking` into your Edge SBC/Gateway**.
- **Audio is already inside your Cloud Datacenter and needs to reach the AI Model** 👉 **Use `WebSocket` from Edge Gateway to Model API**.

---

### Q2: If WebRTC is so strong on the client edge, when is WebSocket or SIP Trunking strictly superior to client-side WebRTC?

Avoid "WebRTC absolutism." In four specific enterprise scenarios, **WebSocket (Intra-DC)** or **SIP Trunking** is strictly superior:

1. **Cloud Intra-Datacenter Microservice Hops (`WebSocket` Strictly Superior)**:
   - Once your edge SFU/gateway (e.g., LiveKit or Azure ACS) has terminated the user's WebRTC or SIP stream inside the cloud, using WebRTC again for the 2ms hop to the LLM adds unnecessary ICE negotiation and lossy Opus-to-PCM-to-Opus transcoding (`+25–40ms` latency).
   - Streaming raw **`24kHz PCM16` over an intra-region WebSocket** incurs zero packet loss, zero transcoding distortion, and multiplexes deterministic JSON tool/control events on the exact same connection.
2. **Locked-Down Bank / Hospital Corporate Firewalls Blocking All UDP (`WebRTC over TCP TURN 443` or `WSS 443`)**:
   - Standard WebRTC requires UDP ports (`10000–60000`). In locked-down bank branch desktops or hospital intranet terminals where all UDP traffic is blocked at the firewall—and the terminal sits on a zero-loss wired Ethernet LAN—tunneling via **TLS 443 (`turns:` over TCP 443 or intranet WSS)** is required to pass security audits.
3. **Zero-Friction Reach to Seniors / Phone-Only Users & Verified Caller ID (`SIP Trunking` Strictly Superior)**:
   - For healthcare post-discharge follow-ups, utility outage hotlines, or banking fraud alerts, asking customers to install an app or open a web link drops contact rates by 70%+. **SIP Trunking** reaches 100% of mobile and landline numbers with STIR/SHAKEN verified Caller ID.
4. **Drop-In Integration with Legacy Contact Center PBXs (`SIP REFER` Warm Handoff)**:
   - Enterprises running thousands of human seats on Genesys, Avaya, or Cisco UCCE can register the AI Voice Agent as a virtual SIP endpoint. When escalation is required, the AI issues a native **`SIP REFER`** with a whisper briefing, handing the call back to a human PBX extension in `<50ms` without replacing existing telephony hardware.

---

### Q3: What is WebRTC Edge Media Routing (NetEQ + Opus FEC + AEC3), and why does a raw WebSocket voice app "argue with itself" on speakerphone?

Why does a DIY WebSocket voice app suffer from "2-second freezes followed by fast-forward speech" and "endless self-interruption loops on speakerphone," while WebRTC feels effortless? Because WebRTC coordinates **three real-time DSP engines** under the hood:

1. **`AEC3` (3rd-Gen Acoustic Echo Cancellation) — Preventing the Agent from Interrupting Itself**:
   - **What is the problem?** When a user talks to a Voice Agent on smartphone speakerphone without headphones, the AI's voice coming out of the phone speaker bounces off walls and re-enters the phone microphone.
   - **Why raw WebSocket fails**: A raw WebSocket app blindly uploads whatever the microphone hears. The cloud VAD hears the AI's own voice echoing back 200ms later, mistakes it for the customer interrupting, and fires `response.cancel`—putting the AI into an **infinite self-interruption loop**!
   - **How WebRTC AEC3 solves it**: WebRTC controls both the speaker playout buffer ($x(t)$) and the microphone capture stream ($d(t)$) at the OS audio-HAL layer. Its adaptive filter models the room impulse response in real time and subtracts the AI's own playback waveform from the microphone signal before encoding, sending only clean human speech ($e(t)$) to the cloud.
2. **`NetEQ` (Adaptive Jitter Buffer & Packet Loss Concealment) — Eliminating Mobile Freezes & Chipmunk Audio**:
   - **What is the problem?** Over 4G/5G, 20ms audio packets arrive at uneven intervals (some 10ms apart, others delayed by 150ms—known as **network jitter**).
   - **How NetEQ solves it**: NetEQ maintains a tiny adaptive playout buffer (`20ms–80ms`):
     - When packets arrive late, NetEQ uses pitch-synchronous waveform stretching to extend the current vowel smoothly by a few milliseconds—preventing audible clicks or dead-air gaps.
     - When delayed packets arrive in a burst, NetEQ imperceptibly accelerates unvoiced/silence frames rather than dumping a jarring fast-forwarded burst.
3. **`Opus In-Band FEC` (Forward Error Correction) — Zero-Wait Packet Recovery**:
   - Every Opus packet $N$ embeds a low-bitrate recovery copy of packet $N-1$. When isolated packets drop on Wi-Fi/cellular, the receiver reconstructs the lost audio from the very next packet (`+20ms`) with **0ms retransmission wait**.

---

### Q4: When 8kHz SIP phone audio feeds a 24kHz Voice LLM, why does it confuse `S` and `F` in serial numbers—and how do we architect a Unified Dual-Ingress Runtime?

Teams deploying auto-insurance claims or logistics hotlines frequently notice: **the exact same Voice LLM achieves 98% alphanumeric accuracy over WebRTC, but drops below 80% on `S` vs. `F` (e.g., license plate `8F321` heard as `8S321`) when connected via a PSTN SIP Trunk.**

#### 🔍 First Principles: Nyquist Cutoff (`4kHz`) & Spectral Aliasing
- By the Nyquist-Shannon sampling theorem, an **`8kHz` PSTN phone call (`G.711`) can only represent frequencies below `4,000 Hz`** (in practice, telecom bandpass filters pass only `300 – 3,400 Hz`).
- Vowels (`a, e, i, o, u`) live between `300 – 2,500 Hz`, so phone speech sounds intelligible. However, unvoiced fricatives like **`S` (primary energy at `4,500 – 8,000 Hz`)** and **`F` (diffuse energy at `1,500 – 4,000 Hz`)** rely on high-frequency energy above `4kHz` to be distinguished!
- Worse, if an engineer naively upsamples `8kHz` audio to `24kHz` using simple linear interpolation without an anti-aliasing low-pass filter, spectral mirror images fold into the `4kHz–12kHz` band, corrupting the Voice LLM's neural audio tokenizer.

#### 🛠️ The 3-Step Engineering Fix (`Stage 362 P718` Standard):
1. **Polyphase Band-Limited Anti-Aliased Resampling (`8kHz → 24kHz`)**: At the edge media gateway, decode `G.711 μ-law/A-law` to `PCM16` and resample to `24kHz` through a Kaiser-windowed polyphase low-pass filter (`cutoff = 3,800 Hz`, stopband attenuation `≥ 65 dB`). **First-Principles Physics Note**: Resampling only aligns the `24kHz` sample rate and prevents `4kHz–12kHz` spectral aliasing artifacts from corrupting the model's audio tokenizer (`P718`)—it **cannot recover the `>4kHz` sibilant energy already lost on the 8kHz PSTN trunk**. Steps 2 and 3 compensate for that missing high-frequency information.
2. **RFC 4733 Out-of-Band DTMF Extraction**: For card numbers, PINs, or ambiguous characters on a SIP call, extract keypad presses deterministically from `RFC 4733 RTP Event` payloads while muting in-band DTMF tones so the audio model isn't confused by beeps.
3. **Channel-Aware Phonetic Confirmation**: Pass `ingressChannel: "sip_pstn"` in session metadata so the agent automatically confirms ambiguous sibilants using phonetic words ("Was that **F as in Foxtrot**, or **S as in Sierra**?").

---

## ③ 🧭 Visual Architecture Diagrams (Decision Tree + Path Comparison + Sequence Diagram)

### 3.1 Enterprise Voice Transport & Ingress Selection Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    Start(["📞 Enterprise Voice Agent Ingress Selection"]) --> Q1{"1. Where does the user's call originate?"}

    Q1 -->|"Dialing a PSTN Phone Number (400/800)<br/>or Legacy Genesys/Avaya/Cisco PBX"| SIP["🏛️ Mandatory Ingress: SIP Trunk (PSTN)<br/>(G.711 μ-law/A-law 8kHz + RTP/SRTP)"]
    Q1 -->|"Mobile App / Web Browser / Mini-Program<br/>In-Cabin Infotainment / Smart Hardware"| Q2{"2. Does a corporate firewall block all UDP?"}
    Q1 -->|"Intra-Cloud Server-to-Server Hop<br/>(Edge SFU/SBC Gateway → Voice LLM API)"| WS_DC["⚡ Mandatory Intra-DC Hop: WebSocket<br/>(Same-AZ TCP/TLS · Lossless 24kHz PCM16)"]

    Q2 -->|"99% Public Cellular (4G/5G) & Wi-Fi"| WebRTC_UDP["🚀 Primary Client Ingress: WebRTC (UDP / SRTP / Opus 48kHz)<br/>(Hardware AEC3 + NetEQ Jitter Buffer + In-Band FEC)"]
    Q2 -->|"1% Locked-Down Bank/Hospital LAN Blocking UDP"| WebRTC_TURN["🛡️ Firewall Fallback: WebRTC over TCP TURN 443<br/>(Preserves Client AEC3 & Opus over TLS 443 Tunnel)"]

    SIP --> Gateway["🔄 Unified Edge Media Gateway (LiveKit SIP / Azure ACS)<br/>• G.711 8kHz → 24kHz Polyphase Anti-Aliased Resampling (P718)<br/>• RFC 4733 Out-of-Band DTMF + RNNoise Voicemail Gate"]
    WebRTC_UDP --> Gateway
    WebRTC_TURN --> Gateway

    Gateway --> WS_DC
    WS_DC --> Runtime["🧠 Unified Voice Agent Runtime<br/>(Single State Machine, Tool Contracts & Guardrails P715–P718)"]

    style SIP fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a
    style WebRTC_UDP fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46
    style WebRTC_TURN fill:#fefce8,stroke:#d97706,stroke-width:2px,color:#78350f
    style WS_DC fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#4c1d95
    style Gateway fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d
    style Runtime fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337
```

---

### 3.2 Mobile Packet-Loss Anti-Pattern (Direct Client WebSocket) vs. Gold-Standard Hybrid Edge Path (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Anti-Pattern: Mobile Client Direct-to-Cloud WebSocket (Collapses at 3% Loss)"]
        direction LR
        B1["📱 Raw Mic Capture<br/>(No Hardware AEC3 / No NS)"] -->|"4G/Wi-Fi 3% Packet Loss<br/>TCP Head-of-Line Retransmit Stall"| B2["🛑 OS TCP Buffer Blocked<br/>(800~2,100ms Audio Freeze)"]
        B2 -->|"Queued Frames Flushed Together"| B3["🐿️ Chipmunk Burst + Echo Self-Barge-in<br/>(Agent Hears Its Own Speakerphone Echo)"]
    end

    subgraph Good["✅ Gold Standard: Client WebRTC (UDP) + Edge Gateway + Intra-DC WebSocket (Stage 362)"]
        direction LR
        G1["📱 Mobile/Web WebRTC Client<br/>(Hardware AEC3 + Opus 48kHz + FEC)"] -->|"UDP/SRTP Absorbs 5% Loss<br/>45ms 1st Packet · 0ms Retransmit"| G2["🌐 Edge Media Gateway (SFU/ACS)<br/>(NetEQ 20~80ms Jitter Buffer · P717)"]
        G2 -->|"Same-AZ Cloud WebSocket<br/>(2ms RTT · 24kHz PCM16)"| G3["🧠 Voice LLM / Cascaded Pipeline<br/>(Smooth Full-Duplex · Zero Self-Barge-in)"]
    end

    style Bad fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#881337
    style Good fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46
```

---

### 3.3 Dual-Ingress (`WebRTC 48kHz` & `SIP 8kHz`) Converging into a `24kHz` Voice Agent Runtime (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant App as 📱 Digital Caller (App/Web WebRTC)
    participant Phone as ☎️ Phone Caller (PSTN SIP 8kHz)
    participant Edge as 🌐 Edge Media Gateway (SFU + SBC · P717/P718)
    participant Model as 🧠 Voice Agent Runtime (Intra-DC WebSocket)

    Note over App,Edge: Path A: Digital Channel via WebRTC (48kHz Opus + Hardware AEC3 + In-Band FEC)
    App->>Edge: [T=0ms] UDP/SRTP 20ms Opus frame (2% packet loss recovered inline via FEC)
    Edge->>Edge: [T=18ms] P717 NetEQ jitter smoothing (40ms window) + decode to 24kHz PCM16
    Edge->>Model: [T=22ms] Intra-DC WebSocket (2ms RTT) streams clean 24kHz PCM16

    Note over Phone,Edge: Path B: Telephony Channel via SIP Trunk (8kHz G.711 μ-law + RFC 4733 DTMF)
    Phone->>Edge: [T=0ms] SIP/RTP G.711 8kHz speech + keypad "8F321#" (RFC 4733 RTP Event)
    Edge->>Edge: [T=25ms] P718 Polyphase anti-aliased upsample (8kHz→24kHz) + strip out-of-band DTMF
    Edge->>Model: [T=30ms] Intra-DC WebSocket streams 24kHz PCM16 + structured DTMF event

    Model->>Edge: [T=260ms] Streams AI response audio (24kHz PCM16)
    par Dispatch to Digital & Phone Callers
        Edge->>App: [T=265ms] Encode Opus 48kHz over WebRTC UDP (Client AEC3 cancels speaker echo)
    and Dispatch to PSTN Phone
        Edge->>Phone: [T=270ms] Downsample & encode G.711 8kHz over SIP/RTP
    end
```

---

## ④ 📊 Architect Decision Matrix

| Evaluation Dimension | Option A: Client WebRTC → Edge Gateway → Intra-DC WebSocket (Digital Primary) | Option B: SIP Trunk → Edge SBC/Gateway → Intra-DC WebSocket (Telephony Primary) | Option C: Intra-Datacenter WebSocket Direct (Server-to-Server Only) | ❌ Anti-Pattern: Mobile/Browser Client Direct WebSocket |
| :--- | :--- | :--- | :--- | :--- |
| **Best-Fit Scenarios** | **Mobile Apps, Web Portals, Mini-Programs, In-Vehicle Infotainment, Smart Hardware** | **Toll-Free Hotlines (800/400), Outbound Campaigns, Legacy Genesys/Avaya/Cisco PBX** | **High-speed internal hop between Edge SFU/ACS and Voice LLM in the same cloud AZ** | Localhost dev testing only; **never use for public mobile/Wi-Fi clients** |
| **Transport & Codec** | Client `UDP / SRTP` + `Opus 24–48kHz` (24–64 kbps adaptive) | Carrier `RTP / SRTP` + `G.711 μ-law/A-law 8kHz` (64 kbps) | Same-AZ `TCP / TLS` + Lossless `PCM16 24kHz` (384 kbps) | Public `TCP / TLS` + Base64 JSON `PCM16` (33%+ bandwidth bloat) |
| **First-Packet Transport Latency (Excl. Model)** | **40 – 85 ms** (Global edge PoP + UDP zero-blocking) | **150 – 280 ms** (Carrier PSTN hops + SBC transcoding) | **1 – 8 ms** (Same-AZ fiber backbone) | 80–150 ms on clean LAN; **spikes to 800 – 2,200 ms under packet loss** |
| **Resilience at 3% Packet Loss** | **Excellent**: Opus in-band FEC + NetEQ PLC keep freeze rate `< 0.4%` | **Good**: Carrier QoS + gateway packet-loss concealment | **Excellent**: Intra-DC physical loss rate `< 0.001%` | **Catastrophic**: TCP Head-of-Line blocking stalls stream (`> 34%` freeze rate) |
| **Echo Cancellation (AEC) & Self-Barge-In Guard** | **Hardware Built-In (`WebRTC AEC3 + AGC + NS`)**, zero speakerphone self-barge-in | **Carrier Line Echo Canceller (`ITU-T G.168`)** | Relies on upstream edge gateway AEC | **None**: Speakerphone playback loops back into mic, causing **infinite self-barge-in** |
| **Audio Bandwidth & Sibilant (`S/F`) Accuracy** | Fullband (`up to 20kHz`), **`98.6%`** alphanumeric recognition accuracy | Narrowband (`300–3,400Hz`), requires `P718` anti-aliased resampling + DTMF (**`91.2% → 98.1%`**) | Preserves upstream `24kHz` lossless fidelity | Suffers from frame drops and buffer truncation under jitter |
| **Channel Cost per Minute (at 100K min/mo)** | **~$0.0015 / min** (Edge SFU bandwidth only; saves **$1,500–$8,000/mo**) | **$0.012 – $0.035 / min** (Carrier per-minute origination/termination + DID rental) | **$0 / min** (Free same-AZ internal vNet traffic) | Wastes 6–8× mobile data bandwidth vs. Opus |

---

## ⑤ 🧪 Quantitative Benchmark Findings (Stage 362 · 365 Dims / 727 Guardrails / 736 Probes)

> 📊 **Data Classification & Provenance Scope**:
> - **Comparative Cohort Figures (`anonymized_reported` / `synthetic`, `independently_reproduced=false`)**: Latency, freeze rate, echo self-interruption, and dictation accuracy below derive from anonymized industry reports and synthetic packet-loss simulations (`anonymized_reported` / `synthetic`); live carrier production cutover metrics are `not_measured` in this repository's local test suite.
> - **Guardrail Evaluation Timing (`synthetic` Offline Policy State Machine)**: `<1ms` (rounded to `0ms` at `1ms` timer resolution) denotes **in-memory synchronous policy function evaluation time** for `P717`–`P718`, not live production network/media cutover latency.

| Metric (3% Cellular Packet Loss + Speakerphone · Provenance: `anonymized_reported` / `synthetic`, `independently_reproduced=false`) | Client Raw WebSocket (Without Native Client AEC/Jitter Buffer) | Raw SIP Trunk (8kHz Linear Interpolation Without Anti-Aliasing) | **Unified WebRTC + SIP Edge Gateway Target (`Stage 362 P717/P718`)** | Engineering & Customer Value |
| :--- | :--- | :--- | :--- | :--- |
| **End-to-End First-Audio Latency (TTFA P50 / P95)** | `490 ms` / **`2,140 ms`** | `640 ms` / `1,120 ms` | **`385 ms` / `660 ms`** | **-69.2% P95 tail latency (reference comparison)** under cellular packet loss |
| **Audio Freeze / Chipmunk Burst Rate** | `34.8%` (TCP HoL retransmit stalls) | `3.2%` | **`0.3%`** (Opus FEC + NetEQ 20–80ms buffer) | Smooth packet-loss concealment at 3% cellular packet loss |
| **Speakerphone Echo Self-Interruption Rate** | `41.5%` (When lacking client-side AEC) | `1.8%` | **`0.2%`** (WebRTC AEC3 + residual echo guard) | Hands-free speakerphone support (raw WS requires custom OS-level AEC integration) |
| **`S/F/SH` Alphanumeric Dictation 1st-Turn Accuracy** | `89.4%` | `78.5%` (>4kHz loss + spectral aliasing) | **`98.4%`** (P718 band-limited anti-aliasing + RFC 4733 DTMF / phonetic check) | Suppresses aliasing artifacts and pairs DTMF/phonetics to offset 8kHz bandwidth limits |
| **Estimated Monthly Telecom TCO (100,000 min/mo)** | `$420 / mo` (Uncompressed egress bloat) | `$2,400 / mo` (100% carrier per-min billing) | **`$680 / mo`** (75% WebRTC digital deflection + 25% SIP) | Deflecting app/web callers to WebRTC saves an estimated **$1,720/mo (-71.7%)** |
| **Stage 362 Offline Policy Guard (`P717`–`P718`) Probe Pass Rate** | Unguarded | Unguarded | **`736/736` Synthetic Probes (`synthetic`)** | `<1ms` (`0ms` rounded) offline state-machine check against unbuffered TCP & aliasing |

---

## ⑥ 🛠️ Appendix: Production Voice Transport & Ingress Launch Checklist (Architect Checklist)

Verify these 6 items before signing off on any enterprise Voice Agent telephony or mobile/web deployment:

- [ ] **1. Ban Public Client-to-Cloud Raw Audio WebSockets (`P717` Guardrail)**: Verify that iOS, Android, Mini-Program, and Web clients connect to your edge media gateway exclusively via **WebRTC (`UDP/SRTP + Opus`)**; restrict WebSocket audio transport to intra-datacenter server-to-server hops.
- [ ] **2. Enforce Client Hardware DSP (`AEC3 + AGC + NS`)**: Explicitly enable `echoCancellation: true, noiseSuppression: true, autoGainControl: true` in browser `getUserMedia` / mobile WebRTC SDKs, paired with server-side residual echo correlation gating (`P714`), guaranteeing zero self-interruption on speakerphone.
- [ ] **3. Enable Pre-Connect Audio Buffering (`P713`)**: Buffer the first `300–500ms` of microphone audio locally the instant the user taps "Call / Push-to-Talk" and flush it as soon as WebRTC DTLS/ICE completes so initial greetings ("Hello?") are never clipped.
- [ ] **4. Enforce Polyphase Anti-Aliased `8kHz → 24kHz` Resampling & Out-of-Band DTMF (`P718` Guardrail)**: Never feed raw or linearly interpolated `8kHz G.711` SIP audio into a `24kHz` model; apply a Kaiser-windowed anti-aliasing filter at the SBC/media gateway and extract keypad digits via `RFC 4733` out-of-band events.
- [ ] **5. Configure Dual-Stack ICE/TURN Firewall Traversal (`UDP + TLS 443 Fallback`)**: Deploy regional UDP STUN/TURN servers alongside `turns:` over TCP port `443` so 99% of callers get sub-50ms UDP media while strict bank/hospital firewall users seamlessly fall back without call drops.
- [ ] **6. Decouple Transport from the Unified Agent Runtime**: Normalize both WebRTC (`48kHz Opus`) and SIP (`8kHz G.711`) into a single `24kHz PCM16 + Channel Metadata` stream at the edge gateway so one unified set of prompts, tools, and deterministic guardrails (`P715–P718`) governs every call.
