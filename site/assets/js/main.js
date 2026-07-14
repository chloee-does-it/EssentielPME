/* Essentiel PME — static site interactions
   Mobile menu · FAQ accordions · form validation · blog subscribe
   smooth-scroll anchors · FR/EN language toggle (via EPME_I18N) */
(function () {
  'use strict';

  var HEADER_OFFSET = 84;

  document.addEventListener('DOMContentLoaded', function () {
    initLang();
    initMobileMenu();
    initFaq();
    initContactForm();
    initBlogSubscribe();
    initAnchorScroll();
  });

  /* ---------------- Language toggle (FR/EN) ---------------- */
  function initLang() {
    var stored = 'fr';
    try { stored = localStorage.getItem('epme_lang') || 'fr'; } catch (e) {}
    setLang(stored, false);

    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        setLang(btn.getAttribute('data-lang-btn'), true);
      });
    });
  }

  function setLang(lang, persist) {
    if (lang !== 'fr' && lang !== 'en') lang = 'fr';
    if (window.EPME_I18N) {
      try { window.EPME_I18N.apply(document.body, lang); } catch (e) {}
    }
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang-btn') === lang);
    });
    if (persist) { try { localStorage.setItem('epme_lang', lang); } catch (e) {} }
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
      ok = validateField(form, 'name', function (v) { return v.trim().length > 0; }) && ok;
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
        btn.textContent = document.documentElement.getAttribute('lang') === 'en' ? 'Sending…' : 'Envoi en cours…';
      }
      sending = true;

      var payload = {};
      ['name', 'biz', 'email', 'phone'].forEach(function (k) {
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
