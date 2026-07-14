/* Essentiel PME — static site interactions
   Mobile menu · FAQ accordions · form validation · blog subscribe
   smooth-scroll anchors · consent banner (les pages EN sont statiques sous /en/) */
(function () {
  'use strict';

  var HEADER_OFFSET = 84;
  var EN = document.documentElement.getAttribute('lang') === 'en';

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initFaq();
    initContactForm();
    initBlogSubscribe();
    initAnchorScroll();
    initConsent();
  });

  /* ---------------- Bandeau de consentement aux témoins (Loi 25) ----------------
     Trois catégories : fonctionnels (toujours actifs), analytiques, publicitaires.
     Niveau 1 : « Tout accepter » ou « Personnaliser » ; le refus des témoins
     optionnels ne se fait qu'au niveau 2 (les cases sont pré-cochées). */
  function initConsent() {
    var banner = document.querySelector('[data-consent-banner]');
    if (!banner) return;

    function readStored() {
      var raw = null;
      try { raw = localStorage.getItem('epme_consent'); } catch (e) {}
      if (!raw) return null;
      if (raw === 'granted') return { analytics: true, ads: true };   // ancien format
      if (raw === 'denied') return { analytics: false, ads: false };
      try { var c = JSON.parse(raw); if (c && typeof c === 'object') return c; } catch (e) {}
      return null;
    }

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

    function save(c) {
      try { localStorage.setItem('epme_consent', JSON.stringify(c)); } catch (e) {}
      apply(c);
      banner.hidden = true;
    }

    var main = banner.querySelector('[data-consent-main]');
    var panel = banner.querySelector('[data-consent-panel]');

    function openPanel() {
      main.style.display = 'none';
      panel.hidden = false;
      panel.style.display = 'block';
      banner.hidden = false;
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
        var current = readStored() || { analytics: true, ads: true };
        banner.querySelector('[data-consent-analytics]').checked = !!current.analytics;
        banner.querySelector('[data-consent-ads]').checked = !!current.ads;
        openPanel();
      });
    }

    var stored = readStored();
    if (stored) { apply(stored); return; }
    banner.hidden = false;
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
      var interest = form.querySelector('[name="interest"]');
      payload.interest = interest ? interest.value : '';
      var msg = form.querySelector('[name="message"]');
      payload.message = msg ? msg.value.trim() : '';

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
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
