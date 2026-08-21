import SimulationDashboard from "@/components/simulation-dashboard";

export default async function SimulationViewPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <SimulationDashboard view={slug[0] ?? "overview"} />;
}
