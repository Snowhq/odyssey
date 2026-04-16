import { NextResponse } from "next/server";

const BASE = "https://beta-api.paywithlocus.com/api";
const KEY = process.env.LOCUS_API_KEY;

export async function GET() {
  try {
    const balanceRes = await fetch(`${BASE}/pay/balance`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    const balanceData = await balanceRes.json();
    const balance = balanceData?.data?.balance || balanceData?.data?.usdc_balance || "0.00";

    let all: any[] = [];
    let offset = 0;
    while (true) {
      const txRes = await fetch(`${BASE}/pay/transactions?limit=100&offset=${offset}`, {
        headers: { Authorization: `Bearer ${KEY}` },
      });
      const txData = await txRes.json();
      const txs = txData?.data?.transactions || txData?.data || [];
      if (txs.length === 0) break;
      all = all.concat(txs);
      if (txs.length < 100) break;
      offset += 100;
    }

    return NextResponse.json({ balance, transactions: all });
  } catch (err) {
    console.error("Ledger error:", err);
    return NextResponse.json({ balance: "0.00", transactions: [] });
  }
}