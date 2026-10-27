-- 012: EFI preview site feedback and workshop requests
-- STATUS: DRAFT, NOT APPLIED. Needs James's approval before running.
--
-- Written by the efi-site Vercel function (api/feedback.js) using the service-role key,
-- server-side only. Browsers never talk to these tables directly.
-- RLS on, deny-by-default: no policies for anon or authenticated (convention from 010).
-- Privacy by design: no IP address or user agent is stored. Name, email and organisation
-- may only be present when consent_followup is true (enforced by CHECK constraints).

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid (built in on PG13+, harmless)

CREATE TABLE IF NOT EXISTS public.site_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL CHECK (kind IN ('signal', 'general')),
  signal_id text CHECK (signal_id IN ('storm', 'dcflex', 'queue', 'flood', 'sst')),
  network_id text CHECK (char_length(network_id) <= 20),
  useful text CHECK (useful IN ('yes', 'no')),
  comment text CHECK (char_length(comment) <= 4000),
  page text CHECK (char_length(page) <= 200),
  name text CHECK (char_length(name) <= 120),
  email text CHECK (char_length(email) <= 200),
  organisation text CHECK (char_length(organisation) <= 160),
  consent_followup boolean NOT NULL DEFAULT false,
  site_version text CHECK (char_length(site_version) <= 40),
  CONSTRAINT site_feedback_contact_needs_consent
    CHECK (consent_followup OR (name IS NULL AND email IS NULL AND organisation IS NULL)),
  CONSTRAINT site_feedback_signal_needs_id
    CHECK (kind <> 'signal' OR signal_id IS NOT NULL),
  CONSTRAINT site_feedback_not_empty
    CHECK (useful IS NOT NULL OR (comment IS NOT NULL AND char_length(btrim(comment)) > 0))
);
CREATE INDEX IF NOT EXISTS site_feedback_created_idx ON public.site_feedback (created_at);
CREATE INDEX IF NOT EXISTS site_feedback_signal_idx ON public.site_feedback (signal_id, network_id);

CREATE TABLE IF NOT EXISTS public.workshop_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  network_id text CHECK (char_length(network_id) <= 20),
  signal_id text CHECK (signal_id IN ('storm', 'dcflex', 'queue', 'flood', 'sst')),
  funding_route text CHECK (funding_route IN ('NIA', 'SIF', 'BAU', 'Other')),
  notes text CHECK (char_length(notes) <= 2000),
  timing text CHECK (char_length(timing) <= 300),
  name text CHECK (char_length(name) <= 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 200 AND email LIKE '%_@_%'),
  organisation text CHECK (char_length(organisation) <= 160),
  consent_followup boolean NOT NULL CHECK (consent_followup),   -- a request is only stored with consent
  page text CHECK (char_length(page) <= 200),
  site_version text CHECK (char_length(site_version) <= 40),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed'))
);
CREATE INDEX IF NOT EXISTS workshop_requests_created_idx ON public.workshop_requests (created_at);

ALTER TABLE public.site_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_requests ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: anon and authenticated get nothing.
REVOKE ALL ON public.site_feedback, public.workshop_requests FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_feedback, public.workshop_requests TO service_role;

COMMENT ON TABLE public.site_feedback IS 'EFI preview site feedback. Contact fields only with consent. Retention: 12 months (see purge below).';
COMMENT ON TABLE public.workshop_requests IS 'EFI preview workshop requests, stored with consent only. Retention: 12 months unless a workshop goes ahead.';

-- Retention (12 months, per the draft privacy notice). Not scheduled automatically.
-- To run by hand:
--   DELETE FROM public.site_feedback     WHERE created_at < now() - interval '12 months';
--   DELETE FROM public.workshop_requests WHERE created_at < now() - interval '12 months' AND status <> 'contacted';
-- Or, if pg_cron is enabled, schedule monthly:
--   SELECT cron.schedule('efi_feedback_retention', '0 3 1 * *', $$
--     DELETE FROM public.site_feedback     WHERE created_at < now() - interval '12 months';
--     DELETE FROM public.workshop_requests WHERE created_at < now() - interval '12 months' AND status <> 'contacted';
--   $$);
