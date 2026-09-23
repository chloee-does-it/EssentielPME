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
