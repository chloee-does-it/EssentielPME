import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {BookingService,cleanGuest,publicRecord} from './service.mjs';
import {vault,hash,config} from './security.mjs';
import {makeServer} from './http.mjs';
import {BrevoSync} from './brevo.mjs';

class MemoryStore {
  records=new Map();queue=Promise.resolve();
  async get(id){return structuredClone(this.records.get(id)||null);}
  async put(id,data){this.records.set(id,structuredClone(data));}
  async brevoJobs(){return [...this.records].filter(([,j])=>j.kind==='brevo'&&j.status!=='done').map(([id,j])=>({id,...structuredClone(j)}));}
  async atomic(fn){
    const task=this.queue.then(async()=>{
      const writes=[];const result=await fn({get:id=>this.get(id),put:(id,value)=>writes.push([id,value])});
      for(const [id,value]of writes)await this.put(id,value);return result;
    });this.queue=task.catch(()=>{});return task;
  }
}
function fixture(){
  const store=new MemoryStore(),events=new Map();
  const calendar={
    creates:0,
    async busy(start,end,exclude){return [...events.values()].filter(e=>e.id!==exclude&&e.status!=='cancelled').map(e=>({start:e.start.dateTime,end:e.end.dateTime}));},
    async event(id){return events.get(id)||null;},
    async create(record,op){this.creates++;const e={id:record.id,status:'confirmed',start:{dateTime:record.start},end:{dateTime:record.end},etag:'v1',hangoutLink:'https://meet.google.com/test-link',extendedProperties:{private:{epmeBooking:record.id,epmeOperation:op}}};events.set(e.id,e);return e;},
    async move(record,op){const e=events.get(record.id);e.start.dateTime=record.start;e.end.dateTime=record.end;e.extendedProperties.private.epmeOperation=op;return e;},
    async cancel(id){events.get(id).status='cancelled';}
  };
  const service=new BookingService({store,calendar,allowedEmails:['test@example.invalid'],now:()=>Date.parse('2026-09-17T10:00:00Z')});
  const input={guest:{first:'Test',last:'Person',company:'Sandbox',email:'test@example.invalid'},start:'2026-09-18T13:00:00.000Z',token:'test-token-long-enough-123456789',zone:'America/Toronto'};
  return {store,calendar,service,input};
}
test('encryption authenticates data, wrong keys and tampering fail',()=>{
  const v=vault(randomBytes(32).toString('base64')),encoded=v.seal({refresh:'private'});
  assert.deepEqual(v.open(encoded),{refresh:'private'});assert.ok(!encoded.includes('private'));
  assert.throws(()=>vault(randomBytes(32).toString('base64')).open(encoded));
  assert.throws(()=>v.open('x'+encoded.slice(1)));
});
test('guest input types and unsupported test recipients fail closed',async()=>{
  assert.throws(()=>cleanGuest({first:{},last:'x',company:'x',email:'a@b.co'}));
  const {service,input,calendar}=fixture();
  await assert.rejects(service.perform('create',{...input,guest:{...input.guest,email:'someone@example.com'}},'idempotency-key-123456789'),{code:'test_email_not_allowed'});
  assert.equal(calendar.creates,0);
});
test('production accepts valid visitors only after the anti-bot delay',async()=>{
  const {store,calendar,input}=fixture(),now=Date.parse('2026-09-17T10:00:00Z');
  const service=new BookingService({store,calendar,allowedEmails:[],allowAll:true,environment:'production',now:()=>now});
  await assert.rejects(service.perform('create',{...input,startedAt:now-1000},'production-too-fast-key-1234'),{code:'invalid_request'});
  await assert.rejects(service.perform('create',{...input,startedAt:now-3000,website:'bot'},'production-honeypot-key-1234'),{code:'invalid_request'});
  const result=await service.perform('create',{...input,startedAt:now-3000},'production-valid-key-123456');
  assert.equal(result.record.guest.email,input.guest.email);assert.equal(calendar.creates,1);
});
test('create, idempotent retry, private read, reschedule and cancel',async()=>{
  const {service,input,calendar}=fixture();
  const first=await service.perform('create',input,'create-idempotency-key-1234');
  assert.equal(first.record.status,'confirmed');assert.equal(calendar.creates,1);
  assert.equal((await service.perform('create',input,'create-idempotency-key-1234')).record.id,first.record.id);
  assert.equal(calendar.creates,1);assert.ok(!('tokenHash' in publicRecord(first.record)));
  await assert.rejects(service.get(first.record.id,'wrong'),{code:'not_found'});
  const moved=await service.perform('reschedule',{id:first.record.id,token:input.token,start:'2026-09-18T14:00:00.000Z'},'move-idempotency-key-123456');
  assert.equal(moved.record.start,'2026-09-18T14:00:00.000Z');assert.equal(moved.record.rescheduled,true);
  const cancelled=await service.perform('cancel',{id:first.record.id,token:input.token},'cancel-idempotency-key-1234');
  assert.equal(cancelled.record.status,'cancelled');assert.equal((await calendar.event(first.record.id)).status,'cancelled');
});
test('different payload with same key is rejected',async()=>{
  const {service,input}=fixture();await service.perform('create',input,'create-idempotency-key-1234');
  await assert.rejects(service.perform('create',{...input,start:'2026-09-18T14:00:00.000Z'},'create-idempotency-key-1234'),{code:'idempotency_conflict'});
});
test('Brevo outbox is atomic, ordered, deduplicated and independent of delivery',async()=>{
  const {service,input,store}=fixture();let kicks=0;
  service.brevo={kick(){kicks++;throw Error('Brevo unavailable');}};
  const first=await service.perform('create',input,'create-idempotency-key-1234');
  await service.perform('create',input,'create-idempotency-key-1234');
  assert.equal((await store.brevoJobs()).length,1);assert.equal(first.record.status,'confirmed');assert.equal(kicks,1);
  await service.perform('reschedule',{id:first.record.id,token:input.token,start:'2026-09-18T14:00:00.000Z'},'move-idempotency-key-123456');
  await service.perform('cancel',{id:first.record.id,token:input.token},'cancel-idempotency-key-1234');
  const jobs=await store.brevoJobs();assert.equal(jobs.length,3);
  assert.equal(jobs[1].previous,jobs[0].id);assert.equal(jobs[2].previous,jobs[1].id);
  const delivered=[];
  const sync=new BrevoSync({store,allowedEmails:service.allowedEmails,client:{contact:async()=>{},event:async e=>delivered.push(e.event_name)}});
  await sync.deliver(jobs[2].id);assert.equal(delivered.length,0);
  await sync.drain();assert.deepEqual(delivered,['epme_staging_booking_created','epme_staging_booking_rescheduled','epme_staging_booking_cancelled']);
  await sync.drain();assert.equal(delivered.length,3);
});
test('failed calendar mutations never enqueue a Brevo event',async()=>{
  const {service,input,store}=fixture();service.brevo={kick(){}};
  await assert.rejects(service.perform('create',{...input,start:'2026-09-17T11:00:00.000Z'},'create-idempotency-key-1111'));
  assert.equal((await store.brevoJobs()).length,0);
});
test('concurrent requests on a single calendar cannot double-book',async()=>{
  const {service,input,calendar}=fixture();
  const results=await Promise.allSettled([service.perform('create',input,'create-idempotency-key-1111'),service.perform('create',input,'create-idempotency-key-2222')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(calendar.creates,1);
  await assert.rejects(service.perform('create',input,'create-idempotency-key-3333'),{code:'slot_unavailable'});
});
test('ambiguous Google write retains durable lock across restart',async()=>{
  const {service,input,calendar,store}=fixture();calendar.create=async()=>{throw Error('timeout');};
  const result=await service.perform('create',input,'create-idempotency-key-1111');assert.equal(result.pending,true);
  assert.ok((await store.get('lock')).operation);
  const restarted=new BookingService({store,calendar,allowedEmails:service.allowedEmails,now:service.now});
  assert.equal((await restarted.perform('create',input,'create-idempotency-key-1111')).pending,true);
  await assert.rejects(restarted.perform('create',input,'create-idempotency-key-2222'),{code:'booking_busy'});
});
test('invalid slot releases lock and never calls Google mutation',async()=>{
  const {service,input,calendar,store}=fixture();
  await assert.rejects(service.perform('create',{...input,start:'2026-09-17T11:00:00.000Z'},'create-idempotency-key-1111'),{code:'slot_unavailable'});
  assert.equal(calendar.creates,0);assert.equal((await store.get('lock')).operation,null);
});
test('Firestore failure does not dispatch a Google event',async()=>{
  const {service,input,calendar,store}=fixture();store.atomic=async()=>{throw Error('quota');};
  await assert.rejects(service.perform('create',input,'create-idempotency-key-1111'));assert.equal(calendar.creates,0);
});
test('configuration refuses missing protection and wrong projects',()=>{
  assert.throws(()=>config({}));
  const env={BOOKING_ORIGIN:'https://test.invalid',STAGING_PASSWORD:'x'.repeat(30),TOKEN_ENCRYPTION_KEY:'x',GOOGLE_CLIENT_ID:'x',GOOGLE_CLIENT_SECRET:'x',GOOGLE_SERVICE_ACCOUNT_JSON:'{"project_id":"production"}'};
  assert.throws(()=>config(env),/Wrong Google project/);
});
test('HTTP requires access, same origin, CSRF, tokens and blocks secret paths',async t=>{
  const f=fixture(),settings={encryptionKey:randomBytes(32).toString('base64'),password:'test-password-long-enough-12345',origin:'http://127.0.0.1',secure:false,host:'info@superquanti.com',allowedEmails:[]};
  const server=makeServer({config:settings,...f});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));settings.origin='http://127.0.0.1:'+server.address().port;
  const request=(path,options={})=>fetch(settings.origin+path,{redirect:'manual',...options});
  assert.equal((await request('/healthz')).status,200);
  assert.equal((await request('/rendez-vous/')).status,303);
  assert.equal((await request('/api/booking/status')).status,401);
  assert.equal((await request('/login',{method:'POST',body:'password='+settings.password})).status,403);
  const login=await request('/login',{method:'POST',headers:{Origin:settings.origin},body:'password='+settings.password});
  assert.equal(login.status,303);const cookie=login.headers.get('set-cookie').split(';')[0];
  const status=await (await request('/api/booking/status',{headers:{Cookie:cookie}})).json();assert.equal(status.connected,false);assert.ok(status.csrf);
  assert.equal((await request('/.secrets/google-service-account.json',{headers:{Cookie:cookie}})).status,404);
  const post={method:'POST',headers:{Cookie:cookie,Origin:settings.origin,'Content-Type':'application/json'},body:'{}'};
  assert.equal((await request('/api/booking/reservations',post)).status,403);
  assert.equal((await request('/api/booking/reservations',{...post,headers:{...post.headers,'X-CSRF-Token':status.csrf}})).status,400);
  const page=await request('/login');assert.equal(page.headers.get('referrer-policy'),'same-origin');assert.match(page.headers.get('x-robots-tag'),/noindex/);
  assert.equal((await request('/api/booking/status',{headers:{Cookie:cookie}})).headers.get('referrer-policy'),'no-referrer');
});
test('production booking pages and session are public while setup stays private',async t=>{
  const f=fixture(),settings={encryptionKey:randomBytes(32).toString('base64'),password:'test-password-long-enough-12345',origin:'http://127.0.0.1',secure:false,host:'info@superquanti.com',allowedEmails:[],production:true,environment:'production'};
  const server=makeServer({config:settings,...f});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));settings.origin='http://127.0.0.1:'+server.address().port;
  const request=(path,options={})=>fetch(settings.origin+path,{redirect:'manual',...options});
  const page=await request('/rendez-vous/');assert.equal(page.status,200);assert.equal(page.headers.get('x-robots-tag'),null);
  const status=await request('/api/booking/status');assert.equal(status.status,200);assert.match(status.headers.get('set-cookie'),/^epme_booking=/);
  assert.equal((await request('/setup')).status,303);
});
