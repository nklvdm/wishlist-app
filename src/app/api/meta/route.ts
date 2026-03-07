import { NextRequest, NextResponse } from "next/server";
import { scrapeUrlMeta } from "@/lib/scraper";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    new URL(url); // validate
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const meta = await scrapeUrlMeta(url);
  return NextResponse.json(meta);
}
