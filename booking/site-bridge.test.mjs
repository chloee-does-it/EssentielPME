import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('parent page forwards booking events only from its iframe after full consent',()=>{
  const storage=new Map(),listeners=new Map(),frame={contentWindow:{}};
  const document={
    referrer:'',documentElement:{getAttribute:()=> 'fr'},
    addEventListener:(name,fn)=>listeners.set(name,fn),
    querySelector:selector=>selector.startsWith('iframe[src^="https://booking.essentielpme.com/')?frame:null,
    querySelectorAll:()=>[],
  };
  const window={dataLayer:[],addEventListener:(name,fn)=>listeners.set(name,fn)};
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
  const source=readFileSync(new URL('../site/assets/js/main.js',import.meta.url),'utf8');
  runInNewContext(source,{document,window,localStorage,location:{search:'',pathname:'/contact/',hash:''},URLSearchParams,Date,console});
  listeners.get('DOMContentLoaded')();
  const message=listeners.get('message');
  const data={source:'epme-booking',event:'epme_booking_confirmed',event_id:'123e4567-e89b-42d3-a456-426614174000',booking_environment:'production',booking_language:'fr',guest_email:'must-not-pass'};
  const send=(origin='https://booking.essentielpme.com',sourceWindow=frame.contentWindow)=>message({origin,source:sourceWindow,data});
  send();
  assert.equal(window.dataLayer.length,0);
  storage.set('epme_consent',JSON.stringify({analytics:true,ads:false}));
  send();
  assert.equal(window.dataLayer.length,0);
  storage.set('epme_consent',JSON.stringify({analytics:true,ads:true}));
  send('https://not-booking.example');
  send('https://booking.essentielpme.com',{});
  assert.equal(window.dataLayer.length,0);
  send();send();
  assert.equal(window.dataLayer.length,1);
  assert.equal(window.dataLayer[0].event,'epme_booking_confirmed');
  assert.equal(window.dataLayer[0].guest_email,undefined);
});
