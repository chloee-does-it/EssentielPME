/* Isolated, static staging build. Never modifies the committed production site.
   No Google/Brevo credentials or production forms are used in this preview.
   Run: npm run build:staging; publish only _staging/. */
import { cpSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { bookingPage } from '../booking/pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_staging');
const connected=process.env.BOOKING_CONNECTED==='1';
mkdirSync(out, { recursive: true });
cpSync(join(root, 'site'), out, { recursive: true });
mkdirSync(join(out, 'assets/booking'), { recursive: true });
for (const file of ['schedule.mjs', 'tracking.mjs', 'booking.mjs', 'booking.css']) {
  cpSync(join(root, 'booking', file), join(out, 'assets/booking', file));
}
for (const [route, en] of [
  ['rendez-vous', false], ['en/book', true]
]) {
  mkdirSync(join(out, route), { recursive: true });
  writeFileSync(join(out, route, 'index.html'), bookingPage(en, false));
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const pages = walk(out).filter(path => path.endsWith('.html'));
for (const path of pages) {
  let html = readFileSync(path, 'utf8');
  const en = /<html[^>]*lang="en(?:-[^"]*)?"/i.test(html);
  const label = connected ? (en ? 'Private staging — test bookings send real calendar invitations.' : 'Staging privé — les rendez-vous test envoient de vraies invitations.') : en
    ? 'Test environment — no real bookings or messages are sent.'
    : 'Environnement de test — aucun rendez-vous ni message réel ne sera envoyé.';
  const bookingPath = en ? '/en/book/' : '/rendez-vous/';
  const hasEmbed = /<iframe\b[^>]*src=["']https:\/\/meet\.brevo\.com/i.test(html);
  if (hasEmbed) html = html.replace('</head>', '<link rel="stylesheet" href="/assets/booking/booking.css"><script type="module" src="/assets/booking/booking.mjs"></script></head>');

  // Keep production marketing and the real Brevo booking flow out of staging.
  html = html.replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, '')
    .replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g, '')
    .replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi, '')
    .replace(/<iframe\b[^>]*src=["']https:\/\/meet\.brevo\.com[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi,
      `<div class="bk-root" data-booking-app data-embedded><p>${en ? 'Loading the calendar…' : 'Chargement du calendrier…'}</p></div>`)
    .replace(/href=["']https:\/\/meet\.brevo\.com[^"']*["']/gi, `href="${bookingPath}"`)
    .replace(/href=["']https:\/\/booking\.essentielpme\.com\/(?:rendez-vous|en\/book)\/["']/gi, `href="${bookingPath}"`)
    .replace(/<head>/i, `<head>\n<meta name="robots" content="noindex, nofollow, noarchive">\n<meta http-equiv="Content-Security-Policy" content="connect-src 'self'; frame-src 'none'; form-action 'none'; object-src 'none'; base-uri 'self'">\n<script src="/assets/js/staging-guard.js"></script>`)
    .replace(/<body([^>]*)>/i, `<body$1><aside id="staging-notice" role="note" style="position:relative;z-index:9999;background:#4B2E83;color:white;padding:12px 20px;text-align:center;font:600 14px system-ui">${label}</aside>`);
  assert.match(html, /noindex, nofollow, noarchive/);
  assert.doesNotMatch(html, /dat\.essentielpme\.com|src=["']https:\/\/meet\.brevo\.com/);
  writeFileSync(path, html);
}

// Only the local demo booking form is allowed. All existing production forms
// remain blocked and all network connections are restricted to this origin.
writeFileSync(join(out, 'assets/js/staging-guard.js'), `
window.EPME_STAGING = true;
window.EPME_BOOKING_CONNECTED = ${connected};
window.addEventListener('submit', function (event) {
  if (event.target.matches('form[data-demo-booking]')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  var en = document.documentElement.lang.indexOf('en') === 0;
  var notice = document.getElementById('staging-notice');
  notice.textContent = en ? 'Test mode: this form has not been sent.' : 'Mode test : ce formulaire n’a pas été envoyé.';
  notice.scrollIntoView({ behavior: 'smooth' });
}, true);
`);
writeFileSync(join(out, 'assets/booking/environment.js'), `window.EPME_STAGING = true;\nwindow.EPME_BOOKING_CONNECTED = ${connected};\n`);
writeFileSync(join(out, 'assets/js/config.js'), 'window.EPME_LP = { DEBUG: false };\n');
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(out, 'staging-status.json'), JSON.stringify({
  environment: 'staging', bookingMode: connected?'connected':'demo',
  indexing: false, productionIntegrations: false, pages: pages.length
}, null, 2) + '\n');
console.log(`Staging ready: ${pages.length} noindex pages; production integrations disabled.`);
