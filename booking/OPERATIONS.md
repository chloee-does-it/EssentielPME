# Connected staging operations

This is a protected test system, not a production release. Production `main` and
the production DigitalOcean application must remain unchanged.

## Deployment

- `.do/app-connected.json`: non-secret App Platform topology, Toronto, one
  `basic-xxs` 512 MiB service. Advertised fixed compute price USD 5/month; verify
  the live platform estimate before applying. This replaces the static component.
- `node booking/prepare-deployment.mjs`: prepare ignored private deployment files
  from approved Google credentials. Upload only to the staging application's spec.
- Secret environment values are runtime-only, type `SECRET`; never commit the
  generated spec. Keep `TOKEN_ENCRYPTION_KEY` unchanged across deployments or the
  existing Google refresh token cannot be decrypted.
- `/healthz` is public and reveals no credentials. Every other route requires
  the staging login code. `/setup` starts organizer consent for
  `info@superquanti.com` only. Client input can never choose the organizer/calendar.
- `BOOKING_TEST_EMAILS` is an explicit comma-separated allowlist; empty means no
  real booking writes are allowed. Obtain user approval for each test recipient.
- All test events are marked `[TEST STAGING]`. Creation, rescheduling and
  cancellation request Google attendee notifications. No marketing tags run.

## Data and failure handling

Firestore collection `booking-staging` contains encrypted organizer refresh token,
booking records, hashed management tokens, one-use OAuth state and operation records.
Management URLs place tokens in the fragment, not server access-log query strings.
Private invite descriptions contain the management link; keep those invites private.
The management link still requires staging access in this test environment.

Calendar writes are serialized through a durable Firestore lock. Google event IDs
are deterministic and POST retries use idempotency keys. If a Google write times
out or returns an ambiguous response, the operation stays pending and the lock
is **not automatically expired**. This deliberately blocks further writes rather
than risking duplicate invitations. Do not manually clear the lock without first
inspecting the identified Google event and matching its private operation ID.
Reconcile the booking and operation records in one transaction before releasing
the lock. A future production release needs a tested operator reconciliation tool.

Availability is checked immediately before each write. External writers (Brevo,
manual calendar edits, other apps) do not participate in our lock; Google Calendar
does not offer an atomic free/busy-and-book API. Retire competing booking flows
or revisit this limitation before production rollout.

No automatic reminder email service, multi-calendar aggregation, public booking
access, automated data retention or production monitoring is claimed here. Review
these, consent language and retention before releasing publicly. Delete test guest
data only after approval; do not delete organizer credentials during cleanup.

## Verification

`npm run test:booking` covers schedule/DST, input validation, recipient allowlist,
idempotency, concurrency, ambiguous writes, database failure, authenticated access,
CSRF, same-origin enforcement and private-file protection. Mocks do not prove a
real invitation was delivered. Complete an approved real booking, move and cancel
test only after Google organizer consent; verify the Google event and guest inbox.

Local private credential certificate expires 2027-09-16; rotate before expiry.
No additional paid database or Google billing plan is enabled by this deployment.
