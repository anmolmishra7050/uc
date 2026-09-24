# 🚀 Go-live guide — ucbazzar.in

Everything you need to put this store on the internet, connect the GoDaddy domain and
get it into Google search results. Follow the four parts in order.

**What it costs:** GitHub Pages hosting — free · GoDaddy domain — ~₹700–1,200/year ·
Google Search Console — free.

---

## Part 1 — Put the site online (GitHub Pages, free)

1. Create a GitHub account (if you do not have one) at <https://github.com/signup>.
2. Create a new repository: <https://github.com/new>
   - **Repository name:** `ucbazzar` (or any name you like)
   - **Visibility:** Public (required for free Pages)
   - Do **not** tick "Add a README file" — you already have one.
3. Upload the site files. Easiest way, no Git commands needed:
   - On the repo page click **Add file → Upload files**
   - Drag in **everything** from this folder: `index.html`, `assets/`, `robots.txt`,
     `sitemap.xml`, `CNAME`, `.nojekyll`, `README.md`, `GO-LIVE.md`
   - ⚠️ Hidden files like `.nojekyll` and the `.github/` folder may not show in the
     file picker on Windows — in the picker press `Ctrl + H` (or enable "Show hidden
     items") and also upload the `.github/workflows/deploy.yml` file by creating it
     manually: **Add file → Create new file**, name it
     `.github/workflows/deploy.yml`, and paste the contents of the same file from this
     folder.
   - Click **Commit changes**.
4. Turn on Pages: repo → **Settings → Pages**
   - **Source:** `GitHub Actions`
   - ⚠️ Set this **before** (or right after) the first upload — otherwise the first
     workflow run fails with "Pages site not found". If it fails, just re-run:
     **Actions → Deploy static content to Pages → Re-run jobs**.
5. Watch the deploy: **Actions** tab → the run takes ~1 minute → green tick.
6. Your site is now live at `https://<your-username>.github.io/ucbazzar/`.
   Open it on your phone and run one real order end to end.

> The workflow file is GitHub's official **"Static HTML"** workflow — no build step,
> no Node, no npm. Every time you edit a file in the repo, the site redeploys itself.

---

## Part 2 — Buy and connect ucbazzar.in (GoDaddy)

1. Buy the domain at <https://www.godaddy.com> → search `ucbazzar.in` → add to cart.
   - Turn **ON** auto-renew, and keep **domain privacy / WHOIS protection** enabled
     (GoDaddy usually includes it free).
2. Open **My Products → ucbazzar.in → DNS** (or "Manage DNS").
3. **Delete GoDaddy's default records first** — they break GitHub Pages:
   - Any **A record with name `@`** that points to GoDaddy's parking/Website Builder IP
   - Any **CNAME with name `www`** pointing to `@` or `parkingpage`
   - Any **Domain Forwarding** rule (My Products → Domain → Forwarding → delete)
4. **Add these four A records** (Type = A, Name = `@`, TTL = 600 seconds / 1 hour):

   | Type | Name | Value |
   |---|---|---|
   | A | @ | `185.199.108.153` |
   | A | @ | `185.199.109.153` |
   | A | @ | `185.199.110.153` |
   | A | @ | `185.199.111.153` |

   Optional IPv6 (AAA records, same name `@`):
   `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
5. **Add the www record** (so `www.ucbazzar.in` also works):

   | Type | Name | Value |
   |---|---:|---|
   | CNAME | www | `<your-username>.github.io` |

   ⚠️ Type your GitHub **username**, not the repository name. Example:
   `anmol123.github.io` — never `anmol123.github.io/ucbazzar`.
6. Save. DNS usually propagates in minutes, worst case **up to 24 hours**.
   Check progress at <https://www.whatsmydns.net> (look for the four GitHub IPs).

### Tell GitHub about the domain

7. Repo → **Settings → Pages → Custom domain** → type `ucbazzar.in` → **Save**.
   - GitHub runs a DNS check; it can say "DNS check unsuccessful" while DNS is still
     propagating. Wait and press **Save** again, or use **Check again**.
   - Because this site deploys with a **GitHub Actions workflow**, GitHub does not read
     the `CNAME` file — the custom domain must be set in this Settings screen.
8. Once the check passes, tick **Enforce HTTPS** (may take up to 24 hours to appear —
   GitHub needs to issue a free SSL certificate).
9. Open `https://ucbazzar.in` and `https://www.ucbazzar.in` — one redirects to the
   other automatically. Both must show the padlock 🔒.

**Rule of thumb:** if the site loads on `<username>.github.io` but not on your domain,
the problem is DNS (Part 2, steps 3–5). If it does not load on the github.io URL
either, the problem is the deploy (Part 1, steps 4–5).

---

## Part 3 — Get into Google (Search Console)

Google will not rank a site it has not indexed. This takes ~10 minutes and is the single
most important SEO step.

1. Go to <https://search.google.com/search-console> → **Add property**.
2. Choose **Domain** (not "URL prefix") and enter `ucbazzar.in`.
   - Google gives you a **TXT record** like `google-site-verification=abc123...`
   - In GoDaddy DNS add: Type = **TXT**, Name = `@`, Value = that whole string, TTL 1 hour.
   - Back in Search Console click **Verify** (may take a few minutes).
3. Submit your sitemap: left menu → **Sitemaps** → enter `sitemap.xml` → Submit.
   (`https://ucbazzar.in/sitemap.xml` is already in the repo.)
4. Force the first crawl: top search bar → paste `https://ucbazzar.in/` →
   **Request indexing**. Do this once; do not spam it.
5. Check back after 2–3 days — **Pages** report should show the URL as indexed.

### Also do this

- **Bing / DuckDuckGo:** <https://www.bing.com/webmasters> lets you import your site
  straight from Search Console in two clicks.
- **Verify the domain in GitHub** (Settings → Pages → Verified domains) to stop anyone
  else pointing a subdomain at your repo.

---

## Part 4 — The honest SEO reality

**Indexing** (site shows up when someone searches `ucbazzar`) takes a few days.
**Ranking** for `bgmi uc` is a different game — that keyword is fought over by Krafton's
official store and large resellers with years of history and thousands of backlinks. A
brand-new domain will not outrank them for months. What you *can* win early:

- **Long-tail searches** — "bgmi uc top up low price", "8100 uc price bgmi india",
  "bgmi elite pass uc price", "buy bgmi uc with upi". These convert better anyway,
  because the person is ready to buy.
- **Brand searches** — once you share the link, people searching "ucbazzar" or
  "UCBAZZAR bgmi uc" must find you. That is already handled by the title tags.

### What actually moves the needle

1. **Real content.** One page of ~250 words will not rank. Add 300–600 words of genuine
   text: how the top-up works, what the customer needs (only a character ID), delivery
   times, safety, refund policy, a short FAQ, and a plain price list in words
   ("8100 UC — ₹1,299"). Update `lastmod` in `sitemap.xml` when you change it.
2. **Backlinks.** Links from pages Google trusts is the strongest ranking factor:
   a YouTube video description of your store, Instagram/Telegram bio, gaming forums,
   Discord servers, Quora answers about buying UC safely, small gaming blogs.
   One good link beats fifty spammy ones.
3. **Keep it fresh.** Prices and offers updated regularly signal a live store.
4. **Measure.** In Search Console watch **Performance → Queries**: the words you already
   appear for tell you exactly which content to expand.
5. **Speed & mobile** are already good: static files, HTTPS, mobile-first layout.
6. **Google Ads** is the instant-visibility route, but third-party game-currency
   resellers often fail ad policy reviews, and every click costs money. Try it only
   after the store has real reviews.

### ⚠️ Before going public, fix these

- ~~Fake stats & sample reviews~~ — **done.** The "4.9★ / 12,400+ Orders" chip, the rating
  breakdown card, the feedback form and all sample reviews have been removed — the whole
  reviews/feedback panel is gone from the site. Do not add invented reviews — misleading
  advertising is covered by India's consumer-protection rules and Google's policies, and
  it is the fastest way to get the store reported or the site penalised.
- ~~Demo checkout line~~ — **done.** The order form now reassures buyers instead
  ("You pay from your own UPI app — we never ask for your login, OTP or card details.").
- ~~Trademark & artwork~~ — **done.** The copyrighted BGMI artwork has been removed and
  replaced with original in-house graphics (`assets/mark.svg`, `assets/og-cover.png`), and
  the footer disclaimer now states plainly that the store is not affiliated with,
  endorsed by or sponsored by KRAFTON, Inc. The name "BGMI" is still used in the page
  copy and title, but only descriptively — to say which game's currency is sold. A
  rights-holder can still object to that descriptive use, so keep your own records and
  act fast if you ever receive a notice.
- **Delivery is manual.** Nothing on the site confirms a payment automatically. You must
  check your UPI app for a credit matching the amount + Order ID note *before* sending
  UC. The "I Have Paid" button only tells the customer their order is queued — it is not
  proof of payment.
- **Know your risk.** Reselling UC may breach the game's terms of service. That is a
  business decision only you can make.

---

## Quick reference

| What | Where |
|---|---|
| Site files | `index.html`, `assets/`, `robots.txt`, `sitemap.xml`, `CNAME`, `.nojekyll` |
| Deploy trigger | Push to `main` (or manual run in the **Actions** tab) |
| Prices / packages | `assets/js/data.js` |
| Failure window for orders | `orderFailAfterMinutes` in `assets/js/data.js` |
| UPI ID / payee name | `upiId`, `upiName` in `assets/js/data.js` |
| Live URL | `https://ucbazzar.in` |
| GitHub URL | `https://<your-username>.github.io/ucbazzar/` |

When you edit any CSS or JS file, also bump the `?v=` number on that file's tag in
`index.html` (e.g. `style.css?v=12` → `?v=13`) so returning visitors do not see a cached
older version.
