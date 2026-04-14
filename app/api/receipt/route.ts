import { NextRequest, NextResponse } from "next/server";

const BASE = "https://beta-api.paywithlocus.com/api";
const KEY = process.env.LOCUS_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const service = searchParams.get("service");
  const brief = searchParams.get("brief");
  const amount = searchParams.get("amount");
  const spend = searchParams.get("spend");
  const txLog = searchParams.get("txLog");

  const receipt = {
    id: jobId || `JOB-${Date.now()}`,
    issuedAt: new Date().toISOString(),
    service,
    brief,
    revenue: amount,
    spent: spend,
    profit: ((parseFloat(amount || "0") - parseFloat(spend || "0"))).toFixed(4),
    txLog: txLog ? JSON.parse(txLog) : [],
    walletAddress: "0x1f1b20a42afe4c136ebf89231c7d73750159355d",
    chain: "Base",
    settledBy: "Locus",
  };

  return NextResponse.json(receipt);
}