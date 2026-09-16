import {slots,dateKey,validGuest,RULES} from './schedule.mjs';

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
const KEY='epme-booking-demo-v1';
const bookingPath=en?'/en/book/':'/rendez-vous/';
const confirmationPath=en?'/en/booking-confirmed/':'/merci/rendez-vous/';
let zone='America/Toronto', selectedDay='', selectedSlot=null, draft={}, editing=null, busy=false, currentMonth='';
let storageError=false;
function records(){try{return JSON.parse(sessionStorage.getItem(KEY)||'[]').filter(b=>b&&b.id&&b.start);}catch{storageError=true;return [];}}
function save(items){sessionStorage.setItem(KEY,JSON.stringify(items));}
function available(){return slots({busy:records().filter(b=>b.status==='confirmed'&&b.id!==editing).map(b=>({start:b.start,end:b.end}))});}
function groups(){const map=new Map();for(const slot of available()){const k=dateKey(slot.start,zone);if(!map.has(k))map.set(k,[]);map.get(k).push(slot);}return map;}
function format(iso,options={}) {return new Intl.DateTimeFormat(locale,{timeZone:zone,...options}).format(new Date(iso));}
function longDate(iso){return format(iso,{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
function time(iso){return format(iso,{hour:'2-digit',minute:'2-digit'});}
function focusHeading(){root.querySelector('[data-heading]')?.focus({preventScroll:true});}
function shell(step,content){root.innerHTML=`<div class="bk-card"><div class="bk-demo"><strong>${t.demo}</strong> · ${t.demoText}</div><div class="bk-layout"><aside class="bk-summary"><div class="bk-eyebrow">ESSENTIEL PME</div><h2>${t.title}</h2><ul class="bk-facts"><li><span aria-hidden="true">◷</span>${t.duration}</li><li><span aria-hidden="true">▣</span>${t.video}</li><li><span aria-hidden="true">✓</span>${t.free}</li></ul><p>${t.desc}</p></aside><div class="bk-content"><ol class="bk-steps">${t.steps.map((s,i)=>`<li ${i===step?'aria-current="step"':''} class="${i===step?'current':''}"><b>${i+1}</b>${s}</li>`).join('')}</ol>${content}<div class="bk-status" role="status" aria-live="polite"></div></div></div></div>`;}
function error(message){let box=root.querySelector('.bk-error');if(!box){box=document.createElement('p');box.className='bk-error';box.setAttribute('role','alert');root.querySelector('.bk-content').prepend(box);}box.textContent=message;}
function start(){const map=groups();selectedDay=map.has(selectedDay)?selectedDay:([...map.keys()][0]||'');currentMonth=(selectedDay||dateKey(Date.now(),zone)).slice(0,7);calendar();}
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
  const field=(key,type='text',wide=false)=>`<label class="bk-field ${wide?'wide':''}">${t[key]}${['first','last','company','email'].includes(key)?' *':''}<input name="${key}" type="${type}" ${['first','last','company','email'].includes(key)?'required':''} maxlength="${key==='email'?254:key==='phone'?40:120}" autocomplete="${({first:'given-name',last:'family-name',email:'email',company:'organization',phone:'tel'})[key]}" value="${escape(draft[key]||'')}"></label>`;
  shell(1,`<button class="bk-back" type="button" data-back>${t.back}</button><h3 data-heading tabindex="-1">${t.details}</h3><div class="bk-selected">${longDate(selectedSlot.start)}<br>${time(selectedSlot.start)} – ${time(selectedSlot.end)} <span class="bk-small">(${zone.replaceAll('_',' ')})</span></div><form data-demo-booking><div class="bk-fields">${field('first')}${field('last')}${field('email','email',true)}${field('company','text',true)}${field('phone','tel',true)}<label class="bk-field wide">${t.message}<textarea name="message" maxlength="2000">${escape(draft.message||'')}</textarea></label></div><p class="bk-small">${t.privacy}</p><button type="submit" class="bk-primary">${t.submit}</button></form>`);
  const form=root.querySelector('form');
  const read=()=>Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,String(v).trim()]));
  root.querySelector('[data-back]').onclick=()=>{draft=read();calendar();focusHeading();};
  form.addEventListener('submit',e=>{
    e.preventDefault();if(busy)return;draft=read();if(!validGuest(draft)){error(t.invalid);return;}
    if(!available().some(s=>s.start===selectedSlot.start)){start();error(t.unavailable);return;}
    busy=true;const btn=form.querySelector('[type=submit]');btn.disabled=true;btn.textContent=t.submitting;
    try{
      const all=records();if(storageError)throw Error('storage');
      const old=editing?all.find(b=>b.id===editing):null;
      if(editing&&(!old||old.status!=='confirmed')){busy=false;start();error(t.unavailable);return;}
      const record={id:old?.id||crypto.randomUUID(),...selectedSlot,guest:draft,zone,locale,status:'confirmed',mode:'demo',updatedAt:new Date().toISOString(),rescheduled:!!old};
      save([...all.filter(b=>b.id!==record.id),record]);
      window.location.assign(confirmationPath+'?ref='+encodeURIComponent(record.id));
    }catch{error(t.storage);busy=false;btn.disabled=false;btn.textContent=t.submit;}
  });
}
function result(id){
  const record=records().find(b=>b.id===id);if(!record){shell(2,`<div class="bk-result"><h3>${t.expired}</h3><p>${t.expiredNote}</p><a href="${bookingPath}">${t.new}</a></div>`);return;}
  zone=record.zone;
  if(record.status==='cancelled'){shell(2,`<div class="bk-result"><div class="bk-tick">✓</div><h3>${t.cancelled}</h3><p>${t.cancelNote}</p><a href="${bookingPath}">${t.new}</a></div>`);return;}
  shell(2,`<div class="bk-result"><div class="bk-tick" aria-hidden="true">✓</div><h3 data-heading tabindex="-1">${record.rescheduled?t.moved:t.success}</h3><p class="bk-small">${t.successNote}</p><div class="bk-details"><p><strong>${t.when}</strong><br>${longDate(record.start)}<br>${time(record.start)} – ${time(record.end)}</p><p><strong>${t.zoneLabel}</strong><br>${escape(zone)}</p><p><strong>${t.who}</strong><br>${escape(record.guest.first+' '+record.guest.last)}<br>${escape(record.guest.email)}</p><p><strong>${t.where}</strong><br>${t.videoPending}</p><p class="bk-small">${t.ref} : ${escape(record.id.slice(0,8).toUpperCase())}</p></div><div class="bk-actions"><button type="button" class="bk-secondary" data-move>${t.move}</button><button type="button" class="bk-secondary bk-danger" data-cancel>${t.cancel}</button></div><div data-cancel-confirm hidden><p>${t.cancelPrompt}</p><div class="bk-actions"><button type="button" class="bk-secondary" data-keep>${t.keep}</button><button type="button" class="bk-secondary bk-danger" data-cancel-yes>${t.cancelYes}</button></div></div></div>`);
  root.querySelector('[data-move]').onclick=()=>{editing=record.id;draft=record.guest;start();focusHeading();};
  root.querySelector('[data-cancel]').onclick=()=>{root.querySelector('[data-cancel-confirm]').hidden=false;root.querySelector('[data-keep]').focus();};
  root.querySelector('[data-keep]').onclick=()=>{root.querySelector('[data-cancel-confirm]').hidden=true;root.querySelector('[data-cancel]').focus();};
  root.querySelector('[data-cancel-yes]').onclick=()=>{try{save(records().map(b=>b.id===id?{...b,status:'cancelled'}:b));result(id);}catch{error(t.storage);}};
}
if(root){
  const id=new URLSearchParams(location.search).get('ref');
  if(root.dataset.view==='confirmation')result(id);else start();
}
