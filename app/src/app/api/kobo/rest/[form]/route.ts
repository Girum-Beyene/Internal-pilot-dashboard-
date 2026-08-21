import { NextRequest, NextResponse } from "next/server";
import { constantTimeTextEqual } from "@/lib/server/auth";
import { persistKoboSubmission } from "@/lib/server/kobo-sync";
import type { KoboPayload } from "@/lib/server/normalize";

export const runtime = "nodejs";

function basicCredentials(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    return separator < 0 ? null : [decoded.slice(0, separator), decoded.slice(separator + 1)] as const;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ form: string }> }) {
  const credentials = basicCredentials(request);
  const expectedUser = process.env.KOBO_REST_USERNAME;
  const expectedPassword = process.env.KOBO_REST_PASSWORD;
  if (!credentials || !expectedUser || !expectedPassword || !constantTimeTextEqual(credentials[0], expectedUser) || !constantTimeTextEqual(credentials[1], expectedPassword)) {
    return NextResponse.json({ error: "Valid REST Service credentials are required." }, { status: 401, headers: { "WWW-Authenticate": "Basic realm=dec-kobo-ingest" } });
  }

  const { form } = await params;
  if (form !== "quick" && form !== "review") return NextResponse.json({ error: "Unknown Kobo form route." }, { status: 404 });
  const assetUid = form === "quick" ? (process.env.KOBO_QUICK_FINDING_FORM_UID ?? process.env.KOBO_QUICK_FORM_UID) : process.env.KOBO_REVIEW_FORM_UID;
  if (!assetUid) return NextResponse.json({ error: "This form route has not been activated." }, { status: 503 });

  try {
    const incoming = await request.json() as KoboPayload & { data?: KoboPayload };
    const payload = incoming.data && typeof incoming.data === "object" ? incoming.data : incoming;
    const result = await persistKoboSubmission(form, assetUid, payload);
    return NextResponse.json({ status: "accepted", sourceSubmissionId: result.sourceSubmissionId }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Submission ingestion failed." }, { status: 400 });
  }
}
