import { NextRequest, NextResponse } from "next/server";

const BASE = "https://beta-api.paywithlocus.com/api";
const KEY = process.env.LOCUS_API_KEY;

type TxEntry = {
  tool: string;
  action: string;
  cost: string;
  status: "success" | "error";
};

async function getBalance(): Promise<number> {
  const res = await fetch(`${BASE}/pay/balance`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const data = await res.json();
  return parseFloat(data?.data?.balance || "0");
}

async function callClaude(prompt: string): Promise<string | null> {
  const res = await fetch(`${BASE}/wrapped/anthropic/chat`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return res.ok ? (data?.data?.content?.[0]?.text || null) : null;
}

export async function POST(req: NextRequest) {
  const { service, brief } = await req.json();
  const txLog: TxEntry[] = [];

  if (!KEY) {
    return NextResponse.json({ error: "LOCUS_API_KEY not configured" }, { status: 500 });
  }

  if (!brief || brief.trim().length < 5) {
    return NextResponse.json({
      result: "Please provide more detail about your research task. A single word or short phrase will not produce useful results — describe your business, target market, or specific question.",
      spend: "0.0000",
      txLog: [],
    });
  }

  try {
    const balanceBefore = await getBalance();

    // STEP 1: Brave Search
    let searchResults = "No results found.";
    try {
      const searchRes = await fetch(`${BASE}/wrapped/brave/web-search`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ q: brief, count: 5 }),
      });
      const searchData = await searchRes.json();
      if (searchRes.ok && searchData?.data?.web?.results?.length > 0) {
        searchResults = searchData.data.web.results
          .slice(0, 5)
          .map((r: any) => `${r.title}: ${r.description} (${r.url})`)
          .join("\n\n");
        txLog.push({ tool: "Brave Search", action: "Web search", cost: "0.0033", status: "success" });
      } else {
        txLog.push({ tool: "Brave Search", action: "Web search", cost: "0.0000", status: "error" });
      }
    } catch {
      txLog.push({ tool: "Brave Search", action: "Web search", cost: "0.0000", status: "error" });
    }

    // STEP 2: Exa Search (competitor and lead-gen only)
    if (service === "competitor-intel" || service === "lead-gen") {
      try {
        const exaRes = await fetch(`${BASE}/wrapped/exa/search`, {
          method: "POST",
          headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: brief, numResults: 5, useAutoprompt: true }),
        });
        const exaData = await exaRes.json();
        if (exaRes.ok && exaData?.data?.results?.length > 0) {
          const exaResults = exaData.data.results
            .slice(0, 3)
            .map((r: any) => `${r.title}: ${r.url}`)
            .join("\n");
          searchResults += "\n\nExa results:\n" + exaResults;
          txLog.push({ tool: "Exa", action: "Semantic search", cost: "0.0070", status: "success" });
        } else {
          txLog.push({ tool: "Exa", action: "Semantic search", cost: "0.0000", status: "error" });
        }
      } catch {
        txLog.push({ tool: "Exa", action: "Semantic search", cost: "0.0000", status: "error" });
      }
    }

    // STEP 3: Claude Analysis
    const promptMap: Record<string, string> = {
      "competitor-intel": `You are a competitive intelligence analyst. The user wants to know: "${brief}"

Web research gathered:
${searchResults}

Write a professional competitive analysis. Cover: who the main competitors are, their positioning, pricing if known, weaknesses, and where the opportunity lies. Plain paragraphs only. No markdown, no bullet points, no headers. Write like a McKinsey analyst briefing a CEO.`,

      "lead-gen": `You are a B2B sales intelligence expert. The user wants: "${brief}"

Web research:
${searchResults}

Identify and describe 5-8 specific companies that match this criteria. For each, describe what they do, why they are a good fit, and suggest a personalized outreach angle. Plain paragraphs only. No markdown.`,

      "market-research": `You are a market research analyst. The user wants to understand: "${brief}"

Web research:
${searchResults}

Write a strategic market brief covering: key trends, major players, emerging opportunities, and what a founder should do with this information. Plain paragraphs only. No markdown, no bullet points.`,
    };

    const prompt = promptMap[service] || promptMap["market-research"];
    const result = await callClaude(prompt);

    if (!result) {
      txLog.push({ tool: "Claude Haiku", action: "Analysis", cost: "0.0000", status: "error" });
      return NextResponse.json({ error: "Claude failed", txLog }, { status: 500 });
    }

    txLog.push({ tool: "Claude Haiku", action: "Research synthesis", cost: "0.0010", status: "success" });

    // STEP 4: Multi-agent pipeline
    // If market research → agent identifies a key company → suggests hiring competitor intel agent
    let followUpAgent = null;
    if (service === "market-research" && result) {
      try {
        const followUpPrompt = `Based on this market research summary: "${result.slice(0, 400)}"

Identify the single most important company or competitor that any business in this space needs to watch. Reply with ONLY the company name — no explanation, no punctuation, just the name.`;

        const companyName = await callClaude(followUpPrompt);

        if (companyName && companyName.trim().length > 0 && companyName.length < 60) {
          const cleanName = companyName.trim();
          txLog.push({ tool: "Claude Haiku", action: "Multi-agent: identify key competitor", cost: "0.0005", status: "success" });
          followUpAgent = {
            company: cleanName,
            suggestion: `Agent identified ${cleanName} as the key player to watch.`,
            action: `Run competitor intelligence on ${cleanName}`,
            briefTemplate: `Analyze ${cleanName} as a competitor. What are their strengths, weaknesses, pricing, and how can we beat them?`,
            serviceId: "competitor-intel",
            cost: "$0.10",
          };
        }
      } catch {
        // Silent fail — don't break the main result
      }
    }

    // Real spend calculation
    const balanceAfter = await getBalance();
    const realSpend = Math.max(0, balanceBefore - balanceAfter).toFixed(4);
    const estimatedSpend = txLog
      .filter((t) => t.status === "success")
      .reduce((acc, t) => acc + parseFloat(t.cost), 0)
      .toFixed(4);

    return NextResponse.json({
      result,
      spend: realSpend !== "0.0000" ? realSpend : estimatedSpend,
      txLog,
      followUpAgent,
    });

  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json({
      error: `Agent failed: ${err instanceof Error ? err.message : String(err)}`,
      txLog,
    }, { status: 500 });
  }
}