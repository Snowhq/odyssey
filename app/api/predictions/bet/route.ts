import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { marketId, side, amount } = await req.json();

  if (!marketId || !side || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const KEY = process.env.LOCUS_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const sessionRes = await fetch(
      "https://beta-api.paywithlocus.com/api/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount).toFixed(2),
          description: `Odyssey Prediction — ${side.toUpperCase()} bet`,
          successUrl: `${appUrl}/predictions/${marketId}?bet=${side}&amount=${amount}&success=true`,
          cancelUrl: `${appUrl}/predictions/${marketId}`,
          metadata: { marketId, side, amount: amount.toString() },
        }),
      }
    );

    const raw = await sessionRes.json();
    const checkoutUrl = raw?.data?.checkoutUrl;

    if (!checkoutUrl) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const sessionId = raw?.data?.id;
return NextResponse.json({ redirectUrl: checkoutUrl, sessionId });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}