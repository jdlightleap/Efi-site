// Vercel Routing Middleware: password gate for the whole EFI preview.
// Covers pages, data, API, and static files, including /pilot/ and /prototypes/**
// (HTML, fonts and pc/*.js). The matcher excludes only /robots.txt and /favicon.svg.
// Do not add a "skip files that have an extension" exception: that would publish
// the pilot assets without the cookie. Env: EFI_PREVIEW_PASSWORD (required).
// If it is unset the site stays locked (fail closed).
import { next } from "@vercel/functions";
import { COOKIE, MAX_AGE, tokenFor, passwordMatches, isAuthed, clientIp, limiter, SECURITY_HEADERS } from "./lib/auth.js";

export const config = { runtime: "nodejs", matcher: ["/((?!robots\\.txt$|favicon\\.svg$).*)"] };

const attempts = limiter(10, 15 * 60 * 1000); // 10 password tries per IP per 15 minutes
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeNext = p => (typeof p === "string" && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\") && p.length < 300 ? p : "/");

function html(body, status, extra = {}) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...SECURITY_HEADERS, ...extra } });
}

function loginPage(nextPath, message = "", status = 401) {
  return html(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>EFI early preview: sign in</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>
body{margin:0;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;background:#f6f5f1;color:#1a1a1c;display:grid;min-height:100vh;place-items:center}
main{background:#fff;border:1px solid #dcdad3;border-radius:8px;padding:32px;width:min(92vw,400px);box-sizing:border-box}
.bar{height:4px;background:linear-gradient(90deg,#f2b134,#ef7a6d,#b27be8,#41b8c4);margin:-32px -32px 24px;border-radius:8px 8px 0 0}
h1{font-size:24px;margin:0 0 6px}p{margin:0 0 18px;color:#55544f;font-size:14px}label{display:block;font-weight:600;font-size:14px}
input{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:10px;font-size:16px;border:1px solid #8f8d86;border-radius:4px}
button{margin-top:16px;width:100%;padding:11px;font-size:16px;font-weight:600;background:#1a1a1c;color:#fff;border:0;border-radius:4px;cursor:pointer}
:focus-visible{outline:2px solid #7a4fc4;outline-offset:2px}.err{color:#a3261b;font-weight:600;margin:12px 0 0;font-size:14px}</style></head>
<body><main><div class="bar"></div><h1>EFI early preview</h1><p>This preview is private. Enter the password you were given.</p>
<form method="post" action="/__login"><input type="hidden" name="next" value="${esc(nextPath)}">
<label for="pw">Password</label><input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
${message ? `<p class="err" role="alert">${esc(message)}</p>` : ""}<button type="submit">Continue</button></form></main></body></html>`, status);
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const password = process.env.EFI_PREVIEW_PASSWORD;

  if (url.pathname === "/__logout") {
    return new Response(null, { status: 303, headers: { Location: "/", "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, ...SECURITY_HEADERS } });
  }

  if (url.pathname === "/__login") {
    if (request.method !== "POST") return loginPage("/", "", 200);
    if (!password) return loginPage("/", "The preview isn’t configured yet.", 503);
    if (!attempts(clientIp(request))) return loginPage("/", "Too many attempts. Please wait 15 minutes and try again.", 429);
    let form;
    try { form = await request.formData(); } catch { return loginPage("/", "Please try again.", 400); }
    const nextPath = safeNext(form.get("next"));
    if (!(await passwordMatches(form.get("password"), password))) return loginPage(nextPath, "That password isn’t right.", 401);
    return new Response(null, { status: 303, headers: { Location: nextPath, "Set-Cookie": `${COOKIE}=${await tokenFor(password)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`, "Cache-Control": "no-store", ...SECURITY_HEADERS } });
  }

  if (await isAuthed(request, password)) return next();

  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Please sign in to the preview again." }), { status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...SECURITY_HEADERS } });
  }
  if (!password) return loginPage("/", "The preview isn’t configured yet.", 503);
  return loginPage(safeNext(url.pathname + url.search));
}
