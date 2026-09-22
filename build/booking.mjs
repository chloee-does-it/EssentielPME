/* Production build for the isolated booking service. */
import {cpSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bookingPage} from '../booking/pages.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'_booking');
rmSync(out,{recursive:true,force:true});
mkdirSync(join(out,'assets/booking'),{recursive:true});
cpSync(join(root,'site/assets'),join(out,'assets'),{recursive:true});
for(const file of ['schedule.mjs','tracking.mjs','booking.mjs','booking.css']){
  cpSync(join(root,'booking',file),join(out,'assets/booking',file));
}
writeFileSync(join(out,'assets/booking/environment.js'),'window.EPME_STAGING = false;\nwindow.EPME_BOOKING_CONNECTED = true;\n');
for(const [route,en,confirmation] of [
  ['rendez-vous',false,false],['en/book',true,false],
  ['merci/rendez-vous',false,true],['en/booking-confirmed',true,true]
]){
  mkdirSync(join(out,route),{recursive:true});
  writeFileSync(join(out,route,'index.html'),bookingPage(en,confirmation,{production:true}));
}
writeFileSync(join(out,'index.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/rendez-vous/"><link rel="canonical" href="https://booking.essentielpme.com/rendez-vous/"><title>Réservation | Essentiel PME</title>');
writeFileSync(join(out,'robots.txt'),'User-agent: *\nAllow: /rendez-vous/\nAllow: /en/book/\nDisallow: /merci/\nDisallow: /en/booking-confirmed/\nDisallow: /api/\n');
console.log('Production booking service ready.');
