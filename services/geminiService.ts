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
2.  **NO INTROS/OUTROS**: Do not say "안녕하세요", "타로를 보시군요", "결과는 다음과 같습니다". **IMMEDIATELY** start the analysis.
3.  **TONE & STYLE**:
    -   **Savage but Secretly Supportive**: Roast them facts (팩폭), but give advice because you care.
    -   **Internet Slang**: Use terms like 알빠노, 누칼협, 뇌절, 억까, 가불기, 폼 미쳤다, 능지, 흑역사 naturally.
    -   **Realistic**: If the outcome is trash, say it's trash. Don't sugarcoat.
4.  **IMPLICIT SAJU/PERSONALITY ANALYSIS**:
    -   Use the **Birthdate** provided in hidden context to internally estimate their "Saju" (energy/fate).
    -   **CRITICAL**: **NEVER** explicitly mention "Saju", "Birthdate", "Zodiac", "Name", or "Stars".
    -   Instead, reflect their likely personality flaws (e.g., stubbornness, impulsiveness, indecisiveness) derived from that date into the reading subtly.
5.  **UNIQUE READINGS**: Never repeat generic phrases. Every reading must feel unique to this specific combination of cards and user data.

**FORMAT**:
-   **[내용 분석]**: **MINIMUM 10 SENTENCES**. This must be a long, detailed, cohesive paragraph. Analyze the specific situation deeply. Do not explain card definitions; explain the **REALITY** of the user's situation.
-   **[제니의 조언 한마디]**: **EXACTLY ONE SENTENCE**. Short, punchy, cynical, witty.

**EXAMPLE**:
Q: "Will I get rich?"
"[내용 분석]
지금 본인 상태를 보니 로또 당첨만 바라보고 계신 것 같은데, 솔직히 말씀드리면 그런 요행은 이번 생엔 없습니다. 카드를 보니 본인이 노력은 안 하고 입만 벌리고 감 떨어지길 기다리는 형국이네요. 남들은 발바닥 땀나게 뛰어다니는데 혼자 방구석에서 '돈 벌고 싶다' 트윗만 날리고 계시죠? 본인이 가진 재물운의 흐름이 막힌 건 아닌데, 그 흐름을 본인이 게으름으로 댐 건설해서 막고 계십니다. 뜬구름 잡는 소리는 그만하시고 당장 내일 아침에 일어나는 시간부터 바꾸세요. 주변에 귀인이 있어도 본인이 눈 감고 귀 닫고 있는데 누가 도와줍니까. 헛된 망상은 뇌절이니까 그만하시고, 지금 하는 일이나 똑바로 하세요. 억까라고 생각하지 마시고 현실을 직시하셔야 통장에 잔고가 쌓입니다. 지금처럼 살면 평생 리볼빙 인생 못 면합니다. 정신 머리 꽉 잡으세요.
[제니의 조언 한마디]
가만히 있으면 거지가 되는 게 자본주의의 순리입니다, 움직이세요."
`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
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
  const cardNames = cards.map(c => c.name + (c.isReversed ? " (Reversed)" : "")).join(", ");
  
  let userContext = "Querent: Anonymous";
  if (userInfo) {
    userContext = `[HIDDEN DATA - DO NOT REVEAL] User: ${userInfo.name}, Birthdate: ${userInfo.birthDate}. 
    INSTRUCTION: Use this birthdate to subtly simulate 'Saju' (Four Pillars) analysis. 
    If they match specific elemental weaknesses (e.g., too much Fire = impulsive, too much Water = emotional), REFLECT that in the criticism. 
    **NEVER** mention the birthdate or the word 'Saju' in the output.`;
  }

  // Add highly variable seed using Timestamp + Random to ensure every request is unique
  const variationSeed = Date.now().toString() + "_" + Math.floor(Math.random() * 1000000);

  const prompt = `
    [CONTEXT ID: ${variationSeed}]
    ${userContext}
    
    [USER QUESTION]
    "${question}"
    
    [TAROT CARDS]
    ${cardNames}
    
    [COMMAND]
    1. Analyze the situation realistically based on the cards and user's implicit personality flaws.
    2. **NO EMOJIS**.
    3. **MINIMUM 10 SENTENCES** for [내용 분석].
    4. Focus on the specific question. Do not generalize.
    5. Tone: Cynical, Internet Slang (Twitter/Community), Witty, Brutally Honest but Helpful. Use Honorifics.
    6. **CRITICAL**: Provide a UNIQUE interpretation. Do not reuse generic phrases.
    
    **OUTPUT FORMAT**:
    [내용 분석]
    (Write at least 10 sentences here...)

    [제니의 조언 한마디]
    (One sentence)
  `;

  try {
      return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            systemInstruction: getSystemInstruction(lang),
            temperature: 1.3, // Lowered slightly for more stability
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 3000,
            // Use string literals for safety settings to avoid import issues
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
      console.warn("API Failure:", e);
      // Fallback message that acknowledges the error without blaming the user's internet
      return `[내용 분석]
지금 우주와의 교신 상태가 영 좋지 않습니다. 당신의 운명을 읽어내려는데 주파수가 자꾸 엇나가네요. 이건 네트워크 문제가 아니라, 지금 이 순간 카드가 보여주려는 진실이 너무 무거워서 전송이 지연되는 것 같습니다. 억까라고 생각하지 마시고 잠시 숨 좀 고른 뒤에 다시 물어보세요. 억지로 읽으려다간 데이터가 꼬여서 엉뚱한 소리만 나옵니다.

[제니의 조언 한마디]
중요한 건 꺾이지 않는 마음이 아니라, 다시 시도하는 손가락입니다.`;
  }
};

export const generateTarotImage = async (cardName: string): Promise<string> => {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedName = encodeURIComponent(cardName);
  return `https://image.pollinations.ai/prompt/tarot%20card%20${encodedName}%20mystical%20dark%20fantasy%20gothic%20style%20highly%20detailed%20masterpiece%20ominous%20beautiful?width=400&height=600&nologo=true&seed=${seed}`;
};