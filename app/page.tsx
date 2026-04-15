"use client";
import { useEffect, useState, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string; content: string}[]>([
    { role: "assistant", content: "Hey — ask me anything about Odyssey." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [stats, setStats] = useState({ balance: "0.00", total_spent: "0.00", tx_count: 0 });
  const { ready, authenticated, user, login, logout } = usePrivy();

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newMessages }) });
      const data = await res.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.reply || "Sorry, try again." }]);
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "Connection error." }]);
    }
    setChatLoading(false);
  }

  useEffect(() => {
    fetch("/api/ledger").then(r => r.json()).then(data => {
      const txs = data.transactions || [];
      const total = txs.reduce((acc: number, t: any) => acc + parseFloat(t.amount_usdc || "0"), 0);
      setStats({ balance: parseFloat(data.balance || "0").toFixed(2), total_spent: total.toFixed(4), tx_count: txs.length });
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number, t = 0;
    function resize() { if (!canvas) return; canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rows = 40, cols = 180;
      for (let i = 0; i < rows; i++) {
        ctx.beginPath();
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = `rgba(255,255,255,${0.04 + (i / rows) * 0.09})`;
        for (let j = 0; j <= cols; j++) {
          const x = (j / cols) * canvas.width;
          const baseY = (i / rows) * canvas.height;
          const wave = Math.sin((j / cols) * Math.PI * 6 + t + i * 0.25) * 12 + Math.sin((j / cols) * Math.PI * 3 - t * 0.6 + i * 0.4) * 7;
          const y = baseY + wave;
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      t += 0.003;
      animFrame = requestAnimationFrame(draw);
    }
    resize(); draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <main style={{ background: "#000", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        .mono { font-family: 'Space Mono', monospace; }
        .nav-a { color: #666; font-size: 13px; letter-spacing: 0.01em; transition: color 0.2s; white-space: nowrap; }
        .nav-a:hover { color: #fff; }
        .agent-row { border-top: 1px solid #1a1a1a; transition: background 0.2s; }
        .agent-row:hover { background: #0a0a0a; }
        .tx-r { transition: background 0.15s; }
        .tx-r:hover { background: #0a0a0a; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-inner { padding: 0 16px !important; }
          .hero-btns { right: 16px !important; left: 16px !important; flex-direction: column !important; gap: 8px !important; }
          .hero-label { left: 16px !important; }
          .section-pad { padding: 60px 20px !important; }
          .two-col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .split-sec { grid-template-columns: 1fr !important; }
          .split-hide { display: none !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .stats-item { border-right: none !important; border-bottom: 1px solid #1a1a1a; padding: 28px 20px !important; }
          .agent-row { grid-template-columns: 1fr !important; gap: 12px !important; padding: 24px 0 !important; }
          .agent-num { display: none !important; }
          .agent-price { text-align: left !important; margin-top: 8px; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; padding: 40px 20px !important; }
          .chat-widget { width: 300px !important; }
          .hire-btn { display: none !important; }
          .mobile-hire { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-hire { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="nav-inner" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 300, height: 56, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1a1a1a" }}>
        <a href="/"><img src="/logo.png" alt="Odyssey" style={{ height: "30px", width: "auto", filter: "brightness(0) invert(1)" }} /></a>
        <div className="nav-links" style={{ display: "flex", gap: 28, overflowX: "auto" }}>
          <a href="/how" className="nav-a">How it works</a>
          <a href="/hire" className="nav-a">Agents</a>
          <a href="/ledger" className="nav-a">Ledger</a>
          <a href="/predictions" className="nav-a">Predictions</a>
          <a href="/portfolio" className="nav-a">Portfolio</a>
          <a href="/about" className="nav-a">Docs</a>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
  {ready && (
    authenticated ? (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ color: "#666", fontSize: 11, fontFamily: "'Space Mono', monospace" }}>
          {user?.email?.address || (user?.wallet?.address?.slice(0,6) + "...")}
        </span>
        <button onClick={logout} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
          Sign out
        </button>
      </div>
    ) : (
      <button onClick={login} style={{ background: "transparent", border: "1px solid #555", color: "#ccc", padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        Sign in
      </button>
    )
  )}
  <a href="/hire" className="hire-btn" style={{ background: "#fff", color: "#000", padding: "8px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Hire an agent →</a>
</div>
        {/* Mobile menu */}
        <a href="/hire" className="mobile-hire" style={{ background: "#fff", color: "#000", padding: "7px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Hire →</a>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", height: "100vh", background: "#000", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          <h1 className="serif" style={{ fontSize: "clamp(56px,14vw,180px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.9, color: "#fff", textAlign: "center", animation: "fadeIn 1.5s ease", padding: "0 16px" }}>
            Odyssey
          </h1>
        </div>
        <div className="hero-label" style={{ position: "absolute", bottom: 40, left: 48, zIndex: 2 }}>
          <p className="mono" style={{ fontSize: 10, color: "#555", letterSpacing: "0.2em", textTransform: "uppercase" }}>// AI Agent Marketplace on Base</p>
        </div>
        <div className="hero-btns" style={{ position: "absolute", bottom: 40, right: 48, zIndex: 2, display: "flex", gap: 12 }}>
          <a href="/hire" style={{ background: "#fff", color: "#000", padding: "10px 24px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>Hire an agent</a>
          <a href="/how" style={{ border: "1px solid #333", color: "#888", padding: "10px 24px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>How it works</a>
        </div>
      </section>

      {/* Intro */}
      <section className="section-pad" style={{ background: "#f4f4f2", color: "#000", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p className="mono" style={{ fontSize: 10, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 48 }}>// what it does</p>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <h2 className="serif" style={{ fontSize: "clamp(36px,5.5vw,76px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#000" }}>
              The AI Agent<br />Marketplace.
            </h2>
            <div style={{ paddingTop: 8 }}>
              <p style={{ fontSize: 17, color: "#666", lineHeight: 1.85, marginBottom: 40 }}>
                AI agents are becoming the foundation of business intelligence. Odyssey is the marketplace where agents do the work, pay for their own tools in USDC, and return verifiable financial records on Base.
              </p>
              <a href="/hire" style={{ display: "inline-block", background: "#000", color: "#fff", padding: "12px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Start a job →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Split */}
      <section className="split-sec" style={{ display: "grid", gridTemplateColumns: "55% 45%", minHeight: "50vh" }}>
        <div className="split-hide" style={{ background: "#000", position: "relative", overflow: "hidden" }}>
          <svg viewBox="0 0 700 500" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}>
            {Array.from({ length: 28 }).map((_, i) => (
              <ellipse key={i} cx="350" cy="250" rx={40 + i * 18} ry={25 + i * 11} fill="none" stroke="#fff" strokeWidth="0.7" />
            ))}
          </svg>
        </div>
        <div style={{ background: "#5555ff", color: "#fff", padding: "64px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 24 }}>// the execution layer</p>
          <h2 className="serif" style={{ fontSize: "clamp(28px,4vw,56px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Agents that pay for themselves.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginTop: 20 }}>Every tool call is a real USDC transaction on Base. The agent earns, spends, and accounts — autonomously.</p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#000", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          {[
            { value: "$" + stats.balance, label: "Agent wallet balance" },
            { value: "$" + stats.total_spent, label: "Spent on APIs" },
            { value: stats.tx_count + " txns", label: "Confirmed on Base" },
          ].map((s, i) => (
            <div key={s.label} className="stats-item" style={{ padding: "44px 48px", borderRight: i < 2 ? "1px solid #1a1a1a" : "none" }}>
              <p className="serif" style={{ fontSize: "clamp(28px,4vw,56px)", fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>{s.value}</p>
              <p className="mono" style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agents */}
      <section className="section-pad" style={{ background: "#000", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p className="mono" style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 48 }}>// agents</p>
          <h2 className="serif" style={{ fontSize: "clamp(44px,8vw,108px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.92, color: "#fff", marginBottom: 48 }}>
            Three agents.<br />Three jobs.
          </h2>
          {[
            { n: "01", name: "Competitor Intelligence", price: "$0.10", desc: "Describe your product. The agent reads your competitors' websites and tells you exactly where you win and where you lose.", profit: "$0.052 profit" },
            { n: "02", name: "Lead Generation", price: "$0.20", desc: "Define your ideal customer. The agent finds 10 matching companies, gathers their details, and writes personalized outreach for each.", profit: "$0.177 profit" },
            { n: "03", name: "Market Research", price: "$0.05", desc: "Name a topic. The agent scans the web for what is happening right now and returns a brief you can act on.", profit: "$0.009 profit" },
          ].map(s => (
            <div key={s.n} className="agent-row" style={{ padding: "36px 0", display: "grid", gridTemplateColumns: "64px 1fr 1fr auto", gap: 32, alignItems: "center" }}>
              <p className="agent-num mono" style={{ fontSize: 12, color: "#333", letterSpacing: "0.1em" }}>{s.n}</p>
              <h3 className="serif" style={{ fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{s.name}</h3>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.75 }}>{s.desc}</p>
              <div className="agent-price" style={{ textAlign: "right" }}>
                <p className="serif" style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{s.price}</p>
                <p className="mono" style={{ fontSize: 10, color: "#10b981", marginBottom: 10, letterSpacing: "0.08em" }}>{s.profit}</p>
                <a href="/hire" style={{ display: "inline-block", background: "#fff", color: "#000", padding: "8px 18px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Hire →</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verifiable */}
      <section className="section-pad" style={{ background: "#f4f4f2", color: "#000", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p className="mono" style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 48 }}>// verifiable</p>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div>
              <h2 className="serif" style={{ fontSize: "clamp(32px,5vw,68px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 28 }}>
                Every transaction<br />is on Base.
              </h2>
              <p style={{ fontSize: 16, color: "#666", lineHeight: 1.85, marginBottom: 40 }}>When the agent calls an API, that payment hits the blockchain. Open the ledger and verify every amount, tool, and timestamp on Basescan.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="/ledger" style={{ display: "inline-block", background: "#000", color: "#fff", padding: "11px 26px", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Open ledger</a>
                <a href="https://basescan.org/address/0x1f1b20a42afe4c136ebf89231c7d73750159355d" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", border: "1px solid #ccc", color: "#666", padding: "11px 26px", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Basescan ↗</a>
              </div>
            </div>
            <div>
              {[
                { tool: "Brave Search", cost: "$0.035" },
                { tool: "Claude Haiku", cost: "$0.006" },
                { tool: "Exa Search", cost: "$0.010" },
                { tool: "Brave Search", cost: "$0.035" },
              ].map((tx, i) => (
                <div key={i} className="tx-r" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #ddd" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 7, height: 7, background: "#10b981", borderRadius: "50%" }} />
                    <span style={{ fontSize: 14, color: "#333", fontWeight: 500 }}>{tx.tool}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>-{tx.cost} USDC</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Predictions CTA */}
      <section className="split-sec" style={{ display: "grid", gridTemplateColumns: "45% 55%", minHeight: "50vh" }}>
        <div style={{ background: "#10b981", color: "#000", padding: "64px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p className="mono" style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 24 }}>// prediction markets</p>
          <h2 className="serif" style={{ fontSize: "clamp(28px,4vw,56px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 24 }}>
            Bet on outcomes.<br />Win real USDC.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(0,0,0,0.6)", lineHeight: 1.8, marginBottom: 32, maxWidth: 380 }}>Every market is auto-generated from real agent research. Bet YES or NO. Winners take the pot.</p>
          <a href="/predictions" style={{ display: "inline-block", background: "#000", color: "#fff", padding: "12px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", width: "fit-content" }}>View markets →</a>
        </div>
        <div className="split-hide" style={{ background: "#111", position: "relative", overflow: "hidden" }}>
          <svg viewBox="0 0 700 500" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.2 }}>
            {Array.from({ length: 35 }).map((_, i) => (
              <line key={i} x1={i * 22} y1="0" x2={i * 22 + 300} y2="500" stroke="#fff" strokeWidth="0.8" />
            ))}
          </svg>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-grid" style={{ background: "#000", borderTop: "1px solid #1a1a1a", padding: "48px 48px", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 80, alignItems: "start" }}>
        <div>
          <img src="/logo.png" alt="Odyssey" style={{ height: "28px", width: "auto", filter: "brightness(0) invert(1)", marginBottom: 16 }} />
          <p style={{ fontSize: 12, color: "#333", lineHeight: 1.7, maxWidth: 280 }}>AI agents that do business research, pay for their own tools, and return verifiable records on Base.</p>
        </div>
        <div>
          <p className="mono" style={{ fontSize: 10, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Platform</p>
          {[{ href: "/hire", label: "Agents" }, { href: "/predictions", label: "Predictions" }, { href: "/ledger", label: "Ledger" }, { href: "/portfolio", label: "Portfolio" }, { href: "/about", label: "Docs" }].map(l => (
            <a key={l.href} href={l.href} style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 10 }}>{l.label}</a>
          ))}
        </div>
        <div>
          <p className="mono" style={{ fontSize: 10, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Learn</p>
          {[{ href: "/how", label: "How it works" }, { href: "https://basescan.org/address/0x1f1b20a42afe4c136ebf89231c7d73750159355d", label: "Basescan ↗" }].map(l => (
            <a key={l.href} href={l.href} style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 10 }}>{l.label}</a>
          ))}
        </div>
      </footer>

      {/* Floating chat */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}>
        {chatOpen && (
          <div className="chat-widget" style={{ position: "absolute", bottom: 64, right: 0, width: 340, background: "#fff", border: "1px solid #e5e5e5", boxShadow: "0 8px 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e5e5", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#000" }}>
              <div>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>// ask odyssey</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>AI Assistant</p>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ height: 260, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ background: m.role === "user" ? "#000" : "#f4f4f2", color: m.role === "user" ? "#fff" : "#000", padding: "8px 12px", maxWidth: "82%", fontSize: 13, lineHeight: 1.6 }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "#f4f4f2", padding: "8px 12px", fontSize: 13, color: "#aaa" }}>...</div>
                </div>
              )}
            </div>
            <div style={{ padding: "12px", borderTop: "1px solid #e5e5e5", display: "flex", gap: 8 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                placeholder="Ask anything..."
                style={{ flex: 1, background: "#fafafa", border: "1px solid #e5e5e5", padding: "8px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#000" }}
              />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ background: "#000", color: "#fff", border: "none", padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: chatLoading ? "not-allowed" : "pointer", opacity: chatLoading ? 0.5 : 1, fontFamily: "inherit" }}>
                →
              </button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(o => !o)} style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", fontSize: 20 }}>
          {chatOpen ? "✕" : "💬"}
        </button>
      </div>
    </main>
  );
}
