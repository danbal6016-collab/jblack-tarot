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

// Initialize GenAI inside function to ensure global fetch patch is active

// Retry logic updated to persist for approx 30-40 seconds before giving up
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 10, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;
    
    // Log less verbosely for expected errors, but keep it for debugging
    console.warn(`API Attempt failed. Retrying in ${delay}ms... (${retries} retries left). Error: ${error.message || error}`);
    
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
  // [CRITICAL] Initialize AI client HERE to pick up the patched window.fetch
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
      // More descriptive error message for the user if it's the Referrer block
      if (e.message && (e.message.includes("blocked") || e.message.includes("PERMISSION_DENIED") || e.message.includes("referrer"))) {
        return "System Access Denied: The Oracle is currently blocked. (API Key Referrer restriction detected. Please ensure your API key allows this domain).";
      }
      return "Spirits are silent today... (Network/API Error)";
  }
};

// Generates an AI Image URL (Pollinations)
export const generateTarotImage = async (cardName: string): Promise<string> => {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedName = encodeURIComponent(cardName);
  // Enhanced prompt for better consistency
  return `https://image.pollinations.ai/prompt/tarot%20card%20${encodedName}%20mystical%20dark%20fantasy%20gothic%20illustration%20highly%20detailed%20intricate%20golden%20details%20masterpiece?width=400&height=600&nologo=true&seed=${seed}`;
};

// Returns a static fallback image URL (Rider-Waite deck from reliable source)
export const getFallbackTarotImage = (cardId: number): string => {
  // Mapping logic to standard Rider-Waite filenames
  // Source: GitHub tarruda/tarot-deck (MIT) or similar static structure
  const baseUrl = "https://raw.githubusercontent.com/tarruda/tarot-deck/master/images/";
  
  const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
  
  let filename = "";
  
  if (cardId >= 0 && cardId <= 21) {
    // Major Arcana (00 - 21)
    filename = `${pad(cardId)}.jpg`;
  } else if (cardId >= 22 && cardId <= 35) {
    // Wands (Ace=01 to King=14)
    const num = cardId - 22 + 1;
    filename = `wands${pad(num)}.jpg`;
  } else if (cardId >= 36 && cardId <= 49) {
    // Cups
    const num = cardId - 36 + 1;
    filename = `cups${pad(num)}.jpg`;
  } else if (cardId >= 50 && cardId <= 63) {
    // Swords
    const num = cardId - 50 + 1;
    filename = `swords${pad(num)}.jpg`;
  } else if (cardId >= 64 && cardId <= 77) {
    // Pentacles
    const num = cardId - 64 + 1;
    filename = `pentacles${pad(num)}.jpg`;
  } else {
    // Unknown - fallback to The Fool
    filename = "00.jpg"; 
  }
  
  return `${baseUrl}${filename}`;
};