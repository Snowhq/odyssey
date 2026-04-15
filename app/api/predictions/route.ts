import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getAll() {
  try {
    const data = await redis.get("predictions");
    if (!data) return [];
    return Array.isArray(data) ? data : JSON.parse(data as string);
  } catch {
    return [];
  }
}

export async function saveAll(predictions: any[]) {
  await redis.set("predictions", JSON.stringify(predictions));
}

export async function GET() {
  return NextResponse.json(await getAll());
}