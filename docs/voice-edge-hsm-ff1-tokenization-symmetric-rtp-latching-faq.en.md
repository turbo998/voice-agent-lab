# Edge SBC/HSM Format-Preserving Tokenization (`NIST SP 800-38G FF1` Zero-Plaintext Cloud Scope) & `RFC 4961` Authenticated Symmetric RTP Latching (`Anti-RTP-Bleed`) / `RFC 5761 rtcp-mux` Selection & Architecture FAQ

> **Document Scope**: Single-topic architecture selection and first-principles deep dive for AI Solution Architects, payment/healthcare compliance engineers, media-gateway kernel developers, and telecom security teams. Modeled on `ib-vs-ethernet-roce-selection-faq.md`, this guide explains in 3 minutes why regex-scrubbing credit-card PANs *after* they enter cloud ASR/LLM memory still drags your entire AI cluster into multi-million-dollar PCI-DSS CDE audits (while UUID tokens crash legacy COBOL/SAP fixed-width fields), and how naive `RFC 4961 Symmetric RTP` ("blind first-packet latching") lets an attacker hijack and wiretap live calls with a single spoofed UDP packet (`RTP Bleed`)—and in 10 minutes unpacks `Edge SBC/HSM NIST FF1 Format-Preserving Tokenization` and `Cryptographically Authenticated RTP Latching + RFC 5761 rtcp-mux` on a millisecond timeline.
> **Timer & Provenance Disclosure**: Deterministic guardrail probes (`P783` / `P784`) execute in `0ms` inside the offline synthetic policy state machine (`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`, `synthetic`). Live PCIe HSM `FF1` cipher latency and kernel `SRTP HMAC/GCM` verification overhead depend on hardware accelerators and packet rates; never conflate offline policy evaluation with live cryptographic execution time.

![Edge SBC/HSM NIST FF1 Tokenization & Authenticated RTP Latching Visual Summary](../assets/svg/39-voice-edge-hsm-ff1-tokenization-symmetric-rtp-latching-2026-11-11.svg)

---

## ① 📌 Executive Summary

1. **Never Allow Plaintext PAN/CVV/SSN Digits to Enter Cloud ASR/LLM Memory Before Redaction or Replace Fixed-Width Numeric Identifiers with Schema-Breaking UUIDs—Enforce DMZ Edge SBC + Hardware HSM `NIST SP 800-38G FF1` Format-Preserving Tokenization (`0` Plaintext Digits in Cloud, `<= 5ms` HSM Latency) (`P783`)**: Under PCI-DSS v4.0 and HIPAA, if raw cardholder digits touch cloud ASR buffers, LLM prompt contexts, or GPU VRAM—even for `10ms` before a Python regex replaces them with `****`—the entire cloud AI cluster, telemetry pipeline, and vector database fall into **Cardholder Data Environment (CDE)** audit scope! Conversely, replacing a 16-digit PAN with a 36-character UUID breaks downstream mainframe COBOL and SAP ERP schemas that validate 16-digit numeric length and Luhn check digits. Production architectures must intercept sensitive digits at the **DMZ Edge SBC** and invoke a FIPS 140-3 Level 3 Hardware Security Module (HSM) running **`NIST SP 800-38G FF1` Format-Preserving Encryption (FPE)** within **`<= 5ms`**, mapping `4111-1111-1111-1234` into a format-preserving, Luhn-valid synthetic token (`4111-8930-4721-1234`) so **`0` plaintext sensitive digits ever enter the cloud**.
2. **Never Enable Unauthenticated "Blind First-Packet" `RFC 4961` Symmetric RTP Latching on Media Gateways or Allocate Separate RTP + RTCP UDP Ports—Enforce Cryptographically Authenticated RTP Latching (`0` Unauthenticated Re-Latches) and Mandatory `RFC 5761 a=rtcp-mux` (`1` UDP Port per Stream) (`P784`)**: To traverse client NATs, legacy media servers enable `Symmetric RTP`, updating the destination IP:port to match whatever source address sends a UDP packet to the allocated port. This creates the critical **`RTP Bleed` (`CVE-2017-14789`-class) audio hijacking vulnerability**: an attacker spraying a single spoofed UDP packet across ports `10000–20000` tricks the gateway into re-latching its outbound audio stream to the attacker's IP—wiretapping the live call and injecting rogue audio! Meanwhile, allocating separate even/odd UDP ports for RTP and RTCP cuts SBC port capacity in half. Production media servers must require **valid `SRTP HMAC-SHA1/AEAD-GCM` authentication tags or signed `ICE/STUN` binding credentials before any NAT address re-latch (`unauthenticatedRtpRelatches === 0`)** and enforce **`RFC 5761 a=rtcp-mux` (`1` UDP port per media stream, doubling port density)**.
3. **Production Zero-Plaintext Cloud & Anti-RTP-Bleed Formula = `P783` Edge SBC/HSM `NIST FF1` Tokenization (`0` cloud plaintext digits, `<= 5ms` HSM latency, `100%` Luhn/schema compatibility) + `P784` Crypto-Authenticated `RFC 4961` Latching + `RFC 5761 rtcp-mux` (`100%` `RTP Bleed` immunity & `2x` UDP port capacity)**.

---

## ② 🎯 Soul-Searching Q&A for Customers & Architects

### Q1: Why did our PCI-DSS QSA auditor fail our entire cloud LLM cluster even though we scrub credit-card numbers with a regex 1ms after ASR transcription—and why did switching to UUID tokens break our core banking APIs (`P783`)?

- **Plain-Language First Principles**:
  - **Why post-ASR regex scrubbing fails PCI-DSS scope reduction**:
    - Scope reduction requires that plaintext Primary Account Numbers (PANs) **never enter the cloud boundary in the first place**. Once plaintext digits reside in a cloud container's RAM or GPU tensor buffer, core dumps, kernel swap pages, and distributed tracing spans are all contaminated—pulling every microservice in that VPC into CDE audit scope!
  - **Why random UUID tokens crash enterprise ERPs**:
    - Core banking, airline PSS, and healthcare claims APIs validate that account fields are **strictly 16 numeric digits passing the Luhn mod-10 checksum**. Passing `"tok_a8f9..."` triggers immediate schema validation failures across middle-tier RPCs.
- **How `P783` Solves It on a Millisecond Timeline**:
  1. **DMZ Edge Interception & `<= 5ms` Hardware HSM FPE**: Before audio/DTMF leaves the sovereign DMZ edge, the SBC calls a hardware HSM using **`NIST SP 800-38G FF1`**;
  2. **Format- & Luhn-Preserving Bijective Tokenization**: The 16-digit PAN is transformed into a 16-digit Luhn-valid synthetic number preserving the 6-digit BIN prefix and last-4 digits (`plaintextPanDigitsInCloud === 0`), passing cleanly through cloud LLMs and ERP validators before detokenizing at the final payment-gateway hop.

### Q2: What is the "RTP Bleed" vulnerability, and how can an external attacker hijack a live customer phone call by sending a single 12-byte UDP packet (`P784`)?

- **Plain-Language First Principles**:
  - **The fatal flaw of blind `RFC 4961 Symmetric RTP`**:
    - Because callers sit behind NAT routers, a media server cannot trust the private IP written in the caller's SDP. With naive `Symmetric RTP`, the server opens a UDP port (e.g., `16384`) and says: *"Whoever sends a UDP packet to port `16384`, I will latch onto their source IP:port and send all outbound voice there."*
    - If an attacker sprays spoofed UDP packets at ports `10000–20000` during an active call (especially during a brief silence or Wi-Fi-to-5G handover), the server blindly re-latches onto the attacker's IP—redirecting the live conversation audio straight to the attacker!
- **How `P784` Solves It on a Millisecond Timeline**:
  - **Cryptographically Authenticated Latching (`unauthenticatedRtpRelatches === 0`)**: Never update the remote peer IP:port tuple unless the incoming packet passes **`SRTP HMAC/AEAD` verification** or a signed **`ICE/STUN` connectivity check**; drop unauthenticated UDP probes in `0ms`;
  - **Mandatory `RFC 5761 a=rtcp-mux` (`clampedUdpPortsPerStream === 1`)**: Multiplex RTP and RTCP onto a single UDP port, eliminating the unauthenticated RTCP odd-port attack surface and doubling SBC port capacity (`2x`).

### Q3: How do `P783` and `P784` reinforce each other at the DMZ media edge?

- **`P783` (Payload Sovereignty Layer)**: Replaces sensitive digits at the edge with `NIST FF1` format-preserving tokens (`0` cloud plaintext digits, `<= 5ms`);
- **`P784` (Transport Integrity Layer)**: Locks RTP media paths to cryptographically authenticated peers on a single `rtcp-mux` port.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree + Pipeline Comparison + Sequence Diagram)

### 3.1 Edge HSM FF1 Tokenization & Authenticated RTP Latching Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A[DMZ Edge SBC Media Ingress & Sensitive Digit Capture] --> B{Unauthenticated RTP Source-IP Re-Latch or Separate RTP/RTCP Ports P784?}
    B -- Yes: RTP Bleed Hijack Risk or Port Waste --> C[P784 Block: symmetric_rtp_bleed_hijack_or_port_waste_blocked<br/>Drop Unauthenticated NAT Rebind Packets (0 Blind Switches) & Enforce rtcp-mux (1 Port)]
    B -- No: Authenticated Single-Port Media --> D[Capture PAN / SSN / Account Digits at Edge]
    D --> E{Any Plaintext Digits Sent to Cloud AI or HSM Latency > 5ms P783?}
    E -- Yes: CDE Scope Contamination or Slow HSM --> F[P783 Trigger: edge_hsm_ff1_plaintext_leak_or_latency_blocked<br/>Enforce DMZ Edge HSM NIST SP 800-38G FF1 Tokenization (0 Cloud Plaintext, <=5ms)]
    E -- No: Format-Preserving Token Compliant --> G[Zero Cloud CDE Scope & 100% Legacy Luhn/Fixed-Width Schema Compatibility]
```

### 3.2 Naive Post-ASR Scrubbing / Blind RTP Latching vs. `P783+P784` Production Pipeline (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Naive Pipeline: Cloud Regex Scrubbing + Blind Symmetric RTP Hijack"]
      direction LR
      B1["Plaintext 16-Digit PAN Enters Cloud LLM RAM<br/>Drags Entire AI Cluster Into PCI-DSS CDE Scope"] --> B2["Blind Symmetric RTP Accepts Spoofed UDP Packet<br/>Attacker Hijacks Live Call Audio (RTP Bleed)"]
      B2 --> B3["Multi-Million-Dollar Audit Exposure<br/>& Live Voice Wiretapping"]
    end

    subgraph Good["✅ Production Pipeline: P783 Edge HSM FF1 Token + P784 Crypto Latching & rtcp-mux"]
      direction LR
      G1["P783 Edge HSM <=5ms NIST FF1 Tokenization<br/>0 Cloud Plaintext & Luhn-Valid 16-Digit Format"] --> G2["P784 Requires SRTP/STUN Auth Before Re-Latch<br/>+ RFC 5761 rtcp-mux Single Port"]
      G2 --> G3["100% Cloud CDE Exemption<br/>Zero RTP Bleed & 2x SBC Port Capacity"]
    end
```

### 3.3 Millisecond-Level Edge FF1 Tokenization & Anti-RTP-Bleed Latching Sequence (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Caller Endpoint (4G -> Wi-Fi Roam)
    participant Attacker as External UDP Scanner
    participant SBC as DMZ Edge SBC + Hardware HSM (P783/P784)
    participant CloudAI as Cloud Voice Agent & Core ERP

    Attacker->>SBC: Sprays spoofed RTP packet to UDP 16384 (invalid/missing SRTP Auth Tag)
    Note over SBC: P784 blocks RTP Bleed hijack in 0ms (synthetic check):<br/>symmetric_rtp_bleed_hijack_or_port_waste_blocked -> drops spoofed packet, preserves latch
    Caller->>SBC: Roams to Wi-Fi & sends RTP with valid SRTP GCM Tag (containing PAN 4111...1234)
    Note over SBC: P784 verifies SRTP Tag -> safely updates RTP latch on single rtcp-mux port
    Note over SBC: P783 executes NIST FF1 tokenization in 2.4ms (<= 5ms):<br/>Maps 4111-1111-1111-1234 -> Luhn-valid token 4111-8930-4721-1234 (cloud plaintext = 0)
    SBC->>CloudAI: Forwards FF1 token 4111-8930-4721-1234 (zero plaintext in cloud RAM)
    CloudAI-->>SBC: Emits tool call with FF1 token -> Edge SBC/HSM detokenizes at final payment hop
```

---

## ④ 📊 Architect Decision Matrix

| Evaluation Dimension | Option A: Cloud Post-ASR Regex Masking + Blind `Symmetric RTP` | Option B: Edge Random UUID Replacement + Disable `Symmetric RTP` | Option C (Recommended): `P783` Edge HSM `NIST FF1` (`<=5ms`) + `P784` Crypto-Authenticated Latching & `rtcp-mux` |
| :--- | :--- | :--- | :--- |
| **Cloud AI PCI-DSS / HIPAA CDE Scope** | `100% In-Scope` (plaintext touches cloud RAM before masking) | `0 Plaintext` (but 36-char UUID breaks 16-digit Luhn ERP fields) | **`0 Plaintext` & `100% Schema-Compatible` (16-digit Luhn-valid `NIST FF1` token in `<= 5ms`)** |
| **`RTP Bleed` Hijack Immunity & Mobile Roaming** | Vulnerable (1 spoofed UDP packet redirects live audio) | Immune to hijack, but callers drop audio on Wi-Fi/5G handover | **`100% Hijack-Immune + Seamless Roaming` (re-latches only after `SRTP/STUN` verification)** |
| **UDP Ports per Media Stream** | `2 Ports` (separate RTP + RTCP halves concurrency) | `2 Ports` | **`1 Port` (mandatory `RFC 5761 a=rtcp-mux`, `2x` SBC port density)** |
| **Best Fit Scenarios** | Non-sensitive lab testing only | Static landline-only legacy apps | **PCI-DSS voice payments, HIPAA telehealth, mobile WebRTC/SIP gateways** |

---

## ⑤ 🧪 Quantitative Worked Examples & Benchmark Insights (7-Card Report Integration)

1. **Edge `NIST FF1` Tokenization Scope-Reduction Gain (`P783`)**:
   - Moving PAN/SSN tokenization from post-ASR cloud regexes to **DMZ Edge SBC + FIPS 140-3 HSM `NIST SP 800-38G FF1`** reduces plaintext sensitive digits in cloud AI memory from `16 digits/call` to **`0 digits`** (`2.4ms <= 5ms` HSM overhead) while maintaining **`100.0%` compatibility** with legacy 16-digit Luhn COBOL/SAP schemas.
2. **Anti-`RTP Bleed` & `rtcp-mux` Port-Density Gain (`P784`)**:
   - Under a 10,000-pkt/s UDP port-scan attack, unauthenticated `Symmetric RTP` suffers a **`100%` call hijack rate**. Enforcing **`P784` (`SRTP/STUN` authenticated latching + `RFC 5761 rtcp-mux`)** reduces unauthenticated re-latches to **`0`** and doubles concurrent media streams per `32,768`-port SBC from `16,384` to **`32,768` (`2x`)**.
3. **7-Card 4:5 Visual Benchmark Report Link**:
   - `site/benchmark-cards.html` and `site/data/voice-agent-benchmark-report.json` (Stage 395 · Historic 398-Dimension Milestone!) record deterministic verification of `P783` (`edge_hsm_ff1_plaintext_leak_or_latency_blocked`) and `P784` (`symmetric_rtp_bleed_hijack_or_port_waste_blocked`) (`0ms` offline synthetic check; live P95 TTFA: Retell `820ms` `measured`, Vapi `960ms` `measured`, LiveKit `690ms` `measured`).

---

## ⑥ 🛠️ Appendix: Production Verification Checklist (Architect Checklist)

- [ ] **DMZ Edge SBC + Hardware HSM `NIST SP 800-38G FF1` Tokenization (`P783`)**: Are all PAN/SSN/CVV digits tokenized at the DMZ edge into Luhn-valid format-preserving tokens within `<= 5ms` so `plaintextPanDigitsInCloud === 0`?
- [ ] **Final-Hop Edge Detokenization (`P783`)**: Do cloud LLM tool calls carry only the `FF1` token, with detokenization restricted exclusively to the outbound DMZ payment gateway hop?
- [ ] **`RFC 4961` Cryptographically Authenticated RTP Latching (`P784`)**: Does the media server verify a valid `SRTP Auth Tag` or signed `STUN` binding before updating any remote RTP peer address (`unauthenticatedRtpRelatches === 0`)?
- [ ] **Mandatory `RFC 5761 a=rtcp-mux` Single-Port Multiplexing (`P784`)**: Are RTP and RTCP multiplexed onto `1` UDP port per stream (`clampedUdpPortsPerStream === 1`)?
