import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { TarotCard, UserInfo, Language } from "../types";

// ---------------------------------------------------------------------------
// JENNIE'S PERSONA CONFIGURATION
// ---------------------------------------------------------------------------
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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry logic updated to persist for approx 30-40 seconds before giving up
// Retries: 10 times
// Delays: 1s, 1.5s, 2.25s, 3.3s, 5s, 5s, 5s, 5s, 5s, 5s (approx 38s total wait time)
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 10, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;
    
    console.warn(`API Attempt failed. Retrying in ${delay}ms... (${retries} retries left)`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Cap the delay at 5 seconds to keep polling reasonably active
    const nextDelay = Math.min(delay * 1.5, 5000);
    
    return retryWithBackoff(fn, retries - 1, nextDelay);
  }
}

export const getTarotReading = async (
  question: string,
  cards: TarotCard[],
  userInfo?: UserInfo,
  lang: Language = 'ko'
): Promise<string> => {
  const cardNames = cards.map(c => c.name + (c.isReversed ? " (Reversed)" : "")).join(", ");
  
  let userContext = "Querent: Anonymous";
  if (userInfo) {
    userContext = `[HIDDEN DATA] User: ${userInfo.name}, Birthdate: ${userInfo.birthDate}. Simulate 'Saju' flaws implicitly.`;
  }

  const variationSeed = Date.now().toString() + "_" + Math.floor(Math.random() * 1000);

  const prompt = `
    ID: ${variationSeed}
    ${userContext}
    Q: "${question}"
    Cards: ${cardNames}
    
    TASK: Analyze realistically. No emojis. Min 10 sentences. Cynical & Witty.
    
    OUTPUT FORMAT:
    [내용 분석]
    ...
    [제니의 조언 한마디]
    ...
  `;

  try {
      return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            systemInstruction: getSystemInstruction(lang),
            temperature: 1.1, 
            topP: 0.95,
            topK: 40, 
            maxOutputTokens: 2000, 
            thinkingConfig: { thinkingBudget: 0 }, 
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
          },
        });

        if (response.text) {
          return response.text;
        } else {
          throw new Error("Empty response");
        }
      });
  } catch (e: any) {
      console.error("API completely failed after multiple retries:", e);
      // Final failure message as requested
      return "Spirits are silent today...";
  }
};

export const generateTarotImage = async (cardName: string): Promise<string> => {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedName = encodeURIComponent(cardName);
  return `https://image.pollinations.ai/prompt/tarot%20card%20${encodedName}%20mystical%20dark%20fantasy%20gothic%20style%20highly%20detailed%20masterpiece%20ominous%20beautiful?width=400&height=600&nologo=true&seed=${seed}`;
};