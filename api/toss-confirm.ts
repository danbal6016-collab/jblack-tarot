import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "buffer";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { paymentKey, orderId, amount, userId, coins } = req.body as any;

    // 1) Toss 서버에 결제 승인(confirm) 요청
    const secretKey = process.env.TOSS_SECRET_KEY!;
    const basic = Buffer.from(`${secretKey}:`).toString("base64");

    const resp = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(400).json({ error: data?.message ?? "Toss confirm failed" });

    // 2) Supabase에 구매 기록 + 코인 적립 (중복 방지)
    const exists = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("payment_id", paymentKey)
      .maybeSingle();

    if (!exists.data) {
      await supabaseAdmin.from("purchases").insert({
        user_id: userId,
        payment_id: paymentKey,
        coins,
        provider: "toss",
      });

      await supabaseAdmin.rpc("add_coins", { p_user_id: userId, p_amount: coins });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}