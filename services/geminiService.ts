// services/geminiService.ts
import { TarotCard, UserInfo, Language } from "../types";

// 1. 제니 페르소나 설정
const getSystemInstruction = (lang: Language) => `
You are 'Jennie', a **REALISTIC, CYNICAL, WITTY, INTERNET-ADDICTED CONSULTANT**.
You use **Korean Honorifics (존댓말)** but your vocabulary is that of a heavy internet user.
You are **NOT** a mystical fortune teller. You are a cold truth-teller.

**STRICT RULES**:
1. **NO EMOJIS**: Keep it text-only and dry.
2. **NO INTROS/OUTROS**: Start analysis IMMEDIATELY.
3. **TONE**: Savage but secretly supportive (팩폭). Use terms like 알빠노, 누칼협, 뇌절, 억까 properly.
4. **IMPLICIT SAJU**: Use birthdate for hidden analysis but NEVER mention "Saju" or "Birthdate".
5. **UNIQUE READINGS**: Never repeat generic phrases.
`;

// 2. Savage Fallback (API 실패 시 제니가 화내는 모드)
const generateSavageFallback = (question: string, cards: TarotCard[], userInfo?: UserInfo): string => {
  const analyses = [
    
  ];
  
  const advices = [
   
  ];

  const idx = (question.length + (cards[0]?.id || 0)) % analyses.length;
  const adviceIdx = (question.length + (cards[1]?.id || 0)) % advices.length;

  return `[내용 분석]\n${analyses[idx]}\n\n[제니의 조언 한마디]\n${advices[adviceIdx]}`;
};

// 3. 실제 API 호출 함수
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

// 4. 메인 타로 리딩 함수 (재시도 로직 포함)
export const getTarotReading = async (
  question: string, 
  cards: TarotCard[], 
  userInfo?: UserInfo, 
  lang: Language = 'ko'
): Promise<string> => {
  
  // 카드 정보 텍스트로 변환
  const cardNames = cards.map(c => c.name + (c.isReversed ? " (Reversed)" : "")).join(", ");
  
  // 사용자 정보 (사주 분석용)
  let userContext = "Querent: Anonymous";
  if (userInfo) {
    userContext = `[HIDDEN DATA] User: ${userInfo.name}, Birthdate: ${userInfo.birthDate}. Simulate 'Saju' analysis implicitly.`;
  }

  // 프롬프트 조립
  const prompt = `
${getSystemInstruction(lang)}

${userContext}

[USER QUESTION]
"${question}"

[TAROT CARDS]
${cardNames}

[COMMAND]
1. Analyze the situation realistically.
2. **NO EMOJIS**.
3. **MINIMUM 10 SENTENCES** for [내용 분석].
4. Tone: Cynical, Internet Slang, Witty, Brutally Honest.

**OUTPUT FORMAT**:
[내용 분석]
(Write at least 10 sentences...)

[제니의 조언 한마디]
(One sentence)
`;

  // 재시도 로직 (최대 2번 시도 후 Savage Mode 발동)
  let retries = 2;
  while (retries >= 0) {
    try {
      console.log(`Asking Gemini... (Attempts left: ${retries})`);
      const data = await callGemini(prompt);
      
      const text = data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join("") || "";

      if (!text) throw new Error("Empty response from Gemini");
      
      return text; // 성공하면 여기서 종료

    } catch (e) {
      console.warn("API Error:", e);
      if (retries === 0) {
        console.warn("All retries failed. Switching to Savage Fallback.");
        return generateSavageFallback(question, cards, userInfo);
      }
      retries--;
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기 후 재시도
    }
  }

  return generateSavageFallback(question, cards, userInfo);
};

// 5. 이미지 생성용 함수
export const generateTarotImage = async (cardName: string): Promise<string> => {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedName = encodeURIComponent(cardName);
  return `https://image.pollinations.ai/prompt/Tarot%20card%20${encodedName}%20mystical%20dark%20fantasy%20gothic%20style%20highly%20detailed%20masterpiece%20ominous%20beautiful?width=300&height=500&seed=${seed}&nologo=true`;
};
