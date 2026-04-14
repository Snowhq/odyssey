import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DB = join(process.cwd(), "data/predictions.json");

export function getAll() {
  try {
    return JSON.parse(readFileSync(DB, "utf-8"));
  } catch {
    return [];
  }
}

export function saveAll(data: any[]) {
  writeFileSync(DB, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(getAll());
}