import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId } = await req.json();

  // 패키지 매핑 (서버에서 고정: 조작 방지)
  const PACKAGES = {
    pkg_60: { coins: 60, amount: 5000, priceId: process.env.STRIPE_PRICE_5000! },
    pkg_150:{ coins:150, amount:10000, priceId: process.env.STRIPE_PRICE_10000! },
  };

  const pkg = PACKAGES[packageId];
  if (!pkg || !userId) return res.status(400).json({ error: "Invalid request" });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: pkg.priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/payment/success`,
    cancel_url: `${process.env.APP_URL}/payment/cancel`,
    metadata: { userId, coins: String(pkg.coins), packageId },
  });

  res.json({ url: session.url });
}


const res = await fetch("/api/create-checkout-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ packageId: "pkg_60", userId: }),
});
const { url } = await res.json();
window.location.href = url;
