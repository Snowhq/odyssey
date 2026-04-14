"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

type TxEntry = { tool: string; action: string; cost: string; status: "success" | "error"; };

function ResultContent() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [followUpAgent, setFollowUpAgent] = useState<any>(null);
  const params = useSearchParams();
  const service = params.get("service");
  const brief = params.get("brief");
  const amount = params.get("amount");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [spend, setSpend] = useState("0.00");
  const [txLog, setTxLog] = useState<TxEntry[]>([]);
  const [dots, setDots] = useState(".");
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"report" | "transactions">("report");

  const steps = ["Calling Brave Search...", "Running semantic search with Exa...", "Synthesizing with Claude...", "Finalizing report..."];

  useEffect(() => {
    if (!loading) return;
    const dotInterval = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    const stepInterval = setInterval(() => setStep(s => s < steps.length - 1 ? s + 1 : s), 4000);
    return () => { clearInterval(dotInterval); clearInterval(stepInterval); };
  }, [loading]);

  useEffect(() => {
    if (!brief || !service) return;
    fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service, brief }) })
      .then(r => r.json())
      .then(data => {
        setResult(data.result || "No result returned.");
        setSpend(data.spend || "0.00");
        setTxLog(data.txLog || []);
        setLoading(false);
        if (data.followUpAgent) setFollowUpAgent(data.followUpAgent);
        if (data.result && service && brief) {
          fetch("/api/predictions/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobResult: data.result, brief, service }) })
            .then(r => r.json()).then(d => { if (d.markets) setPredictions(d.markets); });
        }
      });
  }, [brief, service]);

  const profit = (parseFloat(amount || "0") - parseFloat(spend)).toFixed(4);
  const profitNum = parseFloat(profit);

  function renderResult(text: string) {
    return text.split("\n").filter(line => !line.startsWith("#")).map((line, i) => {
      if (line.trim() === "") return <div key={i} style={{ height: 16 }} />;
      return <p key={i} style={{ margin: "0 0 20px", color: "#444", lineHeight: 1.9, fontSize: 15, fontWeight: 400 }}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
    });
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fff", color: "#000", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        .mono { font-family: 'Space Mono', monospace; }
        .tab { cursor: pointer; transition: all 0.15s; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 20px; border: none; background: transparent; }
        .tab.active { color: #000; border-bottom: 2px solid #000; }
        .tab.inactive { color: #aaa; border-bottom: 2px solid transparent; }
        .tab:hover { color: #666; }
        .market-card { border: 1px solid #e5e5e5; transition: border-color 0.2s; display: block; padding: 24px; }
        .market-card:hover { border-color: #000; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 56, borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", zIndex: 100 }}>
        <a href="/"><img src="/logo.png" alt="Odyssey" style={{ height: "28px", width: "auto" }} /></a>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {loading && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5555ff", animation: "pulse 1.2s infinite" }} />}
          <span className="mono" style={{ color: loading ? "#5555ff" : "#059669", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
            {loading ? "Agent running" : "Complete"}
          </span>
        </div>
        <a href="/ledger" style={{ color: "#aaa", fontSize: 13 }}>Agent Ledger</a>
      </nav>

      <section style={{ padding: "64px 48px 0", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <a href="/hire" style={{ color: "#aaa", fontSize: 12, display: "inline-block", marginBottom: 32, letterSpacing: "0.05em" }}>← Back</a>

          {/* P&L cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "#e5e5e5", marginBottom: 48 }}>
            {[
              { label: "Revenue", value: "$" + amount, sub: "Paid by user", color: "#000", bg: "#fff" },
              { label: "Spent", value: "$" + spend, sub: "API costs on Base", color: "#dc2626", bg: "#fef2f2" },
              { label: "Profit", value: "$" + profit, sub: profitNum >= 0 ? "Retained" : "Over budget", color: profitNum >= 0 ? "#15803d" : "#dc2626", bg: profitNum >= 0 ? "#f0fdf4" : "#fef2f2" },
            ].map(m => (
              <div key={m.label} style={{ background: m.bg, padding: "24px 28px" }}>
                <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{m.label}</p>
                <p className="serif" style={{ fontSize: 36, fontWeight: 700, color: m.color, marginBottom: 6 }}>{m.value}</p>
                <p style={{ fontSize: 11, color: "#aaa" }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Job info */}
          <div style={{ paddingBottom: 32 }}>
            <p className="mono" style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              {loading ? "// running" : "// complete"}
            </p>
            <h1 className="serif" style={{ fontSize: "clamp(32px,5vw,64px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.95, color: "#000", marginBottom: 16 }}>
              {loading ? "Agent running" + dots : "Job complete."}
            </h1>
            <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.7, maxWidth: 640 }}>{brief}</p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", marginTop: 32 }}>
            <button className={`tab ${activeTab === "report" ? "active" : "inactive"}`} onClick={() => setActiveTab("report")}>Research report</button>
            <button className={`tab ${activeTab === "transactions" ? "active" : "inactive"}`} onClick={() => setActiveTab("transactions")}>
              Transactions {txLog.length > 0 ? `(${txLog.length})` : ""}
            </button>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 48px 80px" }}>

        {activeTab === "report" && (
          <div>
            {loading ? (
              <div style={{ padding: "40px 0" }}>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, opacity: i <= step ? 1 : 0.12, transition: "opacity 0.5s ease" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: i < step ? "#059669" : i === step ? "#5555ff" : "#e5e5e5", flexShrink: 0, transition: "background 0.3s" }} />
                    <p style={{ fontSize: 14, color: i < step ? "#aaa" : i === step ? "#000" : "#ccc", fontWeight: i === step ? 500 : 400 }}>
                      {i < step ? s.replace("...", " — done") : s}
                    </p>
                  </div>
                ))}
                <p className="mono" style={{ color: "#ddd", fontSize: 10, marginTop: 48, letterSpacing: "0.1em" }}>USDC payments executing from agent wallet on Base</p>
              </div>
            ) : (
              <div style={{ maxWidth: 760 }}>{renderResult(result)}</div>
            )}

            {/* Prediction markets */}
            {!loading && predictions.length > 0 && (
              <div style={{ marginTop: 80, paddingTop: 64, borderTop: "1px solid #e5e5e5" }}>
                <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 24 }}>// prediction markets generated</p>
                <h2 className="serif" style={{ fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 700, color: "#000", marginBottom: 8, letterSpacing: "-0.02em" }}>Bet on the findings.</h2>
                <p style={{ color: "#aaa", fontSize: 14, marginBottom: 40 }}>These markets were auto-generated from your research. Bet USDC on outcomes.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 32 }}>
                  {predictions.map(m => (
                    <a key={m.id} href={`/predictions/${m.id}`} className="market-card">
                      <p style={{ fontSize: 13, color: "#333", lineHeight: 1.6, marginBottom: 20, minHeight: 60 }}>{m.question}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ background: "#f0fdf4", color: "#15803d", padding: "5px 14px", fontSize: 11, fontWeight: 700, border: "1px solid #bbf7d0" }}>YES</span>
                        <span style={{ background: "#fef2f2", color: "#b91c1c", padding: "5px 14px", fontSize: 11, fontWeight: 700, border: "1px solid #fecaca" }}>NO</span>
                      </div>
                    </a>
                  ))}
                </div>
                <a href="/predictions" style={{ color: "#000", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", borderBottom: "1px solid #000", paddingBottom: 2 }}>View all markets →</a>
              </div>
            )}

            {/* Multi-agent suggestion */}
            {!loading && followUpAgent && (
              <div style={{ marginTop: 48, padding: 32, background: "#f5f5ff", border: "1px solid #e0e0ff" }}>
                <p className="mono" style={{ fontSize: 10, color: "#5555ff", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>
                  // agent recommendation
                </p>
                <h3 className="serif" style={{ fontSize: 24, fontWeight: 700, color: "#000", marginBottom: 12 }}>
                  Agent identified: {followUpAgent.company}
                </h3>
                <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                  {followUpAgent.suggestion} Run a deeper competitive analysis automatically.
                </p>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <a href={`/hire?service=${followUpAgent.serviceId}&brief=${encodeURIComponent(followUpAgent.briefTemplate)}`}
                    style={{ display: "inline-block", background: "#5555ff", color: "#fff", padding: "12px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    Run competitor intel on {followUpAgent.company} →
                  </a>
                  <span className="mono" style={{ fontSize: 11, color: "#aaa" }}>{followUpAgent.cost}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            {txLog.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: 14, padding: "40px 0" }}>No transactions recorded yet.</p>
            ) : (
              <>
                {txLog.map((tx, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: tx.status === "success" ? "#059669" : "#dc2626", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 14, color: "#000", fontWeight: 500, marginBottom: 4 }}>{tx.tool}</p>
                        <p className="mono" style={{ fontSize: 10, color: "#aaa" }}>{tx.action}</p>
                      </div>
                    </div>
                    <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: tx.status === "success" ? "#dc2626" : "#aaa" }}>
                      {tx.status === "success" ? "-$" + tx.cost : "--"}
                    </p>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 0", borderTop: "1px solid #e5e5e5", marginTop: 8 }}>
                  <p style={{ fontSize: 13, color: "#aaa" }}>Total spent from agent wallet</p>
                  <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#5555ff" }}>-${spend} USDC</p>
                </div>
                <div style={{ marginTop: 32 }}>
                  <a href="/ledger" style={{ color: "#000", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", borderBottom: "1px solid #000", paddingBottom: 2 }}>View full ledger →</a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResultPage() {
  return <Suspense><ResultContent /></Suspense>;
}