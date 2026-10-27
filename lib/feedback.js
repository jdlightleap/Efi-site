// Validation and storage for EFI feedback. Pure functions plus one PostgREST insert.
export const NETWORKS = ["gb", "ukpn", "spen", "ssen_d", "nged", "npg", "enwl", "neso", "nget", "spt", "ssen_t"];
export const SIGNALS = ["storm", "dcflex", "queue", "flood", "sst"];
export const ROUTES = ["NIA", "SIF", "BAU", "Other"];
export const SITE_VERSION = "preview-2026-10";
const EMAIL = /^[^\s@]{1,100}@[^\s@]{1,100}\.[^\s@]{2,}$/;

const clean = (v, max) => {
  if (v == null) return null;
  const s = String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return s ? s.slice(0, max) : null;
};
const pick = (v, list) => (list.includes(v) ? v : null);

// Returns {table, row} or {error, status}. {silent:true} means "accept but do not store" (bots).
export function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Invalid request.", status: 400 };
  if (clean(body.website, 200)) return { silent: true };                       // honeypot
  const elapsed = Number(body.elapsed_ms);
  if (!Number.isFinite(elapsed) || elapsed < 1500) return { silent: true };     // time trap: submitted under 1.5 s after the form appeared
  const kind = pick(body.kind, ["signal", "general", "workshop"]);
  if (!kind) return { error: "Invalid request.", status: 400 };

  const consent = body.consent === true;
  const contact = {
    name: consent ? clean(body.name, 120) : null,
    email: consent ? clean(body.email, 200) : null,
    organisation: consent ? clean(body.organisation, 160) : null
  };
  if (contact.email && !EMAIL.test(contact.email)) return { error: "That email address doesn’t look right.", status: 400 };
  const base = { network_id: pick(body.network, NETWORKS), signal_id: pick(body.signal, SIGNALS), page: clean(body.page, 200), site_version: SITE_VERSION, consent_followup: consent, ...contact };

  if (kind === "workshop") {
    if (!consent || !contact.email) return { error: "We need an email address and your agreement to contact you about the workshop.", status: 400 };
    return { table: "workshop_requests", row: { ...base, funding_route: pick(body.funding_route, ROUTES), notes: clean(body.notes, 2000), timing: clean(body.timing, 300) } };
  }
  const comment = clean(body.comment, 4000), useful = pick(body.useful, ["yes", "no"]);
  if (kind === "signal" && !base.signal_id) return { error: "Invalid request.", status: 400 };
  if (kind === "general" && !comment) return { error: "Please add your feedback.", status: 400 };
  if (kind === "signal" && !useful && !comment) return { error: "Choose Yes or Not really, or add a comment.", status: 400 };
  return { table: "site_feedback", row: { ...base, kind, useful: kind === "signal" ? useful : null, comment } };
}

export async function insert(table, row, env = process.env, fetchImpl = fetch) {
  const url = (env.SUPABASE_URL || "").replace(/\/+$/, ""), key = env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return { ok: false, status: 503 };
  const headers = { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`; // legacy JWT service_role key; new sb_secret_ keys use apikey only
  const r = await fetchImpl(`${url}/rest/v1/${table}`, { method: "POST", headers, body: JSON.stringify(row), signal: AbortSignal.timeout(8000) });
  return { ok: r.ok, status: r.status };
}
