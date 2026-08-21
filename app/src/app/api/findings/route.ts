import { NextRequest, NextResponse } from "next/server";
import { ACTION_DECISIONS, DECISION_HORIZONS, Finding } from "@/lib/evidence-model";
import { authorizedInternal } from "@/lib/server/auth";
import { getRows, upsertRows } from "@/lib/server/supabase-rest";

function valid(f: Finding) {
  return /^F-[A-Za-z0-9-]+$/.test(f.id) && ["hub", "hrba", "pm"].includes(f.course) && ACTION_DECISIONS.includes(f.actionDecision) && DECISION_HORIZONS.includes(f.decisionHorizon) && ["Low", "Medium", "High", "Critical"].includes(f.severity);
}

export async function PUT(request: NextRequest) {
  if (!authorizedInternal(request)) return NextResponse.json({ error: "Authorized DEC analyst access required." }, { status: 401 });
  try {
    const findings = await request.json() as Finding[];
    if (!Array.isArray(findings) || findings.some((f) => !valid(f))) return NextResponse.json({ error: "Invalid finding payload." }, { status: 400 });
    const rows = findings.map((f) => ({ finding_id: f.id, course_hub: f.course, domain: f.domain, evidence: f.evidence, evidence_count: f.recordCount, recurrence: f.recurrence, severity: f.severity, blocker_classification: f.blockerClassification, interpretation: f.interpretation, action_decision: f.actionDecision, recommended_action: f.recommendedAction, priority: f.priority, responsible_person_unit: f.owner || null, target_timing: f.targetTiming || null, status: f.status, verification_result: f.verification || null, response_area: f.responseArea, finding_type: f.findingType, decision_horizon: f.decisionHorizon, updated_at: new Date().toISOString() }));
    await upsertRows("findings", rows, "finding_id");
    const ids = findings.map((f) => f.id).join(",");
    const stored = await getRows("findings", `select=id,finding_id&finding_id=in.(${encodeURIComponent(ids)})`);
    const sources = findings.flatMap((finding) => {
      const storedId = stored.find((row) => row.finding_id === finding.id)?.id;
      return storedId ? finding.sourceRecordIds.map((sourceId) => ({ finding_id: storedId, source_type: "kobo_or_qualitative", source_record_id: sourceId, source_field: "" })) : [];
    });
    await upsertRows("finding_sources", sources, "finding_id,source_type,source_record_id,source_field");
    await upsertRows("finding_history", stored.map((row) => ({ finding_id: row.id, event: "Finding record saved via dashboard", snapshot: findings.find((f) => f.id === row.finding_id) })), "id");
    return NextResponse.json({ status: "saved", count: rows.length });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Finding save failed" }, { status: 503 }); }
}
