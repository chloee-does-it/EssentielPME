// Server-only integration. No list enrollment, marketing consent or email sends.
export const BREVO_ATTRIBUTES=['FIRSTNAME','LASTNAME','COMPANY','BOOKING_ID','STATUS','START','END','TIMEZONE','LANGUAGE'].map(x=>'EPME_STG_'+x);
const names={create:'epme_staging_booking_created',reschedule:'epme_staging_booking_rescheduled',cancel:'epme_staging_booking_cancelled'};
export function brevoJob(action,record,operation,previous=null) {
  if(!names[action])throw new Error('Unknown booking action');
  const {guest}=record;
  return {kind:'brevo',status:'pending',phase:'contact',attempts:0,nextAt:0,previous,
    operation,createdAt:record.updatedAt,
    contact:{email:guest.email,updateEnabled:true,attributes:{
      EPME_STG_FIRSTNAME:guest.first,EPME_STG_LASTNAME:guest.last,EPME_STG_COMPANY:guest.company,
      EPME_STG_BOOKING_ID:record.id,EPME_STG_STATUS:action==='cancel'?'cancelled':'confirmed',
      EPME_STG_START:record.start,EPME_STG_END:record.end,EPME_STG_TIMEZONE:record.zone,EPME_STG_LANGUAGE:record.locale}},
    event:{event_name:names[action],identifiers:{email_id:guest.email},event_date:record.updatedAt,
      event_properties:{environment:'staging',booking_id:record.id,operation_id:operation,
        status:record.status,start:record.start,end:record.end,timezone:record.zone,language:record.locale}}
  };
}
export class BrevoClient {
  constructor(apiKey,request=fetch){this.apiKey=apiKey;this.request=request;}
  async post(path,data) {
    const response=await this.request('https://api.brevo.com/v3/'+path,{
      method:'POST',redirect:'error',headers:{'api-key':this.apiKey,'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(data),signal:AbortSignal.timeout(10000)});
    // Do not retain response bodies: they can contain personal data.
    if(!response.ok){const error=new Error('brevo_request_failed');error.status=response.status;throw error;}
  }
  contact(data){return this.post('contacts',data);}
  event(data){return this.post('events',data);}
}
export class BrevoSync {
  constructor({store,client,allowedEmails,now=()=>Date.now()}){Object.assign(this,{store,client,allowedEmails,now});this.running=false;}
  async deliver(id) {
    let job=await this.store.atomic(async tx=>{
      const value=await tx.get(id);
      if(!value||value.kind!=='brevo'||!['pending','contact_sending'].includes(value.status)||value.nextAt>this.now())return null;
      if(value.previous&&(await tx.get(value.previous))?.status!=='done')return null;
      if(!this.allowedEmails.includes(value.contact.email)||value.event.identifiers.email_id!==value.contact.email){
        tx.put(id,{...value,status:'blocked',error:'recipient_not_allowed'});return null;
      }
      // Contact upserts can be retried after a crash. Event dispatches cannot:
      // Brevo has no documented idempotency key for this endpoint.
      const claimed={...value,status:value.phase==='contact'?'contact_sending':'event_sending',
        attempts:value.attempts+1,nextAt:this.now()+60000};
      tx.put(id,claimed);return claimed;
    });
    if(!job)return;
    try {
      if(job.phase==='contact'){
        await this.client.contact(job.contact);
        job={...job,phase:'event',status:'event_sending'};
        await this.store.put(id,job); // durable marker BEFORE non-idempotent send
      }
      await this.client.event(job.event);
      await this.store.put(id,{...job,status:'done',deliveredAt:new Date(this.now()).toISOString(),error:null});
    }catch(error){
      const transient=error.status===429||!error.status||error.status>=500;
      const ambiguous=job.phase==='event'&&error.status!==429&&(!error.status||error.status>=500);
      const retry=!ambiguous&&transient&&job.attempts<5;
      await this.store.put(id,{...job,status:ambiguous?'event_sending':retry?'pending':'blocked',
        error:ambiguous?'delivery_uncertain':error.status?'brevo_http_'+error.status:'brevo_unavailable',
        nextAt:this.now()+Math.min(3600000,60000*2**(job.attempts-1))});
    }
  }
  async drain(){
    if(this.running)return;
    this.running=true;
    try {for(const job of await this.store.brevoJobs())await this.deliver(job.id);}
    finally {this.running=false;}
  }
  kick(){void this.drain().catch(()=>console.warn('brevo_sync_pending'));}
}
