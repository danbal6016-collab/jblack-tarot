
import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language, ReadingResult } from "../types";

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

const getBaseInstruction = (lang: Language) => {
    if (lang === 'en') {
        return `Role: Black Tarot (Cynical).
Rules:
1. Short, savage analysis.
2. No emojis.
3. No filler.
4. Use user info.`;
    } else {
        return `역할: 블랙 타로 (냉소적, 팩폭).
규칙:
1. 짧고 강렬한 독설.
2. 이모지 금지.
3. 잡담 금지.
4. 사용자 정보 반영.`;
    }
};

const getTarotStructure = (lang: Language) => {
    if (lang === 'en') {
        return `
[Analysis]
(3 savage sentences.)

[Advice]
(1 sentence.)

[Solution]
(3 actions.)
`;
    } else {
        return `
[내용 분석]
(3문장 팩폭.)

[블랙 타로의 조언]
(1문장.)

[실질적인 해결책]
(짧은 행동 3개.)
`;
    }
};

// --- SAFETY SETTINGS ---
// Critical for "Savage" persona to avoid being blocked
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

// --- API CALL HELPERS ---

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    baseDelay: number = 500
): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            // Retry on network errors or 429/5xx
            const status = error.status || error.response?.status;
            if (status === 429 || status >= 500 || error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('network')) {
                const delay = baseDelay * (i + 1); 
                await wait(delay);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

async function callGenAI(prompt: string, baseConfig: any, model: string = 'gemini-3-flash-preview', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    const PROXY_TIMEOUT = 5000;   // Increased to 5s
    const CLIENT_TIMEOUT = 18000; // Increased to 18s (Total max ~20s)
    
    // Merge safety settings into config
    const config = { ...baseConfig, safetySettings: SAFETY_SETTINGS };

    const getFallbackMsg = () => {
        if (lang === 'en') {
            return `
[Analysis]
The spirits are silent. The server is overloaded or your connection is weak.

[Advice]
Try again later.

[Solution]
1. Check Wifi.
2. Refresh page.
3. Breathe.
`;
        } else {
            return `
[내용 분석]
우주의 신호가 끊겼습니다. 서버가 혼잡하거나 당신의 운명이 로딩을 거부하고 있습니다.

[블랙 타로의 조언]
새로고침 하세요.

[실질적인 해결책]
1. 와이파이 확인.
2. 페이지 새로고침.
3. 잠시 후 재시도.
`;
        }
    };

    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
            promise.then(
                (res) => { clearTimeout(timer); resolve(res); },
                (err) => { clearTimeout(timer); reject(err); }
            );
        });
    };

    try {
        // --- 1. PROXY ATTEMPT ---
        try {
            // Attempt proxy without retries to save time for client fallback if it fails
            const proxyPromise = (async () => {
                const body: any = { prompt, config, model };
                if (imageParts) body.imageParts = imageParts;

                const proxyRes = await fetch('/api/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                
                if (!proxyRes.ok) throw new Error(`Proxy ${proxyRes.status}`);
                
                const data = await proxyRes.json();
                if (!data.text) throw new Error("Empty response");
                return data.text as string;
            })();

            const result = await withTimeout(proxyPromise, PROXY_TIMEOUT);
            return result;

        } catch (proxyError: any) {
            // console.warn("Proxy failed, switching to client...", proxyError);
            // Fall through to Client Direct
        }

        // --- 2. CLIENT DIRECT FALLBACK ---
        let apiKey = '';
        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.env) {
                apiKey = process.env.API_KEY || '';
            }
        } catch(e) {}

        try {
            // @ts-ignore
            if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env) {
                // @ts-ignore
                apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || '';
            }
        } catch(e) {}

        if (!apiKey) {
            console.error("No API Key found");
            return getFallbackMsg();
        }

        const ai = new GoogleGenAI({ apiKey });
        
        let contents: any = prompt;
        if (imageParts) contents = { parts: [...imageParts, { text: prompt }] };

        const responseText = await retryOperation(async () => {
            const response = await withTimeout(
                ai.models.generateContent({
                    model,
                    contents,
                    config
                }),
                CLIENT_TIMEOUT 
            ) as any;
            
            if (typeof response.text === 'string') {
                return response.text;
            }
            throw new Error("No text generated");
        }, 1); // Allow 1 retry for client

        return responseText;

    } catch (finalError) {
        console.error("Final Fallback Triggered", finalError);
        return getFallbackMsg();
    }
}

// --- MAIN SERVICES ---

export const getTarotReading = async (
  question: string,
  cards: TarotCard[],
  userInfo?: UserInfo,
  lang: Language = 'ko',
  history: ReadingResult[] = []
): Promise<string> => {
  const cardNames = cards.map(c => c.name + (c.isReversed ? " (Reversed)" : "")).join(", ");
  const userContext = userInfo ? `User: ${userInfo.name}, ${userInfo.birthDate}` : "User: Anonymous";

  const prompt = `
    ${userContext}
    Q: "${question}"
    Cards: ${cardNames}
    ${getTarotStructure(lang)}
  `;

  const config = {
    systemInstruction: getBaseInstruction(lang),
    temperature: 0.7, 
    maxOutputTokens: 450,
    thinkingConfig: { thinkingBudget: 0 } // Fast response
  };

  return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getCompatibilityReading = async (
    myInfo: UserInfo, 
    partnerBirth: string, 
    lang: Language = 'ko'
): Promise<string> => {
    const prompt = `Compat: ${myInfo.name} & ${partnerBirth}. Savage.`;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.8,
        maxOutputTokens: 450,
        thinkingConfig: { thinkingBudget: 0 }
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getPartnerLifeReading = async (
    partnerBirth: string,
    lang: Language = 'ko'
): Promise<string> => {
    const prompt = `Life Path: ${partnerBirth}. Savage.`;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.8,
        maxOutputTokens: 450,
        thinkingConfig: { thinkingBudget: 0 }
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    const prompt = `Analyze face. Truth. Savage.`;
    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { 
        systemInstruction: getBaseInstruction(lang), 
        temperature: 0.7, 
        maxOutputTokens: 400,
        thinkingConfig: { thinkingBudget: 0 }
    };
    return await callGenAI(prompt, config, 'gemini-2.5-flash-image', [imagePart], lang);
};

export const getLifeReading = async (userInfo: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const prompt = `Life Path: ${userInfo.name}, ${userInfo.birthDate}. Wealth/Talent. Savage.`;
    const config = { 
        systemInstruction: getBaseInstruction(lang), 
        temperature: 0.8, 
        maxOutputTokens: 500,
        thinkingConfig: { thinkingBudget: 0 }
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const generateTarotImage = async (cardName: string): Promise<string> => {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedName = encodeURIComponent(cardName);
  const url = `https://image.pollinations.ai/prompt/tarot%20card%20${encodedName}%20mystical%20dark%20fantasy%20style%20deep%20purple%20and%20gold%20smoke%20effect%20detailed%204k%20no%20text?width=400&height=600&nologo=true&seed=${seed}&model=flux`;
  return url;
};

export const getFallbackTarotImage = (cardId: number): string => {
  const baseUrl = "https://raw.githubusercontent.com/tarruda/tarot-deck/master/images/";
  const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
  let filename = "";
  if (cardId >= 0 && cardId <= 21) filename = `${pad(cardId)}.jpg`;
  else if (cardId >= 22 && cardId <= 35) filename = `wands${pad(cardId - 22 + 1)}.jpg`;
  else if (cardId >= 36 && cardId <= 49) filename = `cups${pad(cardId - 36 + 1)}.jpg`;
  else if (cardId >= 50 && cardId <= 63) filename = `swords${pad(cardId - 50 + 1)}.jpg`;
  else if (cardId >= 64 && cardId <= 77) filename = `pentacles${pad(cardId - 64 + 1)}.jpg`;
  else filename = "00.jpg"; 
  return `${baseUrl}${filename}`;
};
