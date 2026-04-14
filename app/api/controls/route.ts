import { NextResponse } from "next/server";

const BASE = "https://beta-api.paywithlocus.com/api";
const KEY = process.env.LOCUS_API_KEY;

export async function GET() {
  try {
    const res = await fetch(`${BASE}/pay/balance`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    const data = await res.json();
    return NextResponse.json({
      balance: data?.data?.usdc_balance || "0.00",
      allowance: data?.data?.allowance || null,
      max_tx: data?.data?.max_transaction_size || null,
    });
  } catch {
    return NextResponse.json({ balance: "0.00", allowance: null, max_tx: null });
  }
}