import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { emptyDashboardEvidence } from "../src/lib/dashboard-evidence";
import { simulationDashboardEvidence } from "../src/lib/simulation-evidence";
import { allReadiness, possibleBlockerSummary } from "../src/lib/analytics";

test("real dashboard starts with zero evidence and never receives simulation fixtures", () => {
  const real = emptyDashboardEvidence();
  const simulation = simulationDashboardEvidence();
  assert.deepEqual(real, { reviews: [], quick: [], findings: [] });
  assert.ok(simulation.reviews.length > 0);
  assert.ok(simulation.quick.length > 0);
  assert.ok(simulation.findings.length > 0);
  simulation.findings[0].status = "Not an Issue";
  assert.deepEqual(real, { reviews: [], quick: [], findings: [] });
});

test("simulation blocker and action evidence cannot influence real readiness", () => {
  const real = emptyDashboardEvidence();
  const simulation = simulationDashboardEvidence();
  assert.equal(possibleBlockerSummary(real.reviews, real.findings).unresolved.length, 0);
  assert.equal(allReadiness(real.reviews, real.findings).every((signal) => signal.decision === "INSUFFICIENT EVIDENCE - NEED MORE TESTING"), true);
  assert.ok(possibleBlockerSummary(simulation.reviews, simulation.findings).historical.length > 0);
});

test("real dashboard component has no fixture import or Kobo write path", () => {
  const source = readFileSync(new URL("../src/components/dashboard.tsx", import.meta.url), "utf8");
  assert.equal(source.includes('from "@/lib/fixtures"'), false);
  assert.equal(source.includes('fetch("/api/kobo'), false);
  assert.equal(source.includes('fetch("/api/sync"'), false);
});
