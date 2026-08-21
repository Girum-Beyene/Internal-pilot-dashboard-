import { NextRequest, NextResponse } from "next/server";
import { runKoboSync } from "@/lib/server/kobo-sync";
import { authorizedInternal } from "@/lib/server/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!authorizedInternal(request, true)) return NextResponse.json({ error: "Manual refresh requires an authorized DEC administrator or cron bearer token." }, { status: 401 });
  try { return NextResponse.json(await runKoboSync()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Sync failed" }, { status: 503 }); }
}

export async function GET(request: NextRequest) {
  // Vercel Cron sends GET; use the same authorization boundary.
  return POST(request);
}
