# Booking preview — staging only

Run `npm run test:booking` and `npm run build:staging`. DigitalOcean publishes
`_staging` from branch `staging`. Production's build and committed HTML are unchanged.

## Implemented

- French `/rendez-vous/` and English `/en/book/`, also embedded on contact pages.
- Date/time selection, display time zones, required guest validation.
- Immediate navigation to branded confirmation, with no intermediary Proceed button.
- Reschedule/cancel, local conflict checks and a 15-minute buffer.
- Toronto office hours matching the observed Brevo setup: weekdays 09:00–13:00,
  Tuesday/Wednesday also 16:00–19:00; 30-minute calls; 24-hour minimum notice;
  21-day booking horizon. Confirm these again before launch.
- No marketing tags, external frames, real form submissions or production integration.
- Noindex plus robots Disallow. This is a public preview, not password protected.

## Demo limitations

Availability is simulated, NOT synchronized with Google/Brevo. Reservations live
only in sessionStorage in this browser tab; closing it removes them. Different
tabs/devices are not synchronized. Use fictional details. No emails, invitations,
Google Meet links or reminders are generated. Booking references are demo IDs,
not authorization tokens. Do not enable real bookings with this storage model.

## Required before real bookings

1. Create a Google Cloud project, enable Calendar API, and configure OAuth for
   the host account `info@superquanti.com`. Store refresh token/client secret
   only in server-side encrypted environment configuration, never the static site.
   Choose the appropriate internal/external consent configuration; external test
   mode is not a durable production authorization arrangement.
2. Add an authenticated host connection and a server-side booking API. The current
   $3/month DigitalOcean component is static hosting only; any added compute or
   persistent storage cost must be checked and approved before provisioning.
3. Use durable storage, atomic per-host slot locks and idempotency keys; read
   Google free/busy and recheck before event creation. Include other calendars
   that should block availability. Handle Google errors/retries without duplicate
   events or false confirmations; external calendar edits can race with booking.
4. Create the host event with attendee invitations and an actual Meet conference.
   Redirect only after confirmed creation. Poll pending conference generation
   rather than inventing a meeting URL. Decide whether Google or Brevo handles
   additional email reminders; do not send duplicate invitations.
5. Secure reschedule/cancel with unguessable expiring management tokens, server
   validation, rate limiting and appropriate anti-abuse protection. Never expose
   guest details via sequential/public references or in analytics/URLs.
6. Test with an isolated Google test calendar, explicit permission for any real
   invitations, and failure/concurrency scenarios. Then approve production cutover.

## Verification

Automated schedule tests cover notice/horizon, work windows, daylight saving,
buffer conflicts and guest limits. Browser checks should cover French/English,
automatic confirmation, rescheduling, cancellation, required fields, time zones,
missing references and narrow layouts. Re-run after Google integration.
