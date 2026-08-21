import Image from "next/image";
import { cookies } from "next/headers";
import TesterFindings from "@/components/tester-findings";
import { SAMPLE_QUICK_FINDINGS } from "@/lib/fixtures";
import type { QuickFinding } from "@/lib/evidence-model";
import { testerClaimsFromToken } from "@/lib/server/auth";
import { getRows } from "@/lib/server/supabase-rest";
import { buildFinalReviewUrl, findingsForTester } from "@/lib/tester-findings";

export const dynamic = "force-dynamic";

function mapQuick(row: Record<string, unknown>): QuickFinding {
  return { id: String(row.source_uuid ?? row.source_submission_id), sourceId: String(row.source_submission_id), submittedAt: String(row.submitted_at), testerId: String(row.tester_id), course: row.observation_location as QuickFinding["course"], stableId: String(row.stable_id ?? ""), whatHappened: String(row.what_happened ?? ""), recommendation: String(row.recommendation ?? ""), screenshot: row.screenshot_ref ? String(row.screenshot_ref) : undefined };
}

export default async function MyFindingsPage() {
  const cookieStore = await cookies();
  const claims = testerClaimsFromToken(cookieStore.get("dec_tester_session")?.value);
  if (!claims?.tester_id) return <main className="tester-shell"><div className="tester-brand"><Image src="/dec-logo.png" width={176} height={58} alt="DEC" /></div><section className="tester-access"><p className="eyebrow">MY PILOT FINDINGS</p><h1>Use your secure Learning Hub link</h1><p>This private reflection view opens from your identified pilot session. Return to the Learning Hub and use <strong>My Pilot Findings</strong>.</p></section></main>;

  const liveMode = process.env.NEXT_PUBLIC_DATA_MODE === "live";
  let findings: QuickFinding[];
  if (liveMode) {
    const testerFilter = encodeURIComponent(claims.tester_id);
    findings = (await getRows("quick_findings", `select=*&tester_id=eq.${testerFilter}&order=submitted_at.desc`)).map(mapQuick);
  } else {
    findings = findingsForTester(SAMPLE_QUICK_FINDINGS, claims.tester_id);
  }
  const allowed = new Set((claims.courses?.length ? claims.courses : ["hrba", "pm"]).filter((course) => course === "hrba" || course === "pm"));
  const returnUrl = `${(process.env.APP_BASE_URL ?? "").replace(/\/$/, "")}/my-findings`;
  const links: Partial<Record<"hrba" | "pm", string>> = {};
  for (const course of ["hrba", "pm"] as const) if (allowed.has(course)) {
    const link = buildFinalReviewUrl(process.env.KOBO_REVIEW_FORM_URL, claims.tester_id, course, returnUrl);
    if (link) links[course] = link;
  }
  return <main className="tester-shell"><header className="tester-top"><Image src="/dec-logo.png" width={176} height={58} alt="DEC" /><div><span>Private pilot reflection</span><strong>{claims.display_name || "Pilot tester"}</strong></div></header><section className="tester-heading"><p className="eyebrow">DEC CSO LEARNING HUB · INTERNAL PILOT</p><h1>My Pilot Findings</h1><p>Your own Quick Findings are gathered here to help you remember what you observed before completing the Final Course Review. Other testers and DEC analysis are not shown.</p></section>{!liveMode && <div className="sample-banner" role="status"><strong>TEST MODE</strong><span>Controlled fixture evidence only. This is not the live pilot record.</span></div>}<TesterFindings findings={findings} reviewLinks={links} /></main>;
}
