
import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language, ReadingResult } from "../types";

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

const getBaseInstruction = (lang: Language) => {
    return `
[SYSTEM: FAST MODE ACTIVATED]
You are 'Jennie', a REALISTIC, CYNICAL, WITTY consultant.
Output must be EXTREMELY CONCISE AND FAST.
Use Korean Honorifics (존댓말) with internet slang.

STRICT RULES:
1. NO EMOJIS in main text.
2. NO INTROS/OUTROS.
3. MAX 3 LINES PER SECTION.
4. BE SAVAGE & WITTY.
`;
};

const getTarotStructure = (lang: Language, tier: string = 'BRONZE') => {
    // Gold+ gets a Special Section
    const specialSection = (tier === 'GOLD' || tier === 'PLATINUM') 
        ? `\n[Jennie's Secret Tip]\n(One spicy sentence)` 
        : "";

    // Platinum gets full transparency
    const platinumNote = (tier === 'PLATINUM')
        ? `\n(PLATINUM: Raw outcome)`
        : "";

    return `
FORMAT:
[내용 분석]
(2 short sentences)

[조언 한마디]
(1 punchy sentence)

[실질적인 해결책]
1. (Short solution)
2. (Short solution)
3. (Witty solution)
${specialSection}
${platinumNote}
`;
};

// --- EMERGENCY FALLBACK TEXT ---
// Used when all API calls fail to prevent the UI from showing an error.
const EMERGENCY_FALLBACK_RESPONSE = `
[내용 분석]
우주의 기운이 잠시 메롱하네요. 하지만 당신은 이미 답을 알고 있지 않나요?

[조언 한마디]
시스템 오류도 운명, 잠시 후 다시 시도하세요.

[실질적인 해결책]
1. 잠시 숨을 고르고 1분 뒤에 다시 시도.
2. 폰을 껐다 켜보세요.
3. 개발자에게 맛있는 거 사주라고 기도하기.
`;

// --- SAFETY SETTINGS ---
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

// --- API CALL HELPERS ---

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fallback Chain
// OPTIMIZATION: Use 'gemini-flash-lite-latest' for maximum speed and lower latency.
// Removed 'gemini-1.5-flash' as per restrictions.
const MODEL_FALLBACK_CHAIN = [
    'gemini-flash-lite-latest',
    'gemini-2.5-flash',
    'gemini-3-flash-preview',
];

async function retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 2, 
    baseDelay: number = 500
): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const status = error.status || error.response?.status;
            const errorMessage = error.message?.toLowerCase() || '';
            
            // Critical: If Referrer Blocked (403), do NOT retry the same way, throw immediately
            if (status === 403 || errorMessage.includes('referer') || errorMessage.includes('permission_denied')) {
                throw error; 
            }

            // Retry on rate limits (429), server errors (500+), or network issues (Failed to fetch)
            if (
                status === 429 || 
                status >= 500 || 
                errorMessage.includes('fetch') || 
                errorMessage.includes('network') || 
                errorMessage.includes('overloaded') ||
                errorMessage.includes('aborted') ||
                errorMessage.includes('timeout')
            ) {
                if (i === maxAttempts - 1) break;

                const delay = baseDelay * Math.pow(2, i); 
                console.warn(`Retry ${i+1}/${maxAttempts} after ${delay}ms due to error:`, error.message);
                await wait(delay);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

async function callGenAI(prompt: string, baseConfig: any, preferredModel: string = 'gemini-flash-lite-latest', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    // Global Timeout
    const API_TIMEOUT = 60000;   
    let lastErrorMessage = "";

    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
            promise.then(
                (res) => { clearTimeout(timer); resolve(res); },
                (err) => { clearTimeout(timer); reject(err); }
            );
        });
    };

    const chainSet = new Set([preferredModel, ...MODEL_FALLBACK_CHAIN]);
    const modelsToTry = Array.from(chainSet);

    for (const model of modelsToTry) {
        try {
            console.log(`Attempting generation with model: ${model}`);
            
            const config = { ...baseConfig, safetySettings: SAFETY_SETTINGS };
            
            // OPTIMIZATION: EXTREME SPEED
            if (!config.maxOutputTokens) config.maxOutputTokens = 500; 

            if (config.thinkingConfig) delete config.thinkingConfig;

            let responseText = "";
            
            // 1. Client-Side Call (SDK)
            let apiKey = '';
            try {
                // @ts-ignore
                if (typeof import.meta !== 'undefined' && import.meta.env) {
                    // @ts-ignore
                    apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || '';
                }
            } catch(e) {}

            try {
                // @ts-ignore
                if (!apiKey && typeof process !== 'undefined' && process.env) {
                    apiKey = process.env.API_KEY || process.env.VITE_API_KEY || '';
                }
            } catch(e) {}

            if (apiKey) {
                try {
                    responseText = await withTimeout(retryOperation(async () => {
                        const ai = new GoogleGenAI({ apiKey });
                        
                        let contents: any = { parts: [{ text: prompt }] };
                        if (imageParts && imageParts.length > 0) {
                            contents = { parts: [...imageParts, { text: prompt }] };
                        }

                        const response = await ai.models.generateContent({
                            model: model,
                            contents: contents,
                            config: config
                        });

                        if (response.text) return response.text;
                        
                        if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason) {
                             throw new Error(`Blocked: ${response.candidates[0].finishReason}`);
                        }
                        
                        throw new Error("No text generated from model (empty response).");
                    }, 2, 1000), API_TIMEOUT);

                    if (responseText) return responseText;

                } catch (e: any) {
                    console.warn(`Client-side SDK failed for ${model}. trying proxy...`, e.message);
                    if (e.message.includes("Blocked") || e.message.includes("invalid_argument") || e.message.includes("api_key")) {
                        throw e; // Don't fallback to proxy if it's a critical client error
                    }
                }
            }

            // 2. Proxy Fallback
            try {
                const proxyPromise = retryOperation(async () => {
                    const body: any = { prompt, config, model };
                    if (imageParts) body.imageParts = imageParts;

                    const controller = new AbortController();
                    // Vercel Hobby/Pro timeout safety. Set to 25s to catch it before Global Timeout.
                    // If Vercel kills it at 10s (Hobby), this will fail with fetch error, triggering retry or next model.
                    const timeoutId = setTimeout(() => controller.abort(), 25000); 

                    try {
                        const constEqRes = await fetch('/api/gemini', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body),
                            signal: controller.signal
                        });
                        
                        clearTimeout(timeoutId);

                        if (!constEqRes.ok) {
                            if (constEqRes.status === 404) {
                                throw new Error("Proxy endpoint not found (404)");
                            }
                            // If 504 Gateway Timeout, throw specific error
                            if (constEqRes.status === 504) {
                                throw new Error("Server Timeout (504)");
                            }
                            const errText = await constEqRes.text().catch(() => constEqRes.statusText);
                            throw new Error(`Proxy ${constEqRes.status}: ${errText}`);
                        }
                        const data = await constEqRes.json();
                        if (!data.text) throw new Error("Empty response from proxy");
                        return data.text as string;
                    } catch (fetchErr: any) {
                        clearTimeout(timeoutId);
                        if (fetchErr.name === 'AbortError') {
                            throw new Error("Proxy request timed out locally");
                        }
                        throw fetchErr;
                    }
                }, 2, 1000);

                return await withTimeout(proxyPromise, API_TIMEOUT);

            } catch (proxyError: any) {
                console.error(`Proxy failed for ${model}:`, proxyError);
                lastErrorMessage = proxyError.message || "Proxy Error";
            }

        } catch (modelError: any) {
            console.warn(`Model ${model} failed fully.`, modelError);
            lastErrorMessage = modelError.message || JSON.stringify(modelError);
            continue;
        }
    }

    console.error("All models failed. Returning Emergency Fallback. Last Error:", lastErrorMessage);
    return EMERGENCY_FALLBACK_RESPONSE;
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
  
  let personalizationContext = "";
  if ((tier === 'SILVER' || tier === 'GOLD' || tier === 'PLATINUM') && history.length > 0) {
      const recentHistory = history.slice(0, 2).map(h => `Q: ${h.question}`).join("\n");
      personalizationContext = `\nContext: ${recentHistory}`;
  }

  // Inject Randomness to prevent caching
  const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;

  const prompt = `
    ${randomSeed}
    ${userContext}
    ${personalizationContext}
    Q: "${question}"
    Cards: ${cardNames}
    FAST RESPONSE REQUIRED.
    ${getTarotStructure(lang, tier)}
  `;

  const config = {
    systemInstruction: getBaseInstruction(lang),
    temperature: 0.9, 
    maxOutputTokens: 500, // Reduced for speed
  };

  return await callGenAI(prompt, config, 'gemini-flash-lite-latest', undefined, lang);
};

export const getCompatibilityReading = async (
    myInfo: UserInfo, 
    partnerBirth: string, 
    lang: Language = 'ko'
): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;

    const prompt = `
      ${randomSeed}
      SECRET COMPATIBILITY between ${myInfo.name} (${myInfo.birthDate}) and Partner (${partnerBirth}).
      Tone: Spicy, Fast.
      [속궁합]
      [감춰진 욕망]
      [결론]
    `;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.9,
        maxOutputTokens: 500,
    };
    return await callGenAI(prompt, config, 'gemini-flash-lite-latest', undefined, lang);
};

export const getPartnerLifeReading = async (
    partnerBirth: string,
    lang: Language = 'ko'
): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;

    const prompt = `
      ${randomSeed}
      LIFE PATH for ${partnerBirth}.
      Sections:
      1. [초년]
      2. [중년]
      3. [노년]
      Tone: Mysterious, Fast.
    `;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.8,
        maxOutputTokens: 500, 
    };
    return await callGenAI(prompt, config, 'gemini-flash-lite-latest', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;

    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    const prompt = `
      ${randomSeed}
      Physiognomy Analysis.
      Tone: Cynical, Fast.
      Result: Personality & Fortune.
    `;
    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { 
        systemInstruction: getBaseInstruction(lang), 
        temperature: 0.7, 
        maxOutputTokens: 500,
    };
    return await callGenAI(prompt, config, 'gemini-flash-lite-latest', [imagePart], lang);
};

export const getLifeReading = async (userInfo: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;

    const prompt = `
      ${randomSeed}
      Saju for ${userInfo.name}, ${userInfo.birthDate} ${userInfo.birthTime}.
      Content: Wealth, Talent, Spouse.
      Tone: Fast, Direct.
    `;
    const config = { 
        systemInstruction: getBaseInstruction(lang), 
        temperature: 0.8, 
        maxOutputTokens: 600, 
    };
    return await callGenAI(prompt, config, 'gemini-flash-lite-latest', undefined, lang);
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
