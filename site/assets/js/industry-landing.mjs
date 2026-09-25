// Reuse the existing native booking app; load it only after a CTA is selected.
const dialog = document.querySelector('.lp-booking-dialog');
let bookingModule;
let opener;
const en = document.documentElement.lang.startsWith('en');
if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-lp-book]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      opener = link;
      dialog.showModal();
      try {
        bookingModule ||= import('/assets/booking/booking.mjs');
        await bookingModule;
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
