# Fix log v1: content and experience QA fixes (pilot v7)

Date: 29 Oct 2026 (UK time). Input: `qa/content-experience-qa-v1.md`. Scope approved by James: all 11 must-fix items plus the quick should-fix items, in `design/v6-ukpn-pilot/` and both prototypes.

Backups: `design/v6-ukpn-pilot.bak4`, `prototypes/safety-shield-demo.bak`, `prototypes/connection-precheck.bak2`.
Staged publish layout: `site-v7/` (see `site-v7/README-LAYOUT.md`). Zip: `efi-pilot-v7.zip`.
No live site, repo, Vercel, DNS or Supabase changes. No external actions. Public sources only.

## Must-fix

| ID | Status | What changed |
|---|---|---|
| M1 | Done | H1 line now says "Initial results showed the **potential** to cut confined-space inspection time by up to 50%, with savings **estimated** to rise to £324k a year by 2028." Source: UK Power Networks news, 24 Aug 2023. |
| M2 | Done | E4 now describes Super DuPPR as battery reserve power at telecoms sites, with BT as the base case (not masts). This is reflected in the tailored line, the bridge text, "Done before in GB?" ("did not go on to a further phase") and the glossary. Sources: ENA Innovation Portal (Super DuPPR) and UK Power Networks NIA annual summary 2026 (CommsConnect), now cited as two separate links. |
| M3 | Done | Card → demo links are now root-relative: `/prototypes/safety-shield/` and `/prototypes/connection-precheck/`. Demo → card back links go to `/pilot/#/i/E1` and `/pilot/#/i/S_N7`. Local preview switches to relative paths automatically when opened as `file:`, from the source folders, or with `?links=local`. Tested in both layouts (`qa/v7/qa7.py`), and all 8 journey checks pass. |
| M4 | Done | Prototype headers now show "Safety shield · Demo" / "← Back to: Provable safety shield" and "Connection pre-check · Demo" / "← Back to: AI connection review", which is the card's actual short name. The shield intro's "E1 ·" is gone. Pilot text auto-renders idea IDs as card names. |
| M5 | Done | E1 update: "State Grid (Changsha) uses AI to propose load transfers; a physics model checks them and a dispatcher confirms. Its checker is not formally proven, which is the gap this idea fills." |
| M6 | Done | "range range" fixed in both places that produced it (S_N1 experiment, S_N2 innovation). The text check finds 0. |
| M7 | Done | The grade line now reads "Evidence grade: [Demo] shown working once…", with no duplicate label. |
| M8 | Done | The home intro now says: "A Lightleap-run draft for UK Power Networks colleagues. Our ask: back the ideas worth exploring, and tell us what we got wrong. About this pilot". Added: a new `#/about` page; the footer "EFI is run by Lightleap. Draft for review, not endorsed by UK Power Networks. Public sources only."; and a page title. |
| M9 | Done | The default is now a first visit: no "What's new since your last visit", no survey, and no "Updated since your last visit" filter. A returning visit is shown via `?visit=returning` or the "Show an example returning visit" button. The first card's top edge is at 752 px at 360×780, 696 px at 390×844, 635 px at 430×932 and 568 px at 1280×800, so the first card starts on screen 1 everywhere. |
| M10 | Done | On desktop, "Most backed" titles are clamped to 2 lines and sit on a fixed title row, so the bars line up and nothing overlaps (`qa/shots/v7/1280-mostbacked.png`). |
| M11 | Done (6 drafted, 3 invitations) | New tailored lines for E6, N1, S_N3, S13, S4 and H6, each marked "Draft for review (first drafted 29 Oct 2026)" and cited. R6, S16 and H3 have no solid public UK Power Networks link, so they now show invitation wording instead of "Tailored line needed": "Where would this fit at UK Power Networks? We found no public UK Power Networks document that links to this idea, so we have not guessed. Tell us…". |

### New tailored lines (M11) and sources

- **E6 Emergency solar backstop.** "UK Power Networks' AI for Visibility and Forecasting of Renewable Generation project (NIA, Oct 2024 – Jul 2026, £389,444) uses machine learning to estimate rooftop solar it cannot meter, substation by substation. Knowing where that hidden solar sits is the starting point for any last-resort solar switch-off."
  - Source: ENA Innovation Portal, https://smarter.energynetworks.org/projects/nia_ukpn0104/
- **N1 Memory-safe protocol stacks.** "UK Power Networks has committed to "enhance our resilience to sophisticated cyber-attacks" in this price control, measured against the NCSC Cyber Assessment Framework. Swapping one flaw-prone protocol library for a memory-safe version would be a concrete, testable step towards that."
  - Source: ED2 commitments report 2024/25 (C1), https://media.umbraco.io/ukpn-cms/1nxirw1d/ukpn_ed2_commitments_report_24-25.pdf
- **S_N3 Post-quantum cryptography.** "UK Power Networks' cyber commitment for this price control (C1) is measured against the NCSC Cyber Assessment Framework. Field kit bought now may still be in service when today's encryption can be broken, so reusing NESO's quantum-safe work in buying specifications fits that commitment."
  - Source: same ED2 report (C1).
- **S13 Neural operators.** "UK Power Networks' Python Power project (NIA, 2025–26, £358,000) made its network models run in open-source power-flow software, and found that getting real models to solve reliably took significant effort. AI stand-ins learn from many such runs, so that model base is where a test would start."
  - Source: https://smarter.energynetworks.org/projects/nia_ukpn0111/
- **S4 Certify by simulation.** "UK Power Networks counts SF₆ losses in its business carbon footprint, and its 2025 annual report lists switchgear affected by temperature rise among its climate risks. Simulation-backed temperature-rise tests could help qualify SF₆-free switchgear for hotter conditions."
  - Sources: ED2 report (business carbon footprint); UK Power Networks Holdings annual report 2025, https://media.umbraco.io/ukpn-cms/apnncnzq/uk-power-networks-holdings-limited-2025.pdf
- **H6 Quantum for grid switching.** "UK Power Networks' Python Power project (NIA, 2025–26, £358,000) made its network models usable in open-source power-flow software, and the models are published in the public LTDS CIM format. A benchmark of hard switching problems could be built on models like these, so any future quantum claim is tested on real networks."
  - Source: https://smarter.energynetworks.org/projects/nia_ukpn0111/
- **R6 Machine-checked compliance, S16 Insurer-funded home sensors, H3 Space-based solar power.** Invitation wording; no line drafted.

## Should-fix

| ID | Status | What changed |
|---|---|---|
| S1 | Done | Internal "v4 §" and catalogue refs are removed from every page footer. The refs stay in the data file only. The text check finds 0 "§" and 0 "v4". |
| S2 | Done | Horizon cards now cite their "Evidence so far" sources. New `research/horizon-v1.md` is generated from the data: 6 ideas and 23 dated, linked evidence items. |
| S3 | Done | H5: "Supervised robotaxis now run in London, inside UK Power Networks' area. Fleet depots are a new kind of large load whose charging times software controls. UK Power Networks' Chargepoint Navigator already helps councils plan public charge points." Sources: The Guardian, 3 Sep 2026, and the NIA annual summary 2026, as two links. |
| S4 | Done | "Reality check: Elon Musk said Tesla's Optimus robots were not yet doing useful work in its factories." The objection was softened to match. |
| S5 | Done | Update types now read "Category changed", "Evidence corrected", "Evidence checked" and "Scope changed". Editor phrases ("the pitch became", "turned out", "Re-tiered") are gone. |
| S6 | Done | Acronyms are no longer expanded inside parentheses, before 's, or for EFI. In the pilot, `)'s` and nested-bracket checks find 0. The shield demo's "SP Energy Networks (SPEN)’s" was also reworded. |
| S7 | Done | The S_N3 card now reads: "NESO's quantum-security project, Network Security in a Quantum Future, entered its Beta phase in Aug 2026". |
| S8 | Done | E4 uses one phrasing on both card and detail: "Estonia now trades them while keeping masts powered." |
| S9 | Done | Watchlist: "Folded into the N1 idea." / "Analogy only; better handled inside the E1 idea." These render as card names with no bracketed repeat. Also "US Food and Drug Administration-style…". |
| S10 | Done | The example update now shows the "Example" badge plus the text only. |
| S11 | Done | The dots are renamed "Proven in energy?", with a key on home and Horizon and an aria-label/title on each dot set. H6 is regraded to "Shown on a power-system problem" (B3). |
| S12 | Done | S_N7 now has a dated why-now: "Offers due 30 Nov 2026" (card) and "Reformed connection offers for distribution projects are due by 30 Nov 2026 (Ofgem timetable)". Sources: Ofgem decision letter (3 Jun 2026) and Ofgem's agreement to revise the Gate 2 timetable (Oct 2026), both public PDFs on ofgem.gov.uk. A changelog entry was added. |
| S13 | Done | Insights now says: "Stages are illustrative. No session has been requested and nothing has been agreed." |
| S14 | Done | "Example profile" label added, and "Sign out (mock)" is always shown. |
| S15 | Done | Grade chips use their dark variant colours, overriding the grey (Demo #4b2a73; base #55544f). The unread badge is #c8473a. Shield amber text, legend and earthing marks are #8a5a12. axe colour-contrast violations: 0 on all checked routes. |
| S16 | Done | Detail section headings are now h2, and Horizon has an h2. The heading order checks pass on all checked routes. |
| S17 | Done | All 3 `.tw` table wrappers in the pre-check have `tabindex="0" role="region" aria-label="… table (scrolls sideways)"`. |
| S18 | Deferred (medium effort) | Mobile page length is unchanged apart from the M9 reordering. Suggest "Show 8 more" or collapsing sections later. |

## Nice-to-have (done where quick)

| ID | Status | Note |
|---|---|---|
| N1 | Done | "Times are UK time." is always shown; the example sentence only appears when an example entry exists. |
| N2 | Done | "In Edition 01 (28 Oct 2026)." |
| N3 | Done | The mock bar now reads: "MOCKUP · NOT LIVE · nothing you click is saved · UK Power Networks pilot draft · 29 Oct 2026". |
| N4 | Done | "80% of general connection enquiries were handled by self-service in 2024/25" (ED2 report WS8). |
| N5 | Done | Nav badge title/aria: "Example: N unread". |
| N6 | Done | One site-wide teal `:focus-visible` outline. |
| N7 | Done | The mock bar and edition bar are `role="region"` with labels, in the pilot and both prototypes. axe "region" violations: 0. |
| N8 | Deferred | gzip/brotli for the pre-check data is a host setting, so it is not changed. |

## Re-QA results (29 Oct 2026, staged layout `site-v7/` and local source layout)

- **Widths 360/390/430/1280:**
  - no horizontal overflow on home (first and returning visit), or on 12 routes at each width;
  - first card on screen 1 at every width;
  - "Most backed" aligned.
- **axe (pilot: 13 routes × 2 widths plus returning visit; both prototypes at 2 widths):** 0 violations.
- **Console:** no page errors. The only 404 is `/favicon.ico` on the preview server, which has no favicon; the real site root supplies one.
- **Journeys (site layout and local layout):** card → demo → back works for E1 and S_N7 (8/8).
- **Prototype tests:**
  - shield `test_checker.js` 17/17 and `qa.py` PASS;
  - pre-check `test_precheck.js` 16/16, `test_locate.js` 12/12 and `qa.py` PASS;
  - `check_postcodes.py`: median error 3.5 m, max 6.5 m.
  - The first pre-check `qa.py` run caught the longer back link overflowing at 360 px. This was fixed by wrapping it on narrow screens.
- **Wording (visible text plus title/aria, 132 page states, both prototypes):** these all return 0 hits:
  - "UKPN", "workshop", "provider", price words;
  - "range range", "Graded", "§", "v4";
  - "Tailored line needed", "Example only, not real", "Demo: Demo", nested or duplicated brackets;
  - "Link to energy", "Hype check", "E1 DEMO"/"← E1 card".

  "free" appears only in "SF₆-free". "since your last visit" appears only in returning-visit mode.
- **External links (63):**
  - 57 return 200 by curl, and 4 more are 200 in a browser.
  - 2 sit behind a Cloudflare challenge and need a manual check in a normal browser: elia.be (known) and renewableenergyworld.com.
  - All links saved in `qa/v7/linkcheck7.txt`.

## Deferred / open

- **S18:** mobile page length.
- **N8:** host compression.
- **Manual link check:** elia.be and renewableenergyworld.com.
- **R6, S16, H3:** these tailored lines wait for UK Power Networks colleagues to suggest where they fit.
