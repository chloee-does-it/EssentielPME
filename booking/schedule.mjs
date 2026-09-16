export const RULES = Object.freeze({zone:'America/Toronto', duration:30, buffer:15, noticeHours:24, horizonDays:21,
  hours:{1:[[9,13]],2:[[9,13],[16,19]],3:[[9,13],[16,19]],4:[[9,13]],5:[[9,13]]}});

export function localParts(instant, zone=RULES.zone) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
}
export function dateKey(instant, zone=RULES.zone) {
  const p=localParts(instant,zone);return `${p.year}-${p.month}-${p.day}`;
}
export function torontoInstant(date, hour, minute=0) {
  const target=Date.parse(`${date}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00Z`);
  let value=target;
  for(let i=0;i<3;i++) {
    const p=localParts(value);
    const represented=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute);
    value+=target-represented;
  }
  return value;
}
export function overlaps(start,end,busy,bufferMinutes=RULES.buffer) {
  const gap=bufferMinutes*60000;
  return busy.some(b=>start < Date.parse(b.end)+gap && end+gap > Date.parse(b.start));
}
export function slots({now=Date.now(),busy=[],rules=RULES}={}) {
  const first=dateKey(now);const midnight=Date.parse(first+'T12:00:00Z');const result=[];
  const min=now+rules.noticeHours*3600000; const max=now+rules.horizonDays*86400000;
  for(let d=0;d<=rules.horizonDays;d++) {
    const stamp=new Date(midnight+d*86400000);
    const date=stamp.toISOString().slice(0,10);
    for(const [from,to] of rules.hours[stamp.getUTCDay()]||[]) {
      for(let m=from*60;m+rules.duration<=to*60;m+=30) {
        const start=torontoInstant(date,Math.floor(m/60),m%60);const end=start+rules.duration*60000;
        if(start>=min && start<=max && !overlaps(start,end,busy,rules.buffer)) result.push({start:new Date(start).toISOString(),end:new Date(end).toISOString()});
      }
    }
  }
  return result;
}
export function validGuest(guest) {
  for(const key of ['first','last','company']) if(typeof guest[key]!=='string'||!guest[key].trim()||guest[key].length>120) return false;
  return typeof guest.email==='string' && guest.email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email) &&
    (guest.phone||'').length<=40 && (guest.message||'').length<=2000;
}
