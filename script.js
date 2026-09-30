/* ==========================================================================
   UC BAZZAR — store logic
   👉 Settings (UPI ID, email, order counter) live in config.js.
   ========================================================================== */

const STORE = window.STORE; // comes from config.js (UPI ID, email, orders counter)

/* --------------------------------------------------------------------------
   Packages — edit names and prices here
   -------------------------------------------------------------------------- */
const GAMES = {
  bgmi: {
    id: 'bgmi',
    name: 'BGMI',
    tag: 'Official Seller',
    img: 'Assests/bgmi.jpg',
    packImg: 'Assests/uc.jpg',
    idLabel: 'BGMI Player ID / UID',
    idHint: 'BGMI UID (8–12 digit)',
    packages: [
      { id: 'uc720',  name: '720 UC',   price: 199,  tag: 'ELITE PASS SPECIAL' },
      { id: 'uc1800', name: '1800 UC',  price: 399 },
      { id: 'uc2560', name: '2560 UC',  price: 549,  tag: 'POPULAR' },
      { id: 'uc3200', name: '3200 UC',  price: 699 },
      { id: 'uc3850', name: '3850 UC',  price: 749 },
      { id: 'uc8100', name: '8100 UC',  price: 1299, tag: 'BEST VALUE' },
    ],
  },
  freefire: {
    id: 'freefire',
    name: 'Free Fire MAX',
    tag: 'Official Seller',
    img: 'Assests/freefire.jpg',
    packImg: 'Assests/1624892361684-0495b49d-93e8-4bdc-98a8-d2d2d87b84a8-removebg-preview.png',
    idLabel: 'Free Fire Player ID / UID',
    idHint: 'Free Fire UID (8–12 digit)',
    packages: [
      { id: 'ff2400',  name: '2400 Diamond',  price: 379,  tag: 'POPULAR' },
      { id: 'ff3800',  name: '3800 Diamond',  price: 549 },
      { id: 'ff5200',  name: '5200 Diamond',  price: 749 },
      { id: 'ff7780',  name: '7780 Diamond',  price: 899 },
      { id: 'ff8600',  name: '8600 Diamond',  price: 999,  tag: 'BEST VALUE' },
      { id: 'ff10500', name: '10500 Diamond', price: 1249 },
    ],
  },
};

/* --------------------------------------------------------------------------
   Reviews — user feedbacks get added to this list (localStorage) and the
   visible ones rotate on every visit, so reviews "keep changing".
   -------------------------------------------------------------------------- */
const BASE_REVIEWS = [
  { name: 'Rohit Sharma',      stars: 5, source: 'Instagram', text: 'UC aaya sirf 3 minute me, price bhi sahi tha.' },
  { name: 'Ayesha K.',         stars: 5, source: 'YouTube',   text: 'Diamonds instantly credit ho gaye. Support ne bhi turant reply kiya.' },
  { name: 'Karan Singh',       stars: 5, source: 'WhatsApp',  text: '5 baar order kiya, har baar time pe delivery. Ab yahin se lunga.' },
  { name: 'Sneha D.',          stars: 4, source: 'Instagram', text: 'Delivery fast thi, bas evening rush me 15 min wait karna pada.' },
  { name: 'Vikas Chauhan',     stars: 5, source: 'Telegram',  text: '720 UC pack best deal tha. QR se pay karna easy laga.' },
  { name: 'Arjun Mehta',       stars: 5, source: 'YouTube',   text: 'GPay se pay kiya, 2 min me UC account me tha.' },
  { name: 'Pooja Verma',       stars: 4, source: 'Telegram',  text: 'Free Fire diamonds ka price theek mila, support helpful tha.' },
  { name: 'Manish K.',         stars: 5, source: 'WhatsApp',  text: 'Pehle doubt tha, par yahan se aaram se mil gaya. Process clear hai.' },
  { name: 'Rahul T.',          stars: 5, source: 'Instagram', text: '8100 UC liya, delivery instant. Package options acche hain.' },
  { name: 'Anjali Gupta',      stars: 5, source: 'YouTube',   text: 'ID daalo, package chuno, pay karo — bas itna hi karna hai.' },
  { name: 'Nikhil R.',         stars: 5, source: 'Instagram', text: '1080 UC liya, 4 min me aa gaya. PhonePe se pay kiya.' },
  { name: 'Sameer Khan',       stars: 5, source: 'WhatsApp',  text: 'Isse fast kahin nahi mila bhai. 3 min me diamonds.' },
  { name: 'Deepak Yadav',      stars: 5, source: 'YouTube',   text: 'Pehli baar doubt tha, par ID verify karke confirm kiya. Trust ban gaya.' },
  { name: 'Ritu S.',           stars: 4, source: 'Telegram',  text: '2280 UC ka price kam tha. Delivery bhi theek.' },
  { name: 'Aditya Nair',       stars: 5, source: 'Instagram', text: 'Ordered at 1am, still got the UC in 5 minutes.' },
  { name: 'Tanmay Joshi',      stars: 5, source: 'YouTube',   text: 'No login drama. Paid via UPI, UC credited in 4 mins.' },
  { name: 'Farhan A.',         stars: 4, source: 'WhatsApp',  text: 'Prices are fair, just had to wait ~15 min in the evening.' },
  { name: 'Ritika Bansal',     stars: 5, source: 'Telegram',  text: 'Third order here. Zero issues so far.' },
  { name: 'Priya N.',          stars: 5, source: 'WhatsApp',  text: '560 diamonds 2 min me credit. Ab to yahin se lungi.' },
  { name: 'Harsh Vardhan',     stars: 5, source: 'YouTube',   text: 'Payment ke baad screenshot bheja, 5 min me order done.' },
  { name: 'Aakash Dubey',      stars: 5, source: 'Telegram',  text: 'Genuine hai, do order kar chuka hoon. Koi issue nahi.' },
  { name: 'Mohit Saxena',      stars: 4, source: 'Instagram', text: 'Weekend pe thoda late hua par UC mil gaya. Price ka issue nahi.' },
];

const $ = (sel) => document.querySelector(sel);
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

const state = { game: null, pack: null, playerId: '', orderRef: null };

/* --------------------------------------------------------------------------
   Render: games + packages
   -------------------------------------------------------------------------- */
function renderGames() {
  const grid = $('#gameGrid');
  grid.innerHTML = '';
  Object.values(GAMES).forEach((g) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'game-card' + (state.game === g.id ? ' active' : '');
    btn.innerHTML = `
      <img src="${g.img}" alt="${g.name}" />
      <span>
        <span class="gc-name">${g.name}</span><br />
        <span class="gc-tag">${g.tag}</span>
      </span>`;
    btn.addEventListener('click', () => selectGame(g.id));
    grid.appendChild(btn);
  });
}

function renderPackages() {
  const grid = $('#packGrid');
  const hint = $('#gameHint');
  grid.innerHTML = '';

  if (!state.game) {
    hint.textContent = 'Select a game above to see its packages.';
    return;
  }
  const game = GAMES[state.game];
  hint.textContent = `${game.name} packages — tap one to continue.`;

  game.packages.forEach((p) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pack-card' + (state.pack && state.pack.id === p.id ? ' active' : '');
    btn.innerHTML = `
      ${p.tag ? `<span class="pack-tag">${p.tag}</span>` : ''}
      <img src="${game.packImg}" alt="" />
      <div class="pk-name">${p.name}</div>
      <div class="pk-price">${money(p.price)}</div>`;
    btn.addEventListener('click', () => selectPack(p));
    grid.appendChild(btn);
  });
}

function selectGame(id) {
  state.game = id;
  state.pack = null;
  const game = GAMES[id];
  $('#playerIdLabel').textContent = game.idLabel;
  $('#playerId').placeholder = 'Enter ' + game.idHint;
  renderGames();
  renderPackages();
  updateSummary();
}

function selectPack(pack) {
  state.pack = pack;
  renderPackages();
  updateSummary();
  toast(`${pack.name} selected — ${money(pack.price)}`);
}

/* --------------------------------------------------------------------------
   Summary
   -------------------------------------------------------------------------- */
function updateSummary() {
  const game = state.game ? GAMES[state.game] : null;
  $('#sumGame').textContent = 'Game: ' + (game ? game.name : '—');
  $('#sumPack').textContent = state.pack ? state.pack.name : '—';
  $('#sumTotal').textContent = money(state.pack ? state.pack.price : 0);
  $('#sumUid').textContent = state.playerId ? 'Player ID: ' + state.playerId : '';
  $('#payBtn').disabled = !(game && state.pack);
}

/* --------------------------------------------------------------------------
   Player ID
   -------------------------------------------------------------------------- */
const ID_MIN = 8;
const ID_MAX = 12;

/* keep the field digits-only and never longer than 12 characters */
function cleanPlayerIdField() {
  const input = $('#playerId');
  const cleaned = input.value.replace(/\D/g, '').slice(0, ID_MAX);
  if (cleaned !== input.value) {
    input.value = cleaned;
    try { input.setSelectionRange(cleaned.length, cleaned.length); } catch { /* older browsers */ }
  }
  return cleaned;
}

function validatePlayerId(showToast) {
  const input = $('#playerId');
  const id = input.value.replace(/\D/g, '');
  const ok = id.length >= ID_MIN && id.length <= ID_MAX;

  // green border at 8–12 digits, red when something shorter/longer was typed
  input.classList.toggle('invalid', id.length > 0 && !ok);
  input.classList.toggle('valid', ok);

  if (!ok && showToast) {
    toast('Player ID must be 8–12 digits.', true);
  }
  state.playerId = id;
  updateSummary();
  return ok;
}

/* --------------------------------------------------------------------------
   Payment modal
   -------------------------------------------------------------------------- */
/* Short order reference that travels inside the UPI payment note, so the payment
   you see in your UPI app matches the exact order in the customer's Payment History.
   Letters that look like numbers (O/0, I/1) are skipped on purpose. */
function newOrderRef() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return 'UCB' + s;
}

/* "2560 UC" -> "2560UC", "7800 Diamond" -> "7800D" (UPI notes allow ~50 chars) */
function packLabel(pack) {
  if (!pack) return '';
  return pack.name.replace(/\s+/g, '').replace(/Diamonds?/i, 'D');
}

/* The note the customer's UPI app sends with the payment. It carries everything
   needed to deliver: game brand, package, player ID and order ref. */
function upiNote() {
  return ['UCBAZZAR', packLabel(state.pack), state.playerId, state.orderRef]
    .filter(Boolean).join(' ').slice(0, 50);
}

function buildUpiParams() {
  const amount = state.pack ? state.pack.price : 0;
  const q = (v) => encodeURIComponent(v);
  const pn = STORE.payeeName ? `&pn=${q(STORE.payeeName)}` : '';
  return `pa=${q(STORE.upiId)}${pn}&am=${amount}&cu=INR&tn=${q(upiNote())}`;
}

function openModal() {
  if (!state.game) return toast('Please select a game first.', true);
  if (!validatePlayerId(true)) {
    $('#playerId').focus();
    return;
  }
  if (!state.pack) return toast('Please select a package.', true);

  // one reference per order attempt — it goes into the payment note and becomes
  // the order ID the customer sees in Payment History
  if (!state.orderRef) state.orderRef = newOrderRef();

  const game = GAMES[state.game];
  const params = buildUpiParams();
  const upiUri = 'upi://pay?' + params;

  $('#payGame').textContent = game.name;
  $('#payPack').textContent = state.pack.name;
  $('#payAmount').textContent = money(state.pack.price);
  $('#upiIdText').textContent = STORE.upiId;
  $('#qrAmountNote').textContent = money(state.pack.price);
  $('#qrFallbackText').textContent = STORE.upiId + ' | ' + money(state.pack.price) + ' | order: ' + state.playerId;

  const img = $('#qrImg');
  $('#qrFallback').classList.add('hidden');
  img.classList.remove('hidden');
  img.onerror = () => {
    img.classList.add('hidden');
    $('#qrFallback').classList.remove('hidden');
  };
  img.src = `${STORE.qrApi}?size=480x480&margin=8&data=${encodeURIComponent(upiUri)}`;

  // app deep links — the amount is pre-filled in every one of them
  $('#payGpay').href = 'tez://upi/pay?' + params;
  $('#payPhonepe').href = 'phonepe://pay?' + params;
  $('#payPaytm').href = 'paytmmp://pay?' + params;
  $('#payUpi').href = upiUri;

  const modal = $('#payModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = $('#payModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* --------------------------------------------------------------------------
   Player ID verify popup — "Player ID Verified" / "Player ID Not Verified"
   -------------------------------------------------------------------------- */
function showVerifyPopup(ok) {
  const id = $('#playerId').value.replace(/\D/g, '');
  const modal = $('#verifyModal');

  $('#verifyIco').textContent = ok ? '✅' : '❌';
  $('#verifyTitle').textContent = ok ? 'Player ID Verified' : 'Player ID Not Verified';

  if (ok) {
    $('#verifyMsg').innerHTML = `Player ID <b>${id}</b> is valid. We confirm it once more while delivering your order.`;
  } else if (!id) {
    $('#verifyMsg').innerHTML = 'Please enter your Player ID first — it must be <b>8–12 digits</b>. You can tap <b>📋 Paste</b> to fill it from your clipboard.';
  } else if (id.length < 8) {
    $('#verifyMsg').innerHTML = `You entered <b>${id.length} digits</b> — a Player ID needs at least <b>8 digits</b>. Open your game profile and copy the full UID.`;
  } else {
    $('#verifyMsg').innerHTML = `You entered <b>${id.length} digits</b> — a Player ID is <b>8–12 digits</b>. Please double-check the UID in your game profile.`;
  }

  modal.classList.toggle('ok', ok);
  modal.classList.toggle('bad', !ok);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeVerifyPopup() {
  const modal = $('#verifyModal');
  if (!modal.classList.contains('open')) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (!$('#payModal').classList.contains('open')) document.body.style.overflow = '';
}

function sendOrder() {
  const game = GAMES[state.game];
  // same reference the customer paid with, so the UPI note and this record match
  const ref = state.orderRef || newOrderRef();

  // Payment record: Verifying for STORE.verifyMinutes, then Failed (see payment-history.js)
  const payment = window.PaymentHistory.add({
    id: ref,
    game: game.name,
    pack: state.pack.name,
    amount: state.pack.price,
    playerId: state.playerId,
    paidAt: Date.now(),
    status: 'Verifying',
  });

  state.orderRef = null; // next order gets a fresh reference
  closeModal();
  // track it on the dedicated history page (no email is sent)
  window.location.href = 'history.html?paid=' + payment.id;
}

/* --------------------------------------------------------------------------
   Payment history lives on history.html now — nothing to render here.
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   Orders counter — grows by STORE.orders.perHourMin–perHourMax every hour
   -------------------------------------------------------------------------- */
function renderOrderStats() {
  const cfg = STORE.orders || { base: 0, startDate: '2026-09-29', perHourMin: 7, perHourMax: 15 };
  const startOfHour = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
  const hourMs = 3600000;
  const now = new Date();
  const start = new Date(cfg.startDate + 'T00:00:00');
  const fullHours = Math.max(0, Math.round((startOfHour(now) - start) / hourMs));

  // same number for everyone during the same hour, but it changes every hour
  const ordersOfHour = (i) => {
    const seed = Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453) % 1;
    return cfg.perHourMin + Math.floor(seed * (cfg.perHourMax - cfg.perHourMin + 1));
  };

  let total = cfg.base;
  for (let i = 0; i < fullHours; i++) total += ordersOfHour(i);

  // running count inside the current hour, so it ticks up gradually
  const minutesThisHour = (now - startOfHour(now)) / 60000;
  const doneThisHour = Math.round(ordersOfHour(fullHours) * Math.min(1, minutesThisHour / 60));

  $('#statOrders').textContent = (total + doneThisHour).toLocaleString('en-IN');
}

/* --------------------------------------------------------------------------
   Reviews — mix of base reviews + user feedbacks, shuffled each visit
   -------------------------------------------------------------------------- */
const FEEDBACK_KEY = 'ucbazzar_feedbacks_v1';

function loadFeedbacks() {
  try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY)) || []; } catch { return []; }
}

function allReviews() {
  return [...loadFeedbacks(), ...BASE_REVIEWS];
}

function renderReviews() {
  const grid = $('#reviewsGrid');
  if (!grid) return;

  const list = allReviews();

  // shuffle so reviews keep changing on every visit
  const shuffled = [...list].sort(() => Math.random() - 0.5);

  // the list is rendered twice so the auto-scroll can loop with no visible jump
  grid.innerHTML = '';
  [...shuffled, ...shuffled].forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'card feature quote';
    if (i >= shuffled.length) card.setAttribute('aria-hidden', 'true');
    card.innerHTML = `
      <p>“${r.text}”</p>
      <span class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
      <span class="who">— ${r.name}</span>
      <span class="src src-${(r.source || '').toLowerCase()}">${r.source || 'Verified Buyer'}</span>`;
    grid.appendChild(card);
  });

  window.__revHalf = 0;
  startAutoScroll();
}

/* Auto-scroll the reviews to the left, continuously and slowly.
   Manual scrolling always works: hovering, touching, dragging or using the
   mouse wheel pauses the auto-scroll instantly and it resumes a few seconds
   after the user lets go. Works on old and new phones (plain scrollLeft). */
function startAutoScroll() {
  const scroller = $('#reviewsScroller');
  if (!scroller) return;
  clearInterval(window.__revAuto);
  window.__revPaused = false;
  window.__revHoldUntil = 0;
  window.__revIdlePx = 0;

  // listeners are attached only once, even though reviews re-render
  if (!window.__revBound) {
    window.__revBound = true;
    const hold = () => { window.__revPaused = true; };
    const releaseSoon = () => { window.__revHoldUntil = Date.now() + 3000; window.__revPaused = false; };
    scroller.addEventListener('mouseenter', hold);
    scroller.addEventListener('mousemove', hold);
    scroller.addEventListener('mouseleave', () => { window.__revHoldUntil = Date.now() + 3000; window.__revPaused = false; });
    scroller.addEventListener('touchstart', hold, { passive: true });
    scroller.addEventListener('touchend', releaseSoon, { passive: true });
    scroller.addEventListener('pointerdown', hold);
    scroller.addEventListener('pointerup', releaseSoon);
    scroller.addEventListener('wheel', hold, { passive: true });
    scroller.addEventListener('wheel', () => setTimeout(releaseSoon, 800), { passive: true });
  }

  // ~55 px per second, based on real elapsed time so the speed stays the same
  // whether the browser runs this 60 times a second or throttles it in the
  // background (old phones included).
  const SPEED = 0.055; // px per millisecond
  const step = () => {
    const now = performance.now();
    const dt = Math.min(250, now - window.__revLast);
    window.__revLast = now;

    if (window.__revPaused || document.hidden) return;
    if (Date.now() < window.__revHoldUntil) return;

    const track = $('#reviewsGrid');
    const half = window.__revHalf || (track ? Math.round(track.scrollWidth / 2) : 0);
    window.__revHalf = half;
    const max = scroller.scrollWidth - scroller.clientWidth;
    if (max <= 4 || half <= 0) return; // nothing to scroll yet

    // once the first copy is scrolled past, jump back by exactly one copy:
    // the next reviews are identical, so the loop looks seamless
    if (scroller.scrollLeft >= half) scroller.scrollLeft -= half;
    scroller.scrollLeft += Math.min(18, SPEED * dt);
  };

  // exactly one driver runs: requestAnimationFrame where it works, and a timer
  // as the fallback (background tabs / older webviews throttle rAF to zero)
  window.__revLast = performance.now();
  clearInterval(window.__revAuto);
  window.__revAuto = null;
  if (window.__revRafId) { cancelAnimationFrame(window.__revRafId); window.__revRafId = null; }

  if (typeof requestAnimationFrame === 'function') {
    let rafAlive = false;
    const rafLoop = () => {
      rafAlive = true;
      step();
      window.__revRafId = requestAnimationFrame(rafLoop);
    };
    window.__revRafId = requestAnimationFrame(rafLoop);
    setTimeout(() => {
      if (!rafAlive && !window.__revAuto) {
        if (window.__revRafId) { cancelAnimationFrame(window.__revRafId); window.__revRafId = null; }
        window.__revAuto = setInterval(step, 25);
      }
    }, 400);
  } else {
    window.__revAuto = setInterval(step, 25);
  }
}

function paintStars(v) {
  document.querySelectorAll('#fbStars label').forEach((label) => {
    const val = Number(label.dataset.v);
    label.classList.toggle('sel', val <= v);
    label.classList.toggle('dim', val > v);
  });
}

function initStarPicker() {
  const wrap = $('#fbStars');
  wrap.addEventListener('change', (e) => {
    if (e.target.name === 'fbStars') paintStars(Number(e.target.value));
  });
  // hover preview
  wrap.addEventListener('mouseover', (e) => {
    const label = e.target.closest('label');
    if (label) paintStars(Number(label.dataset.v));
  });
  wrap.addEventListener('mouseleave', () => {
    paintStars(Number(document.querySelector('input[name="fbStars"]:checked')?.value || 5));
  });
}

function submitFeedback() {
  const name = $('#fbName').value.trim() || 'Anonymous Gamer';
  const text = $('#fbText').value.trim();
  const stars = Number(document.querySelector('input[name="fbStars"]:checked')?.value || 5);

  if (text.length < 5) return toast('Please write a few words about your experience.', true);

  const list = loadFeedbacks();
  list.unshift({ name, stars, text, at: Date.now() });
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list.slice(0, 50)));

  $('#fbName').value = '';
  $('#fbText').value = '';
  document.querySelector('input[name="fbStars"][value="5"]').checked = true;
  paintStars(5);

  renderReviews();
  toast('Thanks for your feedback! It is now live in reviews. ⭐');
}

/* --------------------------------------------------------------------------
   Copy to clipboard — modern API, with a fallback for older phones/browsers
   -------------------------------------------------------------------------- */
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the old method below */ }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
   Toast
   -------------------------------------------------------------------------- */
function toast(msg, isError) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' err' : '');
  el.textContent = msg;
  $('#toastWrap').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
function init() {
  renderOrderStats();

  renderGames();
  renderPackages();
  renderReviews();
  updateSummary();

  // events
  $('#playerId').addEventListener('input', () => {
    cleanPlayerIdField();
    validatePlayerId(false);
  });

  // paste button + clean up anything pasted into the field (spaces, dashes, labels)
  $('#pasteBtn').addEventListener('click', async () => {
    const input = $('#playerId');
    try {
      const text = await navigator.clipboard.readText();
      // prefer a clean 8–12 digit run from the clipboard (ignores labels,
      // levels or extra numbers copied along with the UID)
      const runs = (text || '').match(/\d{8,12}/g) || [];
      const digits = runs.length
        ? runs.sort((a, b) => b.length - a.length)[0]
        : (text || '').replace(/\D/g, '').slice(0, ID_MAX);
      if (!digits) return toast('No valid ID found in clipboard. Copy the ID first.', true);
      input.value = digits.slice(0, ID_MAX);
      input.dispatchEvent(new Event('input'));
      input.focus();
      validatePlayerId(true);
    } catch {
      input.focus();
      toast('Paste blocked — long-press the field and choose Paste.', true);
    }
  });

  $('#verifyBtn').addEventListener('click', () => {
    showVerifyPopup(validatePlayerId(false));
  });
  $('#verifyOk').addEventListener('click', closeVerifyPopup);
  $('#verifyModal').querySelectorAll('[data-vclose]').forEach((el) => el.addEventListener('click', closeVerifyPopup));
  $('#payBtn').addEventListener('click', openModal);
  $('#sendOrderBtn').addEventListener('click', sendOrder);
  $('#payModal').querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const verify = $('#verifyModal');
    if (verify.classList.contains('open')) closeVerifyPopup();
    else closeModal();
  });
  $('#copyUpi').addEventListener('click', async () => {
    if (await copyText(STORE.upiId)) {
      toast('UPI ID copied — ' + STORE.upiId);
    } else {
      toast('Could not copy, please type it manually: ' + STORE.upiId, true);
    }
  });
  $('#fbSubmit').addEventListener('click', submitFeedback);
  initStarPicker();

  // expose helpers for the store owner (mark delivered, list, clear)
  window.UCBAZZAR = {
    markDelivered: window.PaymentHistory.markDelivered,
    list: () => window.PaymentHistory.all(),
    clear: window.PaymentHistory.clear,
  };

  $('#navToggle').addEventListener('click', () => {
    const nav = $('#siteNav');
    const open = nav.classList.toggle('open');
    $('#navToggle').setAttribute('aria-expanded', String(open));
  });

  // restore last player id
  const saved = localStorage.getItem('ucbazzar_playerId');
  if (saved) { $('#playerId').value = saved; validatePlayerId(false); }
  $('#playerId').addEventListener('change', () => {
    if (state.playerId) localStorage.setItem('ucbazzar_playerId', state.playerId);
  });
}

document.addEventListener('DOMContentLoaded', init);
