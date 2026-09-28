// Reuse the existing native booking app; load it only after a CTA is selected.
const dialog = document.querySelector('.lp-booking-dialog');
let bookingModule;
let opener;
const en = document.documentElement.lang.startsWith('en');
const planTabs = [...document.querySelectorAll('[data-plan]')];
let selectedPlan = '';
function selectPlan(tab) {
  selectedPlan = tab.dataset.planName;
  for (const item of planTabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    item.querySelector('.plan-more-label').textContent = active
      ? (en ? 'Details shown' : 'Détails affichés') : (en ? 'View inclusions' : 'Voir les inclusions');
    item.querySelector('.plan-more > span:last-child').textContent = active ? '−' : '+';
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  }
}
for (const tab of planTabs) {
  tab.addEventListener('click', () => {
    selectPlan(tab);
    if (matchMedia('(max-width:640px)').matches) {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      panel.focus({ preventScroll: true });
      panel.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    }
  });
  tab.addEventListener('keydown', event => {
    const index = planTabs.indexOf(tab);
    let next;
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = planTabs[(index + 1) % planTabs.length];
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = planTabs[(index + planTabs.length - 1) % planTabs.length];
    if (event.key === 'Home') next = planTabs[0];
    if (event.key === 'End') next = planTabs.at(-1);
    if (next) { event.preventDefault(); selectPlan(next); next.focus(); }
  });
}
if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-lp-book]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      opener = link;
      dialog.showModal();
      try {
        bookingModule ||= import('/assets/booking/booking.mjs?v=20260928');
        const module = await bookingModule;
        module.setBookingPlan(link.dataset.planName || selectedPlan);
      } catch {
        bookingModule = undefined;
        const root = dialog.querySelector('[data-booking-app]');
        root.replaceChildren();
        const message = document.createElement('p');
        message.textContent = en ? 'The calendar could not load. Please use our contact page.' : 'Le calendrier n’a pas pu se charger. Vous pouvez passer par notre page Contact.';
        root.append(message);
      }
    });
  });
  dialog.querySelector('[data-lp-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
}
