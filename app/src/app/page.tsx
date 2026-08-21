import Dashboard from "@/components/dashboard";
import { emptyDashboardEvidence } from "@/lib/dashboard-evidence";

export default function HomePage() {
  return <Dashboard view="overview" mode="real" initialEvidence={emptyDashboardEvidence()} />;
}
