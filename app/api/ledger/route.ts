import { NextResponse } from "next/server";

const BASE = "https://beta-api.paywithlocus.com/api";
const KEY = process.env.LOCUS_API_KEY;

export async function GET() {
  try {
    const [balanceRes, txRes] = await Promise.all([
      fetch(`${BASE}/pay/balance`, {
        headers: { Authorization: `Bearer ${KEY}` },
      }),
      fetch(`${BASE}/pay/transactions?limit=500`, {
        headers: { Authorization: `Bearer ${KEY}` },
      }),
    ]);

    const balanceData = await balanceRes.json();
    const txData = await txRes.json();

    const transactions = txData?.data?.transactions || txData?.data || [];
    const balance = balanceData?.data?.usdc_balance || "0.00";

    return NextResponse.json({ balance, transactions });
  } catch (err) {
    console.error("Ledger error:", err);
    return NextResponse.json({ balance: "0.00", transactions: [] });
  }
}