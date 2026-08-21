import type { QuickFinding } from "./evidence-model";

const PILOT_TIME_ZONE = "Africa/Addis_Ababa";
const submittedAtFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PILOT_TIME_ZONE,
});

export function findingsForTester(findings: QuickFinding[], testerId: string) {
  return findings.filter((finding) => finding.testerId === testerId).sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}

export function formatTesterSubmittedAt(submittedAt: string) {
  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const parts = Object.fromEntries(submittedAtFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} EAT`;
}

export function buildFinalReviewUrl(formUrl: string | undefined, testerId: string, course: "hrba" | "pm", returnUrl?: string) {
  if (!formUrl) return null;
  const url = new URL(formUrl);
  // Kobo's `/x/` URL is the offline-capable form. Use the deployed Collect
  // Data entry route so hidden-field URL prefills are honored.
  const offlineMatch = url.pathname.match(/^\/x\/([^/]+)$/);
  if (offlineMatch) url.pathname = `/${offlineMatch[1]}`;
  // Final Review keeps its identity fields inside the sec_a group.
  url.searchParams.set("d[sec_a/tester_id]", testerId);
  url.searchParams.set("d[sec_a/course]", course);
  if (returnUrl) url.searchParams.set("return_url", returnUrl);
  return url.toString();
}
