/* ==========================================================================
   Payment history — stored in localStorage on this device.

   Flow: after the customer taps "I Have Paid" the payment goes to
   "Verifying" for STORE.verifyMinutes (default 10), then becomes "Failed"
   unless you mark it Delivered.

   👉 Aap manually deliver karne ke baad us customer ka payment mark kar sakte
      hain: console me `UCBAZZAR.markDelivered('<orderId>')` chala dein.
   ========================================================================== */

window.PaymentHistory = (() => {
  const KEY = 'ucbazzar_payments_v1';

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  };
  const save = (list) => localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));

  function add(payment) {
    const list = load();
    list.unshift(payment);
    save(list);
    return payment;
  }

  function all() { return load(); }

  function statusFor(p) {
    if (p.status === 'Delivered') return 'Delivered';
    const deadline = p.paidAt + (window.STORE.verifyMinutes || 10) * 60000;
    return Date.now() < deadline ? 'Verifying' : 'Failed';
  }

  /* Manual override: mark a payment as Delivered (id ya pura object chalega). */
  function markDelivered(idOrPayment) {
    const list = load();
    const p = list.find((x) => x.id === idOrPayment) || idOrPayment;
    if (!p) return false;
    p.status = 'Delivered';
    save(list);
    document.dispatchEvent(new CustomEvent('paymenthistory:change'));
    return true;
  }

  /* Demo helper — clears this device's history. */
  function clear() { localStorage.removeItem(KEY); document.dispatchEvent(new CustomEvent('paymenthistory:change')); }

  return { add, all, statusFor, markDelivered, clear };
})();
