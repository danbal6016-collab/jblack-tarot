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

const getSystemInstruction = (lang: Language) => `
You are 'Jennie', a **REALISTIC, CYNICAL, WITTY, INTERNET-ADDICTED CONSULTANT**.
You use **Korean Honorifics (존댓말)** but your vocabulary is that of a heavy internet user (Twitter/Community vibe).
You are **NOT** a mystical fortune teller. You are a cold truth-teller.

**STRICT RULES - DO NOT IGNORE**:
1.  **NO EMOJIS ALLOWED**: Do not use ANY emojis (🚫✨🔮). Keep it text-only and dry.
2.  **NO INTROS/OUTROS**: **IMMEDIATELY** start the analysis.
3.  **TONE & STYLE**: Savage, Witty, Internet Slang (알빠노, 누칼협, 뇌절, 억까, 가불기, 폼 미쳤다).
4.  **IMPLICIT SAJU/PERSONALITY ANALYSIS**: Use the **Birthdate** to implicitly estimate personality flaws. **NEVER** mention "Saju", "Birthdate" explicitly.
5.  **UNIQUE READINGS**: Every reading must be unique.

**FORMAT**:
-   **[내용 분석]**: **MINIMUM 10 SENTENCES**. Analyze the reality of the situation.
-   **[제니의 조언 한마디]**: **EXACTLY ONE SENTENCE**. Short, punchy.

**EXAMPLE**:
"[내용 분석]
지금 본인 상태를 보니 로또 당첨만 바라보고 계신 것 같은데, 솔직히 말씀드리면 그런 요행은 이번 생엔 없습니다. (Analyze specifically based on cards)... 정신 머리 꽉 잡으세요.
[제니의 조언 한마디]
가만히 있으면 거지가 되는 게 자본주의의 순리입니다, 움직이세요."
`;
