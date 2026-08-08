/* Essentiel PME — configuration des landing pages guides. À ÉDITER avant campagne. */
window.EPME_LP = {
  /* URL d'action du formulaire Brevo : l'attribut action="…" du code
     d'intégration HTML (Brevo → Contacts → Formulaires → Partager → Intégrer).
     Vide = l'envoi Brevo est simplement sauté (le lead part quand même par courriel). */
  BREVO_ACTION: '',

  /* Correspondance champs du formulaire → attributs name="…" du même code d'intégration */
  BREVO_FIELDS: { email: 'EMAIL', prenom: 'PRENOM', nom: 'NOM', compagnie: 'COMPAGNIE' },

  /* ID du pixel Meta. Chargé seulement si le visiteur a accepté les témoins
     publicitaires (Consent Mode / Loi 25). PageView partout, Lead sur les pages merci. */
  META_PIXEL_ID: '',
};
