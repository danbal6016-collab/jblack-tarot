// services/geminiService.ts (안전장치 추가 버전)
import { TarotCard, UserInfo, Language } from "../types";

// ... (기존 설정 코드는 그대로 둬도 되지만, 전체 복붙이 편합니다) ...

const getSystemInstruction = (lang: Language) => `
You are 'Jennie', a CYNICAL, WITTY consultant. Use Korean Honorifics.
Rules: NO EMOJIS. Start immediately. Tone: Savage but supportive.
FORMAT IS CRITICAL:
[내용 분석]
(Analysis here...)
[제니의 조언 한마디]
(Advice here...)
`;

// Savage Fallback (에러 날 때 쓰는 문구)
const generateSavageFallback = (question: string, cards: TarotCard[], userInfo?: UserInfo): string => {
  return `[내용 분석]\n질문을 보니 답답함이 모니터 뚫고 나오네요. 카드는 최선을 다해 답을 주고 있는데 본인이 안 들을 준비가 되어 계십니다. 지금 상황은 본인이 만든 '가불기'입니다. 인정할 건 인정합시다.\n\n[제니의 조언 한마디]\n정신 차리고 현실 로그인을 권장합니다.`;
};

// API 호출 함수
export async function callGemini(prompt: string) {
  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    
    // 응답이 HTML(404 등)로 오면 에러 처리
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || "API Error");
      return data;
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`);
    }
  } catch (e) {
    console.error("Fetch Error:", e);
    throw e;
  }
}

// 메인 함수
export const getTarotReading = async (
  question: string, 
  cards: TarotCard[], 
  userInfo?: UserInfo, 
  lang: Language = 'ko'
): Promise<string> => {
  const cardNames = cards.map(c => c.name).join(", ");
  
  const prompt = `
${getSystemInstruction(lang)}
[QUESTION]: "${question}"
[CARDS]: ${cardNames}
Analyze realistically. FOLLOW THE FORMAT.
`;

  try {
    const data = await callGemini(prompt);
    let text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";

    // ★핵심 수정: AI가 멍청하게 포맷을 안 지켰을 때 강제로 포맷 씌우기★
    if (text && !text.includes("[내용 분석]")) {
      text = `[내용 분석]\n${text}\n\n[제니의 조언 한마디]\n형식은 틀렸지만 제 말 무슨 뜻인지 아시죠?`;
    }

    if (!text) throw new Error("Empty response");
    return text;

  } catch (e) {
    console.warn("Retrying/Fallback due to:", e);
    return generateSavageFallback(question, cards, userInfo);
  }
};

// 이미지 생성 (랜덤 시드 추가로 캐싱 회피 시도)
export const generateTarotImage = async (cardName: string): Promise<string> => {
  const seed = Math.floor(Math.random() * 999999);
  const encodedName = encodeURIComponent(cardName);
  // Pollinations가 막히면 다른 이미지가 나오도록 seed를 적극 활용
  return `https://image.pollinations.ai/prompt/Tarot%20card%20${encodedName}%20mystical%20dark?width=300&height=500&seed=${seed}&nologo=true`;
};
