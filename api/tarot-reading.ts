import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 2) {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await sleep(400 * (i + 1));
    }
  }
  throw lastErr;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.GEMINI_API_KEY; // ✅ Vercel Environment Variables에 넣을 것
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { question, cards, userInfo, lang } = req.body || {};
    if (!question || !cards) return res.status(400).json({ error: "Missing question/cards" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
You are a tarot reader. Output in ${lang === "ko" ? "Korean" : "English"}.
User info: ${JSON.stringify(userInfo || {})}
Question: ${question}
Cards: ${JSON.stringify(cards)}

Rules:
- Be direct, specific, and practical.
- Give an overall summary, then card-by-card, then action steps.
    `.trim();

    const text = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    }, 2);

    return res.status(200).json({ text });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
