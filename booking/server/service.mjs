import {RULES,slots,validGuest} from '../schedule.mjs';
import {PublicError,hash,equal} from './security.mjs';
import {brevoJob} from './brevo.mjs';

const idPattern=/^[a-f0-9]{48}$/;
const keyPattern=/^[a-zA-Z0-9_-]{20,100}$/;
export function cleanGuest(input) {
  if(!input || typeof input!=='object')throw new PublicError('invalid_guest');
  const guest=Object.fromEntries(['first','last','email','company','phone','message'].map(k=>[k,typeof input[k]==='string'?input[k].trim():'']));
  guest.email=guest.email.toLowerCase();
  if(!validGuest(guest))throw new PublicError('invalid_guest');
  return guest;
}
export class BookingService {
  constructor({store,calendar,allowedEmails,brevo=null,now=()=>Date.now()}) {Object.assign(this,{store,calendar,allowedEmails,brevo,now});}
  async get(id,token) {
    if(!idPattern.test(id||''))throw new PublicError('not_found',404);
    const record=await this.store.get('booking-'+id);
    if(!record||!equal(record.tokenHash,hash(token||'')))throw new PublicError('not_found',404);
    return record;
  }
  async availability(exclude) {
    const now=this.now();const start=new Date(now-86400000).toISOString(),end=new Date(now+(RULES.horizonDays+1)*86400000).toISOString();
    const busy=await this.calendar.busy(start,end,exclude);
    return slots({now,busy});
  }
  async perform(action,input,key) {
    if(!['create','reschedule','cancel'].includes(action)||!keyPattern.test(key||''))throw new PublicError('invalid_request');
    const previous=action==='create'?null:await this.get(input.id,input.token);
    const guest=previous?.guest||cleanGuest(input.guest);
    if(!this.allowedEmails.includes(guest.email))throw new PublicError('test_email_not_allowed',403);
    if(action==='create'&&!keyPattern.test(input.token||''))throw new PublicError('invalid_request');
    const id=previous?.id||hash('booking:'+key).slice(0,48);
    const opId=hash(action+':'+key);
    const fingerprint=hash(JSON.stringify({action,id,start:input.start||null,guest,tokenHash:hash(input.token||'')}));
    const claimed=await this.store.atomic(async tx=>{
      const op=await tx.get('op-'+opId),lock=await tx.get('lock'),existing=await tx.get('booking-'+id);
      if(op) {if(op.fingerprint!==fingerprint)throw new PublicError('idempotency_conflict',409);return {op};}
      if(lock?.operation)throw new PublicError('booking_busy',409);
      if(action==='create'&&existing)throw new PublicError('idempotency_conflict',409);
      if(action!=='create'&&existing?.status!=='confirmed')throw new PublicError('booking_not_active',409);
      if(previous&&existing.updatedAt!==previous.updatedAt)throw new PublicError('booking_changed',409);
      tx.put('op-'+opId,{fingerprint,status:'pending',id,action,createdAt:new Date(this.now()).toISOString()});
      // Durable lock has deliberately no TTL. An ambiguous Google write must be
      // reconciled by an operator before another calendar write is permitted.
      tx.put('lock',{operation:opId});return {claimed:true};
    });
    if(claimed.op) {
      if(claimed.op.status==='done')return {record:await this.get(id,input.token)};
      if(claimed.op.status==='failed')throw new PublicError(claimed.op.error,409);
      return {pending:true,id};
    }
    let mutationStarted=false;
    try {
      if(previous&&Date.parse(previous.start)<=this.now())throw new PublicError('booking_in_past',409);
      const slot=action==='cancel'?previous:(await this.availability(previous?.id)).find(s=>s.start===input.start);
      if(!slot)throw new PublicError('slot_unavailable',409);
      let zone=previous?.zone||input.zone||RULES.zone;
      try {new Intl.DateTimeFormat('en',{timeZone:zone});} catch {throw new PublicError('invalid_timezone');}
      const record={id,start:slot.start,end:slot.end,guest,zone,locale:previous?.locale||(input.locale==='en-CA'?'en-CA':'fr-CA'),
        tokenHash:previous?.tokenHash||hash(input.token),status:action==='cancel'?'cancelled':'confirmed',
        rescheduled:action==='reschedule'||previous?.rescheduled||false,updatedAt:new Date(this.now()).toISOString(),mode:'connected'};
      const current=previous?await this.calendar.event(id):null;
      if(previous&&current?.status!=='cancelled'&&current?.extendedProperties?.private?.epmeBooking!==id)throw new PublicError('calendar_event_changed',409);
      if(action==='reschedule'&&(!current||current.status==='cancelled'))throw new PublicError('calendar_event_changed',409);
      mutationStarted=true;
      const event=action==='create'?await this.calendar.create({...record,token:input.token},opId):
        action==='reschedule'?await this.calendar.move(record,opId,current.etag):await this.calendar.cancel(id,current?.etag);
      if(action!=='cancel') {
        if(!event||event.status==='cancelled'||event.extendedProperties?.private?.epmeBooking!==id)throw new Error('Unverified event');
        record.meet=event.hangoutLink||event.conferenceData?.entryPoints?.find(x=>x.entryPointType==='video')?.uri||null;
      } else record.meet=null;
      await this.store.atomic(async tx=>{
        const op=await tx.get('op-'+opId),lock=await tx.get('lock');
        const tail=this.brevo?await tx.get('brevo-tail'):null;
        if(lock?.operation!==opId)throw new Error('Lost operation ownership');
        tx.put('booking-'+id,record);tx.put('op-'+opId,{...op,status:'done'});tx.put('lock',{operation:null});
        if(this.brevo){
          const outboxId='brevo-'+opId;
          tx.put(outboxId,brevoJob(action,record,opId,tail?.id||null));
          tx.put('brevo-tail',{id:outboxId});
        }
      });
      // Delivery is independent of the Google confirmation and durably queued.
      // Never turn a confirmed calendar write into a failure due to Brevo.
      try{this.brevo?.kick();}catch{console.warn('brevo_sync_pending');}
      return {record};
    } catch(error) {
      // A timeout/5xx after dispatch may have created the event. Keep the lock and
      // return pending rather than creating a second event or claiming failure.
      const definitive=error.googleStatus>=400&&error.googleStatus<500&&error.googleStatus!==408&&error.googleStatus!==409;
      if(!mutationStarted||definitive) {
        await this.store.atomic(async tx=>{
          const op=await tx.get('op-'+opId),lock=await tx.get('lock');
          if(lock?.operation!==opId)throw new Error('Lost operation ownership');
          tx.put('op-'+opId,{...op,status:'failed',error:error.code||'calendar_unavailable'});tx.put('lock',{operation:null});
        });
        throw error instanceof PublicError?error:new PublicError('calendar_unavailable',503);
      }
      return {pending:true,id};
    }
  }
}
export function publicRecord(record) {
  const {tokenHash,...safe}=record;return safe;
}
