import { NextRequest, NextResponse } from "next/server";
import { getAll, saveAll } from "../route";

export async function POST(req: NextRequest) {
  const { marketId, side, amount } = await req.json();

  if (!marketId || !side || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const all = getAll();
  const market = all.find((m: any) => m.id === marketId);

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  market.bets.push({
    side,
    amount: parseFloat(amount),
    paidAt: new Date().toISOString(),
    txHash: null,
  });

  if (side === "yes") {
    market.yesTotal = (market.yesTotal || 0) + parseFloat(amount);
  } else {
    market.noTotal = (market.noTotal || 0) + parseFloat(amount);
  }

  saveAll(all);
  return NextResponse.json({ ok: true });
}