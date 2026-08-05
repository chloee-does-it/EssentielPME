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

  // Landing pages guides : formulaire court (prénom + courriel seulement)
  const GUIDE_LABELS = {
    'construction': 'Construction',
    'beaute': 'Beauté et bien-être',
    'avocats-notaires': 'Avocats et notaires',
    'pme': 'PME du Québec',
  };
  const isGuide = String(data.form_type || '') === 'guide';
  const guide = GUIDE_LABELS[String(data.guide || '')] || '';

  if (isGuide) {
    if (!firstname || !EMAIL_RE.test(email) || !guide) {
      console.error('Validation guide échouée — prénom:', !!firstname, '| courriel valide:', EMAIL_RE.test(email), '| guide:', data.guide);
      return json(400, { error: 'Champs invalides' });
    }
  } else if (!name || !biz || !EMAIL_RE.test(email) || phone.replace(/[^0-9]/g, '').length < 10) {
    console.error('Validation échouée —',
      'nom:', !!name, '| entreprise:', !!biz,
      '| courriel valide:', EMAIL_RE.test(email),
      '| téléphone valide:', phone.replace(/[^0-9]/g, '').length >= 10);
    return json(400, { error: 'Champs invalides' });
  }
  console.log('Validation OK — envoi à Resend pour', to);

  const row = (label, value) =>
    `<tr><td style="padding:6px 14px 6px 0; font-weight:bold; vertical-align:top; white-space:nowrap;">${label}</td><td style="padding:6px 0;">${esc(value)}</td></tr>`;

  /* Bloc « source de trafic » à partir de l'attribution captée côté client */
  const attributionRows = (attr) => {
    if (!attr || typeof attr !== 'object') return row('Source de trafic', 'Inconnue');
    const p = attr.params && typeof attr.params === 'object' ? attr.params : {};
    const v = (x) => String(x || '').slice(0, 200);
    const rows = [];

    let source = v(p.utm_source);
    if (!source) {
      if (p.gclid) source = 'Google Ads (gclid)';
      else if (p.fbclid) source = 'Meta (fbclid)';
      else if (p.msclkid) source = 'Microsoft Ads (msclkid)';
      else if (attr.referrer) {
        const host = String(attr.referrer).replace(/^https?:\/\//, '').split('/')[0];
        if (/google\./.test(host)) source = 'Google — référencement naturel';
        else if (/facebook\.|instagram\./.test(host)) source = 'Facebook / Instagram (organique)';
        else if (/linkedin\./.test(host)) source = 'LinkedIn (organique)';
        else if (/bing\./.test(host)) source = 'Bing — référencement naturel';
        else source = `Site référent : ${host}`;
      } else source = 'Trafic direct';
    }
    rows.push(row('Source de trafic', source));
    if (p.utm_medium) rows.push(row('Médium', v(p.utm_medium)));
    if (p.utm_campaign) rows.push(row('Campagne', v(p.utm_campaign)));
    if (p.utm_term) rows.push(row('Terme', v(p.utm_term)));
    if (p.utm_content) rows.push(row('Contenu', v(p.utm_content)));
    if (p.gclid) rows.push(row('Clic publicitaire', 'Google Ads (gclid présent)'));
    if (p.fbclid) rows.push(row('Clic publicitaire', 'Meta (fbclid présent)'));
    if (attr.referrer) rows.push(row('Référent', v(attr.referrer).slice(0, 150)));
    if (attr.landing) rows.push(row("Page d'entrée", v(attr.landing).slice(0, 150)));
    if (attr.first_visit) rows.push(row('Première visite', v(attr.first_visit).slice(0, 24)));
    return rows.join('\n      ');
  };

  const html = isGuide
    ? `
    <h2 style="margin:0 0 12px;">Guide téléchargé (${guide}) : essentielpme.com</h2>
    <table style="border-collapse:collapse; font-size:15px;">
      ${row('Guide', guide)}
      ${row('Prénom', firstname)}
      ${row('Courriel', email)}
      ${row('Communications (LCAP)', marketing ? 'OUI, consentement exprès (case cochée par le visiteur)' : 'Non')}
      <tr><td colspan="2" style="padding:14px 0 4px; font-weight:bold; border-top:1px solid #ddd;">Provenance</td></tr>
      ${attributionRows(data.attribution)}
    </table>`
    : `
    <h2 style="margin:0 0 12px;">Nouvelle demande de contact : essentielpme.com</h2>
    <table style="border-collapse:collapse; font-size:15px;">
      ${firstname ? row('Prénom', firstname) + row('Nom', lastname) : row('Nom', name)}
      ${row('Entreprise', biz)}
      ${row('Courriel', email)}
      ${row('Téléphone', phone)}
      ${row('Intérêt', interest || '—')}
      ${row('Message', message || '—')}
      ${row('Communications (LCAP)', marketing ? 'OUI, consentement exprès (case cochée par le visiteur)' : 'Non')}
      <tr><td colspan="2" style="padding:14px 0 4px; font-weight:bold; border-top:1px solid #ddd;">Provenance</td></tr>
      ${attributionRows(data.attribution)}
    </table>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: isGuide
        ? `Guide téléchargé (${guide}) : ${firstname} <${email}>`
        : `Demande de contact : ${name} (${biz})`,
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
