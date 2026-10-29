// The UK Power Networks pilot is static files. These checks lock the password-gate
// matcher, the trailing-slash routes, and the split Content-Security-Policy.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { once } from "node:events";
import http from "node:http";
import { gunzipSync, gzipSync } from "node:zlib";
import { compileSource } from "../lib/route-match.js";
import { config } from "../middleware.js";

const vcfg = JSON.parse(readFileSync("vercel.json", "utf8"));
const cspOf = headers => headers.find(h => h.headers.some(x => x.key === "Content-Security-Policy"));
const headerRules = source => vcfg.headers.filter(h => compileSource(h.source).test(source));
const cspFor = path => {
  const hits = headerRules(path).flatMap(h => h.headers.filter(x => x.key === "Content-Security-Policy"));
  assert.equal(hits.length, 1, `${path} should have exactly one CSP, got ${hits.length}`);
  return hits[0].value;
};
const scriptSrc = csp => csp.match(/script-src[^;]*/)[0];

const COVERED = [
  "/", "/index.html", "/signals/storm-resilience", "/workshops", "/about", "/privacy", "/feedback",
  "/assets/app.js", "/assets/app.css", "/data/data.json", "/data/data.js", "/api/feedback",
  "/pilot", "/pilot/", "/pilot/index.html", "/pilot/assets/fonts/Inter.woff2",
  "/prototypes/safety-shield", "/prototypes/safety-shield/", "/prototypes/safety-shield/index.html",
  "/prototypes/safety-shield/assets/fonts/Bricolage.woff2",
  "/prototypes/connection-precheck", "/prototypes/connection-precheck/",
  "/prototypes/connection-precheck/index.html",
  "/prototypes/connection-precheck/pc/AL.js",
  "/prototypes/connection-precheck/assets/fonts/AzeretMono.woff2"
];

test("middleware matcher covers pilot static files and still skips only robots and favicon", () => {
  assert.equal(config.matcher.length, 1);
  const re = compileSource(config.matcher[0]);
  for (const p of COVERED) assert.equal(re.test(p), true, p);
  assert.equal(re.test("/robots.txt"), false);
  assert.equal(re.test("/favicon.svg"), false);
  assert.equal(re.test("/pilot/favicon.svg"), true);
});

test("trailing slash is not stripped, and pilot URLs redirect onto it", () => {
  assert.equal("trailingSlash" in vcfg, false);
  const redirects = Object.fromEntries(vcfg.redirects.map(r => [r.source, r.destination]));
  assert.equal(redirects["/pilot"], "/pilot/");
  assert.equal(redirects["/pilot/index.html"], "/pilot/");
  assert.equal(redirects["/prototypes/safety-shield"], "/prototypes/safety-shield/");
  assert.equal(redirects["/prototypes/safety-shield/index.html"], "/prototypes/safety-shield/");
  assert.equal(redirects["/prototypes/connection-precheck"], "/prototypes/connection-precheck/");
  assert.equal(redirects["/prototypes/connection-precheck/index.html"], "/prototypes/connection-precheck/");
  for (const source of Object.keys(redirects)) {
    assert.equal(compileSource(source).test(source + "/assets/fonts/Inter.woff2"), false, source);
    assert.equal(compileSource(source).test("/prototypes/connection-precheck/pc/AL.js"), false, source);
  }
});

test("SPA rewrite cannot swallow the pilot, and CSP allows inline scripts only there", () => {
  const spa = vcfg.rewrites.at(-1);
  assert.equal(spa.destination, "/index.html");
  const spaRe = compileSource(spa.source);
  assert.equal(spaRe.test("/signals/storm-resilience"), true);
  assert.equal(spaRe.test("/workshops/outline"), true);
  for (const p of ["/pilot", "/pilot/", "/pilot/missing", "/prototypes/safety-shield/", "/prototypes/connection-precheck/pc/AL.js", "/api/feedback"]) {
    assert.equal(spaRe.test(p), false, p);
  }
  assert.equal(vcfg.rewrites[0].destination, "/pilot/index.html");
  assert.equal(scriptSrc(cspFor("/")), "script-src 'self'");
  assert.equal(scriptSrc(cspFor("/assets/app.js")), "script-src 'self'");
  assert.equal(scriptSrc(cspFor("/data/data.json")), "script-src 'self'");
  assert.equal(scriptSrc(cspFor("/pilot/")), "script-src 'self' 'unsafe-inline'");
  assert.equal(scriptSrc(cspFor("/pilot/assets/fonts/Inter.woff2")), "script-src 'self' 'unsafe-inline'");
  assert.equal(scriptSrc(cspFor("/prototypes/safety-shield/")), "script-src 'self' 'unsafe-inline'");
  assert.equal(scriptSrc(cspFor("/prototypes/connection-precheck/pc/CM.js")), "script-src 'self' 'unsafe-inline'");
  assert.equal(cspOf(vcfg.headers.filter(h => h.source === "/(.*)")), undefined);
});

test("published files keep the home page and point at the prototypes", () => {
  const home = readFileSync("public/index.html", "utf8");
  assert.match(home, /EFI early preview/);
  assert.doesNotMatch(home, /url=\/pilot\//);
  const pilot = readFileSync("public/pilot/index.html", "utf8");
  assert.match(pilot, /\/prototypes\/safety-shield\//);
  assert.match(pilot, /\/prototypes\/connection-precheck\//);
  assert.match(pilot, /url\(assets\/fonts\/Bricolage\.woff2\)/);
  assert.match(pilot, /Send \(mock\)/);
  assert.doesNotMatch(pilot, /\/api\/feedback/);
  assert.match(readFileSync("public/prototypes/safety-shield/index.html", "utf8"), /href="\/pilot\/#\/i\/E1"/);
  const pre = readFileSync("public/prototypes/connection-precheck/index.html", "utf8");
  assert.match(pre, /href="\/pilot\/#\/i\/S_N7"/);
  assert.match(pre, /pc\/' \+ a \+ '\.js'/);
  assert.equal(readdirSync("public/prototypes/connection-precheck/pc").filter(n => n.endsWith(".js")).length, 41);
});

test("local server gates pilot assets, serves trailing-slash pages, and gzips postcode chunks", async () => {
  const port = 3457;
  const child = spawn(process.execPath, ["scripts/dev.mjs"], {
    env: { ...process.env, PORT: String(port), EFI_MOCK: "1", EFI_PREVIEW_PASSWORD: "preview" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let log = "";
  child.stdout.on("data", d => { log += d; });
  child.stderr.on("data", d => { log += d; });
  const base = `http://127.0.0.1:${port}`;
  const stop = () => { child.kill("SIGTERM"); };
  try {
    const ready = await Promise.race([
      once(child.stdout, "data").then(() => true),
      new Promise((_, reject) => setTimeout(() => reject(new Error("dev server did not start\n" + log)), 8000))
    ]);
    assert.equal(ready, true);
    // stdout may arrive before listen(); poll the password page.
    let up = false;
    for (let i = 0; i < 50 && !up; i++) {
      try { up = (await fetch(base + "/pilot/")).status === 401; } catch { await new Promise(r => setTimeout(r, 50)); }
    }
    assert.equal(up, true, log);

    const gated = ["/pilot/", "/pilot/assets/fonts/Inter.woff2", "/prototypes/safety-shield/", "/prototypes/safety-shield/assets/fonts/Inter.woff2", "/prototypes/connection-precheck/", "/prototypes/connection-precheck/pc/CM.js", "/prototypes/connection-precheck/assets/fonts/Inter.woff2", "/", "/data/data.json", "/assets/app.js"];
    for (const p of gated) {
      const r = await fetch(base + p);
      assert.equal(r.status, 401, p);
      const body = await r.text();
      assert.match(body, /EFI early preview/);
      assert.doesNotMatch(body, /PCCHUNK|UK Power Networks pilot|wOF2/);
    }
    assert.equal((await fetch(base + "/robots.txt")).status, 200);
    assert.equal((await fetch(base + "/favicon.svg")).status, 200);

    const redir = await fetch(base + "/pilot", { redirect: "manual" });
    assert.equal(redir.status, 307);
    assert.equal(redir.headers.get("location"), "/pilot/");
    assert.equal((await fetch(base + "/prototypes/safety-shield", { redirect: "manual" })).headers.get("location"), "/prototypes/safety-shield/");
    assert.equal((await fetch(base + "/prototypes/connection-precheck/index.html", { redirect: "manual" })).headers.get("location"), "/prototypes/connection-precheck/");

    const login = await fetch(base + "/__login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "password=preview&next=/pilot/",
      redirect: "manual"
    });
    assert.equal(login.status, 303);
    const setCookie = login.headers.get("set-cookie") || "";
    const cookie = setCookie.split(";")[0];
    assert.match(cookie, /^efi_preview=[0-9a-f]{64}$/);
    const auth = { cookie };

    const pilot = await fetch(base + "/pilot/", { headers: auth });
    assert.equal(pilot.status, 200);
    assert.equal(scriptSrc(pilot.headers.get("content-security-policy")), "script-src 'self' 'unsafe-inline'");
    const pilotHtml = await pilot.text();
    assert.equal(pilotHtml.includes("UK Power Networks pilot"), true);
    assert.equal(pilotHtml.includes('"/prototypes/safety-shield/"'), true);
    assert.equal(pilotHtml.includes('"/prototypes/connection-precheck/"'), true);

    const home = await fetch(base + "/", { headers: auth });
    assert.equal(home.status, 200);
    assert.equal(scriptSrc(home.headers.get("content-security-policy")), "script-src 'self'");
    const homeHtml = await home.text();
    assert.equal(homeHtml.includes("EFI early preview"), true);
    assert.equal(homeHtml.includes("UK Power Networks pilot"), false);

    const signal = await fetch(base + "/signals/storm-resilience", { headers: auth });
    assert.equal(signal.status, 200);
    assert.equal((await signal.text()).includes("EFI early preview"), true);

    const font = await fetch(base + "/pilot/assets/fonts/Inter.woff2", { headers: auth });
    assert.equal(font.status, 200);
    assert.match(font.headers.get("content-type"), /font\/woff2/);
    assert.equal(font.headers.get("cache-control"), "private, max-age=3600");
    const fontBytes = Buffer.from(await font.arrayBuffer());
    assert.equal(fontBytes.subarray(0, 4).toString(), "wOF2");

    const raw = readFileSync("public/prototypes/connection-precheck/pc/CM.js");
    const chunk = await new Promise((resolve, reject) => {
      const req = http.get(base + "/prototypes/connection-precheck/pc/CM.js", { headers: { ...auth, "accept-encoding": "gzip" } }, res => {
        const parts = [];
        res.on("data", c => parts.push(c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(parts) }));
      });
      req.on("error", reject);
    });
    assert.equal(chunk.status, 200);
    assert.equal(chunk.headers["content-encoding"], "gzip");
    assert.equal(chunk.headers["cache-control"], "private, max-age=3600");
    assert.ok(chunk.body.length < raw.length * 0.6, `gzip ${chunk.body.length} of ${raw.length}`);
    assert.equal(gunzipSync(chunk.body).equals(raw), true);
    assert.ok(gzipSync(raw).length < raw.length * 0.6);

    const missing = await fetch(base + "/pilot/no-such-page", { headers: auth });
    assert.equal(missing.status, 404);
    assert.doesNotMatch(await missing.text(), /EFI early preview/);
    const shield = await fetch(base + "/prototypes/safety-shield/", { headers: auth });
    assert.equal((await shield.text()).includes('href="/pilot/#/i/E1"'), true);
    const pre = await fetch(base + "/prototypes/connection-precheck/", { headers: auth });
    assert.equal((await pre.text()).includes('href="/pilot/#/i/S_N7"'), true);
  } finally {
    stop();
    await once(child, "exit").catch(() => {});
  }
});
