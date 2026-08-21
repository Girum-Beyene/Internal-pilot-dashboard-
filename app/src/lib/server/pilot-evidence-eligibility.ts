type SourceRow = { tester_id?: unknown; source_submission_id?: unknown };

// Activation evidence stays in the audit/source store but is never included in
// real pilot analysis. Pilot tester identifiers must be present and must not use
// the reserved CONTROLLED_* / CONTROLLED-* activation namespace.
export function isRealPilotTesterId(value: unknown) {
  const testerId = String(value ?? "").trim();
  return Boolean(testerId) && !/^CONTROLLED(?:_|-|$)/i.test(testerId);
}

export function partitionPilotRows<T extends SourceRow>(rows: T[]) {
  const included: T[] = [];
  const excluded: T[] = [];
  for (const row of rows) (isRealPilotTesterId(row.tester_id) ? included : excluded).push(row);
  return { included, excluded };
}
