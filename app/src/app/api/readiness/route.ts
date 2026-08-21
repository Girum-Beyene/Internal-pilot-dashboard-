import { NextRequest, NextResponse } from "next/server";
import { READINESS_DECISIONS, HumanReadinessDecision } from "@/lib/evidence-model";
import { authorizedInternal } from "@/lib/server/auth";
import { insertRow } from "@/lib/server/supabase-rest";

export async function POST(request: NextRequest) {
  if (!authorizedInternal(request)) return NextResponse.json({ error: "Authorized DEC decision-owner access required." }, { status: 401 });
  try {
    const decision = await request.json() as HumanReadinessDecision;
    if (!["hub", "hrba", "pm"].includes(decision.course) || !READINESS_DECISIONS.includes(decision.decision) || !decision.reason?.trim() || !decision.owner?.trim() || !decision.date) return NextResponse.json({ error: "Complete decision, reason, owner/group and date." }, { status: 400 });
    await insertRow("readiness_decisions", { course_hub: decision.course, decision: decision.decision, reason: decision.reason, decision_owner_group: decision.owner, decision_date: decision.date });
    return NextResponse.json({ status: "saved" });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Decision save failed" }, { status: 503 }); }
}
