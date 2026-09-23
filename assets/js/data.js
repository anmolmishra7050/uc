/* =====================================================================
   UC Bazaar — Site data & settings
   ---------------------------------------------------------------------
   Edit ONLY this file to customise the store.
   (Change your UPI ID, brand, prices and reviews below.)
   ===================================================================== */

/* SETTINGS ------------------------------------------------------------- */
const SITE_CONFIG = {
  brand: "UC Bazaar",

  // Your UPI ID — payments are collected here
  upiId: "anmolmi7890-1@okaxis",

  // Payee name shown inside the customer's UPI app
  upiName: "UC Bazaar",

  // How long the generated payment link stays open
  paymentWindowMinutes: 15,

  // How many digits a UPI UTR / transaction ID has (usually 12)
  utrLength: 12,

  /* One-tap UPI apps. Tapping a button opens that app on the customer's phone
     with the amount already filled in — they only enter their UPI PIN.
     No payment gateway, no API key, no backend needed.
     The first button (via SITE_CONFIG.upiLinkScheme) opens the phone's app
     chooser, which works everywhere. Delete any app you do not want. */
  upiLinkScheme: "upi://pay",
  upiApps: [
    { name: "Google Pay", scheme: "tez://upi/pay" },
    { name: "PhonePe", scheme: "phonepe://pay" },
    { name: "Paytm", scheme: "paytmmp://pay" },
    { name: "BHIM", scheme: "bhim://pay" },
  ],
};

/* UC PACKAGES ---------------------------------------------------------- */
/* uc:    UC amount shown in the summary
   price: what the customer pays
   mrp:   struck-through price (for the discount badge)
   tag:   optional ribbon on the card — leave "" for no ribbon      */
const PACKAGES = [
  { id: "uc60",   uc: 60,   price: 79,   mrp: 99,   title: "60 UC",   tag: "Starter" },
  { id: "uc325",  uc: 325,  price: 375,  mrp: 440,  title: "325 UC",  tag: "" },
  { id: "uc660",  uc: 660,  price: 749,  mrp: 880,  title: "660 UC",  tag: "Popular" },
  { id: "uc1800", uc: 1800, price: 1875, mrp: 2199, title: "1800 UC", tag: "Best Value" },
  { id: "uc3850", uc: 3850, price: 3699, mrp: 4399, title: "3850 UC", tag: "" },
  { id: "uc8100", uc: 8100, price: 7299, mrp: 8799, title: "8100 UC", tag: "PRO" },
];

/* CUSTOMER FEEDBACK ---------------------------------------------------- */
/* A mix of English and Hinglish reviews.
   NOTE: These are sample reviews — replace them with your real customer
   feedback before going live.
   Customers can also post their own review from the site; those are saved
   on their own device only (localStorage) and never leave their phone. */
const REVIEWS = [
  {
    name: "Aman Rajput", handle: "@aman_xd", city: "Jaipur", stars: 5,
    text: "Ordered 660 UC at 11 PM and it was in my account before I finished my noodles. Cheapest rate I have found so far — ordering again next season.",
  },
  {
    name: "Rohit Sharma", handle: "@rohitbgmi", city: "Kanpur", stars: 5,
    text: "Bhai sach me do minute me UC aa gaya 😳 UPI se payment kiya, UTR daala aur turant delivery mil gayi. Bilkul bharosemand hai.",
  },
  {
    name: "Priya Nair", handle: "@priyaplays", city: "Kochi", stars: 5,
    text: "I was worried about UC scams, but they only asked for my character ID — no login, no OTP. My 325 UC showed up within 5 minutes.",
  },
  {
    name: "Vikram Singh", handle: "@vikram_op", city: "Delhi", stars: 5,
    text: "Ordered UC for my whole squad as a surprise. Everyone had it in their account before the next match started. Legit store.",
  },
  {
    name: "Nikhil Verma", handle: "@nikhilv", city: "Pune", stars: 4,
    text: "Took around 8 minutes on a Sunday night because of peak load, but my order summary kept updating the whole time.",
  },
  {
    name: "Sahil Khan", handle: "@khan_sahil", city: "Bhopal", stars: 5,
    text: "8100 UC liya, game ke andar wale rate se bahut sasta pada. Delivery ka screenshot bhi bhej diya. Dhanyawad 🙏",
  },
  {
    name: "Farhan Ali", handle: "@farhan_clutch", city: "Hyderabad", stars: 5,
    text: "Compared prices across four sites — this one was the cheapest. UPI payment was quick and the UC landed in about 3 minutes.",
  },
  {
    name: "Ananya Das", handle: "@ananya.gg", city: "Kolkata", stars: 5,
    text: "Meri ID me galti thi, unhone khud pakad kar bata di. Isi wajah se paisa safe laga. 325 UC mil gaya.",
  },
  {
    name: "Meera Joshi", handle: "@meera_j", city: "Indore", stars: 5,
    text: "The first-order offer was explained clearly and I got the bonus UC too. Really friendly store for new players.",
  },
  {
    name: "Arjun Yadav", handle: "@arjun.yt", city: "Lucknow", stars: 5,
    text: "They are busy all day yet replies are fast. My 1800 UC order was delivered the same morning I paid. Recommended.",
  },
  {
    name: "Deepak Meena", handle: "@deepak.m", city: "Udaipur", stars: 5,
    text: "Teen baar order kiya, teeno baar paanch minute ke andar UC. Koi scam nahi, ekdum genuine.",
  },
  {
    name: "Simran Kaur", handle: "@simrankaur", city: "Chandigarh", stars: 4,
    text: "My bank app failed the first UPI attempt and they simply asked me to retry instead of blaming me. Refund for the failed attempt came in 2 hours.",
  },
  {
    name: "Ishita Roy", handle: "@ishita09", city: "Guwahati", stars: 5,
    text: "The QR payment was simple enough that my cousin ordered for me, and I still got the UC below the in-game price. 10/10.",
  },
  {
    name: "Ravi Menon", handle: "@ravi_menon", city: "Mumbai", stars: 5,
    text: "Paid at midnight and the UC was credited before I could even open the game to check. Rates are lower than anywhere else I looked.",
  },
  {
    name: "Karan Malhotra", handle: "@karan_m", city: "Surat", stars: 5,
    text: "Raat ek baje bhi kuch hi minute me delivery ho gayi. Aisi service par paanch star to bante hain ⭐",
  },
];
