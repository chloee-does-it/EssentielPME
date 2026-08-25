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

/* GTM chargé via dat.essentielpme.com (tagging côté serveur) : le code du
   chargeur vient tel quel de l'interface GTM, ne pas le modifier. Le réglage
   par défaut du Consent Mode doit rester AVANT le chargeur, sinon les tags
   partent avant de connaître l'état de consentement. */
const GTM_HEAD = `  <script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied'});</script>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://dat.essentielpme.com/66wtexrcmh.js?"+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','dmjkrd5=AQleNSwoWTk%2FKyBGMC0uUR5QUVxJQxAZVQgQAR0LAB4NARMfHUsXGAU%3D');</script>
  <!-- End Google Tag Manager -->`;

const GTM_NOSCRIPT = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://dat.essentielpme.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

/* `inline` produit la variante non bloquante utilisée sur les landing pages :
   même contenu et mêmes choix, mais en bandeau au bas de l'écran, sans
   assombrissement ni verrou de défilement. Le trafic publicitaire atteint
   l'offre et le formulaire tout de suite ; un visiteur qui ne répond pas
   laisse quand même son inscription, au lieu d'être perdu. */
const consentUI = (root, inline) => `<div class="consent-overlay${inline ? ' consent-inline' : ''}" data-consent-banner${inline ? ' data-consent-inline' : ''} hidden>
  <div class="consent-banner" role="dialog"${inline ? '' : ' aria-modal="true"'} aria-labelledby="consent-title">
    <h3 id="consent-title">Votre expérience, vos choix</h3>
    <div data-consent-main>
      <p>On utilise trois types de témoins&nbsp;: <strong>fonctionnels</strong>, <strong>analytiques</strong> et <strong>publicitaires</strong>, pour offrir la meilleure expérience possible et améliorer nos services. Détails dans notre <a href="${root}mentions-legales/#temoins">politique de témoins</a>.</p>
      <div class="consent-actions">
        <button type="button" data-consent-customize>Personnaliser</button>
        <button type="button" data-consent-accept>Tout accepter</button>
      </div>
    </div>
    <div data-consent-panel hidden style="display:none;">
      <div class="consent-choices">
        <label><input type="checkbox" checked disabled> <span><strong>Fonctionnels</strong> : nécessaires au fonctionnement du site (toujours actifs)</span></label>
        <label><input type="checkbox" data-consent-analytics checked> <span><strong>Analytiques</strong> : nous aident à comprendre comment le site est utilisé, pour l'améliorer</span></label>
        <label><input type="checkbox" data-consent-ads checked> <span><strong>Publicitaires</strong> : servent à mesurer l'efficacité de nos publicités et à les rendre plus pertinentes</span></label>
      </div>
      <div class="consent-actions">
        <button type="button" data-consent-optional-refuse>Refuser les témoins optionnels</button>
        <button type="button" data-consent-save>Confirmer mes choix</button>
      </div>
    </div>
  </div>
</div>
<button type="button" class="consent-reopen" data-consent-reopen aria-label="Gérer les témoins" title="Gérer les témoins">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><circle cx="8.5" cy="8.5" r="0.8" fill="currentColor"></circle><circle cx="16" cy="15.5" r="0.8" fill="currentColor"></circle><circle cx="9" cy="15" r="0.8" fill="currentColor"></circle><circle cx="12.5" cy="11" r="0.8" fill="currentColor"></circle></svg>
</button>`;




/* Slugs anglais des pages (les URLs /en/ utilisent des mots anglais) */
const EN_SLUGS = {
  'publicite': 'advertising',
  'plateformes': 'platforms',
  'a-propos': 'about',
  'contact': 'contact',
  'blogue': 'blog',
  'mentions-legales': 'legal',
  'publicite-en-ligne': 'online-advertising',
  'mesurer-ses-resultats': 'measuring-your-results',
  'industries/construction': 'industries/construction',
  'industries/sante': 'industries/healthcare',
  'industries/beaute': 'industries/beauty',
  'industries/restauration': 'industries/restaurants',
  'industries/services-pro': 'industries/professional-services',
  'industries/ecommerce': 'industries/ecommerce',
};

/* '/publicite/' → '/en/advertising/' ; '/' → '/en/' */
function enPagePathOf(pagePath) {
  const slug = pagePath.replace(/^\//, '').replace(/\/$/, '');
  const en = EN_SLUGS[slug] !== undefined ? EN_SLUGS[slug] : slug;
  return '/en/' + (en ? en + '/' : '');
}

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

function header(active, root, pagePath, enPagePath) {
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
      <a href="${root}" class="we-logo" style="border-bottom:none;" aria-label="Essentiel PME (Accueil)">
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
${drop('Ressources', `${root}publicite-en-ligne/`, active === 'guides', [
    { label: 'Publicité en ligne : le guide', href: `${root}publicite-en-ligne/` },
    { label: 'Mesurer ses résultats', href: `${root}mesurer-ses-resultats/` },
  ])}
        <a href="${root}contact/"${a('contact')}>Contact</a>
      </nav>
      <div class="we-header-right">
        <div class="we-lang-toggle">
          <a data-lang-link="fr" href="${pagePath}" class="active" hreflang="fr-CA">FR</a>
          <span class="sep">·</span>
          <a data-lang-link="en" href="${enPagePath}" hreflang="en-CA">EN</a>
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
        <span class="grouplabel">Ressources</span>
        <a class="sub" href="${root}publicite-en-ligne/">Publicité en ligne : le guide</a>
        <a class="sub" href="${root}mesurer-ses-resultats/">Mesurer ses résultats</a>
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
        <img src="${root}assets/img/logo-h-fr-white.svg" alt="Essentiel PME" style="filter:none; height:32px;">
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
        <h4>Ressources</h4>
        <ul>
          <li><a href="${root}publicite-en-ligne/">Publicité en ligne : le guide</a></li>
          <li><a href="${root}mesurer-ses-resultats/">Mesurer ses résultats</a></li>
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

function shell({ path, title, desc, active, jsonld = [], body, label, frOnly = false }) {
  const root = '/';
  const pagePath = '/' + path.replace(/index\.html$/, '');
  const enPagePath = frOnly ? '/en/' : enPagePathOf(pagePath);
  const canonical = `${SITE.baseUrl}${pagePath}`;
  const org = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: SITE.name, alternateName: SITE.nameEn, url: SITE.baseUrl + '/',
    logo: `${SITE.baseUrl}/assets/img/logo-h-fr-rgb.svg`,
    email: SITE.email, telephone: SITE.phoneIntl,
    founder: { '@type': 'Person', name: 'Benoit Arlabosse', sameAs: ['https://www.linkedin.com/in/benoitarlabosse/'] },
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
  <link rel="alternate" hreflang="fr-CA" href="${canonical}">${frOnly ? '' : `
  <link rel="alternate" hreflang="en-CA" href="${SITE.baseUrl}${enPagePath}">`}
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
${GTM_HEAD}
${blocks}
</head>
<body>
${GTM_NOSCRIPT}
<div class="we-page">
${header(active, root, pagePath, enPagePath)}
  <main id="contenu" data-screen-label="${label}" style="animation: epFadeUp 300ms cubic-bezier(0.2,0.7,0.2,1);">
${body}
  </main>
${footer(root)}
</div>
${consentUI(root)}
<script src="${root}assets/js/config.js"></script>
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
              <div class="pkg-price">${p.price}<small> $&nbsp;/&nbsp;mois</small></div>
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
              <div style="flex:1; background:#fff; display:flex; flex-direction:column; overflow:hidden;">
                <!-- barre de navigation du mini-site -->
                <div style="display:flex; align-items:center; gap:8px; padding:10px 16px; border-bottom:1px solid var(--lavande-100); flex:none;">
                  <span style="width:16px; height:16px; border-radius:5px; background:var(--violet); flex:none;"></span>
                  <span style="width:52px; height:8px; border-radius:999px; background:var(--charbon); opacity:0.75;"></span>
                  <span style="flex:1;"></span>
                  <span style="width:30px; height:7px; border-radius:999px; background:var(--lavande-200);"></span>
                  <span style="width:30px; height:7px; border-radius:999px; background:var(--lavande-200);"></span>
                  <span style="width:30px; height:7px; border-radius:999px; background:var(--lavande-200);"></span>
                  <span style="width:54px; height:20px; border-radius:999px; background:var(--violet);"></span>
                </div>
                <!-- hero du mini-site : texte + visuel -->
                <div style="display:grid; grid-template-columns:1.15fr 1fr; gap:14px; padding:16px; background:linear-gradient(160deg,#fff 0%,#F3F0FF 100%);">
                  <div style="display:flex; flex-direction:column; gap:8px; justify-content:center;">
                    <div style="width:88%; height:14px; background:var(--violet); border-radius:6px;"></div>
                    <div style="width:64%; height:14px; background:var(--violet); border-radius:6px; opacity:0.8;"></div>
                    <div style="width:92%; height:8px; background:var(--lavande-200); border-radius:6px; margin-top:4px;"></div>
                    <div style="width:70%; height:8px; background:var(--lavande-100); border-radius:6px;"></div>
                    <div style="display:flex; gap:8px; margin-top:8px;">
                      <span style="width:76px; height:26px; background:var(--violet); border-radius:999px;"></span>
                      <span style="width:76px; height:26px; background:#fff; border:1.5px solid var(--lavande-200); border-radius:999px;"></span>
                    </div>
                  </div>
                  <div style="border-radius:12px; background:linear-gradient(145deg, var(--lavande-200) 0%, var(--violet) 115%); position:relative; overflow:hidden; min-height:104px;">
                    <span style="position:absolute; top:12px; right:14px; width:26px; height:26px; border-radius:999px; background:rgba(255,255,255,0.85);"></span>
                    <span style="position:absolute; bottom:-16px; left:-12px; width:75%; height:60%; background:rgba(255,255,255,0.35); border-radius:999px 999px 0 0; transform:rotate(-8deg);"></span>
                    <span style="position:absolute; bottom:-20px; right:-16px; width:70%; height:55%; background:rgba(75,46,131,0.45); border-radius:999px 999px 0 0; transform:rotate(10deg);"></span>
                  </div>
                </div>
                <!-- rangée de services -->
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; padding:2px 16px 12px; background:linear-gradient(180deg,#F3F0FF 0%,#fff 60%);">
                  ${['var(--lavande-100)', 'var(--violet-50, #EFEDFB)', 'var(--lavande-50)'].map((bg, i) => `<div style="background:#fff; border:1px solid var(--lavande-100); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px;">
                    <span style="width:22px; height:22px; border-radius:7px; background:${bg}; display:flex; align-items:center; justify-content:center;"><span style="width:10px; height:10px; border-radius:3px; background:var(--violet); opacity:${0.55 + i * 0.2};"></span></span>
                    <span style="width:80%; height:7px; border-radius:999px; background:var(--charbon); opacity:0.6;"></span>
                    <span style="width:95%; height:6px; border-radius:999px; background:var(--lavande-200);"></span>
                    <span style="width:65%; height:6px; border-radius:999px; background:var(--lavande-100);"></span>
                  </div>`).join('\n                  ')}
                </div>
                <!-- bande de statistiques -->
                <div style="margin-top:auto; background:var(--violet); display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; padding:12px 16px; flex:none;">
                  ${[68, 82, 58].map((w) => `<div style="display:flex; flex-direction:column; gap:5px; align-items:center;">
                    <span style="width:${w}%; height:11px; border-radius:999px; background:#fff;"></span>
                    <span style="width:${w - 20}%; height:6px; border-radius:999px; background:var(--lavande-300, #C9C2F2); opacity:0.75;"></span>
                  </div>`).join('\n                  ')}
                </div>
              </div>
            </div>
            <div class="illu-card illu-floating-3" style="display:flex; align-items:center; gap:10px; padding:12px 14px;">
              <div style="display:flex; gap:2px; color:#F5A623; font-size:15px; letter-spacing:1px;">★★★★★</div>
              <div style="font-size:12px; font-weight:700; color:var(--charbon-500); white-space:nowrap;">Avis 5 étoiles</div>
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
    title: 'Essentiel PME | Publicité en ligne gérée pour les PME du Québec',
    desc: 'Publicité en ligne gérée de A à Z pour les PME québécoises : Meta, Google, LinkedIn, TikTok et plus. Prix fixes à partir de 695 $&nbsp;/&nbsp;mois, bilingue FR/EN, réponse en 24 h.',
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
          <p style="text-align:center; margin:28px 0 0; font-size:15px; color:var(--charbon-500);">Envie de comprendre les coûts, les plateformes et les délais avant de choisir&nbsp;? <a href="/publicite-en-ligne/" style="font-weight:700;">Le guide complet de la publicité en ligne →</a></p>
        </div>
      </section>

${ctaBand({ h: 'Prêt à démarrer vos pubs&nbsp;?', p: 'On configure tout&nbsp;: comptes, pixels et audiences.', cta: 'Démarrer mes pubs →', href: '/contact/' })}`;

  return shell({
    path: 'publicite/index.html', root, active: 'ads', label: 'Publicité',
    title: 'Forfaits Essentiel, Essentiel Plus et Essentiel Performance | Essentiel PME',
    desc: 'Trois forfaits de publicité en ligne gérée pour PME : Essentiel 695 $&nbsp;/&nbsp;mois, Essentiel Plus 995 $&nbsp;/&nbsp;mois, Essentiel Performance 1 495 $&nbsp;/&nbsp;mois. Toutes les plateformes, rédaction FR/EN, rapports clairs.',
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
              <a href="${root}contact/" class="btn btn-primary" style="align-self:flex-start; margin-top:4px;">Démarrer ma pub en ligne →</a>
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
    title: 'À propos : mission, valeurs et processus | Essentiel PME',
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
          <p class="lead" style="margin:0 auto; max-width:560px;">Choisissez le moment qui vous convient et parlons de votre entreprise. Sans engagement.</p>
        </div>
      </section>

      <section class="section" style="background:#fff; padding-top:72px;">
        <div class="section-inner" style="max-width:860px;">

          <div style="background:var(--blanc-casse); border:1px solid var(--border); border-radius:24px; padding:44px 40px; text-align:center;">
            <span class="eyebrow" style="display:block; margin-bottom:14px;">RENDEZ-VOUS</span>
            <h2 style="margin:0 0 14px; font-size:clamp(1.6rem, 1.6vw + 1rem, 2.1rem); color:var(--violet);">Réservez votre appel découverte</h2>
            <p style="margin:0 auto 30px; max-width:520px; font-size:16px; line-height:1.7; color:var(--charbon-500);">Un appel avec un humain pour comprendre vos objectifs et vous dire franchement si on peut vous aider. Aucune pression, aucun engagement.</p>

            <div style="display:flex; flex-direction:column; gap:12px; max-width:440px; margin:0 auto 32px; text-align:left;">
${['On écoute vos objectifs et votre réalité de PME.',
   'On regarde ce qui fonctionne déjà dans votre secteur.',
   'On vous dit clairement si la publicité en ligne est le bon investissement pour vous.']
  .map((t) => `              <div style="display:flex; gap:12px; align-items:flex-start; font-size:15px; line-height:1.6; color:var(--charbon);"><span style="flex:none; width:22px; height:22px; border-radius:999px; background:var(--violet); color:#fff; display:flex; align-items:center; justify-content:center; margin-top:1px;">${check(13)}</span><span>${t}</span></div>`).join('\n')}
            </div>

            <div style="background:#fff; border:1px solid var(--border); border-radius:16px; overflow:hidden;">
              <iframe src="${SITE.bookingEmbed}" title="Calendrier de réservation d’Essentiel PME" loading="lazy" style="border:0; display:block; width:100%; height:720px;"></iframe>
            </div>
            <p style="margin:16px 0 0; font-size:13px; color:var(--charbon-300);">Le calendrier ne s’affiche pas&nbsp;? <a href="${SITE.booking}" target="_blank" rel="noopener" data-booking>Ouvrez-le dans un nouvel onglet</a>.</p>
          </div>

          <div style="margin-top:44px; text-align:center;">
            <h3 style="margin:0 0 8px; font-size:19px; font-weight:800; color:var(--charbon);">Vous préférez nous joindre directement&nbsp;?</h3>
            <p style="margin:0 0 26px; font-size:15px; color:var(--charbon-500);">Écrivez-nous ou appelez-nous. Une réponse d’un humain dans un jour ouvrable.</p>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:18px;">
              <a href="mailto:${SITE.email}" style="display:flex; flex-direction:column; align-items:center; gap:10px; background:#fff; border:1px solid var(--border); border-radius:20px; padding:28px 24px; border-bottom:1px solid var(--border); color:inherit;">
                <span style="width:46px; height:46px; border-radius:999px; background:var(--lavande-100); color:var(--violet); display:flex; align-items:center; justify-content:center;"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></span>
                <span style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--charbon-300);">Courriel</span>
                <strong style="font-size:16.5px; font-weight:800; color:var(--violet); overflow-wrap:anywhere;">${SITE.email}</strong>
              </a>
              <a href="tel:${SITE.phoneIntl}" style="display:flex; flex-direction:column; align-items:center; gap:10px; background:#fff; border:1px solid var(--border); border-radius:20px; padding:28px 24px; border-bottom:1px solid var(--border); color:inherit;">
                <span style="width:46px; height:46px; border-radius:999px; background:var(--lavande-100); color:var(--violet); display:flex; align-items:center; justify-content:center;"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span>
                <span style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--charbon-300);">Téléphone</span>
                <strong style="font-size:16.5px; font-weight:800; color:var(--violet);">${SITE.phone}</strong>
              </a>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:14px; align-items:center; justify-content:center; margin-top:30px; padding-top:26px; border-top:1px solid var(--border);">
              <span style="display:flex; gap:8px; align-items:center; font-size:14px; color:var(--charbon-500);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${SITE.location}</span>
              <span style="font-size:13px; font-weight:700; color:var(--charbon-500); margin-left:6px;">Suivez-nous&nbsp;:</span>
              <a href="${SITE.social.facebook}" target="_blank" rel="noopener" title="Facebook" style="width:36px; height:36px; border-radius:999px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center; border-bottom:none;">${socialIcon('facebook')}</a>
              <a href="${SITE.social.instagram}" target="_blank" rel="noopener" title="Instagram" style="width:36px; height:36px; border-radius:999px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center; border-bottom:none;">${socialIcon('instagram')}</a>
              <a href="${SITE.social.linkedin}" target="_blank" rel="noopener" title="LinkedIn" style="width:36px; height:36px; border-radius:999px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center; border-bottom:none;">${socialIcon('linkedin')}</a>
            </div>
          </div>

        </div>
      </section>`;

  return shell({
    path: 'contact/index.html', root: '/', active: 'contact', label: 'Contact',
    title: 'Contact : réponse en 24 h ouvrables | Essentiel PME',
    desc: 'Réservez un appel découverte avec Essentiel PME, ou joignez-nous à info@essentielpme.com ou au 1-844-763-3832. Réponse d’un humain en 24 heures ouvrables. Québec, QC.',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'ContactPage',
      name: 'Contact | Essentiel PME', url: `${SITE.baseUrl}/contact/`,
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
          <p class="lead" style="margin:0 auto; max-width:560px;">Publicité en ligne et présence numérique, expliqués sans jargon, pour des gens occupés.</p>
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
          <p style="text-align:center; font-size:13px; color:var(--charbon-300); margin:36px 0 0;">Articles à venir, présentés à titre d'aperçu en attendant le lancement officiel.</p>
        </div>
      </section>

${ctaBand({ h: 'Un conseil utile par mois, pas plus.', p: 'Recevez nos articles par courriel. Pas de pourriel, désabonnement en un clic.', cta: 'S\'abonner à l\'infolettre →', href: '/contact/' })}`;

  return shell({
    path: 'blogue/index.html', root: '/', active: 'aboutGroup', label: 'Blogue',
    title: 'Blogue : conseils publicité en ligne pour PME | Essentiel PME',
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

      <section class="section" style="background:#fff;">
        <div class="section-inner" style="max-width:1100px;">
          <div class="plat-grid">
${platforms.map((p) => `            <div class="plat-card" id="${p.anchor}">
              <div style="display:flex; align-items:center; gap:14px;">
                <div style="width:54px; height:54px; border-radius:15px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center; flex:none;">
                  <svg width="24" height="24" viewBox="${p.viewBox}" fill="var(--violet)"><path d="${p.path}"></path></svg>
                </div>
                <h2 style="margin:0; font-size:19px;">${p.label}</h2>
              </div>
              <p style="margin:0; font-size:14.5px; color:var(--charbon-500); line-height:1.6; flex:1;">${p.hook}</p>
              <button type="button" class="plat-more" data-plat-open="${p.key}">Plus de détails →</button>
              <div data-plat-details="${p.key}" hidden>
                <div style="display:flex; align-items:center; gap:16px; margin-bottom:14px;">
                  <div style="width:60px; height:60px; border-radius:16px; background:var(--lavande-100); display:flex; align-items:center; justify-content:center; flex:none;">
                    <svg width="26" height="26" viewBox="${p.viewBox}" fill="var(--violet)"><path d="${p.path}"></path></svg>
                  </div>
                  <h2 style="margin:0; font-size:24px;">${p.label}</h2>
                </div>
                <p style="margin:0 0 18px; font-size:15px; color:var(--charbon-500); line-height:1.7;">${p.desc}</p>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; align-items:start;">
                  <div>
                    <h3 style="margin:0 0 10px; font-size:13px; font-weight:800; letter-spacing:var(--tracking-wide); text-transform:uppercase; color:var(--violet);">Pourquoi ça fonctionne</h3>
                    <ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:9px;">
                      ${p.atouts.map((a) => `<li style="display:flex; gap:10px; align-items:flex-start; font-size:14px; color:var(--charbon-500); line-height:1.6;">${check(15, 'var(--violet)', 'flex:none; margin-top:3px;')}<span>${a}</span></li>`).join('\n                      ')}
                    </ul>
                  </div>
                  <div style="background:var(--lavande-50); border:1px solid var(--lavande-100); border-radius:16px; padding:18px 20px; display:flex; flex-direction:column; gap:12px; font-size:13.5px; line-height:1.6; color:var(--charbon-500);">
                    <div><strong style="display:block; color:var(--violet); font-size:12px; letter-spacing:var(--tracking-wide); text-transform:uppercase; margin-bottom:2px;">Formats d'annonces</strong>${p.formats}</div>
                    <div><strong style="display:block; color:var(--violet); font-size:12px; letter-spacing:var(--tracking-wide); text-transform:uppercase; margin-bottom:2px;">Objectifs typiques</strong>${p.objectifs}</div>
                    <div><strong style="display:block; color:var(--violet); font-size:12px; letter-spacing:var(--tracking-wide); text-transform:uppercase; margin-bottom:2px;">Idéal pour</strong>${p.ideal}</div>
                  </div>
                </div>
                <div style="margin-top:22px; display:flex; justify-content:flex-end;">
                  <a href="/contact/" class="btn btn-primary">Démarrer mes pubs →</a>
                </div>
              </div>
            </div>`).join('\n')}
          </div>
        </div>
      </section>

      <div class="plat-overlay" data-plat-modal hidden>
        <div class="plat-modal" role="dialog" aria-modal="true" aria-label="Détails de la plateforme">
          <button type="button" class="plat-close" data-plat-close aria-label="Fermer">×</button>
          <div data-plat-content></div>
        </div>
      </div>

${ctaBand({ h: 'Pas certain de la bonne plateforme&nbsp;?', p: 'Parlez-nous de votre entreprise&nbsp;: on vous recommande le bon mix, sans jargon.', cta: 'Démarrer mes pubs →', href: '/contact/' })}`;

  return shell({
    path: 'plateformes/index.html', root: '/', active: 'aboutGroup', label: 'Plateformes',
    title: 'Plateformes publicitaires : Meta, Google, LinkedIn, TikTok et plus | Essentiel PME',
    desc: 'Facebook, Instagram, LinkedIn, TikTok, YouTube, Pinterest, Reddit, Spotify, Google Ads et ChatGPT : chaque plateforme a sa force. Toutes incluses dans nos forfaits de publicité en ligne.',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'ItemList',
      name: 'Plateformes publicitaires prises en charge',
      itemListElement: platforms.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.label })),
    }],
    body,
  });
}

/* ================= pages piliers (contenu SEO long format, FR seulement) ================= */

const pilH2 = (id, t) => `<h2 id="${id}" style="font-size:26px; font-weight:800; color:var(--violet); margin:52px 0 14px;">${t}</h2>`;
const pilH3 = (t) => `<h3 style="font-size:17px; font-weight:800; color:var(--charbon); margin:26px 0 8px;">${t}</h3>`;
const pilP = (t) => `<p style="margin:0 0 15px; color:var(--charbon-500); font-size:15.5px; line-height:1.75;">${t}</p>`;

const pilTable = (headers, rows) => `<div style="overflow-x:auto; margin:6px 0 18px;"><table style="border-collapse:collapse; width:100%; min-width:640px; font-size:14px; line-height:1.55; color:var(--charbon-500);">
            <thead><tr>${headers.map((h) => `<th style="text-align:left; padding:11px 14px; background:var(--lavande-50); color:var(--violet); font-size:12px; text-transform:uppercase; letter-spacing:var(--tracking-wide); border-bottom:2px solid var(--lavande-200); white-space:nowrap;">${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td style="padding:11px 14px; border-bottom:1px solid var(--border); vertical-align:top;">${c}</td>`).join('')}</tr>`).join('\n            ')}</tbody>
          </table></div>`;

const pilCallout = (t) => `<div style="background:var(--lavande-50); border:1px solid var(--lavande-200); border-radius:16px; padding:20px 24px; margin:0 0 18px; font-size:15px; line-height:1.7; color:var(--charbon);">${t}</div>`;

const pilSecteurs = (intro) => `${pilP(intro)}
          <div style="display:flex; flex-wrap:wrap; gap:10px; margin:0 0 8px;">
            ${industries.map((i) => `<a href="/industries/${i.key}/" style="font-size:13.5px; font-weight:700; background:var(--lavande-50); border:1px solid var(--lavande-100); border-radius:999px; padding:9px 16px; color:var(--violet); border-bottom:1px solid var(--lavande-100);">${i.label}</a>`).join('\n            ')}
          </div>`;

const pilAuthor = `<div style="margin-top:44px; padding:20px 24px; background:var(--blanc-casse); border:1px solid var(--border); border-radius:16px; font-size:13.5px; color:var(--charbon-500); line-height:1.7;">
            <strong style="color:var(--charbon);">Rédigé par Benoit Arlabosse, fondateur d'Essentiel PME</strong>. Plus de 15 ans en marketing numérique et gestion de publicité en ligne pour des entreprises québécoises, des PME aux grands comptes. <a href="https://www.linkedin.com/in/benoitarlabosse/" target="_blank" rel="noopener">LinkedIn</a> · Dernière révision&nbsp;: 15 juillet 2026 · Fourchettes de coûts&nbsp;: données internes Essentiel PME (comptes gérés 2025-2026) et documentations officielles des plateformes.
          </div>`;

const pilAuthorEN = `<div style="margin-top:44px; padding:20px 24px; background:var(--blanc-casse); border:1px solid var(--border); border-radius:16px; font-size:13.5px; color:var(--charbon-500); line-height:1.7;">
            <strong style="color:var(--charbon);">Written by Benoit Arlabosse, founder of SMB Essentials</strong>. 15+ years in digital marketing and online advertising management for Quebec businesses, from SMBs to major accounts. <a href="https://www.linkedin.com/in/benoitarlabosse/" target="_blank" rel="noopener">LinkedIn</a> · Last revised: July 15, 2026 · Cost ranges: SMB Essentials internal data (managed accounts, 2025-2026) and official platform documentation.
          </div>`;

const PIL_CTA_FR = { h: 'Les prix sont affichés. Le reste aussi.', p: "On s'occupe de votre publicité et de votre suivi. Réponse d'un humain en 24 heures ouvrables.", cta: 'Parler de mon projet →', href: '/contact/' };
const PIL_CTA_EN = { h: 'Our prices are published. So is everything else.', p: 'We manage your advertising and your tracking. A reply from a human within 24 business hours.', cta: 'Talk about my project →', href: '/contact/' };

function pilierShell({ path, title, desc, h1, answerBox, toc, content, faq, faqPrefix, label, eyebrow = 'LE GUIDE', faqTitle = 'FAQ', author = pilAuthor, cta = PIL_CTA_FR }) {
  const body = `
      <section style="background:var(--grad-hero); padding:76px 24px 56px; text-align:center;">
        <div style="max-width:860px; margin:0 auto;">
          <span class="eyebrow" style="display:block; margin-bottom:14px;">${eyebrow}</span>
          <h1 style="font-size:clamp(2rem, 2.6vw + 0.8rem, 3rem); margin:0 0 10px;">${h1}</h1>
          <div style="background:#fff; border:1px solid var(--lavande-200); border-left:4px solid var(--violet); border-radius:14px; padding:20px 24px; font-size:15px; line-height:1.7; color:var(--charbon); margin:24px auto 0; text-align:left;">${answerBox}</div>
          <div style="display:flex; flex-wrap:wrap; gap:9px; justify-content:center; margin:24px 0 0;">
            ${toc.map(([id, l]) => `<a href="#${id}" style="font-size:12.5px; font-weight:700; background:rgba(255,255,255,0.75); border:1px solid var(--lavande-100); border-radius:999px; padding:7px 13px; color:var(--violet); border-bottom:1px solid var(--lavande-100);">${l}</a>`).join('\n            ')}
          </div>
        </div>
      </section>
      <section class="section" style="background:#fff; padding-top:24px;">
        <div class="section-inner" style="max-width:800px;">
${content}
          ${pilH2('faq', faqTitle)}
${faqList(faq, faqPrefix)}
          ${author}
        </div>
      </section>
${ctaBand(cta)}`;

  return shell({
    path, label, title, desc, active: 'guides', body,
    jsonld: [
      {
        '@context': 'https://schema.org', '@type': 'Article',
        headline: h1, inLanguage: 'fr-CA', dateModified: '2026-07-15',
        author: { '@type': 'Person', name: 'Benoit Arlabosse', jobTitle: 'Fondateur, Essentiel PME', sameAs: ['https://www.linkedin.com/in/benoitarlabosse/'] },
        publisher: { '@type': 'Organization', name: SITE.name, url: SITE.baseUrl + '/' },
        mainEntityOfPage: `${SITE.baseUrl}/${path.replace(/index\.html$/, '')}`,
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question', name: jsonEsc(f.q),
          acceptedAnswer: { '@type': 'Answer', text: jsonEsc(f.a) },
        })),
      },
    ],
  });
}

function pilierPublicitePage() {
  const content = `
          ${pilH2('pourquoi', 'Pourquoi la publicité en ligne en 2026')}
          ${pilP("Parce que vos clients décident en ligne. Même quand ils achètent en personne. Une recherche «&nbsp;près de moi&nbsp;» le dimanche soir, une publication aperçue dans un fil Instagram, une fiche Google consultée deux minutes avant d'appeler&nbsp;: la décision se prend sur un écran, presque toujours un cellulaire.")}
          ${pilP("Le bouche-à-oreille reste précieux. Mais il ne se contrôle pas. La publicité, elle, vous laisse choisir trois choses&nbsp;: le territoire, le budget, le message. Vous annoncez dans un rayon de 5&nbsp;km autour de votre porte ou dans toute la Montérégie, vous dépensez 500&nbsp;$ ou 5&nbsp;000&nbsp;$ par mois, et vous montrez ce que vous voulez montrer : votre savoir-faire, pas des rabais.")}
          ${pilP("Et contrairement à une pancarte ou à une annonce dans l'hebdo régional, tout se mesure&nbsp;: qui a vu, qui a cliqué, qui a appelé, qui a réservé. Chaque dollar laisse une trace.")}

          ${pilH2('plateformes', 'Google, Meta ou TikTok : qui fait quoi')}
          ${pilP("Google capte l'intention. Meta crée l'envie. TikTok bâtit la notoriété auprès des moins de 35 ans. Ce ne sont pas trois versions du même outil&nbsp;: ce sont trois moments différents dans la tête de votre client, et chacun se paie à son prix.")}
          ${pilTable(
            ['Plateforme', 'Moment capté', 'Idéal pour', 'Résultats attendus'],
            [
              ['<strong>Google (recherche)</strong>', "Le client cherche activement&nbsp;: «&nbsp;plombier urgence Laval&nbsp;», «&nbsp;manucure près de moi&nbsp;»", 'Services à forte intention&nbsp;: urgences, rendez-vous, soumissions', 'Rapides&nbsp;: souvent dès les premières semaines'],
              ['<strong>Meta (Facebook · Instagram)</strong>', 'Le client ne cherche pas encore&nbsp;; votre pub crée le déclic dans son fil', 'Métiers visuels (beauté, resto, rénovation), offres locales', 'Progressifs&nbsp;: la plateforme apprend en 4 à 6 semaines'],
              ['<strong>TikTok</strong>', 'Découverte et divertissement&nbsp;; formats vidéo courts', 'Clientèles jeunes, commerces, restauration, notoriété de marque', "Notoriété d'abord, conversions ensuite"],
            ]
          )}
          ${pilP("La combinaison gagnante pour la plupart des PME&nbsp;: Google pour capter la demande qui existe déjà, Meta pour en créer de la nouvelle, et TikTok seulement quand la clientèle et le contenu vidéo s'y prêtent vraiment. Une plateforme bien gérée bat trois plateformes négligées. Toujours. <a href='/plateformes/'>Le détail de chaque plateforme est ici.</a>")}

          ${pilH2('couts', 'Combien ça coûte, vraiment (repères 2026 par industrie)')}
          ${pilP("Personne n'affiche ses prix dans cette industrie. Nous, oui. Voici les repères observés dans les comptes que nous gérons chez Essentiel PME, pour des PME québécoises, en 2025-2026, en gardant en tête que vos coûts réels bougeront selon le quartier, la concurrence et la saison.")}
          ${pilTable(
            ['Industrie', 'CPC Google (approx.)', 'CPC Meta (approx.)', 'Coût par demande / réservation', 'Budget média minimum réaliste'],
            [
              ['Beauté et bien-être (salon, spa)', '1 à 4&nbsp;$', '0,50 à 2&nbsp;$', '5 à 20&nbsp;$', '450 à 600&nbsp;$&nbsp;/&nbsp;mois'],
              ['Restauration', '1 à 3&nbsp;$', '0,50 à 2&nbsp;$', '5 à 15&nbsp;$', '450 à 600&nbsp;$&nbsp;/&nbsp;mois'],
              ['Construction et rénovation', '3 à 8&nbsp;$', '1 à 3&nbsp;$', '30 à 60&nbsp;$ (Meta) · 50 à 100&nbsp;$ (Google, soumission)', '600 à 900&nbsp;$&nbsp;/&nbsp;mois'],
              ['Services professionnels (avocats, comptables)', '5 à 15&nbsp;$', '2 à 5&nbsp;$', '40 à 120&nbsp;$ (consultation)', '600 à 900&nbsp;$&nbsp;/&nbsp;mois'],
              ['Santé (cliniques, dentaire)', '3 à 8&nbsp;$', '1 à 3&nbsp;$', '20 à 60&nbsp;$ (rendez-vous)', '600 à 900&nbsp;$&nbsp;/&nbsp;mois'],
              ['Commerce de détail', '0,75 à 2,50&nbsp;$', '0,50 à 1,50&nbsp;$', '3 à 12&nbsp;$ (visite/vente)', '450 à 600&nbsp;$&nbsp;/&nbsp;mois'],
            ]
          )}
          <p style="margin:-8px 0 18px; font-size:12.5px; color:var(--charbon-300);">Source&nbsp;: données internes Essentiel PME, comptes gérés 2025-2026. Fourchettes indicatives&nbsp;; le guide de chaque secteur (section «&nbsp;Par secteur&nbsp;» ci-dessous) donne les repères complets.</p>
          ${pilH3('La règle du ~2:1')}
          ${pilCallout("Un dollar de gestion, deux dollars de budget média. C'est la règle. Une gestion à 695&nbsp;$&nbsp;/&nbsp;mois s'accompagne donc d'environ 1&nbsp;400&nbsp;$&nbsp;/&nbsp;mois payés directement aux plateformes, parce que c'est à ce ratio que la gestion se rentabilise. En bas de ça, les frais fixes mangent la performance. <a href='/publicite/'>Nos forfaits et leurs budgets recommandés sont affichés ici.</a>")}
          ${pilH3('Le calcul qui compte : la valeur à vie')}
          ${pilP("Une cliente de salon en coloration revient aux 6 semaines, à 120&nbsp;$ la visite. Mille dollars par année. Pendant des années. Son coût d'acquisition en publicité&nbsp;: 5 à 20&nbsp;$. Le même raisonnement s'applique partout : un contrat de rénovation à 40&nbsp;000&nbsp;$ justifie largement une soumission payée 100&nbsp;$, et il la justifierait encore à trois fois ce prix. Calculez ce que vaut un client sur 3&nbsp;ans. Pas ce que coûte un clic.")}

          ${pilH2('erreurs', "Les 5 erreurs qui gaspillent le budget d'une PME")}
          ${pilP('Nous auditons des comptes publicitaires de PME québécoises chaque mois. Les mêmes cinq erreurs reviennent. Dans toutes les industries.')}
          ${pilH3('1. Le bouton « Boost »')}
          ${pilP("Booster une publication n'est pas une campagne&nbsp;: pas de ciblage précis, pas d'objectif de conversion, pas de suivi. C'est la façon la plus rapide de dépenser 200&nbsp;$ pour des «&nbsp;j'aime&nbsp;» qui n'achètent jamais.")}
          ${pilH3('2. Aucun endroit où convertir')}
          ${pilP("L'envie passe vite. Sans réservation en ligne, formulaire court ou numéro cliquable, chaque clic payé meurt sur une page qui ne demande rien.")}
          ${pilH3('3. Cibler trop large')}
          ${pilP("Personne ne traverse trois ponts pour une coupe de cheveux. Un rayon de 3 à 8&nbsp;km suffit pour la plupart des commerces de proximité&nbsp;; chaque dollar dépensé hors zone est un dollar jeté.")}
          ${pilH3("4. N'annoncer que des rabais")}
          ${pilP('Les promos à répétition attirent les chasseurs d\'aubaines et dévalorisent votre travail. Annoncez votre savoir-faire&nbsp;: vos réalisations, vos avant-après, vos avis.')}
          ${pilH3('5. Arrêter après 3 semaines, sans rien mesurer')}
          ${pilP("Les plateformes ont besoin de 4 à 6 semaines pour apprendre qui convertit. Et sans suivi (GA4, pixel Meta), impossible de savoir quelle annonce rapporte et laquelle brûle le budget.")}
          ${pilCallout('Le suivi des conversions mérite son propre guide&nbsp;: <a href="/mesurer-ses-resultats/"><strong>Mesurer sa publicité&nbsp;: GA4, pixel Meta et conversions pour PME →</strong></a>')}

          ${pilH2('delai', 'Combien de temps avant des résultats')}
          ${pilP("Quatre à six semaines d'apprentissage. Puis un régime de croisière vers le troisième mois. C'est mécanique&nbsp;: les algorithmes de Google et de Meta testent vos annonces sur différents profils, éliminent ce qui ne convertit pas, puis concentrent le budget sur ce qui fonctionne. Et les plateformes le documentent elles-mêmes, <a href='https://www.facebook.com/business/help' target='_blank' rel='noopener'>Meta décrivant une phase d'apprentissage</a> qui exige un volume suffisant de conversions avant de stabiliser la diffusion, <a href='https://support.google.com/google-ads' target='_blank' rel='noopener'>Google Ads recommandant de laisser tourner les campagnes</a> avant d'en juger. Couper avant la fin de l'apprentissage, c'est payer pour la leçon sans jamais lire la réponse.")}
          ${pilP("Google donne des signaux plus vite, parce qu'il capte une demande qui existe déjà. Meta prend plus de temps, mais construit un bassin de nouvelles clientèles. D'où notre engagement minimum de 3&nbsp;mois&nbsp;: pas pour vendre plus longtemps, mais parce qu'en deçà, les chiffres ne veulent rien dire. Rien du tout.")}

          ${pilH2('qui-gere', 'Interne, pigiste ou agence : qui devrait gérer vos campagnes')}
          ${pilP('Ça dépend. De votre temps, de votre budget, de la complexité de vos campagnes. Voici la comparaison honnête.')}
          ${pilTable(
            ['Option', 'Coût typique', 'Forces', 'Limites'],
            [
              ['<strong>Vous-même (interne)</strong>', 'Votre temps (5 à 10&nbsp;h/semaine au début)', 'Contrôle total, aucun frais de gestion', "Courbe d'apprentissage abrupte&nbsp;; les plateformes changent constamment&nbsp;; erreurs coûteuses au début"],
              ['<strong>Pigiste</strong>', '300 à 800&nbsp;$&nbsp;/&nbsp;mois', 'Flexible, abordable', 'Qualité inégale&nbsp;; disponibilité variable&nbsp;; dépendance à une seule personne'],
              ['<strong>Grande agence</strong>', '2&nbsp;000 à 5&nbsp;000&nbsp;$&nbsp;/&nbsp;mois et plus', 'Équipe complète, outils avancés', 'Pensée pour les gros budgets&nbsp;; une PME devient le petit compte de la liste'],
              ['<strong>Essentiel PME</strong>', '695 à 1&nbsp;495&nbsp;$&nbsp;/&nbsp;mois, <a href="/publicite/">prix affichés</a>', 'Gestion complète, rapport mensuel en français, fait pour les PME d\'ici', 'Budget média minimum requis (~2:1) pour que la gestion se rentabilise'],
            ]
          )}
          ${pilP("Le test est simple. Si gérer vos campagnes vous éloigne de ce qui fait rentrer l'argent (vos clients, vos chantiers, vos chaises), déléguez. Si vous avez le temps et l'envie d'apprendre, commencez petit, sur une seule plateforme. Mais commencez.")}

          ${pilH2('par-secteur', 'La publicité de votre secteur, en détail')}
          ${pilSecteurs('Chaque industrie a ses coûts, son calendrier, ses pièges. Le guide de chaque secteur&nbsp;:')}`;

  return pilierShell({
    path: 'publicite-en-ligne/index.html',
    label: 'Guide publicité en ligne',
    title: 'La publicité en ligne pour les PME au Québec : le guide complet (2026) | Essentiel PME',
    desc: 'Plateformes, coûts réels 2026 par industrie et erreurs à éviter : le guide de la publicité en ligne pour PME au Québec, par Essentiel PME.',
    h1: 'La publicité en ligne pour les PME au Québec&nbsp;: le guide complet (2026)',
    answerBox: "La publicité en ligne place une PME québécoise devant ses clients au moment où ils cherchent, ou juste avant. Chez Essentiel PME, nos comptes gérés en 2025-2026 montrent des coûts par clic de 0,50&nbsp;$ à 15&nbsp;$ et des budgets minimums réalistes de 450&nbsp;$ à 900&nbsp;$ par mois, selon la plateforme et l'industrie. Ce guide couvre les plateformes, les coûts réels par secteur, les cinq erreurs les plus coûteuses et le délai avant des résultats.",
    toc: [
      ['pourquoi', 'Pourquoi en 2026'], ['plateformes', 'Google, Meta ou TikTok'], ['couts', 'Les coûts réels'],
      ['erreurs', 'Les 5 erreurs'], ['delai', 'Le délai avant résultats'], ['qui-gere', 'Interne, pigiste ou agence'],
      ['par-secteur', 'Par secteur'], ['faq', 'FAQ'],
    ],
    content,
    faqPrefix: 'faq-pilier-pub',
    faq: [
      { q: 'Combien coûte la publicité en ligne pour une PME au Québec ?', a: "Selon nos comptes gérés en 2025-2026 : 0,50 $ à 15 $ par clic selon la plateforme et l'industrie, 5 $ à 120 $ par demande selon le secteur, et un budget média minimum réaliste de 450 $ à 900 $ par mois sur une plateforme, plus la gestion si vous déléguez.", open: true },
      { q: 'Quel budget minimum pour commencer la publicité en ligne au Québec ?', a: 'Prévoyez 450 à 600 $ par mois de budget média sur une seule plateforme, plus la gestion si vous déléguez. En bas de ce seuil, les plateformes manquent de données pour optimiser. Les résultats deviennent aléatoires.' },
      { q: 'Google Ads ou Facebook : lequel choisir en premier ?', a: "Google si vos clients vous cherchent déjà (urgences, services, rendez-vous). Meta si votre métier est visuel ou si vous devez créer la demande. En cas de doute, commencez là où l'intention est la plus forte : la recherche Google." },
      { q: 'Est-ce que booster une publication Facebook fonctionne ?', a: "Rarement. Le boost optimise pour l'engagement (« j'aime », commentaires), pas pour les ventes ou les demandes. Une vraie campagne dans le Gestionnaire de publicités cible mieux, coûte moins cher par résultat et se mesure." },
      { q: 'Combien de temps avant de voir des résultats ?', a: "Comptez 4 à 6 semaines d'apprentissage algorithmique, et jugez la performance au troisième mois. Google réagit généralement plus vite que Meta." },
      { q: 'La publicité en ligne fonctionne-t-elle pour une très petite entreprise ?', a: "Oui, à condition de rester local : un rayon serré, une seule plateforme, un seul objectif (appels, réservations ou soumissions). C'est le contraire d'une campagne nationale. Et c'est ce qui la rend abordable." },
    ],
  });
}

function pilierMesurePage() {
  const content = `
          ${pilH2('pourquoi-mesurer', "Pourquoi l'absence de mesure brûle le budget")}
          ${pilP("Sans mesure, deux annonces se ressemblent. Avec la mesure, l'une amène des réservations à 8&nbsp;$ et l'autre à 45&nbsp;$. Et sur un budget de 1&nbsp;500&nbsp;$ par mois, cette différence-là, c'est le simple au quintuple en résultats, pour la même dépense. Exactement la même.")}
          ${pilP("C'est aussi la raison du fameux «&nbsp;j'ai essayé la pub, ça ne marche pas&nbsp;». Dans nos audits chez Essentiel PME, la plupart des comptes abandonnés n'avaient aucun suivi de conversions&nbsp;: impossible de savoir ce qui fonctionnait, donc impossible d'optimiser. La campagne n'a pas échoué. Elle n'a jamais été pilotée.")}
          ${pilP("Et il y a plus. Les algorithmes de Google et de Meta optimisent vers ce que vous mesurez&nbsp;: pas de conversions déclarées, pas d'apprentissage. Votre concurrent qui mesure entraîne sa machine&nbsp;; vous, non. Le fossé se creuse chaque semaine.")}

          ${pilH2('ga4', 'GA4 en français simple')}
          ${pilP("Google Analytics 4 (GA4) est l'outil gratuit qui enregistre ce qui se passe sur votre site&nbsp;: d'où viennent les visiteurs, ce qu'ils consultent, ce qu'ils font. Quatre notions suffisent.")}
          ${pilTable(
            ['Terme GA4', 'En français simple'],
            [
              ['<strong>Événement</strong>', 'Une action sur votre site&nbsp;: page vue, clic sur le numéro, formulaire envoyé.'],
              ['<strong>Conversion (événement clé)</strong>', "L'événement qui compte pour vos affaires&nbsp;: demande de soumission, réservation, appel. C'est VOUS qui le déclarez."],
              ['<strong>Source / médium</strong>', "D'où vient le visiteur&nbsp;: Google organique, publicité Meta, courriel, direct."],
              ['<strong>Attribution</strong>', 'À quelle source GA4 accorde le mérite d\'une conversion quand le client a vu plusieurs canaux avant d\'agir.'],
            ]
          )}
          ${pilP("L'installation de base se fait avec Google Tag Manager (GTM)&nbsp;: un seul code sur le site, puis chaque suivi se configure sans toucher au code. Le trio minimal pour une PME&nbsp;: clics sur le numéro de téléphone, envois de formulaire, clics sur le bouton de réservation. Tout le reste est du confort.")}

          ${pilH2('pixel-meta', "Le pixel Meta et l'API Conversions : pourquoi vos pubs « ne marchent pas »")}
          ${pilP("Le pixel Meta est un code qui dit à Facebook et Instagram ce que font les visiteurs venus de vos pubs. Sans lui, Meta optimise à l'aveugle. Il montre vos annonces à des gens qui cliquent, pas à des gens qui réservent.")}
          ${pilP("Le problème depuis quelques années&nbsp;: les bloqueurs de témoins et les restrictions d'iOS font perdre au pixel une partie des conversions. La réponse de Meta s'appelle l'API Conversions (CAPI)&nbsp;: les données partent de votre serveur ou de vos outils (formulaire, système de réservation, CRM) plutôt que du seul navigateur, ce qui donne une mesure plus complète, donc un algorithme mieux entraîné, donc un coût par résultat qui baisse. Une chaîne. Trois maillons.")}
          ${pilCallout(`<strong>Minimum vital&nbsp;:</strong> pixel installé via GTM + événement de conversion sur l'action qui compte (formulaire, réservation, appel).<br><br>
            <strong>Niveau recommandé&nbsp;:</strong> pixel + API Conversions avec déduplication (les deux envoient, Meta élimine les doublons).<br><br>
            <strong>À vérifier chaque mois&nbsp;:</strong> le Gestionnaire d'événements Meta affiche-t-il vos conversions&nbsp;? Un pixel silencieux depuis trois semaines est une campagne qui vole à l'aveugle.`)}

          ${pilH2('loi-25', "La Loi 25 : consentement et publicité, ce qu'une PME doit faire")}
          ${pilP('La Loi 25 encadre la protection des renseignements personnels au Québec. Pour votre marketing, elle se résume à trois obligations concrètes. Ce résumé ne remplace pas un avis juridique&nbsp;; pour les cas particuliers, consultez la <a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener">Commission d\'accès à l\'information (CAI)</a> ou un conseiller juridique.')}
          ${pilH3('1. Le consentement avant les témoins non essentiels')}
          ${pilP("Votre site doit afficher un bandeau de consentement, et GA4 comme le pixel Meta ne doivent s'activer qu'après un «&nbsp;oui&nbsp;». Les paramètres par défaut doivent être les plus protecteurs.")}
          ${pilH3('2. La transparence')}
          ${pilP("Une politique de confidentialité claire (quelles données, pourquoi, avec qui elles sont partagées) et un responsable de la protection des renseignements personnels désigné. Dans une PME, c'est souvent le dirigeant.")}
          ${pilH3('3. Les formulaires')}
          ${pilP("Ne collectez que le nécessaire, dites ce que vous ferez du courriel (ex.&nbsp;: recevoir le guide + l'infolettre), et offrez un désabonnement simple.")}
          ${pilCallout("La bonne nouvelle&nbsp;: un site conforme n'est pas un site qui mesure moins bien. Le <a href='https://support.google.com/analytics' target='_blank' rel='noopener'>mode consentement de Google</a> et l'<a href='https://www.facebook.com/business/help' target='_blank' rel='noopener'>API Conversions de Meta</a> sont justement conçus pour travailler dans ce cadre : la conformité et la performance ne s'opposent pas, elles s'installent ensemble, une seule fois.")}

          ${pilH2('indicateurs', 'Le rapport mensuel qui compte : nos 6 indicateurs')}
          ${pilP("Un bon rapport tient sur une page. Il répond à une seule question&nbsp;: est-ce que la publicité rapporte&nbsp;? Voici les six indicateurs que nous suivons chez Essentiel PME, dans cet ordre.")}
          ${pilTable(
            ['Indicateur', 'La question à laquelle il répond'],
            [
              ['<strong>1. Conversions</strong> (demandes, réservations, appels)', "Combien d'occasions d'affaires ce mois-ci&nbsp;?"],
              ['<strong>2. Coût par conversion</strong>', "Combien coûte chaque occasion&nbsp;? Est-ce viable face à la valeur d'un client&nbsp;?"],
              ['<strong>3. Dépense vs budget</strong>', "A-t-on dépensé ce qui était prévu, là où c'était prévu&nbsp;?"],
              ['<strong>4. Répartition par plateforme</strong>', 'Qui livre&nbsp;: Google, Meta, TikTok&nbsp;? Où réallouer&nbsp;?'],
              ['<strong>5. Meilleures et pires annonces</strong>', 'Quoi couper, quoi amplifier le mois prochain&nbsp;?'],
              ['<strong>6. Tendance sur 3 mois</strong>', "Est-ce que ça s'améliore&nbsp;? (Un mois isolé ne prouve rien.)"],
            ]
          )}
          ${pilP("Ce qui ne devrait jamais ouvrir un rapport&nbsp;: les impressions et la portée. Ce sont des chiffres de vanité : gros, flatteurs, et incapables de payer une facture. Ils servent au diagnostic. Pas au verdict.")}

          ${pilH2('par-secteur', 'La mesure de votre secteur')}
          ${pilSecteurs("Les trois conversions à suivre changent selon le métier&nbsp;: soumissions en construction, réservations en restauration, rendez-vous en clinique. Chaque page d'industrie détaille son approche&nbsp;:")}`;

  return pilierShell({
    path: 'mesurer-ses-resultats/index.html',
    label: 'Guide mesure',
    title: 'Mesurer sa publicité : GA4, pixel Meta et conversions pour PME (sans jargon) | Essentiel PME',
    desc: 'GA4, pixel Meta, conversions et Loi 25 expliqués sans jargon : le guide de la mesure publicitaire pour PME québécoises, par Essentiel PME.',
    h1: 'Mesurer sa publicité&nbsp;: GA4, pixel Meta et conversions pour PME (sans jargon)',
    answerBox: "Mesurer sa publicité, c'est savoir quelle annonce amène des appels, des réservations ou des soumissions, et laquelle brûle le budget. Pour une PME, trois outils suffisent&nbsp;: GA4 (gratuit, de Google), le pixel Meta avec l'API Conversions, et un suivi des actions qui comptent (appel, formulaire, réservation). Au Québec, la Loi 25 encadre le tout&nbsp;: consentement requis avant d'activer ces outils. Ce guide explique chaque pièce, sans jargon, dans l'ordre où les installer en 2026.",
    toc: [
      ['pourquoi-mesurer', 'Pourquoi mesurer'], ['ga4', 'GA4 en français simple'], ['pixel-meta', 'Pixel Meta et API Conversions'],
      ['loi-25', 'La Loi 25'], ['indicateurs', 'Les 6 indicateurs'], ['par-secteur', 'Par secteur'], ['faq', 'FAQ'],
    ],
    content,
    faqPrefix: 'faq-pilier-mesure',
    faq: [
      { q: 'GA4 est-il gratuit ?', a: "Oui, entièrement, pour les besoins d'une PME. L'installation via Google Tag Manager demande une à deux heures pour un suivi de base bien fait.", open: true },
      { q: "Quelle est la différence entre le pixel Meta et l'API Conversions ?", a: "Le pixel mesure depuis le navigateur du visiteur ; l'API Conversions envoie les données depuis vos systèmes. Ensemble (avec déduplication), ils donnent la mesure la plus complète, et de meilleurs coûts par résultat." },
      { q: "La Loi 25 s'applique-t-elle à ma petite entreprise ?", a: 'Oui : la loi vise toute entreprise qui recueille des renseignements personnels au Québec, sans seuil de taille. Bandeau de consentement, politique de confidentialité et responsable désigné sont le minimum.' },
      { q: 'Que suivre en priorité si je ne mesure rien aujourd\'hui ?', a: 'Trois actions : les clics sur votre numéro de téléphone, les envois de formulaire et les réservations en ligne. Avec ça, vous savez déjà quelle campagne travaille.' },
      { q: 'Le consentement fait-il perdre des données ?', a: "Une partie, oui, c'est le principe. Mais le mode consentement de Google et l'API Conversions compensent en partie, et une mesure conforme à 80 % bat une mesure illégale à 100 %." },
    ],
  });
}

/* Versions anglaises des piliers — contenu autoral EN ; le chrome (menu, pied
   de page, bandeau) reste français ici et se traduit au passage toEnglish(). */
function pilierPubliciteEN() {
  const content = `
          ${pilH2('pourquoi', 'Why online advertising in 2026')}
          ${pilP("Because your customers decide online. Even when they buy in person. A “near me” search on a Sunday night, a post spotted in an Instagram feed, a Google listing checked two minutes before calling: the decision happens on a screen, almost always a phone.")}
          ${pilP("Word of mouth is still precious. But you can't control it. Advertising lets you choose three things: the territory, the budget, the message. You advertise within a 5&nbsp;km radius of your front door or across the whole Montérégie, you spend $500 or $5,000 a month, and you show what you want to show: your craft, not discounts.")}
          ${pilP("And unlike a billboard or an ad in the regional weekly, everything is measurable: who saw, who clicked, who called, who booked. Every dollar leaves a trace.")}

          ${pilH2('plateformes', 'Google, Meta or TikTok: who does what')}
          ${pilP("Google captures intent. Meta creates desire. TikTok builds awareness with the under-35 crowd. These aren't three versions of the same tool: they're three different moments in your customer's mind, and each one has its own price.")}
          ${pilTable(
            ['Platform', 'Moment captured', 'Ideal for', 'Expected results'],
            [
              ['<strong>Google (search)</strong>', 'The customer is actively searching: “emergency plumber Laval”, “manicure near me”', 'High-intent services: emergencies, appointments, quotes', 'Fast: often within the first weeks'],
              ['<strong>Meta (Facebook · Instagram)</strong>', "The customer isn't searching yet; your ad sparks the idea in their feed", 'Visual trades (beauty, restaurants, renovation), local offers', 'Progressive: the platform learns over 4 to 6 weeks'],
              ['<strong>TikTok</strong>', 'Discovery and entertainment; short video formats', 'Younger audiences, retail, restaurants, brand awareness', 'Awareness first, conversions later'],
            ]
          )}
          ${pilP("The winning combination for most SMBs: Google to capture the demand that already exists, Meta to create new demand, and TikTok only when the audience and video content truly fit. One well-managed platform beats three neglected ones. Always. <a href='/plateformes/'>The details of every platform are here.</a>")}

          ${pilH2('couts', 'What it really costs (2026 benchmarks by industry)')}
          ${pilP("Nobody publishes their prices in this industry. We do. Here are the benchmarks observed in the accounts we manage at SMB Essentials, for Quebec SMBs, in 2025-2026, keeping in mind that your actual costs will move with the neighbourhood, the competition and the season.")}
          ${pilTable(
            ['Industry', 'Google CPC (approx.)', 'Meta CPC (approx.)', 'Cost per lead / booking', 'Realistic minimum media budget'],
            [
              ['Beauty and wellness (salon, spa)', '$1 to $4', '$0.50 to $2', '$5 to $20', '$450 to $600/mo'],
              ['Restaurants', '$1 to $3', '$0.50 to $2', '$5 to $15', '$450 to $600/mo'],
              ['Construction and renovation', '$3 to $8', '$1 to $3', '$30 to $60 (Meta) · $50 to $100 (Google, quote)', '$600 to $900/mo'],
              ['Professional services (lawyers, accountants)', '$5 to $15', '$2 to $5', '$40 to $120 (consultation)', '$600 to $900/mo'],
              ['Healthcare (clinics, dental)', '$3 to $8', '$1 to $3', '$20 to $60 (appointment)', '$600 to $900/mo'],
              ['Retail', '$0.75 to $2.50', '$0.50 to $1.50', '$3 to $12 (visit/sale)', '$450 to $600/mo'],
            ]
          )}
          <p style="margin:-8px 0 18px; font-size:12.5px; color:var(--charbon-300);">Source: SMB Essentials internal data, managed accounts 2025-2026. Indicative ranges; each sector's page (see “By sector” below) gives the full picture.</p>
          ${pilH3('The ~2:1 rule')}
          ${pilCallout("One dollar of management, two dollars of media budget. That's the rule. A $695/mo management fee therefore comes with roughly $1,400/mo paid directly to the platforms, because that's the ratio at which management pays for itself. Below that, fixed fees eat the performance. <a href='/publicite/'>Our packages and their recommended budgets are published here.</a>")}
          ${pilH3('The math that matters: lifetime value')}
          ${pilP("A salon colour client comes back every 6 weeks, at $120 a visit. A thousand dollars a year. For years. Her acquisition cost through advertising: $5 to $20. The same reasoning applies everywhere: a $40,000 renovation contract easily justifies a quote that cost $100 in advertising, and it would still justify it at three times that price. Calculate what a customer is worth over 3 years. Not what a click costs.")}

          ${pilH2('erreurs', "The 5 mistakes that waste an SMB's budget")}
          ${pilP('We audit Quebec SMB ad accounts every month. The same five mistakes come back. In every industry.')}
          ${pilH3('1. The “Boost” button')}
          ${pilP("Boosting a post is not a campaign: no precise targeting, no conversion objective, no tracking. It's the fastest way to spend $200 on likes that never buy.")}
          ${pilH3('2. Nowhere to convert')}
          ${pilP("Desire fades fast. Without online booking, a short form or a tappable phone number, every paid click dies on a page that asks for nothing.")}
          ${pilH3('3. Targeting too wide')}
          ${pilP("Nobody crosses three bridges for a haircut. A 3 to 8&nbsp;km radius is enough for most local businesses; every dollar spent outside your zone is a dollar thrown away.")}
          ${pilH3('4. Advertising nothing but discounts')}
          ${pilP('Repeated promos attract bargain hunters and devalue your work. Advertise your craft: your projects, your before-and-afters, your reviews.')}
          ${pilH3('5. Stopping after 3 weeks, without measuring anything')}
          ${pilP("The platforms need 4 to 6 weeks to learn who converts. And without tracking (GA4, Meta pixel), there's no way to know which ad pays off and which one burns the budget.")}
          ${pilCallout('Conversion tracking deserves its own guide: <a href="/mesurer-ses-resultats/"><strong>Measuring your advertising: GA4, Meta pixel and conversions for SMBs →</strong></a>')}

          ${pilH2('delai', 'How long before you see results')}
          ${pilP("Four to six weeks of learning. Then cruising speed around the third month. It's mechanical: Google's and Meta's algorithms test your ads on different profiles, eliminate what doesn't convert, then concentrate the budget on what works. And the platforms document it themselves, <a href='https://www.facebook.com/business/help' target='_blank' rel='noopener'>Meta describing a learning phase</a> that requires a sufficient volume of conversions before delivery stabilizes, <a href='https://support.google.com/google-ads' target='_blank' rel='noopener'>Google Ads recommending that campaigns run</a> before judging them. Cutting before the learning ends means paying for the lesson without ever reading the answer.")}
          ${pilP("Google gives signals faster, because it captures demand that already exists. Meta takes longer, but builds a pool of new customers. Hence our 3-month minimum commitment: not to sell longer, but because below that, the numbers mean nothing. Nothing at all.")}

          ${pilH2('qui-gere', 'In-house, freelancer or agency: who should manage your campaigns')}
          ${pilP('It depends. On your time, your budget, the complexity of your campaigns. Here is the honest comparison.')}
          ${pilTable(
            ['Option', 'Typical cost', 'Strengths', 'Limits'],
            [
              ['<strong>Yourself (in-house)</strong>', 'Your time (5 to 10&nbsp;hrs/week at first)', 'Total control, no management fees', 'Steep learning curve; platforms change constantly; costly mistakes early on'],
              ['<strong>Freelancer</strong>', '$300 to $800/mo', 'Flexible, affordable', 'Uneven quality; variable availability; dependent on one person'],
              ['<strong>Large agency</strong>', '$2,000 to $5,000/mo and up', 'Full team, advanced tools', 'Built for big budgets; an SMB becomes the small account on the list'],
              ['<strong>SMB Essentials</strong>', '$695 to $1,495/mo, <a href="/publicite/">published prices</a>', 'Full management, monthly report, built for local SMBs', 'Minimum media budget required (~2:1) so management pays for itself'],
            ]
          )}
          ${pilP("The test is simple. If managing your campaigns pulls you away from what brings in the money (your customers, your job sites, your chairs), delegate. If you have the time and the desire to learn, start small, on a single platform. But start.")}

          ${pilH2('par-secteur', "Your sector's advertising, in detail")}
          ${pilSecteurs('Every industry has its costs, its calendar, its traps. The guide for each sector:')}`;

  return pilierShell({
    path: 'publicite-en-ligne/index.html',
    label: 'Online advertising guide',
    title: 'Online advertising for Quebec SMBs: the complete guide (2026) | SMB Essentials',
    desc: 'Platforms, real 2026 costs by industry and mistakes to avoid: the online advertising guide for Quebec SMBs, by SMB Essentials.',
    h1: 'Online advertising for Quebec SMBs: the complete guide (2026)',
    eyebrow: 'THE GUIDE', faqTitle: 'FAQ', author: pilAuthorEN, cta: PIL_CTA_EN,
    answerBox: "Online advertising puts a Quebec SMB in front of its customers at the moment they're searching, or just before. In the accounts SMB Essentials managed in 2025-2026, costs per click ranged from $0.50 to $15, with realistic minimum budgets of $450 to $900 per month, depending on platform and industry. This guide covers the platforms, real costs by sector, the five most expensive mistakes and how long it takes to see results.",
    toc: [
      ['pourquoi', 'Why in 2026'], ['plateformes', 'Google, Meta or TikTok'], ['couts', 'Real costs'],
      ['erreurs', 'The 5 mistakes'], ['delai', 'Time to results'], ['qui-gere', 'In-house, freelancer or agency'],
      ['par-secteur', 'By sector'], ['faq', 'FAQ'],
    ],
    content,
    faqPrefix: 'faq-pilier-pub',
    faq: [
      { q: 'How much does online advertising cost for a Quebec SMB?', a: 'Based on our managed accounts in 2025-2026: $0.50 to $15 per click depending on platform and industry, $5 to $120 per lead depending on the sector, and a realistic minimum media budget of $450 to $900 per month on one platform, plus management if you delegate.', open: true },
      { q: 'What minimum budget do you need to start advertising online in Quebec?', a: 'Plan for $450 to $600 per month of media budget on a single platform, plus management if you delegate. Below that threshold, the platforms lack the data to optimize. Results become random.' },
      { q: 'Google Ads or Facebook: which should you choose first?', a: 'Google if your customers are already searching for you (emergencies, services, appointments). Meta if your trade is visual or you need to create demand. When in doubt, start where intent is strongest: Google search.' },
      { q: 'Does boosting a Facebook post work?', a: 'Rarely. Boosting optimizes for engagement (likes, comments), not for sales or leads. A real campaign in Ads Manager targets better, costs less per result and can be measured.' },
      { q: 'How long before you see results?', a: 'Count on 4 to 6 weeks of algorithmic learning, and judge performance in the third month. Google generally reacts faster than Meta.' },
      { q: 'Does online advertising work for a very small business?', a: "Yes, as long as you stay local: a tight radius, a single platform, a single objective (calls, bookings or quotes). It's the opposite of a national campaign. And that's what makes it affordable." },
    ],
  });
}

function pilierMesureEN() {
  const content = `
          ${pilH2('pourquoi-mesurer', 'Why the absence of measurement burns your budget')}
          ${pilP("Without measurement, two ads look the same. With measurement, one brings bookings at $8 and the other at $45. And on a $1,500 monthly budget, that difference is one-to-five in results, for the same spend. Exactly the same.")}
          ${pilP("It's also the reason behind the famous “I tried ads, they don't work”. In our audits at SMB Essentials, most abandoned accounts had no conversion tracking at all: impossible to know what was working, therefore impossible to optimize. The campaign didn't fail. It was never steered.")}
          ${pilP("And there's more. Google's and Meta's algorithms optimize toward what you measure: no declared conversions, no learning. Your competitor who measures is training their machine; you aren't. The gap widens every week.")}

          ${pilH2('ga4', 'GA4 in plain language')}
          ${pilP("Google Analytics 4 (GA4) is the free tool that records what happens on your site: where visitors come from, what they view, what they do. Four notions are enough.")}
          ${pilTable(
            ['GA4 term', 'In plain language'],
            [
              ['<strong>Event</strong>', 'An action on your site: page view, click on your phone number, form submitted.'],
              ['<strong>Conversion (key event)</strong>', "The event that matters for your business: quote request, booking, call. YOU declare it."],
              ['<strong>Source / medium</strong>', 'Where the visitor comes from: organic Google, Meta ads, email, direct.'],
              ['<strong>Attribution</strong>', 'Which source GA4 credits for a conversion when the customer saw several channels before acting.'],
            ]
          )}
          ${pilP("The basic setup is done with Google Tag Manager (GTM): a single code on the site, then every tracking piece is configured without touching the code. The minimum trio for an SMB: clicks on your phone number, form submissions, clicks on the booking button. Everything else is comfort.")}

          ${pilH2('pixel-meta', "The Meta pixel and the Conversions API: why your ads “don't work”")}
          ${pilP("The Meta pixel is a piece of code that tells Facebook and Instagram what visitors from your ads actually do. Without it, Meta optimizes blindly. It shows your ads to people who click, not to people who book.")}
          ${pilP("The problem in recent years: cookie blockers and iOS restrictions make the pixel lose part of the conversions. Meta's answer is the Conversions API (CAPI): the data leaves from your server or your tools (form, booking system, CRM) rather than only from the browser, which gives a more complete measurement, therefore a better-trained algorithm, therefore a lower cost per result. A chain. Three links.")}
          ${pilCallout(`<strong>Bare minimum:</strong> pixel installed via GTM + a conversion event on the action that matters (form, booking, call).<br><br>
            <strong>Recommended level:</strong> pixel + Conversions API with deduplication (both send, Meta removes duplicates).<br><br>
            <strong>Check every month:</strong> does Meta Events Manager show your conversions? A pixel that's been silent for three weeks is a campaign flying blind.`)}

          ${pilH2('loi-25', 'Law 25: consent and advertising, what an SMB must do')}
          ${pilP("Law 25 governs the protection of personal information in Quebec. For your marketing, it comes down to three concrete obligations. This summary is not legal advice; for specific cases, consult the <a href='https://www.cai.gouv.qc.ca' target='_blank' rel='noopener'>Commission d'accès à l'information (CAI)</a> or a legal advisor.")}
          ${pilH3('1. Consent before non-essential cookies')}
          ${pilP("Your site must display a consent banner, and GA4 and the Meta pixel must only activate after a “yes”. Default settings must be the most protective ones.")}
          ${pilH3('2. Transparency')}
          ${pilP("A clear privacy policy (what data, why, who it's shared with) and a designated person responsible for the protection of personal information. In an SMB, that's often the owner.")}
          ${pilH3('3. Forms')}
          ${pilP("Collect only what's necessary, say what you'll do with the email address (e.g., receive the guide + the newsletter), and offer a simple unsubscribe.")}
          ${pilCallout("The good news: a compliant site is not a site that measures worse. <a href='https://support.google.com/analytics' target='_blank' rel='noopener'>Google's consent mode</a> and <a href='https://www.facebook.com/business/help' target='_blank' rel='noopener'>Meta's Conversions API</a> are designed precisely to work within this framework: compliance and performance don't oppose each other, they get installed together, once.")}

          ${pilH2('indicateurs', 'The monthly report that matters: our 6 indicators')}
          ${pilP("A good report fits on one page. It answers a single question: is the advertising paying off? Here are the six indicators we track at SMB Essentials, in this order.")}
          ${pilTable(
            ['Indicator', 'The question it answers'],
            [
              ['<strong>1. Conversions</strong> (leads, bookings, calls)', 'How many business opportunities this month?'],
              ['<strong>2. Cost per conversion</strong>', "How much does each opportunity cost? Is it viable against a customer's value?"],
              ['<strong>3. Spend vs budget</strong>', 'Did we spend what was planned, where it was planned?'],
              ['<strong>4. Split by platform</strong>', 'Who delivers: Google, Meta, TikTok? Where to reallocate?'],
              ['<strong>5. Best and worst ads</strong>', 'What to cut, what to amplify next month?'],
              ['<strong>6. 3-month trend</strong>', 'Is it improving? (A single month proves nothing.)'],
            ]
          )}
          ${pilP("What should never open a report: impressions and reach. They're vanity metrics: big, flattering, and incapable of paying an invoice. They're for diagnosis. Not for the verdict.")}

          ${pilH2('par-secteur', "Your sector's measurement")}
          ${pilSecteurs('The three conversions to track change with the trade: quotes in construction, bookings in restaurants, appointments in clinics. Each industry page details its approach:')}`;

  return pilierShell({
    path: 'mesurer-ses-resultats/index.html',
    label: 'Measurement guide',
    title: 'Measuring your advertising: GA4, Meta pixel and conversions for SMBs (no jargon) | SMB Essentials',
    desc: 'GA4, Meta pixel, conversions and Law 25 explained without jargon: the advertising measurement guide for Quebec SMBs, by SMB Essentials.',
    h1: 'Measuring your advertising: GA4, Meta pixel and conversions for SMBs (no jargon)',
    eyebrow: 'THE GUIDE', faqTitle: 'FAQ', author: pilAuthorEN, cta: PIL_CTA_EN,
    answerBox: "Measuring your advertising means knowing which ad brings calls, bookings or quote requests, and which one burns the budget. For an SMB, three tools are enough: GA4 (free, from Google), the Meta pixel with the Conversions API, and tracking on the actions that matter (call, form, booking). In Quebec, Law 25 frames all of it: consent is required before activating these tools. This guide explains every piece, without jargon, in the order to install them in 2026.",
    toc: [
      ['pourquoi-mesurer', 'Why measure'], ['ga4', 'GA4 in plain language'], ['pixel-meta', 'Meta pixel and Conversions API'],
      ['loi-25', 'Law 25'], ['indicateurs', 'The 6 indicators'], ['par-secteur', 'By sector'], ['faq', 'FAQ'],
    ],
    content,
    faqPrefix: 'faq-pilier-mesure',
    faq: [
      { q: 'Is GA4 free?', a: "Yes, entirely, for an SMB's needs. Installation via Google Tag Manager takes one to two hours for a solid basic setup.", open: true },
      { q: 'What is the difference between the Meta pixel and the Conversions API?', a: "The pixel measures from the visitor's browser; the Conversions API sends data from your systems. Together (with deduplication), they give the most complete measurement, and better costs per result." },
      { q: 'Does Law 25 apply to my small business?', a: 'Yes: the law covers any business that collects personal information in Quebec, with no size threshold. A consent banner, a privacy policy and a designated privacy officer are the minimum.' },
      { q: "What should I track first if I'm not measuring anything today?", a: 'Three actions: clicks on your phone number, form submissions and online bookings. With that, you already know which campaign is working.' },
      { q: 'Does consent make you lose data?', a: "Some, yes, that's the principle. But Google's consent mode and the Conversions API partly compensate, and a measurement that's 80% compliant beats one that's 100% illegal." },
    ],
  });
}

/* ================= landing pages des guides (gated content, noindex) =================
   Design : kit « essentielpmelandingpages » (remise Claude Design).
   Parcours : formulaire → Brevo (si configuré) + courriel de lead → redirection
   vers la page merci à URL unique (?prenom=…) → téléchargement direct du PDF.   */

const LP_ICONS = [
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-4.35-4.35"></path></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 13v-2z M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01"></path></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path></svg>',
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 3h6v4H9z M9 14l2 2 4-4"></path></svg>',
];

const LP_KICKERS = ['01 · LE CONSTAT', '02 · LES RÉSEAUX', '03 · LES COÛTS', '04 · LES PIÈGES', '05 · LE CALENDRIER', '06 · AVANT DE LANCER'];

const GUIDES = [
  {
    slug: 'beaute', label: 'Beauté et bien-être',
    pdf: '/assets/guides/guide-beaute.pdf',
    pdfName: "Guide - La publicité en ligne pour votre salon, spa ou clinique d'esthétique.pdf",
    cover: '/assets/img/cover-beaute.png',
    title: "Guide gratuit : La publicité en ligne pour votre salon, spa ou clinique d'esthétique | Essentiel PME",
    desc: "Coiffure, esthétique, massothérapie : remplir l'agenda en début de semaine et éviter les erreurs qui gaspillent votre budget. Guide gratuit de 8 pages.",
    eyebrow: 'GUIDE GRATUIT · 2026 · BEAUTÉ ET BIEN-ÊTRE',
    h1a: 'La publicité en ligne pour votre',
    h1grad: "salon, spa ou clinique d'esthétique.",
    lead: "Coiffure, esthétique, massothérapie, ongles, soins du corps : remplir l'agenda en début de semaine et éviter les erreurs qui gaspillent votre budget. Pas de jargon.",
    points: ['Remplir les plages creuses du début de semaine', "Instagram pour créer l'envie, Google pour capter la recherche", 'Les 5 erreurs qui gaspillent votre budget', 'Le calendrier des occasions et la liste de vérification'],
    compagniePh: 'Salon ou clinique *', compagnieErr: 'Le nom de votre salon.',
    chaptersLead: "Six sections courtes, écrites pour quelqu'un qui passe ses journées derrière la chaise ou en cabine, pas devant un écran.",
    chapters: [
      ['Les lundis et mardis ne se remplissent pas tout seuls.', 'Vos prochaines clientes décident en ligne où prendre rendez-vous, souvent le soir même, sur leur cellulaire.'],
      ['Instagram ou Google ? Les deux, mais pas pour la même chose.', "Instagram crée l'envie avec vos avant-après; Google capte « manucure près de moi ». Le dosage selon vos services."],
      ['Combien ça coûte, vraiment.', "Personne n'affiche ses prix dans cette industrie. Nous, oui : les repères réalistes, service par service."],
      ['Les 5 erreurs qui gaspillent votre budget.', 'Si vous avez déjà « boosté » un avant-après sans voir une seule réservation de plus, ce chapitre est pour vous.'],
      ['Annoncer au bon moment de l\'année.', 'Mariages, bals, fêtes : la beauté vit au rythme des occasions. Lancez vos campagnes 4 à 6 semaines avant.'],
      ["La liste de vérification avant d'investir un dollar.", 'Huit vérifications simples. Si vous cochez tout, votre budget travaillera. Sinon, chaque dollar fuit.'],
    ],
    statsHead: 'Les lundis et mardis ne se remplissent pas tout seuls.',
    stats: [
      ['Lundi et mardi', 'Des chaises vides en début de semaine, pendant que des milliers de recherches « près de moi » se font chaque semaine au Québec.'],
      ["L'avant-après", "Le métier le plus visuel qui soit : un balayage ou une pose d'ongles impeccable convainc plus vite que n'importe quel texte."],
      ['Aux 6 semaines', "Une cliente en coloration revient pendant des années. Chaque nouvelle cliente acquise, c'est du revenu récurrent pour longtemps."],
    ],
  },
  {
    slug: 'construction', label: 'Construction',
    pdf: '/assets/guides/guide-construction.pdf',
    pdfName: 'Guide - La publicité en ligne pour un entrepreneur en construction.pdf',
    cover: '/assets/img/cover-construction.png',
    title: 'Guide gratuit : La publicité en ligne pour un entrepreneur en construction | Essentiel PME',
    desc: 'Combien ça coûte, quel réseau choisir et quelles erreurs éviter, expliqué simplement pour les entrepreneurs du Québec. Guide gratuit de 8 pages.',
    eyebrow: 'GUIDE GRATUIT · 2026 · CONSTRUCTION',
    h1a: 'La publicité en ligne pour',
    h1grad: 'votre entreprise de construction.',
    lead: 'Combien ça coûte, quel réseau choisir et quelles erreurs éviter, expliqué simplement, pour les entrepreneurs du Québec. Pas de jargon.',
    points: ['Apparaître quand on cherche un entrepreneur dans votre secteur', 'Google pour les urgences, Facebook pour vos réalisations', 'Les 5 erreurs qui gaspillent votre budget', 'Le calendrier des saisons et la liste de vérification'],
    compagniePh: "Nom de l'entreprise *", compagnieErr: 'Le nom de votre entreprise.',
    chaptersLead: "Six sections courtes, écrites pour quelqu'un qui passe ses journées sur les chantiers, pas devant un écran.",
    chapters: [
      ['Le bouche-à-oreille ne remplit plus le carnet.', "97 % des consommateurs cherchent une entreprise locale en ligne avant d'appeler. Vos prochains clients magasinent le soir, sur Facebook et Google."],
      ['Google ou Facebook ? Les deux, mais pas pour la même chose.', 'Google capte « réparation toiture Laval »; Facebook fait connaître vos avant-après de chantiers. Le dosage selon votre métier.'],
      ['Combien ça coûte, vraiment.', 'Les repères réalistes 2026 : 30 à 100 $ par demande de soumission, face à des contrats de 15 000 à 40 000 $.'],
      ['Les 5 erreurs qui gaspillent votre budget.', 'Si vous avez déjà « boosté » une publication sans obtenir un seul appel, ce chapitre est pour vous.'],
      ["Annoncer au bon moment de l'année.", 'Rénovation en janvier, toiture au dégel, déneigement dès septembre : lancez vos campagnes 6 à 8 semaines avant la haute saison.'],
      ["La liste de vérification avant d'investir un dollar.", 'Huit vérifications simples, de la licence RBQ affichée au suivi des conversions. Si vous cochez tout, votre budget travaillera.'],
    ],
    statsHead: 'Le bouche-à-oreille ne remplit plus le carnet.',
    stats: [
      ['97 %', "des consommateurs cherchent une entreprise locale en ligne avant d'appeler. Votre réputation ne se rend pas jusqu'à eux si vous n'y êtes pas."],
      ['3 à 5 soumissions', "C'est ce qu'un propriétaire demande en moyenne avant de choisir. Si vous n'êtes pas dans la liste, vous ne soumissionnez pas."],
      ['2 mois d\'avance', 'Votre meilleur mois de publicité arrive toujours deux mois avant votre meilleur mois de chantier.'],
    ],
  },
  {
    slug: 'avocats-notaires', label: 'Avocats et notaires',
    pdf: '/assets/guides/guide-avocats-notaires.pdf',
    pdfName: 'Guide - La publicité en ligne pour les avocats et notaires au Québec.pdf',
    cover: '/assets/img/cover-avocats.png',
    title: 'Guide gratuit : La publicité en ligne pour les avocats et notaires au Québec | Essentiel PME',
    desc: 'Droit familial, immobilier, affaires, successions : être trouvé au moment où le client a besoin de vous. Guide gratuit de 8 pages.',
    eyebrow: 'GUIDE GRATUIT · 2026 · SERVICES JURIDIQUES',
    h1a: 'La publicité en ligne pour',
    h1grad: 'les avocats et notaires au Québec.',
    lead: 'Droit familial, immobilier, affaires, successions : être trouvé au moment où le client a besoin de vous. Pas de jargon.',
    points: ['Capter le besoin le jour où il surgit, sur Google', 'Facebook pour vulgariser et rester en tête', 'Les coûts réels 2026 : 30 à 150 $ par consultation demandée', 'Des campagnes conformes aux règles du Barreau et de la Chambre des notaires'],
    compagniePh: 'Cabinet ou étude *', compagnieErr: 'Le nom de votre cabinet.',
    chaptersLead: 'Six sections courtes, écrites pour des professionnels qui facturent à l\'heure et n\'ont pas de temps à perdre.',
    chapters: [
      ['Personne ne magasine un avocat « au cas où ».', 'La recherche se fait le jour du besoin, sur cellulaire. Le cabinet qui apparaît gagne le mandat; les autres n\'existent pas.'],
      ['Google ou Facebook ? Les deux, mais pas pour la même chose.', 'Google capte « avocat divorce près de moi »; Facebook vulgarise et garde votre cabinet en tête aux moments de vie.'],
      ['Combien ça coûte, vraiment.', "Le juridique est l'un des mots-clés les plus chers, parce que chaque mandat vaut cher : les repères réalistes 2026, sans détour."],
      ['Les 5 erreurs qui gaspillent votre budget.', 'Le besoin juridique est confidentiel : ce qui fonctionne pour un restaurant ne fonctionne pas pour un cabinet.'],
      ["Annoncer au bon moment de l'année.", 'Séparations en janvier, immobilier au printemps, successions à la rentrée : le juridique a ses saisons. La constance bat l\'intensité.'],
      ["La liste de vérification avant d'investir un dollar.", 'Neuf vérifications simples, de la page par domaine de droit aux règles du Barreau et de la Chambre des notaires : des campagnes conformes.'],
    ],
    statsHead: 'Personne ne magasine un avocat « au cas où ».',
    stats: [
      ['Le jour même', "Entre la recherche et la demande de consultation, il s'écoule quelques heures, pas quelques semaines."],
      ['2 à 3 cabinets', 'comparés en ligne avant d\'appeler : le site, les avis Google, la clarté. Le plus clair l\'emporte, pas le plus gros.'],
      ['Confidentiel', 'On ne demande pas un avocat en divorce à son entourage. On le demande à Google : ces mandats vont au cabinet visible en ligne.'],
    ],
  },
  {
    slug: 'pme', label: 'PME du Québec',
    pdf: '/assets/guides/guide-pme.pdf',
    pdfName: 'Guide - La publicité en ligne pour les PME du Québec.pdf',
    cover: '/assets/img/cover-pme.png',
    title: 'Guide gratuit : La publicité en ligne pour les PME du Québec | Essentiel PME',
    desc: 'Restaurant, garage, clinique, boutique ou bureau : comment ça marche, combien ça coûte vraiment et les erreurs à éviter. Guide gratuit de 8 pages.',
    eyebrow: 'GUIDE GRATUIT · 2026 · PME DU QUÉBEC',
    h1a: 'La publicité en ligne pour',
    h1grad: 'les PME du Québec.',
    lead: 'Restaurant, garage, clinique, boutique ou bureau : comment ça marche, combien ça coûte vraiment et les erreurs qui gaspillent votre budget. Pas de jargon.',
    points: ["97 % de vos clients cherchent en ligne avant d'acheter", 'Google ou Facebook selon ce que vous vendez', 'Les coûts réels 2026, industrie par industrie', 'Les 5 erreurs qui gaspillent votre budget'],
    compagniePh: "Nom de l'entreprise *", compagnieErr: 'Le nom de votre entreprise.',
    chaptersLead: "Six sections courtes, écrites pour quelqu'un qui fait rouler une entreprise, pas pour un spécialiste du marketing.",
    chapters: [
      ['Vos clients décident en ligne. Tous.', 'Soupers, toitures, soins ou conseils : la décision se prend sur un écran, souvent le soir, souvent sur un cellulaire.'],
      ['Google ou Facebook ? Ça dépend de ce que vous vendez.', 'Google capte la demande qui existe; Facebook crée celle qui dort. Le point de départ naturel de chaque industrie.'],
      ['Combien ça coûte, vraiment.', 'De 5 à 150 $ par client potentiel selon le secteur, et la logique simple : plus le client vaut cher, plus il rapporte.'],
      ['Les 5 erreurs qui gaspillent votre budget.', 'Le bouton « Boost », le ciblage trop large, l\'absence de mesure : les cinq pièges qui reviennent dans toutes les industries.'],
      ['Chaque industrie a sa saison. Annoncez avant la vôtre.', 'Votre meilleur mois de publicité arrive 4 à 8 semaines avant votre pic de ventes, quand les enchères sont encore basses.'],
      ["La liste de vérification avant d'investir un dollar.", 'Huit vérifications, valables pour toutes les industries. Si vous cochez tout, votre budget travaillera. Sinon, chaque dollar fuit.'],
    ],
    statsHead: 'Vos clients décident en ligne. Tous.',
    stats: [
      ['97 %', "des consommateurs cherchent une entreprise locale en ligne avant d'acheter. Tout commence par une recherche."],
      ['Soirs et week-ends', "C'est là que vos futurs clients magasinent, pendant que votre commerce est fermé. Votre publicité, elle, travaille à ces heures-là."],
      ['2 à 3 options', "comparées avant d'appeler. Celle qui apparaît en premier, avec de bons avis, part avec une longueur d'avance."],
    ],
  },
];

const lpCheckSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const lpMetaSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const lpPhoneSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';

function lpHeader(withCta) {
  return `  <header class="lp-header">
    <div class="lp-header-inner">
      <a href="https://essentielpme.com" target="_blank" rel="noopener" class="lp-logo"><img src="/assets/img/logo-h-fr-rgb.svg" alt="Essentiel PME"></a>
      <div class="lp-header-right">
        <a href="tel:18447633832" class="lp-phone">
          ${lpPhoneSvg}
          <span class="lp-phone-num">1-844-763-3832</span>
        </a>${withCta ? `
        <a href="#guide-form" class="btn btn-primary">Recevoir mon guide</a>` : ''}
      </div>
    </div>
  </header>`;
}

const lpFooter = `  <footer class="lp-footer">
    <div class="lp-footer-inner">
      <span>© 2026 Essentiel PME · Québec, QC</span>
      <span>info@essentielpme.com · 1-844-763-3832</span>
    </div>
  </footer>`;

function lpHead(title, desc) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<meta name="description" content="${jsonEsc(desc)}">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<link rel="icon" type="image/png" href="/assets/img/favicon.png">
<link rel="stylesheet" href="/assets/css/styles.css">
<link rel="stylesheet" href="/assets/css/landing.css">
${GTM_HEAD}`;
}

function lpPage(g) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
${lpHead(g.title, g.desc)}
</head>
<body>
${GTM_NOSCRIPT}
<div class="we-page">
${lpHeader(true)}

  <section class="lp-hero">
    <div class="lp-hero-blob"></div>
    <div class="lp-hero-grid">
      <div class="lp-hero-copy">
        <span class="hero-eyebrow"><span class="pulse"></span>${g.eyebrow}</span>
        <h1>${g.h1a} <span class="grad">${g.h1grad}</span></h1>
        <p class="lead">${g.lead}</p>
        <ul class="lp-points">
          ${g.points.map((pt) => `<li><span class="lp-check">${lpCheckSvg}</span>${pt}</li>`).join('\n          ')}
        </ul>
        <div class="hero-meta">
          <span>${lpMetaSvg} Coûts réels affichés</span>
          <span>${lpMetaSvg} Lecture de 10 minutes</span>
          <span>${lpMetaSvg} Fait pour le Québec</span>
        </div>
      </div>

      <div id="guide-form" class="lp-form-card">
        <div class="lp-form-head">
          <img src="${g.cover}" alt="Première page du guide">
          <div>
            <h2>Recevez votre exemplaire gratuit</h2>
            <p>Remplissez le formulaire et téléchargez le guide immédiatement.</p>
          </div>
        </div>
        <form class="lp-form" data-guide="${g.slug}" data-merci="/merci/${g.slug}/" novalidate>
          <div class="lp-form-row">
            <div class="lp-field">
              <input type="text" name="prenom" class="lp-input" placeholder="Prénom *" autocomplete="given-name">
              <span class="lp-error" data-error-for="prenom" hidden>Votre prénom.</span>
            </div>
            <div class="lp-field">
              <input type="text" name="nom" class="lp-input" placeholder="Nom *" autocomplete="family-name">
              <span class="lp-error" data-error-for="nom" hidden>Votre nom.</span>
            </div>
          </div>
          <div class="lp-field">
            <input type="text" name="compagnie" class="lp-input" placeholder="${g.compagniePh}" autocomplete="organization">
            <span class="lp-error" data-error-for="compagnie" hidden>${g.compagnieErr}</span>
          </div>
          <div class="lp-field">
            <input type="email" name="email" class="lp-input" placeholder="Courriel *" autocomplete="email">
            <span class="lp-error" data-error-for="email" hidden>Veuillez entrer un courriel valide.</span>
          </div>
          <button type="submit" class="btn btn-primary btn-lg">Recevoir mon guide →</button>
          <p class="lp-error" data-error-for="reseau" hidden>Une erreur est survenue. Réessayez ou écrivez-nous à info@essentielpme.com.</p>
          <p class="lp-consent">En téléchargeant ce guide, vous acceptez de recevoir des communications d'Essentiel PME. Vous pouvez vous désabonner en tout temps, en un seul clic.</p>
        </form>
      </div>
    </div>
  </section>

  <section class="section" style="background:#fff;">
    <div class="section-inner">
      <div class="section-head">
        <span class="eyebrow">CE QUE CONTIENT LE GUIDE</span>
        <h2>8 pages, droit à l'essentiel.</h2>
        <p class="lead">${g.chaptersLead}</p>
      </div>
      <div class="lp-chapters">
        ${g.chapters.map(([h, p], i) => `<div class="lp-chapter">
          <div class="lp-chapter-top">
            <div class="lp-chapter-icon">${LP_ICONS[i]}</div>
            <div class="lp-chapter-kicker">${LP_KICKERS[i]}</div>
          </div>
          <h3>${h}</h3>
          <p>${p}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section" style="background:var(--blanc-casse);">
    <div class="section-inner">
      <div class="section-head">
        <span class="eyebrow">LE CONSTAT</span>
        <h2>${g.statsHead}</h2>
      </div>
      <div class="lp-stats">
        ${g.stats.map(([n, p]) => `<div class="lp-stat">
          <div class="lp-stat-n">${n}</div>
          <p>${p}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="cta-band">
    <div class="cta-band-inner">
      <h2>Votre exemplaire vous attend.</h2>
      <p>Deux minutes pour le demander, dix minutes pour le lire. Gratuit, sans engagement.</p>
      <a href="#guide-form" class="btn btn-on-violet btn-lg">Recevoir mon guide →</a>
    </div>
  </section>

${lpFooter}
</div>
${consentUI('/', true)}
<script src="/assets/js/config.js"></script>
<script src="/assets/js/main.js"></script>
</body>
</html>
`;
}

/* Page de remerciement du formulaire de contact et de la prise de rendez-vous.
   Sert de destination de redirection à Brevo : c'est son chargement qui marque
   la conversion, la soumission se faisant chez Brevo et non sur le site.
   Hors index et hors sitemap, comme les pages merci des guides. */
function merciContactPage() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
${lpHead('Merci, votre demande est bien reçue | Essentiel PME', 'Votre demande a été transmise à l’équipe d’Essentiel PME.')}
</head>
<body>
${GTM_NOSCRIPT}
<div class="we-page lp-merci-page" data-form-id="contact">
${lpHeader(false)}

  <section class="lp-merci-hero">
    <div class="lp-hero-blob"></div>
    <div class="lp-merci-wrap">
      <div class="lp-merci-card">
        <div class="lp-merci-check"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
        <h1>C'est noté&nbsp;!</h1>
        <p class="lp-merci-text">Merci<span id="merci-prenom"></span>&nbsp;! Votre demande est entre les mains d'un humain de notre équipe. Vous aurez une réponse dans un jour ouvrable.</p>
        <p class="lp-merci-text" style="font-size:15px; color:var(--charbon-500);">Une question pressante&nbsp;? Écrivez-nous à <a href="mailto:${SITE.email}">${SITE.email}</a> ou appelez le <a href="tel:${SITE.phoneIntl}">${SITE.phone}</a>.</p>
        <a href="/publicite-en-ligne/" class="btn btn-primary btn-lg">Lire notre guide de la publicité en ligne →</a>
        <p class="lp-merci-back">Ou <a href="/">retournez à l'accueil</a> pour découvrir ce qu'Essentiel PME peut faire pour vous.</p>
      </div>
    </div>
  </section>

${lpFooter}
</div>
${consentUI('/', true)}
<script src="/assets/js/config.js"></script>
<script src="/assets/js/main.js"></script>
</body>
</html>
`;
}

function merciPage(g) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
${lpHead('Votre guide est prêt | Essentiel PME', 'Téléchargez votre exemplaire du guide.')}
</head>
<body>
${GTM_NOSCRIPT}
<div class="we-page lp-merci-page" data-guide="${g.slug}">
${lpHeader(false)}

  <section class="lp-merci-hero">
    <div class="lp-hero-blob"></div>
    <div class="lp-merci-wrap">
      <div class="lp-merci-card">
        <div class="lp-merci-check"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
        <h1>Votre guide est prêt&nbsp;!</h1>
        <p class="lp-merci-text">Merci<span id="merci-prenom"></span>&nbsp;! Cliquez ci-dessous pour télécharger votre exemplaire.</p>
        <a href="${g.pdf}" download="${g.pdfName}" class="btn btn-primary btn-lg">Télécharger le guide (PDF) →</a>
        <p class="lp-merci-back">Envie d'aller plus loin&nbsp;? <a href="https://essentielpme.com" target="_blank" rel="noopener">Découvrez ce qu'Essentiel PME peut faire pour vous →</a></p>
      </div>
    </div>
  </section>

${lpFooter}
</div>
${consentUI('/', true)}
<script src="/assets/js/config.js"></script>
<script src="/assets/js/main.js"></script>
</body>
</html>
`;
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
          ${p('Le contenu du Site (textes, logo, éléments graphiques, maquettes et structure) appartient à Essentiel PME ou à ses concédants. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite. Les marques et logos de tiers (notamment les plateformes publicitaires) appartiennent à leurs propriétaires respectifs.')}
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
          ${p("On conserve vos renseignements le temps nécessaire aux finalités décrites, puis on les détruit ou les anonymise de façon sécuritaire. Des mesures raisonnables, techniques et organisationnelles, protègent vos renseignements contre l'accès, l'utilisation ou la communication non autorisés.")}
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
# PDF des guides : réservés aux visiteurs qui remplissent le formulaire
Disallow: /assets/guides/

Sitemap: ${SITE.baseUrl}/sitemap.xml
`;

const llms = `# Essentiel PME

> Essentiel PME (EN : SMB Essentials) offre de la publicité en ligne entièrement gérée pour les PME du Québec.
> Prix fixes affichés, service bilingue FR/EN, réponse en 24 heures ouvrables.

## Services

- Publicité en ligne gérée de A à Z : configuration des comptes, pixels et audiences, rédaction des annonces (FR/EN), optimisation et rapport mensuel.
- Forfaits : Essentiel 695 $ / mois (1 plateforme) · Essentiel Plus 995 $ / mois (2 plateformes, reciblage, tests A/B) · Essentiel Performance 1 495 $ / mois (3 plateformes, tableau de bord temps réel).
- Frais d'installation unique : 600 $. Minimum 3 mois, puis mensuel avec préavis de 30 jours. Le budget média est payé directement aux plateformes.
- Plateformes prises en charge : Facebook, Instagram, LinkedIn, TikTok, YouTube, Pinterest, Reddit, Spotify, Google Ads, ChatGPT.

## Pages

- [Accueil](${SITE.baseUrl}/) : présentation des services, forfaits, témoignages, FAQ.
- [Publicité en ligne](${SITE.baseUrl}/publicite/) : les 3 forfaits en détail, inclusions et plateformes.
- [Plateformes](${SITE.baseUrl}/plateformes/) : description de chaque plateforme publicitaire et pour qui elle convient.
- [À propos](${SITE.baseUrl}/a-propos/) : mission, valeurs et processus en 6 étapes.
- [Blogue](${SITE.baseUrl}/blogue/) : conseils publicité en ligne pour PME (articles à venir).
- [Contact](${SITE.baseUrl}/contact/) : formulaire, ${SITE.email}, ${SITE.phone}, ${SITE.location}.
- [Guide : la publicité en ligne pour les PME au Québec](${SITE.baseUrl}/publicite-en-ligne/) : plateformes, coûts réels 2026 par industrie, les 5 erreurs, délais avant résultats.
- [Guide : mesurer sa publicité](${SITE.baseUrl}/mesurer-ses-resultats/) : GA4, pixel Meta et API Conversions, Loi 25, les 6 indicateurs d'un bon rapport.

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
  const enCanon = `${SITE.baseUrl}${enPagePathOf(pagePath)}`;

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

  // 6. Liens internes → /en/… (sauf assets, api, liens déjà /en/ et pages franco-seulement)
  html = html.replace(/href="\/(?!assets\/|api\/|en\/|en")/g, 'href="/en/');

  // 7. Bascule de langue : FR redevient un lien vers la version française, EN devient actif
  html = html.replace(/<a data-lang-link="fr" href="\/en/, '<a data-lang-link="fr" href="');
  html = html.replace(' data-lang-link="fr" ', ' data-lang-link="fr-x" ');
  html = html.replace(/ data-lang-link="fr-x" (href="[^"]*") class="active"/, ' data-lang-link="fr" $1');
  html = html.replace(/ data-lang-link="en" (href="[^"]*")/, ' data-lang-link="en" $1 class="active"');

  // 6b. Slugs anglais dans les liens /en/… (après la bascule, pour ne pas toucher le lien FR)
  for (const [fr, en] of Object.entries(EN_SLUGS)) {
    if (fr !== en) html = html.split(`href="/en/${fr}/`).join(`href="/en/${en}/`);
  }

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
  ['publicite-en-ligne/index.html', pilierPublicitePage()],
  ['mesurer-ses-resultats/index.html', pilierMesurePage()],
  ...industries.map((ind) => [`industries/${ind.key}/index.html`, industryPage(ind)]),
];

/* Pages dont la version anglaise est rédigée à part (contenu autoral EN),
   plutôt que traduite automatiquement par dictionnaire */
const EN_OVERRIDES = {
  'publicite-en-ligne/index.html': pilierPubliciteEN(),
  'mesurer-ses-resultats/index.html': pilierMesureEN(),
};

for (const [p, html] of pages) {
  const pagePath = '/' + p.replace(/index\.html$/, '');
  mkdirSync(dirname(join(OUT, p)), { recursive: true });
  writeFileSync(join(OUT, p), html);
  const enFile = enPagePathOf(pagePath).slice(1) + 'index.html';
  const en = toEnglish(EN_OVERRIDES[p] || html, pagePath);
  mkdirSync(dirname(join(OUT, enFile)), { recursive: true });
  writeFileSync(join(OUT, enFile), en);
  console.log('wrote', p, `(${html.length} o)`, '+', enFile, `(${en.length} o)`);
}

/* Landing pages des guides : françaises, noindex, hors sitemap et hors nav */
for (const g of GUIDES) {
  for (const [p, html] of [[`guide/${g.slug}/index.html`, lpPage(g)], [`merci/${g.slug}/index.html`, merciPage(g)]]) {
    mkdirSync(dirname(join(OUT, p)), { recursive: true });
    writeFileSync(join(OUT, p), html);
    console.log('wrote', p, '(landing noindex)');
  }
}

/* Remerciement du contact et des rendez-vous : destination de redirection Brevo */
{
  const p = 'merci/contact/index.html';
  mkdirSync(dirname(join(OUT, p)), { recursive: true });
  writeFileSync(join(OUT, p), merciContactPage());
  console.log('wrote', p, '(merci contact, noindex)');
}

const sitemapPaths = pages
  .map(([p]) => p.replace(/index\.html$/, ''))
  .flatMap((p) => {
    const en = enPagePathOf('/' + p).slice(1);
    return p === '' ? [en] : [p, en];
  });
writeFileSync(join(OUT, 'sitemap.xml'), sitemap(sitemapPaths));
writeFileSync(join(OUT, 'robots.txt'), robots);
writeFileSync(join(OUT, 'llms.txt'), llms);
console.log('wrote sitemap.xml, robots.txt, llms.txt');
