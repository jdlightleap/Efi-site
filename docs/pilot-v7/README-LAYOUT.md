# EFI UK Power Networks pilot: publish layout (v7, 29 Oct 2026)

Copy these folders into the site repo root as they are. All links between them are root-relative.

| Published URL | Files in this folder | Source in /workspace/efi |
|---|---|---|
| `/pilot/` | `pilot/index.html`, `pilot/assets/fonts/*` | `design/v6-ukpn-pilot/index.html` (built by `build/build_html.py`) + `assets/` |
| `/prototypes/safety-shield/` | `prototypes/safety-shield/index.html`, `assets/fonts/*` | `prototypes/safety-shield-demo/` (built by `build.py`) |
| `/prototypes/connection-precheck/` | `prototypes/connection-precheck/index.html`, `pc/*.json` (41 postcode chunks, loaded on demand), `assets/fonts/*` | `prototypes/connection-precheck/` (built by `build.py`) |

Links:
- Pilot card E1 "Provable safety shield" → `/prototypes/safety-shield/`; card S_N7 "AI connection review" → `/prototypes/connection-precheck/`.
- Prototype back links: "← Back to: Provable safety shield" → `/pilot/#/i/E1`; "← Back to: AI connection review" → `/pilot/#/i/S_N7`.
- The prototypes load `assets/` and `pc/` relatively, so they must be served at the trailing-slash URL (most static hosts, including Vercel, do this for `folder/index.html`).

Local preview:
- Serve this folder as a web root (`python3 -m http.server 8797` here, then open `/pilot/`). `index.html` at this level is a preview-only redirect to `/pilot/`; do **not** include it in the PR (the site already has its own root page).
- Opening the source folders directly (`design/v6-ukpn-pilot/index.html`, via `file://` or any server) switches links to relative paths automatically. `?links=local` forces relative links anywhere.

Optional host settings (not changed, needs approval): gzip/brotli for `/prototypes/connection-precheck/pc/*.json` (N8). There is no favicon in these folders; the site root's favicon will be used.
