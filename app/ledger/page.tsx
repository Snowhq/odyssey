"use client";
import { useEffect, useState } from "react";

type Tx = { id: string; amount_usdc: string; memo: string; created_at: string; status: string; tx_hash: string; };

export default function LedgerPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [balance, setBalance] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "recent">("all");

  useEffect(() => {
    fetch("/api/ledger").then(r => r.json()).then(data => {
      setTxs(data.transactions || []);
      setBalance(data.balance || "0.00");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalSpent = txs.reduce((acc, t) => acc + parseFloat(t.amount_usdc || "0"), 0).toFixed(4);
  const displayed = filter === "recent" ? txs.slice(0, 10) : txs;

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
        .tx-row { border-bottom: 1px solid #f0f0f0; transition: background 0.15s; display: grid; grid-template-columns: 1fr auto; align-items: center; padding: 20px 0; gap: 24px; }
        .tx-row:hover { background: #fafafa; }
        .tab-btn { cursor: pointer; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 18px; border: none; transition: all 0.15s; background: transparent; }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 56, borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <a href="/"><img src="/logo.png" alt="Odyssey" style={{ height: "28px", width: "auto" }} /></a>
        <div style={{ display: "flex", gap: 36 }}>
          <a href="/hire" className="nav-a">Agents</a>
          <a href="/predictions" className="nav-a">Predictions</a>
          <a href="/portfolio" className="nav-a">Portfolio</a>
        </div>
        <a href="/hire" style={{ background: "#000", color: "#fff", padding: "8px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Hire an agent →</a>
      </nav>

      <section style={{ padding: "80px 48px 0", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <a href="/" style={{ color: "#aaa", fontSize: 12, display: "inline-block", marginBottom: 40, letterSpacing: "0.05em" }}>← Back</a>
          <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20 }}>// ledger</p>
          <h1 className="serif" style={{ fontSize: "clamp(52px,9vw,112px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.9, color: "#000", marginBottom: 20 }}>
            Agent<br />Ledger.
          </h1>
          <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.7, maxWidth: 480, paddingBottom: 48 }}>
            Every dollar this agent has spent on APIs. Pulled live from Locus. Every transaction verifiable on Basescan.
          </p>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          {[
            { label: "Wallet balance", value: "$" + parseFloat(balance).toFixed(4), color: "#000", sub: "Live from Locus" },
            { label: "Total API spend", value: "$" + totalSpent, color: "#dc2626", sub: "Across all jobs" },
            { label: "Transactions", value: txs.length.toString(), color: "#000", sub: "On Base mainnet" },
          ].map((m, i) => (
            <div key={m.label} style={{ padding: "40px 48px", borderRight: i < 2 ? "1px solid #e5e5e5" : "none" }}>
              <p className="mono" style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{m.label}</p>
              <p className="serif" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: m.color, marginBottom: 6 }}>{m.value}</p>
              <p style={{ fontSize: 12, color: "#aaa" }}>{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 48px 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e5e5" }}>
            <div style={{ display: "flex" }}>
              <button className="tab-btn" onClick={() => setFilter("all")} style={{ color: filter === "all" ? "#000" : "#aaa", borderBottom: filter === "all" ? "2px solid #000" : "2px solid transparent" }}>
                All ({txs.length})
              </button>
              <button className="tab-btn" onClick={() => setFilter("recent")} style={{ color: filter === "recent" ? "#000" : "#aaa", borderBottom: filter === "recent" ? "2px solid #000" : "2px solid transparent" }}>
                Recent (10)
              </button>
            </div>
            <a href="https://basescan.org/address/0x1f1b20a42afe4c136ebf89231c7d73750159355d" target="_blank" rel="noopener noreferrer" style={{ color: "#aaa", fontSize: 11, letterSpacing: "0.05em", paddingBottom: 8 }}>
              View on Basescan ↗
            </a>
          </div>

          {loading ? (
            <p className="mono" style={{ color: "#aaa", fontSize: 11, padding: "48px 0", letterSpacing: "0.1em" }}>Loading...</p>
          ) : txs.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <p style={{ color: "#aaa", fontSize: 14, marginBottom: 24 }}>No transactions yet.</p>
              <a href="/hire" style={{ display: "inline-block", background: "#000", color: "#fff", padding: "10px 24px", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Run a job →</a>
            </div>
          ) : (
            <>
              {displayed.map((tx, i) => (
                <div key={tx.id} className="tx-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 14, color: "#000", fontWeight: 500, marginBottom: 5 }}>{tx.memo}</p>
                      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                        <p className="mono" style={{ fontSize: 10, color: "#aaa" }}>{new Date(tx.created_at).toLocaleString()}</p>
                        {tx.tx_hash && (
                          <a href={"https://basescan.org/tx/" + tx.tx_hash} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: 10, color: "#000", letterSpacing: "0.05em", textDecoration: "underline" }}>
                            View on Base ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
                    -{parseFloat(tx.amount_usdc).toFixed(4)} USDC
                  </p>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #e5e5e5" }} />
            </>
          )}
        </div>
      </section>
    </main>
  );
}