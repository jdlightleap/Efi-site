// Build step on Vercel: no compilation, just confirm the baked data and assets are present and secret-free.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const need = ["public/index.html", "public/data/data.js", "public/data/data.json", "public/assets/app.js", "public/assets/signals.js", "public/assets/config.js", "public/assets/app.css"];
for (const f of need) statSync(f);
const data = JSON.parse(readFileSync("public/data/data.json", "utf8"));
for (const k of ["networks", "weather", "projects", "flood", "headroom", "queues", "datacentres"]) if (!data[k]) throw new Error(`data.json missing ${k}`);
const bad = [/eyJhbGciOi[A-Za-z0-9_-]{10,}/, /sb_secret_[A-Za-z0-9_-]{10,}/, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*\S{20,}/, /postgres(ql)?:\/\/[^\s"']+:[^\s"']+@/, /service_role/];
const walk = d => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const f of walk("public").filter(f => /\.(js|json|html|css|txt|svg)$/.test(f))) {
  const t = readFileSync(f, "utf8");
  for (const re of bad) if (re.test(t)) throw new Error(`possible secret in ${f} (${re})`);
}
console.log(`EFI check OK: data built ${data.built_at}, ${data.networks.length} networks, no secrets in public/`);
