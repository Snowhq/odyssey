import { NextRequest, NextResponse } from "next/server";

const BASE = "https://beta-api.paywithlocus.com/api";
const KEY = process.env.LOCUS_API_KEY;

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ paid: false });

  try {
    const res = await fetch(`${BASE}/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    const data = await res.json();
    console.log("Locus session:", JSON.stringify(data));
    const status = data?.data?.status;
    const paid = status === "paid" || status === "completed" || status === "success" || status === "PAID" || status === "COMPLETED";
    return NextResponse.json({ paid, status });
  } catch (err) {
    return NextResponse.json({ paid: false });
  }
}