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

  /* Les pixels publicitaires (Meta, Google Ads) sont gérés dans Google Tag
     Manager, pas ici. Le site leur fournit le signal Consent Mode et
     l'événement lead-form_submission ; le déclenchement se configure dans GTM. */

  /* Mode diagnostic. Mettre à true, ou ajouter ?epme_debug=1 à l'URL de la
     landing page, pour voir le détail de l'envoi Brevo dans la console du
     navigateur (F12 → Console). À laisser à false en campagne. */
  DEBUG: false,
};
