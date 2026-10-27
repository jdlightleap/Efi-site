import test from "node:test";
import assert from "node:assert/strict";
import { validate, insert } from "../lib/feedback.js";
import { tokenFor, isAuthed, passwordMatches } from "../lib/auth.js";

const ok = { elapsed_ms: 5000 };
test("honeypot and time trap are silently dropped", () => {
  assert.equal(validate({ ...ok, kind: "general", comment: "x", website: "spam" }).silent, true);
  assert.equal(validate({ kind: "general", comment: "x", elapsed_ms: 400 }).silent, true);
});
test("contact details are dropped without consent", () => {
  const v = validate({ ...ok, kind: "signal", signal: "flood", useful: "no", name: "A", email: "a@b.co" });
  assert.equal(v.table, "site_feedback"); assert.equal(v.row.email, null); assert.equal(v.row.name, null);
});
test("workshop needs email and consent", () => {
  assert.equal(validate({ ...ok, kind: "workshop", email: "a@b.co" }).status, 400);
  assert.equal(validate({ ...ok, kind: "workshop", consent: true, email: "a@b.co", funding_route: "SIF" }).table, "workshop_requests");
});
test("unknown ids are rejected or nulled", () => {
  assert.equal(validate({ ...ok, kind: "signal", signal: "x", useful: "yes" }).status, 400);
  assert.equal(validate({ ...ok, kind: "general", comment: "c", network: "zzz" }).row.network_id, null);
});
test("insert fails closed without env and never sends Bearer for non-JWT keys", async () => {
  assert.equal((await insert("site_feedback", {}, {})).status, 503);
  let seen; const fake = async (u, o) => { seen = o.headers; return { ok: true, status: 201 }; };
  await insert("site_feedback", {}, { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test" }, fake);
  assert.equal(seen.Authorization, undefined); assert.equal(seen.Prefer, "return=minimal");
});
test("password gate", async () => {
  const req = c => new Request("https://x/", { headers: { cookie: `efi_preview=${c}` } });
  assert.equal(await isAuthed(req(await tokenFor("pw")), "pw"), true);
  assert.equal(await isAuthed(req("nope"), "pw"), false);
  assert.equal(await isAuthed(req(await tokenFor("pw")), ""), false);
  assert.equal(await passwordMatches("pw", "pw"), true);
});
