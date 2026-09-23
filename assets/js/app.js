/* =====================================================================
   UC Bazaar — app logic (vanilla JS, no framework)
   Runs directly on GitHub Pages.
   ===================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
const pctOff = (price, mrp) => Math.round((1 - price / mrp) * 100);
/* "660 UC — 660 UC" jaisa repeat na ho, isliye UC count sirf tab jodte hain
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

/* Clean text for UPI params (special characters break the link) */
const upiSafe = (s) => String(s).replace(/[^a-zA-Z0-9 .\-_@]/g, "").slice(0, 50).trim();

/* UPI intent deep link — aapke phone ka UPI app khulta hai, amount already
   bhara hota hai aur customer sirf UPI PIN daalta hai. Koi gateway nahi. */
function upiQuery({ amount, note }) {
  return new URLSearchParams({
    pa: SITE_CONFIG.upiId,
    pn: upiSafe(SITE_CONFIG.upiName),
    am: Number(amount).toFixed(2),
    cu: "INR",
    tn: upiSafe(note),
  }).toString();
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
  const off = pctOff(p.price, p.mrp);
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
        <s>${money(p.mrp)}</s>
        ${off > 0 ? `<span class="off">${off}% OFF</span>` : ""}
      </div>
      <ul class="pkg-points">
        <li>Character ID top-up only</li>
        <li>2–10 minute delivery</li>
        <li>Order ID &amp; receipt</li>
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
  $("#sumMrp").textContent = p ? money(p.mrp) : "—";
  $("#sumDiscount").textContent = p ? "-" + money(p.mrp - p.price) : "—";
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
       data-app="${a.name}">${a.name}</a>`).join("");
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

  // reset UTR state
  $("#utrInput").value = "";
  $("#utrHint").textContent =
    "Found in your UPI app under payment history → this transaction → UTR / Ref no.";
  $("#utrInput").closest(".field").classList.remove("has-error");

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
    utr: "",
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
   UTR submission -> payment processing
   ------------------------------------------------------------------- */
function submitUtr() {
  if (!currentOrder) return;
  const input = $("#utrInput");
  const utr = input.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const field = input.closest(".field");
  const errBox = $(".err", field);

  if (utr.length < 10 || utr.length > 22) {
    field.classList.add("has-error");
    if (errBox) errBox.textContent = "Enter the UTR / transaction ID from your UPI app (10–22 characters).";
    else fieldError(input, "Enter the UTR / transaction ID from your UPI app (10–22 characters).");
    input.focus();
    toast("UTR looks incomplete — please check your UPI app", "warn");
    return;
  }

  field.classList.remove("has-error");
  if (errBox) errBox.remove();

  currentOrder.utr = utr;
  currentOrder.status = "Processing";
  clearInterval(countdown);
  saveOrder(currentOrder);
  showProcessing(currentOrder);
}

function showProcessing(order) {
  $("#procOrderId").textContent = order.orderId;
  $("#procUtr").textContent = order.utr;
  $("#procPackage").textContent = packLabel(order.pkg);
  $("#procGameId").textContent = order.gameId + (order.ingameName ? ` (${order.ingameName})` : "");
  $("#procPaid").textContent = money(order.amount);
  $("#procAmount").textContent =
    `Verifying ${money(order.amount)} against UTR ${order.utr}.`;

  showPanel("processing");
  renderRecentOrders();
  $("#processing").scrollIntoView({ behavior: "smooth", block: "center" });
  toast("🎉 UTR submitted — your order is being processed");
}

function resetOrder() {
  clearInterval(countdown);
  currentOrder = null;
  $("#utrInput").value = "";
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
    utr: order.utr,
    title: order.pkg.title,
    amount: order.amount,
    gameId: order.gameId,
    status: order.status,
    ts: order.ts,
  });
  localStorage.setItem("uc_orders", JSON.stringify(list.slice(0, 5)));
}

function renderRecentOrders() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem("uc_orders") || "[]"); } catch { list = []; }
  const box = $("#recentOrders");
  if (!list.length) { box.hidden = true; return; }
  box.hidden = false;
  $("#recentOrdersList").innerHTML = list.map((o) => `
    <div class="recent-row">
      <div>
        <b>${o.orderId}</b>
        <span class="meta">${o.title} • ${o.gameId} • UTR ${o.utr || "—"}</span>
      </div>
      <div class="recent-right">
        <b>${money(o.amount)}</b>
        <span class="status-tag">${o.status}</span>
      </div>
    </div>`).join("");
}

/* ---------------------------------------------------------------------
   Reviews (marquee + footer strip)
   ------------------------------------------------------------------- */
function reviewCard(r) {
  return `
    <article class="review">
      <header>
        <span class="avatar">${r.name.charAt(0)}</span>
        <div>
          <b>${r.name}</b>
          <span class="meta">${r.handle} • ${r.city}</span>
        </div>
      </header>
      <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <p>${r.text}</p>
      <footer><span class="verified">✔ Verified Purchase</span></footer>
    </article>`;
}

function renderMarquees() {
  const fill = (el, list) => {
    const html = list.map(reviewCard).join("");
    el.innerHTML = html + html; // duplicated set = seamless loop
  };
  fill($("#marqueeA"), REVIEWS.slice(0, 7));
  fill($("#marqueeB"), REVIEWS.slice(7));
}

function renderFooterFeedback() {
  // three recent reviews
  const picks = [REVIEWS[1], REVIEWS[4], REVIEWS[10]].filter(Boolean);
  $("#footerFeedback").innerHTML = `
    <div class="ff-head">
      <span class="ff-title">💬 Customer Feedback — Recent</span>
      <a href="#reviews" data-scroll class="ff-link">See all reviews →</a>
    </div>
    <div class="ff-grid">
      ${picks.map((r) => `
        <blockquote class="ff-item">
          <div class="stars">${"★".repeat(r.stars)}</div>
          <p>"${r.text}"</p>
          <cite>— ${r.name}, ${r.city}</cite>
        </blockquote>`).join("")}
    </div>`;
}

/* ---------------------------------------------------------------------
   Customer feedback — stored on this device only (localStorage)
   ------------------------------------------------------------------- */
const MY_REVIEWS_KEY = "uc_my_reviews";
let myRating = 5;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function loadMyReviews() {
  try { return JSON.parse(localStorage.getItem(MY_REVIEWS_KEY) || "[]"); }
  catch { return []; }
}

function saveMyReviews(list) {
  try { localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(list.slice(0, 10))); }
  catch { /* storage full or disabled — feedback simply is not kept */ }
}

function renderMyReviews() {
  const list = loadMyReviews();
  const box = $("#myReviews");
  if (!list.length) { box.hidden = true; $("#myReviewsList").innerHTML = ""; return; }
  box.hidden = false;
  $("#myReviewsList").innerHTML = list.map((r, i) => `
    <div class="my-review">
      <header>
        <span class="avatar">${esc((r.name || "You").charAt(0)).toUpperCase()}</span>
        <div>
          <b>${esc(r.name || "You")}</b>
          <span class="meta">Posted on ${new Date(r.ts).toLocaleDateString("en-IN")}</span>
        </div>
        <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
        <button type="button" class="mini-btn del-btn" data-del="${i}" aria-label="Delete feedback">Delete</button>
      </header>
      <p>${esc(r.text)}</p>
    </div>`).join("");
}

function setRating(stars) {
  myRating = Math.min(5, Math.max(1, stars));
  $$("#fbStars button").forEach((b) =>
    b.classList.toggle("on", Number(b.dataset.star) <= myRating));
}

function postFeedback(e) {
  e.preventDefault();
  const name = $("#fbName").value.trim().slice(0, 24);
  const text = $("#fbText").value.trim();

  if (text.length < 10) {
    toast("Please write at least 10 characters ✍️", "warn");
    $("#fbText").focus();
    return;
  }

  const list = loadMyReviews();
  list.unshift({ name, stars: myRating, text: text.slice(0, 240), ts: Date.now() });
  saveMyReviews(list);
  renderMyReviews();

  $("#fbText").value = "";
  $("#fbName").value = "";
  $("#fbCount").textContent = "0 / 240";
  setRating(5);
  toast("🎉 Thanks! Your feedback has been posted");
  $("#myReviews").scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------------------------------------------------------------------
   UI wiring
   ------------------------------------------------------------------- */
function initUi() {
  // page title, year + store details
  document.title = `${SITE_CONFIG.brand} — BGMI UC Top-Up (Instant Delivery)`;
  $("#year").textContent = new Date().getFullYear();
  $("#officialUpi").textContent = SITE_CONFIG.upiId;
  $("#officialName").textContent = SITE_CONFIG.upiName;

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
  $$(".section-head, .pkg, .card, .rating-bar").forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });

  // copy buttons
  $("#copyUpi").addEventListener("click", () => copyText(SITE_CONFIG.upiId, "UPI ID copied"));
  $("#copyOfficialUpi").addEventListener("click", () => copyText(SITE_CONFIG.upiId, "UPI ID copied"));
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
  $("#pasteUtr").addEventListener("click", () => pasteInto($("#utrInput"), false, "UTR"));

  // input formatting
  $("#gameId").addEventListener("input", (e) => {
    e.target.value = digits(e.target.value).slice(0, 12);
    const len = e.target.value.length;
    $("#gameIdHint").textContent = len
      ? `${len} digits entered ${len >= 9 ? "✅" : "(at least 9 required)"}`
      : "A 9–12 digit number. You can find it under your name on the profile screen.";
  });
  $("#utrInput").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 22);
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

  // feedback form
  setRating(5);
  $("#fbStars").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-star]");
    if (btn) setRating(Number(btn.dataset.star));
  });
  $("#fbText").addEventListener("input", (e) => {
    $("#fbCount").textContent = `${e.target.value.length} / 240`;
  });
  $("#feedbackForm").addEventListener("submit", postFeedback);
  $("#myReviewsList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-del]");
    if (!btn) return;
    const list = loadMyReviews();
    list.splice(Number(btn.dataset.del), 1);
    saveMyReviews(list);
    renderMyReviews();
    toast("Your feedback was removed");
  });

  // order + UTR actions
  $("#orderForm").addEventListener("submit", handleSubmit);
  $("#submitUtr").addEventListener("click", submitUtr);
  $("#utrInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); submitUtr(); }
  });
  $("#newOrder").addEventListener("click", resetOrder);
}

/* ---------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initUi();
  fillPackageSelect();
  renderPackages();
  renderMarquees();
  renderFooterFeedback();
  renderMyReviews();
  renderRecentOrders();
  updateSummary();
  showPanel("empty");
});
