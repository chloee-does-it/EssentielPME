import { adPackages } from './data.mjs';

const purposes = {
  depart: 'Pour concentrer vos campagnes sur une plateforme.',
  croissance: 'Pour combiner deux plateformes et du reciblage.',
  performance: 'Pour gérer trois plateformes avec un suivi plus fréquent.',
};

export function renderPlans() {
  const cards = adPackages.map((p, i) => {
    const ads = p.bullets.find(text => text.startsWith('Rédaction')).replace('Rédaction de ', '').replace(' (FR/EN)', '');
    const optimization = p.bullets.find(text => text.startsWith('Optimisation'));
    return `<button type="button" class="plan-option" id="plan-${p.key}" role="tab" aria-selected="${i === 0}" aria-controls="panel-${p.key}" tabindex="${i === 0 ? 0 : -1}" data-plan="${p.key}" data-plan-name="${p.adsName}">
      <span class="plan-name">${p.adsName}</span><span class="plan-price"><strong>${p.price} $</strong><span>/ mois</span></span>
      <span class="plan-purpose">${purposes[p.key]}</span><span class="plan-highlights"><span>${p.bullets[0]}</span><span>${ads}</span><span>${optimization}</span></span>
      <span class="plan-more"><span class="plan-more-label">${i === 0 ? 'Détails affichés' : 'Voir les inclusions'}</span><span aria-hidden="true">${i === 0 ? '−' : '+'}</span></span></button>`;
  }).join('');
  const panels = adPackages.map((p, i) => {
    const features = p.bullets.slice(1).filter(text => !text.startsWith('Rédaction') && !text.startsWith('Optimisation'));
    features.splice(1, 0, 'Rédaction des annonces en français et en anglais');
    const budget = p.budget.replace(/^Budget média recommandé(?:&nbsp;|\s)*:(?:&nbsp;|\s)*/, '').replace(' (payé aux plateformes)', '');
    return `<div class="plan-panel" id="panel-${p.key}" role="tabpanel" aria-labelledby="plan-${p.key}" tabindex="0"${i === 0 ? '' : ' hidden'}>
      <div><p class="lp-eyebrow"><span>LES INCLUSIONS</span> · <span>${p.adsName}</span></p><ul>${features.map(text => `<li>${text}</li>`).join('')}</ul></div>
      <div class="plan-budget"><h3>Budget média recommandé</h3><p class="media-range">${budget}</p><p>Payé directement aux plateformes, en plus des frais de gestion.</p>
      <a class="lp-cta" href="/contact/" data-lp-book="forfait" data-plan-name="${p.adsName}">Réserver mon appel découverte <span aria-hidden="true">↗</span></a><p class="plan-call-note">On validera ensemble le forfait adapté à vos besoins.</p></div></div>`;
  }).join('');
  return `<section class="budget-band section-pad" id="budget"><div class="lp-container"><div class="plans-heading"><p class="lp-eyebrow">TROIS NIVEAUX D’ACCOMPAGNEMENT</p><h2>Comparez les forfaits de gestion.</h2><p>Frais de gestion mensuels, budget publicitaire en sus. Consultez les inclusions pour comparer les niveaux d’accompagnement.</p></div>
    <div class="plans-tabs" role="tablist" aria-label="Comparer les forfaits">${cards}</div><div class="plans-detail">${panels}</div>
    <p class="plans-terms"><span><strong>600 $</strong> <span>d’installation</span></span><span><strong>3 mois</strong> <span>d’engagement initial</span></span><span>Budget publicitaire <strong>en sus</strong></span></p>
    <noscript><style>.plan-panel[hidden]{display:grid}</style><p>Toutes les inclusions sont affichées ci-dessus.</p></noscript></div></section>`;
}
