import {test} from 'node:test';
import assert from 'node:assert/strict';
import {brevoJob,BrevoClient,BrevoSync} from './brevo.mjs';
const record={id:'a'.repeat(48),guest:{first:'Test',last:'Person',company:'Sandbox',email:'test@example.invalid',phone:'private',message:'private'},start:'2026-09-18T15:00:00Z',end:'2026-09-18T15:30:00Z',zone:'America/Toronto',locale:'fr-CA',status:'confirmed',updatedAt:'2026-09-17T12:00:00Z',tokenHash:'secret',meet:'private'};
function fixture(){
  let now=100000;
  const records=new Map([['job',brevoJob('create',record,'operation')]]);
  const store={get:async id=>structuredClone(records.get(id)||null),put:async(id,v)=>records.set(id,structuredClone(v)),
    atomic:async fn=>fn({get:async id=>structuredClone(records.get(id)||null),put:(id,v)=>records.set(id,structuredClone(v))}),
    brevoJobs:async()=>[...records].map(([id,j])=>({id,...j}))};
  const calls=[];const client={contact:async()=>calls.push('contact'),event:async()=>calls.push('event')};
  const sync=new BrevoSync({store,client,allowedEmails:[record.guest.email],now:()=>now});
  return {store,client,sync,calls,advance:()=>now+=3600000};
}
test('Brevo payload is staging-only and excludes consent, lists, secrets and free text',()=>{
  const job=brevoJob('create',record,'operation');
  assert.deepEqual(Object.keys(job.contact).sort(),['attributes','email','updateEnabled']);
  assert.ok(Object.keys(job.contact.attributes).every(k=>k.startsWith('EPME_STG_')));
  for(const value of ['private','secret','token','OPT_IN','listIds','emailBlacklisted','SMS'])assert.ok(!JSON.stringify(job).includes(value));
  assert.equal(job.event.identifiers.email_id,record.guest.email);
});
test('production Brevo payload uses standard contact fields and production events',()=>{
  const job=brevoJob('create',record,'operation',null,'production');
  assert.deepEqual(job.contact.attributes,{FIRSTNAME:'Test',LASTNAME:'Person',COMPANY:'Sandbox'});
  assert.equal(job.event.event_name,'epme_booking_created');assert.equal(job.event.event_properties.environment,'production');
  for(const value of ['private','secret','listIds','emailBlacklisted'])assert.ok(!JSON.stringify(job).includes(value));
});
test('Brevo transport confines credentials to official HTTPS API with redirects disabled',async()=>{
  let sent;
  const client=new BrevoClient('private-api-key',async(url,options)=>{sent={url,options};return {ok:true};});
  await client.event({event_name:'test'});
  assert.equal(sent.url,'https://api.brevo.com/v3/events');assert.equal(sent.options.redirect,'error');
  assert.equal(sent.options.headers['api-key'],'private-api-key');assert.ok(!sent.options.body.includes('private-api-key'));
});
test('contact failure is retried without emitting the event prematurely',async()=>{
  const f=fixture();f.client.contact=async()=>{throw Object.assign(Error(),{status:503});};
  await f.sync.deliver('job');assert.equal((await f.store.get('job')).status,'pending');assert.deepEqual(f.calls,[]);
  f.client.contact=async()=>f.calls.push('contact');f.advance();await f.sync.deliver('job');
  assert.equal((await f.store.get('job')).status,'done');assert.deepEqual(f.calls,['contact','event']);
});
test('uncertain event delivery is never automatically replayed, including after restart',async()=>{
  const f=fixture();f.client.event=async()=>{f.calls.push('event');throw Error('timeout');};
  await f.sync.deliver('job');assert.equal((await f.store.get('job')).status,'event_sending');
  f.advance();await f.sync.deliver('job');
  const restarted=new BrevoSync({store:f.store,client:f.client,allowedEmails:[record.guest.email]});await restarted.drain();
  assert.deepEqual(f.calls,['contact','event']);
});
test('event rate limiting retries event only and permission failure blocks',async()=>{
  const f=fixture();f.client.event=async()=>{throw Object.assign(Error(),{status:429});};
  await f.sync.deliver('job');assert.equal((await f.store.get('job')).phase,'event');
  f.advance();f.client.event=async()=>{throw Object.assign(Error(),{status:401});};
  await f.sync.deliver('job');assert.equal((await f.store.get('job')).status,'blocked');assert.deepEqual(f.calls,['contact']);
});
test('outbox recipient allowlist is enforced again before transmission',async()=>{
  const f=fixture();f.sync.allowedEmails=[];await f.sync.deliver('job');
  assert.equal((await f.store.get('job')).status,'blocked');assert.deepEqual(f.calls,[]);
});
test('restart recovers an expired contact lease but not a live lease',async()=>{
  const f=fixture();await f.store.put('job',{...await f.store.get('job'),status:'contact_sending',nextAt:150000});
  await f.sync.deliver('job');assert.deepEqual(f.calls,[]);f.advance();await f.sync.deliver('job');
  assert.deepEqual(f.calls,['contact','event']);
});
