/* Essentiel PME — static site generator
   Emits site/*.html + industries/*.html + sitemap.xml + robots.txt + llms.txt
   Run: node build/build.mjs                                                */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE, adPackages, includedInAll, faqHome, faqAds, testimonials,
  homeSteps, homeFeatures, aboutProcess, aboutValues, platforms,
  industries, blogFeatured, blogArticles,
} from './data.mjs';
import { DICT, META_EN, norm } from './i18n-dict.mjs';

const GTM_ID = 'GTM-NWFC4HHZ';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site');

/* ================= helpers ================= */

const check = (s = 16, color = 'currentColor', style = '') =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"${style ? ` style="${style}"` : ''}><polyline points="20 6 9 17 4 12"></polyline></svg>`;

const chevron = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

const plus = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex:none;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const jsonEsc = (s) => stripTags(s).replace(/ /g, ' ');

const socialIcon = (key) => {
  const p = platforms.find((x) => x.key === key);
  return `<svg width="17" height="17" viewBox="${p.viewBox}" fill="var(--violet)"><path d="${p.path}"></path></svg>`;
};

/* ================= chrome ================= */

function header(active, root, pagePath) {
  const a = (k) => (active === k ? ' class="active"' : '');
  const drop = (label, href, activeCls, items) => `
        <div class="we-navdrop" style="position:relative; display:flex; align-items:center;">
          <a href="${href}"${activeCls ? ` class="active"` : ''} style="display:inline-flex; align-items:center; gap:5px;">${label}
            ${chevron}
          </a>
          <div class="we-dropmenu" style="position:absolute; top:100%; left:-8px; padding-top:10px; display:none; z-index:50;">
            <div style="background:#fff; border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-md); padding:8px; display:flex; flex-direction:column; min-width:230px;">
              ${items.map((it) => `<a href="${it.href}" style="padding:10px 14px; border-radius:8px; border-bottom:none; font-size:14px; font-weight:700; color:var(--charbon); white-space:nowrap;">${it.label}</a>`).join('\n              ')}
            </div>
          </div>
        </div>`;

  return `  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <header class="we-header">
    <div class="we-header-inner">
      <a href="${root}" class="we-logo" style="border-bottom:none;" aria-label="Essentiel PME — Accueil">
        <img src="${root}assets/img/logo-h-fr-rgb.svg" alt="Essentiel PME" style="height:60px; width:auto;">
      </a>
      <nav class="we-nav" aria-label="Navigation principale">
        <a href="${root}publicite/"${a('ads')}>Publicité en ligne</a>
${drop('Industries', `${root}industries/construction/`, active === 'industries', industries.map((i) => ({ label: i.label, href: `${root}industries/${i.key}/` })))}
${drop('À propos', `${root}a-propos/`, active === 'aboutGroup', [
    { label: 'À propos', href: `${root}a-propos/` },
    { label: 'Plateformes', href: `${root}plateformes/` },
    { label: 'Blogue', href: `${root}blogue/` },
  ])}
        <a href="${root}contact/"${a('contact')}>Contact</a>
      </nav>
      <div class="we-header-right">
        <div class="we-lang-toggle">
          <a data-lang-link="fr" href="${pagePath}" class="active" hreflang="fr-CA">FR</a>
          <span class="sep">·</span>
          <a data-lang-link="en" href="/en${pagePath}" hreflang="en-CA">EN</a>
        </div>
        <a href="${root}contact/" class="btn btn-primary" style="padding:10px 18px; font-size:14px;">Démarrer ma publicité en ligne</a>
        <button type="button" class="we-burger" aria-label="Ouvrir le menu" aria-expanded="false">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
    </div>
  </header>
  <div class="we-mobile-nav" role="dialog" aria-label="Menu">
    <div class="we-mobile-panel">
      <div class="we-mobile-top">
        <img src="${root}assets/img/logo-h-fr-rgb.svg" alt="Essentiel PME">
        <button type="button" class="we-mobile-close" aria-label="Fermer le menu">×</button>
      </div>
      <nav aria-label="Navigation mobile">
        <a href="${root}">Accueil</a>
        <a href="${root}publicite/">Publicité en ligne</a>
        <span class="grouplabel">Industries</span>
        ${industries.map((i) => `<a class="sub" href="${root}industries/${i.key}/">${i.label}</a>`).join('\n        ')}
        <span class="grouplabel">À propos</span>
        <a class="sub" href="${root}a-propos/">À propos</a>
        <a class="sub" href="${root}plateformes/">Plateformes</a>
        <a class="sub" href="${root}blogue/">Blogue</a>
        <a href="${root}contact/">Contact</a>
      </nav>
      <div class="we-mobile-cta">
        <a href="${root}contact/" class="btn btn-primary">Démarrer ma publicité en ligne</a>
      </div>
    </div>
  </div>`;
}

function footer(root) {
  return `  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="${root}assets/img/logo-h-fr-white.svg" data-i18n-src-en="${root}assets/img/logo-h-en-white.svg" alt="Essentiel PME" style="filter:none; height:32px;">
        <p>Publicité en ligne gérée pour les PME du Québec. Simple, efficace, rapide.</p>
        <div style="display:flex; gap:12px; margin-top:4px;">
          <a href="${SITE.social.facebook}" target="_blank" rel="noopener" title="Facebook" style="width:38px; height:38px; border-radius:999px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center; border-bottom:none;">${socialIcon('facebook')}</a>
          <a href="${SITE.social.instagram}" target="_blank" rel="noopener" title="Instagram" style="width:38px; height:38px; border-radius:999px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center; border-bottom:none;">${socialIcon('instagram')}</a>
          <a href="${SITE.social.linkedin}" target="_blank" rel="noopener" title="LinkedIn" style="width:38px; height:38px; border-radius:999px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center; border-bottom:none;">${socialIcon('linkedin')}</a>
        </div>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <li><a href="${root}publicite/">Publicité en ligne</a></li>
          <li><a href="${root}plateformes/">Plateformes</a></li>
          <li><a href="${root}industries/construction/">Industries</a></li>
        </ul>
      </div>
      <div>
        <h4>Entreprise</h4>
        <ul>
          <li><a href="${root}a-propos/">À propos</a></li>
          <li><a href="${root}industries/construction/">Industries</a></li>
          <li><a href="${root}blogue/">Blogue</a></li>
          <li><a href="${root}contact/">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Légal</h4>
        <ul>
          <li><a href="${root}mentions-legales/">Mentions légales</a></li>
          <li><a href="${root}mentions-legales/#politique-de-confidentialite">Politique de confidentialité</a></li>
          <li><a href="${root}mentions-legales/#temoins">Politique de cookies</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Essentiel PME</span>
      <a href="${SITE.superquanti}" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:10px; color:inherit; border-bottom:none; white-space:nowrap;">
        <span>En association avec</span>
        <img src="${root}assets/img/superquanti-logo.svg" alt="SuperQuanti" style="height:10px; width:auto; display:block;">
      </a>
    </div>
  </footer>`;
}

function shell({ path, title, desc, active, jsonld = [], body, label }) {
  const root = '/';
  const pagePath = '/' + path.replace(/index\.html$/, '');
  const canonical = `${SITE.baseUrl}${pagePath}`;
  const org = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: SITE.name, alternateName: SITE.nameEn, url: SITE.baseUrl + '/',
    logo: `${SITE.baseUrl}/assets/img/logo-h-fr-rgb.svg`,
    email: SITE.email, telephone: SITE.phoneIntl,
    address: { '@type': 'PostalAddress', addressLocality: 'Québec', addressRegion: 'QC', addressCountry: 'CA' },
    sameAs: [SITE.social.facebook, SITE.social.instagram, SITE.social.linkedin],
  };
  const blocks = [org, ...jsonld]
    .map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">${arguments[0].noindex ? '\n  <meta name="robots" content="noindex">' : ''}
  <title>${title}</title>
  <meta name="description" content="${jsonEsc(desc)}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="fr-CA" href="${canonical}">
  <link rel="alternate" hreflang="en-CA" href="${SITE.baseUrl}/en${pagePath}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  <link rel="icon" type="image/svg+xml" href="${root}assets/img/favicon.svg">
  <link rel="icon" type="image/png" href="${root}assets/img/favicon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:locale" content="fr_CA">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${jsonEsc(desc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE.baseUrl}/assets/img/og-cover.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="${root}assets/css/styles.css">
  <script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied'});</script>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>
  <!-- End Google Tag Manager -->
${blocks}
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<div class="we-page">
${header(active, root, pagePath)}
  <main id="contenu" data-screen-label="${label}" style="animation: epFadeUp 300ms cubic-bezier(0.2,0.7,0.2,1);">
${body}
  </main>
${footer(root)}
</div>
<div class="consent-banner" data-consent-banner hidden>
  <div data-consent-main style="display:contents;">
    <p>On utilise trois types de témoins&nbsp;: <strong>fonctionnels</strong>, <strong>analytiques</strong> et <strong>publicitaires</strong> — pour faire fonctionner le site et mesurer nos campagnes. Détails dans notre <a href="${root}mentions-legales/#temoins">politique de témoins</a>.</p>
    <div class="consent-actions">
      <button type="button" data-consent-customize>Personnaliser</button>
      <button type="button" data-consent-accept>Tout accepter</button>
    </div>
  </div>
  <div data-consent-panel hidden style="display:none; width:100%;">
    <div class="consent-choices">
      <label><input type="checkbox" checked disabled> <span><strong>Fonctionnels</strong> — nécessaires au fonctionnement du site (toujours actifs)</span></label>
      <label><input type="checkbox" data-consent-analytics checked> <span><strong>Analytiques</strong> — mesure d'audience du site (GA4)</span></label>
      <label><input type="checkbox" data-consent-ads checked> <span><strong>Publicitaires</strong> — mesure et performance des campagnes (Meta, Google Ads)</span></label>
    </div>
    <div class="consent-actions" style="justify-content:flex-end;">
      <button type="button" data-consent-optional-refuse>Refuser les témoins optionnels</button>
      <button type="button" data-consent-save>Confirmer mes choix</button>
    </div>
  </div>
</div>
<button type="button" class="consent-reopen" data-consent-reopen aria-label="Gérer les témoins" title="Gérer les témoins">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><circle cx="8.5" cy="8.5" r="0.8" fill="currentColor"></circle><circle cx="16" cy="15.5" r="0.8" fill="currentColor"></circle><circle cx="9" cy="15" r="0.8" fill="currentColor"></circle><circle cx="12.5" cy="11" r="0.8" fill="currentColor"></circle></svg>
</button>
<script src="${root}assets/js/main.js"></script>
</body>
</html>
`;
}

/* ================= shared sections ================= */

function pkgCard(p, { useHomeName = false, ctaHref }) {
  const name = useHomeName ? p.homeName : p.adsName;
  return `            <div class="pkg${p.featured ? ' featured' : ''}">
              ${p.featured ? '<span class="pkg-ribbon">Le plus populaire</span>' : ''}
              <div class="pkg-name">${name}</div>
              <div class="pkg-price">${p.price}<small> $/mois</small></div>
              <div class="pkg-tag">${p.tag}</div>
              <div style="font-size:13px; color:var(--charbon-500); line-height:1.55; background:var(--lavande-50); border-radius:10px; padding:10px 14px;">${p.budget}</div>
              <ul class="pkg-list">
                ${p.bullets.map((b) => `<li>${check(16)}<span>${b}</span></li>`).join('\n                ')}
              </ul>
              <a href="${ctaHref}" class="btn ${p.featured ? 'btn-primary' : 'btn-secondary'}">${p.cta}</a>
            </div>`;
}

function faqList(items, prefix, bgWhite = false) {
  return `          <div class="faq-list">
${items.map((f, i) => `            <div class="faq-item${f.open ? ' open' : ''}"${bgWhite ? ' style="background:#fff;"' : ''}>
              <div class="faq-q" aria-controls="${prefix}-${i}" aria-expanded="${!!f.open}">
                <span>${f.q}</span>
                ${plus}
              </div>
              <div class="faq-a" id="${prefix}-${i}">${f.a}</div>
            </div>`).join('\n')}
          </div>`;
}

function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question', name: jsonEsc(f.q),
      acceptedAnswer: { '@type': 'Answer', text: jsonEsc(f.a) },
    })),
  };
}

function platformTiles(root) {
  return `            <div class="plat-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:14px;">
${platforms.map((p) => `              <a href="${root}plateformes/#${p.anchor}" class="plat-tile" title="Voir la section ${p.label}" style="background:#fff; border:1px solid var(--border); border-radius:16px; aspect-ratio:3/2; display:flex; align-items:center; justify-content:center; transition:all 200ms; position:relative; cursor:pointer; border-bottom:none;${p.tileGridColumn ? ` grid-column:${p.tileGridColumn};` : ''}">
                <svg width="${p.tileW}" height="32" viewBox="${p.viewBox}" fill="var(--violet)"><path d="${p.path}"></path></svg>
                <span class="plat-name" style="position:absolute; left:0; right:0; bottom:7px; text-align:center; font-size:11.5px; font-weight:800; color:var(--violet); pointer-events:none; opacity:0; transition:opacity 120ms;">${p.label}</span>
              </a>`).join('\n')}
            </div>`;
}

function ctaBand({ h, p, cta, href }) {
  return `      <section class="cta-band">
        <div class="cta-band-inner">
          <h2>${h}</h2>
          <p>${p}</p>
          <a href="${href}" class="btn btn-on-violet btn-lg">${cta}</a>
        </div>
      </section>`;
}

/* ================= pages ================= */

function homePage() {
  const root = '/';
  const body = `
      <!-- Hero (variante illustration) -->
      <section class="hero">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="hero-grid">
          <div>
            <h1>Votre marketing numérique professionnel,<br><span class="grad">simplement.</span></h1>
            <p class="lead">Publicité en ligne gérée pour vous, pour les PME d'ici.</p>
            <div class="hero-ctas">
              <a href="/publicite/" class="btn btn-primary btn-lg">Voir nos forfaits</a>
            </div>
            <div class="hero-meta">
              <span>${check(14)} Prix fixes</span>
              <span>${check(14)} Bilingue FR/EN</span>
              <span>${check(14)} Réponse en 24 h</span>
            </div>
          </div>
          <div class="hero-illu" aria-hidden="true">
            <div class="illu-card illu-main" style="display:flex; flex-direction:column;">
              <div style="height:34px; background:var(--lavande-100); display:flex; align-items:center; gap:6px; padding:0 14px; flex:none;">
                <span style="width:9px; height:9px; border-radius:999px; background:var(--violet);"></span>
                <span style="width:9px; height:9px; border-radius:999px; background:var(--lavande-700);"></span>
                <div style="flex:1; height:14px; margin-left:8px; background:#fff; border-radius:999px;"></div>
              </div>
              <div style="flex:1; background:linear-gradient(160deg,#fff 0%,#F3F0FF 100%); padding:22px; display:flex; flex-direction:column; gap:14px;">
                <div style="width:56%; height:20px; background:var(--violet); border-radius:6px;"></div>
                <div style="width:78%; height:11px; background:var(--lavande-200); border-radius:6px;"></div>
                <div style="width:64%; height:11px; background:var(--lavande-100); border-radius:6px;"></div>
                <div style="width:120px; height:32px; background:var(--violet); border-radius:999px; margin-top:6px;"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:auto;">
                  <div style="height:64px; background:#fff; border:1px solid var(--lavande-100); border-radius:10px;"></div>
                  <div style="height:64px; background:var(--lavande-100); border-radius:10px;"></div>
                  <div style="height:64px; background:#fff; border:1px solid var(--lavande-100); border-radius:10px;"></div>
                </div>
              </div>
            </div>
            <div class="illu-card illu-floating-1">
              <div class="illu-stat">Demandes reçues</div>
              <div class="illu-stat-num">+164 %</div>
              <div class="illu-bars"><div style="height:30%;"></div><div style="height:45%;"></div><div style="height:38%;"></div><div style="height:62%;"></div><div style="height:80%;"></div><div style="height:100%; background:var(--lavande-700);"></div></div>
            </div>
            <div class="illu-card illu-floating-2" style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:999px; background:var(--violet); color:#fff; display:flex; align-items:center; justify-content:center; flex:none;">
                ${check(18)}
              </div>
              <div>
                <div style="font-weight:800; font-size:14px; color:var(--charbon);">Campagnes lancées en 2 semaines</div>
                <div style="font-size:12px; color:var(--charbon-500);">Plomberie Tremblay</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Forfaits -->
      <section class="section" style="background:#fff;">
        <div class="section-inner">
          <div class="section-head">
            <h2>Votre publicité en ligne, gérée de A à Z.</h2>
            <p class="lead">On s'occupe des annonces, du ciblage et des rapports. Vous récoltez les demandes.</p>
          </div>
          <div class="packages-grid">
${adPackages.map((p) => pkgCard(p, { useHomeName: true, ctaHref: '/contact/' })).join('\n')}
          </div>
          <p style="text-align:center; font-size:13.5px; color:var(--charbon-500); margin:28px 0 0;">Frais d'installation unique&nbsp;: 600&nbsp;$. Minimum 3 mois, puis mensuel avec préavis de 30 jours. <a href="/publicite/" style="font-weight:700;">Tous les détails →</a></p>
        </div>
      </section>

      <!-- Proposition de valeur -->
      <section class="section features">
        <div class="section-inner">
          <div class="section-head">
            <h2>Simple, efficace, rapide.</h2>
          </div>
          <div class="features-grid">
${homeFeatures.map((f) => `            <div class="feature">
              <div class="feature-illu" style="height:96px;">
                <div style="font-size:34px; font-weight:800; color:var(--violet); letter-spacing:-0.02em;">${f.big}</div>
              </div>
              <h3>${f.h}</h3>
              <p>${f.p}</p>
            </div>`).join('\n')}
          </div>
        </div>
      </section>

      <!-- Comment ça marche (résumé) -->
      <section class="section steps">
        <div class="section-inner">
          <div class="section-head">
            <h2>De l'idée au lancement, en 3 étapes.</h2>
          </div>
          <div class="steps-grid">
${homeSteps.map((s, i) => `            <div class="step-card">
              <div class="step-num">${i + 1}</div>
              <h3>${s.t}</h3>
              <p>${s.b}</p>
            </div>`).join('\n')}
          </div>
          <div style="text-align:center; margin-top:48px;">
            <a href="/a-propos/" class="btn btn-ghost">Voir le processus complet →</a>
          </div>
        </div>
      </section>

      <!-- Témoignages -->
      <section class="section testimonials">
        <div class="section-inner">
          <div class="section-head">
            <h2>Ce qu'en disent nos clients.</h2>
          </div>
          <div class="testimonials-grid">
${testimonials.map((t) => `            <div class="testimonial">
              <div class="testimonial-stars" aria-label="5 étoiles">★★★★★</div>
              <p>${t.text}</p>
              <div class="testimonial-author">
                <div class="avatar" aria-hidden="true">${t.initials}</div>
                <div>
                  <div class="testimonial-name">${t.name}</div>
                  <div class="testimonial-role">${t.role}</div>
                </div>
              </div>
            </div>`).join('\n')}
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="section faq">
        <div class="section-inner">
          <div class="section-head">
            <h2>Les questions qu'on entend le plus.</h2>
          </div>
${faqList(faqHome, 'faq-home')}
        </div>
      </section>`;

  return shell({
    path: 'index.html', root, active: 'home', label: 'Accueil',
    title: 'Essentiel PME — Publicité en ligne gérée pour les PME du Québec',
    desc: 'Publicité en ligne gérée de A à Z pour les PME québécoises : Meta, Google, LinkedIn, TikTok et plus. Prix fixes à partir de 695 $/mois, bilingue FR/EN, réponse en 24 h.',
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.baseUrl + '/', inLanguage: 'fr-CA' },
      faqJsonLd(faqHome),
    ],
    body,
  });
}

function publicitePage() {
  const root = '/';
  const body = `
      <section style="background:var(--grad-hero); padding:80px 24px 64px; text-align:center;">
        <div style="max-width:780px; margin:0 auto;">
          <span class="eyebrow" style="display:block; margin-bottom:14px;">PUBLICITÉ EN LIGNE</span>
          <h1 style="font-size:clamp(2.5rem, 3.5vw + 0.8rem, 3.75rem); margin:0 0 18px;">Des campagnes pensées pour votre chiffre d'affaire.</h1>
          <p class="lead" style="margin:0 auto; max-width:640px;">Publicité gérée pour vous sur toutes les grandes plateformes&nbsp;: rédaction FR/EN, optimisation et rapports clairs.&nbsp;</p>
        </div>
      </section>

      <section class="section packages" style="padding-top:72px;">
        <div class="section-inner">
          <div class="packages-grid">
${adPackages.map((p) => pkgCard(p, { useHomeName: false, ctaHref: '/contact/' })).join('\n')}
          </div>
          <div style="margin-top:36px; background:#fff; border:1px solid var(--lavande-100); border-radius:16px; padding:28px 32px; max-width:960px; margin-left:auto; margin-right:auto;">
            <div style="font-size:12px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:var(--violet); margin-bottom:16px;">Inclus dans les trois forfaits</div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px 28px;">
${includedInAll.map((s) => `              <div style="display:flex; gap:10px; font-size:14px; color:var(--charbon); align-items:flex-start;">${check(15, 'var(--violet)', 'flex:none; margin-top:3px;')}<span>${s}</span></div>`).join('\n')}
            </div>
          </div>
          <div style="margin-top:20px; background:var(--lavande-50); border:1px solid var(--lavande-100); border-radius:16px; padding:22px 28px; display:flex; gap:14px; align-items:flex-start; max-width:960px; margin-left:auto; margin-right:auto;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex:none; margin-top:2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <div style="font-size: 14px; color: var(--charbon); line-height: 1.6;">
              <strong>Frais d'installation unique&nbsp;: 600&nbsp;$ (une fois).</strong>&nbsp;Offerts avec un engagement de 12 mois. Minimum 3 mois, puis mensuel avec préavis de 30 jours.
            </div>
          </div>
        </div>
      </section>

      <!-- Plateformes -->
      <section class="section" style="background:var(--blanc-casse); padding-top:0;">
        <div class="section-inner">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:56px; align-items:center;">
            <div>
              <h2 style="margin:0 0 16px;">Toutes les plateformes, dans tous les forfaits.</h2>
              <p style="color:var(--charbon-500); line-height:1.65; margin:0 0 24px; max-width:520px;">Peu importe le forfait choisi, vous avez accès à l'ensemble des grandes plateformes. On sélectionne ensemble celles qui conviennent à votre entreprise.</p>
              <div style="margin:0 0 28px;">
                <div style="font-size:15px; font-weight:800; color:var(--violet); margin-bottom:12px;">Comment on choisit vos canaux</div>
                <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
                  <li style="display:flex; gap:10px; font-size:14.5px; color:var(--charbon); line-height:1.6; align-items:flex-start;">${check(16, 'var(--violet)', 'flex:none; margin-top:4px;')}<span><strong>Votre clientèle d'abord</strong>&nbsp;<br>On choisit selon votre marché, pas selon la mode.</span></li>
                  <li style="display:flex; gap:10px; font-size:14.5px; color:var(--charbon); line-height:1.6; align-items:flex-start;">${check(16, 'var(--violet)', 'flex:none; margin-top:4px;')}<span><strong>Un canal à la fois</strong>&nbsp;<br>On démarre là où le retour est le plus probable, puis on élargit.</span></li>
                  <li style="display:flex; gap:10px; font-size:14.5px; color:var(--charbon); line-height:1.6; align-items:flex-start;">${check(16, 'var(--violet)', 'flex:none; margin-top:4px;')}<span><strong>Des résultats mesurés</strong>&nbsp;<br>Chaque canal est suivi dans GA4; on garde ce qui rapporte.</span></li>
                </ul>
              </div>
              <a href="/contact/" class="btn btn-primary">Démarrer mes pubs</a>
            </div>
${platformTiles(root)}
          </div>
        </div>
      </section>

      <!-- FAQ pub -->
      <section class="section faq" style="background:var(--blanc-casse);">
        <div class="section-inner">
          <div class="section-head">
            <span class="eyebrow">FAQ</span>
            <h2>Questions fréquentes sur la publicité.</h2>
          </div>
${faqList(faqAds, 'faq-ads', true)}
        </div>
      </section>

${ctaBand({ h: 'Prêt à démarrer vos pubs&nbsp;?', p: 'On configure tout&nbsp;: comptes, pixels et audiences.', cta: 'Démarrer mes pubs →', href: '/contact/' })}`;

  return shell({
    path: 'publicite/index.html', root, active: 'ads', label: 'Publicité',
    title: 'Forfaits Essentiel, Essentiel Plus et Essentiel Performance | Essentiel PME',
    desc: 'Trois forfaits de publicité en ligne gérée pour PME : Essentiel 695 $/mois, Essentiel Plus 995 $/mois, Essentiel Performance 1 495 $/mois. Toutes les plateformes, rédaction FR/EN, rapports clairs.',
    jsonld: [
      {
        '@context': 'https://schema.org', '@type': 'Service',
        name: 'Publicité en ligne gérée', provider: { '@type': 'Organization', name: SITE.name },
        areaServed: 'Québec, CA', serviceType: 'Gestion de publicité numérique',
        hasOfferCatalog: {
          '@type': 'OfferCatalog', name: 'Forfaits publicité',
          itemListElement: adPackages.map((p) => ({
            '@type': 'Offer', name: `Forfait ${p.adsName}`,
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: stripTags(p.price).replace(/ /g, ''), priceCurrency: 'CAD',
              unitText: 'mois',
            },
          })),
        },
      },
      faqJsonLd(faqAds),
    ],
    body,
  });
}

function industryPage(ind) {
  const root = '/';
  const pills = industries.map((x) =>
    `            <a href="/industries/${x.key}/" class="btn ${x.key === ind.key ? 'btn-primary' : 'btn-secondary'}" style="padding:9px 16px; font-size:13.5px;">${x.label}</a>`
  ).join('\n');

  const body = `
      <section style="background:var(--grad-hero); padding:72px 24px 36px; text-align:center;">
        <div style="max-width:840px; margin:0 auto;">
          <span class="eyebrow" style="display:block; margin-bottom:14px;">${ind.eyebrow}</span>
          <h1 style="font-size:clamp(2.2rem, 3vw + 0.8rem, 3.35rem); margin:0 0 16px; text-wrap:balance;">${ind.title}</h1>
          <p class="lead" style="margin:0 auto; max-width:660px;">${ind.intro}</p>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:30px;">
${pills}
        </div>
      </section>

      <section class="section" style="background:#fff;">
        <div class="section-inner">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:56px; align-items:center;">
            <div style="background:${ind.wrapBg}; border:1px solid var(--lavande-100); border-radius:20px; padding:26px;">
              <div style="background:#fff; border-radius:12px; box-shadow:var(--shadow-md); overflow:hidden;">
                <div style="height:26px; background:${ind.barBg}; display:flex; align-items:center; gap:5px; padding:0 12px;">
                  <span style="width:7px; height:7px; border-radius:999px; background:rgba(255,255,255,0.7);"></span>
                  <span style="width:7px; height:7px; border-radius:999px; background:rgba(255,255,255,0.45);"></span>
                </div>
                <div style="aspect-ratio:16/10; position:relative;">
                  <img src="${root}assets/img/${ind.img}.webp" alt="${ind.imgAlt}" loading="lazy" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;">
                  <div style="position:absolute; inset:0; background:var(--violet); mix-blend-mode:color; opacity:0.5; pointer-events:none;"></div>
                </div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:16px;">
              <span class="eyebrow">${ind.eyebrow}</span>
              <h2 style="margin:0; font-size:clamp(1.6rem, 1.4vw + 0.9rem, 2.1rem);">${ind.heading}</h2>
              <p style="margin:0; font-size:15px; color:var(--charbon-500); line-height:1.7;">${ind.body}</p>
              <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:9px;">
${ind.bullets.map((b) => `                <li style="display:flex; gap:9px; font-size:14.5px; color:var(--charbon); align-items:flex-start;">${check(16, 'var(--violet)', 'flex:none; margin-top:3px;')}<span>${b}</span></li>`).join('\n')}
              </ul>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
${ind.tags.map((tg) => tg.solid
    ? `                <span style="font-size:11.5px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:#fff; background:var(--violet); padding:4px 10px; border-radius:999px;">${tg.text}</span>`
    : `                <span style="font-size:11.5px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:var(--violet); background:var(--lavande-100); padding:4px 10px; border-radius:999px;">${tg.text}</span>`).join('\n')}
              </div>
              <a href="${root}contact/" class="btn btn-primary" style="align-self:flex-start; margin-top:4px;">Choisir mon forfait →</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Les défis du secteur -->
      <section class="section" style="background:var(--blanc-casse);">
        <div class="section-inner">
          <div class="section-head">
            <span class="eyebrow">CE QU'ON ENTEND SOUVENT</span>
            <h2>Les défis de votre secteur.</h2>
            <p class="lead">On connaît la réalité de votre secteur. Voici où on fait la différence.</p>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:22px;">
${ind.challenges.map((ch) => `            <div style="background:#fff; border:1px solid var(--border); border-radius:20px; padding:32px; display:flex; flex-direction:column; gap:12px;">
              <div style="width:44px; height:44px; border-radius:12px; background:var(--lavande-100); color:var(--violet); display:flex; align-items:center; justify-content:center; flex:none;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <h3 style="margin:0; font-size:17px; font-weight:800; color:var(--charbon);">${ch.problem}</h3>
              <p style="margin:0; font-size:14px; color:var(--charbon-500); line-height:1.65; flex:1;">${ch.solution}</p>
            </div>`).join('\n')}
          </div>
        </div>
      </section>

      <!-- Notre approche -->
      <section class="section" style="background:#fff;">
        <div class="section-inner">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:48px; align-items:center;">
            <div style="display:flex; flex-direction:column; gap:16px;">
              <span class="eyebrow">NOTRE APPROCHE</span>
              <h2 style="margin:0;">Un plan pensé pour votre secteur.</h2>
              <div style="display:flex; flex-direction:column; gap:4px; margin-top:6px;">
${ind.approach.map((ap, i) => `                <div style="display:grid; grid-template-columns:40px 1fr; gap:14px;">
                  <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="width:34px; height:34px; border-radius:999px; background:var(--violet); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; flex:none;">${i + 1}</div>
                    ${i < ind.approach.length - 1 ? '<div style="width:2px; flex:1; background:var(--lavande-200); margin:5px 0;"></div>' : ''}
                  </div>
                  <div style="padding-bottom:22px;">
                    <h3 style="margin:1px 0 4px; font-size:16px;">${ap.t}</h3>
                    <p style="margin:0; font-size:14px; color:var(--charbon-500); line-height:1.6;">${ap.b}</p>
                  </div>
                </div>`).join('\n')}
              </div>
            </div>
            <div style="background:var(--violet); border-radius:24px; padding:44px; color:#fff;">
              <div style="font-size:12px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:var(--lavande-200); margin-bottom:22px;">Ce que ça donne</div>
              <div style="display:flex; flex-direction:column; gap:26px;">
${ind.stats.map((st) => `                <div>
                  <div style="font-size:40px; font-weight:800; letter-spacing:-0.02em; line-height:1; color:#fff;">${st.num}</div>
                  <div style="font-size:14px; color:rgba(255,255,255,0.82); margin-top:6px;">${st.label}</div>
                </div>`).join('\n')}
              </div>
              <p style="font-size:12px; color:rgba(255,255,255,0.6); margin:24px 0 0;">Ordres de grandeur observés sur des mandats comparables. Résultats variables selon le budget et le marché.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Forfait recommandé -->
      <section class="section" style="background:var(--blanc-casse);">
        <div class="section-inner" style="max-width:820px;">
          <div style="background:#fff; border:1px solid var(--lavande-200); border-radius:24px; padding:44px; display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:32px; align-items:center;">
            <div>
              <div style="font-size:12px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:var(--violet); margin-bottom:10px;">Recommandé pour ce secteur</div>
              <div style="font-size:26px; font-weight:800; color:var(--charbon); letter-spacing:-0.01em;">${ind.recoName}</div>
              <div style="font-size:15px; color:var(--charbon-500); margin-top:6px;">${ind.recoWhy}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:38px; font-weight:800; color:var(--violet); letter-spacing:-0.02em;">${ind.recoPrice}</div>
              <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:14px; flex-wrap:wrap;">
                <a href="${root}publicite/" class="btn btn-secondary">Voir les forfaits</a>
                <a href="${root}contact/" class="btn btn-primary">Parler de mon projet →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Blogue futur pour le secteur -->
      <section class="section" style="background:#fff;">
        <div class="section-inner">
          <div class="section-head">
            <span class="eyebrow">BIENTÔT SUR LE BLOGUE</span>
            <h2>Des conseils pour votre secteur, à venir.</h2>
            <p class="lead">On prépare des guides concrets pour votre secteur. Abonnez-vous pour être avisé au lancement.</p>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:22px;">
${ind.futureBlog.map((fb) => `            <article style="background:var(--blanc-casse); border:1px solid var(--border); border-radius:18px; overflow:hidden; display:flex; flex-direction:column;">
              <div style="height:120px; background:${fb.bg}; position:relative; display:flex; align-items:center; justify-content:center;">
                <span style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--violet); background:rgba(255,255,255,0.85); padding:6px 12px; border-radius:999px;">À venir</span>
              </div>
              <div style="padding:22px 24px; display:flex; flex-direction:column; gap:10px; flex:1;">
                <span style="font-size:11.5px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:var(--charbon-300);">${fb.tag}</span>
                <h3 style="margin:0; font-size:17px; font-weight:800; color:var(--charbon); line-height:1.35; flex:1;">${fb.title}</h3>
                <span style="font-size:13.5px; font-weight:700; color:var(--charbon-300);">Bientôt disponible</span>
              </div>
            </article>`).join('\n')}
          </div>
          <div style="margin-top:36px; background:var(--lavande-50); border:1px solid var(--lavande-100); border-radius:20px; padding:30px 32px; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:18px; align-items:center;">
            <div>
              <h3 style="margin:0 0 4px; font-size:18px; font-weight:800; color:var(--violet);">Soyez avisé au lancement du blogue.</h3>
              <p style="margin:0; font-size:14px; color:var(--charbon-500);">Un courriel par mois, du concret pour votre PME. Rien d'autre.</p>
            </div>
            <form style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;" data-subscribe-form novalidate>
              <input type="email" name="email" placeholder="votre@courriel.com" aria-label="Votre courriel" style="flex:1; min-width:200px; padding:12px 18px; font:inherit; font-size:14.5px; border:1px solid var(--border); border-radius:999px; background:#fff; color:var(--charbon); outline:none;">
              <button type="submit" class="btn btn-primary">M'aviser</button>
            </form>
          </div>
          <p data-subscribe-msg hidden style="text-align:center; font-size:14px; font-weight:700; color:var(--violet); margin:16px 0 0;">Merci&nbsp;! On vous écrit dès que le blogue est en ligne.</p>
        </div>
      </section>

${ctaBand({ h: 'Votre secteur n\'est pas dans la liste&nbsp;?', p: 'On s\'adapte. Racontez-nous votre entreprise et on vous propose le bon plan.', cta: 'Parlez-nous&nbsp; →', href: `${root}contact/` })}`;

  return shell({
    path: `industries/${ind.key}/index.html`, root, active: 'industries', label: 'Industries',
    title: `${stripTags(ind.title)} au Québec | Essentiel PME`,
    desc: ind.seoDesc,
    jsonld: [
      {
        '@context': 'https://schema.org', '@type': 'Service',
        name: jsonEsc(ind.title), description: jsonEsc(ind.seoDesc),
        provider: { '@type': 'Organization', name: SITE.name },
        areaServed: 'Québec, CA',
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE.baseUrl + '/' },
          { '@type': 'ListItem', position: 2, name: 'Industries', item: `${SITE.baseUrl}/industries/construction/` },
          { '@type': 'ListItem', position: 3, name: jsonEsc(ind.label), item: `${SITE.baseUrl}/industries/${ind.key}/` },
        ],
      },
    ],
    body,
  });
}

function aboutPage() {
  const body = `
      <section style="background:var(--grad-hero); padding:80px 24px 64px; text-align:center;">
        <div style="max-width:720px; margin:0 auto;">
          <h1 style="font-size:clamp(2.5rem, 3.5vw + 0.8rem, 3.75rem); margin:0 0 18px; text-wrap:balance;">Du marketing numérique sans détour,<br>pour les PME d'ici.</h1>
          <p class="lead" style="margin:0 auto; max-width:600px;">Essentiel PME existe pour une raison simple&nbsp;: trop de PME québécoises se privent de publicité en ligne parce que ça semble trop cher, trop long, trop compliqué.</p>
        </div>
      </section>

      <section class="section" style="background:#fff;">
        <div class="section-inner" style="max-width:900px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px; margin-bottom:56px;">
            <div style="background:var(--violet); color:#fff; border-radius:24px; padding:40px;">
              <div style="font-size:12px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:var(--lavande-200); margin-bottom:12px;">Notre mission</div>
              <p style="margin:0; font-size:18px; line-height:1.6; color:#fff; font-weight:600;">Donner la possibilité aux PME québécoises d'accéder au marketing numérique à un prix raisonnable, de manière simple, efficace et rapide.</p>
            </div>
            <div style="background:var(--lavande-50); border:1px solid var(--lavande-100); border-radius:24px; padding:40px;">
              <div style="font-size:12px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:var(--violet); margin-bottom:12px;">Notre vision</div>
              <p style="margin:0; font-size:18px; line-height:1.6; color:var(--charbon); font-weight:600;">Simplifier le marketing numérique au Québec en étant transparent sur les coûts, avec une approche structurée, simple et rapide.</p>
            </div>
          </div>
          <div class="section-head" style="margin-bottom:40px;">
            <span class="eyebrow">NOS VALEURS</span>
            <h2>Trois mots qui guident chaque projet.</h2>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:20px;">
${aboutValues.map((v) => `            <div style="background:var(--blanc-casse); border:1px solid var(--border); border-radius:20px; padding:32px;">
              <div style="display:flex; gap:4px; margin-bottom:16px;">
                <span style="width:26px; height:8px; border-radius:999px; background:var(--lavande);"></span>
                <span style="width:14px; height:8px; border-radius:999px; background:var(--violet);"></span>
              </div>
              <h3 style="margin:0 0 8px; font-size:20px; color:var(--violet); font-weight:800;">${v.h}</h3>
              <p style="margin:0; font-size:14.5px; color:var(--charbon-500); line-height:1.65;">${v.p}</p>
            </div>`).join('\n')}
          </div>
        </div>
      </section>

      <section class="section" style="background:var(--blanc-casse);">
        <div class="section-inner" style="max-width:720px;">
          <div class="section-head" style="margin-bottom:40px;">
            <span class="eyebrow">COMMENT ÇA FONCTIONNE</span>
            <h2>Un processus structuré, sans surprise.</h2>
            <p class="lead">Un parcours simple pour lancer votre publicité en ligne, sans surprise.</p>
          </div>
          <div style="background:#fff; border:1px solid var(--border); border-radius:24px; padding:40px 36px;">
            <div style="display:flex; flex-direction:column;">
${aboutProcess.map((s, i) => `              <div style="display:grid; grid-template-columns:48px 1fr; gap:16px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                  <div style="width:40px; height:40px; border-radius:999px; background:var(--violet); color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; flex:none; box-shadow:0 8px 18px rgba(75,46,131,0.25);">${i + 1}</div>
                  ${i < aboutProcess.length - 1 ? '<div style="width:2px; flex:1; background:var(--lavande-200); margin:6px 0;"></div>' : ''}
                </div>
                <div${i < aboutProcess.length - 1 ? ' style="padding-bottom:28px;"' : ''}>
                  <h3 style="margin:2px 0 6px; font-size:17px;">${s.t}</h3>
                  <p style="margin:0; font-size:14.5px; color:var(--charbon-500); line-height:1.65;">${s.b}</p>
                </div>
              </div>`).join('\n')}
            </div>
          </div>
        </div>
      </section>

${ctaBand({ h: 'Travaillons ensemble.', p: 'Un premier appel pour faire connaissance. Sans engagement.', cta: 'Prendre contact →', href: '/contact/' })}`;

  return shell({
    path: 'a-propos/index.html', root: '/', active: 'aboutGroup', label: 'À propos',
    title: 'À propos — mission, valeurs et processus | Essentiel PME',
    desc: 'Essentiel PME rend la publicité en ligne accessible aux PME québécoises : mission, valeurs (simplicité, efficacité, rapidité) et un processus structuré en 6 étapes, sans surprise.',
    jsonld: [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'À propos d’Essentiel PME', url: `${SITE.baseUrl}/a-propos/` }],
    body,
  });
}

function contactPage() {
  const field = (label, name, type, autocomplete = '') => `                <div style="display:flex; flex-direction:column; gap:6px;">
                  <label for="f-${name}" style="font-size:13px; font-weight:700; color:var(--charbon);">${label} *</label>
                  <input id="f-${name}" name="${name}" type="${type}"${autocomplete ? ` autocomplete="${autocomplete}"` : ''} data-field="${name}" style="padding:12px 16px; font:inherit; font-size:15px; border:1px solid var(--border); border-radius:12px; background:var(--blanc-casse); color:var(--charbon); outline:none; width:100%; box-sizing:border-box;">
                  <span data-error="${name}" hidden style="font-size:12.5px; color:var(--danger); font-weight:600;">${{
                    firstname: 'Veuillez indiquer votre prénom.',
                    lastname: 'Veuillez indiquer votre nom.',
                    biz: 'Veuillez indiquer votre entreprise.',
                    email: 'Veuillez entrer un courriel valide.',
                    phone: 'Veuillez indiquer votre téléphone.',
                  }[name]}</span>
                </div>`;

  const body = `
      <section style="background:var(--grad-hero); padding:80px 24px 64px; text-align:center;">
        <div style="max-width:720px; margin:0 auto;">
          <span class="eyebrow" style="display:block; margin-bottom:14px;">CONTACT</span>
          <h1 style="font-size:clamp(2.5rem, 3.5vw + 0.8rem, 3.75rem); margin:0 0 18px;">Initiez votre performance numérique.</h1>
          <p class="lead" style="margin:0 auto; max-width:560px;">Remplissez le formulaire et on vous rappelle dans les 24 heures ouvrables.</p>
        </div>
      </section>

      <section class="section" style="background:#fff; padding-top:72px;">
        <div class="section-inner" style="max-width:1000px; display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:48px; align-items:start;">

          <div>
            <div data-contact-success hidden style="background:var(--lavande-50); border:1px solid var(--lavande-200); border-radius:20px; padding:44px; text-align:center; animation: epFadeUp 250ms cubic-bezier(0.2,0.7,0.2,1);">
              <div style="width:56px; height:56px; border-radius:999px; background:var(--violet); color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 18px;">${check(26)}</div>
              <h3 style="margin:0 0 8px; color:var(--violet); font-weight:800;">Demande envoyée&nbsp;!</h3>
              <p style="margin:0; color:var(--charbon-500); font-size:15px; line-height:1.6;">Merci. On vous rappelle dans les 24 heures ouvrables pour planifier un premier appel.</p>
            </div>
            <form style="display:flex; flex-direction:column; gap:18px;" data-contact-form novalidate>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
${field('Prénom', 'firstname', 'text', 'given-name')}
${field('Nom', 'lastname', 'text', 'family-name')}
              </div>
${field('Entreprise', 'biz', 'text', 'organization')}
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
${field('Courriel', 'email', 'email', 'email')}
${field('Téléphone', 'phone', 'tel', 'tel')}
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label for="f-interest" style="font-size:13px; font-weight:700; color:var(--charbon);">Ce qui vous intéresse</label>
                <select id="f-interest" name="interest" style="padding:12px 16px; font:inherit; font-size:15px; border:1px solid var(--border); border-radius:12px; background:var(--blanc-casse); color:var(--charbon); outline:none; appearance:auto;">
                  <option value="Je ne sais pas encore">Je ne sais pas encore</option>
                  <option value="Publicité : Essentiel (695 $/mois)">Publicité : Essentiel (695&nbsp;$/mois)</option>
                  <option value="Publicité : Essentiel Plus (995 $/mois)">Publicité : Essentiel Plus (995&nbsp;$/mois)</option>
                  <option value="Publicité : Essentiel Performance (1 495 $/mois)">Publicité : Essentiel Performance (1&nbsp;495&nbsp;$/mois)</option>
                </select>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label for="f-msg" style="font-size:13px; font-weight:700; color:var(--charbon);">Votre message</label>
                <textarea id="f-msg" name="message" rows="5" placeholder="Parlez-nous de votre entreprise et de vos besoins…" style="padding:12px 16px; font:inherit; font-size:15px; border:1px solid var(--border); border-radius:12px; background:var(--blanc-casse); color:var(--charbon); outline:none; resize:vertical; width:100%; box-sizing:border-box;"></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-lg" style="align-self:flex-start;">Envoyer ma demande →</button>
              <p data-contact-error hidden style="margin:0; font-size:13.5px; color:var(--danger); font-weight:600;">Une erreur est survenue et votre message n'a pas été envoyé. Réessayez dans un moment ou écrivez-nous à info@essentielpme.com.</p>
              <p style="margin:0; font-size:12.5px; color:var(--charbon-300);">En soumettant ce formulaire, vous acceptez notre politique de confidentialité. Vos données ne sont jamais partagées.</p>
            </form>
          </div>

          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:var(--blanc-casse); border:1px solid var(--border); border-radius:20px; padding:30px;">
              <h3 style="margin:0 0 16px; font-size:17px; font-weight:800; color:var(--violet);">Nous joindre</h3>
              <div style="display:flex; flex-direction:column; gap:14px; font-size:14.5px; color:var(--charbon);">
                <div style="display:flex; gap:12px; align-items:center;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><a href="mailto:${SITE.email}" style="color:inherit; border-bottom:none;">${SITE.email}</a></div>
                <div style="display:flex; gap:12px; align-items:center;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><a href="tel:${SITE.phoneIntl}" style="color:inherit; border-bottom:none;">${SITE.phone}</a></div>
                <div style="display:flex; gap:12px; align-items:center;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>${SITE.location}</span></div>
              </div>
            </div>
            <div style="background:var(--violet); color:#fff; border-radius:20px; padding:30px;">
              <h3 style="margin:0 0 10px; font-size:17px; font-weight:800; color:#fff;">Réponse en 24 h</h3>
              <p style="margin:0; font-size:14.5px; line-height:1.65; color:rgba(255,255,255,0.85);">Chaque demande reçoit une réponse d'un humain dans un jour ouvrable. Pas de robot, pas de file d'attente.</p>
            </div>
          </div>
        </div>
      </section>`;

  return shell({
    path: 'contact/index.html', root: '/', active: 'contact', label: 'Contact',
    title: 'Contact — réponse en 24 h ouvrables | Essentiel PME',
    desc: 'Contactez Essentiel PME pour démarrer votre publicité en ligne : formulaire, info@essentielpme.com ou 1-844-763-3832. Réponse d’un humain en 24 heures ouvrables. Québec, QC.',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'ContactPage',
      name: 'Contact — Essentiel PME', url: `${SITE.baseUrl}/contact/`,
    }],
    body,
  });
}

function bloguePage() {
  const imgPh = (label) => `<div aria-hidden="true" style="position:absolute; inset:0; background:var(--grad-hero); display:flex; align-items:center; justify-content:center;"><span style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--violet); background:rgba(255,255,255,0.8); padding:6px 12px; border-radius:999px;">${label}</span></div>`;

  const body = `
      <section style="background:var(--grad-hero); padding:80px 24px 64px; text-align:center;">
        <div style="max-width:720px; margin:0 auto;">
          <span class="eyebrow" style="display:block; margin-bottom:14px;">BLOGUE</span>
          <h1 style="font-size:clamp(2.5rem, 3.5vw + 0.8rem, 3.75rem); margin:0 0 18px;">Des conseils clairs pour votre PME.</h1>
          <p class="lead" style="margin:0 auto; max-width:560px;">Publicité en ligne et présence numérique — expliqués sans jargon, pour des gens occupés.</p>
        </div>
      </section>

      <!-- Article vedette -->
      <section class="section" style="background:#fff; padding-top:72px;">
        <div class="section-inner">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:48px; align-items:center; background:var(--blanc-casse); border:1px solid var(--border); border-radius:24px; padding:40px;">
            <div style="border-radius:16px; overflow:hidden; aspect-ratio:16/10; position:relative;">
              ${imgPh('À venir')}
            </div>
            <div style="display:flex; flex-direction:column; gap:14px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:11.5px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:#fff; background:var(--violet); padding:4px 10px; border-radius:999px;">${blogFeatured.badge}</span>
                <span style="font-size:13px; color:var(--charbon-500);">${blogFeatured.date}</span>
              </div>
              <h2 style="margin:0; font-size:clamp(1.6rem, 1.6vw + 0.8rem, 2.2rem);">${blogFeatured.title}</h2>
              <p style="margin:0; font-size:15px; color:var(--charbon-500); line-height:1.7;">${blogFeatured.excerpt}</p>
              <a href="#" class="btn btn-secondary" style="align-self:flex-start;" onclick="return false;">Lire l'article →</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Grille d'articles -->
      <section class="section" style="background:var(--blanc-casse);">
        <div class="section-inner">
          <div class="section-head">
            <span class="eyebrow">DERNIERS ARTICLES</span>
            <h2>Lire, comprendre, décider.</h2>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:28px;">
${blogArticles.map((a) => `            <article style="background:#fff; border:1px solid var(--border); border-radius:20px; overflow:hidden; display:flex; flex-direction:column;">
              <div style="aspect-ratio:16/9; position:relative;">
                ${imgPh('À venir')}
              </div>
              <div style="padding:24px 26px 26px; display:flex; flex-direction:column; gap:10px; flex:1;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:11.5px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:var(--violet); background:var(--lavande-100); padding:4px 10px; border-radius:999px;">${a.cat}</span>
                  <span style="font-size:12.5px; color:var(--charbon-500);">${a.time}</span>
                </div>
                <h3 style="margin:0; font-size:18px; font-weight:800; color:var(--charbon); line-height:1.35;">${a.title}</h3>
                <p style="margin:0; font-size:14px; color:var(--charbon-500); line-height:1.6; flex:1;">${a.excerpt}</p>
                <span style="font-size:14px; font-weight:700; color:var(--violet);">Lire l'article →</span>
              </div>
            </article>`).join('\n')}
          </div>
          <p style="text-align:center; font-size:13px; color:var(--charbon-300); margin:36px 0 0;">Articles à venir — présentés à titre d'aperçu en attendant le lancement officiel.</p>
        </div>
      </section>

${ctaBand({ h: 'Un conseil utile par mois, pas plus.', p: 'Recevez nos articles par courriel. Pas de pourriel, désabonnement en un clic.', cta: 'S\'abonner à l\'infolettre →', href: '/contact/' })}`;

  return shell({
    path: 'blogue/index.html', root: '/', active: 'aboutGroup', label: 'Blogue',
    title: 'Blogue — conseils publicité en ligne pour PME | Essentiel PME',
    desc: 'Conseils clairs et sans jargon sur la publicité en ligne pour PME québécoises : coûts, Meta vs Google Ads, reciblage, fiche Google et référencement local.',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'Blog',
      name: 'Blogue Essentiel PME', url: `${SITE.baseUrl}/blogue/`, inLanguage: 'fr-CA',
      blogPost: [blogFeatured, ...blogArticles].map((a) => ({ '@type': 'BlogPosting', headline: jsonEsc(a.title) })),
    }],
    body,
  });
}

function plateformesPage() {
  const body = `
      <section style="background:var(--grad-hero); padding:80px 24px 64px; text-align:center;">
        <div style="max-width:760px; margin:0 auto;">
          <h1 style="font-size:clamp(2.5rem, 3.5vw + 0.8rem, 3.75rem); margin:0 0 18px;">Chaque plateforme a sa force.</h1>
          <p class="lead" style="margin:0 auto; max-width:620px;">Toutes sont disponibles dans nos forfaits de publicité en ligne. On sélectionne ensemble celles qui conviennent à votre entreprise et on gère le reste.</p>
        </div>
      </section>

${platforms.map((p, i) => `      <section id="${p.anchor}" style="background:${i % 2 === 0 ? '#fff' : 'var(--blanc-casse)'}; padding:52px 24px;">
        <div style="max-width:860px; margin:0 auto; display:grid; grid-template-columns:96px 1fr; gap:30px; align-items:start;">
          <div style="width:96px; height:96px; border-radius:22px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center;">
            <svg width="38" height="38" viewBox="${p.viewBox}" fill="var(--violet)"><path d="${p.path}"></path></svg>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <h2 style="margin:0; font-size:26px;">${p.label}</h2>
            <p style="margin:0; font-size:15px; color:var(--charbon-500); line-height:1.7;">${p.desc}</p>
            <p style="margin:0; font-size:14px; color:var(--charbon);"><strong style="color:var(--violet);">Idéal pour&nbsp;:</strong> ${p.ideal}</p>
          </div>
        </div>
      </section>`).join('\n\n')}

${ctaBand({ h: 'Pas certain de la bonne plateforme&nbsp;?', p: 'Parlez-nous de votre entreprise&nbsp;: on vous recommande le bon mix, sans jargon.', cta: 'Démarrer mes pubs →', href: '/contact/' })}`;

  return shell({
    path: 'plateformes/index.html', root: '/', active: 'aboutGroup', label: 'Plateformes',
    title: 'Plateformes publicitaires — Meta, Google, LinkedIn, TikTok et plus | Essentiel PME',
    desc: 'Facebook, Instagram, LinkedIn, TikTok, YouTube, Pinterest, Reddit, Spotify, Google Ads et ChatGPT : chaque plateforme a sa force. Toutes incluses dans nos forfaits de publicité en ligne.',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'ItemList',
      name: 'Plateformes publicitaires prises en charge',
      itemListElement: platforms.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.label })),
    }],
    body,
  });
}

/* Mentions légales et confidentialité (conditions, Loi 25, témoins) */
function mentionsLegalesPage() {
  const h2 = (id, t) => `<h2 id="${id}" style="font-size:24px; font-weight:800; color:var(--violet); margin:44px 0 12px;">${t}</h2>`;
  const h3 = (t) => `<h3 style="font-size:17px; font-weight:700; color:var(--charbon); margin:26px 0 8px;">${t}</h3>`;
  const p = (t) => `<p style="margin:0 0 14px; color:var(--charbon-500); line-height:1.7;">${t}</p>`;
  const ul = (items) => `<ul style="margin:0 0 14px 22px; padding:0; color:var(--charbon-500); line-height:1.7;">
            ${items.map((i) => `<li style="margin-bottom:6px;">${i}</li>`).join('\n            ')}
          </ul>`;

  const body = `
      <section style="background:var(--grad-hero); padding:80px 24px 56px; text-align:center;">
        <div style="max-width:760px; margin:0 auto;">
          <p style="margin:0 0 12px; font-weight:800; font-size:13px; letter-spacing:var(--tracking-wide); text-transform:uppercase; color:var(--violet);">Informations légales</p>
          <h1 style="font-size:clamp(2.2rem, 3vw + 0.8rem, 3.2rem); margin:0 0 14px;">Mentions légales et confidentialité</h1>
          <p style="margin:0; color:var(--charbon-500);">Dernière mise à jour&nbsp;: 14 juillet 2026</p>
        </div>
      </section>
      <section class="section" style="background:#fff;">
        <div class="section-inner" style="max-width:760px;">
          ${h2('qui-nous-sommes', '1. Qui nous sommes')}
          ${p('Le site essentielpme.com (le «&nbsp;Site&nbsp;») est exploité par Solutions SuperQuanti inc., faisant affaire sous le nom Essentiel PME, entreprise immatriculée au Registraire des entreprises du Québec sous le numéro 1178979937.')}
          ${ul([
            'Adresse&nbsp;: 6000, boul. de Rome, bureau 300, Brossard (Québec) J4Y 0B6',
            `Courriel&nbsp;: ${SITE.email}`,
            'Téléphone&nbsp;: 1&nbsp;844&nbsp;763-3832',
          ])}
          ${p('Le Site est hébergé par DigitalOcean, LLC, dont le siège est situé à New York (États-Unis).')}

          ${h2('conditions', "2. Conditions d'utilisation")}
          ${h3('2.1 Acceptation')}
          ${p("En consultant le Site, vous acceptez les présentes conditions. Si vous n'êtes pas d'accord, on vous invite simplement à ne pas utiliser le Site.")}
          ${h3('2.2 Prix et offres')}
          ${p("Les prix affichés sur le Site font foi. Ils sont en dollars canadiens et peuvent être modifiés en tout temps&nbsp;; le prix applicable à votre entente est celui confirmé dans votre soumission ou votre contrat. Les informations du Site sont fournies à titre informatif et ne constituent pas une offre contractuelle.")}
          ${h3('2.3 Propriété intellectuelle')}
          ${p('Le contenu du Site — textes, logo, éléments graphiques, maquettes et structure — appartient à Essentiel PME ou à ses concédants. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite. Les marques et logos de tiers (notamment les plateformes publicitaires) appartiennent à leurs propriétaires respectifs.')}
          ${h3('2.4 Limitation de responsabilité')}
          ${p("On s'efforce de maintenir le Site exact et à jour, mais Essentiel PME ne garantit pas que le contenu soit exempt d'erreurs ou que le Site soit accessible sans interruption. Dans la mesure permise par la loi, Essentiel PME décline toute responsabilité pour les dommages découlant de l'utilisation du Site ou de sites tiers vers lesquels il renvoie.")}
          ${h3('2.5 Liens externes')}
          ${p("Le Site peut contenir des liens vers des sites tiers. Ces liens sont fournis pour votre commodité&nbsp;; Essentiel PME n'exerce aucun contrôle sur leur contenu.")}

          ${h2('politique-de-confidentialite', '3. Politique de confidentialité')}
          ${p('Cette section explique comment on recueille, utilise et protège vos renseignements personnels, conformément à la Loi sur la protection des renseignements personnels dans le secteur privé (Québec), telle que modifiée par la Loi 25.')}
          ${h3('3.1 Responsable de la protection des renseignements personnels')}
          <div style="background:var(--lavande-50); border:1px solid var(--lavande-200); border-radius:16px; padding:20px 24px; margin:20px 0;">
            <p style="margin:0; color:var(--charbon); line-height:1.7;"><strong>Benoit Arlabosse</strong><br>
            Responsable de la protection des renseignements personnels<br>
            ${SITE.email} · 1&nbsp;844&nbsp;763-3832</p>
          </div>
          ${h3('3.2 Renseignements recueillis')}
          ${ul([
            "<strong>Ce que vous nous fournissez&nbsp;:</strong> nom, courriel, téléphone, nom d'entreprise et détails de votre demande, lorsque vous remplissez un formulaire ou nous écrivez.",
            "<strong>Ce qui est recueilli automatiquement&nbsp;:</strong> données de navigation (pages visitées, durée, type d'appareil, adresse IP abrégée) via des témoins et outils de mesure décrits à la section 4.",
          ])}
          ${h3('3.3 Finalités')}
          ${p("On utilise vos renseignements uniquement pour&nbsp;: répondre à vos demandes et préparer des soumissions&nbsp;; fournir et facturer nos services&nbsp;; mesurer et améliorer le Site et nos campagnes&nbsp;; respecter nos obligations légales. On ne vend jamais vos renseignements personnels.")}
          ${h3('3.4 Consentement')}
          ${p(`En nous transmettant vos renseignements, vous consentez à leur utilisation pour ces finalités. Vous pouvez retirer votre consentement en tout temps en écrivant à ${SITE.email}&nbsp;; on donnera suite dans les meilleurs délais.`)}
          ${h3('3.5 Communication à des tiers')}
          ${p("Vos renseignements peuvent être traités par des fournisseurs qui nous rendent des services (hébergement, infolettre, mesure d'audience, plateformes publicitaires comme Google et Meta). Certains de ces fournisseurs sont situés à l'extérieur du Québec&nbsp;; le cas échéant, on s'assure que les renseignements bénéficient d'une protection adéquate, conformément à la loi.")}
          ${h3('3.6 Conservation et sécurité')}
          ${p("On conserve vos renseignements le temps nécessaire aux finalités décrites, puis on les détruit ou les anonymise de façon sécuritaire. Des mesures raisonnables — techniques et organisationnelles — protègent vos renseignements contre l'accès, l'utilisation ou la communication non autorisés.")}
          ${h3('3.7 Vos droits')}
          ${p(`Vous pouvez en tout temps&nbsp;: demander l'accès à vos renseignements&nbsp;; en demander la rectification&nbsp;; retirer votre consentement&nbsp;; demander la cessation de leur diffusion&nbsp;; obtenir les renseignements informatisés que vous nous avez fournis dans un format technologique structuré et couramment utilisé, ou en demander le transfert à un autre organisme (droit à la portabilité). On répond à ces demandes dans un délai de 30 jours. Adressez votre demande au responsable identifié ci-dessus. Si vous êtes insatisfait du traitement de votre demande, vous pouvez déposer une plainte auprès de la <a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener">Commission d'accès à l'information du Québec</a>.`)}
          ${h3('3.8 Incident de confidentialité')}
          ${p("En cas d'incident présentant un risque de préjudice sérieux, on avisera les personnes concernées et la Commission d'accès à l'information, comme la loi l'exige.")}

          ${h2('temoins', '4. Témoins (cookies)')}
          ${p('Le Site utilise des témoins et technologies similaires&nbsp;:')}
          ${ul([
            '<strong>Essentiels&nbsp;:</strong> nécessaires au fonctionnement du Site.',
            "<strong>Mesure d'audience&nbsp;:</strong> Google Analytics 4 et Google Tag Manager, pour comprendre l'utilisation du Site.",
            '<strong>Publicité&nbsp;:</strong> pixel Meta et balises Google Ads, pour mesurer nos campagnes et présenter des publicités pertinentes.',
          ])}
          ${p("À votre première visite, un bandeau vous permet d'accepter ou de refuser les témoins non essentiels. Vous pouvez aussi les gérer dans les paramètres de votre navigateur.")}

          ${h2('droit-applicable', '5. Droit applicable')}
          ${p('Le Site et les présentes conditions sont régis par les lois applicables au Québec. Tout litige relève des tribunaux compétents du district judiciaire de Longueuil.')}

          ${h2('nous-joindre', '6. Nous joindre')}
          ${p(`Des questions sur cette page ou sur vos renseignements personnels&nbsp;? Écrivez-nous à ${SITE.email} ou appelez au 1&nbsp;844&nbsp;763-3832. Réponse en 24&nbsp;h. Pas de robot, pas de file d'attente.`)}

          <p style="margin:36px 0 0; padding-top:20px; border-top:1px solid var(--border); font-size:13px; color:var(--charbon-300); line-height:1.7;">En cas de divergence entre la version française et la version anglaise de cette page, la version française prévaut.</p>
        </div>
      </section>`;

  return shell({
    path: 'mentions-legales/index.html', root: '/', active: '',
    label: 'Mentions légales et confidentialité',
    title: 'Mentions légales et confidentialité | Essentiel PME',
    desc: "Mentions légales, conditions d'utilisation, politique de confidentialité (Loi 25) et politique de témoins d'Essentiel PME.",
    body,
  });
}

/* ================= SEO files ================= */

function sitemap(paths) {
  const urls = paths.map((p) => `  <url>
    <loc>${SITE.baseUrl}/${p}</loc>
    <lastmod>${SITE.lastmod}</lastmod>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE.baseUrl}/</loc>
    <lastmod>${SITE.lastmod}</lastmod>
  </url>
${urls}
</urlset>
`;
}

const robots = `User-agent: *
Allow: /
# Lien technique injecté par Cloudflare (protection des courriels), pas une page du site
Disallow: /cdn-cgi/

Sitemap: ${SITE.baseUrl}/sitemap.xml
`;

const llms = `# Essentiel PME

> Essentiel PME (EN : SMB Essentials) offre de la publicité en ligne entièrement gérée pour les PME du Québec.
> Prix fixes affichés, service bilingue FR/EN, réponse en 24 heures ouvrables.

## Services

- Publicité en ligne gérée de A à Z : configuration des comptes, pixels et audiences, rédaction des annonces (FR/EN), optimisation et rapport mensuel.
- Forfaits : Essentiel 695 $/mois (1 plateforme) · Essentiel Plus 995 $/mois (2 plateformes, reciblage, tests A/B) · Essentiel Performance 1 495 $/mois (3 plateformes, tableau de bord temps réel).
- Frais d'installation unique : 600 $. Minimum 3 mois, puis mensuel avec préavis de 30 jours. Le budget média est payé directement aux plateformes.
- Plateformes prises en charge : Facebook, Instagram, LinkedIn, TikTok, YouTube, Pinterest, Reddit, Spotify, Google Ads, ChatGPT.

## Pages

- [Accueil](${SITE.baseUrl}/) : présentation des services, forfaits, témoignages, FAQ.
- [Publicité en ligne](${SITE.baseUrl}/publicite/) : les 3 forfaits en détail, inclusions et plateformes.
- [Plateformes](${SITE.baseUrl}/plateformes/) : description de chaque plateforme publicitaire et pour qui elle convient.
- [À propos](${SITE.baseUrl}/a-propos/) : mission, valeurs et processus en 6 étapes.
- [Blogue](${SITE.baseUrl}/blogue/) : conseils publicité en ligne pour PME (articles à venir).
- [Contact](${SITE.baseUrl}/contact/) : formulaire, ${SITE.email}, ${SITE.phone}, ${SITE.location}.

## Industries desservies

${industries.map((i) => `- [${i.label}](${SITE.baseUrl}/industries/${i.key}/) : ${jsonEsc(i.intro)}`).join('\n')}

## Coordonnées

- Courriel : ${SITE.email}
- Téléphone : ${SITE.phone}
- Emplacement : ${SITE.location}
- Facebook : ${SITE.social.facebook}
- Instagram : ${SITE.social.instagram}
- LinkedIn : ${SITE.social.linkedin}
- En association avec SuperQuanti : ${SITE.superquanti}
`;

/* ================= traduction EN (pages statiques /en/…) ================= */

const decodeEnt = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const encodeEnt = (s) => s.replace(/&/g, '&amp;');

function trText(txt) {
  const en = DICT[norm(decodeEnt(txt))];
  if (en == null) return txt;
  return txt.match(/^\s*/)[0] + encodeEnt(en) + txt.match(/\s*$/)[0];
}

/* Produit la version anglaise d'une page française générée. */
function toEnglish(html, pagePath) {
  const frCanon = `${SITE.baseUrl}${pagePath}`;
  const enCanon = `${SITE.baseUrl}/en${pagePath}`;

  // 1. Protéger les <script> (JSON-LD, GTM) de la traduction
  const guards = [];
  html = html.replace(/<script[\s\S]*?<\/script>/g, (m) => `@@SCRIPT${guards.push(m) - 1}@@`);

  // 2. Nœuds texte (entre balises)
  html = html.replace(/>([^<]+)</g, (m, txt) => (txt.trim() ? `>${trText(txt)}<` : m));

  // 3. Attributs traduisibles
  html = html.replace(/(placeholder|alt|aria-label|title)="([^"]*)"/g, (m, attr, val) => {
    const en = DICT[norm(decodeEnt(val))];
    return en == null ? m : `${attr}="${encodeEnt(en).replace(/"/g, '&quot;')}"`;
  });

  // 4. Métadonnées (title, descriptions, OG)
  html = html.replace(/<title>([^<]*)<\/title>/, (m, t) => `<title>${META_EN[norm(decodeEnt(t))] || t}</title>`);
  html = html.replace(/((?:name="description"|property="og:title"|property="og:description") content=")([^"]*)"/g,
    (m, pre, val) => {
      const en = META_EN[norm(decodeEnt(val))] || DICT[norm(decodeEnt(val))];
      return en == null ? m : `${pre}${encodeEnt(en).replace(/"/g, '&quot;')}"`;
    });

  // 5. Langue, locale, logos, canonique
  html = html.replace('<html lang="fr">', '<html lang="en">');
  html = html.replace('property="og:locale" content="fr_CA"', 'property="og:locale" content="en_CA"');
  html = html.replace(/logo-h-fr-(rgb|white)\.svg/g, 'logo-h-en-$1.svg');
  html = html.replace(`<link rel="canonical" href="${frCanon}">`, `<link rel="canonical" href="${enCanon}">`);
  html = html.replace(`property="og:url" content="${frCanon}"`, `property="og:url" content="${enCanon}"`);

  // 6. Liens internes → /en/… (sauf assets, api et liens déjà /en/)
  html = html.replace(/href="\/(?!assets\/|api\/|en\/|en")/g, 'href="/en/');

  // 7. Bascule de langue : FR redevient un lien vers la version française, EN devient actif
  html = html.replace(/<a data-lang-link="fr" href="\/en/, '<a data-lang-link="fr" href="');
  html = html.replace(' data-lang-link="fr" ', ' data-lang-link="fr-x" ');
  html = html.replace(/ data-lang-link="fr-x" (href="[^"]*") class="active"/, ' data-lang-link="fr" $1');
  html = html.replace(/ data-lang-link="en" (href="[^"]*")/, ' data-lang-link="en" $1 class="active"');

  // 8. Restaurer les scripts
  html = html.replace(/@@SCRIPT(\d+)@@/g, (m, i) => guards[+i]);
  return html;
}

/* ================= emit ================= */

const pages = [
  ['index.html', homePage()],
  ['publicite/index.html', publicitePage()],
  ['plateformes/index.html', plateformesPage()],
  ['a-propos/index.html', aboutPage()],
  ['contact/index.html', contactPage()],
  ['blogue/index.html', bloguePage()],
  ['mentions-legales/index.html', mentionsLegalesPage()],
  ...industries.map((ind) => [`industries/${ind.key}/index.html`, industryPage(ind)]),
];

for (const [p, html] of pages) {
  const pagePath = '/' + p.replace(/index\.html$/, '');
  mkdirSync(dirname(join(OUT, p)), { recursive: true });
  writeFileSync(join(OUT, p), html);
  const en = toEnglish(html, pagePath);
  mkdirSync(dirname(join(OUT, 'en', p)), { recursive: true });
  writeFileSync(join(OUT, 'en', p), en);
  console.log('wrote', p, `(${html.length} o)`, '+ en/' + p, `(${en.length} o)`);
}

const sitemapPaths = pages
  .map(([p]) => p.replace(/index\.html$/, ''))
  .flatMap((p) => (p === '' ? ['en/'] : [p, 'en/' + p]));
writeFileSync(join(OUT, 'sitemap.xml'), sitemap(sitemapPaths));
writeFileSync(join(OUT, 'robots.txt'), robots);
writeFileSync(join(OUT, 'llms.txt'), llms);
console.log('wrote sitemap.xml, robots.txt, llms.txt');
