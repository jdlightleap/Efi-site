# Deploying the EFI early preview

Target: **https://efi.lightleap.co.uk** on James's Vercel account, from the private GitHub repo `jdlightleap/efi-site`. Domain registered at **names.co.uk**.

Checked against the Vercel docs on 27 Oct 2026 (Domains > Add a domain; Functions; Routing Middleware; Fair use). Nothing in this file has been done yet.

## 0. Decisions before go-live

- [ ] **Plan.** Vercel Hobby is "non-commercial personal use only". A site that promotes Lightleap's workshops is likely to count as commercial use, so use a **Pro** team (or confirm with Vercel).
- [ ] **Preview password.** Choose a fresh password (at least 12 characters, not reused) for `EFI_PREVIEW_PASSWORD` and share it only with the event audience. Changing it signs everyone out.
- [ ] **Migration 012 approved** (see step 4). Until it is applied, the forms return "couldn't send" (503 or 502) and nothing is stored.
- [ ] **Privacy notice reviewed** (legal entity, company number, address, ICO number, Supabase/Vercel regions and transfer safeguards, 12-month retention). Then set `privacyReviewed: true` in `public/assets/config.js`.
- [ ] **Contact email** set in `public/assets/config.js` (`contactEmail`). Empty = the site points people to the feedback form.
- [ ] **lightleap.co.uk** was returning HTTP 500 on 27 Oct 2026. The About page and footer link to it.

## 1. Create the Vercel project

1. Vercel dashboard > **Add New… > Project** > import `jdlightleap/efi-site` (grant the Vercel GitHub app access to this one repo only).
2. Framework preset: **Other**. These settings come from `vercel.json`, so leave the overrides off:
   - Build command `node scripts/check.mjs` (checks files and scans `public/` for secrets; there is no bundling step)
   - Output directory `public`
   - Function region `lhr1` (London), set by `"regions"` in `vercel.json`
3. Node.js version: 20.x or later (Project > Settings > Build and Deployment).

`api/feedback.js` is deployed as a Vercel Function (Node.js runtime) and `middleware.js` as Routing Middleware. Both are picked up automatically.

## 2. Environment variables

Project > Settings > **Environment Variables**. Add each one for **Production** and **Preview**, and mark it **Sensitive**:

| Name | Value | Notes |
| --- | --- | --- |
| `EFI_PREVIEW_PASSWORD` | the chosen password | Required. If it's missing, the site stays locked (fails closed). |
| `SUPABASE_URL` | `https://ahtyywxcryxnjtvgfjgj.supabase.co` | The efi-open-data project. |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase > Project Settings > API Keys (the `service_role`, or the newer `sb_secret_…` secret key) | Server-side only. Never put it in `public/` or `config.js`. Prefer a dedicated secret key named e.g. `efi-site` so it can be rotated alone. |

Don't add `SUPABASE_DB_URL` to Vercel. It's only for refreshing data locally.

After changing a variable, redeploy so it takes effect.

## 3. Custom domain (names.co.uk)

1. Vercel project > Settings > **Domains** > **Add Domain** > `efi.lightleap.co.uk` and assign it to Production.
2. Vercel will show the record it wants. For a subdomain this is a **CNAME**. Current Vercel docs say each project gets its **own** CNAME target (for example `d1d4fc829fe7bc7c.vercel-dns-017.com`). **Use the exact value Vercel shows.** The older generic `cname.vercel-dns.com` still appears in many guides, but the project-specific value is what Vercel now asks for.
3. names.co.uk (per their support article "Changing your domain's DNS records"): log in > **Services > Dashboard** > click `lightleap.co.uk` > scroll to **DNS Settings** > in "Add/Modify DNS zone", find the "A, CNAME, records etc" rows and fill an empty row:
   - **Host name:** `efi` (just the prefix; names.co.uk adds `.lightleap.co.uk`)
   - **Type:** `CNAME`
   - **TTL:** leave the default (86400). DNS can take up to 24 hours to propagate, so do this a few days before the event.
   - **Result:** the target from step 2
   - Click **Save** at the bottom of the page. Don't pick a DNS "Template", because that would replace the existing zone.
4. If Vercel also asks for a `TXT` record at `_vercel` (shown when the domain is already linked to another Vercel account), add it in the same place.
5. Leave the existing apex / `www` / MX records alone. Only the `efi` host changes, so email and the main site aren't affected.
6. Wait for Vercel to show **Valid Configuration**. It issues the TLS certificate automatically. Check with `dig +short CNAME efi.lightleap.co.uk`.

Checked on 27 Oct 2026 using public DNS: `lightleap.co.uk` is delegated to `ns0/ns1/ns2.phase8.net`. These are names.co.uk's (Namesco's) own nameservers, so the names.co.uk DNS Settings page is the right place. `efi.lightleap.co.uk` doesn't exist yet. The apex `A` record points at `85.233.160.22` (Namesco hosting), which is returning HTTP 500. That's separate from this work.

## 4. Database (only after James approves)

`sql/012_feedback.sql` creates `public.site_feedback` and `public.workshop_requests` in project `ahtyywxcryxnjtvgfjgj`. They have RLS on, no anon/auth policies, CHECK constraints that keep contact details only with consent, and no IP/user-agent columns. **It has not been applied.**

Apply it via the Supabase SQL editor, or `supabase db push` from the efi-open-data repo, after review. Then set up the 12-month retention purge (manual SQL or pg_cron, both in the file's comments). Don't touch project `eqjkdhtzceeemfiksril`.

## 5. Smoke test after the first deploy

- [ ] `https://efi.lightleap.co.uk/` shows the password page (HTTP 401). The wrong password is rejected. The right one lands on the home page.
- [ ] Response headers include `X-Robots-Tag: noindex, nofollow, noarchive` and the CSP. `/robots.txt` disallows everything.
- [ ] `/data/data.json` without the cookie returns 401.
- [ ] All five signal pages load. Switching network works. No console errors.
- [ ] Send one test feedback, one signal "Was this useful?" and one workshop request. Check the rows in Supabase Table Editor, then delete the test rows.
- [ ] Workshop outline prints cleanly (Print / Save as PDF).
- [ ] Vercel > Logs: no function errors (the function logs only the table name and HTTP status, never the payload or the key).

## 6. Rollback and turning it off

- Vercel > Deployments > pick an earlier deployment > **Promote to Production** (instant rollback).
- To take the preview offline: remove the domain in Vercel, or pause the project, or delete the `efi` CNAME at names.co.uk.
- To lock everyone out immediately: change `EFI_PREVIEW_PASSWORD` and redeploy. Existing cookies stop working.
- If the key leaks: rotate the Supabase secret key, update the Vercel variable, redeploy.

## Limits to know

- The login and feedback rate limits are in memory per function instance. They're best-effort, not a guarantee. Vercel Firewall rate-limit rules can be added on Pro if abuse appears.
- Unknown paths show the in-app "Page not found" view with HTTP 200, because of the SPA rewrite.
