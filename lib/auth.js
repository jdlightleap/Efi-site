// Shared password-gate helpers. Runs in Vercel Routing Middleware and Functions (Node.js, WebCrypto).
export const COOKIE = "efi_preview";
export const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const enc = new TextEncoder();

async function hmacHex(key, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// The cookie value is derived from the password, so changing the password signs everyone out.
export const tokenFor = password => hmacHex(password, "efi-preview:v1");

export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Compare two secrets of any length in constant time by comparing their HMACs.
export async function passwordMatches(given, expected) {
  const salt = "efi-compare";
  return safeEqual(await hmacHex(salt, String(given || "")), await hmacHex(salt, String(expected || "")));
}

export function readCookie(request, name = COOKIE) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export async function isAuthed(request, password = process.env.EFI_PREVIEW_PASSWORD) {
  if (!password) return false; // fail closed
  const c = readCookie(request);
  return !!c && safeEqual(c, await tokenFor(password));
}

export function clientIp(request) {
  return (request.headers.get("x-real-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0] || "unknown").trim();
}

// Best-effort in-memory limiter (per function instance). Keys are never persisted.
export function limiter(max, windowMs) {
  const hits = new Map();
  return key => {
    const now = Date.now(), h = hits.get(key);
    if (hits.size > 5000) for (const [k, v] of hits) if (now - v.t > windowMs) hits.delete(k);
    if (!h || now - h.t > windowMs) { hits.set(key, { n: 1, t: now }); return true; }
    h.n += 1;
    return h.n <= max;
  };
}

export const SECURITY_HEADERS = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=31536000",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'"
};
