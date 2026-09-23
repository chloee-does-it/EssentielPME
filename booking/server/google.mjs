import {OAuth2Client} from 'google-auth-library';
import {RULES,torontoInstant} from '../schedule.mjs';
import {PublicError} from './security.mjs';

export const SCOPES=['openid','email','https://www.googleapis.com/auth/calendar.events.owned','https://www.googleapis.com/auth/calendar.freebusy'];
export const internalEventId=id=>'epmeinternal'+id;
export class GoogleCalendar {
  constructor(config,store,vault) { this.config=config;this.store=store;this.vault=vault; }
  oauth() { return new OAuth2Client({clientId:this.config.clientId,clientSecret:this.config.clientSecret,redirectUri:this.config.origin+'/api/booking/google/callback'}); }
  async connect(code,codeVerifier) {
    const client=this.oauth();
    const {tokens}=await client.getToken({code,codeVerifier});
    const ticket=await client.verifyIdToken({idToken:tokens.id_token,audience:this.config.clientId});
    const payload=ticket.getPayload();
    if(payload.email!==this.config.host || payload.email_verified!==true) throw new PublicError('wrong_google_account',403);
    if(!tokens.refresh_token) throw new PublicError('google_consent_required',400);
    const granted=new Set((tokens.scope||'').split(' '));
    if(!SCOPES.filter(s=>s.startsWith('https://')).every(s=>granted.has(s))) throw new PublicError('google_permissions_missing',403);
    await this.store.put('host',{email:payload.email,refresh:this.vault.seal(tokens.refresh_token),connectedAt:new Date().toISOString()});
  }
  async request(path,{method='GET',body,etag}={}) {
    const host=await this.store.get('host');
    if(!host?.refresh || host.email!==this.config.host) throw new PublicError('calendar_not_connected',503);
    const client=this.oauth(); client.setCredentials({refresh_token:this.vault.open(host.refresh)});
    const token=await client.getAccessToken();
    const response=await fetch('https://www.googleapis.com/calendar/v3'+path,{
      method,headers:{Authorization:`Bearer ${token.token}`,'Content-Type':'application/json',...(etag?{'If-Match':etag}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)
    });
    if(response.status===204) return null;
    const data=await response.json();
    if(!response.ok) {const err=new PublicError('calendar_unavailable',503);err.googleStatus=response.status;throw err;}
    return data;
  }
  async busy(start,end,exclude) {
    if(!exclude) {
      const data=await this.request('/freeBusy',{method:'POST',body:{timeMin:start,timeMax:end,timeZone:RULES.zone,items:[{id:this.config.host}]}});
      const result=data.calendars?.[this.config.host];
      if(!result || result.errors?.length) throw new PublicError('calendar_unavailable',503);
      return result.busy||[];
    }
    // List the owned calendar when rescheduling, excluding only this booking's event.
    const result=[];let pageToken;
    do {
      const query=new URLSearchParams({timeMin:start,timeMax:end,singleEvents:'true',maxResults:'2500',timeZone:RULES.zone,...(pageToken?{pageToken}:{})});
      const data=await this.request('/calendars/primary/events?'+query);
      for(const event of data.items||[]) {
        if(event.id===exclude||event.status==='cancelled'||event.transparency==='transparent'||event.attendees?.some(a=>a.self&&a.responseStatus==='declined'))continue;
        const instant=field=>field.dateTime||new Date(torontoInstant(field.date,0)).toISOString();
        result.push({start:instant(event.start),end:instant(event.end)});
      }
      pageToken=data.nextPageToken;
    } while(pageToken);
    return result;
  }
  async event(id) {
    try {return await this.request('/calendars/primary/events/'+id);}
    catch(error) {if([404,410].includes(error.googleStatus))return null;throw error;}
  }
  async create(record,operation) {
    const manage=this.config.origin+(record.locale==='en-CA'?'/en/booking-confirmed/':'/merci/rendez-vous/')+'#ref='+record.id+'&token='+record.token;
    const staging=this.config.environment!=='production';
    const body={id:record.id,summary:`${staging?'[TEST STAGING] ':''}Appel découverte — Essentiel PME`,
      description:`${staging?'Réservation de test / Test booking':'Réservation en ligne / Online booking'}\n${record.guest.first} ${record.guest.last} — ${record.guest.company}\n${record.guest.message||''}\nGérer / Manage: ${manage}`,
      start:{dateTime:record.start,timeZone:RULES.zone},end:{dateTime:record.end,timeZone:RULES.zone},
      attendees:[{email:record.guest.email}],guestsCanModify:false,guestsCanInviteOthers:false,visibility:'private',
      conferenceData:{createRequest:{requestId:record.id,conferenceSolutionKey:{type:'hangoutsMeet'}}},
      extendedProperties:{private:{epmeBooking:record.id,epmeOperation:operation}}};
    try {return await this.request('/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',{method:'POST',body});}
    catch(error){if(error.googleStatus===409){const event=await this.event(record.id);if(event?.extendedProperties?.private?.epmeBooking===record.id)return event;}throw error;}
  }
  async move(record,operation,etag) {
    return this.request('/calendars/primary/events/'+record.id+'?conferenceDataVersion=1&sendUpdates=all',{method:'PATCH',etag,body:{
      start:{dateTime:record.start,timeZone:RULES.zone},end:{dateTime:record.end,timeZone:RULES.zone},
      extendedProperties:{private:{epmeBooking:record.id,epmeOperation:operation}}
    }});
  }
  async cancel(id,etag) {
    try{return await this.request('/calendars/primary/events/'+id+'?sendUpdates=all',{method:'DELETE',etag});}
    catch(error){if(![404,410].includes(error.googleStatus))throw error;}
  }
  async internal(job,recipients) {
    const {booking,action,operation}=job,id=internalEventId(booking.id);
    const current=await this.event(id);
    if(current&&current.status!=='cancelled'&&
      (current.extendedProperties?.private?.epmeBooking!==booking.id||
       current.extendedProperties?.private?.epmeInternal!=='1'))
      throw new PublicError('calendar_event_changed',409);
    if(action==='cancel') {
      if(!current||current.status==='cancelled')return null;
      return this.cancel(id,current.etag);
    }
    if(current?.status!=='cancelled'&&current?.extendedProperties?.private?.epmeOperation===operation)return current;
    let meet=booking.meet;
    if(!meet){
      const primary=await this.event(booking.id);
      if(primary?.extendedProperties?.private?.epmeBooking===booking.id)
        meet=primary.hangoutLink||primary.conferenceData?.entryPoints?.find(x=>x.entryPointType==='video')?.uri||null;
      if(!meet)throw new PublicError('meet_pending',503);
    }
    const guest=booking.guest;
    const body={summary:`Suivi interne — Appel découverte — ${guest.first} ${guest.last}`,
      description:[`Client : ${guest.first} ${guest.last}`,`Entreprise : ${guest.company}`,
        `Courriel : ${guest.email}`,...(guest.phone?[`Téléphone : ${guest.phone}`]:[]),
        `Google Meet : ${meet}`].join('\n'),
      start:{dateTime:booking.start,timeZone:RULES.zone},end:{dateTime:booking.end,timeZone:RULES.zone},
      visibility:'private',guestsCanModify:false,guestsCanInviteOthers:false,
      guestsCanSeeOtherGuests:false,transparency:'transparent',
      extendedProperties:{private:{epmeBooking:booking.id,epmeInternal:'1',epmeOperation:operation}}};
    if(current&&current.status!=='cancelled')
      return this.request('/calendars/primary/events/'+id+'?sendUpdates=all',{method:'PATCH',etag:current.etag,body});
    body.id=id;body.attendees=recipients.map(email=>({email}));
    try{return await this.request('/calendars/primary/events?sendUpdates=all',{method:'POST',body});}
    catch(error){
      if(error.googleStatus===409){
        const existing=await this.event(id);
        if(existing?.extendedProperties?.private?.epmeBooking===booking.id&&
          existing.extendedProperties.private.epmeInternal==='1'&&
          existing.extendedProperties.private.epmeOperation===operation)return existing;
      }
      throw error;
    }
  }
}
