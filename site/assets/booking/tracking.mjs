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
  try{
    const consent=JSON.parse(rawConsent);
    // Older consent predates disclosure of booking identity sharing with Meta.
    return consent?.version===2&&(consent?.analytics===true||consent?.ads===true);
  }catch{return false;}
}

export function nativeBookingAdvertisingAllowed(rawConsent){
  if(!rawConsent)return false;
  try{
    const consent=JSON.parse(rawConsent);
    return consent?.version===2&&consent?.ads===true;
  }catch{return false;}
}

export function bookingMetaUserData(guest){
  if(!guest||typeof guest!=='object')return null;
  const first=String(guest.first||'').trim();
  const last=String(guest.last||'').trim();
  const email=String(guest.email||'').trim().toLowerCase();
  if(!first||!last||!email)return null;
  const rawPhone=String(guest.phone||'').trim();
  const digits=rawPhone.replace(/[^0-9]/g,'');
  const phone=digits.length===10?'+1'+digits:
    digits.length===11&&digits[0]==='1'?'+'+digits:
    rawPhone.startsWith('+')&&digits.length>=8&&digits.length<=15?'+'+digits:'';
  return {
    email,
    ...(phone?{phone_number:phone}:{}),
    first_name:first,
    last_name:last,
    address:{first_name:first,last_name:last}
  };
}
