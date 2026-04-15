import { NextRequest, NextResponse } from "next/server";
import { getAll, saveAll } from "../route";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { event, data } = body;

  if (event === "checkout.session.paid") {
    const { marketId, side, amount } = data.metadata || {};
    if (marketId && side && amount) {
      const all = await getAll();
      const market = all.find((m: any) => m.id === marketId);
      if (market) {
        market.bets.push({
          side,
          amount: parseFloat(amount),
          paidAt: new Date().toISOString(),
          txHash: data.paymentTxHash,
        });
        if (side === "yes") {
          market.yesTotal = (market.yesTotal || 0) + parseFloat(amount);
        } else {
          market.noTotal = (market.noTotal || 0) + parseFloat(amount);
        }
        await saveAll(all);
      }
    }
  }
  return NextResponse.json({ received: true });
}
