"""Browser QA for the EFI preview. Needs `npm run dev` running (mock storage) and Playwright + Chrome.
python3 qa/qa.py  -> writes qa/results.json and screenshots in qa-shots/"""
import json, os, re, sys, time
from playwright.sync_api import sync_playwright
B = os.environ.get("BASE", "http://localhost:3000"); PW = os.environ.get("PW", "preview")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SHOTS = os.path.join(ROOT, "qa-shots")
os.makedirs(SHOTS, exist_ok=True)
ROUTES = ["/", "/signals/storm-resilience", "/signals/data-centre-connections", "/signals/connection-queue-triage", "/signals/flood-monitoring", "/signals/solid-state-transformers", "/workshops", "/sources", "/about", "/privacy", "/feedback", "/nope"]
AXE = open(os.path.join(ROOT, "node_modules/axe-core/axe.min.js")).read()
R = {"console": [], "pageerrors": [], "badresponses": [], "axe": {}, "overflow": [], "links": {}, "keyboard": {}, "forms": {}, "nets": {}}

def login(ctx):
    p = ctx.new_page(); p.goto(B + "/"); p.fill("#pw", PW); p.click("button[type=submit]"); p.wait_for_selector("#app h1"); p.close()

def watch(p):
    p.on("console", lambda m: m.type in ("error", "warning") and R["console"].append(f"{m.type}: {m.text} @ {p.url}"))
    p.on("pageerror", lambda e: R["pageerrors"].append(f"{e} @ {p.url}"))
    p.on("response", lambda r: r.status >= 400 and "/__mock" not in r.url and R["badresponses"].append(f"{r.status} {r.url}"))

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    # login page shot
    c0 = br.new_context(viewport={"width": 390, "height": 844}); p0 = c0.new_page(); p0.goto(B + "/signals/flood"); p0.screenshot(path=f"{SHOTS}/login-390.png"); c0.close()
    for w, h in [(390, 844), (768, 1024), (1440, 900)]:
        ctx = br.new_context(viewport={"width": w, "height": h}, bypass_csp=True); login(ctx); p = ctx.new_page(); watch(p)
        for r in ROUTES:
            p.goto(B + r); p.wait_for_selector("#app h1"); p.wait_for_timeout(150)
            ov = p.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            if ov > 1: R["overflow"].append(f"{w}px {r} overflows by {ov}px")
            name = (r.strip("/").replace("/", "-") or "home")
            p.screenshot(path=f"{SHOTS}/{name}-{w}.png", full_page=True)
            if w == 1440:
                p.add_script_tag(content=AXE)
                res = p.evaluate("async () => (await axe.run(document, {runOnly: ['wcag2a','wcag2aa','wcag21aa','best-practice']})).violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes.slice(0,3).map(n => n.target.join(' '))}))")
                R["axe"][r] = res
        ctx.close()
    ctx = br.new_context(viewport={"width": 1440, "height": 900}); login(ctx); p = ctx.new_page(); watch(p)
    # every network on home and each signal: render without errors, h1 present
    nets = json.load(open(os.path.join(ROOT, "public/data/data.json")))["networks"]
    for n in nets:
        p.goto(B + "/"); p.select_option("#netSel", n["id"]); p.wait_for_timeout(80)
        top = p.evaluate("[...document.querySelectorAll('#app .feat .fh, #app .card .cb')].slice(0,5).map(e=>e.textContent.trim())")
        R["nets"][n["id"]] = top
        for s in ["storm", "dcflex", "queue", "flood", "sst"]:
            p.goto(B + f"/signals/{s}"); p.wait_for_selector("#app h1")
            if p.locator("form[data-kind=signal]").count() != 1: R["nets"].setdefault("_errors", []).append(f"{n["id"]} {s}: {p.locator('#app h1').inner_text()}")
    # links: collect every internal and external href across routes
    hrefs = set()
    for r in ROUTES[:-1]:
        p.goto(B + r); p.wait_for_selector("#app h1")
        hrefs |= set(p.evaluate("[...document.querySelectorAll('a[href]')].map(a => a.href)"))
    R["links"] = sorted(hrefs)
    # keyboard: first tab = skip link, focus ring visible, skip link moves focus to main
    p.goto(B + "/"); p.wait_for_selector("#app h1"); p.keyboard.press("Tab")
    R["keyboard"]["first_tab"] = p.evaluate("document.activeElement.textContent.trim()")
    R["keyboard"]["outline"] = p.evaluate("getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).outlineWidth")
    p.keyboard.press("Enter"); R["keyboard"]["after_skip"] = p.evaluate("document.activeElement.id || document.activeElement.tagName")
    seq = []
    for _ in range(25):
        p.keyboard.press("Tab"); seq.append(p.evaluate("(e => e.tagName + (e.id?'#'+e.id:'') + ' ' + (e.textContent||e.value||'').trim().slice(0,30))(document.activeElement)"))
    R["keyboard"]["tab_sequence"] = seq
    # route change focuses h1 and updates title
    p.click("nav a[href='/sources']"); p.wait_for_timeout(200)
    R["keyboard"]["route_focus"] = p.evaluate("document.activeElement.tagName + ' ' + document.activeElement.textContent.trim().slice(0,40)"); R["keyboard"]["title"] = p.title()
    # workshop stepper by keyboard
    p.goto(B + "/workshops"); p.wait_for_selector("#app h1")
    p.check("input[name=net][value=gb]"); p.click("[data-wk=next]"); p.wait_for_timeout(100)
    R["keyboard"]["wk_step2_focus"] = p.evaluate("document.activeElement.tagName + ' ' + document.activeElement.textContent.trim()")
    p.check("input[name=sig][value=flood]"); p.click("[data-wk=next]"); p.check("input[name=route][value=NIA]"); p.fill("#wkNotes", "QA test notes"); p.click("[data-wk=next]"); p.wait_for_selector("#printBtn")
    R["forms"]["outline_url"] = p.url
    p.screenshot(path=f"{SHOTS}/workshops-outline-1440.png", full_page=True)
    p.emulate_media(media="print"); p.pdf(path=f"{SHOTS}/workshop-outline-print.pdf", format="A4", print_background=True); p.screenshot(path=f"{SHOTS}/workshops-outline-print.png", full_page=True); p.emulate_media(media="screen")
    # workshop request: blocked without consent, then sends
    f = p.locator("form[data-kind=workshop]"); f.locator("input[name=email]").fill("qa@example.org"); time.sleep(2)
    f.locator("button[type=submit]").click(); p.wait_for_timeout(200); R["forms"]["workshop_no_consent"] = f.locator(".fmsg").inner_text()
    f.locator("input[name=consent]").check(); f.locator("button[type=submit]").click(); p.wait_for_timeout(600); R["forms"]["workshop_sent"] = f.inner_text()
    # signal useful
    p.goto(B + "/signals/queue"); p.wait_for_selector("#app h1"); time.sleep(2)  # short alias redirects to the canonical slug
    R["forms"]["alias_url"] = p.url
    sf = p.locator("form[data-kind=signal]"); sf.scroll_into_view_if_needed()
    p.locator("[data-useful=yes]").first.click(); sf.locator("textarea").fill("QA: useful"); sf.locator("button[type=submit]").click(); p.wait_for_timeout(600)
    R["forms"]["signal_sent"] = p.locator(".fbk").inner_text()
    # general feedback with contact but no consent -> blocked
    p.goto(B + "/feedback"); p.wait_for_selector("#app h1"); time.sleep(2)
    g = p.locator("form[data-kind=general]"); g.locator("textarea").fill("QA general"); g.locator("input[name=name]").fill("Q A"); g.locator("button[type=submit]").click(); p.wait_for_timeout(200)
    R["forms"]["general_no_consent"] = g.locator(".fmsg").inner_text()
    g.locator("input[name=name]").fill(""); g.locator("button[type=submit]").click(); p.wait_for_timeout(600); R["forms"]["general_sent"] = g.inner_text()
    p.goto(B + "/__mock/rows"); R["forms"]["stored"] = json.loads(p.inner_text("body"))
    # client secret scan of what the browser actually receives
    ctx.close(); br.close()
json.dump(R, open(os.path.join(ROOT, "qa/results.json"), "w"), indent=1)
print(json.dumps({k: (v if k not in ("links",) else len(v)) for k, v in R.items()}, indent=1)[:9000])
