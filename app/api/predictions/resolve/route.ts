import { NextRequest, NextResponse } from "next/server";
import { getAll, saveAll } from "../route";

export async function POST(req: NextRequest) {
  const { marketId, outcome } = await req.json();

  if (!marketId || !outcome) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const all = await getAll();
  const market = all.find((m: any) => m.id === marketId);

  if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.resolved) return NextResponse.json({ error: "Already resolved" }, { status: 400 });

  const total = market.yesTotal + market.noTotal;
  const winningBets = market.bets.filter((b: any) => b.side === outcome);
  const winningPool = outcome === "yes" ? market.yesTotal : market.noTotal;

  const payouts: any[] = [];
  for (const bet of winningBets) {
    if (winningPool === 0) continue;
    const payout = (bet.amount / winningPool) * total;
    payouts.push({ bet, payout });
  }

  market.resolved = true;
  market.outcome = outcome;
  market.resolvedAt = new Date().toISOString();
  market.payouts = payouts;
  await saveAll(all);

  return NextResponse.json({ ok: true, outcome, total, winners: payouts.length, payouts });
}

export async function GET() {
  const all = await getAll();
  const now = Date.now();
  const resolved = [];

  for (const market of all) {
    if (market.resolved) continue;
    if (new Date(market.expiresAt).getTime() > now) continue;

    const total = market.yesTotal + market.noTotal;
    let outcome = "yes";
    if (total > 0) {
      outcome = market.yesTotal >= market.noTotal ? "yes" : "no";
    }

    market.resolved = true;
    market.outcome = outcome;
    market.resolvedAt = new Date().toISOString();
    resolved.push({ id: market.id, question: market.question, outcome });
  }

  if (resolved.length > 0) await saveAll(all);

  return NextResponse.json({ resolved });
}