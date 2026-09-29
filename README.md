# UC BAZZAR — Game Top-Up Store

Yellow/gold themed, fully static top-up storefront (BGMI UC + Free Fire MAX Diamonds) — no build step, no backend.

## 1. Apna payment + contact info daalein (ZAROORI)

Sirf ek file edit karni hai: **`config.js`**

```js
window.STORE = {
  name: 'UC BAZZAR',
  upiId: 'ucbazzar@airtel',      // ← apna UPI ID (set ho chuka hai)
  payeeName: 'UC BAZZAR',     // ← bank account holder name
  email: 'ucbazzar@gmail.com',   // ← orders + support isi email par

  // Homepage ka "Orders Delivered" counter — 0 se shuru hokar har ghante 7–15 badhta hai
  orders: { base: 0, startDate: '2026-09-29', perHourMin: 7, perHourMax: 15 },
  qrApi: 'https://api.qrserver.com/v1/create-qr-code/',
};
```

## 2. Prices / packages badalna

**`script.js`** ke top par `GAMES` object hai. Har game ke `packages` me `name`, `price` aur optional `tag`
(`POPULAR`, `BEST VALUE`) edit karein. Nayi package add/remove karna bilkul safe hai.

## 3. "Orders Delivered" counter

Homepage par jo number dikhta hai woh `config.js` ke `orders` se banta hai:

- `base` — startDate par kitne orders the. Abhi **0** hai, yaani counter zero se shuru hota hai.
- `startDate` — jis din se count chalu ho. Abhi aaj ki date (`2026-09-29`) hai, isliye raat 12 baje counter 0 hota hai.
- `perHourMin` / `perHourMax` — **har ghante** kitne orders add honge (7–15).

Number har ghante apne aap badhta hai aur ghante ke andar bhi halka-halka tick karta dikhta hai. Koi
server ya database ki zarurat nahi. Counter dobara 0 se shuru karna ho to `startDate` ko aaj ki date
aur `base` ko 0 kar dein.

## 4. Local preview

```bash
node serve.js          # http://127.0.0.1:4321
node serve.js 8080     # dusra port
```

Ya `index.html` ko seedha browser me khol lein (assets relative path se load hote hain).

## 5. Payment flow

1. Customer game + Player ID + package select karta hai.
   - Player ID field sirf **digits** leta hai aur **maximum 12** digits (zyada type/paste karne par extra kat jaate hain).
   - **8–12 digits par border green**, kam digits par **border red** — customer ko turant pata chal jaata hai.
   - **📋 Paste** button clipboard se seedha ID utha leta hai (label/level jaise extra numbers ignore karke).
   - **Verify Player ID** dabane par popup: 8–12 digits par **✅ Player ID Verified**, kam (ya jyada) digits par
     **❌ Player ID Not Verified** with the exact reason ("you entered 4 digits — needs at least 8").
2. **PROCEED TO PAY** par UPI QR khulta hai — QR me amount **auto-filled** hota hai
   (`upi://pay?pa=...&am=<price>&cu=INR&tn=...`).
3. Direct app buttons (icons `Assests/` se): **GPay** (`tez://`), **PhonePe** (`phonepe://`),
   **Paytm** (`paytmmp://`), **BHIM UPI** (`upi://`). Mobile par ye app khol dete hain, desktop par QR scan.
4. Payment ke baad customer **“✅ I Have Paid”** dabata hai — koi email nahi kholta. Uski entry seedha
   **Payment History** page par chali jaati hai, screenshot-friendly order ID ke saath, aur wahan
   status **⏳ Payment Verifying** dikhta hai.

> Aap UPI app me payment dekh kar UC/Diamonds deliver karte hain, phir us order ko Delivered mark karte hain.

### Payment History ka flow

Customer "✅ I Have Paid" dabata hai to Payment History page khulta hai, upar **⏳ Payment Verifying**
banner aata hai aur uski entry "⏳ Payment Verifying" status ke saath list me dikhti hai (koi
countdown nahi). `config.js` ka `verifyMinutes` (default 10) ke baad status apne aap
**❌ Payment Failed** ho jaata hai.

History page par **Reset History** ka button bhi hai — confirm karne par us device ki poori
payment history delete ho jaati hai.

Jab aap UC deliver kar dein, us order ko Delivered mark karein — us device ke browser console me:

```js
UCBAZZAR.markDelivered('UCBXXXX')   // order id card par likha hota hai
UCBAZZAR.list()                     // saare payments dekhein
UCBAZZAR.clear()                    // history saaf karein
```

History localStorage me rehti hai (per device). Dusre device par woh customer apni history nahi dekhega.

## 6. Deploy — repo `anmolmishra7050/uc` (live site: `ucbazzar.in`)

Aapki live site is repo ke **`main` branch** se chalti hai (Cloudflare ke peeche, push par khud deploy
hota hai). Repo me is waqt ye poori site maujood hai, is liye deploy ka sabse safe tarika hai
**fresh clone → files copy → commit → push** (ghar wale home folder me `git add -A` **kabhi na chalao**,
wo aapka poora home folder repo me daal dega):

```bash
# 1. repo ka saaf clone (home folder ke bahar)
cd /c/Users/anmol/Desktop
git clone https://github.com/anmolmishra7050/uc.git ucbazzar-live
cd ucbazzar-live

# 2. is folder ki latest files copy karo (.freebuff aur .github ko chhod kar)
SRC="/c/Users/anmol/OneDrive/Desktop/UCBAZZAR 2.0"
cp -f "$SRC"/*.html "$SRC"/*.js "$SRC"/*.css "$SRC"/*.md "$SRC"/*.txt "$SRC"/*.xml "$SRC"/favicon.ico "$SRC"/.nojekyll .
cp -rf "$SRC"/Assests/. ./Assests/

# 3. commit + push -> site live (1-2 minute me deploy ho jaata hai)
git add -A
git commit -m "Update site"
git push origin main
```

Deploy ke baad check karein: `https://ucbazzar.in/` (naya title), `/favicon.ico`, `/Assests/og-image.png`,
`/sitemap.xml` — sab 200 dene chahiye.

Note: Cloudflare pages ko **clean URL** pasand hai — `/about.html` 307 hokar `/about` par chala jaata hai.
Dono URL kaam karte hain, is liye links waise hi rakhe hain (aur agar host badla to bhi tootenge nahi).

Git identity: is machine par global git config set nahi hai — commit karte waqt ye chalayein:

```bash
GIT_AUTHOR_NAME="anmolmi7890-dot" GIT_AUTHOR_EMAIL="anmolmi7890@gmail.com" \
GIT_COMMITTER_NAME="anmolmi7890-dot" GIT_COMMITTER_EMAIL="anmolmi7890@gmail.com" \
git commit -m "Update site"
```

Doosre hosts: **Netlify / Cloudflare Pages / Vercel** — folder drag & drop karein, build command
ki zarurat nahi. Shared hosting par files `public_html` me upload kar dein.

## 7. Files

| File | Kaam |
|---|---|
| `index.html` | Main store page (game select → player info → packages → order summary → payment modal → payment history) |
| `payment-history.js` | Payment records + Verifying/Failed/Delivered status engine |
| `styles.css` | Dark + gold theme, fully responsive |
| `config.js` | **Store settings** — UPI ID, email, orders counter |
| `script.js` | Package data + selection, validation, QR/UPI links, email order, daily order counter |
| `about.html` | About Us page (store story, location, working hours) — nav ka last item |
| `faq.html`, `contact.html`, `privacy.html`, `terms.html`, `refund.html` | Support / policy pages |
| `serve.js` | Local dev server (`node serve.js`) — deploy ke liye zaroori nahi |
| `Assests/` | Logo, game art, UC / diamond icons, GPay / PhonePe / Paytm / UPI icons |
| `.github/workflows/deploy.yml` | GitHub Pages auto-deploy (push par chalta hai) |

## 8. Google / social media par dikhne wali cheezein

- **Title + description** (Google result me yahi dikhta hai) har page ke `<head>` me hain. Title **60 characters**
  se kam aur description **~155 characters** se kam rakhein, warna Google "..." laga kar kaat deta hai.
- **Canonical** tag har page par hai (`https://ucbazzar.in/...`) taaki `github.io` ya `www` wali copies
  Google ke liye duplicate na banein.
- **Link preview (WhatsApp / Instagram / Facebook / Telegram)**: `Assests/og-image.png` (1200x630) use hoti hai,
  aur `og:image`, `og:title`, `og:description`, `twitter:card` tags har page par lage hain. Logo ya text
  badalna ho to `_makeog.ps1` jaisa script chala kar image dobara generate kar lein (ya naya 1200x630 PNG
  `Assests/og-image.png` naam se rakh dein) — filename same rakhna zaroori hai.
- **Favicon**: Google ke liye favicon **square** aur **48 ka multiple** hona chahiye (48, 96, 144, 192...).
  Isliye PNG icons bana diye hain — `Assests/favicon-48.png`, `favicon-96.png`, `favicon-144.png`,
  `favicon-192.png`, plus root me `favicon.ico` (browsers + Google dono ise dhundhte hain) aur
  `Assests/apple-touch-icon.png` (home-screen icon). Saare pages me `rel="icon"` links lage hain.
  Google ke result me icon aane me kuch din lagte hain; Search Console me "Request indexing" se jaldi hota hai.
- **Logo badla?** To `Assests/og-image.png` (1200x630) aur favicon files dobara generate karni padengi —
  original logo `Assests/uc_bazzar_logo.jpg` (1254x1254) hai, usse resize karke same filenames se save kar dein.
- **Link preview update nahi ho raha?** WhatsApp/Facebook purana preview cache kar lete hain. Facebook
  Sharing Debugger par URL daal kar "Scrape Again" karein, ya link ke aage `?v=2` laga kar ek baar share karein.

## 9. About Us page ki details badalna

`about.html` me store ki story, address, working hours aur "quick facts" likhe huye hain.
Abhi **address aur joining year placeholder hain** (`Shop 12, Golden Plaza, Sector 17, Vashi, Navi Mumbai`
and `2023`) — apna asli address, apni city aur sahi saal daal dein. Yahi file me "what we deliver",
"our promise" aur "ready to top up" sections bhi edit ho sakte hain.

About Us link homepage ke nav me sabse aakhir me hai (Home · Top Up · History · FAQ · Contact · About Us),
footer ke Quick Links me bhi, aur baaki saare pages ke footer me bhi.

## 10. Zaroori note

Hum game publisher (Krafton / Garena) ke official partner nahi hain — policy pages me yeh clearly likha hua hai.
