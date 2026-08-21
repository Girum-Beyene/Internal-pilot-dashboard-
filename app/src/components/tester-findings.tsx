"use client";

import { useMemo, useState } from "react";
import type { QuickFinding } from "@/lib/evidence-model";
import { formatTesterSubmittedAt } from "@/lib/tester-findings";

type CourseFilter = "all" | "hrba" | "pm";

export default function TesterFindings({ findings, reviewLinks }: { findings: QuickFinding[]; reviewLinks: Partial<Record<"hrba" | "pm", string>> }) {
  const [course, setCourse] = useState<CourseFilter>("all");
  const visible = useMemo(() => findings.filter((item) => course === "all" || item.course === course), [findings, course]);
  return <>
    <div className="tester-filter" role="group" aria-label="Filter My Pilot Findings by course">
      {(["all", "hrba", "pm"] as CourseFilter[]).map((value) => <button key={value} type="button" aria-pressed={course === value} className={course === value ? "active" : ""} onClick={() => setCourse(value)}>{value === "all" ? "All" : value === "hrba" ? "HRBA" : "Project Management"}</button>)}
    </div>
    <p className="tester-order">Newest observations first · {visible.length} {visible.length === 1 ? "observation" : "observations"}</p>
    <div className="tester-cards">
      {visible.map((finding) => <article key={finding.id} className="tester-card">
        <header><div><span className={`course-token ${finding.course}`}>{finding.course === "hrba" ? "HRBA" : finding.course === "pm" ? "PM" : "Learning Hub"}</span><time dateTime={finding.submittedAt}>{formatTesterSubmittedAt(finding.submittedAt)}</time></div><strong>{finding.stableId || "Location not recorded"}</strong></header>
        <dl><div><dt>Observation</dt><dd>{finding.whatHappened}</dd></div><div><dt>Recommendation</dt><dd>{finding.recommendation || "No recommendation was recorded."}</dd></div></dl>
        {finding.screenshot && <a className="screenshot-link" href={`/api/attachments/${encodeURIComponent(finding.sourceId)}`} target="_blank" rel="noreferrer"><span aria-hidden="true">▧</span><span>Open submitted screenshot</span></a>}
      </article>)}
      {visible.length === 0 && <div className="tester-empty"><span aria-hidden="true">○</span><div><strong>No findings in this view</strong><p>Your submitted Quick Findings will appear here after they are received.</p></div></div>}
    </div>
    <section className="tester-review"><div><p className="eyebrow">WHEN YOU HAVE FINISHED TESTING</p><h2>Continue to your Final Course Review</h2><p>Review your observations above first, then complete one final reflection for the relevant course.</p></div><div>{reviewLinks.hrba && <a href={reviewLinks.hrba}>Continue to HRBA Final Review →</a>}{reviewLinks.pm && <a href={reviewLinks.pm}>Continue to PM Final Review →</a>}{!reviewLinks.hrba && !reviewLinks.pm && <p className="review-unavailable">Final Review links have not been activated.</p>}</div></section>
  </>;
}
