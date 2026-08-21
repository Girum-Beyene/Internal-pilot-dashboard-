"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-location-assign-relative-destination, react-hooks/set-state-in-effect */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { allReadiness, countPractical, countQuality, percent, possibleBlockerSummary } from "@/lib/analytics";
import { DashboardEvidence, emptyDashboardEvidence } from "@/lib/dashboard-evidence";
import { COURSE_LABELS, Course, DECISION_HORIZONS, FinalReview, Finding, FindingStatus, HumanReadinessDecision, PRACTICAL_CHECKS, PRACTICAL_RESULTS, QUALITY_INDICATORS, QUALITY_RATINGS, QualitativeEvidence, QuickFinding, READINESS_DECISIONS } from "@/lib/evidence-model";
import { readinessDisplayLabel } from "@/lib/readiness-presentation";
import { formatTesterSubmittedAt } from "@/lib/tester-findings";

const views = [
  ["overview", "Pilot Overview", "OV"], ["coverage", "Coverage & Progress", "CP"], ["practical", "Practical Checks", "PC"], ["quality", "Quality Review", "QR"],
  ["learning", "Learning & Better Decisions", "LD"], ["transfer", "Context, Application & Transfer", "CT"], ["findings", "Findings & Blockers", "FB"],
  ["actions", "Finding-to-Action", "FA"], ["qualitative", "Qualitative Evidence", "QE"], ["readiness", "Readiness & Decision Record", "RD"],
] as const;

const navigationGroups = [
  ["Overview", ["overview"]],
  ["Evidence", ["coverage", "practical", "quality", "learning", "transfer", "qualitative"]],
  ["Findings & Actions", ["findings", "actions"]],
  ["Readiness", ["readiness"]],
] as const;

const viewDescriptions: Record<string, string> = {
  overview: "A decision view of evidence sufficiency, blockers, fragile experience and action timing.",
  coverage: "Operational testing coverage and evidence receipt—not a course-quality score.",
  practical: "What happened when testers performed each learner-journey check.",
  quality: "How well the experience worked, with valid evidence counts and indicator drill-through.",
  learning: "Whether each course helps learners make better decisions in realistic CSO practice.",
  transfer: "Context, relevance, workplace use, adaptable tools and support needed for application.",
  findings: "Specific observations, possible blockers and repeated evidence patterns.",
  actions: "DEC’s operational workspace for interpreting evidence, assigning action and verifying closure.",
  qualitative: "Searchable exact source excerpts with tester and record traceability.",
  readiness: "Calculated evidence signals beside DEC’s separate human decision record.",
};

type DrawerRow = { id: string; meta: string; text: string; source?: string };
type Filters = { course: "all" | Course; device: string; internet: string; practical: string; rating: string; horizon: string };

const emptyFilters: Filters = { course: "all", device: "all", internet: "all", practical: "all", rating: "all", horizon: "all" };
const SIMULATION_FINDINGS_STORAGE_KEY = "dec-pilot-simulation-findings-v2";

function toneForDecision(value: string) {
  if (value.startsWith("HOLD") || value.includes("BLOCKED") || value === "FAIL") return "critical";
  if (value.startsWith("INSUFFICIENT") || value.includes("FRAGILE") || value === "PASS WITH ISSUE") return "attention";
  if (value === "READY" || value === "PASS" || value.includes("STRONG")) return "positive";
  return "neutral";
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  const value = String(children);
  const display = (READINESS_DECISIONS as readonly string[]).includes(value) ? readinessDisplayLabel(value as (typeof READINESS_DECISIONS)[number]) : children;
  return <span className={`status-pill ${tone ?? toneForDecision(value)}`}><span aria-hidden="true" className="status-dot" />{display}</span>;
}

function StackedBar({ values, labels, total, onOpen }: { values: number[]; labels: string[]; total: number; onOpen?: () => void }) {
  const colors = ["bar-red", "bar-amber", "bar-blue", "bar-green", "bar-gray"];
  const bar = <div className="stacked-bar" aria-label={labels.map((l, i) => `${l}: ${values[i]}`).join(", ")}>
    {values.map((value, index) => value > 0 && <span key={labels[index]} className={colors[index]} style={{ width: `${(value / Math.max(total, 1)) * 100}%` }} title={`${labels[index]}: ${value}`} />)}
    {total === 0 && <span className="bar-empty">No evidence</span>}
  </div>;
  return onOpen ? <button className="bar-button" onClick={onOpen}>{bar}</button> : bar;
}

function Metric({ label, value, detail, tone = "blue", onClick }: { label: string; value: string | number; detail: string; tone?: string; onClick?: () => void }) {
  const content = <><span className={`metric-accent ${tone}`} /><span className="metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></>;
  return onClick ? <button className="metric" onClick={onClick}>{content}<span className="drill">View evidence →</span></button> : <div className="metric">{content}</div>;
}

export default function Dashboard({ view, mode, initialEvidence = emptyDashboardEvidence() }: { view: string; mode: "real" | "simulation"; initialEvidence?: DashboardEvidence }) {
  const current = views.some((v) => v[0] === view) ? view : "overview";
  const simulation = mode === "simulation";
  const routePrefix = simulation ? "/simulation" : "";
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [mobileNav, setMobileNav] = useState(false);
  const [drawer, setDrawer] = useState<{ title: string; rows: DrawerRow[] } | null>(null);
  const [findings, setFindings] = useState<Finding[]>(initialEvidence.findings);
  const [sync, setSync] = useState(simulation ? { state: "Simulation dataset", time: "Synthetic review evidence" } : { state: "Waiting for submissions", time: "No pilot evidence received yet" });
  const [sourceReviews, setSourceReviews] = useState<FinalReview[]>(initialEvidence.reviews);
  const [sourceQuick, setSourceQuick] = useState<QuickFinding[]>(initialEvidence.quick);

  useEffect(() => {
    if (!simulation) {
      fetch("/api/evidence").then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Evidence load failed");
        setSourceReviews(data.reviews); setSourceQuick(data.quick); setFindings(data.findings);
        setSync({ state: data.lastSync?.status === "success" ? "Evidence store checked" : "Waiting for submissions", time: data.lastSync?.completed_at ? new Date(data.lastSync.completed_at).toLocaleString() : "No pilot evidence received yet" });
      }).catch(() => setSync({ state: "Waiting for submissions", time: "No pilot evidence received yet" }));
    } else {
      const stored = window.localStorage.getItem(SIMULATION_FINDINGS_STORAGE_KEY);
      if (stored) try { setFindings(JSON.parse(stored)); } catch { /* ignore invalid local development state */ }
    }
  }, [simulation]);

  const saveFindings = (next: Finding[]) => {
    setFindings(next);
    if (!simulation) void fetch("/api/findings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next), keepalive: true });
    else window.localStorage.setItem(SIMULATION_FINDINGS_STORAGE_KEY, JSON.stringify(next));
  };

  const reviews = useMemo(() => sourceReviews.filter((r) =>
    (filters.course === "all" || filters.course === "hub" || r.course === filters.course) &&
    (filters.device === "all" || r.device === filters.device) &&
    (filters.internet === "all" || r.internet === filters.internet) &&
    (filters.practical === "all" || r.practical.some((p) => p.result === filters.practical)) &&
    (filters.rating === "all" || r.quality.some((q) => q.rating === filters.rating))), [filters, sourceReviews]);
  const quick = useMemo(() => sourceQuick.filter((q) => filters.course === "all" || q.course === filters.course), [filters.course, sourceQuick]);
  const filteredFindings = findings.filter((f) => (filters.course === "all" || f.course === filters.course) && (filters.horizon === "all" || f.decisionHorizon === filters.horizon));

  async function refresh() {
    if (simulation) { setSync({ state: "Simulation dataset", time: "Synthetic review evidence" }); return; }
    setSync({ state: "Refreshing…", time: sync.time });
    try {
      const response = await fetch("/api/evidence");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Evidence load failed");
      setSourceReviews(body.reviews); setSourceQuick(body.quick); setFindings(body.findings);
      setSync({ state: body.lastSync?.status === "success" ? "Evidence store checked" : "Waiting for submissions", time: body.lastSync?.completed_at ? new Date(body.lastSync.completed_at).toLocaleString() : "No pilot evidence received yet" });
    } catch {
      setSync({ state: "Waiting for submissions", time: sync.time });
    }
  }

  const openReviews = (title: string, selected = reviews) => setDrawer({ title, rows: selected.map((r) => ({ id: r.id, meta: `${r.testerId} · ${COURSE_LABELS[r.course]} · ${r.device}`, text: `${r.completion}; submitted ${formatTesterSubmittedAt(r.submittedAt)}`, source: r.sourceId })) });
  const readiness = allReadiness(sourceReviews, findings);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to dashboard content</a>
    <aside className={`sidebar ${mobileNav ? "open" : ""}`} aria-label="Primary navigation">
      <div className="brand"><Image src="/dec-logo.png" alt="Development Expertise Center" width={92} height={50} priority /><button className="nav-close" onClick={() => setMobileNav(false)} aria-label="Close navigation">×</button></div>
      <div className="product-name"><strong>Internal Pilot</strong><span>Analytics & decisions</span></div>
      <nav>{navigationGroups.map(([group, members]) => <div className="nav-group" key={group}><p>{group}</p>{members.map((href) => { const [viewId, label, code] = views.find((item) => item[0] === href)!; return <Link key={viewId} href={viewId === "overview" ? (routePrefix || "/") : `${routePrefix}/${viewId}`} className={current === viewId ? "active" : ""} onClick={() => setMobileNav(false)}>
        <span className="nav-icon" aria-hidden="true">{code}</span><span>{label}</span>{viewId === "overview" && <span className="nav-live">{simulation ? "SIM" : "REAL"}</span>}
      </Link>; })}</div>)}</nav>
      <div className="sidebar-note"><span className="pulse" />Internal DEC workspace<small>Selected-CSO pilot horizon</small></div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation">☰</button>
        <div className="sync-state"><span className="sync-label">Last synced</span><strong>{sync.time}</strong><span>{sync.state}</span></div>
        <button className="refresh-button" onClick={refresh} disabled={sync.state === "Refreshing…"}><span aria-hidden="true">↻</span>{sync.state === "Refreshing…" ? "Refreshing" : simulation ? "Simulation source" : "Check evidence"}</button>
        <div className="user-chip" aria-label="Signed in as DEC Analyst"><span>DA</span><div><strong>DEC Analyst</strong><small>Internal access</small></div></div>
      </header>
      <main id="main-content" className="main">
        {simulation ? <div className="sample-banner simulation-banner" role="status"><strong>SIMULATION — SYNTHETIC EVIDENCE</strong><span>Isolated fixture and AI-review evidence only. It never writes to Kobo or the real dec_pilot evidence store.</span></div> : <div className="zero-banner" role="status"><strong>REAL PILOT EVIDENCE</strong><span>{sourceReviews.length || sourceQuick.length || findings.length ? "Displaying evidence received in the DEC pilot store." : "No pilot evidence received yet. Dashboard modules remain ready for DEC submissions."}</span></div>}
        <section className="page-heading"><div><p className="eyebrow">DEC CSO LEARNING HUB · INTERNAL PILOT</p><h1>{views.find((v) => v[0] === current)?.[1]}</h1><p>{viewDescriptions[current]}</p></div><div className="stage-chip"><span>Decision horizon</span><strong>Selected-CSO pilot</strong></div></section>
        <FilterBar filters={filters} reviews={sourceReviews} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />
        {current === "overview" && <Overview readiness={readiness} reviews={reviews} findings={filteredFindings} openReviews={openReviews} openDrawer={setDrawer} routePrefix={routePrefix} />}
        {current === "coverage" && <Coverage reviews={reviews} quick={quick} openDrawer={setDrawer} />}
        {current === "practical" && <Practical reviews={reviews} openDrawer={setDrawer} />}
        {current === "quality" && <Quality reviews={reviews} openDrawer={setDrawer} />}
        {current === "learning" && <Learning reviews={reviews} openDrawer={setDrawer} />}
        {current === "transfer" && <Transfer reviews={reviews} promote={(e: QualitativeEvidence) => promote(e, findings, saveFindings)} />}
        {current === "findings" && <Findings reviews={reviews} quick={quick} findings={filteredFindings} openDrawer={setDrawer} />}
        {current === "actions" && <Actions findings={filteredFindings} save={(changed) => saveFindings(findings.map((f) => f.id === changed.id ? changed : f))} />}
        {current === "qualitative" && <Qualitative reviews={reviews} promote={(e: QualitativeEvidence) => promote(e, findings, saveFindings)} />}
        {current === "readiness" && <Readiness signals={readiness} findings={findings} realMode={!simulation} />}
      </main>
      <footer><Image src="/partner-logos.png" alt="DEC programme partners" width={440} height={56} /><span>Internal pilot decision support · Evidence, action and human judgment remain separate</span></footer>
    </div>
    {drawer && <EvidenceDrawer title={drawer.title} rows={drawer.rows} onClose={() => setDrawer(null)} />}
  </div>;
}

function FilterBar({ filters, reviews, onChange, onReset }: { filters: Filters; reviews: FinalReview[]; onChange: (f: Filters) => void; onReset: () => void }) {
  return <section className="filters" aria-label="Global evidence filters">
    <label>Course / system<select value={filters.course} onChange={(e) => onChange({ ...filters, course: e.target.value as Filters["course"] })}><option value="all">All evidence</option><option value="hub">Learning Hub</option><option value="hrba">HRBA Course</option><option value="pm">Project Management</option></select></label>
    <label>Device<select value={filters.device} onChange={(e) => onChange({ ...filters, device: e.target.value })}><option value="all">All devices</option>{[...new Set(reviews.map((r) => r.device))].map((x) => <option key={x}>{x}</option>)}</select></label>
    <label>Internet experience<select value={filters.internet} onChange={(e) => onChange({ ...filters, internet: e.target.value })}><option value="all">All experiences</option>{[...new Set(reviews.map((r) => r.internet))].map((x) => <option key={x}>{x}</option>)}</select></label>
    <label>Practical result<select value={filters.practical} onChange={(e) => onChange({ ...filters, practical: e.target.value })}><option value="all">All results</option>{PRACTICAL_RESULTS.map((x) => <option key={x}>{x}</option>)}</select></label>
    <label>Quality rating<select value={filters.rating} onChange={(e) => onChange({ ...filters, rating: e.target.value })}><option value="all">All ratings</option>{QUALITY_RATINGS.map((x) => <option key={x}>{x}</option>)}</select></label>
    <label>Decision Horizon<select value={filters.horizon} onChange={(e) => onChange({ ...filters, horizon: e.target.value })}><option value="all">All horizons</option>{DECISION_HORIZONS.map((x) => <option key={x}>{x}</option>)}</select></label>
    <button onClick={onReset} className="reset-button">Reset</button>
  </section>;
}

function Overview({ readiness, reviews, findings, openReviews, openDrawer, routePrefix }: any) {
  const unresolved = findings.filter((f: Finding) => f.severity === "Critical" && !["Verified Closed", "Not an Issue"].includes(f.status));
  const blockerReports = possibleBlockerSummary(reviews, findings);
  const high = findings.filter((f: Finding) => f.priority === "High" && !["Verified Closed", "Not an Issue"].includes(f.status) && ["During internal pilot", "Before selected-CSO pilot"].includes(f.decisionHorizon));
  const priorityActions = findings.filter((f: Finding) => !["Verified Closed", "Not an Issue"].includes(f.status) && ["During internal pilot", "Before selected-CSO pilot"].includes(f.decisionHorizon)).sort((a: Finding, b: Finding) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.severity] - { Critical: 0, High: 1, Medium: 2, Low: 3 }[b.severity]));
  const priorityAction = priorityActions[0];
  const applicable = reviews.flatMap((r: any) => r.practical).filter((p: any) => p.applicable);
  const tested = applicable.filter((p: any) => p.result !== "NOT TESTED").length;
  const reviewers = new Set(reviews.map((r: FinalReview) => r.testerId)).size;
  return <>
    <section className="readiness-grid" aria-labelledby="readiness-title"><div className="section-title full"><div><p className="eyebrow">EVIDENCE SIGNALS</p><h2 id="readiness-title">Ready for the selected-CSO pilot?</h2></div><Link href={`${routePrefix}/readiness`}>Open decision record →</Link></div>
      {readiness.map((s: any) => <article key={s.course} className={`readiness-card ${toneForDecision(s.decision)}`}><div className="card-top"><span className="system-mark">{s.course === "hub" ? "LH" : s.course.toUpperCase()}</span><StatusPill>{readinessDisplayLabel(s.decision)}</StatusPill></div><h3>{s.label}</h3><p>{s.reason}</p><dl><div><dt>Final reviews</dt><dd>{s.finalReviews}</dd></div><div><dt>Unresolved critical</dt><dd>{s.unresolvedCritical}</dd></div><div><dt>Evidence gaps</dt><dd>{s.criticalGaps.length}</dd></div></dl></article>)}
    </section>
    <section className="metric-grid" aria-label="Pilot evidence summary">
      <Metric label="Final Reviews received" value={reviews.length} detail={`${reviews.length} review(s) from ${reviewers} reviewer(s)`} onClick={() => openReviews("Final Reviews received")} />
      <Metric label="Practical-check coverage" value={percent(tested, applicable.length)} detail={`${tested} tested of ${applicable.length} assigned`} tone="teal" onClick={() => openDrawer({ title: "Practical evidence coverage", rows: reviews.map((r: any) => ({ id: r.id, meta: `${r.testerId} · ${COURSE_LABELS[r.course as Course]}`, text: `${r.practical.filter((p: any) => p.applicable && p.result !== "NOT TESTED").length} assigned checks tested`, source: r.sourceId })) })} />
      <Metric label="Unresolved critical issues" value={unresolved.length} detail="verified closed excluded" tone="red" onClick={() => openDrawer({ title: "Unresolved critical issues", rows: unresolved.map((f: Finding) => ({ id: f.id, meta: `${COURSE_LABELS[f.course]} · ${f.status}`, text: f.evidence, source: f.sourceRecordIds.join(", ") })) })} />
      <Metric label="Unresolved possible blockers" value={blockerReports.unresolved.length} detail={`${blockerReports.historical.length} explicit Final Review report(s) · ${blockerReports.closedCount} closed/not issue`} tone="amber" onClick={() => openDrawer({ title: "Unresolved explicit possible blocker reports", rows: blockerReports.unresolved.map((r: FinalReview) => ({ id: r.id, meta: `${COURSE_LABELS[r.course]} · ${r.possibleBlocker.replace("_", " ")}`, text: r.qualitative.find((e) => e.sourceField === "j_blocker_explain")?.excerpt ?? "Explicit possible-blocker response recorded in Final Review.", source: r.sourceId })) })} />
      <Metric label="High actions due before next stage" value={high.length} detail="open · now or before selected-CSO" tone="navy" onClick={() => openDrawer({ title: "High-priority actions due", rows: high.map((f: Finding) => ({ id: f.id, meta: `${f.owner} · ${f.decisionHorizon}`, text: f.recommendedAction })) })} />
    </section>
    <section className="two-column">
      <DecisionHorizon findings={findings} routePrefix={routePrefix} />
      <article className="panel priority-action-panel"><div className="section-title"><div><p className="eyebrow">PRIORITY ACTIONS · BEFORE SELECTED-CSO PILOT</p><h2>What needs attention now?</h2></div><Link href={`${routePrefix}/actions`}>All actions →</Link></div><div className="priority-list">{priorityAction ? <div><span className={`priority-flag ${priorityAction.severity.toLowerCase()}`}>{priorityAction.severity}</span><div><strong>{priorityAction.id} · {priorityAction.domain}</strong><p>{priorityAction.recommendedAction}</p><small>Status: {priorityAction.status} · Owner: {priorityAction.owner || "Unassigned"} · Next: {priorityAction.targetTiming || priorityAction.decisionHorizon}</small></div></div> : <Empty title="No priority action recorded" text="Waiting for evidence before DEC can assign or verify an action." />}</div></article>
    </section>
    <section className="decision-questions"><h2>Five questions for the next decision</h2>{[
      ["Do we have enough evidence?", readiness.some((s: any) => s.criticalGaps.length) ? "Critical gaps remain" : "Critical checks have evidence", "readiness"],
      ["Is anything blocking?", unresolved.length ? `${unresolved.length} unresolved critical issue` : "No unresolved confirmed blocker", "findings"],
      ["Where is experience fragile?", reviews.length ? "Review quality evidence by domain" : "Waiting for quality evidence", "quality"],
      ["What must DEC act on?", `${high.length} high action(s) due now/before next stage`, "actions"],
      ["What can wait?", `${findings.filter((f: Finding) => ["Validate during selected-CSO pilot", "Before wider release", "Later programme / phase"].includes(f.decisionHorizon)).length} item(s) beyond immediate horizon`, "actions"],
    ].map(([q, a, link]) => <Link href={`${routePrefix}/${link}`} key={q}><span>{q}</span><strong>{a}</strong><b aria-hidden="true">→</b></Link>)}</section>
  </>;
}

function Coverage({ reviews, quick, openDrawer }: any) {
  const testers = [...new Set(reviews.map((r: any) => r.testerId))];
  return <><section className="metric-grid"><Metric label="Testers with reviews" value={testers.length} detail="unique tester identifiers" /><Metric label="HRBA reviews" value={reviews.filter((r: any) => r.course === "hrba").length} detail="course-level evidence" tone="teal" /><Metric label="PM reviews" value={reviews.filter((r: any) => r.course === "pm").length} detail="course-level evidence" tone="green" /><Metric label="Quick Findings" value={quick.length} detail="repeated observation submissions" tone="amber" /></section>
<section className="panel"><div className="section-title"><div><p className="eyebrow">TESTING PROGRESS</p><h2>Evidence receipt by tester</h2></div><span className="method-note">Coordination evidence only</span></div><div className="table-wrap"><table><thead><tr><th>Tester</th><th>Assigned course</th><th>Device</th><th>Completion</th><th>Quick Findings</th><th>Final Review</th><th>Special checks</th></tr></thead><tbody>{reviews.map((r: any) => <tr key={r.id}><td><button className="text-link" onClick={() => openDrawer({ title: `${r.testerId} evidence`, rows: [{ id: r.id, meta: COURSE_LABELS[r.course as Course], text: `${r.completion} on ${r.device}`, source: r.sourceId }, ...quick.filter((q: any) => q.testerId === r.testerId).map((q: any) => ({ id: q.id, meta: "Quick Finding", text: q.whatHappened, source: q.sourceId }))] })}>{r.testerId}</button></td><td>{COURSE_LABELS[r.course as Course]}</td><td>{r.device}</td><td>{r.completion}</td><td>{quick.filter((q: any) => q.testerId === r.testerId).length}</td><td><StatusPill tone="positive">Received</StatusPill></td><td>{r.practical.filter((p: any) => p.applicable && PRACTICAL_CHECKS.find((c) => c[0] === p.xmlName)?.[2] === "assigned").length || "None assigned"}</td></tr>)}</tbody></table></div></section>
  {reviews.length === 0 && <Empty title="No Final Reviews received yet" text="Tester, device and completion rows will appear here when DEC pilot evidence is received." />}</>;
}

function Practical({ reviews, openDrawer }: any) {
  return <section className="panel"><div className="section-title"><div><p className="eyebrow">16 LEARNER-JOURNEY CHECKS</p><h2>Did each task work when performed?</h2></div><div className="legend">{PRACTICAL_RESULTS.map((x) => <span key={x}><i className={toneForDecision(x)} />{x}</span>)}</div></div><div className="table-wrap"><table className="evidence-table"><thead><tr><th>Check</th><th>Coverage</th><th>Result distribution</th><th>Tested</th><th>Issues</th></tr></thead><tbody>{PRACTICAL_CHECKS.map(([xml, label, coverage], index) => { const { counts, assigned, tested } = countPractical(reviews, xml); const rows = reviews.flatMap((r: any) => { const p = r.practical.find((x: any) => x.xmlName === xml); return p?.applicable ? [{ id: r.id, meta: `${r.testerId} · ${p.result}`, text: p.what || `${label}: ${p.result}`, source: r.sourceId }] : []; }); return <tr key={xml}><td><span className="item-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{label}</strong><code>{xml}</code></div></td><td><span className="coverage-tag">{coverage === "core" ? "CORE" : "ASSIGNED"}</span></td><td><StackedBar values={[counts.FAIL, counts["PASS WITH ISSUE"], counts.PASS, 0, counts["NOT TESTED"]]} labels={["FAIL", "PASS WITH ISSUE", "PASS", "", "NOT TESTED"]} total={assigned} onOpen={() => openDrawer({ title: label, rows })} /><div className="bar-labels"><span>{counts.FAIL} fail</span><span>{counts["PASS WITH ISSUE"]} issue</span><span>{counts.PASS} pass</span><span>{counts["NOT TESTED"]} not tested</span></div></td><td><strong>{tested}</strong> / {assigned}</td><td>{counts.FAIL + counts["PASS WITH ISSUE"] ? <StatusPill tone={counts.FAIL ? "critical" : "attention"}>{counts.FAIL + counts["PASS WITH ISSUE"]} to review</StatusPill> : assigned ? <StatusPill tone="positive">No issue reported</StatusPill> : <StatusPill tone="neutral">No evidence</StatusPill>}</td></tr>; })}</tbody></table></div></section>;
}

function Quality({ reviews, openDrawer }: any) {
  const domains = [...new Set(QUALITY_INDICATORS.map((i) => i.domain))];
  return <div className="domain-grid">{domains.map((domain) => { const items = QUALITY_INDICATORS.filter((i) => i.domain === domain); const aggregate = items.reduce((a, i) => { const c = countQuality(reviews, i.xmlName).counts; a[0] += c["0 BLOCKED"]; a[1] += c["1 FRAGILE"]; a[2] += c["2 WORKABLE"]; a[3] += c["3 STRONG"]; a[4] += c["NOT TESTED / N/A"]; return a; }, [0, 0, 0, 0, 0]); const total = aggregate.reduce((a, b) => a + b, 0); return <section className="panel domain" key={domain}><div className="section-title"><div><p className="eyebrow">QUALITY DOMAIN</p><h2>{domain}</h2></div><strong>{total - aggregate[4]} valid</strong></div><StackedBar values={aggregate} labels={["0 BLOCKED", "1 FRAGILE", "2 WORKABLE", "3 STRONG", "NOT TESTED / N/A"]} total={total} /><div className="domain-summary"><span><b>{aggregate[0]}</b> blocked</span><span><b>{aggregate[1]}</b> fragile</span><span><b>{aggregate[2] + aggregate[3]}</b> workable/strong</span><span><b>{aggregate[4]}</b> not tested</span></div><div className="indicator-list">{items.map((i) => { const c = countQuality(reviews, i.xmlName); return <button key={i.xmlName} onClick={() => openDrawer({ title: i.label, rows: reviews.flatMap((r: any) => { const x = r.quality.find((q: any) => q.xmlName === i.xmlName); return x ? [{ id: r.id, meta: `${r.testerId} · ${x.rating}`, text: x.comment || "No comment was required for this rating.", source: r.sourceId }] : []; }) })}><span>{i.label}<code>{i.xmlName}</code></span><b>{c.valid} / {c.total}</b><StatusPill tone={c.counts["0 BLOCKED"] ? "critical" : c.counts["1 FRAGILE"] ? "attention" : c.valid ? "positive" : "neutral"}>{c.counts["0 BLOCKED"] ? "Blocked" : c.counts["1 FRAGILE"] ? "Fragile" : c.valid ? "Evidence" : "No evidence"}</StatusPill></button>; })}</div></section>; })}</div>;
}

function Learning({ reviews, openDrawer }: any) {
  return <div className="course-columns">{(["hrba", "pm"] as const).map((course) => { const courseReviews = reviews.filter((r: any) => r.course === course); const items = QUALITY_INDICATORS.filter((i) => i.domain === "Learning & Better Decisions" && (i.appliesTo === "all" || i.appliesTo === course)); return <section className="panel" key={course}><div className="course-heading"><span className={`system-mark ${course}`}>{course.toUpperCase()}</span><div><p className="eyebrow">COURSE-SPECIFIC PATH</p><h2>{COURSE_LABELS[course]}</h2><p>{course === "hrba" ? "Rights, power, participation, design, implementation and MEAL decisions." : "Purpose, roles, planning, risk/change, monitoring/adaptation and closure."}</p></div></div>{courseReviews.length === 0 ? <Empty title="No evidence in this filter" text="Course-specific indicators remain unavailable rather than being treated as positive." /> : <div className="learning-list">{items.map((i) => { const c = countQuality(courseReviews, i.xmlName); return <button key={i.xmlName} onClick={() => openDrawer({ title: i.label, rows: courseReviews.map((r: any) => { const x = r.quality.find((q: any) => q.xmlName === i.xmlName); return { id: r.id, meta: `${r.testerId} · ${x?.rating ?? "No evidence"}`, text: x?.comment || "No comment required.", source: r.sourceId }; }) })}><span><strong>{i.label}</strong><code>{i.xmlName}</code></span><StackedBar values={[c.counts["0 BLOCKED"], c.counts["1 FRAGILE"], c.counts["2 WORKABLE"], c.counts["3 STRONG"], c.counts["NOT TESTED / N/A"]]} labels={[...QUALITY_RATINGS]} total={c.total} /><b>{c.valid} valid</b></button>; })}</div>}</section>; })}</div>;
}

function Transfer({ reviews, promote }: any) {
  const evidence = reviews.flatMap((r: any) => r.qualitative).filter((e: any) => ["Workplace Use", "Best Decision Activity"].includes(e.kind));
  const supports = ["Practical tool/template", "Peer-learning session", "Coaching/mentoring", "Organisational reflection", "Local-language resource"];
  const supportEvidence = reviews.flatMap((r: any) => r.qualitative).filter((e: QualitativeEvidence) => e.kind === "Support Need");
  return <div className="two-column"><section className="panel"><div className="section-title"><div><p className="eyebrow">PRACTICE TRANSFER</p><h2>How could learning be used?</h2></div><span>{evidence.length} excerpts</span></div><div className="excerpt-list">{evidence.map((e: any) => <Excerpt key={e.id} evidence={e} onPromote={() => promote(e)} />)}{evidence.length === 0 && <Empty title="No transfer evidence received yet" text="Workplace-use and decision-activity excerpts will be retained here when submitted." />}</div></section><section className="panel"><div className="section-title"><div><p className="eyebrow">SUPPORT BRIDGE</p><h2>What may be needed beyond the course?</h2></div></div><p className="panel-intro">The course should not absorb organisational, resource or programme-level needs. These categories preserve the appropriate response boundary.</p><div className="support-list">{supports.map((s, i) => <div key={s}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{s}</strong><p>{supportEvidence.length ? "Validate after DEC evidence review" : "Waiting for pilot evidence"}</p></div><StatusPill tone={supportEvidence.length ? "attention" : "neutral"}>{supportEvidence.length} mention(s)</StatusPill></div>)}</div></section></div>;
}

function Findings({ reviews, quick, findings, openDrawer }: any) {
  const explicitReports = reviews.filter((review: FinalReview) => review.possibleBlocker === "yes" || review.possibleBlocker === "not_sure");
  return <><section className="metric-grid"><Metric label="Quick Findings" value={quick.length} detail="event-level observations; no blocker classification" /><Metric label="Explicit possible-blocker reports" value={explicitReports.length} detail="Final Review yes + not sure" tone="red" /><Metric label="Confirmed blocker findings" value={findings.filter((f: Finding) => f.blockerClassification === "Confirmed blocker").length} detail="DEC analyst classification" tone="amber" /><Metric label="Verified closed" value={findings.filter((f: Finding) => f.status === "Verified Closed").length} detail="visible, not unresolved" tone="green" /></section><section className="panel"><div className="section-title"><div><p className="eyebrow">OBSERVATION STREAM</p><h2>Quick Findings and triage</h2></div><span className="method-note">Exact tester wording · classification requires review</span></div><div className="finding-stream">{quick.map((q: QuickFinding) => <article key={q.id}><div className="finding-meta"><StatusPill tone="neutral">Quick Finding</StatusPill><span>{formatTesterSubmittedAt(q.submittedAt)}</span></div><h3>{q.stableId}</h3><blockquote>{q.whatHappened}</blockquote><p><strong>Recommendation:</strong> {q.recommendation}</p><footer><span>{q.testerId} · {COURSE_LABELS[q.course]}</span><button onClick={() => openDrawer({ title: `${q.id} source record`, rows: [{ id: q.id, meta: "Quick Finding · unclassified observation", text: q.whatHappened, source: q.sourceId }] })}>View source →</button></footer></article>)}{quick.length === 0 && <Empty title="No Quick Findings received yet" text="Submitted event-level observations will appear here for DEC triage." />}</div></section></>;
}

function Actions({ findings, save }: { findings: Finding[]; save: (f: Finding) => void }) {
  const [expanded, setExpanded] = useState<string | null>(findings[0]?.id ?? null);
  const statuses: FindingStatus[] = ["New", "Under Review", "Action Agreed", "In Progress", "Ready for Verification", "Verified Closed", "Not an Issue"];
  return <section className="panel"><div className="section-title"><div><p className="eyebrow">OPERATIONAL DECISION WORKSPACE</p><h2>Finding-to-Action register</h2></div><span>{findings.length} findings</span></div>{findings.length === 0 ? <Empty title="No findings-to-action records yet" text="DEC findings remain separate from raw observations and will be created only after evidence review." /> : <div className="action-table"><div className="action-head"><span>Finding</span><span>Severity</span><span>Decision Horizon</span><span>Owner</span><span>Status</span><span /></div>{findings.map((f) => <div className={`action-row ${expanded === f.id ? "expanded" : ""}`} key={f.id}><div><strong>{f.id} · {f.domain}</strong><small>{COURSE_LABELS[f.course]} · {f.findingType}</small></div><StatusPill tone={f.severity === "Critical" ? "critical" : f.severity === "High" ? "attention" : "neutral"}>{f.severity}</StatusPill><span>{f.decisionHorizon}</span><span>{f.owner || "Unassigned"}</span><label className="sr-label">Status for {f.id}<select value={f.status} onChange={(e) => save({ ...f, status: e.target.value as FindingStatus, history: [...f.history, { at: new Date().toISOString(), event: `Status changed to ${e.target.value}` }] })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></label><button className="expand-button" onClick={() => setExpanded(expanded === f.id ? null : f.id)} aria-expanded={expanded === f.id}>{expanded === f.id ? "−" : "+"}</button>{expanded === f.id && <div className="action-detail"><dl><div><dt>Evidence</dt><dd>{f.evidence}</dd></div><div><dt>Interpretation</dt><dd>{f.interpretation}</dd></div><div><dt>Recommended action</dt><dd>{f.recommendedAction}</dd></div><div><dt>Source record IDs</dt><dd>{f.sourceRecordIds.join(", ")}</dd></div><div><dt>Pattern / recurrence</dt><dd>{f.recurrence}</dd></div><div><dt>Blocker classification</dt><dd>{f.blockerClassification}</dd></div><div><dt>Response area</dt><dd>{f.responseArea}</dd></div><div><dt>Target timing</dt><dd>{f.targetTiming}</dd></div></dl><label>Verification / result<textarea value={f.verification} placeholder="Record the recheck evidence before closing." onChange={(e) => save({ ...f, verification: e.target.value })} /></label><div className="history"><strong>History</strong>{f.history.map((h, i) => <p key={i}><time>{formatTesterSubmittedAt(h.at)}</time>{h.event}</p>)}</div></div>}</div>)}</div>}</section>;
}

function Qualitative({ reviews, promote }: any) {
  const [search, setSearch] = useState(""); const [kind, setKind] = useState("all");
  const evidence: QualitativeEvidence[] = reviews.flatMap((r: any) => r.qualitative).filter((e: QualitativeEvidence) => (kind === "all" || e.kind === kind) && e.excerpt.toLowerCase().includes(search.toLowerCase()));
  const kinds = [...new Set(reviews.flatMap((r: any) => r.qualitative.map((e: any) => e.kind)))] as string[];
  return <section className="panel"><div className="section-title"><div><p className="eyebrow">EXACT SOURCE EXCERPTS</p><h2>Qualitative Evidence Explorer</h2></div><span>{evidence.length} excerpts</span></div><div className="evidence-tools"><label>Search comments<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tester wording…" /></label><label>Evidence view<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All qualitative evidence</option>{kinds.map((x) => <option key={x}>{x}</option>)}</select></label></div><div className="evidence-tabs">{["all", ...kinds].map((x) => <button className={kind === x ? "active" : ""} key={x} onClick={() => setKind(x)}>{x === "all" ? "All evidence" : x}</button>)}</div><div className="excerpt-grid">{evidence.map((e) => <Excerpt key={e.id} evidence={e} onPromote={() => promote(e)} />)}{evidence.length === 0 && <Empty title="No matching excerpts" text="Try clearing the search or changing the evidence view." />}</div></section>;
}

function Readiness({ signals, findings, realMode }: any) {
  const [decisions, setDecisions] = useState<HumanReadinessDecision[]>([]);
  const [saved, setSaved] = useState<Course | null>(null);
  const update = (course: Course, patch: Partial<HumanReadinessDecision>) => setDecisions((current) => { const found = current.find((d) => d.course === course) ?? { course, decision: "INSUFFICIENT EVIDENCE - NEED MORE TESTING", reason: "", owner: "", date: "" } as HumanReadinessDecision; return [...current.filter((d) => d.course !== course), { ...found, ...patch }]; });
  const persist = async (decision: HumanReadinessDecision) => {
    if (realMode) { const response = await fetch("/api/readiness", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(decision) }); if (!response.ok) return; }
    else window.localStorage.setItem(`dec-readiness-${decision.course}`, JSON.stringify(decision));
    setSaved(decision.course);
  };
  return <div className="readiness-record">{signals.map((s: any) => { const human = decisions.find((d) => d.course === s.course); const history = findings.filter((f: Finding) => f.course === s.course && f.severity === "Critical"); return <section className="panel" key={s.course}><div className="readiness-record-head"><div><span className="system-mark">{s.course === "hub" ? "LH" : s.course.toUpperCase()}</span><div><p className="eyebrow">{s.label}</p><h2>Evidence signal</h2></div></div><StatusPill>{s.decision}</StatusPill></div><p className="signal-reason">{s.reason}</p><div className="signal-stats"><div><span>Final Reviews</span><strong>{s.finalReviews}</strong></div><div><span>Unresolved critical</span><strong>{s.unresolvedCritical}</strong></div><div><span>Historical blockers</span><strong>{s.historicalBlockers}</strong></div><div><span>Critical gaps</span><strong>{s.criticalGaps.length}</strong></div><div><span>High actions due</span><strong>{s.highActions}</strong></div></div>{s.criticalGaps.length > 0 && <div className="gap-list"><strong>Critical evidence still needed</strong><p>{s.criticalGaps.join(" · ")}</p></div>}<div className="history-strip"><strong>Critical history</strong>{history.map((f: Finding) => <span key={f.id}><StatusPill tone={f.status === "Verified Closed" ? "positive" : "critical"}>{f.status}</StatusPill>{f.id} · {f.domain}</span>)}{history.length === 0 && <span>No critical finding has been recorded.</span>}</div><form className="decision-form" onSubmit={(e) => e.preventDefault()}><div className="form-title"><div><p className="eyebrow">HUMAN DECISION · SEPARATE RECORD</p><h3>DEC final readiness decision</h3></div><StatusPill tone="neutral">Not automated</StatusPill></div><label>Final readiness decision<select value={human?.decision ?? ""} onChange={(e) => update(s.course, { decision: e.target.value as HumanReadinessDecision["decision"] })}><option value="">Select after DEC review</option>{READINESS_DECISIONS.map((d) => <option key={d}>{d}</option>)}</select></label><label>Main reason<textarea value={human?.reason ?? ""} onChange={(e) => update(s.course, { reason: e.target.value })} placeholder="Record the evidence-based reason for DEC’s decision." /></label><div className="form-row"><label>Decision owner / group<input value={human?.owner ?? ""} onChange={(e) => update(s.course, { owner: e.target.value })} /></label><label>Decision date<input type="date" value={human?.date ?? ""} onChange={(e) => update(s.course, { date: e.target.value })} /></label></div><button className="primary-button" onClick={() => human && void persist(human)} disabled={!human?.decision || !human.reason || !human.owner || !human.date}>{saved === s.course ? "Decision record saved" : "Save decision record"}</button></form></section>; })}</div>;
}

function DecisionHorizon({ findings, routePrefix }: { findings: Finding[]; routePrefix: string }) {
  const max = Math.max(...DECISION_HORIZONS.map((h) => findings.filter((f) => f.decisionHorizon === h).length), 1);
  return <article className="panel decision-horizon-panel"><div className="section-title"><div><p className="eyebrow">ACTION TIMING</p><h2>Decision Horizon</h2></div><Link href={`${routePrefix}/actions`}>Open workspace →</Link></div><div className="horizon-chart">{DECISION_HORIZONS.map((h, i) => { const count = findings.filter((f) => f.decisionHorizon === h).length; return <div key={h}><span>{h}</span><div><i className={`horizon-${i}`} style={{ width: `${Math.max((count / max) * 100, count ? 8 : 0)}%` }} /></div><strong>{count}</strong></div>; })}</div></article>;
}

function Excerpt({ evidence, onPromote }: { evidence: QualitativeEvidence; onPromote: () => void }) {
  return <article className="excerpt"><div><StatusPill tone={evidence.kind === "Possible Blocker" ? "critical" : evidence.kind === "Priority Improvement" ? "attention" : evidence.kind === "KEEP" ? "positive" : "neutral"}>{evidence.kind}</StatusPill><span>{COURSE_LABELS[evidence.course]}</span></div><blockquote>“{evidence.excerpt}”</blockquote><footer><span>{evidence.testerId} · <code>{evidence.sourceField}</code> · {evidence.reviewId}</span><button onClick={onPromote}>Promote to finding →</button></footer></article>;
}

function promote(evidence: QualitativeEvidence, findings: Finding[], save: (f: Finding[]) => void) {
  if (findings.some((f) => f.sourceRecordIds.includes(evidence.id))) { window.location.href = "/actions"; return; }
  const id = `F-${String(Math.max(0, ...findings.map((f) => Number(f.id.replace("F-", "")) || 0)) + 1).padStart(3, "0")}`;
  const finding: Finding = { id, course: evidence.course, domain: evidence.domain, evidence: evidence.excerpt, sourceRecordIds: [evidence.id, evidence.reviewId], recordCount: 1, recurrence: "Single promoted observation—review recurrence", severity: evidence.kind === "Possible Blocker" ? "Critical" : "Medium", blockerClassification: evidence.kind === "Possible Blocker" ? "Needs triage" : "Not a blocker", interpretation: "Promoted from qualitative evidence; DEC interpretation required.", actionDecision: "Investigate Further", recommendedAction: "Review the linked source and agree a proportionate response.", priority: evidence.kind === "Priority Improvement" ? "High" : "Medium", owner: "", targetTiming: "", status: "New", verification: "", responseArea: "Course improvement", findingType: evidence.kind, decisionHorizon: evidence.kind === "Priority Improvement" ? "Before selected-CSO pilot" : "Validate during selected-CSO pilot", history: [{ at: new Date().toISOString(), event: `Promoted from ${evidence.sourceField} without retyping source evidence` }] };
  save([...findings, finding]); window.location.href = "/actions";
}

function EvidenceDrawer({ title, rows, onClose }: { title: string; rows: DrawerRow[]; onClose: () => void }) {
  return <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><aside className="drawer" role="dialog" aria-modal="true" aria-label={title}><header><div><p className="eyebrow">SUPPORTING RECORDS</p><h2>{title}</h2><span>{rows.length} record(s)</span></div><button onClick={onClose} aria-label="Close evidence drawer">×</button></header><div className="drawer-body">{rows.map((r) => <article key={`${r.id}-${r.source}`}><div><strong>{r.id}</strong>{r.source && <code>source {r.source}</code>}</div><span>{r.meta}</span><p>{r.text}</p></article>)}{rows.length === 0 && <Empty title="No supporting records" text="No evidence matches the current filter. This is not a positive result." />}</div></aside></div>;
}

function Empty({ title, text }: { title: string; text: string }) { return <div className="empty-state"><span aria-hidden="true">∅</span><div><strong>{title}</strong><p>{text}</p></div></div>; }
