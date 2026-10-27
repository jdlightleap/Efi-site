// POST /api/feedback: stores signal feedback, general feedback and workshop requests in Supabase.
// Env (server only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EFI_PREVIEW_PASSWORD.
import { isAuthed, clientIp, limiter, SECURITY_HEADERS } from "../lib/auth.js";
import { validate, insert } from "../lib/feedback.js";

const perIp = limiter(8, 10 * 60 * 1000); // 8 submissions per IP per 10 minutes (in memory, never stored)
const MAX_BYTES = 16 * 1024;

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...SECURITY_HEADERS } });

export async function POST(request) {
  if (!(await isAuthed(request))) return json(401, { error: "Please sign in to the preview again." });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json(403, { error: "Invalid request." });
  if (!(request.headers.get("content-type") || "").includes("application/json")) return json(415, { error: "Invalid request." });
  if (!perIp(clientIp(request))) return json(429, { error: "You’ve sent a lot of feedback in a short time. Please try again in 10 minutes." });

  const text = await request.text();
  if (text.length > MAX_BYTES) return json(413, { error: "That’s too long. Please shorten your comment." });
  let body;
  try { body = JSON.parse(text); } catch { return json(400, { error: "Invalid request." }); }

  const v = validate(body);
  if (v.silent) return json(200, { ok: true });
  if (v.error) return json(v.status, { error: v.error });

  try {
    const r = await insert(v.table, v.row);
    if (r.status === 503) return json(503, { error: "Feedback storage isn’t switched on yet. Please email us instead." });
    if (!r.ok) { console.error(`feedback insert failed: ${v.table} HTTP ${r.status}`); return json(502, { error: "Sorry, that didn’t send. Please try again in a minute." }); }
  } catch (e) {
    console.error(`feedback insert error: ${v.table} ${e && e.name}`);
    return json(502, { error: "Sorry, that didn’t send. Please try again in a minute." });
  }
  return json(201, { ok: true });
}

export function GET() { return json(405, { error: "Method not allowed." }); }
