# EFI v6 UK Power Networks pilot and prototypes: content and experience QA (v1)

29 Oct 2026, 13:30 UK time. Independent read-only review. **Nothing was changed.**

Scope: `/workspace/efi/design/v6-ukpn-pilot/` (36 routes: home, Horizon, Following, Watch, Insights, Glossary, Sign in, Profile, 28 idea pages), plus `prototypes/safety-shield-demo` and `prototypes/connection-precheck`.

Reviewed as: a sceptical UK Power Networks innovation lead (Luca) and a network engineer.

## Method

- **Text checks.**
  - All visible text dumped from every route, with all `<details>` opened (`qa/v6/text.json`).
  - Scanned by pattern for placeholders, acronyms, banned words, broken templates, duplicate words and internal IDs.
- **Figures cross-checked against research.**
  - Every £, $, %, date and number on the cards was checked against `research/breakthrough-links-v4.md` and the cost or ENA files.
  - Everything matched except the Horizon (H1–H6) figures, which have no research file, and the tailored lines.
- **Tailored lines checked against the cited UK Power Networks sources, downloaded this session.** Sources:
  - ED2 commitments report 2024/25;
  - NIA annual summary 2026;
  - Holdings annual report 2025;
  - ENA portal pages for Super DuPPR, SCADENT and WARN;
  - the UK Power Networks news pages for the robot dog and the Data Centre Alliance.
- **Links checked.** All 61 external links were checked with curl, then rechecked in a browser or WebFetch.
- **Journey.** Playwright journey at 390×844 and 1280×800: landing, card, detail, prototype, back, Sign in, Profile, Following, Insights, Horizon, Glossary, Watch.
- **Accessibility.** axe-core on 8 v6 routes plus both prototypes; keyboard Tab sweep.
- **Screenshots** are in `qa/shots/` (`m*` = mobile, `d*` = desktop).

Effort key: **S** under 30 min · **M** 1–2 h · **L** half a day or more.

---

## Must fix before Luca

| # | Location | Issue | Suggested fix | Effort |
|---|---|---|---|---|
| M1 | H1 Humanoid robots: tailored line (card and detail) | **Overclaims UK Power Networks' own result.** The card says Spot was "cutting confined-space inspection time by up to 50%". The source (UK Power Networks news, 24 Aug 2023) says "Initial results revealed his **potential** to reduce the time… by up to 50%". The £324k is an estimate ("it is estimated the project could… rising to £324,000 per year by 2028"). Luca will know this project. | "…a 2023 trial whose initial results showed the potential to cut confined-space inspection time by up to 50%, with savings estimated to rise to £324k a year by 2028." | S |
| M2 | E4 Telecom batteries: tailored line, "Done before in GB?", Bridge, card | **Mis-describes Super DuPPR.** The card says it "studied mast backup batteries". The ENA page describes reserve power for critical infrastructure such as telecoms, with BT as the base case: plant rooms and exchanges, not mobile masts. The detail page also says it "decided against a further phase". That is accurate (end-of-phase report, per v4), but it reads as a verdict on a UK Power Networks project. | "studied telecoms backup batteries (BT as the base case) as local flexibility". Change "decided against a further phase" to "did not go on to a further phase". Keep "found no technical or regulatory blocker" (sourced). | S |
| M3 | Prototype links, both directions (`v6data.py` PROTOS hrefs `../../prototypes/...`; prototypes' `← E1 card` / `← N7 card` hrefs `../../design/v6-ukpn-pilot/index.html#/i/...`) | **The links only work in the local `/workspace/efi` folder layout.** On the published site, card → demo → back breaks unless both are deployed at exactly these relative paths. This is the main dead-end risk for publishing. | Agree the published paths (e.g. `/pilot/` and `/pilot/demos/shield/`) and set both hrefs from one config value. Re-test the round trip on the deployed preview. | S–M |
| M4 | Prototype headers: "E1 DEMO · ← E1 card" and "N7 DEMO · ← N7 card" (`m05-proto-*.png`) | **Internal IDs show to users.** v6 never shows card IDs, so "N7 card" means nothing; the card is "AI checks on connection applications". | "← Back to: Provable safety shield" and "← Back to: AI connection checks". Drop the "E1/N7 DEMO" chip, or say "Demo". | S |
| M5 | Home "What's new" (first screen, both widths) and Following: E1 update | **Broken sentence on the landing page:** "State Grid (Changsha) runs AI-proposes, physics-checks, dispatcher-confirms. Its checker is not proven, so the pitch became 'make the checker provable'." Shorthand and editor language ("the pitch became"). | "State Grid (Changsha) uses AI to propose load transfers; a physics model checks them and a dispatcher confirms. Its checker is not formally proven, which is the gap this idea fills." | S |
| M6 | S_N2 detail page | **Typo:** "feed them to the AI bug-hunting range range." | Remove the duplicate "range". | S |
| M7 | All 6 Horizon detail pages: evidence grade line | **Templated duplicate:** "Graded DEMO: Demo: shown working once…" and "Graded PILOT: Pilot: running with real users…". | "Evidence grade: Demo (shown working once or in trials, no results at scale)". | S |
| M8 | Home, mobile and desktop (`m01-landing.png`, `d01-landing.png`) | **The 10-second test fails on who and why.** The h1 and intro explain the cards but not what EFI is, who runs it, or what the pilot asks of the reader. On mobile the header shows only "EFI" (no expansion). There is no "about / contact" route and no name for the "pilot team" that feedback goes to. A sceptical lead will ask "who made this, and what do you want from me?". | Add one line under the h1: "EFI (Energy Frontier Intelligence) scans other industries for ideas GB networks could try. This is a draft pilot edition for UK Power Networks to review: back, rate or comment on ideas." Add a small "About this pilot / contact" link (footer or menu), keeping "Not endorsed by UK Power Networks". | S–M |
| M9 | Home: "What's new since your last visit" and "Two quick questions" ("Shown after your third visit · mock"), both above the ideas | **The first-time journey contradicts itself.** A first-time viewer sees "since your last visit" (28 Oct, 21:30) and a survey labelled "after your third visit". Both push the first idea card down to about 1,800 px on mobile (2+ screens) and 1,244 px on desktop (below the fold). | For the Luca walkthrough, either label both as "Example: what a returning user sees" or move them below "Ready to explore". Simplest: collapse What's new to one line with a "Show updates" button and move the survey to the end of the list. | M |
| M10 | Desktop home: "Most backed this month" (`d01-landing.png`) | **Visual bug:** "Telecom batteries as flexibility" wraps onto 2 lines and the progress bar overlaps the word "flexibility". It is the first chart Luca sees. | Clamp the title to 1 line with ellipsis, or put the bar under a fixed-height title block. | S |
| M11 | 9 ideas: H3 Space solar, E6 Solar switch-off, N1 Memory-safe stacks, R6 Verified code rules, S16 Arc sensors, S_N3 Quantum-safe, S13 AI stand-ins, S4 Simulation type tests, H6 Quantum switching | **"Tailored line needed from the team" shows on 9 of 28 ideas**, including 4 in the first two home sections. This is honest, but 1 in 3 cards looks unfinished. | Decide before Luca: either draft public-source lines (e.g. the ED2 cyber commitment C1 fits N1, R6 and S_N3, and the NIA type-test or asset projects may fit S4), or make the placeholder read as an invitation: "Where would this fit at UK Power Networks? Tell us." | M (drafting) / S (relabel) |

## Should fix

| # | Location | Issue | Suggested fix | Effort |
|---|---|---|---|---|
| S1 | Every idea page footer | **Internal research references show:** "Source: EFI research (v4 §E4, §3 E4)…", "(v4 §6 N7; v2 Story N7)". These mean nothing to readers and expose internal IDs. | "Source: EFI research, checked 28 Oct 2026. Public sources only." Keep section refs in an HTML comment or the data file. | S |
| S2 | Horizon cards H1–H6: "Source: EFI research Horizon, 29 Oct 2026" | **No Horizon research file exists** in `/workspace/efi/research/`. The figures are only in `v5data.py`/`v6data.py`. Spot checks passed: the Guardian (Wayve/Uber, 15 cars, 3 Sep 2026; "unlikely this year"; Waymo and Baidu testing) and arXiv 2609.40264 (417-bus network, 1,415 s → 35 s solver time, no end-to-end gain) both match. But there is no audit trail if Luca asks. | Write `research/horizon-v1.md` with each H claim, its source, date and grade. | M |
| S3 | H5 Robotaxi: tailored line | **Grammar and source problems.** "London's first supervised robotaxis run on UK Power Networks' area." "Its Chargepoint Navigator" has an unclear "its". The cited source (NIA summary) supports only the Chargepoint Navigator part; the robotaxi part comes from the Guardian. | "London's first supervised robotaxis now run in UK Power Networks' area (The Guardian, 3 Sep 2026). Fleet depots are a new kind of large load whose charging times software controls. UK Power Networks' Chargepoint Navigator already helps councils plan public charge points." Cite both sources. | S |
| S4 | H1 evidence: "Hype check: Elon Musk admitted no Optimus robots were doing useful work at Tesla." | **Tone.** It reads as snarky and personal. | "Reality check: Tesla said its Optimus robots were not yet doing useful work in its factories (Jan 2026)." | S |
| S5 | Following page and update lines (`m09-following.png`) | **Changelog shows editor language** to readers: "Re-tiered", "the pitch became", "A cited study turned out to be a simulation", "Vodafone's Czech pilot only partly confirmed". | Rewrite the update types for readers: "Evidence corrected", "Category changed (now: new to GB)". Keep the honesty, drop the jargon. | S–M |
| S6 | Update lines (home What's new, Following, detail "What's changed") | **Acronym expansion breaks inside sentences:** "(Energy Frontier Intelligence (EFI) draft)", "Great Britain (GB)'s trial", "Defense Advanced Research Projects Agency (DARPA)'s…", "National Energy System Operator (NESO)'s NSiaQF…", "distribution system operator (DSO) flexibility buyers (all six distribution network operators (DNOs))". | Expand on first use per page without the possessive: "the GB trial", "the US DARPA AI Cyber Challenge". In update lines just say "EFI draft estimate". Avoid nested brackets. | S |
| S7 | S_N3 card "Why now": "NESO's NSiaQF quantum-security project…" (home card) | **Unexplained jargon:** the project acronym is not expanded on the card (only in the Glossary), and "NESO" is bare on the card. | "The National Energy System Operator's quantum-security project (Network Security in a Quantum Future) entered its Beta phase in Aug 2026." | S |
| S8 | E4 card vs detail | **Inconsistent summary:** the card says "Estonia now trades them while keeping masts powered"; the detail subtitle says "Estonia now stacks balancing on top". | Use one phrasing, the card's. | S |
| S9 | Watchlist (`#/watch`) | **Templated duplicates:** "Folded into memory-safe protocol stacks (Memory-safe protocol stacks)" and the same for "(Provable safety shield)". "FDA-style pre-approved AI change plans" has FDA unexpanded. | Drop the bracketed repeat. Write "US Food and Drug Administration (FDA)-style". | S |
| S10 | Detail "What's changed" example entry | **Redundant:** "EXAMPLE ONLY, NOT REAL Example update: Example only, not real: …". The label appears three times. | Badge "Example" plus the text only. | S |
| S11 | "Link to energy" dots on cards (e.g. S_N7 `m03-detail-S_N7.png`) | **Unlabelled.** On the card, "LINK TO ENERGY ●●●●" has no key; the meaning only appears on the detail page. An engineer will ask "link to what?". H6 is rated "Shown on a similar problem ●●○○" even though the EPB test *was* a distribution reconfiguration problem. | Rename to "Proven in energy?" with a tooltip key. Re-grade H6 to "Used on an energy problem (test networks)". | S |
| S12 | S_N7 card "Why now": "GB connection reform is reordering the connection queue now" | **The only why-now line with no date or source**, while every other card gives one. | Add the dated milestone from v4 (e.g. the connection reform Gate 2 dates) with its source. | S |
| S13 | Insights (`#/insights`) | Clearly labelled example data (good). But the funnel stage "Session requested" and the "Explore this idea" wording could read as a commitment UK Power Networks has made. | Add "Stages are illustrative" next to the funnel. | S |
| S14 | Sign in / Profile (`m07-signin.png`, `m08-profile.png`) | Clear mock labelling (good). "Continue with work account (mock)" goes to a profile that already says "Signed in as example.user@work". There is no sign-out, and no way back to signed-out browsing except the nav. | Add "Sign out (mock)" on Profile. Say "Example profile" in the heading. | S |
| S15 | Accessibility: colour contrast (axe, serious) | Horizon grade chip `.g-demo.grade`: #6b6a66 on #efe4fb gives 4.42:1 at 9.5 px (needs 4.5). Following "N NEW" badge: white on #ef7a6d gives **2.73:1**. Shield demo: amber #b7791f text on white gives 3.49–3.64:1 (labels "scr", legend). | Darken the grade text to #55544f, the badge background to #c8473a, and the amber text to #8a5a12. | S |
| S16 | Accessibility: headings | axe heading-order on idea detail (a `.box h3` after h1 with no h2) and Horizon (card h3 directly under h1). Home order is otherwise fine. | Make the detail section headings h2, or add h2 wrappers. | S |
| S17 | Accessibility: pre-check | axe "scrollable-region-focusable" on the `.tw` table wrapper (mobile): keyboard users can't scroll it. | Add `tabindex="0"`, `role="region"` and an `aria-label` to `.tw`. | S |
| S18 | Mobile home length | The page is 22,656 px tall at 390 px (about 27 screens); "More ideas" starts at 6,870 px and Horizon at 18,410 px. | After M9, consider "Show 8 more" on More ideas, or collapse each section after 3 cards. | M |

## Nice to have

| # | Location | Issue | Suggested fix | Effort |
|---|---|---|---|---|
| N1 | Idea detail footer | "Times are UK time. Example entries show how future updates would look" appears on cards that have no example entries (e.g. all Horizon cards). | Show it only when an example entry exists. | S |
| N2 | Detail "First published: In the first draft edition." on an "Edition 02" site | Slightly confusing. | "First published in Edition 01 (28 Oct 2026)". | S |
| N3 | Desktop mock bar: "buttons do nothing real" | Fine for review, slightly flippant. | "Mockup · not live · nothing you click is saved". | S |
| N4 | S_N7 tailored line: "80% of general enquiries for low-carbon upgrades" | The source (ED2 WS8) says "80% of general enquires through self-service offerings" under the residential connections commitment. "For low-carbon upgrades" is an inference. | "80% of general connection enquiries were handled by self-service (2024/25)". | S |
| N5 | Following nav badge "8" for a first-time user | Explained on the page (8 unread updates, 4 ideas followed) but surprising before sign-in. | Tooltip "Example: 8 unread updates". | S |
| N6 | Focus styles | Links use the browser default focus ring (`auto 1px`); glossary and filter buttons have a 2 px custom ring. Visible but inconsistent (`d02-focus-visible.png`). | One `:focus-visible` style site-wide. | S |
| N7 | Landmarks (axe "region", moderate, all routes) | The `.mock` and `.edbar` banners sit outside landmarks. | Wrap them in `<header>` or give them `role="region"` with a label. | S |
| N8 | Pre-check weight | `index.html` is 1.93 MB, plus 41 data chunks (9.7 MB total, largest 628 KB) loaded on demand. Locally it loads in 0.18 s; on 4G expect about 2 s for the first view and a pause on the first postcode lookup. | Gzip or brotli on the host (will be large savings for JSON). Preload the GSP-area chunk. | S (host config) |

---

## Fact-check results

### Tailored lines (UK Power Networks public sources), checked against the source documents this session

| Card | Claim | Result |
|---|---|---|
| E1 | Automated Power Restoration System in business as usual | ✅ NIA summary 2026 (BAU list, ED1, £24.6m line) |
| E2 | £92m benefits, 13 customer projects, 2024/25 | ✅ ED2 report DSO7, exact |
| E3 / S_N2 | "enhance our resilience to sophisticated cyber-attacks" | ✅ ED2 report C1, exact |
| E4 | Super DuPPR £131,942, SIF Discovery, 2025 | ✅ ENA. ⚠ But it was BT telecoms reserve power, not "mast" batteries (M2) |
| E5 | Wildfire: prioritised hazard, moderate now, major by 2050 if nothing is done | ✅ Holdings AR 2025, climate-risk table (baseline Moderate, "Do nothing" 2050 Major) |
| N3x | 30% biodiversity net gain at 100 existing sites; 27 enhanced in 2024/25 | ✅ ED2 report EAP7 |
| N5x | Connections Lab saved customers £2.84m | ✅ ED2 report ("free" correctly stripped on render) |
| S_N7 | 80% of general enquiries via self-service | ✅ ED2 report WS8 (wording nuance N4) |
| S11 / H2 | First distribution network partner of the Data Centre Alliance, Nov 2025; ramped, flexible and profiled connections | ✅ UK Power Networks news, 12 Nov 2025 ("first Distribution Network Operator in the UK") |
| S12 | WARN, SIF Discovery 2023, £121,830, no later phase | ✅ ENA (Apr–Jul 2023; "not yet decided if the project should be pursued outside of SIF") |
| H1 | Spot robot dog: 50%, £324k by 2028 | ⚠ Figures correct but "cutting" overclaims (M1) |
| H4 | London Power Networks funding partner in SCADENT (2022) | ✅ ENA: funding licensee alongside NGET (lead) and WPD |
| H5 | Supervised robotaxis in London | ✅ Guardian 3 Sep 2026. ⚠ Wrong source cited (S3) |

### Other figures

- All other card figures and dates matched v4 research or the cost files. Examples:
  - Elisa live 28 May 2026;
  - Ofcom 16 Jun 2026;
  - EFFIS 47,879 ha;
  - DESNZ 6 Nov 2026;
  - EU Cyber Resilience Act 11 Sep 2026;
  - libIEC61850 23 Jul 2026;
  - net gain for nationally significant infrastructure projects (NSIPs) 2 Nov 2026;
  - Walmart 90 million tags;
  - cost comparables (Eye in the Sky £119,105; FRAME I £592,009; NIMBUS £574,921).
- **Cost ranges are consistent** between card, detail and update lines for every idea. The home "£0.12–0.6m" (wildfire, E5) and "£0.13–0.6m" (telecom batteries, E4) are different ideas, so there is no contradiction.
- **Horizon figures** (H1–H6) have no research file (S2). The two spot checks match their sources.

### Links

- 61 external links in total. 54 returned 200 by curl.
- These resolve in a browser, so they are bot-blocked only: cfs.energy (H4), T-Mobile (S9), tingfire (S16), and the UK Power Networks data-centre (H2, S11) and robot-dog (H1) pages.
- renewableenergyworld (E5, Pano AI) is Cloudflare-blocked but was verified via fetch.
- **elia.be biodiversity (N3x) is unverified:** it returns 403 to both curl and fetch (likely bot-blocking). Open it manually before the Luca session.

### Rule checks

- No "UKPN" in visible text.
- No "free" except "battery-free" and "SF₆-free". These are technical terms; keep or rephrase to "batteryless" if the rule is strict.
- No workshop, provider or price-quote wording ("price control" is the regulatory term).
- "Not endorsed by UK Power Networks" and "Draft for review" appear on every page and both prototypes.
- Example data is labelled throughout: Insights, counts, Following, profile.

## Experience walk-through notes (what worked)

- **Navigation round trips work.** Card → detail → "Open the demo →" → prototype → browser Back returns to the same detail page with its scroll position kept (shield: 1,237 px; pre-check: 1,029 px on mobile). The prototypes' own "←" links also go back to the right card locally (but see M3 and M4).
- **No JavaScript errors** on any route. No horizontal overflow at 390.
- **Images:** there are no `<img>` elements without alt text.
- **Mock labelling is clear and consistent** on Sign in, Profile, Insights and the feedback controls. Sign in explains the data collected and role-only reporting well; Luca should find this reassuring.
- **Glossary terms are real buttons** with a visible 2 px focus ring.

## Screenshots (`/workspace/efi/qa/shots/`)

- **Journey, v6 pilot.**
  - Landing: `m01-landing`, `d01-landing`, plus `*01b-landing-full`.
  - Focus ring: `d02-focus-visible`.
  - Detail pages: `*03-detail-E1`, `*03-detail-S_N7`.
  - Prototype link on the detail page: `*04-protolink-*`.
  - Back from the demos: `*06-back-from-*`.
  - Other pages: `*07-signin`, `*08-profile`, `*09-following`, `*10-insights`, `*11-horizon`, `*12-glossary`, `*13-watch`, `*14-detail-E4-full`.
- **Prototypes:** `*05-proto-shield`, `*05-proto-precheck`.
- **Older files in the folder** (`home-*`, `storm-*`, etc.) are from earlier site QA and are not part of this review.

Working files: `qa/v6/dump.py`, `text.json`, `links.json`, `linkcheck.txt`, `journey.py`, `journey.json`.
