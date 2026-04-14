import { NextRequest, NextResponse } from "next/server";
import { getAll, saveAll } from "../route";

const BASE = "https://beta-api.paywithlocus.com/api";
const KEY = process.env.LOCUS_API_KEY;

export async function POST(req: NextRequest) {
  const { jobResult, brief, service } = await req.json();

  try {
    const claudeRes = await fetch(`${BASE}/wrapped/anthropic/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `Based on this research brief and findings, generate exactly 3 prediction market questions that people could bet on. Each should be specific, time-bound (use dates in 2026 or later), and verifiable. Do not use any dates before April 2026.

Brief: ${brief}
Research findings: ${jobResult.slice(0, 500)}

Respond ONLY with valid JSON array, no markdown, no explanation:
[
  {"question": "Will X happen by Y date?", "category": "market/tech/business"},
  {"question": "Will X happen by Y date?", "category": "market/tech/business"},
  {"question": "Will X happen by Y date?", "category": "market/tech/business"}
]`,
          },
        ],
      }),
    });

    const claudeData = await claudeRes.json();
console.log("Claude response:", JSON.stringify(claudeData));
const text = claudeData?.data?.content?.[0]?.text || "[]";

    let questions;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      questions = JSON.parse(clean);
    } catch {
      questions = [
        { question: `Will this market see major disruption in the next 12 months?`, category: "market" },
        { question: `Will a new major player emerge in this space by Q4 2026?`, category: "business" },
        { question: `Will AI tools dominate this sector within 18 months?`, category: "tech" },
      ];
    }

    const now = Date.now();
    const newMarkets = questions.map((q: any, i: number) => ({
      id: `${now}-${i}`,
      question: q.question,
      category: q.category || "market",
      brief,
      service,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      resolved: false,
      outcome: null,
      bets: [],
      yesTotal: 0,
      noTotal: 0,
    }));

    const all = getAll();
    saveAll([...newMarkets, ...all]);

    return NextResponse.json({ markets: newMarkets });
  } catch (err) {
    console.error("Prediction create error:", err);
    return NextResponse.json({ error: "Failed to create predictions" }, { status: 500 });
  }
}