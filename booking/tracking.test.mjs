import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingTrackingEvent,nativeBookingTrackingAllowed,nativeBookingAdvertisingAllowed,bookingMetaUserData} from './tracking.mjs';

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

test('native booking honors each renewed consent choice independently',()=>{
  for(const consent of [null,'denied','granted','invalid','{}',JSON.stringify({analytics:true,ads:false}),JSON.stringify({analytics:false,ads:true}),JSON.stringify({analytics:true,ads:true}),JSON.stringify({version:2,analytics:false,ads:false})]){
    assert.equal(nativeBookingTrackingAllowed(consent),false);
    assert.equal(nativeBookingAdvertisingAllowed(consent),false);
  }
  for(const consent of [JSON.stringify({version:2,analytics:true,ads:false}),JSON.stringify({version:2,analytics:false,ads:true}),JSON.stringify({version:2,analytics:true,ads:true})])
    assert.equal(nativeBookingTrackingAllowed(consent),true);
  assert.equal(nativeBookingAdvertisingAllowed(JSON.stringify({version:2,analytics:true,ads:false})),false);
  assert.equal(nativeBookingAdvertisingAllowed(JSON.stringify({version:2,analytics:false,ads:true})),true);
});

test('booking matching data is limited to normalized identity fields',()=>{
  assert.deepEqual(bookingMetaUserData({first:'  Ada ',last:' Lovelace ',email:' ADA@EXAMPLE.COM ',phone:'514 555 1212',company:'Secret Inc',message:'Do not share'}),{
    email:'ada@example.com',phone_number:'+15145551212',first_name:'Ada',last_name:'Lovelace',address:{first_name:'Ada',last_name:'Lovelace'}
  });
  assert.deepEqual(bookingMetaUserData({first:'Ada',last:'Lovelace',email:'ada@example.com'}),{
    email:'ada@example.com',first_name:'Ada',last_name:'Lovelace',address:{first_name:'Ada',last_name:'Lovelace'}
  });
  assert.equal(bookingMetaUserData({first:'Ada',last:'Lovelace',email:'ada@example.com',phone:'+33 6 12 34 56 78'}).phone_number,'+33612345678');
  assert.equal(bookingMetaUserData({first:'Ada',email:'ada@example.com'}),null);
});
