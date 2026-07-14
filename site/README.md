# Essentiel PME — site web statique

Site vitrine bilingue (FR/EN) pour Essentiel PME : publicité en ligne gérée pour les PME du Québec.
Implémenté en HTML/CSS/JS statique à partir des maquettes Claude Design (`project/Essentiel PME.dc.html`).

## Structure

```
site/
├── index.html                  Accueil (hero, forfaits, piliers, étapes, témoignages, FAQ)
├── publicite.html              Forfaits Départ / Croissance / Performance + plateformes + FAQ
├── plateformes.html            Une section par plateforme (10), ancres #plat-*
├── a-propos.html               Mission, valeurs, processus en 6 étapes
├── contact.html                Formulaire validé côté client + coordonnées
├── blogue.html                 Article vedette + 6 aperçus (contenu à venir)
├── politique-de-*.html         Pages légales (placeholders, noindex)
├── industries/                 6 pages SEO, une par vertical
│   ├── construction.html · sante.html · beaute.html
│   └── restauration.html · services-pro.html · ecommerce.html
├── sitemap.xml · robots.txt · llms.txt
└── assets/
    ├── css/styles.css          Design system (violet/lavande, Nunito) + responsive + menu mobile
    ├── js/main.js              Menu mobile, FAQ, formulaires, défilement, bascule FR/EN
    ├── js/i18n.js              Dictionnaire FR→EN complet (moteur DOM-walk)
    ├── fonts/                  Nunito variable auto-hébergée (latin + latin-ext)
    └── img/                    Logos FR/EN, favicon, images industries, SuperQuanti
```

## Bilinguisme

Le bouton **FR · EN** de l'en-tête traduit toute la page via le dictionnaire de `assets/js/i18n.js`
(textes, placeholders, attributs `alt`, logos FR↔EN). Le choix est mémorisé (`localStorage`).
**Tout nouveau texte français ajouté au site doit recevoir son entrée dans le dictionnaire**,
sinon il restera en français en mode EN.

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
