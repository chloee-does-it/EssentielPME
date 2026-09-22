export function bookingPage(en=false,confirmation=false,{production=false}={}){
  const title=confirmation?(en?'Appointment confirmation':'Confirmation de rendez-vous'):(en?'Book your discovery call':'Réservez votre appel découverte');
  const switchPath=confirmation?(en?'/merci/rendez-vous/':'/en/booking-confirmed/'):(en?'/rendez-vous/':'/en/book/');
  const site='https://www.essentielpme.com';
  const legal=(production?site:'')+(en?'/en/legal/#cookies':'/mentions-legales/#temoins');
  const home=production?site+(en?'/en/':'/'):(en?'/en/':'/');
  const canonical=production?'https://booking.essentielpme.com'+(confirmation?(en?'/en/booking-confirmed/':'/merci/rendez-vous/'):(en?'/en/book/':'/rendez-vous/')):'';
  return `<!doctype html>
<html lang="${en?'en':'fr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Essentiel PME</title>
  ${(!production||confirmation)?'<meta name="robots" content="noindex, nofollow, noarchive">':''}
  ${canonical?`<link rel="canonical" href="${canonical}">`:''}
  <link rel="icon" href="/assets/img/favicon.svg">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <link rel="stylesheet" href="/assets/booking/booking.css">
  <script>(function(){var raw=location.hash.slice(1),p=new URLSearchParams(raw);if(!p.get('ref')||!p.get('token'))return;window.EPME_BOOKING_FRAGMENT=raw;try{sessionStorage.setItem('epme-booking-link-v1',raw)}catch(e){}history.replaceState(null,'',location.pathname+location.search)})();</script>
  <script src="/assets/booking/environment.js"></script>
  <script type="module" src="/assets/booking/booking.mjs"></script>
</head>
<body class="booking-page">
  <header class="bk-header"><a href="${home}"><img src="/assets/img/logo-h-${en?'en':'fr'}-rgb.svg" alt="${en?'SMB Essentials':'Essentiel PME'}"></a>${confirmation?'':`<a href="${switchPath}" lang="${en?'fr':'en'}">${en?'Français':'English'}</a>`}</header>
  <main><div class="bk-intro"><span class="bk-eyebrow">${en?'LET’S MEET':'FAISONS CONNAISSANCE'}</span><h1>${title}</h1><p>${en?'A first conversation to move your business forward.':'Un premier échange pour faire avancer votre entreprise.'}</p></div><div class="bk-root" data-booking-app ${confirmation?'data-view="confirmation"':''}><p>${en?'Loading the calendar…':'Chargement du calendrier…'}</p><noscript>${en?'Please enable JavaScript to use the booking tool.':'Activez JavaScript pour utiliser l’outil de réservation.'}</noscript></div></main>
  <footer class="bk-footer">Essentiel PME · Québec<br><a href="${legal.split('#')[0]}">${en?'Privacy':'Confidentialité'}</a></footer>
</body>
</html>`;
}
