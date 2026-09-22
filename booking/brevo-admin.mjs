// Run inside the staging container; credentials stay in its environment.
import {BREVO_ATTRIBUTES} from './server/brevo.mjs';
const key=process.env.BREVO_API_KEY;
if(!key||process.env.BOOKING_ORIGIN!=='https://essentielpme-staging-hk2il.ondigitalocean.app')throw Error('Staging credentials required');
async function request(path,body){
  const response=await fetch('https://api.brevo.com/v3/'+path,{method:body?'POST':'GET',redirect:'error',
    headers:{'api-key':key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  const raw=await response.text();let data;try{data=JSON.parse(raw);}catch{data={};}
  if(!response.ok){
    // Only emit HTTP status and IPs when Brevo explicitly reports an IP block.
    const blocked=/unrecogni[sz]ed|unauthori[sz]ed.*IP|IP.*unauthori[sz]ed/i.test(data.message||'');
    console.log(JSON.stringify({http:response.status,ipBlocked:blocked,ips:blocked?(data.message.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)||[]):[]}));
    process.exit(1);
  }
  return data;
}
const account=await request('account');
console.log(JSON.stringify({company:account.companyName,email:account.email}));
const command=process.argv[2]||'check';
if(command==='provision'){
  if(!process.argv[3]||account.companyName!==process.argv[3])throw Error('Expected company must match verified account');
  const {attributes}=await request('contacts/attributes');
  for(const name of BREVO_ATTRIBUTES){
    const existing=attributes.find(a=>a.name===name);
    if(existing){if(existing.type!=='text'||existing.category!=='normal')throw Error('Attribute type conflict: '+name);}
    else await request('contacts/attributes/normal/'+name,{type:'text'});
  }
  console.log('Staging attributes verified: '+BREVO_ATTRIBUTES.length);
}else if(command==='verify'){
  const emails=(process.env.BOOKING_TEST_EMAILS||'').split(',');
  if(emails.length!==1||emails[0]!=='benoit.arlabosse@superquanti.com')throw Error('Unexpected recipient');
  const contact=await request('contacts/'+encodeURIComponent(emails[0]));
  console.log(JSON.stringify({contactId:contact.id,listIds:contact.listIds,emailBlacklisted:contact.emailBlacklisted,
    smsBlacklisted:contact.smsBlacklisted,attributes:Object.fromEntries(Object.entries(contact.attributes||{}).filter(([k])=>k.startsWith('EPME_STG_')||k==='OPT_IN'))}));
  if(process.argv[3]){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(process.argv[3]))throw Error('Expected date');
    const events=await request('events?startDate='+process.argv[3]+'&endDate='+process.argv[3]+'&limit=100');
    console.log(JSON.stringify({count:events.count,events:events.events?.filter(e=>e.contact_id===contact.id&&e.event_name?.startsWith('epme_staging_')).map(e=>({name:e.event_name,date:e.event_date,properties:e.event_properties}))}));
  }
}else if(command==='check'){
  const {attributes}=await request('contacts/attributes');
  console.log(JSON.stringify({stagingAttributes:attributes.filter(a=>BREVO_ATTRIBUTES.includes(a.name)).map(a=>({name:a.name,type:a.type}))}));
}else throw Error('Unknown command');
