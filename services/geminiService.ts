
import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language, ReadingResult } from "../types";

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

const getBaseInstruction = (lang: Language) => {
    // STRICT "JENNIE" PERSONA
    return `
You are 'Jennie', a REALISTIC, CYNICAL, WITTY, INTERNET-ADDICTED CONSULTANT.
You use Korean Honorifics (존댓말) but your vocabulary is that of a heavy internet user (Twitter/Community vibe).
You are NOT a mystical fortune teller. You are a cold truth-teller.

STRICT RULES - DO NOT IGNORE:
1. NO EMOJIS ALLOWED: Do not use ANY emojis (🚫✨🔮). Keep it text-only and dry.
2. NO INTROS/OUTROS: IMMEDIATELY start the analysis.
3. TONE & STYLE: Savage, Witty, Internet Slang (알빠노, 누칼협, 뇌절, 억까, 가불기, 폼 미쳤다, 능지처참, 오히려 좋아).
4. IMPLICIT SAJU/PERSONALITY ANALYSIS: Use the User's Birthdate to implicitly estimate personality flaws. NEVER mention "Saju" or "Birthdate" explicitly. Just roast them based on it.
5. UNIQUE READINGS: Every reading must be unique.
6. LANGUAGE: Korean (Hangul).
`;
};

const getTarotStructure = (lang: Language, tier: string = 'BRONZE') => {
    // FORMAT RULES
    return `
FORMAT:
[내용 분석]
(MINIMUM 10 SENTENCES. Analyze the reality of the situation. Be cynical and realistic. Use slang like 억까, 뇌절.)

[조언 한마디]
(EXACTLY ONE SENTENCE. Short, punchy, savage.)

[실질적인 해결책]
1. (현실적인 해결책) (Minimum 5 sentences. Brutally realistic.)
2. (가장 효과적인 해결책) (Minimum 5 sentences. The best way out.)
3. (신박하고 웃긴 해결책) (Minimum 5 sentences. Witty, funny, internet-brained approach.)
`;
};

// --- SAFETY SETTINGS ---
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
    const PROXY_TIMEOUT = 25000;   
    const CLIENT_TIMEOUT = 18000; 
    
    const config = { ...baseConfig, safetySettings: SAFETY_SETTINGS };

    const getFallbackMsg = () => {
        return `[내용 분석]\n서버가 터졌습니다. 억까 그 자체네요. 인터넷 상태 확인하고 다시 오세요.\n\n[조언 한마디]\n새로고침이 답입니다.`;
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
        // 1. Attempt Server-Side Proxy
        try {
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
        }

        // 2. Client-Side Fallback (Direct REST API to avoid SDK Referrer issues)
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

        // Use Direct REST API Call instead of SDK to strip Referrer manually
        const responseText = await retryOperation(async () => {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            let contents: any = { parts: [{ text: prompt }] };
            if (imageParts) {
                contents = { parts: [...imageParts, { text: prompt }] };
            }

            const response = await withTimeout(
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [contents],
                        generationConfig: config,
                        safetySettings: SAFETY_SETTINGS
                    }),
                    referrerPolicy: "no-referrer" // CRITICAL FIX FOR 403
                }),
                CLIENT_TIMEOUT
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API Error: ${response.status} ${JSON.stringify(errData)}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (typeof text === 'string') {
                return text;
            }
            throw new Error("No text generated in response");
        }, 1);

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
  history: ReadingResult[] = [],
  tier: string = 'BRONZE'
): Promise<string> => {
  const cardNames = cards.map(c => c.name + (c.isReversed ? " (Reversed)" : "")).join(", ");
  const userContext = userInfo ? `User: ${userInfo.name}, ${userInfo.birthDate}` : "User: Anonymous";
  
  // AI Personalization for Silver+
  let personalizationContext = "";
  if ((tier === 'SILVER' || tier === 'GOLD' || tier === 'PLATINUM') && history.length > 0) {
      // Get last 3 readings to give context
      const recentHistory = history.slice(0, 3).map(h => `Q: ${h.question} -> A: ${h.interpretation.substring(0, 50)}...`).join("\n");
      personalizationContext = `\n[Context from User History - DO NOT REPEAT, just use for tone consistency]\n${recentHistory}\nUser has high loyalty. Be deeply personal.`;
  }

  const additionalContext = "Be brutally honest. Use internet slang naturally.";

  const prompt = `
    ${userContext}
    ${personalizationContext}
    Q: "${question}"
    Cards: ${cardNames}
    ${additionalContext}
    ${getTarotStructure(lang, tier)}
  `;

  const config = {
    systemInstruction: getBaseInstruction(lang),
    temperature: 0.8, // Slightly higher for "Witty" creativity
    maxOutputTokens: 1500, // Increased for longer solution texts
    thinkingConfig: { thinkingBudget: 0 } 
  };

  return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getCompatibilityReading = async (
    myInfo: UserInfo, 
    partnerBirth: string, 
    lang: Language = 'ko'
): Promise<string> => {
    const prompt = `
      Analyze the sexual and deep inner compatibility between ${myInfo.name} (${myInfo.birthDate}) and Partner (${partnerBirth}).
      Tone: Slightly erotic, intense, revealing, but grounded in Saju/Astrology. 
      Length: Around 30 lines.
      Structure:
      [Physical Chemistry]
      [Inner Desires]
      [Final Verdict]
    `;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.85,
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 }
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getPartnerLifeReading = async (
    partnerBirth: string,
    lang: Language = 'ko'
): Promise<string> => {
    const prompt = `
      Analyze the life path of a person born on ${partnerBirth} using Saju/Astrology.
      Sections: Early Years, Middle Age, Late Years.
      Reveal their true nature, hidden destiny, and fortune.
      Tone: Professional, mysterious, revealing.
    `;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.8,
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 }
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    const prompt = `
      Analyze this face based on Physiognomy (Face Reading) standards at an expert level.
      Is this person the one the user is looking for?
      Length: ~20 lines.
      Tone: Cynical but accurate. NOT too harsh/insulting, but honest.
      Focus on personality, fortune, and relationship potential derived from facial features.
    `;
    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { 
        systemInstruction: getBaseInstruction(lang), 
        temperature: 0.7, 
        maxOutputTokens: 600,
        thinkingConfig: { thinkingBudget: 0 }
    };
    return await callGenAI(prompt, config, 'gemini-2.5-flash-image', [imagePart], lang);
};

export const getLifeReading = async (userInfo: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const prompt = `
      Analyze Saju (Four Pillars) for ${userInfo.name}, Born: ${userInfo.birthDate} at ${userInfo.birthTime || 'Unknown Time'}.
      
      Required Content (~50 lines):
      1. When and how will they make a fortune? (Wealth timing/source).
      2. Hidden genius talents they don't know yet.
      3. The Golden Age of their life (when they rule).
      4. Future Spouse details: Height, Appearance, Vibe, Job.
      5. Life "Cheat Codes" (Crucial facts to know).
      
      Tone: Professional, destined, revealing.
    `;
    const config = { 
        systemInstruction: getBaseInstruction(lang), 
        temperature: 0.8, 
        maxOutputTokens: 1000, 
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