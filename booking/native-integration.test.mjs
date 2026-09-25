import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const site=path=>readFileSync(new URL('../site/'+path,import.meta.url),'utf8');

test('both contact pages render the booking app in their own DOM',()=>{
  for(const path of ['contact/index.html','en/contact/index.html']){
    const html=site(path);
    assert.match(html,/<div class="bk-root" data-booking-app data-embedded data-native>/);
    assert.match(html,/src="\/assets\/booking\/booking\.mjs"/);
    assert.doesNotMatch(html,/<iframe[^>]+booking\.essentielpme\.com/);
    assert.doesNotMatch(html,/Calendar not showing\?|Le calendrier ne s’affiche pas/);
    assert.doesNotMatch(html,/booking\.essentielpme\.com\/(?:rendez-vous|en\/book)\//);
  }
});

test('private confirmation pages remove the management token before GTM loads',()=>{
  for(const path of ['merci/rendez-vous/index.html','en/booking-confirmed/index.html']){
    const html=site(path);
    assert.match(html,/name="robots" content="noindex"/);
    assert.match(html,/data-native data-view="confirmation"/);
    assert.ok(html.indexOf("history.replaceState(null,'',location.pathname+location.search)")<html.indexOf('<!-- Google Tag Manager -->'));
    assert.doesNotMatch(html,/<iframe[^>]+booking\.essentielpme\.com/);
  }
});

test('site consent discloses Meta booking identity sharing in both languages',()=>{
  const fr=site('contact/index.html');
  const en=site('en/contact/index.html');
  assert.match(fr,/data-consent-reject/);
  assert.match(en,/data-consent-reject/);
  assert.match(fr,/transmettons aussi à Meta la confirmation, vos prénom, nom, courriel et téléphone/);
  assert.match(en,/send Meta the confirmation, your first and last name, email, and phone/);
  assert.match(fr,/La réservation reste possible sans cet accord/);
  assert.match(en,/You can still book without this choice/);
});

test('native booking form keeps a short privacy note while site consent remains the disclosure',()=>{
  const script=site('assets/booking/booking.mjs');
  assert.match(script,/privacy:'Les champs marqués \* sont obligatoires\. Vos coordonnées servent à organiser et à gérer ce rendez-vous\.'/);
  assert.match(script,/privacy:'Required fields are marked \*\. Your details are used to arrange and manage this appointment\.'/);
  assert.doesNotMatch(script,/privacy:'[^']*(?:transmis à Meta|sent to Meta)/);
  for(const path of ['industries/construction/index.html','en/industries/construction/index.html']){
    const html=site(path);
    assert.match(html,/class="lp-booking-dialog"/);
    assert.match(html,/data-booking-app data-embedded data-native/);
  }
});
