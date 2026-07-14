# Essentiel PME — site web statique

Site vitrine bilingue (FR/EN) pour Essentiel PME : publicité en ligne gérée pour les PME du Québec.
Implémenté en HTML/CSS/JS statique à partir des maquettes Claude Design (`project/Essentiel PME.dc.html`).

## Structure

```
site/
├── index.html                  Accueil (hero, forfaits, piliers, étapes, témoignages, FAQ)
├── publicite/                  Forfaits + plateformes + FAQ        (URL propre : /publicite/)
├── plateformes/ · a-propos/ · contact/ · blogue/ · mentions-legales/
├── industries/<vertical>/      6 pages SEO (construction, sante, beaute,
│                               restauration, services-pro, ecommerce)
├── en/…                        Version anglaise statique complète (même arborescence)
├── sitemap.xml · robots.txt · llms.txt
└── assets/
    ├── css/styles.css          Design system (violet/lavande, Nunito) + responsive + menu mobile
    ├── js/main.js              Menu mobile, FAQ, formulaire, défilement, bandeau de consentement
    ├── fonts/                  Nunito variable auto-hébergée (latin + latin-ext)
    └── img/                    Logos FR/EN, favicon, images industries, SuperQuanti
```

Toutes les URLs sont « propres » (sans `.html`) : chaque page est un dossier contenant un `index.html`.

## Bilinguisme

Le site anglais est **généré statiquement** sous `/en/…` au build (bon pour le SEO : balises
`hreflang`, canoniques et métadonnées propres à chaque langue). Le bouton **FR · EN** de
l'en-tête est un simple lien entre les deux versions d'une même page.

La traduction vient du dictionnaire `build/i18n-dict.mjs` (textes, placeholders, `alt`,
logos FR↔EN, plus `META_EN` pour les `<title>` et meta descriptions).
**Tout nouveau texte français doit recevoir son entrée dans le dictionnaire**, sinon il
restera en français sur les pages `/en/`.

## Mesure (GTM) et consentement

Google Tag Manager (`GTM-NWFC4HHZ`) est chargé sur toutes les pages avec le **Consent Mode**
de Google : tout est refusé par défaut jusqu'au choix du visiteur. Le bandeau (Loi 25)
présente trois catégories — **fonctionnels** (toujours actifs), **analytiques**
(`analytics_storage`) et **publicitaires** (`ad_storage`, `ad_user_data`,
`ad_personalization`) — pré-cochées. Niveau 1 : « Tout accepter » ou « Personnaliser » ;
le refus des optionnels se fait au niveau 2 (minimum 2 clics). Le choix est mémorisé dans
`localStorage` (`epme_consent`, JSON `{analytics, ads}`) et poussé au `dataLayer`
(événement `epme_consent`) pour déclencher les balises dans GTM.

Note SEO : `robots.txt` exclut `/cdn-cgi/` (lien technique injecté par Cloudflare pour la
protection des adresses courriel — signalé à tort comme 404 par les robots d'audit).

## Regénérer les pages

Les pages sont générées depuis `../build/` (contenu dans `data.mjs`, gabarits dans `build.mjs`) :

```bash
node build/build.mjs
```

Modifier le contenu → éditer `build/data.mjs`, puis regénérer. Ne pas éditer les `.html` à la main.

## Déploiement

Le site lui-même est statique : déposer le contenu de `site/` sur n'importe quel hébergement statique.
Le domaine canonique configuré est `https://essentielpme.com`
(voir `SITE.baseUrl` dans `build/data.mjs` pour le changer, puis regénérer).

Le formulaire de contact envoie un courriel via **Resend**, servi par une fonction serverless
(`../functions/`, format DigitalOcean Functions). Sur DigitalOcean App Platform :

1. Composant **Static Site** — source directory `site/`.
2. Composant **Functions** — source directory `functions/`, route HTTP `/api`
   (le site appelle `POST /api/contact/submit`, voir `CONTACT_ENDPOINT` dans `assets/js/main.js`).
3. Variables d'environnement du composant Functions :
   - `RESEND_API_KEY` (obligatoire, type *encrypted*)
   - `CONTACT_TO_EMAIL` (défaut : `info@essentielpme.com`)
   - `CONTACT_FROM_EMAIL` (défaut : `Essentiel PME <formulaire@essentielpme.com>` —
     l'adresse doit appartenir à un domaine vérifié dans Resend)

## Avant le lancement

- [x] Brancher le formulaire de contact sur un vrai backend (Resend, voir « Déploiement »).
- [ ] Brancher l'inscription à l'infolettre (pages industries).
- [x] Rédiger les pages légales (`mentions-legales.html` : conditions, confidentialité Loi 25, témoins).
- [ ] Ajouter les images du blogue (placeholders dégradés pour l'instant) et rédiger les articles.
- [ ] Remplacer `assets/img/og-cover.png` par un vrai visuel de partage 1200×630.
