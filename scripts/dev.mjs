// Local preview server that mimics Vercel: middleware -> static files (filesystem first) -> /api functions -> SPA rewrite.
// Feedback goes to an in-memory mock Supabase unless SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.
//   npm run dev            -> http://localhost:3000   (password defaults to "preview" locally)
//   GET /__mock/rows       -> rows the mock received (local only)
import http from "node:http";
import { gzipSync } from "node:zlib";
import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = new URL("..", import.meta.url).pathname;
if (existsSync(join(root, ".env"))) for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}
const PORT = Number(process.env.PORT || 3000);
process.env.EFI_PREVIEW_PASSWORD ||= "preview";
const mockRows = [];
const useMock = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EFI_MOCK === "1";
if (useMock) { process.env.SUPABASE_URL = `http://127.0.0.1:${PORT}/__mock_supabase`; process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-local-key"; }

const { default: middleware } = await import(join(root, "middleware.js"));
const feedback = await import(join(root, "api/feedback.js"));
const vcfg = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".png": "image/png" };
const pub = join(root, vcfg.outputDirectory);
const toRe = src => new RegExp("^" + src.replace(/\(\.\*\)/g, "(.*)") + "$");
const headerFor = p => Object.assign({}, ...vcfg.headers.filter(h => toRe(h.source).test(p)).map(h => Object.fromEntries(h.headers.map(x => [x.key, x.value]))));
const mwMatch = /^\/(?!robots\.txt$|favicon\.svg$).*$/;

async function toRequest(req) {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  return new Request(`http://localhost:${PORT}${req.url}`, { method: req.method, headers: { ...req.headers, "x-real-ip": req.socket.remoteAddress }, body: ["GET", "HEAD"].includes(req.method) ? undefined : body });
}
async function send(res, r) {
  const h = {}; r.headers.forEach((v, k) => { if (k !== "x-middleware-next") h[k] = v; });
  const set = r.headers.getSetCookie?.(); if (set?.length) h["set-cookie"] = set;
  res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
}
async function file(p) {
  const f = normalize(join(pub, decodeURIComponent(p)));
  if (!f.startsWith(pub)) return null;
  try { const s = await stat(f); if (s.isFile()) return f; if (s.isDirectory() && existsSync(join(f, "index.html"))) return join(f, "index.html"); } catch {}
  return null;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/__mock_supabase/rest/v1/")) {
      const chunks = []; for await (const c of req) chunks.push(c);
      if (req.headers.apikey !== "mock-local-key") { res.writeHead(401); return res.end(); }
      mockRows.push({ table: url.pathname.split("/").pop(), row: JSON.parse(Buffer.concat(chunks).toString() || "{}") });
      res.writeHead(201); return res.end();
    }
    if (url.pathname === "/__mock/rows") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(mockRows)); }
    const request = await toRequest(req);
    if (mwMatch.test(url.pathname)) {
      const r = await middleware(request.clone());
      if (!r.headers.get("x-middleware-next")) return send(res, r);
    }
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
      if (name !== "feedback") return send(res, new Response("Not found", { status: 404 }));
      const fn = feedback[req.method];
      return send(res, fn ? await fn(request) : new Response("Method not allowed", { status: 405 }));
    }
    const f = (await file(url.pathname)) || join(pub, "index.html"); // filesystem first, then SPA rewrite
    let body = await readFile(f);
    const type = TYPES[extname(f)] || "application/octet-stream";
    const extra = {};
    // Vercel compresses text responses; do the same so local Lighthouse runs are representative.
    if (/text|json|svg/.test(type) && /gzip/.test(req.headers["accept-encoding"] || "")) { body = gzipSync(body); extra["content-encoding"] = "gzip"; extra["vary"] = "Accept-Encoding"; }
    res.writeHead(200, { "content-type": type, ...extra, ...headerFor(url.pathname) });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch (e) { console.error(e); res.writeHead(500); res.end("dev server error"); }
}).listen(PORT, () => console.log(`EFI preview on http://localhost:${PORT}  (password: ${process.env.EFI_PREVIEW_PASSWORD === "preview" ? "preview" : "from .env"}; storage: ${useMock ? "mock" : "Supabase"})`));
