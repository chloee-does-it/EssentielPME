import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GoogleCalendar,internalEventId} from './google.mjs';
import {internalCalendarJob,InternalCalendarSync} from './internal-calendar.mjs';

const bookingId='a'.repeat(48);
const record={id:bookingId,start:'2026-09-25T13:00:00.000Z',end:'2026-09-25T13:30:00.000Z',
  meet:'https://meet.google.com/abc-defg-hij',token:'private-management-token',
  updatedAt:'2026-09-23T15:00:00.000Z',guest:{first:'Test',last:'Client',company:'Test Inc.',
    email:'client@example.com',phone:'514-555-0100',message:'private guest message'}};
const recipients=['benoit.arlabosse@superquanti.com','chloee.bonneau@superquanti.com'];

class MemoryStore {
  records=new Map();queue=Promise.resolve();
  async get(id){return structuredClone(this.records.get(id)||null);}
  async put(id,value){this.records.set(id,structuredClone(value));}
  async internalCalendarJobs(){return [...this.records].filter(([,j])=>j.kind==='internal-calendar'&&j.status!=='done')
    .map(([id,j])=>({id,...structuredClone(j)}));}
  async atomic(fn){
    const task=this.queue.then(async()=>{
      const writes=[];const result=await fn({get:id=>this.get(id),put:(id,value)=>writes.push([id,value])});
      for(const [id,value]of writes)await this.put(id,value);return result;
    });this.queue=task.catch(()=>{});return task;
  }
}

test('internal job contains needed details but no management link or free-text message',()=>{
  const job=internalCalendarJob('create',record,'operation-1');
  assert.equal(job.booking.guest.phone,record.guest.phone);
  assert.equal(job.booking.meet,record.meet);
  assert.equal(job.booking.guest.email,record.guest.email);
  assert.ok(!JSON.stringify(job).includes(record.token));
  assert.ok(!JSON.stringify(job).includes(record.guest.message));
});

test('staff invitation stays separate, private and idempotent through moves and cancellation',async()=>{
  const calendar=new GoogleCalendar({environment:'production'},null,null),events=new Map(),calls=[];
  calendar.request=async(path,{method='GET',body}={})=>{
    calls.push({path,method,body});
    const id=internalEventId(bookingId);
    if(method==='GET'){
      const event=events.get(id);
      if(!event){const error=new Error('missing');error.googleStatus=404;throw error;}
      return event;
    }
    if(method==='POST'){
      const event={...body,etag:'v1',status:'confirmed'};events.set(id,event);return event;
    }
    if(method==='PATCH'){
      const event={...events.get(id),...body,etag:'v2'};events.set(id,event);return event;
    }
    if(method==='DELETE'){events.delete(id);return null;}
    throw Error('unexpected request');
  };
  const create=internalCalendarJob('create',record,'operation-1');
  await calendar.internal(create,recipients);
  const created=events.get(internalEventId(bookingId));
  assert.deepEqual(created.attendees,recipients.map(email=>({email})));
  assert.ok(!created.attendees.some(({email})=>email===record.guest.email));
  assert.equal(created.visibility,'private');assert.equal(created.transparency,'transparent');
  assert.match(created.description,/Google Meet : https:\/\/meet\.google\.com/);
  assert.ok(!JSON.stringify(created).includes(record.token));
  assert.ok(!JSON.stringify(created).includes(record.guest.message));
  assert.ok(calls.some(c=>c.method==='POST'&&c.path.includes('sendUpdates=all')));
  await calendar.internal(create,recipients);
  assert.equal(calls.filter(c=>c.method==='POST').length,1);
  const moved={...record,start:'2026-09-25T14:00:00.000Z',end:'2026-09-25T14:30:00.000Z'};
  await calendar.internal(internalCalendarJob('reschedule',moved,'operation-2'),recipients);
  assert.equal(events.get(internalEventId(bookingId)).start.dateTime,moved.start);
  assert.ok(calls.some(c=>c.method==='PATCH'&&c.path.includes('sendUpdates=all')));
  await calendar.internal(internalCalendarJob('cancel',moved,'operation-3'),recipients);
  await calendar.internal(internalCalendarJob('cancel',moved,'operation-3'),recipients);
  assert.equal(calls.filter(c=>c.method==='DELETE').length,1);
  assert.ok(calls.some(c=>c.method==='DELETE'&&c.path.includes('sendUpdates=all')));
  assert.equal(events.has(bookingId),false);
});

test('a pre-existing booking gets its staff invitation when first rescheduled',async()=>{
  const calendar=new GoogleCalendar({},null,null);let posts=0;
  calendar.request=async(path,{method,body}={})=>{
    if(!method){const error=new Error('missing');error.googleStatus=404;throw error;}
    if(method==='POST'){posts++;return body;}
  };
  await calendar.internal(internalCalendarJob('reschedule',record,'operation-2'),recipients);
  assert.equal(posts,1);
});

test('staff invite waits for a real Meet link and can recover it from the customer event',async()=>{
  const calendar=new GoogleCalendar({},null,null),id=internalEventId(bookingId);
  let primaryMeet=null,created=null;
  calendar.request=async(path,{method,body}={})=>{
    if(!method&&path.endsWith('/'+id)){const error=new Error('missing');error.googleStatus=404;throw error;}
    if(!method&&path.endsWith('/'+bookingId))return {hangoutLink:primaryMeet,
      extendedProperties:{private:{epmeBooking:bookingId}}};
    if(method==='POST'){created=body;return body;}
  };
  const job=internalCalendarJob('create',{...record,meet:null},'operation-1');
  await assert.rejects(calendar.internal(job,recipients),{code:'meet_pending'});
  assert.equal(created,null);
  primaryMeet=record.meet;
  await calendar.internal(job,recipients);
  assert.ok(created.description.includes(record.meet));
});

test('a Google insert conflict is reconciled only for our matching staff event',async()=>{
  const calendar=new GoogleCalendar({},null,null),id=internalEventId(bookingId);
  const job=internalCalendarJob('create',record,'operation-1');
  let existing=null;
  calendar.request=async(path,{method}={})=>{
    if(!method&&path.endsWith('/'+id)){
      if(existing)return existing;
      const error=new Error('missing');error.googleStatus=404;throw error;
    }
    if(method==='POST'){
      existing={id,extendedProperties:{private:{epmeBooking:bookingId,
        epmeInternal:'1',epmeOperation:'operation-1'}}};
      const error=new Error('already inserted');error.googleStatus=409;throw error;
    }
  };
  assert.equal(await calendar.internal(job,recipients),existing);
  existing.extendedProperties.private.epmeBooking='someone-else';
  await assert.rejects(calendar.internal(job,recipients),{code:'calendar_event_changed'});
});

test('worker waits for preceding change and retries only its own failed operation',async()=>{
  const store=new MemoryStore();let now=Date.parse('2026-09-23T15:00:00.000Z'),calls=0;
  const first=internalCalendarJob('create',record,'operation-1');
  const second=internalCalendarJob('reschedule',record,'operation-2','internal-operation-1');
  await store.put('internal-operation-1',first);await store.put('internal-operation-2',second);
  const calendar={async internal(){calls++;if(calls===1)throw Object.assign(new Error('temporary'),{googleStatus:503});}};
  const worker=new InternalCalendarSync({store,calendar,recipients,now:()=>now});
  await worker.deliver('internal-operation-2');assert.equal(calls,0);
  await worker.deliver('internal-operation-1');
  assert.equal((await store.get('internal-operation-1')).status,'pending');
  await worker.deliver('internal-operation-2');assert.equal(calls,1);
  now+=60001;await worker.drain();
  assert.equal((await store.get('internal-operation-1')).status,'done');
  assert.equal((await store.get('internal-operation-2')).status,'done');
  await worker.drain();assert.equal(calls,3);
});

test('a claimed invitation is safely retried after a worker restart',async()=>{
  const store=new MemoryStore(),now=Date.parse('2026-09-23T15:00:00.000Z');let calls=0;
  await store.put('internal-operation-1',{...internalCalendarJob('create',record,'operation-1'),
    status:'sending',nextAt:now-1,attempts:1});
  const worker=new InternalCalendarSync({store,calendar:{async internal(){calls++;}},recipients,now:()=>now});
  await worker.drain();
  assert.equal(calls,1);
  assert.equal((await store.get('internal-operation-1')).status,'done');
});
