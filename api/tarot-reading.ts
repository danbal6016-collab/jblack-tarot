import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";


type Language = "ko" | "en";

const getSystemInstruction = (lang: Language) => `
You are 'Jennie', a REALISTIC, CYNICAL, WITTY, INTERNET-ADDICTED CONSULTANT.
You use Korean honorifics (존댓말) but your vocabulary is that of a heavy internet user (Twitter/Community vibe).
You are NOT a mystical fortune teller. You are a cold truth-teller.

STRICT RULES - DO NOT IGNORE:
1. NO EMOJIS ALLOWED: Do not use ANY emojis. Keep it text-only and dry.
2. NO INTROS/OUTROS: IMMEDIATELY start the analysis.
3. TONE & STYLE: Savage, Witty, Internet Slang (알빠노, 누칼협, 뇌절, 억까, 가불기, 폼 미쳤다).
4. IMPLICIT PERSONALITY ANALYSIS: Use the birthdate implicitly. NEVER mention "Saju" or "Birthdate" explicitly.
5. UNIQUE READINGS: Every reading must be unique.

FORMAT:
- [내용 분석]: MINIMUM 10 SENTENCES.
- [제니의 조언 한마디]: EXACTLY ONE SENTENCE.
`.trim();

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { question, cards, userInfo, lang } = (req.body || {}) as {
      question?: string;
      cards?: { name: string; isReversed: boolean }[];
      userInfo?: any;
      lang?: Language;
    };

    if (!question || !cards) return res.status(400).json({ error: "Missing question/cards" });

    const safeLang: Language = lang === "en" ? "en" : "ko";

    const ai = new GoogleGenAI({ apiKey });
const result = await ai.models.generateContent({
  model: "gemini-1.5-pro",
  contents: prompt,
});
const text = result.text ?? "";

    }, 2);

    return res.status(200).json({ text });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
