/* =====================================================================
   UCBAZZAR — Site data & settings
   ---------------------------------------------------------------------
   Edit ONLY this file to customise the store.
   (Change your UPI ID, brand, prices and reviews below.)
   ===================================================================== */

/* SETTINGS ------------------------------------------------------------- */
const SITE_CONFIG = {
  brand: "UCBAZZAR",

  // Your UPI ID — payments are collected here
  upiId: "anmolmi7890-1@okaxis",

  // Payee name shown inside the customer's UPI app — keep this EXACTLY
  // equal to your bank-registered UPI name so customers trust the screen
  upiName: "Anmol Mishra",

  // How long the generated payment link stays open
  paymentWindowMinutes: 15,

  // An order stuck in "Processing" longer than this is shown as "Failed"
  // in the customer's recent-orders list
  orderFailAfterMinutes: 30,

  // Recent orders older than this stop showing in "Your recent orders"
  // (checked on page load and live while the page stays open)
  orderHistoryHours: 1,

  /* One-tap UPI apps. Tapping a button opens that app on the customer's phone
     with the amount already filled in — they only enter their UPI PIN.
     No payment gateway, no API key, no backend needed.
     The first button (via SITE_CONFIG.upiLinkScheme) opens the phone's app
     chooser, which works everywhere. Delete any app you do not want. */
  upiLinkScheme: "upi://pay",
  upiApps: [
    { name: "Google Pay", scheme: "tez://upi/pay", logo: "assets/Google-pay.jpeg" },
    { name: "PhonePe", scheme: "phonepe://pay", logo: "assets/phonepe.png" },
    { name: "Paytm", scheme: "paytmmp://pay", logo: "assets/paytm.png" },
    { name: "BHIM", scheme: "bhim://pay", logo: "assets/upi.png" },
  ],
};

/* UC PACKAGES ---------------------------------------------------------- */
/* uc:    UC amount shown in the summary
   price: what the customer pays (this is the only price shown — no MRP,
          no discount badges)
   tag:   optional ribbon on the card — leave "" for no ribbon
   note:  optional highlighted line inside the card (e.g. "Elite Pass Special") */
const PACKAGES = [
  { id: "uc720",  uc: 720,  price: 199,  title: "720 UC",  tag: "Elite Pass Special",
    note: "🎫 The exact pick for the BGMI Elite Pass" },
  { id: "uc1800", uc: 1800, price: 399,  title: "1800 UC", tag: "" },
  { id: "uc2560", uc: 2560, price: 549,  title: "2560 UC", tag: "Popular" },
  { id: "uc3200", uc: 3200, price: 699,  title: "3200 UC", tag: "Best Value" },
  { id: "uc3850", uc: 3850, price: 749,  title: "3850 UC", tag: "" },
  { id: "uc8100", uc: 8100, price: 1299, title: "8100 UC", tag: "PRO" },
];

/* CUSTOMER FEEDBACK ---------------------------------------------------- */
/* Reviews/feedback panel has been removed from the site by choice.
   Do not add customer reviews to the page — keeping the store claim-free
   is safer than showing feedback that cannot be verified. */
