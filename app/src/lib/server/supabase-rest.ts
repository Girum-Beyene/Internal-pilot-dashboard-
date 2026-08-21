const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value.replace(/\/$/, "");
};

export async function upsertRows(table: string, rows: Record<string, unknown>[], conflict: string) {
  if (!rows.length) return;
  const base = required("SUPABASE_URL");
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  const schema = process.env.SUPABASE_SCHEMA ?? "dec_pilot";
  const response = await fetch(`${base}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Content-Profile": schema,
      "Accept-Profile": schema,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`Supabase ${table} upsert failed (${response.status}): ${await response.text()}`);
}

export async function insertRow(table: string, row: Record<string, unknown>) {
  const base = required("SUPABASE_URL");
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  const schema = process.env.SUPABASE_SCHEMA ?? "dec_pilot";
  const response = await fetch(`${base}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Content-Profile": schema, "Accept-Profile": schema, Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!response.ok) throw new Error(`Supabase ${table} insert failed (${response.status}): ${await response.text()}`);
  return response.json();
}

export async function getRows(table: string, query = "select=*") {
  const base = required("SUPABASE_URL");
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  const schema = process.env.SUPABASE_SCHEMA ?? "dec_pilot";
  const response = await fetch(`${base}/rest/v1/${table}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": schema }, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase ${table} read failed (${response.status}): ${await response.text()}`);
  return response.json() as Promise<Record<string, unknown>[]>;
}
