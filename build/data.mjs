/* Essentiel PME — content data transcribed from the Claude Design prototype
   (project/Essentiel PME.dc.html). Single source of truth for the generator. */

export const SITE = {
  baseUrl: 'https://essentielpme.com',
  name: 'Essentiel PME',
  nameEn: 'SMB Essentials',
  email: 'info@essentielpme.com',
  phone: '1-844-763-3832',
  phoneIntl: '+18447633832',
  location: 'Québec, QC',
  booking: 'https://calendar.app.google/pXr3yLkroT65qT9aA',
  bookingEmbed: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0xjxkbQBy4ctc9QxV6xIxkzPfBwv9Q0Rt4OXJC_vqlR0Hlaf91NwrbECp_1FkJBFOij7_zzLty?gv=true',
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61591838577895',
    instagram: 'https://www.instagram.com/essentielpme',
    linkedin: 'https://www.linkedin.com/company/essentiel-pme',
  },
  superquanti: 'https://superquanti.com',
  lastmod: '2026-07-10',
};

/* ---------------- Forfaits publicité ----------------
   Same names everywhere: Essentiel / Essentiel Plus / Essentiel Performance. */
export const adPackages = [
  {
    key: 'depart',
    homeName: 'Essentiel',
    adsName: 'Essentiel',
    price: '695',
    tag: 'Tester la publicité sociale',
    budget: 'Budget média recommandé&nbsp;: jusqu’à 1&nbsp;500&nbsp;$&nbsp;/&nbsp;mois (payé aux plateformes)',
    bullets: [
      '1 plateforme',
      'Configuration&nbsp;: comptes, pixels, objectifs',
      'Rédaction de 2 annonces par mois (FR/EN)',
      'Optimisation 1 fois par mois',
      'Suivi des conversions GA4 (base)',
      'Rapport mensuel automatique',
      '1 h d’accompagnement par mois',
    ],
    cta: 'Choisir Essentiel',
    featured: false,
  },
  {
    key: 'croissance',
    homeName: 'Essentiel Plus',
    adsName: 'Essentiel Plus',
    price: '995',
    tag: 'Générer des demandes régulières',
    budget: 'Budget média recommandé&nbsp;: 1&nbsp;500 à 4&nbsp;000&nbsp;$&nbsp;/&nbsp;mois (payé aux plateformes)',
    bullets: [
      '2 plateformes au choix',
      'Reciblage + tests A/B (annonces)',
      'Rédaction de 4 annonces par mois (FR/EN)',
      'Optimisation 2 fois par mois',
      'Suivi des conversions GA4',
      'Rapport mensuel + appel mensuel',
      '2 h d’accompagnement par mois',
    ],
    cta: 'Choisir Essentiel Plus',
    featured: true,
  },
  {
    key: 'performance',
    homeName: 'Essentiel Performance',
    adsName: 'Essentiel Performance',
    price: '1&nbsp;495',
    tag: 'Accélérer la croissance',
    budget: 'Budget média recommandé&nbsp;: 4&nbsp;000 à 8&nbsp;000&nbsp;$&nbsp;/&nbsp;mois (payé aux plateformes)',
    bullets: [
      '3 plateformes au choix',
      'Audiences similaires + tests A/B complets',
      'Rédaction de 8 annonces par mois (FR/EN)',
      'Optimisation hebdomadaire',
      'GA4 + événements personnalisés',
      'Tableau de bord Looker Studio en temps réel',
      '3 h + revue stratégique trimestrielle',
    ],
    cta: 'Choisir Essentiel Performance',
    featured: false,
  },
];

export const includedInAll = [
  'Création de vos comptes publicitaires',
  'Accès à vos pages publicitaires',
  'Définition des objectifs',
  'Configuration des pixels de suivi',
  'Rédaction des annonces en français et en anglais',
  'Suivi des conversions GA4',
  'Rapport mensuel',
  'Suivi et consentement configurés',
];

/* ---------------- FAQ ---------------- */
export const faqHome = [
  {
    q: 'Combien de temps avant le lancement de mes campagnes&nbsp;?',
    a: 'Vos comptes et le suivi sont en place en quelques semaines, puis on lance. Les premières données arrivent en quelques jours.',
    open: true,
  },
  {
    q: 'Est-ce que je suis pris dans un contrat&nbsp;?',
    a: 'Nos forfaits publicitaires ont un minimum de 3 mois, puis sont annulables avec un préavis de 30 jours.',
  },
  {
    q: 'Le budget publicitaire est-il inclus&nbsp;?',
    a: 'Non. Les frais de gestion couvrent notre travail; le budget média est payé directement aux plateformes.',
  },
  {
    q: 'Les annonces sont-elles bilingues&nbsp;?',
    a: 'Oui. On rédige vos annonces en français et en anglais.',
  },
  {
    q: 'Gérez-vous le suivi et le consentement&nbsp;?',
    a: 'Oui. Le suivi et le consentement (pixels, GA4) sont configurés correctement dès le départ.',
  },
];

export const faqAds = [
  {
    q: 'Le budget publicitaire est-il inclus dans le forfait&nbsp;?',
    a: 'Non. Les frais de gestion couvrent notre travail. Le budget média est payé directement aux plateformes par vous. Ratio recommandé&nbsp;: environ 2&nbsp;:&nbsp;1 (média : gestion).',
  },
  {
    q: 'Sur quelles plateformes pouvez-vous annoncer&nbsp;?',
    a: 'Toutes les grandes plateformes&nbsp;: Meta (Facebook/Instagram), LinkedIn, TikTok, YouTube, Pinterest, Spotify, Reddit et Google Ads. Le nombre de plateformes simultanées dépend du forfait choisi.',
  },
  {
    q: 'Qui fournit les visuels des annonces&nbsp;?',
    a: 'Nous fournissons les visuels en fonction du kit de marque de votre entreprise (couleurs, logo, typographie). Nous nous occupons aussi de la rédaction des annonces en français et en anglais.',
  },
  {
    q: 'Quand vais-je voir des résultats&nbsp;?',
    a: 'Les premières données arrivent en quelques jours, mais comptez 4 à 8 semaines d’optimisation pour un coût par prospect stable.',
  },
  {
    q: 'Puis-je arrêter quand je veux&nbsp;?',
    a: 'Après le minimum de 3 mois, oui, avec un préavis de 30 jours.',
  },
];

/* ---------------- Témoignages ---------------- */
export const testimonials = [
  {
    text: 'Un service super efficace. Toute l’équipe a été professionnelle. Nos campagnes ont doublé nos demandes de devis en deux mois.',
    initials: 'JM', name: 'Julie M.', role: 'Salon Beauté Avena',
  },
  {
    text: 'Nos campagnes nous amènent des appels chaque semaine, et le prix est resté tel qu’annoncé. C’est rare.',
    initials: 'MT', name: 'Marc T.', role: 'Plomberie Tremblay',
  },
  {
    text: 'On n’a pas le temps de gérer nos pubs&nbsp;: ils s’occupent de tout et répondent vite. Nos clientes nous trouvent maintenant en ligne.',
    initials: 'NK', name: 'Nadia K.', role: 'Nadia Comptabilité &amp; Cie',
  },
  {
    text: 'La publicité en ligne nous semblait compliquée. Ils ont tout configuré et le rapport mensuel se lit en cinq minutes.',
    initials: 'SL', name: 'Simon L.', role: 'Toitures Lachance',
  },
];

/* ---------------- Étapes (accueil) ---------------- */
export const homeSteps = [
  { t: 'Parlez-nous de vos besoins', b: 'Un court appel pour comprendre votre entreprise, vos clients et vos objectifs.' },
  { t: 'On crée et on configure', b: 'Nos experts configurent vos comptes, rédigent vos annonces et bâtissent vos campagnes. Vous validez en cours de route.' },
  { t: 'On lance et on optimise', b: 'Mise en ligne, suivi des conversions et accompagnement après le lancement.' },
];

export const homeFeatures = [
  { big: '0&nbsp;$', h: 'Zéro frais cachés', p: 'Frais de gestion affichés, budget média payé aux plateformes. Ce qu’on annonce, c’est ce que vous payez.' },
  { big: '2-4', h: 'Semaines pour lancer', p: 'Une approche structurée&nbsp;: comptes, pixels et audiences en place, puis vos campagnes partent en quelques semaines.' },
  { big: '100&nbsp;%', h: 'Clé en main', p: 'Comptes, pixels et audiences&nbsp;: on configure tout, du début au lancement.' },
];

/* ---------------- Processus (À propos) ---------------- */
export const aboutProcess = [
  { t: 'Vous remplissez le formulaire', b: 'Indiquez vos objectifs et votre budget média approximatif.' },
  { t: 'Brief et contrat', b: 'On définit ensemble les objectifs, l’offre et les audiences. Signature électronique.' },
  { t: 'Configuration', b: 'Comptes publicitaires, pixels et audiences&nbsp;: tout est installé correctement.' },
  { t: 'Rédaction et lancement', b: 'Rédaction des annonces en français et en anglais, puis lancement des campagnes.' },
  { t: 'Optimisation', b: 'Ajustements selon votre forfait&nbsp;: mensuel, bimensuel ou hebdomadaire.' },
  { t: 'Rapport et suivi', b: 'Rapport mensuel clair et appel de suivi. Vous savez exactement ce que rapporte chaque dollar.' },
];

export const aboutValues = [
  { h: 'Simplicité', p: 'Nous simplifions l’approche, autant pour nos clients qu’au sein de l’entreprise.' },
  { h: 'Efficacité', p: 'Nous visons l’efficacité pour éviter les complications non nécessaires.' },
  { h: 'Rapidité', p: 'Nous servons nos clients rapidement, pour lancer leurs campagnes sans attendre.' },
];

/* ---------------- Plateformes ----------------
   Icon path data from the prototype (Font Awesome brand glyphs + ChatGPT mark). */
export const platforms = [
  {
    key: 'facebook', anchor: 'plat-facebook', label: 'Facebook',
    viewBox: '0 0 320 512', tileW: 20,
    path: 'M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z',
    hook: 'Là où tout le Québec passe, chaque jour.',
    desc: 'La plateforme la plus utilisée au Québec, tous âges confondus. Parfaite pour faire connaître un commerce local, promouvoir des offres et rester présent dans le quotidien de vos clients.',
    ideal: 'Restaurants, salons, commerces de quartier, entrepreneurs en construction.',
    atouts: [
      "Le ciblage local le plus fin&nbsp;: rayon autour de votre commerce, âges, champs d'intérêt.",
      'Des formats éprouvés pour les promotions&nbsp;: offres, événements, catalogues de produits.',
      "Le reciblage des visiteurs de votre site, pour rester présent jusqu'à l'achat.",
    ],
    formats: 'Image, vidéo, carrousel, Stories et Reels, événements',
    objectifs: 'Notoriété locale, achalandage, demandes de soumission, promotions',
  },
  {
    key: 'instagram', anchor: 'plat-instagram', label: 'Instagram',
    viewBox: '0 0 448 512', tileW: 28,
    path: 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z',
    hook: 'Si votre travail se montre, Instagram le vend.',
    desc: 'La plateforme du visuel. Avant/après, réalisations, coulisses&nbsp;: si votre travail se montre, Instagram le vend à votre place.',
    ideal: 'Beauté et bien-être, restauration, design, boutiques.',
    atouts: [
      'La vitrine des métiers visuels&nbsp;: avant/après, réalisations, coulisses.',
      'Stories et Reels&nbsp;: des formats immersifs qui créent une proximité avec votre marque.',
      'Le même gestionnaire de publicités que Facebook : deux réseaux, une seule campagne.',
    ],
    formats: 'Image, carrousel, Stories, Reels, collection',
    objectifs: 'Image de marque, prises de rendez-vous, ventes en boutique et en ligne',
  },
  {
    key: 'linkedin', anchor: 'plat-linkedin', label: 'LinkedIn',
    viewBox: '0 0 448 512', tileW: 28,
    path: 'M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 155.6z',
    hook: "Le réseau où se prennent les décisions d'affaires.",
    desc: 'La plateforme des affaires. Pour rejoindre des décideurs, recruter et bâtir la crédibilité d’une firme de services professionnels.',
    ideal: 'Comptables, avocats, conseillers, entreprises B2B.',
    atouts: [
      "Un ciblage par poste, industrie et taille d'entreprise&nbsp;: taillé pour le B2B.",
      'Le contexte professionnel donne de la crédibilité à votre firme.',
      'Documents et études de cas commandités&nbsp;: des formats pensés pour convaincre.',
    ],
    formats: 'Image, vidéo, carrousel documentaire, messages commandités',
    objectifs: 'Notoriété B2B, mandats qualifiés, recrutement',
  },
  {
    key: 'tiktok', anchor: 'plat-tiktok', label: 'TikTok',
    viewBox: '0 0 448 512', tileW: 28,
    path: 'M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z',
    hook: 'La portée publicitaire la plus abordable du moment.',
    desc: 'La vidéo courte qui rejoint un public plus jeune&nbsp; et de plus en plus tous les âges. Idéale pour bâtir une notoriété rapidement, à faible coût par vue.',
    ideal: 'Restauration, beauté, commerce en ligne.',
    atouts: [
      "Des coûts publicitaires encore doux au Québec. Le moment d'en profiter.",
      'La vidéo courte authentique y performe mieux que la publicité léchée.',
      'Un algorithme qui trouve votre public au-delà de vos abonnés.',
    ],
    formats: 'Vidéo courte plein écran, amplification de contenus existants (Spark Ads)',
    objectifs: 'Notoriété, clientèles plus jeunes, lancements de produits',
  },
  {
    key: 'youtube', anchor: 'plat-youtube', label: 'YouTube',
    viewBox: '0 0 576 512', tileW: 36,
    path: 'M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z',
    hook: 'La vidéo qui explique, rassure et convainc.',
    desc: 'La vidéo qui bâtit la confiance. Vos annonces jouent avant les vidéos que vos clients regardent déjà, sur le deuxième moteur de recherche au monde.',
    ideal: 'Notoriété régionale, services qui gagnent à être expliqués en vidéo.',
    atouts: [
      'La vidéo qui explique&nbsp;: démonstrations, témoignages, visites de projets.',
      'Un ciblage par intentions de recherche et par chaînes que regardent vos clients.',
      'Des formats facturés seulement si votre vidéo est réellement écoutée.',
    ],
    formats: 'Annonces vidéo (avant et pendant la lecture, Shorts), bannières',
    objectifs: 'Notoriété, considération, éducation du client',
  },
  {
    key: 'pinterest', anchor: 'plat-pinterest', label: 'Pinterest',
    viewBox: '0 0 496 512', tileW: 31,
    path: 'M496 256c0 137-111 248-248 248-25.6 0-50.2-3.9-73.4-11.1 10.1-16.5 25.2-43.5 30.8-65 3-11.6 15.4-59 15.4-59 8.1 15.4 31.7 28.5 56.8 28.5 74.8 0 128.7-68.8 128.7-154.3 0-81.9-66.9-143.2-152.9-143.2-107 0-163.9 71.8-163.9 150.1 0 36.4 19.4 81.7 50.3 96.1 4.7 2.2 7.2 1.2 8.3-3.3.8-3.4 5-20.3 6.9-28.1.6-2.5.3-4.7-1.7-7.1-10.1-12.5-18.3-35.3-18.3-56.6 0-54.7 41.4-107.6 112-107.6 60.9 0 103.6 41.5 103.6 100.9 0 67.1-33.9 113.6-78 113.6-24.3 0-42.6-20.1-36.7-44.8 7-29.5 20.5-61.3 20.5-82.6 0-19-10.2-34.9-31.4-34.9-24.9 0-44.9 25.7-44.9 60.2 0 22 7.4 36.8 7.4 36.8s-24.5 103.8-29 123.2c-5 21.4-3 51.6-.9 71.2C65.4 450.9 0 361.1 0 256 0 119 111 8 248 8s248 111 248 248z',
    hook: 'Présent au moment où vos clients planifient.',
    desc: 'Le moteur d’inspiration. Vos produits et réalisations apparaissent au moment où les gens planifient un projet ou un achat.',
    ideal: 'Décoration, rénovation, mariage, boutiques en ligne.',
    atouts: [
      "Les gens y planifient leurs projets&nbsp;: rénovation, mariage, déco. L'achat suit.",
      'Vos épingles continuent de travailler des mois après leur publication.',
      'Un public en mode découverte, ouvert aux nouvelles marques.',
    ],
    formats: 'Épingles image et vidéo, carrousels, épingles produits',
    objectifs: 'Inspiration, trafic vers la boutique, ventes en ligne',
  },
  {
    key: 'reddit', anchor: 'plat-reddit', label: 'Reddit',
    viewBox: '0 0 512 512', tileW: 32,
    path: 'M440.3 203.5c-15 0-28.2 6.2-37.9 15.9-35.7-24.7-83.8-40.6-137.1-42.3L293 52.3l88.2 19.8c0 21.6 17.6 39.2 39.2 39.2 22 0 39.7-18.1 39.7-39.7s-17.6-39.7-39.7-39.7c-15.4 0-28.7 9.3-35.3 22l-97.4-21.6c-4.9-1.3-9.7 2.2-11 7.1l-26 122.1c-52.9 2.2-100.5 18.1-136.3 42.8-9.7-10.1-23.4-16.3-38.4-16.3-55.6 0-73.8 74.6-22.9 100.1-1.8 7.9-2.6 16.3-2.6 24.7 0 83.8 94.4 151.7 210.3 151.7 116.4 0 210.8-67.9 210.8-151.7 0-8.4-.9-17.2-3.1-25.1 49.9-25.6 31.5-99.7-23.8-99.7zM129.4 308.9c0-22 17.6-39.7 39.7-39.7 21.6 0 39.2 17.6 39.2 39.7 0 21.6-17.6 39.2-39.2 39.2-22 .1-39.7-17.6-39.7-39.2zm214.3 93.5c-36.4 36.4-139.1 36.4-175.5 0-4-3.5-4-9.7 0-13.7 3.5-3.5 9.7-3.5 13.2 0 27.8 28.5 120 29 149 0 3.5-3.5 9.7-3.5 13.2 0 4.1 4 4.1 10.2.1 13.7zm-.8-54.2c-21.6 0-39.2-17.6-39.2-39.2 0-22 17.6-39.7 39.2-39.7 22 0 39.7 17.6 39.7 39.7-.1 21.5-17.7 39.2-39.7 39.2z',
    hook: 'Des communautés passionnées, introuvables ailleurs.',
    desc: 'Des communautés de niche très engagées. Pour rejoindre des publics précis là où ils discutent déjà avec un ton authentique, sans vente forcée.',
    ideal: 'Produits spécialisés, commerce en ligne, technologies.',
    atouts: [
      'Des communautés passionnées et nichées, introuvables ailleurs.',
      'Un ton authentique qui rejoint les publics méfiants envers la pub classique.',
      'Peu de concurrence publicitaire locale&nbsp;: des enchères abordables.',
    ],
    formats: 'Publications commanditées dans les communautés, bannières',
    objectifs: 'Niches techniques, adopteurs précoces, commerce en ligne',
  },
  {
    key: 'spotify', anchor: 'plat-spotify', label: 'Spotify',
    viewBox: '0 0 496 512', tileW: 31,
    path: 'M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z',
    hook: 'Votre message dans les moments sans écran.',
    desc: 'L’audio qui accompagne vos clients partout&nbsp;: vos annonces jouent pendant l’écoute, avec un ciblage par région et par champ d’intérêt.',
    ideal: 'Notoriété locale et régionale, promotions saisonnières.',
    atouts: [
      'Votre message pendant les moments sans écran&nbsp;: auto, entraînement, cuisine.',
      "Un ciblage par région, moment de la journée et champs d'intérêt.",
      'Une production simple&nbsp;: un script de 30 secondes suffit pour commencer.',
    ],
    formats: 'Audio 15-30 secondes, vidéo, bannières compagnes',
    objectifs: 'Notoriété locale et régionale, rappel de marque, promotions saisonnières',
  },
  {
    key: 'googleAds', anchor: 'plat-google-ads', label: 'Google Ads',
    viewBox: '0 0 488 512', tileW: 30,
    path: 'M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z',
    hook: "Visible au moment exact où l'on vous cherche.",
    desc: 'L’intention de recherche à l’état pur&nbsp;: vous apparaissez au moment exact où quelqu’un cherche «&nbsp;plombier à Laval&nbsp;» ou «&nbsp;comptable près de moi&nbsp;».',
    ideal: 'Tous les secteurs de services, demandes urgentes.',
    atouts: [
      "L'intention pure&nbsp;: vous apparaissez au moment exact où on cherche vos services.",
      "Recherche, Maps, Shopping, display&nbsp;: tout l'écosystème Google en une gestion.",
      'Une mesure fine des conversions&nbsp;: chaque dollar investi est attribuable.',
    ],
    formats: 'Annonces de recherche, Performance Max, Shopping, display, Maps',
    objectifs: 'Demandes urgentes, soumissions, ventes, visibilité locale',
  },
  {
    key: 'chatgpt', anchor: 'plat-chatgpt', label: 'ChatGPT',
    viewBox: '0 0 24 24', tileW: 32, tileGridColumn: 2,
    path: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.0615v5.5826a4.504 4.504 0 0 1-4.4945 4.4849zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
    hook: "La nouvelle porte d'entrée de vos futurs clients.",
    desc: 'La nouvelle porte d’entrée. De plus en plus de clients demandent des recommandations aux assistants IA. On structure votre présence en ligne pour que votre entreprise y soit citée.',
    ideal: 'Toutes les entreprises qui pensent à demain.',
    atouts: [
      'De plus en plus de clients demandent des recommandations aux assistants IA.',
      "Être cité tôt, c'est prendre position avant vos concurrents.",
      'On structure votre présence en ligne pour que les IA vous trouvent et vous citent.',
    ],
    formats: 'Optimisation de la présence (contenus structurés, fiches, données)',
    objectifs: 'Visibilité émergente, recommandations, avantage de pionnier',
  },
];

/* ---------------- Industries (6 verticaux) ----------------
   Reco prices aligned to the updated grid (Départ 695 / Croissance 995),
   per the user's "mets les prix à jour partout" directive. */
export const industries = [
  {
    key: 'construction', label: 'Construction et métiers', eyebrow: 'CONSTRUCTION ET MÉTIERS SPÉCIALISÉS',
    title: 'Publicité en ligne pour la construction et les métiers',
    intro: 'Vos journées se passent sur les chantiers, pas devant un écran. On gère vos campagnes; vous encaissez les demandes de soumission.',
    heading: 'Entrepreneurs, plombiers et électriciens du Québec',
    body: 'Pendant que vous travaillez, vos campagnes Google et Meta font entrer les demandes de soumission et vous placent devant les clients de vos zones desservies.',
    bullets: ['Campagnes Google Ads sur les recherches «&nbsp;urgence&nbsp;» et devis', 'Annonces avant/après qui montrent vos réalisations', 'Ciblage géographique précis par zones desservies'],
    tags: [{ text: 'Meta + Google Ads', light: true }, { text: 'Essentiel Plus', solid: true }],
    img: 'industrie-construction', imgAlt: 'Exemple d’annonce : construction', wrapBg: 'var(--lavande-100)', barBg: 'var(--violet)',
    challenges: [
      { problem: 'Le bouche-à-oreille plafonne', solution: 'Quand les référencements ralentissent, vos annonces prennent le relais et alimentent un flux constant de demandes.' },
      { problem: 'Trop de clics, peu de bons clients', solution: 'On cible par zone desservie et par type de projet pour ne payer que pour les demandes qui valent votre déplacement.' },
      { problem: 'Pas le temps de gérer ça', solution: 'On monte, on optimise et on rapporte. Vous recevez les demandes, on s’occupe du reste.' },
    ],
    approach: [
      { t: 'On cerne vos projets rentables', b: 'Rénovation, urgence, commercial : on met le budget là où la marge est la meilleure.' },
      { t: 'On monte les campagnes', b: 'Google pour la recherche active, Meta pour montrer vos réalisations avant/après.' },
      { t: 'On cible vos zones', b: 'Rayon autour de vos chantiers et villes desservies, sans gaspiller un dollar ailleurs.' },
      { t: 'On optimise chaque mois', b: 'On coupe ce qui ne convertit pas et on réinvestit dans les meilleures annonces.' },
    ],
    stats: [
      { num: '2×', label: 'plus de demandes de soumission en moyenne' },
      { num: '48 h', label: 'pour mettre vos campagnes en ligne' },
      { num: 'Local', label: 'ciblage limité à vos zones desservies' },
    ],
    recoName: 'Essentiel Plus', recoPrice: '995 $&nbsp;/&nbsp;mois', recoWhy: 'Deux plateformes et du reciblage : idéal pour un flux régulier de soumissions.',
    futureBlog: [
      { tag: 'Guide', title: 'Combien investir en publicité quand on est entrepreneur en construction', bg: 'var(--lavande-100)' },
      { tag: 'Conseil', title: 'Les photos avant/après qui font vendre vos services', bg: 'var(--violet-50)' },
      { tag: 'Saison', title: 'Préparer vos campagnes pour la saison de rénovation', bg: 'var(--lavande-50)' },
    ],
    seoDesc: 'Publicité en ligne gérée pour entrepreneurs en construction, plombiers et électriciens au Québec. Campagnes Google et Meta, ciblage par zones desservies, demandes de soumission.',
  },
  {
    key: 'sante', label: 'Santé et cliniques', eyebrow: 'SANTÉ ET CLINIQUES',
    title: 'Publicité en ligne pour la santé et les cliniques',
    intro: 'Votre équipe soigne; on s’occupe des demandes. Des campagnes qui remplissent votre horaire, sans y penser.',
    heading: 'Cliniques et professionnels de la santé au Québec',
    body: 'Des annonces Google au moment où les patients cherchent un soin, un ciblage local précis et un suivi rigoureux des demandes.',
    bullets: ['Annonces Google sur les recherches de soins près de vous', 'Ciblage par soin et par service, selon la demande', 'Consentement et suivi configurés correctement'],
    tags: [{ text: 'Meta + Google Ads', light: true }, { text: 'Essentiel Plus', solid: true }],
    img: 'industrie-sante', imgAlt: 'Exemple d’annonce : clinique', wrapBg: 'var(--violet-100)', barBg: 'var(--violet-500)',
    challenges: [
      { problem: 'Des plages horaires vides', solution: 'On cible les patients qui cherchent activement vos soins pour remplir les rendez-vous disponibles.' },
      { problem: 'Une concurrence locale forte', solution: 'On vous place en tête des recherches dans votre quartier, au moment précis du besoin.' },
      { problem: 'La gestion des données inquiète', solution: 'Consentement et suivi sont configurés proprement, sans compromettre la confiance des patients.' },
    ],
    approach: [
      { t: 'On priorise vos soins clés', b: 'On met en avant les services les plus demandés et les plus rentables pour votre clinique.' },
      { t: 'On capte l’intention', b: 'Annonces Google au moment exact où le patient cherche « [soin] près de moi ».' },
      { t: 'On rassure', b: 'Messages clairs et professionnels qui donnent envie de prendre rendez-vous chez vous.' },
      { t: 'On suit les demandes', b: 'Appels et formulaires mesurés pour savoir ce que chaque dollar rapporte.' },
    ],
    stats: [
      { num: '+40 %', label: 'de demandes de rendez-vous observées' },
      { num: 'Local', label: 'ciblage par quartier et par soin' },
      { num: 'Suivi', label: 'chaque appel et formulaire mesuré' },
    ],
    recoName: 'Essentiel Plus', recoPrice: '995 $&nbsp;/&nbsp;mois', recoWhy: 'Recherche Google + reciblage pour un horaire toujours rempli.',
    futureBlog: [
      { tag: 'Guide', title: 'Attirer de nouveaux patients sans dépendre du bouche-à-oreille', bg: 'var(--violet-50)' },
      { tag: 'Conseil', title: 'Rédiger des annonces de santé claires et rassurantes', bg: 'var(--lavande-100)' },
      { tag: 'Local', title: 'Optimiser votre fiche Google pour votre clinique', bg: 'var(--lavande-50)' },
    ],
    seoDesc: 'Publicité en ligne gérée pour cliniques et professionnels de la santé au Québec. Annonces Google ciblées par soin et par quartier, consentement et suivi configurés correctement.',
  },
  {
    key: 'beaute', label: 'Beauté et bien-être', eyebrow: 'BEAUTÉ ET BIEN-ÊTRE',
    title: 'Publicité en ligne pour la beauté et le bien-être',
    intro: 'Entre deux clients, il ne reste pas une minute pour gérer des publicités. On s’en charge; votre agenda se remplit.',
    heading: 'Salons de coiffure, studios d’esthétique et bien-être',
    body: 'Vos campagnes locales sur Meta et Instagram tournent pendant que vous travaillez et remplissent votre agenda.',
    bullets: ['Campagnes Instagram et Facebook géolocalisées', 'Annonces visuelles qui mettent votre travail en valeur', 'Reciblage des visiteurs qui n’ont pas encore réservé'],
    tags: [{ text: 'Meta Ads', light: true }, { text: 'Essentiel', solid: true }],
    img: 'industrie-beaute', imgAlt: 'Exemple d’annonce : salon de beauté', wrapBg: 'var(--lavande-50)', barBg: 'var(--lavande-700)',
    challenges: [
      { problem: 'Des trous dans l’agenda', solution: 'On pousse vos disponibilités et vos promotions au bon moment pour combler les plages libres.' },
      { problem: 'Instagram prend trop de temps', solution: 'On transforme vos plus belles réalisations en annonces qui tournent toutes seules.' },
      { problem: 'Des visiteurs qui ne réservent pas', solution: 'Le reciblage ramène les indécis avec un rappel ou une offre au bon instant.' },
    ],
    approach: [
      { t: 'On met votre travail en valeur', b: 'Vos photos avant/après deviennent des annonces qui donnent envie de réserver.' },
      { t: 'On cible votre quartier', b: 'Les gens tout près de votre salon voient vos offres au bon moment.' },
      { t: 'On relance les indécis', b: 'Reciblage de ceux qui ont visité sans réserver, avec un petit incitatif.' },
      { t: 'On remplit l’agenda', b: 'Promotions des périodes creuses poussées quand vous en avez besoin.' },
    ],
    stats: [
      { num: '+60 %', label: 'de réservations en ligne observées' },
      { num: 'Visuel', label: 'annonces bâties sur vos réalisations' },
      { num: 'Quartier', label: 'ciblage géolocalisé autour de vous' },
    ],
    recoName: 'Essentiel', recoPrice: '695 $&nbsp;/&nbsp;mois', recoWhy: 'Une plateforme visuelle (Instagram/Facebook) suffit pour remplir l’agenda.',
    futureBlog: [
      { tag: 'Guide', title: 'Remplir votre agenda pendant les périodes creuses', bg: 'var(--lavande-100)' },
      { tag: 'Conseil', title: 'Les photos avant/après qui font réserver', bg: 'var(--lavande-50)' },
      { tag: 'Astuce', title: 'Transformer vos abonnés Instagram en clients', bg: 'var(--violet-50)' },
    ],
    seoDesc: 'Publicité en ligne gérée pour salons de coiffure, studios d’esthétique et centres de bien-être au Québec. Campagnes Instagram et Facebook géolocalisées qui remplissent votre agenda.',
  },
  {
    key: 'restauration', label: 'Restauration', eyebrow: 'RESTAURATION',
    title: 'Publicité en ligne pour les restaurants',
    intro: 'Faites connaître votre menu et vos promotions au bon moment. On ramène les gens du quartier à votre porte.',
    heading: 'Restaurants, cafés et traiteurs du Québec',
    body: 'Vos annonces Meta et Google ramènent les gens du quartier à votre porte, aux heures voulues.',
    bullets: ['Promotions et nouveautés mises en avant chaque semaine', 'Campagnes géolocalisées autour de votre restaurant', 'Annonces Google sur les recherches «&nbsp;resto près de moi&nbsp;»'],
    tags: [{ text: 'Meta Ads', light: true }, { text: 'Essentiel', solid: true }],
    img: 'industrie-restauration', imgAlt: 'Exemple d’annonce : restaurant', wrapBg: 'var(--lavande-100)', barBg: 'var(--violet-700)',
    challenges: [
      { problem: 'Des soirées trop tranquilles', solution: 'On pousse vos offres aux heures et aux jours où vous avez besoin de remplir la salle.' },
      { problem: 'Une visibilité noyée', solution: 'On vous fait ressortir dans les recherches « resto près de moi » de votre secteur.' },
      { problem: 'Pas de temps pour la pub', solution: 'On gère menu, promos et campagnes chaque semaine; vous restez en cuisine.' },
    ],
    approach: [
      { t: 'On met l’eau à la bouche', b: 'Vos plats et vos nouveautés deviennent des annonces qui attirent le quartier.' },
      { t: 'On cible autour de vous', b: 'Rayon précis autour du restaurant, aux heures qui comptent pour vous.' },
      { t: 'On pousse les promos', b: 'Happy hour, brunch, soir de semaine : on remplit les moments creux.' },
      { t: 'On ramène les habitués', b: 'Reciblage de ceux qui ont vu votre menu pour transformer l’envie en visite.' },
    ],
    stats: [
      { num: 'Local', label: 'ciblage au rayon près du restaurant' },
      { num: 'Hebdo', label: 'promotions poussées chaque semaine' },
      { num: 'Heures', label: 'annonces diffusées aux moments creux' },
    ],
    recoName: 'Essentiel', recoPrice: '695 $&nbsp;/&nbsp;mois', recoWhy: 'Une plateforme géolocalisée suffit pour remplir la salle localement.',
    futureBlog: [
      { tag: 'Guide', title: 'Remplir votre salle les soirs de semaine', bg: 'var(--lavande-50)' },
      { tag: 'Conseil', title: 'Photographier vos plats pour des annonces qui donnent faim', bg: 'var(--lavande-100)' },
      { tag: 'Local', title: 'Ressortir dans les recherches « resto près de moi »', bg: 'var(--violet-50)' },
    ],
    seoDesc: 'Publicité en ligne gérée pour restaurants, cafés et traiteurs au Québec. Campagnes géolocalisées, promotions hebdomadaires et annonces «&nbsp;resto près de moi&nbsp;».',
  },
  {
    key: 'services-pro', label: 'Services professionnels', eyebrow: 'SERVICES PROFESSIONNELS',
    title: 'Publicité en ligne pour les services professionnels',
    intro: 'Travaillez sur vos heures facturables; on s’occupe de votre publicité et de votre pipeline de clients d’affaires.',
    heading: 'Comptables, avocats et conseillers au Québec',
    body: 'Des campagnes LinkedIn et Google qui remplissent votre pipeline de clients d’affaires et bâtissent votre crédibilité.',
    bullets: ['Annonces Google sur les recherches de vos services', 'Contenu commandité qui bâtit votre crédibilité', 'Campagnes LinkedIn ciblées B2B'],
    tags: [{ text: 'Meta + Google Ads', light: true }, { text: 'Essentiel Plus', solid: true }],
    img: 'industrie-services-pro', imgAlt: 'Exemple d’annonce : services professionnels', wrapBg: 'var(--violet-50)', barBg: 'var(--violet)',
    challenges: [
      { problem: 'Un pipeline irrégulier', solution: 'On capte les recherches de vos services pour un flux constant de mandats qualifiés.' },
      { problem: 'Se démarquer de la concurrence', solution: 'Contenu commandité et LinkedIn ciblé bâtissent votre crédibilité auprès des décideurs.' },
      { problem: 'Des prospects peu qualifiés', solution: 'On cible par secteur, taille d’entreprise et intention pour ne parler qu’aux bons clients.' },
    ],
    approach: [
      { t: 'On cible les décideurs', b: 'Par secteur, poste et taille d’entreprise sur LinkedIn et Google.' },
      { t: 'On capte l’intention', b: 'Annonces sur les recherches actives de vos services professionnels.' },
      { t: 'On bâtit la crédibilité', b: 'Contenu commandité qui vous positionne comme référence dans votre domaine.' },
      { t: 'On qualifie les demandes', b: 'Formulaires et suivi pour ne transmettre que les mandats sérieux.' },
    ],
    stats: [
      { num: 'B2B', label: 'ciblage par secteur et par poste' },
      { num: 'Qualifié', label: 'demandes filtrées selon vos critères' },
      { num: 'Crédibilité', label: 'contenu qui vous positionne en référence' },
    ],
    recoName: 'Essentiel Plus', recoPrice: '995 $&nbsp;/&nbsp;mois', recoWhy: 'LinkedIn + Google et A/B testing pour un pipeline B2B régulier.',
    futureBlog: [
      { tag: 'Guide', title: 'Générer des mandats B2B avec LinkedIn Ads', bg: 'var(--violet-50)' },
      { tag: 'Conseil', title: 'Le contenu commandité qui bâtit votre crédibilité', bg: 'var(--lavande-100)' },
      { tag: 'Stratégie', title: 'Qualifier vos prospects avant le premier appel', bg: 'var(--lavande-50)' },
    ],
    seoDesc: 'Publicité en ligne gérée pour comptables, avocats et conseillers au Québec. Campagnes LinkedIn et Google B2B qui remplissent votre pipeline de mandats qualifiés.',
  },
  {
    key: 'ecommerce', label: 'Commerce en ligne', eyebrow: 'COMMERCE EN LIGNE',
    title: 'Publicité en ligne pour le commerce en ligne',
    intro: 'Vous vendez; le reste roule seul. Acquisition et reciblage des paniers abandonnés, on s’en charge.',
    heading: 'Commerçants et boutiques en ligne du Québec',
    body: 'Gérer l’inventaire et les commandes, c’est déjà une journée complète. Le reciblage des paniers abandonnés et les campagnes d’acquisition, on s’en occupe.',
    bullets: ['Campagnes d’acquisition Meta et Google', 'Catalogue produits synchronisé avec vos annonces', 'Reciblage Meta des paniers abandonnés'],
    tags: [{ text: 'Meta + Google Ads', light: true }, { text: 'Essentiel Plus', solid: true }],
    img: 'industrie-ecommerce', imgAlt: 'Exemple d’annonce : boutique en ligne', wrapBg: 'var(--violet-100)', barBg: 'var(--violet-500)',
    challenges: [
      { problem: 'Des paniers abandonnés', solution: 'Le reciblage Meta ramène les acheteurs à un pas de la caisse pour finaliser l’achat.' },
      { problem: 'Un coût d’acquisition trop élevé', solution: 'On optimise vers l’achat, pas le clic, pour un retour sur investissement mesurable.' },
      { problem: 'Un catalogue difficile à promouvoir', solution: 'On synchronise vos produits pour diffuser automatiquement les bons articles.' },
    ],
    approach: [
      { t: 'On connecte votre catalogue', b: 'Vos produits se synchronisent avec Meta et Google pour des annonces à jour.' },
      { t: 'On acquiert de nouveaux clients', b: 'Campagnes ciblées vers les acheteurs les plus susceptibles de convertir.' },
      { t: 'On récupère les paniers', b: 'Reciblage dynamique des articles laissés dans le panier.' },
      { t: 'On mesure le retour', b: 'Suivi des achats pour connaître le rendement de chaque dollar investi.' },
    ],
    stats: [
      { num: 'ROAS', label: 'optimisation vers l’achat, pas le clic' },
      { num: 'Panier', label: 'reciblage dynamique des abandons' },
      { num: 'Auto', label: 'catalogue synchronisé avec vos annonces' },
    ],
    recoName: 'Essentiel Plus', recoPrice: '995 $&nbsp;/&nbsp;mois', recoWhy: 'Acquisition + reciblage dynamique pour faire croître les ventes.',
    futureBlog: [
      { tag: 'Guide', title: 'Réduire vos paniers abandonnés avec le reciblage', bg: 'var(--violet-50)' },
      { tag: 'Conseil', title: 'Calculer et améliorer votre ROAS', bg: 'var(--lavande-100)' },
      { tag: 'Technique', title: 'Synchroniser votre catalogue avec Meta et Google', bg: 'var(--lavande-50)' },
    ],
    seoDesc: 'Publicité en ligne gérée pour boutiques en ligne au Québec. Campagnes d’acquisition Meta et Google, catalogue synchronisé et reciblage des paniers abandonnés.',
  },
];

/* ---------------- Blogue ---------------- */
export const blogFeatured = {
  img: 'blog-vedette', imgAlt: 'Image de l’article vedette',
  badge: 'Article vedette', date: '8 juillet 2026 · 6 min',
  title: 'Combien coûte la publicité en ligne pour une PME au Québec&nbsp;?',
  excerpt: 'Entre gérer soi-même, les agences à gros forfaits et les budgets média qui s’envolent, difficile de s’y retrouver. Voici les vraies fourchettes de prix en 2026, et ce que chaque option vous donne réellement.',
};

export const blogArticles = [
  {
    img: 'blog-reciblage', imgAlt: 'Image : reciblage', cat: 'Publicité', time: '5 min',
    title: 'Le reciblage&nbsp;: pourquoi vos visiteurs reviennent (et achètent)',
    excerpt: 'La plupart des gens n’achètent pas à la première visite. Comment ramener les bonnes personnes sans gaspiller de budget.',
  },
  {
    img: 'blog-meta-google', imgAlt: 'Image : Meta vs Google', cat: 'Publicité', time: '7 min',
    title: 'Meta ou Google Ads&nbsp;: où mettre votre premier budget pub&nbsp;?',
    excerpt: 'Les deux fonctionnent, mais pas pour les mêmes entreprises. Un guide simple selon votre secteur et votre clientèle.',
  },
  {
    img: 'blog-fiche-google', imgAlt: 'Image : fiche Google', cat: 'Référencement local', time: '4 min',
    title: 'Fiche Google&nbsp;: le guide du commerce local québécois',
    excerpt: 'La fiche Google amène souvent plus d’appels que la publicité payante. Comment la remplir, la garder à jour et récolter des avis.',
  },
  {
    img: 'blog-signes', imgAlt: 'Image : site désuet', cat: 'Publicité', time: '5 min',
    title: '5 signes que vos publicités gaspillent votre budget',
    excerpt: 'Mauvais ciblage, annonces sans appel à l’action, budget mal réparti… Des erreurs faciles à repérer qui coûtent cher chaque semaine.',
  },
  {
    img: 'blog-diy', imgAlt: 'Image : plateformes DIY', cat: 'Publicité', time: '6 min',
    title: 'Gérer ses pubs soi-même&nbsp;: le vrai coût du «&nbsp;boost&nbsp;» Facebook',
    excerpt: 'Le bouton «&nbsp;booster&nbsp;» semble simple, jusqu’à ce qu’on compte l’argent gaspillé. Le calcul honnête entre gérer soi-même et déléguer.',
  },
  {
    img: 'blog-seo-local', imgAlt: 'Image : SEO local', cat: 'Référencement local', time: '8 min',
    title: 'Être trouvé sur Google dans sa ville&nbsp;: le référencement local expliqué',
    excerpt: '«&nbsp;Plombier Laval&nbsp;», «&nbsp;coiffeur Limoilou&nbsp;»&nbsp;: comment vos annonces se placent sur les recherches qui comptent vraiment.',
  },
];
