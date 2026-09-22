# Brevo integration — private staging

## Contract and activation

Server-only optional `BREVO_API_KEY`, runtime SECRET in DigitalOcean; never a
build variable or browser script. Without the key, no data is queued or sent.
Only new successful calendar mutations after activation are synchronized.
No retrospective import of old tests.

Before activation: verify the Essentiel PME account, provision the nine TEXT
attributes exported as `BREVO_ATTRIBUTES` in `server/brevo.mjs`, and verify the
test recipient allowlist. On 2026-09-17 the sole active workflow was Newsletter
Opt-In (#3), triggered by a named form with OPT_IN true or named Meta lead lists.
This integration submits no forms, assigns no lists, touches no OPT_IN or
blacklist fields, and activates no workflows. Recheck this before public use.

The API settings currently block unauthorized IP addresses. Activation also
requires validating/authorizing the staging server's exact outbound IP. Do not
disable this account-wide protection or authorize broad provider ranges. App
Platform outbound IP stability must be checked before promising durable access.
The existing Make/Meta API key is unrelated and must remain unchanged.

Contact upserts use email as identifier, with `updateEnabled: true`. All changed
attributes are namespaced `EPME_STG_`: FIRSTNAME, LASTNAME, COMPANY, BOOKING_ID,
STATUS, START, END, TIMEZONE, LANGUAGE. These are dedicated staging attributes,
not the existing contact's general name/company fields. Dates are ISO strings.
Free-text messages, phone numbers, Meet URLs and management tokens are not sent.

Custom events are `epme_staging_booking_created`,
`epme_staging_booking_rescheduled`, `epme_staging_booking_cancelled`.
Each carries environment, booking ID, unique operation ID, status, start/end,
timezone and language. These are custom events, NOT Brevo Meetings bookings.
Existing automations using native Meeting booked/canceled triggers do not apply.
No extra confirmation email or reminder is sent by this implementation.

## Reliability and recovery

Google confirmation and the Brevo outbox document are saved in one Firestore
transaction. Brevo network delivery is asynchronous; errors never undo Google
bookings. A global predecessor chain preserves mutation order in staging.
The worker attempts delivery after mutations, on startup, then every minute.
The `/setup` page displays unfinished deliveries; configured is not proof of a
successful connection. Delivery status is stored in `brevo-{operation}` documents
inside `booking-staging`; no credential is stored in these documents.

Contact upserts retry transient failures with exponential delay, up to five
attempts. Expired contact leases are recoverable. Events retry only a definitive
429 refusal. A network timeout, 5xx or crash after the event-send marker remains
`event_sending` and blocks later Brevo jobs until manual reconciliation. This
prevents blind replay of potentially delivered events because the documented
Brevo event endpoint provides no idempotency key. It does NOT promise exactly-once
delivery across every failure. Calendar writes remain available.

Recovery: inspect Brevo's event logs using `operation_id`; if the event exists,
mark its outbox document done. If absence is established, reset it to pending,
phase event, with nextAt zero under operator authorization. Do not simply clear
the tail or retry all documents. A permanent 4xx is blocked; fix the configuration
before retrying. Do not log API bodies or personal data during troubleshooting.

This small staging worker scans its outbox collection once per minute; it is not
a production-scale queue. Before production, add indexed queue queries, alerting,
retention, safe reconciliation tooling and separate production fields/events.

## Test plan and evidence

Automated: payload minimization/consent preservation; HTTPS credential boundary;
recipient allowlist; contact failure/retry; event 429/401/uncertain delivery;
restart recovery; atomic ordered enqueue; idempotent booking retries; no enqueue
on calendar failure; calendar confirmation independent of Brevo delivery.
23 booking/server tests passed locally on 2026-09-17; connected build passed.

Required live acceptance (not yet completed): verify account/attributes; create,
move and cancel one allowlisted real staging appointment; observe one contact and
three corresponding custom events in Brevo; verify lists/consent unchanged; cancel
the test appointment and verify no unfinished outbox. No production readiness or
live Brevo synchronization is claimed by local tests alone.

API references:
- https://developers.brevo.com/reference/create-contact
- https://developers.brevo.com/reference/create-event
