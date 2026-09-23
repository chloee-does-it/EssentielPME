# Private staff calendar invitations

Production bookings continue to create one customer event on the organizer's
`info@superquanti.com` calendar. A separate private event invites only the
validated `BOOKING_ALERT_RECIPIENTS` (currently Benoit and Chloee). The customer
is never an attendee of the staff event, and staff are never added to the
customer event. The staff event contains the customer's name, company, email,
phone when supplied, and the existing Google Meet URL. It excludes the booking
management token and free-text message. It does not create a second Meet room.

The staff event is transparent on the organizer calendar so it does not block
public availability a second time. It is still visible to staff invitees;
whether it appears automatically and how it affects their availability and
reminders depend on their individual Google Calendar invitation settings.
They should accept the first invitation or mark the organizer as known.

Create, reschedule, and cancel each enqueue one durable, per-booking ordered
job after the customer event is confirmed. Google notifications use
`sendUpdates=all`. A deterministic staff event ID and operation marker allow
safe retries after ambiguous Google responses. A 4xx/permission failure or ten
unsuccessful attempts blocks the staff job without undoing the customer's
confirmed booking. Check `internal-calendar` jobs in the production Firestore
collection when an invitation is missing; verify the Google event before
manually changing a blocked job. Do not blindly replay a confirmed job.

The feature applies to new bookings after deployment. An existing booking
receives its first staff invitation if it is rescheduled; old bookings are not
bulk backfilled. Verify the first production flow with an explicitly approved
test booking, including moving and cancelling it, and check both staff calendars.
