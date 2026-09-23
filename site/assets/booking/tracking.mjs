const EVENT_NAMES={
  view:'epme_booking_view',
  start:'epme_booking_start',
  confirmed:'epme_booking_confirmed',
  rescheduled:'epme_booking_rescheduled',
  cancelled:'epme_booking_cancelled'
};

export function bookingTrackingEvent(kind,{locale='fr-CA',environment='production',eventId}={}) {
  if(!EVENT_NAMES[kind])throw new Error('unknown_booking_tracking_event');
  if(!eventId)throw new Error('missing_booking_tracking_event_id');
  return {
    event:EVENT_NAMES[kind],
    event_id:eventId,
    booking_type:'discovery_call',
    booking_language:locale.startsWith('en')?'en':'fr',
    booking_environment:environment
  };
}

export function nativeBookingTrackingAllowed(rawConsent){
  if(!rawConsent)return false;
  if(rawConsent==='granted')return true;
  try{
    const consent=JSON.parse(rawConsent);
    return consent?.analytics===true&&consent?.ads===true;
  }catch{return false;}
}
