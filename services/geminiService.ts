import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language } from "../types";

const getSystemInstruction = (lang: Language) => `
You are 'Jennie', a cynical but sharp Tarot Reader who speaks like a Korean internet heavy user (community slang).

**STRICT RULES:**
1. **NO EMOJIS**. Never use emojis.
2. **NO MARKDOWN BOLDING (*)**. Do not use asterisks for bolding. Just plain text.
3. **NO INTRO/OUTRO**. No "Hello", "Here is your reading".
4. **NO NAME/ZODIAC MENTIONS**. Do not mention the user's name or zodiac sign in the text.
5. **TONE**:
   - Use **Honorifics (존댓말/해요체)** absolutely.
   - Use Korean Internet Slang (e.g., 뼈 맞으셨죠? / 오히려 좋아 / 레전드네).
   - Be "Fact Bomb" style (brutally honest) but end with a "Tsundere" vibe (secretly cheering for them).

**REQUIRED OUTPUT STRUCTURE:**

[내용 분석]
(Interpret the 3 cards regarding the question. Analyze the situation brutally and realistically. Use about 3-5 sentences.)

[제니의 조언 한마디]
(ONE powerful, funny, sarcastic but helpful sentence to wrap it up.)

**Language**: Korean (default).
`;

const ai = new GoogleGenAI({ apiKey: apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

// Retry helper
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export const getTarotReading = async (
  question: string,
  cards: TarotCard[],
  userInfo?: UserInfo,
  lang: Language = 'ko'
): Promise<string> => {
  const cardDescriptions = cards.map(c => `${c.name} (${c.isReversed ? 'Reversed' : 'Upright'})`).join(', ');
  // User info is passed for Context but EXPLICITLY forbidden in output by System Instruction
  const userContext = userInfo 
    ? `User Context (DO NOT MENTION NAME/ZODIAC IN OUTPUT): ${userInfo.name}, ${userInfo.zodiacSign}, ${userInfo.birthDate}` 
    : "User: Guest";

  const prompt = `
    Context: ${userContext}
    Question: "${question}"
    Selected Cards: ${cardDescriptions}
    
    Interpret this strictly following the structure: [내용 분석] and [제니의 조언 한마디].
  `;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(lang),
        temperature: 0.9,
        // Increased to 4000 to absolutely prevent text truncation/cutting
        maxOutputTokens: 4000, 
      },
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("Empty response");
    }
  });
};

export const generateTarotImage = async (cardName: string): Promise<string> => {
  // Use Pollinations with a safe prompt. 
  // If this service fails, the UI will fallback to black.
  // We do NOT use the "Your prompt is fine" placeholder. 
  // We add a random seed to ensure uniqueness.
  const seed = Math.floor(Math.random() * 100000);
  const encodedName = encodeURIComponent(cardName);
  return `https://image.pollinations.ai/prompt/tarot%20card%20${encodedName}%20mystical%20dark%20fantasy%20gold%20and%20black%20style%20no%20text?width=400&height=600&nologo=true&seed=${seed}`;
};
