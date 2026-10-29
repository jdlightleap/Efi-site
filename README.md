# EFI early preview (efi-site)

EFI (energy frontier intelligence) by Lightleap. A private early preview listing five emerging-technology "signals" that GB electricity networks could be first to trial, each with its public evidence. Scores are **draft EFI assessments**, models are **illustrative**.

## Structure

```
public/            static site (served as-is by Vercel)
  index.html       single-page app shell (en-GB, noindex, preview banner). This stays the early preview, not the pilot.
  assets/          app.js (views and router), signals.js (the 5 signal definitions), app.css, config.js (public settings), fonts/ (woff2 subsets + OFL.txt)
  data/            data.json + data.js, baked at build time from data/source (no live DB reads from the browser)
  pilot/           UK Power Networks pilot (index.html + assets/fonts). Share /pilot/ with that audience.
  prototypes/      safety-shield/ and connection-precheck/ (the latter loads pc/*.js on demand)
docs/pilot-v7/     reference only: layout note, fix log, content QA, horizon research. Not served.
middleware.js      Vercel Routing Middleware: password gate (EFI_PREVIEW_PASSWORD), cookie, noindex
api/feedback.js    Vercel Function: POST feedback / workshop requests, writes to Supabase server-side
lib/               auth.js (cookie HMAC, rate limiter, headers), feedback.js (validation + insert), route-match.js (local path matching for vercel.json)
sql/012_feedback.sql   migration for the feedback tables. DRAFT, NOT APPLIED
data/              build_data.py + source/*.sql|json (read-only exports of the efi-open-data project)
scripts/           dev.mjs (local Vercel emulator + mock Supabase), check.mjs (build check + secret scan), feedback.test.mjs
qa/                qa.py (Playwright QA run) and results.json
qa-shots/          screenshots from the last QA run
QA.md, DEPLOY.md
```

Routes: `/`, `/signals/<slug>` (storm-resilience, data-centre-connections, connection-queue-triage, flood-monitoring, solid-state-transformers; short ids like `/signals/flood` redirect), `/workshops`, `/workshops/outline` (printable), `/sources`, `/about`, `/privacy`, `/feedback`.

Pilot routes (same password, separate pages): `/pilot/`, `/prototypes/safety-shield/`, `/prototypes/connection-precheck/`. `trailingSlash` is unset so Vercel does not strip those slashes (the prototypes load `assets/` and `pc/` relative to the trailing-slash URL). Requests without the slash redirect to the slashed URL. `/` is still the early preview. Pilot feedback buttons are a mockup: they do not call `/api/feedback`. Reference notes are in `docs/pilot-v7/`.

## Run locally

```bash
npm install
cp .env.example .env        # optional; without it the dev password is "preview" and Supabase is mocked
npm run dev                 # http://localhost:3000
EFI_MOCK=1 npm run dev      # force the mock Supabase even if .env has real values
```

The dev server applies the same middleware, redirects, function, headers and rewrites as `vercel.json`. Rows sent to the mock can be seen at `/__mock/rows` (dev only).

## Test and check

```bash
npm test                    # node unit tests: validation, consent, honeypot, gate
npm run check               # what Vercel runs as the build: required files + secret scan of public/
```

Full QA (needs Python Playwright and Chrome; axe-core and lighthouse are installed without saving):

```bash
npm i --no-save axe-core lighthouse
EFI_MOCK=1 npm run dev &
python3 qa/qa.py            # writes qa/results.json and qa-shots/
```

## Refresh the data

```bash
npm run data
```

Without `SUPABASE_DB_URL` this rebuilds `public/data/` from the committed `data/source/*.json`. With it (and `psycopg`), it first runs the `data/source/*.sql` SELECTs in a READ ONLY session against the efi-open-data project. Commit the refreshed JSON; the site never queries the database from the browser.

## Secrets

Never commit `.env`. `SUPABASE_SERVICE_ROLE_KEY` is only read by `api/feedback.js` on the server. `npm run check` fails the build if a key-like string appears in `public/`.
