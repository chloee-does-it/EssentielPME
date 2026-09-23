import {test} from 'node:test';
import assert from 'node:assert/strict';
import {alertJob,alertEmail,AlertSync} from './alerts.mjs';
import {BrevoClient} from './brevo.mjs';

const record={id:'a'.repeat(48),start:'2026-09-24T14:00:00Z',end:'2026-09-24T14:30:00Z',
  updatedAt:'2026-09-23T14:00:00Z',meet:'https://meet.google.com/abc-defg-hij',
  tokenHash:'private-token',guest:{first:'Marie',last:'Tremblay',company:'PME Test',
    email:'marie@example.com',phone:'private-phone',message:'private-message'}};
const settings={sender:'info@essentielpme.com',
  recipients:['benoit.arlabosse@superquanti.com','chloee.bonneau@superquanti.com']};
function fixture(job=alertJob('create',record,'operation')) {
  let now=100000;
  const docs=new Map([['alert-operation',structuredClone(job)]]);
  const store={
    get:async id=>structuredClone(docs.get(id)||null),
    put:async(id,value)=>docs.set(id,structuredClone(value)),
    atomic:async fn=>{
      const writes=[];const result=await fn({get:async id=>structuredClone(docs.get(id)||null),
        put:(id,value)=>writes.push([id,structuredClone(value)])});
      for(const [id,value]of writes)docs.set(id,value);
      return result;
    },
    alertJobs:async()=>[...docs].map(([id,value])=>({id,...structuredClone(value)}))
  };
  const calls=[];const client={email:async payload=>calls.push(payload)};
  const sync=new AlertSync({store,client,...settings,now:()=>now});
  return {store,client,sync,calls,advance:()=>now+=3600000};
}
test('internal alert excludes private tokens, visitor message and phone',()=>{
  const job=alertJob('create',record,'operation');
  const payload=alertEmail(job,settings);
  assert.deepEqual(payload.to,settings.recipients.map(email=>({email})));
  assert.equal(payload.sender.email,'info@essentielpme.com');
  assert.match(payload.textContent,/Marie Tremblay/);
  assert.match(payload.textContent,/Google Meet/);
  for(const value of ['private-token','private-message','private-phone'])
    assert.ok(!JSON.stringify({job,payload}).includes(value));
});
test('move and cancellation alerts show the correct change without an obsolete Meet link',()=>{
  const moved={...record,start:'2026-09-24T15:00:00Z'};
  const move=alertEmail(alertJob('reschedule',moved,'move',record),settings);
  assert.match(move.subject,/déplacé/);
  assert.match(move.textContent,/Ancien créneau/);
  assert.match(move.textContent,/Nouveau créneau/);
  const cancel=alertEmail(alertJob('cancel',{...moved,meet:null},'cancel',record),settings);
  assert.match(cancel.subject,/annulé/);
  assert.doesNotMatch(cancel.textContent,/Google Meet/);
});
test('transactional email uses Brevo official HTTPS endpoint, server-side only',async()=>{
  let sent;
  const client=new BrevoClient('private-api-key',async(url,options)=>{
    sent={url,options};return {ok:true};
  });
  await client.email(alertEmail(alertJob('create',record,'operation'),settings));
  assert.equal(sent.url,'https://api.brevo.com/v3/smtp/email');
  assert.equal(sent.options.redirect,'error');
  assert.equal(sent.options.headers['api-key'],'private-api-key');
  assert.ok(!sent.options.body.includes('private-api-key'));
});
test('a successful alert is sent once across repeated drains',async()=>{
  const f=fixture();await f.sync.drain();await f.sync.drain();
  assert.equal(f.calls.length,1);
  assert.equal((await f.store.get('alert-operation')).status,'done');
});
test('rate limiting retries, but ambiguous delivery is never replayed',async()=>{
  const f=fixture();f.client.email=async()=>{throw Object.assign(Error(),{status:429});};
  await f.sync.drain();assert.equal((await f.store.get('alert-operation')).status,'pending');
  f.advance();f.client.email=async()=>{f.calls.push('attempt');throw Error('timeout');};
  await f.sync.drain();assert.equal((await f.store.get('alert-operation')).status,'uncertain');
  const restarted=new AlertSync({store:f.store,client:f.client,...settings});
  await restarted.drain();assert.deepEqual(f.calls,['attempt']);
});
test('a crash after claiming an alert does not duplicate the message',async()=>{
  const f=fixture({...alertJob('create',record,'operation'),status:'sending'});
  await f.sync.drain();assert.equal(f.calls.length,0);
});
