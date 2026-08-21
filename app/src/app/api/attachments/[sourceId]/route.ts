import { NextRequest, NextResponse } from "next/server";
import { analystClaims, testerClaims } from "@/lib/server/auth";
import { getRows } from "@/lib/server/supabase-rest";

type Attachment = { filename?: string; download_url?: string; mimetype?: string };

export async function GET(request: NextRequest, { params }: { params: Promise<{ sourceId: string }> }) {
  const analyst = analystClaims(request);
  const tester = testerClaims(request);
  if (!analyst && !tester) return NextResponse.json({ error: "Evidence access required." }, { status: 401 });
  const { sourceId } = await params;
  if (!sourceId || sourceId.length > 160) return NextResponse.json({ error: "Invalid source record." }, { status: 400 });

  try {
    const sourceFilter = encodeURIComponent(sourceId);
    const quickRows = await getRows("quick_findings", `select=source_asset_uid,source_submission_id,tester_id,screenshot_ref&source_submission_id=eq.${sourceFilter}&limit=1`);
    const quick = quickRows[0];
    if (!quick?.screenshot_ref) return NextResponse.json({ error: "No screenshot is recorded for this observation." }, { status: 404 });
    if (tester && String(quick.tester_id) !== tester.tester_id) return NextResponse.json({ error: "This screenshot belongs to another tester." }, { status: 403 });

    const assetFilter = encodeURIComponent(String(quick.source_asset_uid));
    const rawRows = await getRows("raw_kobo_submissions", `select=payload&source_asset_uid=eq.${assetFilter}&source_submission_id=eq.${sourceFilter}&limit=1`);
    const payload = rawRows[0]?.payload as Record<string, unknown> | undefined;
    const attachments = Array.isArray(payload?._attachments) ? payload._attachments as Attachment[] : [];
    const screenshotRef = String(quick.screenshot_ref);
    const attachment = attachments.find((item) => item.filename === screenshotRef || item.filename?.endsWith(`/${screenshotRef}`) || item.download_url?.includes(encodeURIComponent(screenshotRef)));
    if (!attachment?.download_url) return NextResponse.json({ error: "The Kobo attachment metadata has not been reconciled yet." }, { status: 404 });

    const baseUrl = process.env.KOBO_BASE_URL;
    const token = process.env.KOBO_API_TOKEN;
    if (!baseUrl || !token) return NextResponse.json({ error: "Kobo attachment access is not configured." }, { status: 503 });
    const attachmentUrl = new URL(attachment.download_url, baseUrl);
    if (attachmentUrl.origin !== new URL(baseUrl).origin) return NextResponse.json({ error: "Attachment host is outside the configured Kobo service." }, { status: 502 });
    const upstream = await fetch(attachmentUrl, { headers: { Authorization: `Token ${token}` }, cache: "no-store", signal: AbortSignal.timeout(25_000) });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "Kobo attachment is temporarily unavailable." }, { status: 502 });
    const contentType = upstream.headers.get("content-type") ?? attachment.mimetype ?? "application/octet-stream";
    if (!contentType.toLowerCase().startsWith("image/")) return NextResponse.json({ error: "Only submitted image evidence can be displayed here." }, { status: 415 });
    const safeName = (attachment.filename ?? "pilot-screenshot").split(/[\\/]/).at(-1)?.replace(/[^a-zA-Z0-9._-]/g, "_") ?? "pilot-screenshot";
    return new Response(upstream.body, { headers: { "Content-Type": contentType, "Content-Disposition": `inline; filename="${safeName}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Attachment access failed." }, { status: 503 });
  }
}
