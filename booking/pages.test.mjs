import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingPage} from './pages.mjs';

test('booking pages have no second consent prompt or non-essential trackers',()=>{
  for(const production of [false,true]){
    for(const en of [false,true]){
      for(const confirmation of [false,true]){
        const html=bookingPage(en,confirmation,{production});
        assert.doesNotMatch(html,/data-consent-banner|data-consent-reopen|consent-overlay/);
        assert.doesNotMatch(html,/dat\.essentielpme\.com|googletagmanager|facebook\.net|\/assets\/js\/main\.js/);
        assert.match(html,/\/assets\/booking\/booking\.mjs/);
        assert.match(html,/\/assets\/booking\/environment\.js/);
        assert.match(html,/Confidentialité|Privacy/);
      }
    }
  }
});
