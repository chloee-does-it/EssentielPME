/* Essentiel PME — envoi du formulaire de contact via Resend
   Déployé comme fonction DigitalOcean (App Platform, composant Functions).
   Variables d'environnement requises :
     RESEND_API_KEY      clé API Resend (obligatoire)
     CONTACT_TO_EMAIL    destinataire (défaut : info@essentielpme.com)
     CONTACT_FROM_EMAIL  expéditeur — doit être sur un domaine vérifié dans Resend
                         (défaut : Essentiel PME <formulaire@essentielpme.com>)      */
'use strict';

const MAX = { name: 200, biz: 200, email: 320, phone: 40, interest: 150, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

async function main(args) {
  if ((args.__ow_method || '').toLowerCase() !== 'post') {
    return json(405, { error: 'Méthode non permise' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY manquante');
    return json(500, { error: 'Configuration incomplète' });
  }
  const to = process.env.CONTACT_TO_EMAIL || 'info@essentielpme.com';
  const from = process.env.CONTACT_FROM_EMAIL || 'Essentiel PME <formulaire@essentielpme.com>';

  const field = (k) => String(args[k] || '').trim().slice(0, MAX[k]);
  const name = field('name');
  const biz = field('biz');
  const email = field('email');
  const phone = field('phone');
  const interest = field('interest');
  const message = field('message');

  if (!name || !biz || !EMAIL_RE.test(email) || phone.replace(/[^0-9]/g, '').length < 10) {
    return json(400, { error: 'Champs invalides' });
  }

  const row = (label, value) =>
    `<tr><td style="padding:6px 14px 6px 0; font-weight:bold; vertical-align:top; white-space:nowrap;">${label}</td><td style="padding:6px 0;">${esc(value)}</td></tr>`;

  const html = `
    <h2 style="margin:0 0 12px;">Nouvelle demande de contact — essentielpme.com</h2>
    <table style="border-collapse:collapse; font-size:15px;">
      ${row('Nom', name)}
      ${row('Entreprise', biz)}
      ${row('Courriel', email)}
      ${row('Téléphone', phone)}
      ${row('Intérêt', interest || '—')}
      ${row('Message', message || '—')}
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
  return json(200, { ok: true });
}

exports.main = main;
