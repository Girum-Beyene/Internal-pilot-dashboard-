"use client";

import { useMemo } from "react";
import Dashboard from "@/components/dashboard";
import { simulationDashboardEvidence } from "@/lib/simulation-evidence";

export default function SimulationDashboard({ view }: { view: string }) {
  const evidence = useMemo(() => simulationDashboardEvidence(), []);

  return <Dashboard view={view} mode="simulation" initialEvidence={evidence} />;
}
