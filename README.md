# 🟠 UCBAZZAR — BGMI UC Selling Website

A **frontend-only** (plain HTML + CSS + JavaScript) BGMI UC storefront.
No framework, no build step, no paid hosting — it deploys straight to **GitHub Pages, for free.**

Dark theme • UPI payments with QR + one-tap app links • English copy • Customer feedback • Mobile friendly

> 🌐 **Going live on your own domain?** See **[GO-LIVE.md](GO-LIVE.md)** for the full
> walkthrough: GitHub Pages hosting → GoDaddy DNS for `ucbazzar.in` → GitHub custom domain
> + HTTPS → Google Search Console → SEO plan and the risks to fix first.

---

## 🚀 Deploy to GitHub Pages (5 minutes)

This repo ships with GitHub's official **Static HTML** Pages workflow
(*Actions → New workflow → "Static HTML" — "Deploy static files in a repository without a build"*)
pre-configured in `.github/workflows/deploy.yml`. Nothing to build, no Node, no dependencies —
the workflow just uploads the repo and publishes it.

### Step 1 — Create a repository
1. Open [github.com/new](https://github.com/new)
2. Name it something short and memorable, e.g. `uc-store` or `bgmiuc`
3. Keep it **Public**
4. Click **Create repository** — do not add a README or .gitignore

### Step 2 — Upload the files
Easiest route (works entirely in the browser):
1. In the new repo click **Add file → Upload files**
2. Drag and drop **everything** from this folder:
   `index.html`, `assets/`, `.nojekyll`, `README.md`, `.github/`
3. Click **Commit changes**

Prefer the terminal? Run this inside this folder:

```bash
git init
git add .
git commit -m "BGMI UC storefront"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<REPO>.git
git push -u origin main
```

### Step 3 — Turn Pages on
1. Repo → **Settings** → **Pages**
2. **Source** → `GitHub Actions` → Save
   *(the included workflow is GitHub's "Static HTML" template — if you ever delete it, recreate it
   from Actions → New workflow → Static HTML, or use
   `Deploy from a branch` → Branch `main` → Folder `/ (root)`)*
3. Push (or upload) the files — the **Deploy static content to Pages** workflow runs on the
   `main`/`master` branch and publishes the site. Watch progress in the repo's **Actions** tab.
4. Wait 1–2 minutes, then open:

```
https://<YOUR-USERNAME>.github.io/<REPO>/
```

That URL is your live store — share it anywhere.
**No hosting, domain or server purchase needed.** To put it on `ucbazzar.in`, follow
**[GO-LIVE.md](GO-LIVE.md)** (GoDaddy DNS records, custom domain, HTTPS, Google indexing).

Every path in this project is **relative** (`assets/css/style.css`, not `/assets/...`), so the site
works both at `username.github.io` and at `username.github.io/repo-name/` without any changes.
To re-deploy after an edit: change a file → commit → the workflow publishes again automatically
(or run it by hand from **Actions → Deploy static content to Pages → Run workflow**).

---

## ⚙️ Configure your details (IMPORTANT)

Everything is configured in a single file: **`assets/js/data.js`**

```js
const SITE_CONFIG = {
  brand: "UCBAZZAR",

  upiId: "ucbazaar@ybl",          // 👈 put YOUR UPI ID here
  upiName: "UCBAZZAR",           // 👈 payee name shown in the UPI app

  paymentWindowMinutes: 15,       // payment link validity

  // One-tap UPI apps — tapping a button opens that app on the customer's phone
  // with the amount already filled in. They only enter their UPI PIN.
  upiLinkScheme: "upi://pay",     // opens the phone's app chooser (works everywhere)
  upiApps: [
    { name: "Google Pay", scheme: "tez://upi/pay", logo: "assets/Google-pay.jpeg" },
    { name: "PhonePe", scheme: "phonepe://pay", logo: "assets/phonepe.png" },
    { name: "Paytm", scheme: "paytmmp://pay", logo: "assets/paytm.png" },
    { name: "BHIM", scheme: "bhim://pay", logo: "assets/upi.png" },
  ],
};
```

The same file holds:

- **`PACKAGES`** — UC packs only. Change `price` (what the customer pays — the only price
  shown on the site), `uc` (UC amount), `tag` (ribbon text; leave `""` for no ribbon) and
  `note` (optional highlighted line inside the card, e.g. `"🎫 The exact pick for the BGMI
  Elite Pass"`). Add or remove packs freely — the cards, the order dropdown and the summary
  all update. There is no MRP / discount badge anywhere, by design.
- **Customer reviews** — the reviews/feedback panel has been removed from the site on
  purpose. Do not re-add customer feedback unless you can verify every claim on it.

Save the file → commit on GitHub → the site updates automatically.

---

## 🧾 How the order flow works

1. The customer picks a UC package and enters their BGMI character ID.
2. A payment panel opens with a QR code, a copyable UPI ID and one-tap buttons for Google Pay / PhonePe / Paytm / BHIM — the amount is pre-filled, the customer only enters their UPI PIN.
3. After paying, the customer taps **I Have Paid — Confirm My Order** and lands on the "Payment Processing" state (Order ID, package, BGMI ID, amount and a delivery timeline).

You (the store owner) then verify the payment manually against the Order ID / amount in your own UPI app's transaction history and deliver the UC. Nothing is auto-verified and no proof is collected on the site.

1. Customer picks a package and enters their **BGMI character ID** (9–12 digits) plus an
   optional in-game name. No phone number, no login, no OTP.
2. The page generates an **Order ID**, a **UPI payment QR** and a set of **one-tap UPI app
   buttons** (Google Pay / PhonePe / Paytm / BHIM + a generic "Any UPI App" button). All of them
   are UPI intent deep links carrying `pa` (your UPI ID), `pn` (payee name), `am` (amount) and
   `tn` (the Order ID as the note), so on a phone the right app opens with **the amount already
   filled in** — the customer only enters their UPI PIN. A 15-minute countdown runs.
   On phones the app buttons are shown first and the QR below; on desktop the QR comes first.
   No payment gateway, no API key and no backend are involved.
3. The customer pays, then taps **I Have Paid — Confirm My Order**.
4. The order switches to a **Payment Processing** state: a delivery timeline and a full order
   summary (Order ID, package, BGMI ID, amount).
5. Confirmed orders are remembered on that device under **"Your recent orders"**
   (localStorage, last 5) so the customer can look their Order ID up later. An order that
   stays in "Processing" for more than `orderFailAfterMinutes` (default **30** in
   `data.js`) flips to **Failed** automatically, so nobody keeps waiting on a dead order.

There is no UTR field, no screenshot upload and no chat/social links on the site — **you**
verify each payment manually in your own UPI app against the Order ID / amount, then deliver.

---

## 🧩 Features

| Feature | Detail |
|---|---|
| Dark theme | Neon amber/orange look, glassy cards, glow + grid background, centered hero |
| UC packages | 6 UC packs (720 UC → 8100 UC) in a balanced 3-column grid, one flat price per pack |
| Order form | Character ID validation, optional in-game name, package dropdown, terms checkbox |
| UPI payment | Live QR code, copy UPI ID, one-tap app buttons (intent deep links), payment countdown timer |
| Payment confirm | One-tap "I Have Paid" confirmation, "Payment Processing" state, status timeline, copy Order ID |
| Order history | Recent orders stored on the device (localStorage) |
| Customer feedback | Removed by choice — no review marquee, no feedback form, no footer feedback strip. The store makes no unverifiable claims |
| Store mark | `assets/mark.svg` (original UC-coin artwork drawn in-house) is used in the hero badge, the two section marks and the feedback card mark. No third-party game art is bundled. The brand logo and favicon stay the original "U" coin |
| Social cover | `assets/og-cover.png` (1200×630, generated by `tools/make-og-cover.py`) is the preview image for WhatsApp / Instagram / Google link shares |
| SEO files | `robots.txt`, `sitemap.xml`, canonical URL, Open Graph + Twitter tags and JSON-LD structured data (store, website and the live pack catalog) |
| Extras | Sticky header, mobile nav, toasts, smooth scroll, scroll reveal animations, auto-scrolling ticker strip |
| Responsive | Verified from 320px up to desktop — no horizontal scroll, cards stack to one column on small screens |
| Old devices | ES2015-only JavaScript + CSS fallbacks so older phones still render correctly (see below) |

---

## 📱 Old devices & browser compatibility

The site is built to work on **old phones too**, not just current ones. Two things used to break
it there, and both are fixed:

**1. JavaScript syntax (the big one).** Modern syntax is a *syntax error* on an older browser,
and a syntax error kills the **whole file** — the page then shows no packages and the order form
does nothing. `app.js` therefore uses ES2015 only:

| Not used | Because it breaks on |
|---|---|
| `?.` (optional chaining) | Chrome < 80, iOS < 13.4 |
| `catch {}` (no binding) | Chrome < 66, iOS < 11.1 |
| `{ ...object }` spread | Chrome < 60 |
| `async` / `await` | Chrome < 55 |
| `String.padStart` | Chrome < 57 (polyfilled instead) |

Feature fallbacks: `localStorage` access is wrapped (private mode used to throw and kill the
script), `IntersectionObserver` is optional (the reveal animation is simply skipped so content
is never invisible), `navigator.clipboard` falls back to `execCommand('copy')`, smooth scrolling
falls back to a plain jump, and every boot step runs in its own guard.

**2. CSS features that silently vanish.** A browser ignores a declaration it cannot parse — so a
`clamp()` font size or a flex `gap` just disappears and the layout collapses.

| Feature | Old-browser behaviour | Fallback in `style.css` |
|---|---|---|
| `clamp()` (headings, section padding) | declaration dropped → **padding 0** | plain value on the line above |
| `width: min(1200px, 92vw)` | dropped → container has no width | `width: 92vw; max-width: 1200px` |
| `margin-inline` / `inset:` | dropped → broken offsets | `margin-left/right`, `top/right/bottom/left` |
| flex `gap` | gap becomes **0** → items touch | child margins (same 10/14px spacing) |
| grid `gap` (Chrome 57–65) | gap becomes 0 | `grid-gap` alongside `gap` |
| `display: grid; place-items: center` | text not centred | flex centering (works everywhere) |
| `backdrop-filter` | header too transparent | solid header; blur only inside `@supports` |
| `mask-image` | grid overlay fully visible | `-webkit-mask-image` fallback |
| `appearance: none` on `<select>` | double arrow on iOS | `-webkit-appearance: none` |

The whole pattern is "**plain value first, modern value second**" — old browsers keep the first
line, modern browsers override with the second, so the design on new phones is unchanged.

**Layout floors checked:** 320px, 360px, 375px, 414px, 480px, 500px, 768px and desktop. The
`minmax(330px, 1fr)` grid track was the cause of a 32px horizontal scroll on 320px-wide phones —
there is now an explicit one-column rule below 420px.

### The scrolling ticker strip

The marquee is pure CSS (`@keyframes slide` + `translateX(-50%)`) and it is **seamless** because
the strip content is duplicated and each item's spacing is a `padding-right` — so half the track
is exactly one full set, with no jump at the loop point.

Two details matter for Android:

1. **`width: max-content` is required** for the `-50%` distance to mean "one set". Old
   Android / iOS browsers do not support it, and without it the track is only as wide as the
   viewport (the marquee then crawls a short distance and jumps). `initTicker()` in `app.js`
   detects this and sets the width in pixels by measuring `items[half] - items[0]` — *not*
   `scrollWidth`, because `scrollWidth` ignores the last item's trailing gap (that mistake made
   the loop jump 23px). The width is re-measured on resize, on orientation change and after the
   web font loads.
2. **The animation pauses when the strip is off-screen or the tab is in the background**
   (`IntersectionObserver` + `visibilitychange`). On a low-end phone that keeps the GPU and
   battery free while the customer is down at the order form.

Note: `prefers-reduced-motion: reduce` (Android's "Remove animations" / accessibility setting)
intentionally stops the strip — that is by design, not a bug.

**What still will not work:** a browser older than roughly Chrome 49 (Android 4.x stock browser,
iOS 9) has no CSS custom properties or `var()` at all, and no flexbox from a decade ago — that
is below the support floor. Note also that the Google Font is fetched from the network, so a very
slow connection shows the system font for a moment.

---

## 📁 File structure

```
.
SITE FILES — only these go live (the deploy workflow publishes just this list)
├── index.html                     # the whole site (single page)
├── assets/
│   ├── mark.svg                   # original store mark (hero badge + section marks)
│   ├── og-cover.png               # 1200×630 social share cover
│   ├── Google-pay.jpeg            # UPI app logos for the one-tap buttons
│   ├── phonepe.png  paytm.png  upi.png
│   ├── css/style.css              # dark theme styling
│   └── js/
│       ├── data.js                # ⚙️ SETTINGS + packages (the only file you edit)
│       └── app.js                 # order flow, UPI QR, payment confirmation, rendering
├── robots.txt  sitemap.xml        # SEO
├── CNAME                          # custom domain (ucbazzar.in)
└── .nojekyll                      # needed if you ever switch to a branch deploy

REPO FILES — stay in the repo, never served as public URLs on your domain
├── README.md                      # this file
├── GO-LIVE.md                     # hosting + domain + Google guide
├── tools/make-og-cover.py         # regenerates assets/og-cover.png (needs Pillow)
├── .gitignore                     # keeps agent / editor / OS junk out of commits
└── .github/workflows/deploy.yml   # "Static HTML" Pages workflow (auto-deploy on push)

.freebuff/                         # agent tooling — gitignored, never published
```

Published size: **~251 KB** (the GitHub Pages limit is 1 GB).

⚠️ **If you add a new root-level file** (another page, an image, a new CSS file), also add its
name to the `Build site folder` step in `.github/workflows/deploy.yml` — that step is the
whitelist, so anything not listed there will not reach the live site. Files inside `assets/`
already go along, because the whole folder is copied.

---

## 🖥️ Run it locally

No build step — double-click `index.html`, or serve the folder:

```bash
python -m http.server 4173
# open http://localhost:4173
```

The `Paste` buttons and the copy buttons use the Clipboard API, which needs a secure context —
GitHub Pages serves over HTTPS, so they work on the live site.

---

## ⚠️ Important notes

- This is a **frontend-only** site: orders are not stored on a server and payments are not
  verified automatically. A customer pays over UPI, taps "I Have Paid", and **you verify the
  payment in your UPI app (match amount + Order ID note) and deliver manually**.
- The one-tap app buttons are plain UPI intent links, so they depend on the customer's phone:
  each app-specific scheme (`tez://`, `phonepe://`, `paytmmp://`, `bhim://`) only opens if that
  app is installed. The generic `upi://pay` button always works because it opens the phone's
  app chooser — keep it as the primary option, exactly as it is now.
- Automatic payment verification (instantly confirming an order as paid) needs a payment
  gateway such as Razorpay/Cashfree plus a server, which does require paid hosting. On GitHub
  Pages, the "I Have Paid" button plus your manual check is the confirmation step.
- Only process orders whose amount matches a real credit in your UPI account. Always keep your
  UPI app statement as the source of truth.
- Replace the placeholder UPI ID, brand name and prices before sharing the
  link publicly.
- The site promises **"No carding UC — no ID ban"** (hero chip, ticker and the "Why It Is
  Safe" card). That is a claim you are making to customers, so only source UC from a
  legitimate channel — if a buyer's ID ever gets banned, this promise is what they will
  point at.
- The site intentionally has **no support, chat or social links** (no WhatsApp, Telegram,
  YouTube or Instagram anywhere) — buyers only interact through the order form.
- **BGMI / Krafton are trademarks of their respective owners.** The site carries a clear
  disclaimer saying it is an independent reseller and not an official page. Keep your
  bookkeeping in order.
- **Keep `app.js` ES2015-only.** Adding `?.`, `??`, `async/await`, object spread or `catch {}`
  anywhere in it will break the site completely on older phones (a syntax error kills the whole
  file — no packages, dead order form). The same goes for new CSS functions: always put a plain
  fallback declaration *above* a `clamp()` / `min()` one.
