import {test} from 'node:test';
import assert from 'node:assert/strict';
import {slots,torontoInstant,localParts,overlaps,validGuest} from './schedule.mjs';
test('Toronto handles daylight saving transitions',()=>{
  assert.equal(new Date(torontoInstant('2026-09-18',9)).toISOString(),'2026-09-18T13:00:00.000Z');
  assert.equal(new Date(torontoInstant('2026-11-02',9)).toISOString(),'2026-11-02T14:00:00.000Z');
  assert.equal(new Date(torontoInstant('2026-03-09',9)).toISOString(),'2026-03-09T13:00:00.000Z');
});
test('24-hour notice, 21-day horizon and configured working hours',()=>{
  const now=Date.parse('2026-09-16T19:00:00Z');const result=slots({now});assert.ok(result.length);
  for(const s of result){const start=Date.parse(s.start);assert.ok(start>=now+86400000&&start<=now+21*86400000);const p=localParts(start);const day=new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`).getUTCDay();assert.ok(day>0&&day<6);assert.ok((+p.hour>=9&&+p.hour<13)||([2,3].includes(day)&&+p.hour>=16&&+p.hour<19));assert.equal(Date.parse(s.end)-start,1800000);}
});
test('15-minute buffer blocks adjacent half-hour slots, not later slots',()=>{
  const busy=[{start:'2026-09-18T14:00:00Z',end:'2026-09-18T14:30:00Z'}];
  assert.ok(overlaps(Date.parse('2026-09-18T13:30:00Z'),Date.parse('2026-09-18T14:00:00Z'),busy));
  assert.ok(overlaps(Date.parse('2026-09-18T14:30:00Z'),Date.parse('2026-09-18T15:00:00Z'),busy));
  assert.equal(overlaps(Date.parse('2026-09-18T15:00:00Z'),Date.parse('2026-09-18T15:30:00Z'),busy),false);
  assert.equal(slots({now:Date.parse('2026-09-16T12:00:00Z'),busy}).some(s=>s.start==='2026-09-18T14:00:00.000Z'),false);
});
test('required guest fields and length limits',()=>{
  const guest={first:'Test',last:'Client',company:'Entreprise test',email:'test@example.invalid'};
  assert.equal(validGuest(guest),true);assert.equal(validGuest({...guest,first:'  '}),false);assert.equal(validGuest({...guest,email:'wrong'}),false);assert.equal(validGuest({...guest,message:'x'.repeat(2001)}),false);
});
