/* Essentiel PME — configuration des landing pages guides. À ÉDITER avant campagne. */
window.EPME_LP = {
  /* URL d'action du formulaire Brevo : l'attribut action="…" du code
     d'intégration HTML (Brevo → Contacts → Formulaires → Partager → Intégrer).
     Vide = l'envoi Brevo est simplement sauté (le lead part quand même par courriel). */
  BREVO_ACTION: 'https://97aaa67b.sibforms.com/v2/serve/MUIFAD-k5v7TFqtqCurN41Cfv4gcgNs9M_gHraWNVs_m4dpux6-HC3NmANBynpuwcdYUljTqBUmurvkyTJbDbuPDe08IAOnD_3Qvwite3eOYE5X0F-lwFsf4RpK72j4nLnAXmkmgfaJdjeBvHxz8upTtGhE6qcpC864wsZ0B9tPbTwNw45tWYQaSUqxJvNw-C5E-mcp_6Taj9FG4BA==',

  /* Correspondance champs du formulaire → attributs name="…" du même code
     d'intégration. Noms confirmés par la réponse de Brevo au formulaire
     EssentielPME_Ebook2026_Phase1_MoF : il attend les libellés anglais, et
     l'entreprise passe par l'objet Société (COMPANY:name). */
  BREVO_FIELDS: { email: 'EMAIL', prenom: 'FIRSTNAME', nom: 'LASTNAME', compagnie: 'COMPANY:name' },

  /* Formulaire Brevo distinct pour les demandes de contact. Séparé de celui
     des guides : une demande de soumission et un téléchargement d'ebook sont
     deux intentions différentes, les mélanger brouillerait les segments.
     Brevo servant de CRM, toute demande y est enregistrée, avec ou sans
     opt-in. C'est l'attribut OPT_IN qui porte le consentement : les
     automatisations d'infolettre s'y conditionnent, côté Brevo. */
  BREVO_CONTACT_ACTION: 'https://97aaa67b.sibforms.com/serve/MUIFALVvjIK_laZhMsH_VVx_s-45T4h5iXpYVGnewLXd9osyYthfIRQMfigsSPz_qraAPI8Dpsj0ywQwQR460brVzoSZ8qUeVdhf_ZdY4FEiem0iRN59S9O23GEAI3s7WH0L-0hpIf-yiDVlM-091EBLBLnE8fEVWCn3HrhH72ftjckVFfvrwA8KGas8AT68eOq9MUd-ho6PA_GDww==',
  BREVO_CONTACT_FIELDS: {
    // COMPANYNAME ici, COMPANY:name sur le formulaire des guides : les deux
    // formulaires Brevo nomment ce champ différemment, ne pas uniformiser.
    email: 'EMAIL', prenom: 'FIRSTNAME', nom: 'LASTNAME', compagnie: 'COMPANYNAME',
    telephone: 'LANDLINE_NUMBER', message: 'MESSAGE', forfait: 'PACKAGES[]', optin: 'OPT_IN',
  },

  /* Correspondance entre les boutons de forfait du site et les options de
     l'attribut PACKAGES dans Brevo. Les valeurs de droite doivent être écrites
     exactement comme dans Brevo, à la lettre près, sinon toute la soumission
     est refusée. Une valeur absente de cette table est transmise telle quelle. */
  BREVO_PACKAGES: {
    'Publicité : Essentiel (695 $/mois)': 'Essential',
    'Publicité : Essentiel Plus (995 $/mois)': 'Essential Plus',
    'Publicité : Essentiel Performance (1 495 $/mois)': 'Essential Performance',
    'Aidez-moi à choisir': 'Aidez-moi à choisir',
  },

  /* MESSAGE étant devenu facultatif dans Brevo, un message vide n'est plus
     transmis du tout. Remettre un texte ici s'il redevenait obligatoire. */
  BREVO_MESSAGE_VIDE: '',

  /* Valeur envoyée quand la case est cochée. OPT_IN étant une case à cocher
     dans Brevo, le champ est simplement absent de l'envoi quand elle ne l'est
     pas : c'est le comportement d'une vraie case HTML, et le seul qui garantit
     qu'un refus ne soit jamais lu comme un consentement. */
  BREVO_OPTIN_VALUE: '1',

  /* Les pixels publicitaires (Meta, Google Ads) sont gérés dans Google Tag
     Manager, pas ici. Le site leur fournit le signal Consent Mode et
     l'événement lead-form_submission ; le déclenchement se configure dans GTM. */

  /* Mode diagnostic. Mettre à true, ou ajouter ?epme_debug=1 à l'URL de la
     landing page, pour voir le détail de l'envoi Brevo dans la console du
     navigateur (F12 → Console). À laisser à false en campagne. */
  DEBUG: false,
};
