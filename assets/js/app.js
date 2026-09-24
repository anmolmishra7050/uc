/* =====================================================================
   UCBAZZAR — app logic (vanilla JS, no framework)
   Runs directly on GitHub Pages.
   ===================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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
function toast(msg, type = "ok") {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.dataset.type = type;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2800);
}

async function copyText(text, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast("✅ " + label);
  } catch {
    // fallback for old browsers / non-secure context
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("✅ " + label); }
    catch { toast("Copy failed — please select the text manually", "warn"); }
    ta.remove();
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

function upiQuery({ amount, note }) {
  return [
    "pa=" + upiParam(SITE_CONFIG.upiId),
    "pn=" + upiParam(upiSafe(SITE_CONFIG.upiName)),
    "am=" + Number(amount).toFixed(2),
    "cu=INR",
    "tn=" + upiParam(upiSafe(note)),
  ].join("&");
}

function buildUpiLink({ amount, note, scheme }) {
  return (scheme || SITE_CONFIG.upiLinkScheme || "upi://pay") + "?" + upiQuery({ amount, note });
}

/* Phones par hi UPI apps khulte hain — desktop par QR zyada kaam ka hai */
const isPhone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && window.innerWidth < 820);

/* Free QR image API — no hosting cost, no API key */
function qrUrl(data, size = 260) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size +
    "&margin=6&qzone=1&data=" + encodeURIComponent(data);
}

/* ---------------------------------------------------------------------
   Packages
   ------------------------------------------------------------------- */
let selected = null;

function packageCard(p) {
  return `
    <article class="pkg${selected && selected.id === p.id ? " is-selected" : ""}"
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
        ${selected && selected.id === p.id ? "✓ Selected" : "Select Package"}
      </button>
    </article>`;
}

function renderPackages() {
  $("#packagesGrid").innerHTML = PACKAGES.map(packageCard).join("");
}

function selectPackage(id, opts = {}) {
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
      $("#orderForm").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => $("#gameId")?.focus({ preventScroll: true }), 500);
    }
  }
}

function updateSummary() {
  const p = selected;
  $("#sumPackage").textContent = p ? p.title : "—";
  $("#sumUc").textContent = p ? p.uc.toLocaleString("en-IN") + " UC" : "—";
  $("#sumTotal").textContent = money(p ? p.price : 0);
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
let orderCounter = Number(localStorage.getItem("uc_order_seq") || 1041);

function newOrderId() {
  orderCounter += 1;
  localStorage.setItem("uc_order_seq", String(orderCounter));
  const d = new Date();
  return `UCB-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}` +
    `${String(d.getDate()).padStart(2, "0")}-${orderCounter}`;
}

function startTimer(minutes) {
  clearInterval(countdown);
  let left = minutes * 60;
  const el = $("#timer");
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
  $("#emptyState").hidden = which !== "empty";
  $("#payPanel").hidden = which !== "pay";
  $("#processing").hidden = which !== "processing";
}

function renderUpiApps(payload) {
  const box = $("#upiApps");
  if (!box) return;
  const apps = SITE_CONFIG.upiApps || [];
  box.innerHTML = apps.map((a) => `
    <a class="upi-app" href="${buildUpiLink({ ...payload, scheme: a.scheme })}"
       data-app="${a.name}">${a.logo
         ? `<img class="upi-app-logo" src="${a.logo}" alt="${a.name} logo" width="20" height="20">`
         : "📲"}${a.name}</a>`).join("");
}

function openPaymentPanel({ orderId, pkg, gameId, ingameName }) {
  const amount = pkg.price;
  const note = `${orderId} ${pkg.uc}UC ID:${gameId}`;
  const payload = { amount, note };
  const link = buildUpiLink(payload);

  // phone par app buttons ko pehle dikhao, desktop par QR ko
  const panel = $("#payPanel");
  panel.classList.toggle("is-mobile", isPhone);
  $("#payNowHint").textContent = isPhone
    ? "Tap your app — the amount is already filled in. Enter your UPI PIN and you are done."
    : `Open this page on your phone to pay in one tap, or scan the QR below with your phone.`;
  $("#payAppNote").hidden = !isPhone;
  renderUpiApps(payload);

  const img = $("#qrImg");
  const fallback = $("#qrFallback");
  img.hidden = false;
  fallback.hidden = true;
  img.onerror = () => { img.hidden = true; fallback.hidden = false; };
  img.src = qrUrl(link, 260);
  $("#upiDeepLink").href = link;

  $("#orderId").textContent = orderId;
  $("#payGameId").textContent = gameId;
  $("#payGameName").textContent = ingameName || "—";
  $("#payNameRow").hidden = !ingameName;
  $("#upiIdText").textContent = SITE_CONFIG.upiId;
  $("#payeeName").textContent = SITE_CONFIG.upiName;
  $("#payAmount").textContent = money(amount);
  $("#payStepsAmount").textContent = money(amount);

  // reset panel state (timer restarts, form state stays clean)
  showPanel("pay");
  startTimer(SITE_CONFIG.paymentWindowMinutes);
  $("#payPanel").scrollIntoView({ behavior: "smooth", block: "center" });
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
    if (e) e.remove();
  });
}

let currentOrder = null;

function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  clearErrors(form);

  const gameId = digits($("#gameId").value);
  const ingameName = $("#ingameName").value.trim().toUpperCase();
  const agree = $("#agree").checked;
  let ok = true;

  if (!selected) { toast("Please select a UC package first 🪙", "warn"); ok = false; }
  if (gameId.length < 9 || gameId.length > 12) {
    fieldError($("#gameId"), "Enter a valid BGMI character ID (9–12 digits).");
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
  $("#procOrderId").textContent = order.orderId;
  $("#procPackage").textContent = packLabel(order.pkg);
  $("#procGameId").textContent = order.gameId + (order.ingameName ? ` (${order.ingameName})` : "");
  $("#procPaid").textContent = money(order.amount);
  $("#procAmount").textContent =
    `We are verifying your payment of ${money(order.amount)} now — your UC will be delivered within 2–10 minutes.`;

  showPanel("processing");
  renderRecentOrders();
  $("#processing").scrollIntoView({ behavior: "smooth", block: "center" });
  toast("⏳ Payment Verifying — Thank You");
}

function resetOrder() {
  clearInterval(countdown);
  currentOrder = null;
  $("#agree").checked = false;
  $("#orderForm").reset();
  selected = null;
  renderPackages();
  fillPackageSelect();
  updateSummary();
  showPanel("empty");
  window.scrollTo({ top: $("#packages").offsetTop - 80, behavior: "smooth" });
  toast("Ready for a new order 🪙");
}

/* ---------------------------------------------------------------------
   Recent orders (saved on this device only)
   ------------------------------------------------------------------- */
function saveOrder(order) {
  let list = [];
  try { list = JSON.parse(localStorage.getItem("uc_orders") || "[]"); } catch { list = []; }
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
  localStorage.setItem("uc_orders", JSON.stringify(list.slice(0, 5)));
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
  let list = [];
  try { list = JSON.parse(localStorage.getItem("uc_orders") || "[]"); } catch { list = []; }
  // keep only orders from the last N hours (config: orderHistoryHours) —
  // older ones disappear from the customer's list entirely
  const hours = Number(SITE_CONFIG.orderHistoryHours) || 1;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  list = list.filter((o) => (o.ts || 0) >= cutoff);
  const box = $("#recentOrders");
  if (!list.length) { box.hidden = true; return; }
  box.hidden = false;
  $("#recentOrdersList").innerHTML = list.map((o) => {
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
  $("#year").textContent = new Date().getFullYear();

  // smooth scroll for [data-scroll]
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-scroll]");
    if (!link) return;
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (target.id === "order") $("#gameId")?.focus({ preventScroll: true });
  });

  // header shadow
  const header = $("#header");
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // mobile menu
  const menuBtn = $("#menuBtn");
  menuBtn.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("#nav a").forEach((a) => a.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }));

  // reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  $$(".section-head, .pkg, .card").forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });

  // copy buttons
  $("#copyUpi").addEventListener("click", () => copyText(SITE_CONFIG.upiId, "UPI ID copied"));
  $("#copyOrderId").addEventListener("click", () =>
    copyText(currentOrder ? currentOrder.orderId : "—", "Order ID copied"));

  // paste helpers (clipboard needs HTTPS — GitHub Pages is HTTPS)
  const pasteInto = async (input, onlyDigits, label) => {
    try {
      const text = await navigator.clipboard.readText();
      const value = onlyDigits
        ? digits(text).slice(0, 12)
        : text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 22);
      if (!value) return toast("Nothing usable found in the clipboard", "warn");
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      toast("📋 " + label + " pasted");
    } catch {
      toast("Paste is blocked — please type it manually", "warn");
    }
  };
  $("#pasteBtn").addEventListener("click", () => pasteInto($("#gameId"), true, "Character ID"));

  // input formatting
  $("#gameId").addEventListener("input", (e) => {
    e.target.value = digits(e.target.value).slice(0, 12);
    const len = e.target.value.length;
    $("#gameIdHint").textContent = len
      ? `${len} digits entered ${len >= 9 ? "✅" : "(at least 9 required)"}`
      : "A 9–12 digit number. You can find it under your name on the profile screen.";
  });

  // payment method styling
  $$(".pay-method").forEach((m) => m.addEventListener("change", () => {
    $$(".pay-method").forEach((x) => x.classList.toggle("is-active", $("input", x).checked));
  }));

  // package cards — event delegation (cards re-render)
  const grid = $("#packagesGrid");
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".pkg");
    if (card) selectPackage(card.dataset.id);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".pkg");
    if (card) { e.preventDefault(); selectPackage(card.dataset.id); }
  });

  // order + payment confirmation (guarded — a stale cached page must not crash init)
  $("#orderForm")?.addEventListener("submit", handleSubmit);
  $("#confirmPaid")?.addEventListener("click", confirmPayment);
  $("#newOrder")?.addEventListener("click", resetOrder);
}

/* ---------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initUi();
  fillPackageSelect();
  renderPackages();
  injectCatalogSchema();
  renderRecentOrders();
  updateSummary();
  showPanel("empty");

  // keep the recent-orders list honest while the page stays open:
  // a Processing order flips to Failed once the window passes
  setInterval(renderRecentOrders, 30000);
});
