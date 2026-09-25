// Approved BoF landing pages. Other industries retain their template.
const shared = {
  why: [
    ['Une offre pensée pour les PME', 'Un accompagnement adapté à vos priorités.'],
    ['Des forfaits transparents', 'Vous connaissez les frais de gestion et le budget média.'],
    ['Des échanges simples', 'On vous explique les décisions et les prochaines étapes.'],
  ],
};

const sectors = {
  construction: {
    title: 'Publicité en construction au Québec | Essentiel PME',
    desc: 'Confiez vos campagnes publicitaires à Essentiel PME. Gestion de publicité en ligne pour entrepreneurs en construction et métiers au Québec. Réservez un appel découverte.',
    eyebrow: 'CONSTRUCTION ET MÉTIERS',
    heading: 'Votre publicité en construction, gérée pour vous.',
    intro: 'Des campagnes adaptées à vos travaux, à votre territoire et à votre budget.',
    approach: 'Vous êtes sur le terrain. On gère vos campagnes.',
    rows: [
      ['Vos travaux prioritaires', 'On met de l’avant les services à développer.'],
      ['Votre territoire', 'On cible les régions que vous desservez.'],
      ['Un suivi clair', 'Vous savez ce qui se passe dans vos campagnes.'],
    ],
    heroAlt: 'Entrepreneur en construction qui consulte des plans sur un chantier résidentiel',
    detailAlt: 'Entrepreneur qui consulte une campagne publicitaire sur son ordinateur',
    priceHeading: 'Un budget clair, dès le départ.',
    priceIntro: '',
    closing: 'Un premier échange pour voir si notre accompagnement vous convient.',
    sectorQuestion: 'Pouvez-vous cibler les villes que je dessers ?',
    sectorAnswer: 'Oui. On définit avec vous les villes et les régions à privilégier, selon vos travaux, votre capacité et les options des plateformes publicitaires.',
  },
  'services-pro': {
    title: 'Publicité pour services professionnels | Essentiel PME',
    desc: 'Confiez la publicité de votre entreprise de services à Essentiel PME. Des campagnes adaptées à votre expertise, à votre clientèle et à votre budget. Parlons de vos objectifs.',
    eyebrow: 'PROFESSIONNELS ET ENTREPRISES DE SERVICES',
    heading: 'Vous offrez les services. On gère votre publicité.',
    intro: 'Des campagnes adaptées à votre expertise, à vos clients et à votre budget.',
    approach: 'Votre publicité, prise en charge.',
    rows: [
      ['Une stratégie adaptée', 'On part de vos services et de vos objectifs.'],
      ['Des annonces qui vous ressemblent', 'Vous validez les messages avant leur diffusion.'],
      ['Un suivi clair', 'On suit les campagnes et on les ajuste avec vous.'],
    ],
    heroAlt: 'Professionnel autonome qui prépare un mandat client à son bureau',
    detailAlt: 'Professionnel qui examine sa publicité en ligne, avec ses notes de travail',
    priceHeading: 'Sachez ce que vous investissez.',
    priceIntro: 'Un forfait de gestion, un budget publicitaire en sus et des conditions expliquées dès le départ.',
    closing: 'Un premier échange pour discuter de vos services et des clients à rejoindre.',
    sectorQuestion: 'Est-ce adapté à mon entreprise de services ?',
    sectorAnswer: 'Notre accompagnement s’adresse aux professionnels autonomes et aux entreprises de services : consultation, design, formation et autres expertises. On évalue avec vous les services à promouvoir, la clientèle à rejoindre et le budget disponible.',
  },
};

sectors['pme-quebec'] = {
  ...sectors['services-pro'],
  imageKey: 'services-pro',
  title: 'Publicité en ligne pour PME au Québec | Essentiel PME',
  desc: 'Gestion de publicité en ligne pour les PME du Québec. Des campagnes adaptées à vos objectifs et à votre budget. Réservez votre appel découverte avec Essentiel PME.',
  eyebrow: 'PME DU QUÉBEC',
  heading: 'Votre publicité en ligne, gérée pour vous.',
  intro: 'Des campagnes adaptées à votre entreprise, à vos clients et à votre budget.',
  approach: 'Vous gérez votre PME. On gère vos campagnes.',
  rows: [
    ['Une stratégie adaptée', 'On part de votre offre et des clients que vous voulez rejoindre.'],
    ['Des annonces qui vous ressemblent', 'Vous validez les messages avant leur diffusion.'],
    ['Un suivi clair', 'On suit les campagnes et on les ajuste avec vous.'],
  ],
  closing: 'Un premier échange pour discuter de votre entreprise et de vos objectifs publicitaires.',
  sectorQuestion: 'Est-ce adapté à mon secteur d’activité ?',
  sectorAnswer: 'Nous accompagnons les PME du Québec, qu’elles vendent des produits ou des services. Le premier appel sert à évaluer votre offre, votre marché et votre budget, puis à déterminer si notre accompagnement vous convient.',
};

const cta = (placement) => `<a class="lp-cta" href="/contact/" data-lp-book="${placement}">Réserver mon appel découverte</a>`;
const rows = (items) => `<dl class="lp-rows">${items.map(([title, text]) => `<div><dt>${title}</dt><dd>${text}</dd></div>`).join('')}</dl>`;

export function landingHeader(fr, en) {
  return `<a class="skip-link" href="#contenu">Aller au contenu</a>
  <header class="lp-header"><div class="lp-container lp-header-inner">
    <a class="lp-logo" href="/" aria-label="Essentiel PME (Accueil)"><img src="/assets/img/logo-h-fr-rgb.svg" alt="Essentiel PME" width="200" height="60"></a>
    <nav aria-label="Navigation principale"><a href="#accompagnement">L’accompagnement</a><a href="#pourquoi">Pourquoi Essentiel PME</a><a href="#faq">FAQ</a><a href="/contact/" data-lp-book="navigation">Prendre rendez-vous</a></nav>
    <div class="lp-language"><a data-lang-link="fr" href="${fr}" class="active" hreflang="fr-CA">FR</a><span>·</span><a data-lang-link="en" href="${en}" hreflang="en-CA">EN</a></div>
  </div></header>`;
}

export function landingFooter() {
  return `<footer class="lp-footer"><div class="lp-container lp-footer-inner">
    <a class="lp-logo" href="/" aria-label="Essentiel PME (Accueil)"><img src="/assets/img/logo-h-fr-rgb.svg" alt="Essentiel PME" width="180" height="54" loading="lazy"></a>
    <nav aria-label="Liens utiles"><a href="/publicite/">Nos forfaits</a><a href="/a-propos/">À propos</a><a href="/mentions-legales/#politique-de-confidentialite">Confidentialité</a><a href="/contact/">Nous joindre</a></nav>
    <small>© 2026 Essentiel PME</small>
  </div></footer>`;
}

export function landingContent(key) {
  const s = sectors[key];
  const imageKey = s.imageKey || key;
  const faq = [
    ['Le budget publicitaire est-il inclus ?', 'Non. Les frais de gestion couvrent notre accompagnement. Le budget média est payé séparément aux plateformes.'],
    ['Que comprend la gestion des campagnes ?', 'Selon le forfait choisi, on prend en charge la configuration, la rédaction des annonces, le ciblage, l’optimisation et les rapports. Le nombre de plateformes et la fréquence du suivi sont précisés avant de commencer.'],
    [s.sectorQuestion, s.sectorAnswer],
    ['Comment se déroule le premier appel ?', 'On discute de vos services, de vos objectifs, de votre clientèle et de votre budget. Cet échange permet de voir si notre accompagnement convient à votre entreprise et de vous expliquer les prochaines étapes.'],
  ];
  return { title: s.title, desc: s.desc,
    headExtras: `<link rel="stylesheet" href="/assets/css/industry-landing.css?v=20260925">
  <link rel="stylesheet" href="/assets/booking/booking.css">
  <script src="/assets/booking/environment.js"></script>
  <script type="module" src="/assets/js/industry-landing.mjs?v=20260925"></script>`,
    body: `<div class="lp-content" data-lp-sector="${key}">
      <section class="lp-hero lp-container lp-split" aria-labelledby="lp-title">
        <div class="lp-hero-copy"><p class="lp-eyebrow">${s.eyebrow}</p><h1 id="lp-title">${s.heading}</h1><p class="lp-intro">${s.intro}</p>${cta('hero')}</div>
        <img class="lp-photo lp-hero-photo" src="/assets/img/lp-${imageKey}-hero.webp" alt="${s.heroAlt}" width="1200" height="900" fetchpriority="high" decoding="async">
      </section>
      <section class="lp-container lp-section lp-split" id="accompagnement" aria-labelledby="approach-title"><h2 id="approach-title">${s.approach}</h2>${rows(s.rows)}</section>
      <section class="lp-container lp-section lp-split lp-why" id="pourquoi" aria-labelledby="why-title">
        <img class="lp-photo" src="/assets/img/lp-${imageKey}-detail.webp" alt="${s.detailAlt}" width="1200" height="900" loading="lazy" decoding="async">
        <div><h2 id="why-title">Pourquoi choisir Essentiel PME ?</h2>${rows(shared.why)}</div>
      </section>
      <section class="lp-price-band" aria-labelledby="price-title"><div class="lp-container lp-split">
        <div><h2 id="price-title">${s.priceHeading}</h2>${s.priceIntro ? `<p>${s.priceIntro}</p>` : ''}</div>
        <div class="lp-price"><p class="lp-eyebrow">FORFAIT DE GESTION</p><p class="lp-price-value"><span>Dès</span> 695 $ <small>/ mois</small></p><p>Frais de gestion · Budget publicitaire en sus</p><p>Installation : 600 $ · Engagement initial de 3 mois</p></div>
      </div></section>
      <section class="lp-container lp-section lp-split lp-closing" id="rendez-vous" aria-labelledby="closing-title"><div><h2 id="closing-title">Voyons comment la publicité peut soutenir votre entreprise.</h2><p>${s.closing}</p></div><div class="lp-closing-action">${cta('closing')}</div></section>
      <section class="lp-container lp-faq" id="faq" aria-labelledby="faq-title"><h2 id="faq-title">Questions fréquentes</h2>
        ${faq.map(([q,a],i) => `<details${i === 0 ? ' open' : ''}><summary>${q}<span aria-hidden="true"></span></summary><p>${a}</p></details>`).join('')}
      </section>
      <dialog class="lp-booking-dialog" aria-labelledby="booking-title"><div class="lp-dialog-head"><h2 id="booking-title">Réserver mon appel découverte</h2><button type="button" data-lp-close aria-label="Fermer le calendrier">×</button></div><div class="bk-root" data-booking-app data-embedded data-native><p>Chargement du calendrier…</p></div><p class="lp-booking-help"><a href="/contact/">Nous joindre</a></p></dialog>
    </div>`,
  };
}

export const landingTranslations = [
  ['Publicité en ligne pour PME au Québec | Essentiel PME', 'Online advertising for Quebec small businesses | SMB Essentials'],
  ['Gestion de publicité en ligne pour les PME du Québec. Des campagnes adaptées à vos objectifs et à votre budget. Réservez votre appel découverte avec Essentiel PME.', 'Online advertising management for Quebec small businesses. Campaigns tailored to your goals and budget. Book your discovery call with SMB Essentials.'],
  ['PME DU QUÉBEC', 'QUEBEC SMALL BUSINESSES'],
  ['Votre publicité en ligne, gérée pour vous.', 'Your online advertising, managed for you.'],
  ['Des campagnes adaptées à votre entreprise, à vos clients et à votre budget.', 'Campaigns tailored to your business, your customers and your budget.'],
  ['Vous gérez votre PME. On gère vos campagnes.', 'You run your business. We manage your campaigns.'],
  ['On part de votre offre et des clients que vous voulez rejoindre.', 'We start with what you offer and the customers you want to reach.'],
  ['Un premier échange pour discuter de votre entreprise et de vos objectifs publicitaires.', 'An initial conversation about your business and your advertising goals.'],
  ['Est-ce adapté à mon secteur d’activité ?', 'Is this right for my industry?'],
  ['Nous accompagnons les PME du Québec, qu’elles vendent des produits ou des services. Le premier appel sert à évaluer votre offre, votre marché et votre budget, puis à déterminer si notre accompagnement vous convient.', 'We support Quebec small businesses that sell products or services. The first call helps us assess your offering, market and budget, and determine whether our service is right for you.'],
  ['Publicité en construction au Québec | Essentiel PME','Construction advertising in Quebec | SMB Essentials'],
  ['Publicité pour services professionnels | Essentiel PME','Advertising for service businesses | SMB Essentials'],
  ['L’accompagnement','Our service'],['Pourquoi Essentiel PME','Why choose us'],['Prendre rendez-vous','Book a call'],['Liens utiles','Useful links'],['Nos forfaits','Our packages'],['Nous joindre','Contact us'],['Confidentialité','Privacy'],
  ['Réserver mon appel découverte','Book my discovery call'],['Fermer le calendrier','Close the calendar'],
  ['CONSTRUCTION ET MÉTIERS','CONSTRUCTION AND TRADES'],['PROFESSIONNELS ET ENTREPRISES DE SERVICES','PROFESSIONALS AND SERVICE BUSINESSES'],
  ['Votre publicité en construction, gérée pour vous.','Your construction advertising, managed for you.'],
  ['Des campagnes adaptées à vos travaux, à votre territoire et à votre budget.','Campaigns tailored to your work, your service area and your budget.'],
  ['Vous êtes sur le terrain. On gère vos campagnes.','You’re on the job. We manage your campaigns.'],
  ['Vos travaux prioritaires','Your priority services'],['On met de l’avant les services à développer.','We promote the services you want to grow.'],
  ['Votre territoire','Your service area'],['On cible les régions que vous desservez.','We target the areas you serve.'],
  ['Un suivi clair','Clear reporting'],['Vous savez ce qui se passe dans vos campagnes.','You know what’s happening with your campaigns.'],
  ['Vous offrez les services. On gère votre publicité.','You provide the services. We manage your advertising.'],
  ['Des campagnes adaptées à votre expertise, à vos clients et à votre budget.','Campaigns tailored to your expertise, your clients and your budget.'],
  ['Votre publicité, prise en charge.','Your advertising, taken care of.'],['Une stratégie adaptée','A tailored strategy'],['On part de vos services et de vos objectifs.','We start with your services and your goals.'],
  ['Des annonces qui vous ressemblent','Ads that reflect your business'],['Vous validez les messages avant leur diffusion.','You approve the messaging before it goes live.'],['On suit les campagnes et on les ajuste avec vous.','We monitor your campaigns and adjust them with you.'],
  ['Pourquoi choisir Essentiel PME ?','Why choose SMB Essentials?'],['Une offre pensée pour les PME','Designed for small businesses'],['Un accompagnement adapté à vos priorités.','Support that fits your priorities.'],['Des forfaits transparents','Transparent packages'],['Vous connaissez les frais de gestion et le budget média.','You know the management fees and media budget.'],['Des échanges simples','Straightforward conversations'],['On vous explique les décisions et les prochaines étapes.','We explain the decisions and next steps.'],
  ['Un budget clair, dès le départ.','A clear budget from the start.'],['Sachez ce que vous investissez.','Know what you’re investing.'],['Un forfait de gestion, un budget publicitaire en sus et des conditions expliquées dès le départ.','A management package, a separate ad budget and clear terms from the start.'],
  ['FORFAIT DE GESTION','MANAGEMENT PACKAGE'],['Dès','From'],['/ mois','/ month'],['Frais de gestion · Budget publicitaire en sus','Management fees · Ad budget extra'],['Installation : 600 $ · Engagement initial de 3 mois','Setup: $600 · Initial 3-month commitment'],
  ['Voyons comment la publicité peut soutenir votre entreprise.','Let’s explore how advertising can support your business.'],['Un premier échange pour voir si notre accompagnement vous convient.','An initial conversation to see whether our service is right for you.'],['Un premier échange pour discuter de vos services et des clients à rejoindre.','An initial conversation about your services and the clients you want to reach.'],
  ['Le budget publicitaire est-il inclus ?','Is the advertising budget included?'],['Non. Les frais de gestion couvrent notre accompagnement. Le budget média est payé séparément aux plateformes.','No. Management fees cover our services. The media budget is paid separately to the platforms.'],
  ['Que comprend la gestion des campagnes ?','What does campaign management include?'],['Selon le forfait choisi, on prend en charge la configuration, la rédaction des annonces, le ciblage, l’optimisation et les rapports. Le nombre de plateformes et la fréquence du suivi sont précisés avant de commencer.','Depending on your package, we handle setup, ad copy, targeting, optimization and reporting. The number of platforms and reporting frequency are agreed on before we start.'],
  ['Pouvez-vous cibler les villes que je dessers ?','Can you target the cities I serve?'],['Oui. On définit avec vous les villes et les régions à privilégier, selon vos travaux, votre capacité et les options des plateformes publicitaires.','Yes. Together, we identify the cities and regions to prioritize based on your services, capacity and the advertising platforms’ options.'],
  ['Est-ce adapté à mon entreprise de services ?','Is this right for my service business?'],['Notre accompagnement s’adresse aux professionnels autonomes et aux entreprises de services : consultation, design, formation et autres expertises. On évalue avec vous les services à promouvoir, la clientèle à rejoindre et le budget disponible.','We support independent professionals and service businesses, including consulting, design, training and other areas of expertise. Together, we assess the services to promote, the clients to reach and the available budget.'],
  ['Comment se déroule le premier appel ?','What happens during the first call?'],['On discute de vos services, de vos objectifs, de votre clientèle et de votre budget. Cet échange permet de voir si notre accompagnement convient à votre entreprise et de vous expliquer les prochaines étapes.','We discuss your services, goals, clients and budget. This conversation helps us see whether our service fits your business and explain the next steps.'],
  ['Entrepreneur en construction qui consulte des plans sur un chantier résidentiel','Construction contractor reviewing plans on a residential job site'],['Entrepreneur qui consulte une campagne publicitaire sur son ordinateur','Contractor reviewing an advertising campaign on a laptop'],['Professionnel autonome qui prépare un mandat client à son bureau','Independent professional preparing client work at a desk'],['Professionnel qui examine sa publicité en ligne, avec ses notes de travail','Professional reviewing online advertising alongside work notes'],
  ['Confiez vos campagnes publicitaires à Essentiel PME. Gestion de publicité en ligne pour entrepreneurs en construction et métiers au Québec. Réservez un appel découverte.','Delegate your advertising campaigns to SMB Essentials. Online advertising management for construction contractors and trades in Quebec. Book a discovery call.'],
  ['Confiez la publicité de votre entreprise de services à Essentiel PME. Des campagnes adaptées à votre expertise, à votre clientèle et à votre budget. Parlons de vos objectifs.','Delegate your service business advertising to SMB Essentials. Campaigns tailored to your expertise, clients and budget. Let’s discuss your goals.'],
];
