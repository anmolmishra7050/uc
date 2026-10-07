/* ==========================================================================
   UC BAZZAR — store settings
   👉 This is the only file you need to edit: your UPI ID and email address.
   ========================================================================== */

window.STORE = {
  name: 'UC BAZZAR',
  upiId: 'ucbazzar@airtel',        // ← your UPI ID (payments land here)
  payeeName: 'Madhu Kumari',       // ← bank-registered name shown inside the UPI app
  email: 'ucbazzar@gmail.com',     // ← all orders + support go here
  verifyMinutes: 10,               // ← payment "Verifying" duration before it shows Failed

  /* "Orders Delivered" counter on the homepage.
     base      = counter ka aaj ka number (1200 = 1,200 orders delivered)
     startDate = is waqt se counter badhna shuru kare — sirf din ('2026-10-07') ya din + time
                 ('2026-10-07T09:00:00') dono chalte hain
     perHourMin/Max = how many orders are added EVERY HOUR (7–15) */
  orders: {
    base: 1200,
    startDate: '2026-10-07T09:00:00',
    perHourMin: 7,
    perHourMax: 15,
  },

  qrApi: 'https://api.qrserver.com/v1/create-qr-code/',
};

/* Fills email links and the year on every page. */
document.addEventListener('DOMContentLoaded', () => {
  const S = window.STORE;

  document.querySelectorAll('[data-email]').forEach((el) => {
    el.href = 'mailto:' + S.email;
    if (el.hasAttribute('data-email-text')) el.textContent = S.email;
  });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
});
