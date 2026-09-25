import {slots,dateKey,validGuest,RULES} from './schedule.mjs';
import {bookingTrackingEvent,nativeBookingTrackingAllowed,nativeBookingAdvertisingAllowed,bookingMetaUserData} from './tracking.mjs';

const root=document.querySelector('[data-booking-app]');
const en=document.documentElement.lang.startsWith('en');
const locale=en?'en-CA':'fr-CA';
const t=en?{
  title:'Discovery call',intro:'Let’s talk about your business.',desc:'A conversation to understand your goals and identify your next steps. No pressure, no commitment.',
  demo:'Demo mode',demoText:'Simulated availability. No invitation or email will be sent.',duration:'30 minutes',video:'Google Meet',free:'Free · no commitment',
  steps:['Date & time','Your details','Confirmation'],choose:'Choose a date',zone:'Times shown in',times:'Available times',noSlots:'No available times in this period.',prev:'Previous month',next:'Next month',
  back:'← Choose another time',details:'A little about you',first:'First name',last:'Last name',email:'Email',company:'Company',phone:'Phone (optional)',message:'What would you like to discuss? (optional)',
  submit:'Confirm my test appointment',submitting:'Confirming…',privacy:'Required fields are marked *. This demo stores the appointment in this browser tab only. Use fictional details.',
  success:'Your test appointment is confirmed.',successNote:'You arrived here automatically. In the connected version, your invitation and unique Google Meet link will be sent by email.',
  when:'When',where:'Location',who:'Participant',ref:'Test reference',zoneLabel:'Time zone',videoPending:'Google Meet — available after Google is connected',
  move:'Reschedule',cancel:'Cancel appointment',cancelPrompt:'Cancel this test appointment?',cancelYes:'Yes, cancel',keep:'Keep appointment',cancelled:'Test appointment cancelled',cancelNote:'This time is available again in the demo.',new:'Book another test appointment',
  moved:'Your test appointment has been rescheduled.',moving:'Choose a new time. Your current appointment remains booked until you confirm the change.',
  unavailable:'This time is no longer available. Please choose another.',invalid:'Please check your name, company and email.',storage:'Your browser is blocking session storage. Enable it to test a reservation.',
  expired:'No test appointment was found in this tab.',expiredNote:'The demo does not share appointments between tabs or devices.',dateLabel:'Appointment time',today:'Today',
}: {
  title:'Appel découverte',intro:'Parlons de votre entreprise.',desc:'Un échange pour comprendre vos objectifs et identifier les prochaines étapes. Sans pression, sans engagement.',
  demo:'Mode démonstration',demoText:'Disponibilités simulées. Aucune invitation ni aucun courriel ne sera envoyé.',duration:'30 minutes',video:'Google Meet',free:'Gratuit · sans engagement',
  steps:['Date et heure','Vos coordonnées','Confirmation'],choose:'Choisissez une date',zone:'Heures affichées dans le fuseau',times:'Créneaux disponibles',noSlots:'Aucun créneau disponible pour cette période.',prev:'Mois précédent',next:'Mois suivant',
  back:'← Choisir un autre créneau',details:'Faisons connaissance',first:'Prénom',last:'Nom',email:'Courriel',company:'Entreprise',phone:'Téléphone (facultatif)',message:'De quoi souhaitez-vous discuter ? (facultatif)',
  submit:'Confirmer mon rendez-vous test',submitting:'Confirmation…',privacy:'Les champs marqués * sont obligatoires. Cette démonstration conserve le rendez-vous uniquement dans cet onglet. Utilisez des coordonnées fictives.',
  success:'Votre rendez-vous test est confirmé.',successNote:'Vous êtes arrivé ici automatiquement. Dans la version connectée, votre invitation et votre lien Google Meet unique seront envoyés par courriel.',
  when:'Quand',where:'Lieu',who:'Participant',ref:'Référence du test',zoneLabel:'Fuseau horaire',videoPending:'Google Meet — disponible après la connexion à Google',
  move:'Déplacer',cancel:'Annuler le rendez-vous',cancelPrompt:'Annuler ce rendez-vous test ?',cancelYes:'Oui, annuler',keep:'Conserver le rendez-vous',cancelled:'Rendez-vous test annulé',cancelNote:'Ce créneau est de nouveau disponible dans la démonstration.',new:'Réserver un autre rendez-vous test',
  moved:'Votre rendez-vous test a été déplacé.',moving:'Choisissez un nouveau créneau. Votre rendez-vous actuel reste réservé jusqu’à la confirmation du changement.',
  unavailable:'Ce créneau n’est plus disponible. Veuillez en choisir un autre.',invalid:'Vérifiez votre nom, votre entreprise et votre courriel.',storage:'Votre navigateur bloque le stockage de session. Activez-le pour tester une réservation.',
  expired:'Aucun rendez-vous test trouvé dans cet onglet.',expiredNote:'La démonstration ne partage pas les rendez-vous entre les onglets ou les appareils.',dateLabel:'Heure du rendez-vous',today:'Aujourd’hui',
};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const connected=window.EPME_BOOKING_CONNECTED===true;
const production=connected&&window.EPME_STAGING!==true;
const native=!!root?.hasAttribute('data-native');
const apiOrigin=window.EPME_BOOKING_API_ORIGIN||location.origin;
const trackingEnvironment=window.EPME_STAGING===true?'staging':'production';
const TRACKING_PENDING='epme-booking-tracking-pending-v1';
function eventId(){return crypto.randomUUID();}
function track(kind,id=eventId(),guest=null){
  const event=bookingTrackingEvent(kind,{locale,environment:trackingEnvironment,eventId:id});
  // The native form shares the main site's consent. A visitor may allow
  // analytics, advertising, or both; GTM enforces each tag's own consent.
  let mayTrack=!production||!native;
  let maySendIdentity=false;
  if(production&&native){
    try{
      const consent=localStorage.getItem('epme_consent');
      mayTrack=nativeBookingTrackingAllowed(consent);
      maySendIdentity=nativeBookingAdvertisingAllowed(consent);
    }catch{mayTrack=false;}
  }
  if(mayTrack){
    // Only the native production confirmation can include booking identity.
    // GA4's booking tag maps neutral fields; Meta's Schedule tag reads user_data.
    if(kind==='confirmed'&&production&&native&&maySendIdentity&&guest){
      const userData=bookingMetaUserData(guest);
      if(userData)event.user_data=userData;
    }
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(event);
  }
  // The booking domain has no non-essential tags or consent banner. The site
  // that embeds it decides whether this anonymous event may reach its GTM.
  if(production&&window.parent!==window){
    for(const origin of ['https://www.essentielpme.com','https://essentielpme.com']){
      window.parent.postMessage({source:'epme-booking',...event},origin);
    }
  }
}
function trackOnce(kind){
  const key='epme-booking-track-'+kind;
  try{if(sessionStorage.getItem(key)==='1')return;sessionStorage.setItem(key,'1');}catch{}
  track(kind);
}
function rememberConfirmation(id){
  try{sessionStorage.setItem(TRACKING_PENDING,JSON.stringify({bookingId:id,eventId:eventId()}));}catch{}
}
function trackPendingConfirmation(record){
  let pending=null;
  try{pending=JSON.parse(sessionStorage.getItem(TRACKING_PENDING)||'null');}catch{}
  if(!pending||pending.bookingId!==record.id||record.status!=='confirmed')return;
  track('confirmed',pending.eventId,record.guest);
  try{sessionStorage.removeItem(TRACKING_PENDING);}catch{}
}
if(production)Object.assign(t,en?{
  demo:'Online booking',demoText:'Live availability from the organizer’s calendar.',submit:'Confirm my appointment',
  privacy:'Required fields are marked *. Your details are used to arrange and manage this appointment. If you accepted “Advertising” on this site, the booking confirmation and your first name, last name, email and phone (if provided) are also sent to Meta to measure ads. Booking works without this choice.',
  success:'Your appointment is confirmed.',successNote:'Your calendar invitation and unique Google Meet link are being sent by Google.',
  videoPending:'Google Meet link is being prepared. Reload this page shortly.',cancelNote:'The cancellation has been sent to Google Calendar.',
  cancelPrompt:'Cancel this appointment?',cancelled:'Appointment cancelled',new:'Book another appointment',moved:'Your appointment has been rescheduled.',
  expired:'Appointment not found.',expiredNote:'Use your private management link or contact the organizer.',ref:'Reference'
}:{
  demo:'Réservation en ligne',demoText:'Disponibilités réelles du calendrier de l’organisateur.',submit:'Confirmer mon rendez-vous',
  privacy:'Les champs marqués * sont obligatoires. Vos coordonnées servent à organiser et à gérer ce rendez-vous. Si vous avez accepté « Publicitaires » sur ce site, la confirmation et vos prénom, nom, courriel et téléphone (si fourni) sont aussi transmis à Meta pour mesurer nos publicités. La réservation fonctionne sans cet accord.',
  success:'Votre rendez-vous est confirmé.',successNote:'Votre invitation et votre lien Google Meet unique sont en cours d’envoi par Google.',
  videoPending:'Le lien Google Meet est en préparation. Actualisez cette page dans un instant.',cancelNote:'L’annulation a été transmise à Google Calendar.',
  cancelPrompt:'Annuler ce rendez-vous ?',cancelled:'Rendez-vous annulé',new:'Réserver un autre rendez-vous',moved:'Votre rendez-vous a été déplacé.',
  expired:'Rendez-vous introuvable.',expiredNote:'Utilisez votre lien de gestion privé ou contactez l’organisateur.',ref:'Référence'
});
else if(connected)Object.assign(t,en?{
  demo:'Connected staging',demoText:'Real Google Calendar availability. Invitations are sent only to approved test addresses.',
  privacy:'Required fields are marked *. Private staging: use only the approved test address. Your details are stored securely for this test.',
  success:'Your test appointment is confirmed.',successNote:'The appointment exists in Google Calendar. Google has been asked to send the invitation.',
  videoPending:'Google Meet link is being prepared. Reload this page shortly.',cancelNote:'The cancellation has been sent to Google Calendar.',
  expired:'Appointment not found.',expiredNote:'Use your private management link or contact the organizer.',
}:{
  demo:'Staging connecté',demoText:'Disponibilités réelles de Google Calendar. Invitations limitées aux adresses de test autorisées.',
  privacy:'Les champs marqués * sont obligatoires. Staging privé : utilisez uniquement l’adresse de test autorisée. Vos coordonnées sont conservées de façon sécurisée pour ce test.',
  success:'Votre rendez-vous test est confirmé.',successNote:'Le rendez-vous existe dans Google Calendar. L’envoi de l’invitation a été demandé à Google.',
  videoPending:'Le lien Google Meet est en préparation. Actualisez cette page dans un instant.',cancelNote:'L’annulation a été transmise à Google Calendar.',
  expired:'Rendez-vous introuvable.',expiredNote:'Utilisez votre lien de gestion privé ou contactez l’organisateur.',
});
let remoteSlots=[],remoteRecords=[],csrf='',managementToken='',attempt=null;
const apiMessage=code=>({
  calendar_not_connected:en?'Calendar not connected yet.':'Le calendrier n’est pas encore connecté.',
  test_email_not_allowed:en?'Use the approved test email address.':'Utilisez l’adresse courriel de test autorisée.',
  slot_unavailable:t.unavailable,
  booking_busy:en?'A calendar operation is in progress. Please try again later.':'Une opération est en cours sur le calendrier. Réessayez plus tard.',
  login_required:en?'Your staging access has expired. Sign in again.':'Votre accès au staging a expiré. Reconnectez-vous.',
  pending:en?'Google has not confirmed the result yet. Do not create another booking; contact the organizer to verify.':'Google n’a pas encore confirmé le résultat. Ne créez pas une autre réservation; contactez l’organisateur pour vérifier.',
}[code]||(en?'The request could not be completed. Please try again later.':'La demande n’a pas pu être terminée. Réessayez plus tard.'));
async function api(path,options={}) {
  const response=await fetch(apiOrigin+'/api/booking/'+path,{...options,credentials:'include',headers:{'X-Booking-Token':managementToken,...options.headers}});
  const data=await response.json();
  if(!response.ok)throw new Error(apiMessage(data.error));
  if(data.pending)throw new Error(apiMessage('pending'));
  return data;
}
async function mutate(path,payload) {
  const fingerprint=JSON.stringify({path,payload});
  if(!attempt||attempt.fingerprint!==fingerprint){attempt={fingerprint,key:crypto.randomUUID()};}
  return api(path,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,'Idempotency-Key':attempt.key},body:JSON.stringify(payload)});
}
const KEY='epme-booking-demo-v1';
const bookingPath=native?(en?'/en/contact/':'/contact/'):(en?'/en/book/':'/rendez-vous/');
const confirmationPath=en?'/en/booking-confirmed/':'/merci/rendez-vous/';
let zone='America/Toronto', selectedDay='', selectedSlot=null, draft={}, editing=null, busy=false, currentMonth='',formStartedAt=0;
let storageError=false;
function records(){if(connected)return remoteRecords;try{return JSON.parse(sessionStorage.getItem(KEY)||'[]').filter(b=>b&&b.id&&b.start);}catch{storageError=true;return [];}}
function save(items){sessionStorage.setItem(KEY,JSON.stringify(items));}
function available(){return connected?remoteSlots:slots({busy:records().filter(b=>b.status==='confirmed'&&b.id!==editing).map(b=>({start:b.start,end:b.end}))});}
function groups(){const map=new Map();for(const slot of available()){const k=dateKey(slot.start,zone);if(!map.has(k))map.set(k,[]);map.get(k).push(slot);}return map;}
function format(iso,options={}) {return new Intl.DateTimeFormat(locale,{timeZone:zone,...options}).format(new Date(iso));}
function longDate(iso){return format(iso,{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
function time(iso){return format(iso,{hour:'2-digit',minute:'2-digit'});}
function focusHeading(){root.querySelector('[data-heading]')?.focus({preventScroll:true});}
function shell(step,content){root.innerHTML=`<div class="bk-card"><div class="bk-demo"><strong>${t.demo}</strong> · ${t.demoText}</div><div class="bk-layout"><aside class="bk-summary"><div class="bk-eyebrow">ESSENTIEL PME</div><h2>${t.title}</h2><ul class="bk-facts"><li><span aria-hidden="true">◷</span>${t.duration}</li><li><span aria-hidden="true">▣</span>${t.video}</li><li><span aria-hidden="true">✓</span>${t.free}</li></ul><p>${t.desc}</p></aside><div class="bk-content"><ol class="bk-steps">${t.steps.map((s,i)=>`<li ${i===step?'aria-current="step"':''} class="${i===step?'current':''}"><b>${i+1}</b>${s}</li>`).join('')}</ol>${content}<div class="bk-status" role="status" aria-live="polite"></div></div></div></div>`;}
function error(message){let box=root.querySelector('.bk-error');if(!box){box=document.createElement('p');box.className='bk-error';box.setAttribute('role','alert');root.querySelector('.bk-content').prepend(box);}box.textContent=message;}
async function start(){try{if(connected)remoteSlots=(await api('slots'+(editing?'?ref='+encodeURIComponent(editing):''))).slots;const map=groups();selectedDay=map.has(selectedDay)?selectedDay:([...map.keys()][0]||'');currentMonth=(selectedDay||dateKey(Date.now(),zone)).slice(0,7);calendar();}catch(e){shell(0,'');error(e.message);}}
function calendar(){
  const map=groups();const [year,month]=currentMonth.split('-').map(Number);
  const first=new Date(Date.UTC(year,month-1,1));const count=new Date(Date.UTC(year,month,0)).getUTCDate();
  const monthLabel=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'}).format(first);
  const months=[...new Set([...map.keys()].map(k=>k.slice(0,7)))];
  const zones=[...new Set(['America/Toronto','America/Vancouver','America/Edmonton','America/Winnipeg','America/Halifax','America/St_Johns','Europe/Paris','UTC',Intl.DateTimeFormat().resolvedOptions().timeZone])];
  const weekday=Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,0,5+i))));
  let days='<span></span>'.repeat((first.getUTCDay()+6)%7);
  for(let d=1;d<=count;d++){const key=`${currentMonth}-${String(d).padStart(2,'0')}`;const label=new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(key+'T12:00:00Z'));days+=`<button type="button" class="bk-day ${key===selectedDay?'selected':''}" data-day="${key}" aria-label="${escape(label)}" aria-pressed="${key===selectedDay}" ${map.has(key)?'':'disabled'}>${d}</button>`;}
  const list=map.get(selectedDay)||[];
  shell(0,`${editing?`<p class="bk-selected">${t.moving}</p>`:''}<h3 data-heading tabindex="-1">${t.choose}</h3><label class="bk-zone">${t.zone}<select data-zone>${zones.map(z=>`<option value="${z}" ${z===zone?'selected':''}>${z.replaceAll('_',' ')}</option>`).join('')}</select></label><div class="bk-month"><button type="button" class="bk-nav" data-month="-1" aria-label="${t.prev}" ${months.some(m=>m<currentMonth)?'':'disabled'}>‹</button><strong>${monthLabel}</strong><button type="button" class="bk-nav" data-month="1" aria-label="${t.next}" ${months.some(m=>m>currentMonth)?'':'disabled'}>›</button></div><div class="bk-week" aria-hidden="true">${weekday.map(w=>`<span>${w}</span>`).join('')}</div><div class="bk-days">${days}</div><section class="bk-times"><h3>${list.length?longDate(list[0].start):t.times}</h3><div class="bk-slots">${list.map(s=>`<button class="bk-slot" type="button" data-slot="${s.start}" aria-label="${escape(longDate(s.start)+' '+time(s.start))}">${time(s.start)}</button>`).join('')}</div>${list.length?'':`<p class="bk-small">${t.noSlots}</p>`}</section>`);
  root.querySelector('[data-zone]').addEventListener('change',e=>{zone=e.target.value;selectedDay='';start();});
  root.querySelectorAll('[data-day]').forEach(el=>el.onclick=()=>{selectedDay=el.dataset.day;calendar();root.querySelector('.bk-times h3').setAttribute('tabindex','-1');root.querySelector('.bk-times h3').focus({preventScroll:true});});
  root.querySelectorAll('[data-month]').forEach(el=>el.onclick=()=>{currentMonth=new Date(Date.UTC(year,month-1+Number(el.dataset.month),1)).toISOString().slice(0,7);const next=[...map.keys()].find(k=>k.startsWith(currentMonth));selectedDay=next||'';calendar();});
  root.querySelectorAll('[data-slot]').forEach(el=>el.onclick=()=>{selectedSlot=available().find(s=>s.start===el.dataset.slot);if(!selectedSlot){start();error(t.unavailable);return;}details();focusHeading();});
}
function details(){
  formStartedAt=Date.now();
  trackOnce('start');
  const field=(key,type='text',wide=false)=>`<label class="bk-field ${wide?'wide':''}">${t[key]}${['first','last','company','email'].includes(key)?' *':''}<input name="${key}" type="${type}" ${['first','last','company','email'].includes(key)?'required':''} maxlength="${key==='email'?254:key==='phone'?40:120}" autocomplete="${({first:'given-name',last:'family-name',email:'email',company:'organization',phone:'tel'})[key]}" value="${escape(draft[key]||'')}"></label>`;
  shell(1,`<button class="bk-back" type="button" data-back>${t.back}</button><h3 data-heading tabindex="-1">${t.details}</h3><div class="bk-selected">${longDate(selectedSlot.start)}<br>${time(selectedSlot.start)} – ${time(selectedSlot.end)} <span class="bk-small">(${zone.replaceAll('_',' ')})</span></div><form data-demo-booking><div class="bk-fields">${field('first')}${field('last')}${field('email','email',true)}${field('company','text',true)}${field('phone','tel',true)}<label class="bk-field wide">${t.message}<textarea name="message" maxlength="2000">${escape(draft.message||'')}</textarea></label></div><div aria-hidden="true" style="position:absolute;left:-10000px"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><p class="bk-small">${t.privacy}</p><button type="submit" class="bk-primary">${t.submit}</button></form>`);
  const form=root.querySelector('form');
  const read=()=>Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,String(v).trim()]));
  root.querySelector('[data-back]').onclick=()=>{draft=read();calendar();focusHeading();};
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(busy)return;draft=read();if(!validGuest(draft)){error(t.invalid);return;}
    if(!available().some(s=>s.start===selectedSlot.start)){start();error(t.unavailable);return;}
    busy=true;const btn=form.querySelector('[type=submit]');btn.disabled=true;btn.textContent=t.submitting;
    try{
      if(connected){
        if(!managementToken)managementToken=crypto.randomUUID()+crypto.randomUUID();
        const action=editing?'rescheduled':'confirmed';
        const payload={start:selectedSlot.start,guest:draft,zone,locale,...(!editing?{startedAt:formStartedAt,website:draft.website||''}:{})};
        const data=await mutate(editing?'reservations/'+editing+'/reschedule':'reservations',payload);
        // A move keeps the same management URL (including its fragment), so
        // assigning that URL does not reload the page. Render the saved result.
        if(root.dataset.view==='confirmation'){
          editing=null;attempt=null;busy=false;
          await result(data.record.id);track(action);focusHeading();return;
        }
        rememberConfirmation(data.record.id);
        window.location.assign(confirmationPath+'#ref='+data.record.id+'&token='+encodeURIComponent(managementToken));return;
      }
      const all=records();if(storageError)throw Error('storage');
      const old=editing?all.find(b=>b.id===editing):null;
      if(editing&&(!old||old.status!=='confirmed')){busy=false;start();error(t.unavailable);return;}
      const record={id:old?.id||crypto.randomUUID(),...selectedSlot,guest:draft,zone,locale,status:'confirmed',mode:'demo',updatedAt:new Date().toISOString(),rescheduled:!!old};
      save([...all.filter(b=>b.id!==record.id),record]);
      window.location.assign(confirmationPath+'?ref='+encodeURIComponent(record.id));
    }catch(e){error(connected?e.message:t.storage);busy=false;btn.disabled=false;btn.textContent=t.submit;}
  });
}
async function result(id){
  if(connected){try{remoteRecords=[(await api('reservations/'+encodeURIComponent(id))).record];}catch(e){shell(2,'');error(e.message);return;}}
  const record=records().find(b=>b.id===id);if(!record){shell(2,`<div class="bk-result"><h3>${t.expired}</h3><p>${t.expiredNote}</p><a href="${bookingPath}">${t.new}</a></div>`);return;}
  zone=record.zone;
  if(record.status==='cancelled'){shell(2,`<div class="bk-result"><div class="bk-tick">✓</div><h3>${t.cancelled}</h3><p>${t.cancelNote}</p><a href="${bookingPath}">${t.new}</a></div>`);return;}
  shell(2,`<div class="bk-result"><div class="bk-tick" aria-hidden="true">✓</div><h3 data-heading tabindex="-1">${record.rescheduled?t.moved:t.success}</h3><p class="bk-small">${t.successNote}</p><div class="bk-details"><p><strong>${t.when}</strong><br>${longDate(record.start)}<br>${time(record.start)} – ${time(record.end)}</p><p><strong>${t.zoneLabel}</strong><br>${escape(zone)}</p><p><strong>${t.who}</strong><br>${escape(record.guest.first+' '+record.guest.last)}<br>${escape(record.guest.email)}</p><p><strong>${t.where}</strong><br>${t.videoPending}</p><p class="bk-small">${t.ref} : ${escape(record.id.slice(0,8).toUpperCase())}</p></div><div class="bk-actions"><button type="button" class="bk-secondary" data-move>${t.move}</button><button type="button" class="bk-secondary bk-danger" data-cancel>${t.cancel}</button></div><div data-cancel-confirm hidden><p>${t.cancelPrompt}</p><div class="bk-actions"><button type="button" class="bk-secondary" data-keep>${t.keep}</button><button type="button" class="bk-secondary bk-danger" data-cancel-yes>${t.cancelYes}</button></div></div></div>`);
  if(connected&&record.meet&&/^https:\/\/meet\.google\.com\//.test(record.meet)){
    const locationRow=root.querySelectorAll('.bk-details p')[3];
    locationRow.innerHTML=`<strong>${t.where}</strong><br><a href="${escape(record.meet)}" target="_blank" rel="noopener noreferrer">Google Meet</a>`;
  }
  trackPendingConfirmation(record);
  root.querySelector('[data-move]').onclick=async()=>{editing=record.id;draft=record.guest;attempt=null;await start();focusHeading();};
  root.querySelector('[data-cancel]').onclick=()=>{root.querySelector('[data-cancel-confirm]').hidden=false;root.querySelector('[data-keep]').focus();};
  root.querySelector('[data-keep]').onclick=()=>{root.querySelector('[data-cancel-confirm]').hidden=true;root.querySelector('[data-cancel]').focus();};
  root.querySelector('[data-cancel-yes]').onclick=async()=>{if(busy)return;busy=true;try{if(connected)await mutate('reservations/'+id+'/cancel',{});else save(records().map(b=>b.id===id?{...b,status:'cancelled'}:b));await result(id);track('cancelled');}catch(e){error(connected?e.message:t.storage);}finally{busy=false;}};
}
async function initBookingApp(){
  trackOnce('view');
  let fragment=window.EPME_BOOKING_FRAGMENT||location.hash.slice(1);
  if(connected&&root.dataset.view==='confirmation'&&!fragment){try{fragment=sessionStorage.getItem('epme-booking-link-v1')||'';}catch{}}
  const params=new URLSearchParams(connected?fragment:location.search),id=params.get('ref');
  managementToken=params.get('token')||'';
  if(connected){
    try{
      const status=await api('status');csrf=status.csrf;
      if(!status.connected){shell(0,`<h3>${apiMessage('calendar_not_connected')}</h3><p><a href="/setup">${en?'Connect the organizer’s calendar':'Connecter le calendrier de l’organisateur'}</a></p>`);}
      else if(root.dataset.view==='confirmation')await result(id);else await start();
    }catch(e){shell(0,'');error(e.message);}
  }else if(root.dataset.view==='confirmation')result(id);else start();
}
if(root){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initBookingApp,{once:true});
  else void initBookingApp();
}
