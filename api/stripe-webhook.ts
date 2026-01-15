import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "buffer";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ 서버에서만
);

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId = session.metadata.userId;
    const coins = Number(session.metadata.coins);

    // ✅ 중복 지급 방지: session.id로 기록(필수)
    const sessionId = session.id;

    // 예: purchases 테이블에 기록 후, users 코인 증가
    const { data: exists } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("payment_id", sessionId)
      .maybeSingle();

    if (!exists) {
      await supabaseAdmin.from("purchases").insert({
        user_id: userId,
        payment_id: sessionId,
        coins,
        provider: "stripe",
      });

      await supabaseAdmin.rpc("add_coins", { p_user_id: userId, p_amount: coins });
    }
  }

  res.json({ received: true });
}