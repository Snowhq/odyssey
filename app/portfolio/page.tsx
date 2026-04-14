"use client";
import { useEffect, useState } from "react";

type Market = {
  id: string; question: string; category: string;
  expiresAt: string; resolved: boolean; outcome: string | null;
  yesTotal: number; noTotal: number; bets: any[];
};

export default function PortfolioPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictions").then(r => r.json()).then(data => {
      setMarkets(Array.isArray(data) ? data.filter((m: Market) => m.bets.length > 0) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalBet = markets.reduce((acc, m) => acc + m.bets.reduce((a: number, b: any) => a + b.amount, 0), 0);
  const activeBets = markets.filter(m => !m.resolved);
  const resolvedBets = markets.filter(m => m.resolved);

  function getOdds(m: Market) {
    const total = m.yesTotal + m.noTotal;
    if (total === 0) return { yes: 50, no: 50 };
    return { yes: Math.round((m.yesTotal / total) * 100), no: Math.round((m.noTotal / total) * 100) };
  }

  function potentialWin(m: Market, bet: any) {
    const total = m.yesTotal + m.noTotal;
    const pool = bet.side === "yes" ? m.yesTotal : m.noTotal;
    if (pool === 0) return (bet.amount * 2).toFixed(3);
    return ((bet.amount / pool) * total).toFixed(3);
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
        .bet-row { border-bottom: 1px solid #f0f0f0; transition: background 0.15s; display: grid; grid-template-columns: 1fr 120px 120px 120px; gap: 24px; align-items: center; padding: 20px 0; }
        .bet-row:hover { background: #fafafa; }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 56, borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <a href="/"><img src="/logo.png" alt="Odyssey" style={{ height: "28px", width: "auto" }} /></a>
        <div style={{ display: "flex", gap: 36 }}>
          <a href="/predictions" className="nav-a">Markets</a>
          <a href="/hire" className="nav-a">Agents</a>
          <a href="/ledger" className="nav-a">Ledger</a>
        </div>
        <a href="/hire" style={{ background: "#000", color: "#fff", padding: "8px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Hire an agent →</a>
      </nav>

      <section style={{ padding: "80px 48px 0", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <a href="/predictions" style={{ color: "#aaa", fontSize: 12, display: "inline-block", marginBottom: 40, letterSpacing: "0.05em" }}>← Back to markets</a>
          <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20 }}>// portfolio</p>
          <h1 className="serif" style={{ fontSize: "clamp(52px,9vw,100px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.9, color: "#000", marginBottom: 20 }}>
            My Bets.
          </h1>
          <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.7, paddingBottom: 48 }}>Your active and resolved prediction market positions.</p>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          {[
            { label: "Total wagered", value: "$" + totalBet.toFixed(2), color: "#000" },
            { label: "Active positions", value: activeBets.length.toString(), color: "#000" },
            { label: "Resolved", value: resolvedBets.length.toString(), color: "#059669" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "40px 48px", borderRight: i < 2 ? "1px solid #e5e5e5" : "none" }}>
              <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{s.label}</p>
              <p className="serif" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 48px 100px" }}>
        {loading ? (
          <p className="mono" style={{ color: "#aaa", fontSize: 11, padding: "48px 0", letterSpacing: "0.1em" }}>Loading...</p>
        ) : markets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#aaa", fontSize: 15, marginBottom: 24 }}>No bets placed yet.</p>
            <a href="/predictions" style={{ display: "inline-block", background: "#000", color: "#fff", padding: "10px 24px", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>View markets →</a>
          </div>
        ) : (
          <>
            {activeBets.length > 0 && (
              <div style={{ marginBottom: 64 }}>
                <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 0, paddingBottom: 16, borderBottom: "1px solid #e5e5e5" }}>Active positions</p>
                {activeBets.map(m => m.bets.map((bet, i) => (
                  <a key={`${m.id}-${i}`} href={`/predictions/${m.id}`} className="bet-row" style={{ textDecoration: "none" }}>
                    <div>
                      <p style={{ fontSize: 14, color: "#000", fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>{m.question}</p>
                      <p className="mono" style={{ fontSize: 10, color: "#aaa" }}>Expires {new Date(m.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="mono" style={{ fontSize: 10, color: "#aaa", marginBottom: 4 }}>Position</p>
                      <span style={{ background: bet.side === "yes" ? "#f0fdf4" : "#fef2f2", color: bet.side === "yes" ? "#15803d" : "#b91c1c", padding: "4px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${bet.side === "yes" ? "#bbf7d0" : "#fecaca"}` }}>
                        {bet.side.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="mono" style={{ fontSize: 10, color: "#aaa", marginBottom: 4 }}>Wagered</p>
                      <p className="serif" style={{ fontSize: 20, fontWeight: 700, color: "#000" }}>${bet.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="mono" style={{ fontSize: 10, color: "#aaa", marginBottom: 4 }}>To win</p>
                      <p className="serif" style={{ fontSize: 20, fontWeight: 700, color: "#059669" }}>${potentialWin(m, bet)}</p>
                    </div>
                  </a>
                )))}
                <div style={{ borderTop: "1px solid #e5e5e5" }} />
              </div>
            )}

            {resolvedBets.length > 0 && (
              <div>
                <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 0, paddingBottom: 16, borderBottom: "1px solid #e5e5e5" }}>Resolved positions</p>
                {resolvedBets.map(m => m.bets.map((bet, i) => {
                  const won = bet.side === m.outcome;
                  return (
                    <a key={`${m.id}-${i}`} href={`/predictions/${m.id}`} className="bet-row" style={{ textDecoration: "none" }}>
                      <div>
                        <p style={{ fontSize: 14, color: won ? "#000" : "#aaa", fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>{m.question}</p>
                        <p className="mono" style={{ fontSize: 10, color: "#aaa" }}>Resolved {m.outcome?.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="mono" style={{ fontSize: 10, color: "#aaa", marginBottom: 4 }}>Position</p>
                        <span style={{ background: bet.side === "yes" ? "#f0fdf4" : "#fef2f2", color: bet.side === "yes" ? "#15803d" : "#b91c1c", padding: "4px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${bet.side === "yes" ? "#bbf7d0" : "#fecaca"}` }}>
                          {bet.side.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="mono" style={{ fontSize: 10, color: "#aaa", marginBottom: 4 }}>Wagered</p>
                        <p className="serif" style={{ fontSize: 20, fontWeight: 700, color: won ? "#000" : "#aaa" }}>${bet.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="mono" style={{ fontSize: 10, color: "#aaa", marginBottom: 4 }}>Result</p>
                        <p className="serif" style={{ fontSize: 20, fontWeight: 700, color: won ? "#059669" : "#dc2626" }}>{won ? "Won ✓" : "Lost ✗"}</p>
                      </div>
                    </a>
                  );
                }))}
                <div style={{ borderTop: "1px solid #e5e5e5" }} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}