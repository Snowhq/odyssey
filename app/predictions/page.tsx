"use client";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

type Market = {
  id: string; question: string; category: string;
  createdAt: string; expiresAt: string; resolved: boolean;
  outcome: string | null; yesTotal: number; noTotal: number; bets: any[];
};

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? `${d}d left` : `${h}h left`;
}

const CAT: Record<string, { bg: string; color: string }> = {
  market:                  { bg: "rgba(99,102,241,0.08)",  color: "#4f46e5" },
  tech:                    { bg: "rgba(16,185,129,0.08)",  color: "#059669" },
  business:                { bg: "rgba(245,158,11,0.08)",  color: "#d97706" },
  finance:                 { bg: "rgba(99,102,241,0.08)",  color: "#4f46e5" },
  crypto:                  { bg: "rgba(251,191,36,0.08)",  color: "#d97706" },
  politics:                { bg: "rgba(239,68,68,0.08)",   color: "#dc2626" },
  education:               { bg: "rgba(16,185,129,0.08)",  color: "#059669" },
  entertainment:           { bg: "rgba(168,85,247,0.08)",  color: "#7c3aed" },
  "entertainment/media":   { bg: "rgba(168,85,247,0.08)",  color: "#7c3aed" },
  "business/governance":   { bg: "rgba(245,158,11,0.08)",  color: "#d97706" },
  "market/business":       { bg: "rgba(99,102,241,0.08)",  color: "#4f46e5" },
  "medical/tech":          { bg: "rgba(16,185,129,0.08)",  color: "#059669" },
  "politics/policy":       { bg: "rgba(239,68,68,0.08)",   color: "#dc2626" },
  "politics/approval":     { bg: "rgba(239,68,68,0.08)",   color: "#dc2626" },
  "politics/elections":    { bg: "rgba(239,68,68,0.08)",   color: "#dc2626" },
  publishing:              { bg: "rgba(236,72,153,0.08)",  color: "#db2777" },
  "publishing/literature": { bg: "rgba(236,72,153,0.08)",  color: "#db2777" },
  default:                 { bg: "rgba(0,0,0,0.04)",       color: "#666"    },
};

export default function PredictionsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved" | "my bets" | "live bets">("all");
  const { user } = usePrivy();
  const userId = user?.id || "anonymous";

  useEffect(() => {
    fetch("/api/predictions").then(r => r.json())
      .then(d => { setMarkets(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getOdds = (m: Market) => {
    const total = m.yesTotal + m.noTotal;
    if (total === 0) return { yes: 50, no: 50, total: 0 };
    return { yes: Math.round((m.yesTotal / total) * 100), no: Math.round((m.noTotal / total) * 100), total };
  };

  const filtered = markets.filter(m => {
  if (filter === "open") return !m.resolved;
  if (filter === "resolved") return m.resolved;
  if (filter === "my bets") return m.bets.some((b: any) => b.userId === userId);
  if (filter === "live bets") return m.bets.length > 0;
  return true;
});

  const totalVol = markets.reduce((a, m) => a + m.yesTotal + m.noTotal, 0);

  return (
    <main style={{ minHeight: "100vh", background: "#fff", color: "#000", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        .mono { font-family: 'Space Mono', monospace; }
        .nav-a { color: #999; font-size: 13px; transition: color 0.2s; }
        .nav-a:hover { color: #000; }
        .mcard { border: 1px solid #e5e5e5; background: #fff; transition: border-color 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; }
        .mcard:hover { border-color: #000; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .tab-btn { cursor: pointer; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 18px; border: none; transition: all 0.15s; background: transparent; }
        .yes-btn { background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.25); color: #059669; padding: 8px 16px; font-size: 11px; font-weight: 700; cursor: pointer; letter-spacing: 0.05em; transition: background 0.15s; font-family: inherit; }
        .yes-btn:hover { background: rgba(5,150,105,0.15); }
        .no-btn { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25); color: #dc2626; padding: 8px 16px; font-size: 11px; font-weight: 700; cursor: pointer; letter-spacing: 0.05em; transition: background 0.15s; font-family: inherit; }
        .no-btn:hover { background: rgba(220,38,38,0.15); }
        .bar-yes { background: #059669; }
        .bar-no { background: #dc2626; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 56, borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", zIndex: 100 }}>
        <a href="/"><img src="/logo.png" alt="Odyssey" style={{ height: "28px", width: "auto" }} /></a>
        <div style={{ display: "flex", gap: 32 }}>
          <a href="/ledger" className="nav-a">Ledger</a>
          <a href="/portfolio" className="nav-a">My bets</a>
          <a href="/hire" style={{ background: "#000", color: "#fff", padding: "8px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Hire an agent →</a>
        </div>
      </nav>

      {/* Header */}
      <section style={{ padding: "72px 48px 56px", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <a href="/" style={{ color: "#aaa", fontSize: 12, display: "inline-block", marginBottom: 32, letterSpacing: "0.05em" }}>← Back</a>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 32, marginBottom: 40 }}>
            <div>
              <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20 }}>// prediction markets</p>
              <h1 className="serif" style={{ fontSize: "clamp(44px,7vw,88px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.92, color: "#000" }}>
                Prediction<br />Markets.
              </h1>
            </div>
            <div style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
              <div style={{ textAlign: "right" }}>
                <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Volume</p>
                <p className="serif" style={{ fontSize: 36, fontWeight: 700, color: "#000" }}>${totalVol.toFixed(2)}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Markets</p>
                <p className="serif" style={{ fontSize: 36, fontWeight: 700, color: "#000" }}>{markets.length}</p>
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e5e5e5", marginBottom: 0 }}>
            {(["all", "open", "resolved", "my bets", "live bets"] as const).map(f => (
              <button key={f} className="tab-btn" onClick={() => setFilter(f)} style={{
                color: filter === f ? "#000" : "#aaa",
                borderBottom: filter === f ? "2px solid #000" : "2px solid transparent",
              }}>{f}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Markets grid */}
      <section style={{ padding: "48px 48px 100px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ height: 220, background: "#f5f5f5", border: "1px solid #e5e5e5", opacity: 1 - i * 0.12 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 0", borderTop: "1px solid #e5e5e5" }}>
              <p className="mono" style={{ color: "#aaa", fontSize: 11, letterSpacing: "0.1em", marginBottom: 24 }}>// no markets</p>
              <p style={{ color: "#aaa", fontSize: 15, marginBottom: 40 }}>Run a research job to generate prediction markets.</p>
              <a href="/hire" style={{ display: "inline-block", background: "#000", color: "#fff", padding: "12px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Start a job →</a>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {filtered.map((m, idx) => {
                const odds = getOdds(m);
                const cat = CAT[m.category] || CAT.default;
                return (
                  <div key={m.id} className="mcard" style={{ animation: `fadeUp 0.3s ease ${idx * 0.04}s both` }}>
                    {/* Card top */}
                    <a href={`/predictions/${m.id}`} style={{ display: "block", padding: "24px 24px 20px", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span className="mono" style={{ background: cat.bg, color: cat.color, padding: "3px 8px", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", border: `1px solid ${cat.color}33` }}>
                            {m.category}
                          </span>
                          {m.resolved && <span className="mono" style={{ background: "#f0fdf4", color: "#15803d", padding: "3px 8px", fontSize: 9, border: "1px solid #bbf7d0" }}>✓ resolved</span>}
                        </div>
                        <span className="mono" style={{ fontSize: 9, color: "#aaa", letterSpacing: "0.05em", flexShrink: 0 }}>{timeLeft(m.expiresAt)}</span>
                      </div>

                      <p style={{ fontSize: 14, fontWeight: 500, color: "#000", lineHeight: 1.55, marginBottom: 20 }}>{m.question}</p>

                      {/* Odds bar */}
                      <div style={{ display: "flex", height: 3, marginBottom: 10, background: "#f0f0f0" }}>
                        <div className="bar-yes" style={{ width: `${odds.yes}%` }} />
                        <div className="bar-no" style={{ width: `${odds.no}%` }} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 16 }}>
                          <span className="mono" style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>YES {odds.yes}%</span>
                          <span className="mono" style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>NO {odds.no}%</span>
                        </div>
                        <span className="mono" style={{ fontSize: 9, color: "#aaa" }}>{m.bets.length} bets · ${odds.total.toFixed(2)}</span>
                      </div>
                    </a>

                    {/* Card bottom — bet buttons */}
                    {!m.resolved && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #e5e5e5" }}>
                        <a href={`/predictions/${m.id}`}>
                          <button className="yes-btn" style={{ width: "100%", borderRadius: 0, borderLeft: "none", borderBottom: "none", borderTop: "none" }}>
                            Buy YES
                          </button>
                        </a>
                        <a href={`/predictions/${m.id}`}>
                          <button className="no-btn" style={{ width: "100%", borderRadius: 0, borderRight: "none", borderBottom: "none", borderTop: "none" }}>
                            Buy NO
                          </button>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && markets.length > 0 && (
            <div style={{ marginTop: 48, textAlign: "center" }}>
              <a href="/hire" style={{ color: "#aaa", fontSize: 12, letterSpacing: "0.05em" }}>Generate more markets from a new research job →</a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}