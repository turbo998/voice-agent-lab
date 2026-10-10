import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { RetellClient, type WebCallSession, type MonitorSession } from "retell-client-js-sdk";
import "./style.css";

interface Product { id: string; name: string; price: number; description: string; wifi: string; warrantyMonths: number }
interface Budget { bucket: string; capCents: number; reservedCents: number; capMinutes: number; reservedMinutes: number }
interface Bootstrap { mode: string; liveEnabled: boolean; foundryEnabled: boolean; gptLiveUrl: string | null; paused: boolean;
  products: Product[]; customers: { id: string; label: string; market: string }[]; budget: Budget[] }
interface Draft { id: string; version: number; summary: string; priority: string; status: string; ticketId?: string }
interface Consent { id: string; evidence: string; withdrawnAt?: number }
interface Snapshot { drafts: Draft[]; tickets: { id: string; summary: string }[]; consents: Consent[];
  followups: { id: string; window: string; status: string }[]; calls: { id: string; status: string; aiStopped: boolean }[] }
interface Line { role: string; text: string; at: string }
const initial: Snapshot = { drafts: [], tickets: [], consents: [], followups: [], calls: [] };

function Lab() {
  const [auth, setAuth] = useState<{ csrf: string; owner: string } | null>(null);
  const [password, setPassword] = useState("");
  const [config, setConfig] = useState<Bootstrap | null>(null);
  const [customer, setCustomer] = useState("demo-sg"), [product, setProduct] = useState("cam-air");
  const [sessionId, setSessionId] = useState(""), [snapshot, setSnapshot] = useState<Snapshot>(initial);
  const [order, setOrder] = useState("LN-SG-1001"), [symptom, setSymptom] = useState("My Cam Air cannot pair with my 5 GHz Wi-Fi.");
  const [result, setResult] = useState<unknown>(null), [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState("未连接"), [captions, setCaptions] = useState("未开启");
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [mic, setMic] = useState("未检查"), [muted, setMuted] = useState(false);
  const [consentEvidence, setConsentEvidence] = useState(""), [consentConfirmed, setConsentConfirmed] = useState(false);
  const [windowTime, setWindowTime] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [takeoverConfirm, setTakeoverConfirm] = useState(false);
  const call = useRef<WebCallSession | null>(null), monitor = useRef<MonitorSession | null>(null), client = useRef<RetellClient | null>(null);
  const voiceActive = ["连接中", "实时英语语音", "主管接管 · AI 已停止"].includes(status);
  const log = (text: string, role = "tool") => setLines(previous => [...previous.slice(-49), { role, text, at: new Date().toLocaleTimeString("zh-CN", { hour12: false }) }]);
  async function api<T>(path: string, payload?: unknown, method = payload === undefined ? "GET" : "POST"): Promise<T> {
    const response = await fetch(path, { method, credentials: "same-origin", headers: {
      "Content-Type": "application/json", "X-CSRF-Token": auth?.csrf ?? "",
    }, body: payload === undefined ? undefined : JSON.stringify(payload) });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(`${data.code ?? response.status}: ${data.error ?? "操作失败"}`);
    return data as T;
  }
  async function run(operation: () => Promise<void>) {
    setError(""); setBusy(true);
    try { await operation(); } catch (failure) { setError(failure instanceof Error ? failure.message : "操作失败"); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    void fetch("/api/me").then(async response => { if (response.ok) setAuth(await response.json()); })
      .catch(() => setError("无法连接本地服务，请检查是否已启动。"));
    return () => { void call.current?.end(); void monitor.current?.end(); };
  }, []);
  useEffect(() => {
    if (!auth) return;
    void run(async () => setConfig(await api<Bootstrap>("/api/bootstrap")));
  }, [auth]);
  useEffect(() => {
    if (!sessionId || !auth) return;
    const timer = setInterval(() => {
      void api<Snapshot>(`/api/sessions/${sessionId}`).then(setSnapshot).catch(failure => setError(failure.message));
      if (call.current?.callId) {
        void api<{ state: string }>(`/api/calls/${call.current.callId}/captions`).then(value => setCaptions(
          value.state === "available" ? "实时字幕已连接" : value.state === "connecting" ? "字幕连接中" : "字幕不可用 · 音频可继续",
        )).catch(failure => setError(failure.message));
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [sessionId, auth]);
  async function ensureSession() {
    if (sessionId) return sessionId;
    const created = await api<{ id: string }>("/api/sessions", { customerId: customer });
    setSessionId(created.id); return created.id;
  }
  async function tool(name: string, input: unknown) {
    const id = await ensureSession();
    const output = await api<unknown>(`/api/sessions/${id}/tools/${name}`, input);
    setResult(output); log(`${name} · 已取得确定性业务结果`);
    setSnapshot(await api<Snapshot>(`/api/sessions/${id}`));
    return output;
  }
  async function checkMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("麦克风需要 HTTPS 或 localhost。");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); setMic("权限已获准 · 未录音");
  }
  function createClient(id: string) {
    return new RetellClient({
      key: auth!.csrf, baseURL: `${location.origin}/retell`,
      fetch: async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        let body = init?.body;
        if (url.endsWith("/v3/create-web-call")) body = JSON.stringify({ agent_id: "server-selected", lab_session_id: id });
        return fetch(input, { ...init, body, credentials: "same-origin", headers: {
          ...Object.fromEntries(new Headers(init?.headers).entries()), "X-CSRF-Token": auth!.csrf,
        } });
      },
    });
  }
  async function startVoice() {
    if (!config?.liveEnabled) throw new Error("真实语音尚未通过服务器配置与成本门槛。合成演练不使用 Retell 额度。");
    await checkMicrophone();
    const id = await ensureSession();
    client.current = createClient(id); setStatus("连接中"); setCaptions("字幕连接中");
    call.current = client.current.createWebCall({
      agent_id: "server-selected", transcript: true,
      hooks: {
        onStatus: value => setStatus(value === "live" ? "实时英语语音" : value === "ended" ? "已结束" : "连接中"),
        onEnd: () => { setStatus("已结束"); setMuted(false); },
        onError: value => { setError(value.message); setStatus("连接失败"); },
        onTranscript: transcript => {
          setCaptions("实时字幕已连接");
          setLines(transcript.filter(item => ["user", "agent", "transfer_target"].includes(item.role)).map(item => ({
            role: item.role, text: "content" in item ? String(item.content) : "",
            at: `${item.time_sec.toFixed(1)}s`,
          })));
        },
        onNodeTransition: transition => log(`原生节点 → ${transition.new_node_name}`, "node"),
      },
    });
  }
  async function scenario() {
    const id = await ensureSession();
    log(config?.foundryEnabled ? "开始合成业务演练；没有麦克风或真实语音；诊断会调用已启用的 Foundry 推理。" : "开始离线合成业务演练；没有麦克风、模型调用或真实语音。", "system");
    await tool("get_product_catalog", { product_id: product });
    await tool("get_order_status", { order_id: order });
    if (config?.foundryEnabled) {
      log("此环境启用了 Foundry；诊断将调用有预算上限的真实推理，不标为离线。", "system");
    }
    await tool("diagnose_device", { product_id: product, symptom });
    await tool("draft_support_ticket", { product_id: product, summary: symptom, priority: "normal" });
    setSnapshot(await api<Snapshot>(`/api/sessions/${id}`));
    setStatus("合成业务演练 · 等待运营审批");
  }
  if (!auth) return <main className="login">
    <div className="brand-mark">VL<span /></div><p className="eyebrow">RETELL AI × AZURE FOUNDRY</p>
    <h1>出海语音实验室</h1><p className="muted">仅限运营员 · 原创合成数据 · 浏览器语音</p>
    <form onSubmit={event => { event.preventDefault(); void run(async () => {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(`${data.code}: ${data.error}`);
      setPassword(""); setAuth(data);
    }); }}>
      <label htmlFor="password">运营员密码</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
      <button className="primary" disabled={busy}>进入实验室</button>
    </form>{error && <p role="alert" className="error">{error}</p>}
    <p className="fine">本地首次启动：npm run setup:local。密码仅保存在私有配置中，无默认密码。</p>
  </main>;

  return <div className="shell">
    <a className="skip" href="#workspace">跳到实验区</a>
    <header>
      <a className="logo" href="/"><span className="brand-mark small">VL</span><span>Voice Agent Lab<small>中国品牌出海 · 场景到落地</small></span></a>
      <nav aria-label="实验导航"><a href="#workspace" className="active">Retell 原生实验</a>
        {config?.gptLiveUrl ? <a href={config.gptLiveUrl} target="_blank" rel="noreferrer">GPT Live 独立实验 ↗</a> : <a href="#independent">GPT Live 导入基线</a>}
        <button className="text" onClick={() => void run(async () => { await api("/api/logout", {}); setAuth(null); })}>退出</button></nav>
    </header>
    <section className="hero">
      <div><p className="eyebrow">SOLUTIONS ARCHITECT + FDE PLAYGROUND</p><h1>让下一次出海服务<br /><em>从一段对话开始。</em></h1>
        <p className="muted">LumaNest 智能硬件 · 东南亚英语服务 · 中文运营协作<br />原生语音流程 + 有来源的诊断 + 人工审批，体验真实边界。</p></div>
      <aside className="hero-aside"><span className="pill">BROWSER ONLY</span><strong>3 分钟</strong><span>单通话硬上限</span><div className="mini-flow">咨询 <b>→</b> 诊断 <b>→</b> 审批</div><small>无拨号 · 无短信 · 无支付 · 无自动充值</small></aside>
    </section>
    <div className="notice" role="status"><span className="dot" />{config?.liveEnabled ? "已配置受控真实语音" : "真实语音未启用 · 合成业务演练可用"}
      <span>{config?.foundryEnabled ? "Foundry 有来源诊断" : "本地确定性知识 · 非模型回答"}</span><span>原始录音不在本应用保存</span></div>
    {error && <div className="error" role="alert">{error}<button className="text" onClick={() => setError("")}>关闭</button></div>}
    <main id="workspace" className="workspace">
      <section className="panel voice-panel">
        <div className="section-title"><span className="step">01</span><div><h2>场景与语音</h2><p>客户身份由运营员绑定，Agent 不能越权改变。</p></div></div>
        <div className="fields">
          <label>合成客户<select value={customer} disabled={Boolean(sessionId)} onChange={event => { setCustomer(event.target.value); setOrder(event.target.value === "demo-my" ? "LN-MY-2001" : event.target.value === "demo-th" ? "LN-TH-3001" : "LN-SG-1001"); }}>
            {config?.customers.map(c => <option key={c.id} value={c.id}>{c.label} · {c.market}</option>)}</select></label>
          <label>产品<select value={product} onChange={event => setProduct(event.target.value)}>
            {config?.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        </div>
        <div className={`orb ${status === "实时英语语音" ? "live" : ""}`} aria-hidden="true"><div /><span>LN</span></div>
        <p className="voice-status" aria-live="polite">{status}</p><p className="muted centered">{mic} · {captions}</p>
        <div className="controls">
          <button className="primary" disabled={busy || !config?.liveEnabled || voiceActive || config.paused} onClick={() => void run(startVoice)}>开始英语语音</button>
          <button disabled={!call.current || status !== "实时英语语音"} onClick={() => { if (muted) call.current?.unmute(); else call.current?.mute(); setMuted(!muted); }}>{muted ? "取消静音" : "静音"}</button>
          <button disabled={!call.current || !voiceActive} onClick={() => void run(async () => { await call.current?.end(); await monitor.current?.end(); setStatus("已结束"); })}>结束</button>
        </div>
        <div className="controls secondary">
          <button onClick={() => void run(checkMicrophone)} disabled={busy}>检查麦克风</button>
          <button onClick={() => void run(async () => {
            const context = new AudioContext(); const oscillator = context.createOscillator(), gain = context.createGain();
            gain.gain.value = 0.04; oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.25);
            oscillator.onended = () => void context.close(); log("播放合成提示音；这不是 Agent 语音。");
          })}>检查播放</button>
          <button disabled={!call.current} onClick={() => void run(async () => { await call.current?.startAudioPlayback(); })}>恢复播放</button>
        </div>
        <div className="divider" />
        <label>合成订单号<input value={order} onChange={event => setOrder(event.target.value)} /></label>
        <label>英语诊断描述<textarea rows={3} value={symptom} onChange={event => setSymptom(event.target.value)} /></label>
        <div className="controls"><button disabled={busy} onClick={() => void run(async () => { await tool("get_order_status", { order_id: order }); })}>查订单</button>
          <button disabled={busy} onClick={() => void run(async () => { await tool("diagnose_device", { product_id: product, symptom }); })}>有来源诊断</button></div>
        <button className="wide exercise" disabled={busy || config?.paused} onClick={() => void run(scenario)}>运行合成业务演练 <small>不会启动语音</small></button>
        {sessionId && <button className="text wide" disabled={voiceActive || busy} onClick={() => { setSessionId(""); setSnapshot(initial); setLines([]); setResult(null); setStatus("未连接"); }}>重新绑定客户 / 新会话</button>}
      </section>
      <section className="panel transcript-panel">
        <div className="section-title"><span className="step">02</span><div><h2>对话与工具轨迹</h2><p>时间戳是文本观察时间，不冒充端到端音频延迟。</p></div></div>
        <div className="legend"><span className="pill">ENGLISH VOICE</span><span className="pill subdued">CHINESE OPS</span><span className="pill subdued">NO PII</span></div>
        <div className="transcript" role="log" aria-live="polite" aria-label="对话与工具事件">
          {lines.length ? lines.map((line, index) => <article className={`line ${line.role}`} key={`${index}-${line.at}`}>
            <div><span>{line.role === "user" ? "客户" : line.role === "agent" ? "LumaNest" : line.role === "node" ? "原生流程" : "业务工具"}</span><time>{line.at}</time></div><p>{line.text}</p></article>) :
            <div className="empty"><span>≈</span><h3>准备一段可解释的服务旅程</h3><p>先选择客户和产品，再进行合成演练。<br />真实语音须由参与者授权麦克风后启动。</p></div>}
        </div>
        {result !== null && <details className="result" open><summary>最近工具结果 · 原始结构化证据</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>}
        <div className="supervisor">
          <h3>原生主管监控</h3><p className="muted">按当前 call_id 授权。接管后 AI 永久停止，没有“恢复 AI”按钮。</p>
          <label className="check"><input type="checkbox" checked={takeoverConfirm} onChange={event => setTakeoverConfirm(event.target.checked)} />我理解接管不可逆，且已获得参与者同意</label>
          <div className="controls"><button disabled={!call.current?.callId} onClick={() => void run(async () => {
            if (!client.current || !call.current?.callId) return;
            monitor.current = client.current.monitorCall({ call_id: call.current.callId, hooks: { onStatus: value => log(`主管状态：${value}`), onError: value => setError(value.message) } });
            await monitor.current.listen();
          })}>监听当前通话</button><button className="danger" disabled={!monitor.current || !takeoverConfirm} onClick={() => void run(async () => {
            await monitor.current?.takeOver(); log("主管已接管；此通话 AI 永久停止。"); setStatus("主管接管 · AI 已停止");
          })}>确认永久接管</button></div>
        </div>
      </section>
      <aside className="panel ops-panel">
        <div className="section-title"><span className="step">03</span><div><h2>运营审批</h2><p>模型提议 ≠ 业务授权</p></div></div>
        <h3>工单草稿</h3>
        {snapshot.drafts.length ? snapshot.drafts.map(draft => <article className="draft" key={draft.id}>
          <span className={`pill ${draft.status === "committed" ? "" : "subdued"}`}>{draft.status} · v{draft.version}</span>
          <p>{draft.summary}</p><small>{draft.priority === "safety" ? "安全升级 · 禁止危险维修" : "合成售后 · 无退款/换货"}</small>
          <div className="controls">
            <button disabled={busy || draft.status !== "pending"} onClick={() => void run(async () => {
              await api(`/api/drafts/${draft.id}/approval`, { version: draft.version }); setSnapshot(await api<Snapshot>(`/api/sessions/${sessionId}`)); log(`运营员批准草稿 v${draft.version}`);
            })}>审核并批准</button>
            <button disabled={busy || draft.status !== "approved"} onClick={() => void run(async () => {
              await tool("commit_approved_ticket", { draft_id: draft.id, version: draft.version }); log("工单提交成功；重复提交不会创建第二条。");
            })}>提交批准版本</button>
            <button className="text" disabled={draft.status === "committed"} onClick={() => void run(async () => {
              await api(`/api/drafts/${draft.id}/approval`, { version: draft.version, revoke: true }); setSnapshot(await api<Snapshot>(`/api/sessions/${sessionId}`));
            })}>撤回</button>
          </div>
          {draft.ticketId && call.current?.callId && <button className="text" onClick={() => void run(async () => {
            await api(`/retell/v2/update-live-call/${call.current!.callId}`, { approved_ticket_id: draft.ticketId }, "PATCH"); log("已向当前 AI 注入服务端核实的工单结果。");
          })}>将核实结果注入通话</button>}
        </article>) : <p className="muted empty-small">诊断后生成草稿，在这里审核。</p>}
        <div className="divider" /><h3>明确同意的回访计划</h3><p className="muted">只存计划，绝不拨号、发邮件或短信。合成演练不得冒充真人同意。</p>
        <label>同意证据<textarea rows={2} value={consentEvidence} onChange={event => setConsentEvidence(event.target.value)} placeholder="运营员核实的明确原话与范围；合成证据必须标明合成" /></label>
        <label className="check"><input type="checkbox" checked={consentConfirmed} onChange={event => setConsentConfirmed(event.target.checked)} />我已核实其同意范围和计划时间</label>
        <label>计划时间（UTC）<input type="datetime-local" value={windowTime} onChange={event => setWindowTime(event.target.value)} /></label>
        <button className="wide" disabled={busy || !consentConfirmed || consentEvidence.length < 12} onClick={() => void run(async () => {
          const id = await ensureSession(); const consent = await api<Consent>(`/api/sessions/${id}/consents`, { evidence: consentEvidence, operatorConfirmed: true });
          await tool("schedule_consented_followup", { consent_id: consent.id, window: new Date(windowTime + "Z").toISOString() });
          setConsentEvidence(""); setConsentConfirmed(false); log("回访计划已保存：planned_not_dialed。");
        })}>记录同意并保存计划</button>
        {snapshot.followups.map(plan => <article key={plan.id} className="plan"><span>{plan.status}</span><p>{plan.window}</p></article>)}
        {snapshot.consents.filter(c => !c.withdrawnAt).map(consent => <button key={consent.id} className="text" onClick={() => void run(async () => {
          await api(`/api/consents/${consent.id}/withdraw`, {}); setSnapshot(await api<Snapshot>(`/api/sessions/${sessionId}`)); log("同意已撤回；相关计划已取消。");
        })}>撤回同意 / 取消计划</button>)}
      </aside>
    </main>
    <section className="bottom-grid">
      <div className="panel"><h2>成本是业务边界，不是提示词</h2><div className="budgets">
        {config?.budget.map(b => <div key={b.bucket}><span>{b.bucket}</span><strong>${(b.reservedCents / 100).toFixed(2)} <small>/ ${(b.capCents / 100).toFixed(2)}</small></strong>
          <span>{b.capMinutes ? `${b.reservedMinutes} / ${b.capMinutes} 分钟预留` : "原子费用预留 · 失败不假定退款"}</span></div>)}</div>
        <div className="controls"><button disabled={busy} onClick={() => void run(async () => {
          await api("/api/pause", { paused: !config?.paused }); setConfig(await api<Bootstrap>("/api/bootstrap"));
        })}>{config?.paused ? "恢复新会话（不绕过组织关停）" : "暂停新付费会话"}</button>
          <button disabled={busy} onClick={() => void run(async () => { setResult(await api("/api/reconcile", {})); log("已完成当前授权呼叫的恢复对账。"); })}>关停后对账</button></div>
      </div>
      <div id="independent" className="panel"><h2>两个实验，清晰分界</h2><p className="muted">Retell 使用官方 Web SDK 3.0.2 与原生 Conversation Flow。GPT Live 导入 MIT 0.3.1，保持 <code>/live/sessions</code>、WebRTC 和 attach 控制；它不是 Voice Live 或 Realtime。</p>
        <p>合成 fixtures、演练和模型契约测试都不是人体麦克风证明。电话、SIP、SMS 仅有禁用契约；本轮不执行。</p></div>
    </section>
    <footer>Voice Agent Lab · LumaNest 为原创合成品牌 · 公开资产不包含账号页面、私密云标识或真实录音</footer>
  </div>;
}
createRoot(document.getElementById("root")!).render(<Lab />);
