import { GoogleGenAI } from "@google/genai";
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

// ---------------------------------------------------------------------------
// SAVAGE FALLBACK GENERATOR (OFFLINE MODE)
// ---------------------------------------------------------------------------
const generateSavageFallback = (question: string, cards: TarotCard[], userInfo?: UserInfo): string => {
  const analyses = [
    `질문을 보니 답답함이 모니터 뚫고 나오네요. 본인만 빼고 세상이 다 아는 사실을 왜 굳이 물어보시나요? 지금 상황은 본인이 만든 '가불기'에 걸린 상태입니다. 이러지도 저러지도 못하는 건 상황 탓이 아니라 본인 결단력 문제라는 거 인정하셔야죠. 솔직히 말해서 본인도 답 알고 계시잖아요? 그냥 듣고 싶은 말이 있어서 오신 것 같은데, 현실은 냉혹합니다. 뇌피셜로 희망 회로 돌리지 마시고 팩트만 보세요. 지금 이대로 가다간 이도 저도 안 됩니다. 남 탓 하지 마시고 본인부터 되돌아보세요. 지금은 존버가 답이 아니라 손절이 답일 수도 있습니다. 정신 바짝 차리세요.`,
    
    `아이고, 또 시작이시네. 이 정도면 고집이 아니라 아집입니다. 카드가 보여주는 현실은 시궁창인데, 본인은 꽃밭에 누워 계시네요. 지금 그 고민, 사실 본인의 게으름이나 욕심에서 비롯된 거 아닙니까? 남 탓하지 마세요. 팩트는 본인이 안 움직이고 있다는 겁니다. 운이 들어오려다가도 본인 태도 보고 도망갈 판이에요. 정신 승리는 그만하시고, 현실적인 대책을 세우세요.`,
    
    `솔직히 말씀드릴까요? 지금 헛다리 짚고 계십니다. 본인이 중요하게 생각하는 그거, 남들은 관심도 없어요. 혼자서 북 치고 장구 치고 계신 형국입니다. 지금 타이밍 아주 안 좋아요. 괜히 나대다가 의문의 1패 당하지 마시고 납작 엎드려 계세요. 인생은 실전입니다. 연습 게임인 줄 아시나 봐요? 정신 바짝 차리세요.`
  ];
  
  const advices = [
      "뇌피셜 굴리지 말고 현실 로그인을 권장합니다.",
      "이불킥할 흑역사 그만 만드시고 잠이나 주무세요.",
      "주인공 병은 약도 없습니다, 얼른 완치하세요.",
      "감성 팔이는 일기장에나 하시고, 이성은 좀 챙기세요."
  ];

  const idx = (question.length + (cards[0].id || 0)) % analyses.length;
  const adviceIdx = (question.length + (cards[1].id || 0)) % advices.length;

  return `[내용 분석]
${analyses[idx]}

[제니의 조언 한마디]
${advices[adviceIdx]}`;
};

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
  
  // Implicitly use user info for context ONLY
  let userContext = "Querent: Anonymous";
  if (userInfo) {
    // Explicitly instruct to use this data for implicit Saju/Personality filtering only
    userContext = `[HIDDEN DATA - DO NOT REVEAL] User: ${userInfo.name}, Birthdate: ${userInfo.birthDate}. 
    INSTRUCTION: Use this birthdate to subtly simulate 'Saju' (Four Pillars) analysis. 
    If they match specific elemental weaknesses (e.g., too much Fire = impulsive, too much Water = emotional), REFLECT that in the criticism. 
    **NEVER** mention the birthdate or the word 'Saju' in the output.`;
  }

  const prompt = `
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
    
    **OUTPUT FORMAT**:
    [내용 분석]
    (Write at least 10 sentences here...)

    [제니의 조언 한마디]
    (One sentence)
  `;

  
return retryWithBackoff(async () => {
  try {
    const data = await callGemini(prompt);

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .filter(Boolean)
        .join("") || "";

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return text;
  } catch (e: any) {
    console.warn("API Error, switching to Savage Fallback Mode:", e);
    return generateSavageFallback(question, cards, userInfo);
  }
});
   

export const generateTarotImage = async (cardName: string): Promise<string> => {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedName = encodeURIComponent(cardName);
  return `https://image.pollinations.ai/prompt/tarot%20card%20${encodedName}%20mystical%20dark%20fantasy%20gothic%20style%20highly%20detailed%20masterpiece%20ominous%20beautiful?width=400&height=600&nologo=true&seed=${seed}`;
};
export async function callGemini(prompt: string) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error || data?.message || "Gemini request failed";
    throw new Error(msg);
  }

  return data;
}

