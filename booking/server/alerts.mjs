// Internal notifications are separate from Google invitations and CRM sync.
// Never include a booking management token or the visitor's free-text message.
const subject={
  create:'Nouveau rendez-vous — Essentiel PME',
  reschedule:'Rendez-vous déplacé — Essentiel PME',
  cancel:'Rendez-vous annulé — Essentiel PME'
};
const when=value=>new Intl.DateTimeFormat('fr-CA',{
  timeZone:'America/Toronto',dateStyle:'full',timeStyle:'short'
}).format(new Date(value));
const compact=value=>String(value).replace(/\s+/g,' ').trim();

export function alertJob(action,record,operation,previous=null) {
  if(!subject[action])throw new Error('Unknown alert action');
  return {kind:'alert',status:'pending',attempts:0,nextAt:0,action,operation,
    createdAt:record.updatedAt,previousStart:previous?.start||null,
    booking:{id:record.id,start:record.start,end:record.end,meet:record.meet||null,
      guest:{first:record.guest.first,last:record.guest.last,
        company:record.guest.company,email:record.guest.email}}};
}

export function alertEmail(job,{sender,recipients}) {
  const {booking}=job,guest=booking.guest;
  const lines=[subject[job.action],'',
    `Client : ${compact(guest.first)} ${compact(guest.last)}`,
    `Entreprise : ${compact(guest.company)}`,
    `Courriel : ${compact(guest.email)}`];
  if(job.action==='reschedule')lines.push(`Ancien créneau : ${when(job.previousStart)}`);
  lines.push(`${job.action==='cancel'?'Créneau annulé':'Nouveau créneau'} : ${when(booking.start)}`);
  if(job.action!=='cancel'&&booking.meet)lines.push(`Google Meet : ${booking.meet}`);
  lines.push('','Heures indiquées pour Montréal.');
  return {sender:{email:sender,name:'Essentiel PME'},
    to:recipients.map(email=>({email})),subject:subject[job.action],textContent:lines.join('\n')};
}

export class AlertSync {
  constructor({store,client,sender,recipients,now=()=>Date.now()}) {
    Object.assign(this,{store,client,sender,recipients,now});this.running=false;
  }
  async deliver(id) {
    const job=await this.store.atomic(async tx=>{
      const value=await tx.get(id);
      if(value?.kind!=='alert'||value.status!=='pending'||value.nextAt>this.now())return null;
      const claimed={...value,status:'sending',attempts:value.attempts+1};
      tx.put(id,claimed);return claimed;
    });
    if(!job)return;
    try {
      await this.client.email(alertEmail(job,this));
      await this.store.put(id,{...job,status:'done',deliveredAt:new Date(this.now()).toISOString()});
    } catch(error) {
      // A timeout or 5xx may mean Brevo accepted the email. Do not replay it.
      const retry=error.status===429&&job.attempts<5;
      const blocked=error.status>=400&&error.status<500&&error.status!==429;
      await this.store.put(id,{...job,status:retry?'pending':blocked?'blocked':'uncertain',
        error:error.status?'brevo_http_'+error.status:'brevo_unavailable',
        nextAt:retry?this.now()+Math.min(3600000,60000*2**(job.attempts-1)):0});
      console.warn('booking_alert_delivery_failed');
    }
  }
  async drain() {
    if(this.running)return;
    this.running=true;
    try {for(const job of await this.store.alertJobs())await this.deliver(job.id);}
    finally {this.running=false;}
  }
  kick() {void this.drain().catch(()=>console.warn('booking_alert_sync_pending'));}
}
