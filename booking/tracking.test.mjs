import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingTrackingEvent,nativeBookingTrackingAllowed} from './tracking.mjs';

test('booking tracking uses a platform-neutral event with no guest data',()=>{
  const event=bookingTrackingEvent('confirmed',{
    locale:'fr-CA',environment:'staging',eventId:'event-123'
  });
  assert.deepEqual(event,{
    event:'epme_booking_confirmed',event_id:'event-123',
    booking_type:'discovery_call',booking_language:'fr',booking_environment:'staging'
  });
  assert.equal(JSON.stringify(event).includes('email'),false);
  assert.equal(JSON.stringify(event).includes('phone'),false);
  assert.equal(JSON.stringify(event).includes('token'),false);
});

test('booking tracking keeps lifecycle events distinct from the conversion',()=>{
  assert.equal(bookingTrackingEvent('rescheduled',{locale:'en-CA',eventId:'move'}).event,'epme_booking_rescheduled');
  assert.equal(bookingTrackingEvent('cancelled',{eventId:'cancel'}).event,'epme_booking_cancelled');
  assert.throws(()=>bookingTrackingEvent('lead',{eventId:'bad'}),/unknown_booking_tracking_event/);
});

test('native booking sends marketing events only with both consent choices',()=>{
  for(const consent of [null,'denied','invalid','{}',JSON.stringify({analytics:true,ads:false}),JSON.stringify({analytics:false,ads:true})])
    assert.equal(nativeBookingTrackingAllowed(consent),false);
  assert.equal(nativeBookingTrackingAllowed('granted'),true);
  assert.equal(nativeBookingTrackingAllowed(JSON.stringify({analytics:true,ads:true})),true);
});
