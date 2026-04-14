import { NextRequest, NextResponse } from "next/server";

const PRICES: Record<string, string> = {
  "competitor-intel": "0.10",
  "lead-gen": "0.20",
  "market-research": "0.05",
};

const NAMES: Record<string, string> = {
  "competitor-intel": "Competitor Intelligence Report",
  "lead-gen": "Lead Generation Pack",
  "market-research": "Market Research Brief",
};

export async function POST(req: NextRequest) {
  const { serviceId, brief } = await req.json();

  const amount = PRICES[serviceId];
  const name = NAMES[serviceId];

  if (!amount || !brief) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  return NextResponse.json({
    approved: true,
    amount,
    name,
    redirectUrl: `/result?service=${serviceId}&brief=${encodeURIComponent(brief)}&amount=${amount}`,
  });
}