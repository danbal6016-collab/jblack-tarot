import type { VercelRequest, VercelResponse } from "@vercel/node";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// 너 UI에 있는 패키지 정의(가격은 KRW 기준)
const PACKAGES: Record<
  string,
  { amount: number; coins: number; name: string }
> = {
  pkg_5000_60: { amount: 5000, coins: 60, name: "60 Coins" },
  pkg_10000_150: { amount: 10000, coins: 150, name: "150 Coins" },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // ✅ 여기서 packageId를 “선언”해서 에러가 사라짐
    const { packageId, userId } = (req.body ?? {}) as {
      packageId?: string;
      userId?: string; // supabase auth uid를 넘길 거면 사용
    };

    if (!packageId || !PACKAGES[packageId]) {
      return res.status(400).json({ error: "Invalid packageId" });
    }

    const pkg = PACKAGES[packageId];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"], // ✅ Apple Pay는 Stripe에서 카드에 포함되어 자동 노출됨(조건 충족 시)
      line_items: [
        {
          price_data: {
            currency: "krw",
            product_data: { name: `Jennie's Black Tarot - ${pkg.name}` },
            unit_amount: pkg.amount,
          },
          quantity: 1,
        },
      ],
      // ✅ 결제 성공/취소 시 돌아갈 URL
      success_url: `${req.headers.origin}/?checkout=success`,
      cancel_url: `${req.headers.origin}/?checkout=cancel`,
      // ✅ webhook에서 쓰려고 메타데이터에 박아둠
      metadata: {
        packageId,
        coins: String(pkg.coins),
        userId: userId ?? "",
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
