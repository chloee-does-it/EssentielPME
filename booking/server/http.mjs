import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {random,hash,equal,PublicError,vault as makeVault} from './security.mjs';
import {publicRecord} from './service.mjs';
import {SCOPES} from './google.mjs';

const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=(title,body)=>`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} — Essentiel PME</title><style>body{font:18px system-ui;max-width:640px;margin:8vh auto;padding:24px;color:#302443}input,button{font:inherit;padding:12px;margin:8px 0}button{background:#4b2e83;color:white;border:0;border-radius:6px}label{display:block}</style><h1>${title}</h1>${body}</html>`;
export function makeServer({config,store,calendar,service,staticRoot=fileURLToPath(new URL(config.production?'../../_booking/':'../../_staging/',import.meta.url))}) {
  const vault=makeVault(config.encryptionKey),rates=new Map();
  function cookie(name,value,age=43200) {return `${name}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${age}${config.secure?'; Secure':''}`;}
  function readCookie(req,name) {try {return vault.open((req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||'');}catch{return null;}}
  async function body(req) {
    let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>12000)throw new PublicError('request_too_large',413);}return value;
  }
  const server=createServer(async(req,res)=>{
    const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':config.production?"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self'; frame-src 'none'; frame-ancestors 'self' https://www.essentielpme.com https://essentielpme.com; object-src 'none'; base-uri 'self'; form-action 'self'":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"};
    if(!config.production){headers['X-Robots-Tag']='noindex, nofollow, noarchive';headers['X-Frame-Options']='DENY';}
    if(config.secure)headers['Strict-Transport-Security']='max-age=31536000';
    const send=(status,data,type='application/json; charset=utf-8',extra={})=>{res.writeHead(status,{...headers,'Content-Type':type,...extra});res.end(type.startsWith('application/json')?JSON.stringify(data):data);};
    const redirect=(url,cookies)=>send(303,'','text/plain',{Location:url,...(cookies?{'Set-Cookie':cookies}:{})});
    try {
      const url=new URL(req.url,config.origin),path=url.pathname;
      // Native form POSTs need a non-null Origin. Other pages, especially the
      // OAuth callback and private management pages, disclose no referrer.
      if(path==='/login'||path==='/setup')headers['Referrer-Policy']='same-origin';
      if(path.startsWith('/api/')||path==='/login'||path==='/setup')headers['X-Robots-Tag']='noindex, nofollow, noarchive';
      if(path==='/setup'||path==='/api/booking/google/start')headers['Content-Security-Policy']=headers['Content-Security-Policy'].replace("form-action 'self'","form-action 'self' https://accounts.google.com");
      if(path==='/healthz'&&req.method==='GET')return send(200,{ok:true,environment:config.environment});
      // DigitalOcean appends the trusted client hop to X-Forwarded-For.
      const forwarded=String(req.headers['x-forwarded-for']||'').split(',').map(x=>x.trim()).filter(Boolean);
      const address=config.production&&forwarded.length?forwarded.at(-1):(req.socket.remoteAddress||'unknown');
      const group=path==='/login'?'login':path==='/api/booking/reservations'&&req.method==='POST'?'create':'all';
      const windowMs=group==='create'?3600000:60000,limit=group==='login'?20:group==='create'?5:600;
      const bucketKey=address+':'+group,now=Date.now();if(rates.size>5000)rates.clear();
      const bucket=rates.get(bucketKey)||{at:now,count:0};
      if(now-bucket.at>windowMs){bucket.at=now;bucket.count=0;}bucket.count++;rates.set(bucketKey,bucket);
      if(bucket.count>limit)return send(429,{error:'rate_limited'},undefined,{'Retry-After':String(Math.ceil(windowMs/1000))});
      if(req.method==='POST'&&req.headers.origin!==config.origin)throw new PublicError('origin_rejected',403);
      if(path==='/login') {
        if(req.method==='GET')return send(200,page(config.production?'Administration des réservations':'Accès au staging',`<p>${config.production?'Accès réservé à la connexion du calendrier.':'Environnement privé de test. Les réservations connectées envoient de vraies invitations aux seules adresses autorisées.'}</p><form method="post"><label>Code d’accès <input name="password" type="password" required autocomplete="current-password"></label><button>Ouvrir</button></form>`),'text/html; charset=utf-8');
        if(req.method!=='POST')throw new PublicError('method_not_allowed',405);
        const fields=new URLSearchParams(await body(req));
        if(!equal(fields.get('password'),config.password))throw new PublicError('access_denied',401);
        return redirect('/rendez-vous/',cookie('epme_stage',vault.seal({csrf:random(),exp:Date.now()+12*3600000})));
      }
      const admin=readCookie(req,'epme_stage');
      const adminPath=path==='/setup'||path==='/api/booking/google/start'||path==='/api/booking/google/callback';
      if((!config.production||adminPath)&&(!admin?.csrf||admin.exp<Date.now())) {
        if(path.startsWith('/api/'))throw new PublicError('login_required',401);
        return redirect('/login');
      }
      let session=admin;
      if(config.production&&!adminPath){
        session=readCookie(req,'epme_booking');
        if(!session?.csrf||session.exp<Date.now()){
          session={csrf:random(),exp:Date.now()+2*3600000};
          res.setHeader('Set-Cookie',cookie('epme_booking',vault.seal(session),7200));
        }
      }
      if(path==='/setup'&&req.method==='GET') {
        const host=await store.get('host');
        const jobs=config.brevoApiKey?await store.brevoJobs():[];
        const blocked=jobs.filter(j=>['blocked','event_sending'].includes(j.status)).length;
        const brevoStatus=config.brevoApiKey?`Clé configurée. ${jobs.length} synchronisation(s) non terminée(s), dont ${blocked} à vérifier.${config.production?' Les réservations sont synchronisées sans inscription à une liste marketing.':' Les champs et événements sont réservés au staging.'}`:'Désactivé pour cet environnement.';
        return send(200,page('Connexions des réservations',`<p>Calendrier prévu : <strong>${htmlEscape(config.host)}</strong>.</p><p>${host?.email===config.host?'Calendrier connecté.':'Calendrier non connecté.'}</p><form method="post" action="/api/booking/google/start"><input type="hidden" name="csrf" value="${admin.csrf}"><button>Autoriser Google Calendar</button></form><h2>Brevo</h2><p>${brevoStatus}</p><p>Aucune inscription à une liste marketing et aucun changement du consentement.</p><p><a href="/rendez-vous/">Ouvrir la réservation</a></p>`),'text/html; charset=utf-8');
      }
      if(path==='/api/booking/google/start'&&req.method==='POST') {
        const fields=new URLSearchParams(await body(req));
        if(!equal(fields.get('csrf'),session.csrf))throw new PublicError('csrf_rejected',403);
        const state=random(),verifier=random();
        await store.put('oauth-'+hash(state),{used:false,expires:Date.now()+600000});
        const auth=calendar.oauth().generateAuthUrl({access_type:'offline',prompt:'consent',scope:SCOPES,state,login_hint:config.host,code_challenge:Buffer.from(hash(verifier),'hex').toString('base64url'),code_challenge_method:'S256'});
        return redirect(auth,cookie('epme_oauth',vault.seal({state,verifier,exp:Date.now()+600000}),600));
      }
      if(path==='/api/booking/google/callback'&&req.method==='GET') {
        const state=readCookie(req,'epme_oauth');
        if(!state||state.exp<Date.now()||!equal(url.searchParams.get('state'),state.state))throw new PublicError('oauth_state_rejected',403);
        if(!url.searchParams.get('code'))throw new PublicError('google_consent_declined');
        await store.atomic(async tx=>{const id='oauth-'+hash(state.state),record=await tx.get(id);if(!record||record.used||record.expires<Date.now())throw new PublicError('oauth_state_rejected',403);tx.put(id,{...record,used:true});});
        await calendar.connect(url.searchParams.get('code'),state.verifier);
        return redirect('/setup',cookie('epme_oauth','',0));
      }
      if(path==='/api/booking/status'&&req.method==='GET') {
        const host=await store.get('host'),lock=await store.get('lock');
        return send(200,{mode:'connected',connected:host?.email===config.host,testsEnabled:config.allowedEmails.length>0,blocked:!!lock?.operation,csrf:session.csrf});
      }
      if(path==='/api/booking/slots'&&req.method==='GET') {
        let exclude;
        if(url.searchParams.has('ref'))exclude=(await service.get(url.searchParams.get('ref'),req.headers['x-booking-token'])).id;
        return send(200,{slots:await service.availability(exclude)});
      }
      const match=path.match(/^\/api\/booking\/reservations\/([a-f0-9]{48})(?:\/(reschedule|cancel))?$/);
      if(match&&req.method==='GET'&&!match[2]) {
        const record=await service.get(match[1],req.headers['x-booking-token']);
        if(record.status==='confirmed'&&!record.meet){
          const event=await calendar.event(record.id);
          if(event?.extendedProperties?.private?.epmeBooking===record.id)record.meet=event.hangoutLink||null;
        }
        return send(200,{record:publicRecord(record)});
      }
      if(req.method==='POST'&&(path==='/api/booking/reservations'||match?.[2])) {
        if(!equal(req.headers['x-csrf-token'],session.csrf))throw new PublicError('csrf_rejected',403);
        if(!req.headers['content-type']?.startsWith('application/json'))throw new PublicError('invalid_content_type',415);
        let input;try{input=JSON.parse(await body(req));}catch(error){if(error instanceof PublicError)throw error;throw new PublicError('invalid_json');}
        if(!input||Array.isArray(input)||typeof input!=='object')throw new PublicError('invalid_request');
        const result=await service.perform(match?.[2]||'create',{...input,...(match?{id:match[1]}:{}),token:req.headers['x-booking-token']},req.headers['idempotency-key']);
        return send(result.pending?202:200,result.pending?result:{record:publicRecord(result.record)});
      }
      if(path.startsWith('/api/'))throw new PublicError('not_found',404);
      if(!['GET','HEAD'].includes(req.method))throw new PublicError('method_not_allowed',405);
      let decoded;try{decoded=decodeURIComponent(path);}catch{throw new PublicError('not_found',404);}
      if(decoded.split('/').some(x=>x.startsWith('.'))||decoded.includes('\\')||decoded.includes('\0'))throw new PublicError('not_found',404);
      const base=resolve(staticRoot);let target=resolve(base,'.'+decoded);
      if(!target.startsWith(base+sep)&&target!==base)throw new PublicError('not_found',404);
      try{if((await stat(target)).isDirectory())target=resolve(target,'index.html');target=await realpath(target);}catch{throw new PublicError('not_found',404);}
      if(!target.startsWith(base+sep))throw new PublicError('not_found',404);
      const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json','.txt':'text/plain','.woff2':'font/woff2','.pdf':'application/pdf'};
      const data=await readFile(target);res.writeHead(200,{...headers,'Content-Type':types[extname(target)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
    }catch(error){
      // Never log request URLs, bodies, credentials, tokens or Google responses.
      const status=error instanceof PublicError?error.status:503;
      if(status>=500)console.warn('booking_request_failed');
      send(status,{error:error instanceof PublicError?error.code:'temporarily_unavailable'});
    }
  });
  server.requestTimeout=30000;server.headersTimeout=10000;
  return server;
}
