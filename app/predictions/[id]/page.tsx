"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Bet = { side: string; amount: number; paidAt: string; txHash: string | null };
type Market = {
  id: string; question: string; category: string; brief: string;
  createdAt: string; expiresAt: string; resolved: boolean; outcome: string | null;
  yesTotal: number; noTotal: number; bets: Bet[];
};

const PRESETS = ["0.05", "0.10", "0.25", "0.50", "1.00"];

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  market: { bg: "rgba(99,102,241,0.1)", color: "#4f46e5" },
  tech: { bg: "rgba(16,185,129,0.1)", color: "#059669" },
  business: { bg: "rgba(245,158,11,0.1)", color: "#d97706" },
  finance: { bg: "rgba(99,102,241,0.1)", color: "#4f46e5" },
  crypto: { bg: "rgba(251,191,36,0.1)", color: "#d97706" },
  politics: { bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
  education: { bg: "rgba(16,185,129,0.1)", color: "#059669" },
  entertainment: { bg: "rgba(168,85,247,0.1)", color: "#7c3aed" },
  "entertainment/media": { bg: "rgba(168,85,247,0.1)", color: "#7c3aed" },
  "business/governance": { bg: "rgba(245,158,11,0.1)", color: "#d97706" },
  "market/business": { bg: "rgba(99,102,241,0.1)", color: "#4f46e5" },
  "medical/tech": { bg: "rgba(16,185,129,0.1)", color: "#059669" },
  "politics/policy": { bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
  "politics/approval": { bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
  "politics/elections": { bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
  publishing: { bg: "rgba(236,72,153,0.1)", color: "#db2777" },
  "publishing/literature": { bg: "rgba(236,72,153,0.1)", color: "#db2777" },
  default: { bg: "rgba(0,0,0,0.05)", color: "#666" },
};

function MarketContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const justBet = searchParams.get("success") === "true";
  const betSide = searchParams.get("bet");
  const betAmt = searchParams.get("amount");

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("0.10");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [resolving, setResolving] = useState(false);

  function loadMarket() {
    fetch("/api/predictions").then(r => r.json()).then(data => {
      const found = data.find((m: Market) => m.id === id);
      setMarket(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { loadMarket(); }, [id]);

  useEffect(() => {
    if (justBet && betSide && betAmt && !confirmed) {
      setConfirmed(true);
      fetch("/api/predictions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: id, side: betSide, amount: parseFloat(betAmt) }),
      }).then(() => loadMarket());
    }
  }, [justBet, betSide, betAmt, id, confirmed]);

  async function placeBet(side: "yes" | "no") {
    setError("");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0.01) { setError("Minimum bet is $0.01 USDC"); return; }
    setPlacing(true);
    try {
      const res = await fetch("/api/predictions/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: id, side, amount: amt }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error || "Something went wrong.");
        setPlacing(false);
      }
    } catch {
      setError("Could not connect to server.");
      setPlacing(false);
    }
  }

  async function resolveMarket(outcome: "yes" | "no") {
    setResolving(true);
    await fetch("/api/predictions/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: id, outcome }),
    });
    setResolving(false);
    loadMarket();
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#999", fontSize: 14 }}>Loading market...</p>
    </main>
  );

  if (!market) return (
    <main style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <p style={{ color: "#666", fontSize: 15 }}>Market not found.</p>
      <a href="/predictions" style={{ color: "#5555ff", fontSize: 13, fontWeight: 600 }}>← Back to markets</a>
    </main>
  );

  const total = market.yesTotal + market.noTotal;
  const yesPct = total === 0 ? 50 : Math.round((market.yesTotal / total) * 100);
  const noPct = 100 - yesPct;
  const cat = CAT_STYLE[market.category] || CAT_STYLE.default;
  const isExpired = new Date(market.expiresAt).getTime() < Date.now();

  const potentialPayout = (side: "yes" | "no") => {
    const pool = side === "yes" ? market.yesTotal : market.noTotal;
    const mult = pool === 0 ? 2 : total / pool;
    return (parseFloat(amount || "0") * mult).toFixed(3);
  };

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
        .yes-btn { background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.3); color: #059669; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .yes-btn:hover:not(:disabled) { background: rgba(5,150,105,0.15); }
        .no-btn { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.3); color: #dc2626; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .no-btn:hover:not(:disabled) { background: rgba(220,38,38,0.15); }
        .preset { cursor: pointer; font-family: inherit; transition: all 0.12s; background: #fff; }
        .preset:hover { border-color: #000 !important; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        .bar-yes { background: #059669; }
        .bar-no { background: #dc2626; }
        .bet-row { border-bottom: 1px solid #f0f0f0; }
        .bet-row:hover { background: #fafafa; }
        .resolve-btn { cursor: pointer; font-family: inherit; font-weight: 700; font-size: 12px; padding: 10px 20px; letter-spacing: 0.05em; text-transform: uppercase; border: none; transition: opacity 0.15s; }
        .resolve-btn:hover:not(:disabled) { opacity: 0.8; }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 56, borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <a href="/"><img src="/logo.png" alt="Odyssey" style={{ height: "28px", width: "auto" }} /></a>
        <div style={{ display: "flex", gap: 32 }}>
          <a href="/predictions" className="nav-a">All markets</a>
          <a href="/portfolio" className="nav-a">My bets</a>
        </div>
        <a href="/hire" style={{ background: "#000", color: "#fff", padding: "8px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Hire an agent →</a>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 48px 100px" }}>
        <a href="/predictions" style={{ color: "#999", fontSize: 12, display: "inline-block", marginBottom: 40, letterSpacing: "0.05em" }}>← Back to markets</a>

        {justBet && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <span>✅</span>
            <div>
              <p style={{ color: "#15803d", fontWeight: 700, fontSize: 14 }}>Bet confirmed — {betSide?.toUpperCase()} ${betAmt} USDC</p>
              <p style={{ color: "#86efac", fontSize: 12, marginTop: 2 }}>Payment processed via Locus · recorded on Base</p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ background: cat.bg, color: cat.color, padding: "3px 9px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", border: `1px solid ${cat.color}33` }}>
              {market.category}
            </span>
            {market.resolved && (
              <span style={{ background: "#f0fdf4", color: "#15803d", padding: "3px 9px", fontSize: 10, fontWeight: 700, border: "1px solid #bbf7d0" }}>
                ✓ Resolved — {market.outcome?.toUpperCase()} won
              </span>
            )}
            {!market.resolved && isExpired && (
              <span style={{ background: "#fffbeb", color: "#d97706", padding: "3px 9px", fontSize: 10, fontWeight: 700, border: "1px solid #fde68a" }}>
                Expired — pending resolution
              </span>
            )}
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(24px,3.5vw,44px)", fontWeight: 700, lineHeight: 1.2, color: "#000", letterSpacing: "-0.02em", marginBottom: 12 }}>
            {market.question}
          </h1>
          <p className="mono" style={{ color: "#aaa", fontSize: 10, letterSpacing: "0.05em" }}>
            From: {market.brief} · Expires {new Date(market.expiresAt).toLocaleDateString()}
          </p>
        </div>

        {!market.resolved && isExpired && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "20px 24px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p className="mono" style={{ fontSize: 10, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>// market expired</p>
              <p style={{ color: "#666", fontSize: 13 }}>Resolve this market to pay out winners.</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="resolve-btn" disabled={resolving} onClick={() => resolveMarket("yes")} style={{ background: "#059669", color: "#fff", opacity: resolving ? 0.5 : 1 }}>
                {resolving ? "..." : "Resolve YES ✓"}
              </button>
              <button className="resolve-btn" disabled={resolving} onClick={() => resolveMarket("no")} style={{ background: "#dc2626", color: "#fff", opacity: resolving ? 0.5 : 1 }}>
                {resolving ? "..." : "Resolve NO ✗"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "#e5e5e5", marginBottom: 24 }}>
              {[
                { label: "Total pot", value: `$${total.toFixed(2)}`, color: "#000" },
                { label: "YES pool", value: `$${market.yesTotal.toFixed(2)}`, color: "#059669" },
                { label: "NO pool", value: `$${market.noTotal.toFixed(2)}`, color: "#dc2626" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", padding: "20px 24px" }}>
                  <p className="mono" style={{ color: "#aaa", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</p>
                  <p className="serif" style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #e5e5e5", padding: 24, marginBottom: 20 }}>
              <p className="mono" style={{ color: "#aaa", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Current odds</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span className="serif" style={{ fontSize: 36, fontWeight: 700, color: "#059669" }}>{yesPct}%</span>
                <span className="serif" style={{ fontSize: 36, fontWeight: 700, color: "#dc2626" }}>{noPct}%</span>
              </div>
              <div style={{ display: "flex", height: 6, background: "#f0f0f0" }}>
                <div className="bar-yes" style={{ width: `${yesPct}%`, transition: "width 0.7s ease" }} />
                <div className="bar-no" style={{ width: `${noPct}%`, transition: "width 0.7s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span className="mono" style={{ fontSize: 10, color: "#aaa" }}>YES · ${market.yesTotal.toFixed(2)}</span>
                <span className="mono" style={{ fontSize: 10, color: "#aaa" }}>NO · ${market.noTotal.toFixed(2)}</span>
              </div>
            </div>

            {market.bets.length > 0 && (
              <div style={{ border: "1px solid #e5e5e5" }}>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e5e5" }}>
                  <p className="mono" style={{ color: "#aaa", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Recent bets · {market.bets.length} total
                  </p>
                </div>
                {[...market.bets].reverse().slice(0, 8).map((bet, i) => (
                  <div key={i} className="bet-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: bet.side === "yes" ? "#059669" : "#dc2626" }} />
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: bet.side === "yes" ? "#059669" : "#dc2626" }}>
                        {bet.side.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <span className="serif" style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>${bet.amount.toFixed(2)}</span>
                      <span className="mono" style={{ fontSize: 9, color: "#aaa" }}>{new Date(bet.paidAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {market.resolved ? (
              <div style={{ background: "#f0fdf4", padding: 28, border: "1px solid #bbf7d0", textAlign: "center" }}>
                <p style={{ fontSize: 32, marginBottom: 16 }}>🏁</p>
                <p className="serif" style={{ fontSize: 20, fontWeight: 700, color: "#15803d", marginBottom: 8 }}>Market Resolved</p>
                <p className="mono" style={{ fontSize: 12, color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase" }}>{market.outcome} won</p>
                {total > 0 && (
                  <div style={{ marginTop: 20, padding: 16, background: "#fff", border: "1px solid #bbf7d0" }}>
                    <p className="mono" style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Total pot paid out</p>
                    <p className="serif" style={{ fontSize: 24, fontWeight: 700, color: "#15803d" }}>${total.toFixed(2)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ border: "1px solid #e5e5e5", padding: 24, position: "sticky", top: 72 }}>
                <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>// place your bet</p>

                <p className="mono" style={{ color: "#aaa", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Amount (USDC)</p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {PRESETS.map(p => (
                    <button key={p} className="preset" onClick={() => setAmount(p)} style={{
                      background: amount === p ? "#000" : "#fff",
                      border: amount === p ? "1px solid #000" : "1px solid #e5e5e5",
                      color: amount === p ? "#fff" : "#666",
                      padding: "6px 10px", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                    }}>${p}</button>
                  ))}
                </div>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  min="0.01" step="0.01" placeholder="Custom"
                  style={{ width: "100%", background: "#fafafa", border: "1px solid #e5e5e5", padding: "10px 14px", color: "#000", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 20 }}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20 }}>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 12px" }}>
                    <p className="mono" style={{ color: "#86efac", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>If YES wins</p>
                    <p className="serif" style={{ color: "#15803d", fontSize: 16, fontWeight: 700 }}>${potentialPayout("yes")}</p>
                  </div>
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 12px" }}>
                    <p className="mono" style={{ color: "#fca5a5", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>If NO wins</p>
                    <p className="serif" style={{ color: "#b91c1c", fontSize: 16, fontWeight: 700 }}>${potentialPayout("no")}</p>
                  </div>
                </div>

                {error && (
                  <p className="mono" style={{ color: "#dc2626", fontSize: 10, marginBottom: 14, background: "#fef2f2", padding: "8px 12px", border: "1px solid #fecaca" }}>
                    {error}
                  </p>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button className="yes-btn" onClick={() => placeBet("yes")} disabled={placing}
                    style={{ padding: 14, fontSize: 13, fontWeight: 800, opacity: placing ? 0.5 : 1, cursor: placing ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
                    {placing ? "..." : "Buy YES"}
                  </button>
                  <button className="no-btn" onClick={() => placeBet("no")} disabled={placing}
                    style={{ padding: 14, fontSize: 13, fontWeight: 800, opacity: placing ? 0.5 : 1, cursor: placing ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
                    {placing ? "..." : "Buy NO"}
                  </button>
                </div>

                <p className="mono" style={{ color: "#ccc", fontSize: 9, textAlign: "center", marginTop: 14, letterSpacing: "0.05em" }}>
                  Payment via Locus · USDC on Base
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MarketPage() {
  return <Suspense><MarketContent /></Suspense>;
}