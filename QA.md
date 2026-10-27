# QA report: EFI early preview

Run on 27 Oct 2026 (Europe/London) against the local Vercel emulator (`EFI_MOCK=1 npm run dev`, mock Supabase), using headless Google Chrome via Playwright, axe-core and Lighthouse. Raw results are in `qa/results.json` and the screenshots in `qa-shots/`. Lighthouse HTML reports are in `lighthouse/` (git-ignored, not in the archive).

## Summary

| Check | Result |
| --- | --- |
| Responsive 390 / 768 / 1440 (12 routes each) | Pass. No horizontal overflow on any route or width. |
| Accessibility (axe-core 4.x, WCAG 2.1 A/AA rules, all 12 routes) | **0 violations** (one "region" finding on the preview banner was fixed by making it a labelled `<aside>`). |
| Lighthouse accessibility | 100 on every page tested, mobile and desktop |
| Keyboard | Pass. See below. |
| Contrast, including gradient text | Pass (AA). See below. |
| Console errors, page errors, 4xx/5xx while browsing | None |
| Every network × every signal renders | Pass. All 11 network views list 5 signals. |
| Forms (signal "Was this useful?", general, workshop) | Pass. Consent gating, honeypot and time trap all work. |
| Password gate and headers (curl) | Pass |
| Unit tests (`npm test`) | 6/6 pass |
| Build check and secret scan (`npm run check`) | Pass. Whole tree and archive scanned clean as well. |
| Link check | 74 of 83 external URLs OK. 3 broken NESO links fixed. The rest are explained below. |
| UK spelling | Pass. The only US forms are code tokens (`autocomplete="organization"`, SVG `stop-color`) and the licence's proper name "SIL Open Font License". |
| Print of the workshop outline | Pass. Clean A4 portrait, 2 pages, with no clipping, the navigation hidden and the draft footer included. See `qa-shots/workshop-outline-print.png` (the PDF is git-ignored). |
| Secrets in the client | None. The service-role key is read only in `api/feedback.js`. `public/` is scanned on every build. |

## Lighthouse (localhost, after optimisation)

| Page | Mobile perf | Desktop perf | A11y | Best practices | SEO |
| --- | --- | --- | --- | --- | --- |
| `/` | 94 | 100 | 100 | 100 | 63* |
| `/signals/storm-resilience` | 94 | 98 | 100 | 100 | 63* |
| `/workshops` | 94 | 100 | 100 | 100 | 63* |
| `/sources` | 93 | 100 | 100 | 100 | 63* |

Mobile: FCP 2.0 s, LCP 2.9 s, TBT 0 ms, CLS ≤ 0.016. Desktop: LCP 0.6 s, CLS ≤ 0.096.
\* SEO is held at 63 on purpose. The only failing audit is "Page is blocked from indexing" (noindex), which a private preview needs.

Fixes made during QA: the first run scored mobile 47–64 (LCP 8.9 s, CLS 0.36). To fix that:
- fonts were converted from 1.4 MB of TTF to Latin-subset WOFF2 (294 KB in total)
- scripts were deferred
- `#app` was given a min-height so the footer doesn't shift
- the local server now gzips text, as Vercel does
- the "legible font sizes" audit (32% legible) was fixed by raising every font size below 12px to 12–12.5px

## Keyboard and screen reader basics

- The first Tab lands on "Skip to main content", with a visible 2px solid focus outline. The skip link moves focus to `<main id="app">`.
- On every route change, focus moves to the page `<h1>`, `document.title` updates (e.g. "Sources and licences · EFI early preview") and a polite live region announces the page.
- The tab order follows the visual order: network chips, then "Why ranked here" (a native `<details>`), then card links, then footer.
- In the workshop planner, Next moves focus to the next step's heading.
- Form errors are shown as text next to the field and announced. All inputs have labels. The language is `en-GB`.
- The network picker is a native `<select>` and the chips are buttons with `aria-pressed`.

## Contrast

- Body text #1a1a1c on #f7f6f3: 16.1:1. Muted text #6b6a66 on #f7f6f3: 5.0:1.
- Gradient headline text (`.rv span`) is only used on the dark #1a1a1c panel. Each stop against #1a1a1c: amber #f2b134 **9.2**, coral #ef7a6d **6.35**, violet #b27be8 **5.7**, teal #41b8c4 **7.35**. Every stop passes AA, so every point of the gradient passes too.
- Browsers without `background-clip:text` get a solid #ef7a6d fallback (6.35:1).

## Forms (stored rows in the mock)

- Workshop request without consent: blocked with the message "We need an email address and your agreement…". With email and consent: stored in `workshop_requests` with `consent_followup=true`.
- Signal "Was this useful?": stored in `site_feedback`, kind `signal`, with network, signal id and page.
- General feedback with a name but no consent: blocked, and asks the user to tick the box or clear the fields. Without contact details: stored with name, email and organisation all null.
- Server side: the honeypot `website` field and submissions under 1.5 s get a silent 200 and nothing is stored. Without consent, contact fields are stripped on the server as well. Unknown network or signal ids return 400. Cross-origin POSTs return 403. Requests are limited to 8 per 10 minutes per IP (429). The body is capped at 16 KB. Without the env vars the API returns 503. A failed insert returns a generic 502 and the log shows the table and status only.

## Password gate (curl)

- Without the cookie, `/`, signal pages, `/data/data.json`, fonts and `/api/feedback` all return 401 with the login page. `/robots.txt` (Disallow: /) and `/favicon.svg` return 200.
- A wrong password returns 401. The right one returns 303 and sets `efi_preview`: HttpOnly, Secure, SameSite=Lax, 30 days. An open redirect (`next=//evil.com`) is rejected and sends you to `/`.
- More than 10 login attempts in 15 minutes returns 429.
- Every response carries X-Robots-Tag noindex, CSP `script-src 'self'`, HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy and Permissions-Policy.

## Link check (83 unique external URLs)

- 74 return 200.
- 3 NESO data-portal URLs had moved (TEC register, embedded register, interconnector register). They're fixed in `data/build_data.py` (URL_FIXES) and the data has been rebuilt.
- 2 parliament.uk links return 403 to scripts because of a Cloudflare bot challenge. The pages exist (written evidence DCU0081 was checked in a browser fetch).
- `https://efi.lightleap.co.uk` doesn't resolve yet, as expected before launch.
- **`https://lightleap.co.uk` returns HTTP 500** (Namesco hosting, checked 27 Oct 2026). It's linked from About and the footer. James to fix, or the link can be removed.
- `http://www.w3.org/2000/svg` is an SVG namespace, not a link.
- All internal links (69 collected) resolve to real views, including `/assets/fonts/OFL.txt` (added).

## Known limits and notes

- Rate limits are in memory per function instance, so they're best-effort. Vercel Firewall rules can back them up if needed.
- Unknown paths show the "Page not found" view with HTTP 200 (SPA rewrite).
- On the GB view, storm resilience and connection-queue triage are tied at draft score 35. Storm is shown first only because of list order. "Why ranked here" shows both scores, including the "no GB project yet" bonus.
- The QA ran against the local emulator, not Vercel itself. Repeat the smoke test in DEPLOY.md §5 after the first deploy.
- Real Supabase inserts were not tested, because migration 012 isn't applied and the DB is read-only for this work. The insert path is covered by unit tests against a stub and by the mock server.

## Screenshots (`qa-shots/`)

`<route>-<width>.png` at 390, 768 and 1440 for: home, the 5 signal pages (`signals-<slug>`), workshops, sources, about, privacy, feedback and the 404 view (`nope`). Also `login-390.png`, `workshops-outline-1440.png`, `workshops-outline-print.png` and `workshop-outline-print.pdf` (local only).
