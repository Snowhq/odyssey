"use client";
import { useState, useEffect } from "react";

const SERVICES = [
  { id: "competitor-intel", name: "Competitor Intelligence", description: "Describe your product and target market. The agent finds your top rivals, reads their websites, and tells you where the gaps are.", price: "0.1", tools: ["Brave Search", "Exa", "Claude"], time: "~2 min", placeholder: "I am building an AI project management tool for remote teams. Who are my top competitors and where are the gaps?" },
  { id: "lead-gen", name: "Lead Generation", description: "Define your ideal customer. The agent finds 10 real matching companies, gathers contact details, and writes personalized outreach for each.", price: "0.2", tools: ["Exa", "Apollo", "Claude"], time: "~3 min", placeholder: "Find me 10 Series A SaaS startups in the US that need better payment infrastructure." },
  { id: "market-research", name: "Market Research", description: "Name a topic or industry. The agent scans the web for what is happening right now and returns a brief you can act on.", price: "0.05", tools: ["Brave Search", "Claude"], time: "~90 sec", placeholder: "What is happening in the AI agent space right now? What should founders pay attention to in 2026?" },
];

export default function HirePage() {
  const [selected, setSelected] = useState(SERVICES[0]);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [controls, setControls] = useState({ balance: "0.00", allowance: null as string | null, max_tx: null as string | null });

  useEffect(() => {
    fetch("/api/controls").then(r => r.json()).then(d => setControls(d)).catch(() => {});
  }, []);

  async function handleCheckout() {
    setError("");
    if (!brief.trim() || brief.trim().length < 10) { setError("Please describe your task in more detail."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId: selected.id, brief }) });
      const data = await res.json();
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else setError(data.error || "Something went wrong.");
    } catch { setError("Error connecting to server."); }
    finally { setLoading(false); }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fff", color: "#000", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        .mono { font-family: 'Space Mono', monospace; }
        .nav-a { color: #999; font-size: 13px; transition: color 0.2s; }
        .nav-a:hover { color: #000; }
        textarea:focus { outline: none; border-color: #000 !important; }
        textarea { resize: vertical; }
        .svc-item { border-top: 1px solid #e5e5e5; cursor: pointer; transition: background 0.15s; }
        .svc-item:hover { background: #fafafa; }
        .exec-btn:hover:not(:disabled) { opacity: 0.85; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 56, borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", zIndex: 100 }}>
        <a href="/"><img src="/logo.png" alt="Odyssey" style={{ height: "28px", width: "auto" }} /></a>
        <div style={{ display: "flex", gap: 36 }}>
          <a href="/how" className="nav-a">How it works</a>
          <a href="/ledger" className="nav-a">Ledger</a>
          <a href="/predictions" className="nav-a">Predictions</a>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 48px" }}>

        <a href="/" style={{ color: "#aaa", fontSize: 12, display: "inline-block", marginBottom: 40, letterSpacing: "0.05em" }}>← Back</a>

        {/* Wallet bar */}
        <div style={{ borderBottom: "1px solid #e5e5e5", paddingBottom: 40, marginBottom: 72, display: "flex", gap: 64, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>Agent wallet</p>
            <p className="serif" style={{ fontSize: 36, fontWeight: 700, color: "#000" }}>${parseFloat(controls.balance).toFixed(4)}</p>
          </div>
          <div>
            <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>Allowance</p>
            <p className="serif" style={{ fontSize: 36, fontWeight: 700, color: "#000" }}>{controls.allowance ? "$" + controls.allowance : "∞"}</p>
          </div>
          <div>
            <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>Max per tx</p>
            <p className="serif" style={{ fontSize: 36, fontWeight: 700, color: "#000" }}>{controls.max_tx ? "$" + controls.max_tx : "∞"}</p>
          </div>
          <a href="/ledger" style={{ marginLeft: "auto", color: "#000", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", textDecoration: "underline" }}>View ledger →</a>
        </div>

        <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20 }}>// start a job</p>
        <h1 className="serif" style={{ fontSize: "clamp(48px,7vw,88px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: 72, color: "#000" }}>
          Pick an agent.<br />Pay once.
        </h1>

        {/* Service list */}
        <div style={{ marginBottom: 64 }}>
          {SERVICES.map((s, i) => (
            <div
              key={s.id}
              className="svc-item"
              onClick={() => { setSelected(s); setBrief(""); setError(""); }}
              style={{
                padding: "32px 0",
                display: "grid",
                gridTemplateColumns: "48px 1fr 120px",
                gap: 32,
                alignItems: "center",
                background: selected.id === s.id ? "#f5f5f5" : "transparent",
                paddingLeft: selected.id === s.id ? 20 : 0,
                borderLeft: selected.id === s.id ? "2px solid #000" : "2px solid transparent",
              }}
            >
              <p className="mono" style={{ fontSize: 11, color: selected.id === s.id ? "#000" : "#ccc", letterSpacing: "0.1em" }}>0{i + 1}</p>
              <div>
                <h3 className="serif" style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 700, color: "#000", letterSpacing: "-0.02em", marginBottom: 8 }}>{s.name}</h3>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, maxWidth: 560 }}>{s.description}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {s.tools.map(t => (
                    <span key={t} className="mono" style={{ fontSize: 10, color: selected.id === s.id ? "#000" : "#aaa", border: `1px solid ${selected.id === s.id ? "#000" : "#e5e5e5"}`, padding: "3px 8px", letterSpacing: "0.05em" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="serif" style={{ fontSize: 28, fontWeight: 700, color: "#000", whiteSpace: "nowrap" }}>${s.price}</p>
                <p className="mono" style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>{s.time}</p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #e5e5e5" }} />
        </div>

        {/* Brief input */}
        <div style={{ borderTop: "2px solid #000", paddingTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, gap: 20, flexWrap: "wrap" }}>
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 700, color: "#000" }}>{selected.name}</h2>
            <p className="mono" style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.08em" }}>{selected.tools.join(" · ")} · {selected.time}</p>
          </div>
          <textarea
            value={brief}
            onChange={e => { setBrief(e.target.value); setError(""); }}
            placeholder={selected.placeholder}
            rows={6}
            style={{ width: "100%", background: "#fafafa", border: error ? "1px solid #dc2626" : "1px solid #e5e5e5", padding: "20px", color: "#000", fontSize: 15, fontFamily: "inherit", lineHeight: 1.7, marginBottom: error ? 8 : 32 }}
          />
          {error && <p className="mono" style={{ color: "#dc2626", fontSize: 11, marginBottom: 24 }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
            <div>
              <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Total cost</p>
              <p className="serif" style={{ fontSize: 44, fontWeight: 700, color: "#000" }}>${selected.price}</p>
            </div>
            <button
              className="exec-btn"
              onClick={handleCheckout}
              disabled={loading}
              style={{ background: "#000", color: "#fff", border: "none", padding: "16px 44px", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, fontFamily: "inherit" }}
            >
              {loading ? "Processing..." : "Execute agent →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}