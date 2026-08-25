/* Essentiel PME — static site interactions
   Mobile menu · FAQ accordions · form validation · blog subscribe
   smooth-scroll anchors · consent banner (les pages EN sont statiques sous /en/) */
(function () {
  'use strict';

  var HEADER_OFFSET = 84;
  var EN = document.documentElement.getAttribute('lang') === 'en';

  /* Consentement mémorisé ({analytics, ads}) ou null. Formats hérités : granted/denied. */
  function getConsent() {
    var raw = null;
    try { raw = localStorage.getItem('epme_consent'); } catch (e) {}
    if (!raw) return null;
    if (raw === 'granted') return { analytics: true, ads: true };
    if (raw === 'denied') return { analytics: false, ads: false };
    try { var c = JSON.parse(raw); if (c && typeof c === 'object') return c; } catch (e) {}
    return null;
  }

  /* Téléphone nord-américain → format E.164 (+1XXXXXXXXXX), requis par Google/Meta. */
  function toE164(phone) {
    var d = String(phone).replace(/[^0-9]/g, '');
    if (d.length === 10) return '+1' + d;
    if (d.length === 11 && d.charAt(0) === '1') return '+' + d;
    return d ? '+' + d : '';
  }

  /* ---------------- Attribution (UTM / source de trafic) ----------------
     Capturée à l'arrivée, mémorisée localement, jointe à la soumission du
     formulaire. Les paramètres de campagne sont rafraîchis à chaque nouvelle
     arrivée avec UTM (dernière source non directe). */
  function initAttribution() {
    try {
      var params = new URLSearchParams(location.search);
      var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'];
      var found = {};
      var has = false;
      keys.forEach(function (k) {
        var v = params.get(k);
        if (v) { found[k] = String(v).slice(0, 200); has = true; }
      });

      var stored = null;
      try { stored = JSON.parse(localStorage.getItem('epme_attrib') || 'null'); } catch (e) {}

      var externalRef = '';
      if (document.referrer) {
        var a = document.createElement('a');
        a.href = document.referrer;
        if (a.host && a.host !== location.host) externalRef = document.referrer.slice(0, 300);
      }

      if (!stored) {
        stored = {
          params: found,
          referrer: externalRef,
          landing: (location.pathname + location.search).slice(0, 300),
          first_visit: new Date().toISOString(),
        };
      } else if (has) {
        stored.params = found;   // nouvelle campagne : on retient la plus récente
        if (externalRef) stored.referrer = externalRef;
      }
      localStorage.setItem('epme_attrib', JSON.stringify(stored));
    } catch (e) {}
  }

  function getAttribution() {
    try { return JSON.parse(localStorage.getItem('epme_attrib') || 'null'); } catch (e) { return null; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAttribution();
    // Le consentement en premier : GTM doit connaître l'état Consent Mode
    // avant qu'un événement de conversion soit poussé, sinon les tags
    // publicitaires sont bloqués au moment où ils comptent le plus.
    initConsent();
    initBooking();
    initMobileMenu();
    initFaq();
    initContactForm();
    initGuideForm();
    initMerci();
    initBlogSubscribe();
    initAnchorScroll();
    initPlatformModals();
  });

  /* ---------------- Prise de rendez-vous ----------------
     La réservation se termine sur le calendrier de Google, hors du site :
     le clic est donc le dernier signal mesurable ici. Il part sous un nom
     distinct de lead-form_submission, une intention n'étant pas une
     demande soumise ; à mapper en conversion dans GTM si voulu. */
  function initBooking() {
    var links = document.querySelectorAll('[data-booking]');
    if (!links.length) return;
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function () {
        if (!window.dataLayer) return;
        window.dataLayer.push({
          event: 'booking_click',
          form_id: 'contact-booking',
          page_language: EN ? 'en' : 'fr',
        });
        lpDebug('Clic de réservation envoyé au dataLayer');
      });
    });
  }

  /* Traces de diagnostic, visibles seulement en mode DEBUG ou avec
     ?epme_debug=1 dans l'URL. Sert à valider un envoi Brevo sans deviner. */
  function isLpDebug() {
    var cfg = window.EPME_LP || {};
    return !!cfg.DEBUG || location.search.indexOf('epme_debug=1') !== -1;
  }
  function lpDebug() {
    if (!isLpDebug()) return;
    try {
      console.log.apply(console, ['[Essentiel PME]'].concat([].slice.call(arguments)));
    } catch (e) {}
  }

  /* Le point d'entrée des formulaires Brevo autorise la lecture de sa réponse
     (leur propre widget en dépend), donc on envoie d'abord de façon lisible :
     on sait si Brevo a accepté ou refusé. Si le navigateur bloque quand même
     la lecture, on renvoie en aveugle pour ne pas perdre l'inscription. Une
     adresse déjà connue est mise à jour par Brevo, jamais dupliquée, donc ce
     second envoi est sans conséquence. */
  function sendToBrevo(action, body) {
    var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    lpDebug('Envoi Brevo →', action, body);
    return fetch(action, { method: 'POST', headers: headers, body: body })
      .then(function (res) {
        return res.text().catch(function () { return ''; }).then(function (txt) {
          lpDebug('Réponse Brevo : HTTP ' + res.status, txt.slice(0, 400));
          return res;
        });
      })
      .catch(function (err) {
        lpDebug('Réponse Brevo illisible (' + err + '), renvoi en aveugle');
        return fetch(action, { method: 'POST', mode: 'no-cors', headers: headers, body: body })
          .catch(function () {});
      });
  }

  /* ---------------- Landing pages guides (gated content) ----------------
     Formulaire → Brevo (si configuré) + courriel de lead interne, en parallèle
     → redirection vers la page merci (?prenom=…) où se fait le téléchargement. */
  function initGuideForm() {
    var form = document.querySelector('form.lp-form');
    if (!form) return;
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var cfg = window.EPME_LP || {};
    var sending = false;

    function fieldVal(n) {
      var el = form.querySelector('[name="' + n + '"]');
      return el ? el.value.trim() : '';
    }
    function mark(n, good) {
      var el = form.querySelector('[name="' + n + '"]');
      var err = form.querySelector('[data-error-for="' + n + '"]');
      if (el) el.style.borderColor = good ? 'var(--border)' : 'var(--danger)';
      if (err) err.hidden = good;
      return good;
    }

    form.querySelectorAll('.lp-input').forEach(function (input) {
      input.addEventListener('input', function () { mark(input.getAttribute('name'), true); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var ok = true;
      ok = mark('prenom', fieldVal('prenom').length > 0) && ok;
      ok = mark('nom', fieldVal('nom').length > 0) && ok;
      ok = mark('compagnie', fieldVal('compagnie').length > 0) && ok;
      ok = mark('email', emailRe.test(fieldVal('email'))) && ok;
      if (!ok) return;

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Un instant…'; }
      sending = true;

      var prenom = fieldVal('prenom');
      var merci = (form.getAttribute('data-merci') || '/') + '?prenom=' + encodeURIComponent(prenom);
      var guide = form.getAttribute('data-guide') || '';
      var debugging = isLpDebug();
      var done = false;
      function go() {
        if (done) return;
        done = true;
        // En diagnostic on reste sur place, sinon la console se vide au départ
        if (debugging) { lpDebug('Redirection suspendue (diagnostic). Cible :', merci); return; }
        location.href = merci;
      }
      // Le téléchargement promis passe avant tout : redirection garantie
      setTimeout(go, 2500);

      var jobs = [];

      if (cfg.BREVO_ACTION) {
        var f = cfg.BREVO_FIELDS || {};
        var body = new URLSearchParams();
        body.set(f.email || 'EMAIL', fieldVal('email'));
        body.set(f.prenom || 'PRENOM', prenom);
        body.set(f.nom || 'NOM', fieldVal('nom'));
        body.set(f.compagnie || 'COMPAGNIE', fieldVal('compagnie'));
        body.set('email_address_check', ''); // pot de miel anti-robot de Brevo
        body.set('locale', 'fr');
        jobs.push(sendToBrevo(cfg.BREVO_ACTION, body.toString()));
      }

      jobs.push(fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'guide',
          guide: guide,
          firstname: prenom,
          lastname: fieldVal('nom'),
          biz: fieldVal('compagnie'),
          email: fieldVal('email'),
          marketing: true,
          attribution: getAttribution(),
        }),
      }).catch(function () {}));

      Promise.all(jobs).then(go, go);
    });
  }

  /* ---------------- Page Plateformes : fenêtre de détails ---------------- */
  function initPlatformModals() {
    var overlay = document.querySelector('[data-plat-modal]');
    if (!overlay) return;
    var content = overlay.querySelector('[data-plat-content]');

    function open(key) {
      var src = document.querySelector('[data-plat-details="' + key + '"]');
      if (!src) return;
      content.innerHTML = src.innerHTML;
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
    }
    function close() {
      overlay.hidden = true;
      content.innerHTML = '';
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-plat-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { open(btn.getAttribute('data-plat-open')); });
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-plat-close]')) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    // Arrivée avec une ancre (#plat-facebook, depuis l'accueil) : ouvrir la fenêtre
    if (location.hash) {
      var card = document.getElementById(location.hash.slice(1));
      var btn = card && card.querySelector('[data-plat-open]');
      if (btn) open(btn.getAttribute('data-plat-open'));
    }
  }

  /* ---------------- Page merci : personnalisation + conversion ---------------- */
  function initMerci() {
    var page = document.querySelector('.lp-merci-page');
    if (!page) return;
    // Les pages de guides portent data-guide, celle du contact data-form-id
    var slug = page.getAttribute('data-guide') || '';
    var formId = page.getAttribute('data-form-id') || ('guide-' + slug);
    try {
      var prenom = new URLSearchParams(location.search).get('prenom');
      var span = document.getElementById('merci-prenom');
      if (span && prenom) span.textContent = ' ' + prenom.slice(0, 60);
    } catch (e) {}
    // Conversion : une seule fois par session et par guide
    var key = 'epme_lead_' + formId;
    var already = false;
    try { already = sessionStorage.getItem(key) === '1'; } catch (e) {}
    if (!already && window.dataLayer) {
      window.dataLayer.push({ event: 'lead-form_submission', form_id: formId, page_language: 'fr' });
      try { sessionStorage.setItem(key, '1'); } catch (e) {}
    }
  }

  /* ---------------- Bandeau de consentement aux témoins (Loi 25) ----------------
     Trois catégories : fonctionnels (toujours actifs), analytiques, publicitaires.
     Niveau 1 : « Tout accepter » ou « Personnaliser » ; le refus des témoins
     optionnels ne se fait qu'au niveau 2 (les cases sont pré-cochées). */
  function initConsent() {
    var banner = document.querySelector('[data-consent-banner]');
    if (!banner) return;

    function apply(c) {
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: c.analytics ? 'granted' : 'denied',
          ad_storage: c.ads ? 'granted' : 'denied',
          ad_user_data: c.ads ? 'granted' : 'denied',
          ad_personalization: c.ads ? 'granted' : 'denied',
        });
      }
      if (window.dataLayer) {
        window.dataLayer.push({ event: 'epme_consent', consent_analytics: !!c.analytics, consent_ads: !!c.ads });
      }
    }

    // Sur les landing pages le bandeau ne bloque pas : le visiteur venu d'une
    // publicité doit pouvoir lire l'offre et s'inscrire sans répondre d'abord.
    // Ailleurs, la modale verrouille le défilement jusqu'au choix.
    var inline = banner.hasAttribute('data-consent-inline');
    function show() {
      banner.hidden = false;
      if (!inline) document.body.style.overflow = 'hidden';
    }

    function save(c) {
      try { localStorage.setItem('epme_consent', JSON.stringify(c)); } catch (e) {}
      apply(c);
      banner.hidden = true;
      if (!inline) document.body.style.overflow = '';
    }

    var main = banner.querySelector('[data-consent-main]');
    var panel = banner.querySelector('[data-consent-panel]');

    function openPanel() {
      main.style.display = 'none';
      panel.hidden = false;
      panel.style.display = 'block';
      show();
    }

    banner.querySelector('[data-consent-accept]').addEventListener('click', function () {
      save({ analytics: true, ads: true });
    });
    banner.querySelector('[data-consent-customize]').addEventListener('click', openPanel);
    banner.querySelector('[data-consent-optional-refuse]').addEventListener('click', function () {
      save({ analytics: false, ads: false });
    });
    banner.querySelector('[data-consent-save]').addEventListener('click', function () {
      save({
        analytics: banner.querySelector('[data-consent-analytics]').checked,
        ads: banner.querySelector('[data-consent-ads]').checked,
      });
    });

    // Icône permanente : rouvre les préférences avec les choix actuels pré-remplis
    var reopen = document.querySelector('[data-consent-reopen]');
    if (reopen) {
      reopen.addEventListener('click', function () {
        var current = getConsent() || { analytics: true, ads: true };
        banner.querySelector('[data-consent-analytics]').checked = !!current.analytics;
        banner.querySelector('[data-consent-ads]').checked = !!current.ads;
        openPanel();
      });
    }

    var stored = getConsent();
    if (stored) { apply(stored); return; }
    show();
  }

  /* ---------------- Mobile hamburger menu ---------------- */
  function initMobileMenu() {
    var burger = document.querySelector('.we-burger');
    var panel = document.querySelector('.we-mobile-nav');
    if (!burger || !panel) return;

    function open() { panel.classList.add('open'); document.body.style.overflow = 'hidden'; burger.setAttribute('aria-expanded', 'true'); }
    function close() { panel.classList.remove('open'); document.body.style.overflow = ''; burger.setAttribute('aria-expanded', 'false'); }

    burger.addEventListener('click', open);
    panel.addEventListener('click', function (e) {
      if (e.target === panel || e.target.closest('.we-mobile-close') || e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------------- FAQ accordions ---------------- */
  function initFaq() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var q = item.querySelector('.faq-q');
      if (!q) return;
      q.setAttribute('role', 'button');
      q.setAttribute('tabindex', '0');
      function toggle() {
        var list = item.closest('.faq-list');
        var wasOpen = item.classList.contains('open');
        if (list) list.querySelectorAll('.faq-item.open').forEach(function (o) { if (o !== item) o.classList.remove('open'); });
        item.classList.toggle('open', !wasOpen);
      }
      q.addEventListener('click', toggle);
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ---------------- Contact form (validation + envoi via /api) ---------------- */
  var CONTACT_ENDPOINT = '/api/contact/submit';

  function initContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var sending = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var ok = true;
      ok = validateField(form, 'firstname', function (v) { return v.trim().length > 0; }) && ok;
      ok = validateField(form, 'lastname', function (v) { return v.trim().length > 0; }) && ok;
      ok = validateField(form, 'biz', function (v) { return v.trim().length > 0; }) && ok;
      ok = validateField(form, 'email', function (v) { return emailRe.test(v.trim()); }) && ok;
      ok = validateField(form, 'phone', function (v) { return v.replace(/[^0-9]/g, '').length >= 10; }) && ok;
      if (!ok) return;

      var btn = form.querySelector('button[type="submit"]');
      var errBox = document.querySelector('[data-contact-error]');
      var btnHTML = btn ? btn.innerHTML : '';
      if (errBox) errBox.hidden = true;
      if (btn) {
        btn.disabled = true;
        btn.textContent = EN ? 'Sending…' : 'Envoi en cours…';
      }
      sending = true;

      var payload = {};
      ['firstname', 'lastname', 'biz', 'email', 'phone'].forEach(function (k) {
        var el = form.querySelector('[data-field="' + k + '"]');
        payload[k] = el ? el.value.trim() : '';
      });
      var interest = form.querySelector('[name="interest"]:checked') || form.querySelector('[name="interest"]');
      payload.interest = interest ? interest.value : '';
      var msg = form.querySelector('[name="message"]');
      payload.message = msg ? msg.value.trim() : '';
      var marketing = form.querySelector('[name="marketing"]');
      payload.marketing = !!(marketing && marketing.checked);
      payload.attribution = getAttribution();

      /* Brevo est le CRM : toute demande de contact y est enregistrée, opt-in
         ou non. Le consentement voyage comme donnée du contact, dans l'attribut
         OPT_IN, et ce sont les automatisations Brevo qui s'y conditionnent pour
         n'envoyer d'infolettre qu'aux personnes qui l'ont accepté.
         L'appel part en parallèle et n'influence jamais l'issue du formulaire :
         le courriel de lead est le chemin critique, une panne chez Brevo ne
         doit pas faire échouer une demande de soumission. */
      var cfg = window.EPME_LP || {};
      if (cfg.BREVO_CONTACT_ACTION) {
        var bf = cfg.BREVO_CONTACT_FIELDS || {};
        var bBody = new URLSearchParams();
        bBody.set(bf.email || 'EMAIL', payload.email);
        bBody.set(bf.prenom || 'FIRSTNAME', payload.firstname);
        bBody.set(bf.nom || 'LASTNAME', payload.lastname);
        bBody.set(bf.compagnie || 'COMPANY:name', payload.biz);
        // Un numéro mal formé ferait rejeter toute la soumission par Brevo
        var tel = toE164(payload.phone);
        if (bf.telephone && tel) bBody.set(bf.telephone, tel);
        // Facultatif des deux côtés : un message vide n'est pas transmis,
        // plutôt que d'écrire un texte de remplissage dans le CRM.
        var msgVal = payload.message || cfg.BREVO_MESSAGE_VIDE || '';
        if (bf.message && msgVal) bBody.set(bf.message, msgVal);
        // Attribut à choix multiple : les libellés du site sont traduits vers
        // les options définies dans Brevo, qui seules sont acceptées.
        if (bf.forfait && payload.interest) {
          var pk = cfg.BREVO_PACKAGES || {};
          bBody.append(bf.forfait, pk[payload.interest] || payload.interest);
        }
        // OPT_IN est une case à cocher : on n'envoie le champ que s'il est
        // coché, comme le ferait une vraie case HTML. Envoyer une valeur
        // « fausse » exposerait à ce que Brevo lise la seule présence du
        // champ comme un consentement, et écrive un oui sur un refus.
        if (bf.optin && payload.marketing) bBody.set(bf.optin, cfg.BREVO_OPTIN_VALUE || '1');
        bBody.set('email_address_check', '');
        bBody.set('locale', EN ? 'en' : 'fr');
        sendToBrevo(cfg.BREVO_CONTACT_ACTION, bBody.toString());
      } else {
        lpDebug('Brevo ignoré pour le contact : aucune URL configurée');
      }

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          if (window.dataLayer) {
            var dlEvent = {
              event: 'lead-form_submission',
              form_id: 'contact',
              form_interest: payload.interest,
              page_language: EN ? 'en' : 'fr',
            };
            // Données personnelles pour Enhanced Conversions (Google) et Advanced
            // Matching (Meta) — seulement si les témoins publicitaires sont acceptés.
            var consent = getConsent();
            if (consent && consent.ads) {
              dlEvent.user_data = {
                email: payload.email.toLowerCase(),
                phone_number: toE164(payload.phone),
                address: {
                  first_name: payload.firstname,
                  last_name: payload.lastname,
                },
              };
            }
            window.dataLayer.push(dlEvent);
          }
          var success = document.querySelector('[data-contact-success]');
          form.style.display = 'none';
          if (success) { success.hidden = false; success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        })
        .catch(function () {
          if (errBox) errBox.hidden = false;
        })
        .then(function () {
          sending = false;
          if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
        });
    });

    form.querySelectorAll('[data-field]').forEach(function (input) {
      input.addEventListener('input', function () {
        input.style.borderColor = 'var(--border)';
        var err = form.querySelector('[data-error="' + input.getAttribute('data-field') + '"]');
        if (err) err.hidden = true;
      });
    });
  }

  function validateField(form, name, test) {
    var input = form.querySelector('[data-field="' + name + '"]');
    var err = form.querySelector('[data-error="' + name + '"]');
    if (!input) return true;
    var good = test(input.value || '');
    input.style.borderColor = good ? 'var(--border)' : 'var(--danger)';
    if (err) err.hidden = good;
    return good;
  }

  /* ---------------- Blog subscribe ---------------- */
  function initBlogSubscribe() {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    document.querySelectorAll('[data-subscribe-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        if (!input || !emailRe.test((input.value || '').trim())) {
          if (input) input.style.borderColor = 'var(--danger)';
          return;
        }
        input.value = '';
        input.style.borderColor = 'var(--border)';
        var scope = form.closest('section') || document;
        var msg = scope.querySelector('[data-subscribe-msg]');
        if (msg) msg.hidden = false;
      });
    });
  }

  /* ---------------- Smooth-scroll for in-page anchors ---------------- */
  function initAnchorScroll() {
    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
      var href = a.getAttribute('href');
      var hashIdx = href.indexOf('#');
      if (hashIdx < 0) return;
      var path = href.slice(0, hashIdx);
      var id = href.slice(hashIdx + 1);
      if (!id) return;
      // Only intercept same-page anchors
      var samePage = path === '' || path === location.pathname.split('/').pop() || path === './' + location.pathname.split('/').pop();
      if (!samePage) return;
      a.addEventListener('click', function (e) {
        var el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        var y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
        history.replaceState(null, '', '#' + id);
      });
    });

    // If we arrive with a hash (e.g. from another page), offset for sticky header
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) {
        setTimeout(function () {
          var y = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
          window.scrollTo({ top: y });
        }, 60);
      }
    }
  }
})();
