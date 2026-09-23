// A second, private event keeps staff off the customer's invitation.
// The job is durable and independent of the confirmed customer booking.
export function internalCalendarJob(action,record,operation,previous=null) {
  return {kind:'internal-calendar',status:'pending',attempts:0,nextAt:0,
    action,operation,previous,createdAt:record.updatedAt,
    booking:{id:record.id,start:record.start,end:record.end,meet:record.meet||null,
      guest:{first:record.guest.first,last:record.guest.last,company:record.guest.company,
        email:record.guest.email,phone:record.guest.phone||''}}};
}

export class InternalCalendarSync {
  constructor({store,calendar,recipients,now=()=>Date.now()}) {
    Object.assign(this,{store,calendar,recipients,now});this.running=false;
  }
  async deliver(id) {
    const job=await this.store.atomic(async tx=>{
      const value=await tx.get(id);
      if(value?.kind!=='internal-calendar'||!['pending','sending'].includes(value.status)||value.nextAt>this.now())return null;
      if(value.previous&&(await tx.get(value.previous))?.status!=='done')return null;
      const claimed={...value,status:'sending',attempts:value.attempts+1,nextAt:this.now()+60000};
      tx.put(id,claimed);return claimed;
    });
    if(!job)return;
    try {
      await this.calendar.internal(job,this.recipients);
      await this.store.put(id,{...job,status:'done',error:null,deliveredAt:new Date(this.now()).toISOString()});
    } catch(error) {
      // Google writes may time out after succeeding. The deterministic event ID
      // and operation marker let the next attempt reconcile before writing.
      const status=error.googleStatus;
      const retry=(!status||status===408||status===429||status>=500)&&job.attempts<10;
      await this.store.put(id,{...job,status:retry?'pending':'blocked',
        error:status?'google_http_'+status:error.code||'google_unavailable',
        nextAt:retry?this.now()+Math.min(3600000,60000*2**(job.attempts-1)):0});
      console.warn('internal_calendar_sync_pending');
    }
  }
  async drain() {
    if(this.running)return;
    this.running=true;
    try {for(const job of await this.store.internalCalendarJobs())await this.deliver(job.id);}
    finally {this.running=false;}
  }
  kick() {void this.drain().catch(()=>console.warn('internal_calendar_sync_pending'));}
}
