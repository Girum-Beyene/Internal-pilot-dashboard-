import Dashboard from "@/components/dashboard";
import { emptyDashboardEvidence } from "@/lib/dashboard-evidence";

export default async function DashboardPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <Dashboard view={slug[0] ?? "overview"} mode="real" initialEvidence={emptyDashboardEvidence()} />;
}
