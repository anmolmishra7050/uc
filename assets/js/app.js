/* =====================================================================
   UCBAZZAR — app logic (vanilla JS, no framework)
   Runs directly on GitHub Pages.

   COMPATIBILITY: is file me jaan-boojh kar sirf ES2015 tak ka JavaScript
   hai — koi async/await, ?. (optional chaining), object spread ya
   `catch {}` nahi. Purane phone ka browser in me se koi EK cheez bhi
   nahi samajhta to poori file parse fail ho jati hai aur site khaali
   dikhne lagti hai (na packages, na order form). Isliye purana-safe
   syntax + feature fallbacks rakhe gaye hain.
   ===================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------------------------------------------------------------
   Compatibility helpers (purane Android 4.4/5/6, iOS 10)
   ------------------------------------------------------------------- */

/* Chrome 57 se pehle padStart nahi hota — order ID aur timer isko use karte hain */
if (!String.prototype.padStart) {
  String.prototype.padStart = function (len, pad) {
    let str = String(this);
    pad = pad === undefined ? " " : String(pad);
    while (str.length < len) str = pad + str;
    return str;
  };
}

/* localStorage kuch browsers/modes me access karte hi exception deta hai
   (purane iOS private mode). Har access yahan se hota hai, taki error aane
   par bhi site chalti rahe — bas history save na ho. */
const store = {
  get(key, fallback) {
    try {
      const v = window.localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, String(value)); } catch (e) {}
  },
};

/* Element na mile to chup-chaap skip — ek missing element se poori site
   ka JS rukna nahi chahiye (purane cached page me aisa ho sakta hai) */
function on(selector, event, handler) {
  const el = $(selector);
  if (el) el.addEventListener(event, handler);
  return el;
}

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value;
}

function setHidden(selector, hidden) {
  const el = $(selector);
  if (el) el.hidden = hidden;
}

function dispatchInput(el) {
  let ev;
  try { ev = new Event("input", { bubbles: true }); }
  catch (e) {
    ev = document.createEvent("Event");
    ev.initEvent("input", true, false);
  }
  el.dispatchEvent(ev);
}

/* Smooth scroll sirf wahan jahan browser support karta hai. Purane browsers
   me window.scrollTo({...}) chup-chaap kuch nahi karta, isliye fallback. */
const canSmoothScroll = (function () {
  try { return "scrollBehavior" in document.documentElement.style; }
  catch (e) { return false; }
})();

function scrollToEl(el) {
  if (!el) return;
  if (canSmoothScroll) el.scrollIntoView({ behavior: "smooth", block: "start" });
  else el.scrollIntoView(true);
}

function scrollToElCenter(el) {
  if (!el) return;
  if (canSmoothScroll) el.scrollIntoView({ behavior: "smooth", block: "center" });
  else el.scrollIntoView(true);
}

function scrollToY(y) {
  if (canSmoothScroll) window.scrollTo({ top: y, behavior: "smooth" });
  else window.scrollTo(0, y);
}

/* Har boot step alag try/catch me — ek cheez fail ho to baaki site chale */
function step(fn) {
  try { fn(); }
  catch (err) {
    if (window.console && console.warn) console.warn("UCBAZZAR:", err);
  }
}

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
/* "720 UC — 720 UC" jaisa repeat na ho, isliye UC count sirf tab jodte hain
   jab pack ke naam me number pehle se na ho (e.g. "Starter Pack") */
const packLabel = (p) => String(p.title).includes(String(p.uc))
  ? p.title
  : `${p.title} — ${p.uc} UC`;
const digits = (s) => String(s).replace(/\D/g, "");

/* ---------------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------------- */
function toast(msg, type) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.dataset.type = type || "ok";
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2800);
}

/* Clipboard API sirf HTTPS + naye browsers me hai — warna purana
   execCommand('copy') use hota hai (GitHub Pages HTTPS hai) */
function copyText(text, label) {
  const done = function () { toast("✅ " + (label || "Copied")); };
  const legacy = function () {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); }
    catch (e) { toast("Copy failed — please select the text manually", "warn"); }
    if (ta.remove) ta.remove();
    else ta.parentNode.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, legacy);
  } else {
    legacy();
  }
}

/* Keep only characters that are safe inside a UPI param value */
const upiSafe = (s) => String(s).replace(/[^a-zA-Z0-9 .\-_@]/g, "").slice(0, 50).trim();

/* UPI apps are strict URL parsers — most do NOT decode %40 back to '@'
   or '+' back to a space. So build the query string by hand: keep the VPA
   exactly as 'name@bank' and encode spaces as %20. Only escape the few
   characters that would break the URI itself. */
const upiParam = (v) => String(v)
  .replace(/&/g, "%26")
  .replace(/\?/g, "%3F")
  .replace(/=/g, "%3D")
  .replace(/#/g, "%23")
  .replace(/\+/g, "%2B")
  .replace(/ /g, "%20");

function upiQuery(opts) {
  return [
    "pa=" + upiParam(SITE_CONFIG.upiId),
    "pn=" + upiParam(upiSafe(SITE_CONFIG.upiName)),
    "am=" + Number(opts.amount).toFixed(2),
    "cu=INR",
    "tn=" + upiParam(upiSafe(opts.note)),
  ].join("&");
}

function buildUpiLink(opts) {
  const scheme = opts.scheme || SITE_CONFIG.upiLinkScheme || "upi://pay";
  return scheme + "?" + upiQuery({ amount: opts.amount, note: opts.note });
}

/* Phones par hi UPI apps khulte hain — desktop par QR zyada kaam ka hai */
const isPhone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && window.innerWidth < 820);

/* ---------------------------------------------------------------------
   Ticker (scrolling strip)
   Marquee CSS me hai, par do cheezein JS se theek ki jati hain:
   1) purane Android / iOS browser `max-content` nahi samajhte — tab track
      ki width pixels me set karni padti hai, warna translateX(-50%) galat
      distance banata hai aur loop par jump hota hai.
   2) ticker screen se bahar ya tab background me ho to animation pause —
      purane phone ka GPU aur battery bachta hai.
   ------------------------------------------------------------------- */
const supportsMaxContent = (function () {
  try {
    const d = document.createElement("div");
    d.style.width = "max-content";
    return d.style.width === "max-content";
  } catch (e) { return false; }
})();

/* max-content na hone par track ki width pixels me set karo.
   Content do baar hai, isliye aadhe items = ek set. items[0] se items[half]
   ka faasla = exactly ek set (gap ke saath) — yahi loop ki asli distance hai.
   Isse translateX(-50%) bilkul ek set ke barabar hota hai, yaani loop par
   koi jump nahi. (scrollWidth is kaam ke liye galat hai — wo last item ka
   trailing gap count nahi karta, jisse loop 23px jump karta tha.) */
function setTickerWidthFallback(track) {
  const items = track.children;
  let setW = 0;
  if (items && items.length > 1 && items.length % 2 === 0) {
    const half = items.length / 2;
    setW = items[half].getBoundingClientRect().left -
      items[0].getBoundingClientRect().left;
  }
  if (!setW) { track.style.width = "auto"; setW = track.scrollWidth; }
  if (setW) track.style.width = setW * 2 + "px";
  return setW;
}

function initTicker() {
  const track = $(".ticker-track");
  const ticker = $(".ticker");
  if (!track || !ticker) return;

  // 1) width fallback (sirf un browsers me jahan max-content nahi hai)
  if (!supportsMaxContent) {
    setTickerWidthFallback(track);
    window.addEventListener("resize", function () { setTickerWidthFallback(track); });
    window.addEventListener("orientationchange", function () { setTickerWidthFallback(track); });
    // web font aane par text ki width badal jati hai — dobara naapo
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () { setTickerWidthFallback(track); });
    }
  }

  // 2) off-screen / background me pause
  let onScreen = true;
  const sync = function () {
    const run = onScreen && !document.hidden;
    track.style.animationPlayState = run ? "running" : "paused";
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      onScreen = !!(entries[0] && entries[0].isIntersecting);
      sync();
    }, { rootMargin: "140px" });
    io.observe(ticker);
  }
  document.addEventListener("visibilitychange", sync);
}

/* Free QR image API — no hosting cost, no API key */
function qrUrl(data, size) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=" + (size || 260) + "x" + (size || 260) +
    "&margin=6&qzone=1&data=" + encodeURIComponent(data);
}

/* ---------------------------------------------------------------------
   Packages
   ------------------------------------------------------------------- */
let selected = null;

function packageCard(p) {
  const isSel = selected && selected.id === p.id;
  return `
    <article class="pkg${isSel ? " is-selected" : ""}"
             data-id="${p.id}" tabindex="0" role="button"
             aria-label="${p.title} — ${money(p.price)}">
      ${p.tag ? `<span class="pkg-tag">${p.tag}</span>` : ""}
      <div class="pkg-head">
        <span class="pkg-coin">UC</span>
        <div>
          <h3>${p.title}</h3>
          <span class="pkg-sub">Instant UC Top-Up</span>
        </div>
      </div>
      <div class="pkg-price">
        <span class="now">${money(p.price)}</span>
      </div>
      ${p.note ? `<p class="pkg-note">${p.note}</p>` : ""}
      <ul class="pkg-points">
        <li>Character ID top-up only</li>
        <li>2–10 minute delivery</li>
        <li>Order ID &amp; receipt</li>
        <li>No carding UC — no ID ban</li>
      </ul>
      <button type="button" class="btn btn-primary btn-block" data-select="${p.id}">
        ${isSel ? "✓ Selected" : "Select Package"}
      </button>
    </article>`;
}

function renderPackages() {
  const grid = $("#packagesGrid");
  if (!grid) return;
  grid.innerHTML = PACKAGES.map(packageCard).join("");
}

function selectPackage(id, opts) {
  opts = opts || {};
  const p = PACKAGES.find((x) => x.id === id);
  if (!p) return;
  selected = p;
  renderPackages();
  const sel = $("#packageSelect");
  if (sel) sel.value = p.id;
  updateSummary();
  if (!opts.silent) {
    toast(`🪙 ${p.title} selected`);
    if (opts.scroll !== false) {
      scrollToEl($("#orderForm"));
      setTimeout(() => {
        const gid = $("#gameId");
        if (gid) gid.focus();
      }, 500);
    }
  }
}

function updateSummary() {
  const p = selected;
  setText("#sumPackage", p ? p.title : "—");
  setText("#sumUc", p ? p.uc.toLocaleString("en-IN") + " UC" : "—");
  setText("#sumTotal", money(p ? p.price : 0));
  const btn = $("#submitBtn");
  if (btn) btn.innerHTML = p
    ? `Generate UPI Payment for ${money(p.price)} →`
    : "Generate UPI Payment →";
}

function fillPackageSelect() {
  const sel = $("#packageSelect");
  if (!sel) return;
  sel.innerHTML = `<option value="">— Select a package —</option>` +
    PACKAGES.map((p) => `<option value="${p.id}">${packLabel(p)} — ${money(p.price)}</option>`).join("");
  sel.addEventListener("change", () => {
    if (sel.value) selectPackage(sel.value, { silent: true });
  });
}

/* ---------------------------------------------------------------------
   Payment panel + countdown
   ------------------------------------------------------------------- */
let countdown = null;
let orderCounter = Number(store.get("uc_order_seq", 1041)) || 1041;

function newOrderId() {
  orderCounter += 1;
  store.set("uc_order_seq", orderCounter);
  const d = new Date();
  return `UCB-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}` +
    `${String(d.getDate()).padStart(2, "0")}-${orderCounter}`;
}

function startTimer(minutes) {
  clearInterval(countdown);
  const el = $("#timer");
  if (!el) return;
  let left = minutes * 60;
  const tick = () => {
    el.textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" +
      String(Math.max(left % 60, 0)).padStart(2, "0");
    el.classList.toggle("low", left <= 120);
    if (left <= 0) {
      clearInterval(countdown);
      el.textContent = "Expired";
      toast("⏰ Payment window expired — generate the order again", "warn");
    }
    left -= 1;
  };
  tick();
  countdown = setInterval(tick, 1000);
}

function showPanel(which) {
  // hidden = jo panel abhi active NAHI hai (dhyan: yahan !== hona chahiye)
  const map = {
    emptyState: which !== "empty",
    payPanel: which !== "pay",
    processing: which !== "processing",
  };
  Object.keys(map).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.hidden = map[id];
  });
}

function renderUpiApps(payload) {
  const box = $("#upiApps");
  if (!box) return;
  const apps = SITE_CONFIG.upiApps || [];
  /* note: object spread ({...payload}) nahi — purane browsers uspe crash karte hain */
  box.innerHTML = apps.map((a) => {
    const link = buildUpiLink({ amount: payload.amount, note: payload.note, scheme: a.scheme });
    const logo = a.logo
      ? `<img class="upi-app-logo" src="${a.logo}" alt="${a.name} logo" width="20" height="20">`
      : `<span class="upi-app-emoji">📲</span>`;
    return `<a class="upi-app" href="${link}" data-app="${a.name}">` +
      `${logo}<span class="upi-app-name">${a.name}</span></a>`;
  }).join("");
}

function openPaymentPanel(o) {
  const pkg = o.pkg;
  const amount = pkg.price;
  const note = `${o.orderId} ${pkg.uc}UC ID:${o.gameId}`;
  const payload = { amount, note };
  const link = buildUpiLink(payload);

  // phone par app buttons ko pehle dikhao, desktop par QR ko
  const panel = $("#payPanel");
  if (panel) panel.classList.toggle("is-mobile", isPhone);
  setText("#payNowHint", isPhone
    ? "Tap your app — the amount is already filled in. Enter your UPI PIN and you are done."
    : "Open this page on your phone to pay in one tap, or scan the QR below with your phone.");
  setHidden("#payAppNote", !isPhone);
  renderUpiApps(payload);

  const img = $("#qrImg");
  const fallback = $("#qrFallback");
  if (img) {
    img.hidden = false;
    img.onerror = function () { img.hidden = true; if (fallback) fallback.hidden = false; };
    img.src = qrUrl(link, 260);
  }
  if (fallback) fallback.hidden = true;
  const deep = $("#upiDeepLink");
  if (deep) deep.href = link;

  setText("#orderId", o.orderId);
  setText("#payGameId", o.gameId);
  setText("#payGameName", o.ingameName || "—");
  setHidden("#payNameRow", !o.ingameName);
  setText("#upiIdText", SITE_CONFIG.upiId);
  setText("#payeeName", SITE_CONFIG.upiName);
  setText("#payAmount", money(amount));
  setText("#payStepsAmount", money(amount));

  // reset panel state (timer restarts, form state stays clean)
  showPanel("pay");
  startTimer(SITE_CONFIG.paymentWindowMinutes);
  scrollToElCenter(panel);
  toast("✅ UPI payment link ready — scan the QR to pay");
}

/* ---------------------------------------------------------------------
   Order form
   ------------------------------------------------------------------- */
function fieldError(input, msg) {
  const field = input.closest(".field");
  if (!field) return;
  field.classList.add("has-error");
  let box = $(".err", field);
  if (!box) {
    box = document.createElement("small");
    box.className = "err";
    field.appendChild(box);
  }
  box.textContent = msg;
}

function clearErrors(form) {
  $$(".field.has-error", form).forEach((f) => {
    f.classList.remove("has-error");
    const e = $(".err", f);
    if (e && e.remove) e.remove();
  });
}

let currentOrder = null;

function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  clearErrors(form);

  const gidEl = $("#gameId");
  const nameEl = $("#ingameName");
  const agreeEl = $("#agree");
  const gameId = digits(gidEl ? gidEl.value : "");
  const ingameName = (nameEl ? nameEl.value : "").trim().toUpperCase();
  const agree = !!(agreeEl && agreeEl.checked);
  let ok = true;

  if (!selected) { toast("Please select a UC package first 🪙", "warn"); ok = false; }
  if (gameId.length < 9 || gameId.length > 12) {
    if (gidEl) fieldError(gidEl, "Enter a valid BGMI character ID (9–12 digits).");
    ok = false;
  }
  if (!agree) { toast("Please accept the terms to continue ☑️", "warn"); ok = false; }
  if (!ok) return;

  currentOrder = {
    orderId: newOrderId(),
    pkg: selected,
    amount: selected.price,
    gameId,
    ingameName,
    status: "Awaiting payment",
    ts: Date.now(),
  };

  openPaymentPanel({
    orderId: currentOrder.orderId,
    pkg: selected,
    gameId,
    ingameName,
  });
}

/* ---------------------------------------------------------------------
   "I Have Paid" -> payment processing (no proof needed — the store owner
   verifies payments manually against the Order ID in their UPI app)
   ------------------------------------------------------------------- */
function confirmPayment() {
  if (!currentOrder) return;
  currentOrder.status = "Processing";
  currentOrder.processingAt = Date.now();
  clearInterval(countdown);
  saveOrder(currentOrder);
  showProcessing(currentOrder);
}

function showProcessing(order) {
  setText("#procOrderId", order.orderId);
  setText("#procPackage", packLabel(order.pkg));
  setText("#procGameId", order.gameId + (order.ingameName ? ` (${order.ingameName})` : ""));
  setText("#procPaid", money(order.amount));
  setText("#procAmount",
    `We are verifying your payment of ${money(order.amount)} now — your UC will be delivered within 2–10 minutes.`);

  showPanel("processing");
  renderRecentOrders();
  scrollToElCenter($("#processing"));
  toast("⏳ Payment Verifying — Thank You");
}

function resetOrder() {
  clearInterval(countdown);
  currentOrder = null;
  const agreeEl = $("#agree");
  if (agreeEl) agreeEl.checked = false;
  const form = $("#orderForm");
  if (form && form.reset) form.reset();
  selected = null;
  renderPackages();
  fillPackageSelect();
  updateSummary();
  showPanel("empty");
  const pk = $("#packages");
  if (pk) scrollToY(pk.offsetTop - 80);
  toast("Ready for a new order 🪙");
}

/* ---------------------------------------------------------------------
   Recent orders (saved on this device only)
   ------------------------------------------------------------------- */
function readOrders() {
  try {
    const raw = store.get("uc_orders", "[]");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}

function saveOrder(order) {
  let list = readOrders();
  list = list.filter((o) => o.orderId !== order.orderId);
  list.unshift({
    orderId: order.orderId,
    title: order.pkg.title,
    amount: order.amount,
    gameId: order.gameId,
    status: order.status,
    processingAt: order.processingAt || 0,
    ts: order.ts,
  });
  store.set("uc_orders", JSON.stringify(list.slice(0, 5)));
}

/* An order that has been "Processing" for too long stops looking active —
   it is shown as "Failed" so the customer is not left waiting forever. */
function displayStatus(o) {
  if (o.status !== "Processing") return o.status;
  const minutes = Number(SITE_CONFIG.orderFailAfterMinutes) || 30;
  const since = o.processingAt || o.ts || 0;
  if (!since) return o.status;
  return Date.now() - since >= minutes * 60 * 1000 ? "Failed" : o.status;
}

function renderRecentOrders() {
  let list = readOrders();
  // keep only orders from the last N hours (config: orderHistoryHours) —
  // older ones disappear from the customer's list entirely
  const hours = Number(SITE_CONFIG.orderHistoryHours) || 1;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  list = list.filter((o) => (o.ts || 0) >= cutoff);
  const box = $("#recentOrders");
  const listBox = $("#recentOrdersList");
  if (!box || !listBox) return;
  if (!list.length) { box.hidden = true; return; }
  box.hidden = false;

  listBox.innerHTML = list.map((o) => {
    const status = displayStatus(o);
    return `
    <div class="recent-row">
      <div>
        <b>${o.orderId}</b>
        <span class="meta">${o.title} • ${o.gameId}</span>
      </div>
      <div class="recent-right">
        <b>${money(o.amount)}</b>
        <span class="status-tag${status === "Failed" ? " failed" : ""}">${status}</span>
      </div>
    </div>`;
  }).join("");
}

/* ---------------------------------------------------------------------
   SEO: publish the pack catalog as structured data. Built from PACKAGES,
   so the prices Google reads always match the prices in data.js.
   ------------------------------------------------------------------- */
function injectCatalogSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": "https://ucbazzar.in/#catalog",
    "name": `${SITE_CONFIG.brand} BGMI UC packs`,
    "itemListElement": PACKAGES.map((p) => ({
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": String(p.price),
      "availability": "https://schema.org/InStock",
      "url": "https://ucbazzar.in/#packages",
      "itemOffered": {
        "@type": "Product",
        "name": `${p.title} — BGMI UC Top-Up`,
        "description": `${p.uc} UC delivered to your BGMI character ID. Pay by UPI, delivery in 2–10 minutes.`,
        "category": "In-game currency",
        "brand": { "@type": "Brand", "name": SITE_CONFIG.brand },
      },
    })),
  };
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(schema);
  document.head.appendChild(el);
}

/* ---------------------------------------------------------------------
   UI wiring
   ------------------------------------------------------------------- */
function initUi() {
  // page title, year + store details
  document.title = `Buy BGMI UC Online — Instant UC Top-Up at Lowest Price | ${SITE_CONFIG.brand}`;
  setText("#year", new Date().getFullYear());

  // smooth scroll for [data-scroll]
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    const link = t.closest("a[data-scroll]");
    if (!link) return;
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    scrollToEl(target);
    if (target.id === "order") {
      const gid = $("#gameId");
      if (gid) gid.focus();
    }
  });

  // header shadow
  const header = $("#header");
  if (header) {
    const onScroll = () => {
      const y = window.pageYOffset || window.scrollY || 0;
      header.classList.toggle("is-stuck", y > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // mobile menu
  const menuBtn = $("#menuBtn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }
  $$("#nav a").forEach((a) => a.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  }));

  // reveal on scroll. Jo browser IntersectionObserver nahi samajhta, wahan
  // koi class nahi lagti — content turant dikhta hai (invisible nahi rehta).
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$(".section-head, .pkg, .card").forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  // copy buttons
  on("#copyUpi", "click", () => copyText(SITE_CONFIG.upiId, "UPI ID copied"));
  on("#copyOrderId", "click", () =>
    copyText(currentOrder ? currentOrder.orderId : "—", "Order ID copied"));

  // paste helpers (clipboard needs HTTPS — GitHub Pages is HTTPS)
  const pasteInto = (input, onlyDigits, label) => {
    const apply = (text) => {
      const value = onlyDigits
        ? digits(text).slice(0, 12)
        : String(text).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 22);
      if (!value) { toast("Nothing usable found in the clipboard", "warn"); return; }
      input.value = value;
      dispatchInput(input);
      toast("📋 " + label + " pasted");
    };
    const blocked = () => toast("Paste is blocked — please type it manually", "warn");
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(apply, blocked);
    } else {
      blocked();
    }
  };
  on("#pasteBtn", "click", () => {
    const gid = $("#gameId");
    if (gid) pasteInto(gid, true, "Character ID");
  });

  // input formatting
  on("#gameId", "input", (e) => {
    e.target.value = digits(e.target.value).slice(0, 12);
    const len = e.target.value.length;
    const hint = $("#gameIdHint");
    if (hint) hint.textContent = len
      ? `${len} digits entered ${len >= 9 ? "✅" : "(at least 9 required)"}`
      : "A 9–12 digit number. You can find it under your name on the profile screen.";
  });

  // payment method styling
  $$(".pay-method").forEach((m) => m.addEventListener("change", () => {
    $$(".pay-method").forEach((x) => {
      const inp = $("input", x);
      x.classList.toggle("is-active", !!(inp && inp.checked));
    });
  }));

  // package cards — event delegation (cards re-render)
  const grid = $("#packagesGrid");
  if (grid) {
    grid.addEventListener("click", (e) => {
      const t = e.target;
      const card = t && t.closest ? t.closest(".pkg") : null;
      if (card) selectPackage(card.dataset.id);
    });
    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target;
      const card = t && t.closest ? t.closest(".pkg") : null;
      if (card) { e.preventDefault(); selectPackage(card.dataset.id); }
    });
  }

  // order + payment confirmation (guarded — a stale cached page must not crash init)
  on("#orderForm", "submit", handleSubmit);
  on("#confirmPaid", "click", confirmPayment);
  on("#newOrder", "click", resetOrder);
}

/* ---------------------------------------------------------------------
   Boot — har step alag guard me, taki ek purane browser me koi ek API
   missing hone par bhi baaki site poori tarah chale.
   ------------------------------------------------------------------- */
let booted = false;

function boot() {
  if (booted) return;
  booted = true;
  step(initUi);
  step(initTicker);
  step(fillPackageSelect);
  step(renderPackages);
  step(injectCatalogSchema);
  step(renderRecentOrders);
  step(updateSummary);
  step(() => showPanel("empty"));

  // keep the recent-orders list honest while the page stays open:
  // a Processing order flips to Failed once the window passes
  step(() => setInterval(renderRecentOrders, 30000));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
