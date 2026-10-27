/* Site settings that James should confirm before launch. Nothing secret belongs here: this file is public. */
window.EFI_SITE = {
  name: "EFI · Energy Frontier Intelligence",
  owner: "Lightleap",
  site: "https://efi.lightleap.co.uk",
  company: "https://lightleap.co.uk",
  contactEmail: "james@lightleap.co.uk",          // TODO(James): public contact address for About and Privacy, e.g. a lightleap.co.uk mailbox. Empty = feedback form only.
  privacyReviewed: false,    // TODO(James): set true once the privacy notice has been reviewed
  retentionMonths: 12,       // must match the privacy notice and the purge in sql/012_feedback.sql
  event: ""                  // optional: event name shown in the early-preview banner
};
