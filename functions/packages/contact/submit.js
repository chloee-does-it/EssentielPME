/* Essentiel PME — envoi du formulaire de contact via Resend
   Déployé comme fonction DigitalOcean (App Platform, composant Functions).
   Variables d'environnement requises :
     RESEND_API_KEY      clé API Resend (obligatoire)
     CONTACT_TO_EMAIL    destinataire (défaut : info@essentielpme.com)
     CONTACT_FROM_EMAIL  expéditeur — doit être sur un domaine vérifié dans Resend
                         (défaut : Essentiel PME <formulaire@essentielpme.com>)      */
'use strict';

const MAX = { firstname: 100, lastname: 100, name: 200, biz: 200, email: 320, phone: 40, interest: 150, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

/* Le corps de la requête peut arriver de deux façons selon la configuration
   de la plateforme : champs déjà fusionnés dans args (web action non-raw),
   ou JSON brut (parfois base64) dans args.__ow_body (mode raw). */
function extractFields(args) {
  if (args.__ow_body) {
    const tryParse = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
    const parsed =
      tryParse(args.__ow_body) ||
      tryParse(Buffer.from(String(args.__ow_body), 'base64').toString('utf8'));
    if (parsed && typeof parsed === 'object') return { ...args, ...parsed };
  }
  return args;
}

async function main(args) {
  const method = (args.__ow_method || '').toLowerCase();
  const data = extractFields(args);
  console.log(
    'contact/submit — méthode:', method || '(absente)',
    '| champs reçus:', Object.keys(data).filter((k) => !k.startsWith('__ow_')).join(',') || '(aucun)'
  );

  if (method !== 'post') {
    return json(405, { error: 'Méthode non permise' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY manquante');
    return json(500, { error: 'Configuration incomplète' });
  }
  const to = process.env.CONTACT_TO_EMAIL || 'info@essentielpme.com';
  const from = process.env.CONTACT_FROM_EMAIL || 'Essentiel PME <formulaire@essentielpme.com>';

  const field = (k) => String(data[k] || '').trim().slice(0, MAX[k]);
  const firstname = field('firstname');
  const lastname = field('lastname');
  // « name » : compatibilité avec l'ancien formulaire à champ unique
  const name = [firstname, lastname].filter(Boolean).join(' ') || field('name');
  const biz = field('biz');
  const email = field('email');
  const phone = field('phone');
  const interest = field('interest');
  const message = field('message');
  // Consentement LCAP/CASL aux communications (case facultative, non cochée par défaut)
  const marketing = data.marketing === true || data.marketing === 'true';

  if (!name || !biz || !EMAIL_RE.test(email) || phone.replace(/[^0-9]/g, '').length < 10) {
    console.error('Validation échouée —',
      'nom:', !!name, '| entreprise:', !!biz,
      '| courriel valide:', EMAIL_RE.test(email),
      '| téléphone valide:', phone.replace(/[^0-9]/g, '').length >= 10);
    return json(400, { error: 'Champs invalides' });
  }
  console.log('Validation OK — envoi à Resend pour', to);

  const row = (label, value) =>
    `<tr><td style="padding:6px 14px 6px 0; font-weight:bold; vertical-align:top; white-space:nowrap;">${label}</td><td style="padding:6px 0;">${esc(value)}</td></tr>`;

  const html = `
    <h2 style="margin:0 0 12px;">Nouvelle demande de contact — essentielpme.com</h2>
    <table style="border-collapse:collapse; font-size:15px;">
      ${firstname ? row('Prénom', firstname) + row('Nom', lastname) : row('Nom', name)}
      ${row('Entreprise', biz)}
      ${row('Courriel', email)}
      ${row('Téléphone', phone)}
      ${row('Intérêt', interest || '—')}
      ${row('Message', message || '—')}
      ${row('Communications (LCAP)', marketing ? 'OUI — consentement exprès donné via le formulaire' : 'Non')}
    </table>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Demande de contact — ${name} (${biz})`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Erreur Resend', res.status, await res.text());
    return json(502, { error: "L'envoi a échoué" });
  }
  console.log('Courriel envoyé avec succès.');
  return json(200, { ok: true });
}

exports.main = main;
