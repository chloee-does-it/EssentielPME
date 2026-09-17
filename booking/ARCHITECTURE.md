# Connected staging design

## Boundaries and constraints

- Public production remains unchanged. Test bookings require a protected staging UI.
- Host calendar: info@superquanti.com; its owner must explicitly authorize Google.
- Google project: essentielpme-reservations. OAuth audience is internal SuperQuanti.
- Approved budget: up to USD 8/month total staging, exact price checked at deployment.
- Secrets stay outside Git and outside generated static assets. No browser-held refresh tokens.

## Proposed flow

Browser → protected Node server → Google Calendar (availability, events, Meet)
                           → Firestore (OAuth connection, booking state, slot locks)

Use a single small managed DigitalOcean service (USD 5/month advertised) serving
both the preview pages and API, replacing the static-only component after successful
verification. Use only Firestore's free default database without enabling billing;
stop if the console requires a paid plan. Confirm Canadian region availability.

## Reliability and security

- OAuth server callback validates state, PKCE and the expected host identity.
- Encrypt refresh tokens at rest with a server environment secret. Lock setup routes.
- Durable transaction claims affected slots; validate Google free/busy immediately
  before event creation. Stable Google event IDs and client idempotency keys prevent
  retries from creating duplicate appointments. Retain uncertain results for reconciliation.
- Do not show confirmation until the event exists. Handle pending Meet generation.
- Token-based management, server-side validation, rate limits, no guest details in logs.
- Staging stays access controlled and real invitation tests require an explicit recipient.

## Trade-offs and revisits

Firestore adds a second provider but avoids losing bookings on redeployment and an
additional paid database. A free-quota exhaustion must fail closed, not accept an
unrecorded booking. Service credentials must respect organization key policies;
do not weaken those policies to finish setup. If identity provisioning is blocked,
pause and choose an approved alternative. Revisit managed SQL, backups, alerting,
retention, multi-host scheduling and automated reminders before production launch.

## API contract (planned)

GET /api/booking/status — configuration state without secrets
GET /api/booking/slots — bounded availability, no calendar-event details
POST /api/booking/reservations — validated guest + slot + idempotency key
GET /api/booking/reservations/:id — requires management token
POST /api/booking/reservations/:id/reschedule — same token and concurrency checks
POST /api/booking/reservations/:id/cancel — same token, idempotent cancellation
GET /api/booking/google/start and /google/callback — host setup only

This document describes the target, not proof of a deployed/connected implementation.

## Provisioning status — 2026-09-16

Verified created: Google Calendar API enabled; internal OAuth app and web client
`Essentiel PME — Staging`; redirect reserved at
`https://essentielpme-staging-hk2il.ondigitalocean.app/api/booking/google/callback`.
The callback is NOT implemented yet. Client configuration is in ignored local
`.env.google-staging` (mode 0600), never in the generated site.

Firestore `(default)` Standard/Native is created in northamerica-northeast1
(Montréal), restrictive client rules selected, no billing setup performed.
Service account `booking-staging@essentielpme-reservations.iam.gserviceaccount.com`
has Cloud Datastore User on this isolated project. No Workspace domain delegation.
The original Google-generated key download could not be located. With explicit
user approval, a replacement RSA key was generated locally and only its public
certificate uploaded to Google. The private credential is stored in ignored
`.secrets/google-service-account.json` (mode 0600, parent directory 0700).
Replacement key ID: `4c0663117504286963467934d920bff81cb92515`.
Its public certificate expires on 2027-09-16 at 19:59:38 UTC; rotate before expiry.
`node booking/verify-server-identity.mjs` verified Google authentication and
Firestore read access (404 for the not-yet-created host document), with no data
written and no secrets logged.

On 2026-09-17, after user authorization, Cloud Shell confirmed that original key
`f1f961095b5827705133aeea9b47782c78e7611e` was disabled (not deleted).
The replacement key then passed a fresh Google authentication and Firestore
read-access smoke test. Key rotation is complete; no booking data was modified.

## Implementation status — 2026-09-17

The protected Node server, Google OAuth callback, real availability, create/move/
cancel API, encrypted refresh-token storage and durable operation lock are now
implemented locally. Fourteen automated tests pass, including on Node 22.
Browser verification confirmed private login and the accurate not-connected state
using the real Firestore backend. No real calendar event was created.

The implementation serializes all staging calendar writes with one durable lock,
rather than per-slot locks. An ambiguous Google mutation blocks further writes
until operator reconciliation. See OPERATIONS.md for limits and recovery rules.

DigitalOcean still serves the static demo. A non-secret one-service deployment
spec is prepared; transfer of all four runtime secrets awaits explicit approval.
Google host consent and end-to-end real booking verification remain outstanding.

The server implementation was pushed to `staging` as `6f587f8`. During deployment
preparation, DigitalOcean's upload **Replace** button applied a non-secret spec
immediately (it is NOT a draft-only action). Deployment `9a0ad77b-94b1-4479-8993-37132403fb09`
failed because it used the prior commit without `build:connected`. The subsequent
new-code build passed; its incomplete deployment was intentionally canceled.
No secrets were transmitted. The static topology was restored and verified live
at 10:43:57 UTC on 2026-09-17, deployment
`467b28fa-b125-4c23-8641-4428197429b3`. Public staging status returned HTTP 200,
`bookingMode: demo`; the production contact page also returned HTTP 200.
The proposed service's exact resource price was verified in the DigitalOcean UI:
USD 5.00/month, 512 MB, one shared CPU, one container, 40 GB bandwidth.
