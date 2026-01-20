
import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language, ReadingResult } from "../types";

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

const getBaseInstruction = (lang: Language) => {
    return `
[SYSTEM: ROLEPLAY MODE ACTIVATED]
You are 'Jennie', a REALISTIC, CYNICAL, WITTY, INTERNET-ADDICTED CONSULTANT.
This is a fictional tarot reading session for entertainment purposes.
You use Korean Honorifics (존댓말) but your vocabulary is that of a heavy internet user (Twitter/Community vibe).
You are NOT a mystical fortune teller. You are a cold truth-teller.

STRICT RULES - DO NOT IGNORE:
1. NO EMOJIS ALLOWED in main text: Do not use emojis unless specified. Keep it text-only and dry.
2. NO INTROS/OUTROS: IMMEDIATELY start the analysis.
3. TONE & STYLE: Savage, Witty, Internet Slang.
4. UNIQUE READINGS: **CRITICAL** - Do not repeat generic advice. Tailor it specifically to the cards.
5. LANGUAGE: Korean (Hangul).
`;
};

const getTarotStructure = (lang: Language, tier: string = 'BRONZE') => {
    // Gold+ gets a Special Section
    const specialSection = (tier === 'GOLD' || tier === 'PLATINUM') 
        ? `\n[Jennie's Secret Tip (Gold+)]\n(Provide one extremely useful, practical, and slightly unethical or "grey area" tip to solve their problem immediately. Make it valuable.)` 
        : "";

    // Platinum gets full transparency
    const platinumNote = (tier === 'PLATINUM')
        ? `\n(PLATINUM USER: Reveal EVERYTHING. Even the parts other readers hide. Be 100% raw and unfiltered about the outcome.)`
        : "";

    return `
FORMAT:
[내용 분석]
(MINIMUM 10 SENTENCES. Analyze the reality of the situation. Be cynical and realistic. Use slang like 억까, 뇌절. Focus on the specific card meanings combined.)

[조언 한마디]
(EXACTLY ONE SENTENCE. Short, punchy, savage.)

[실질적인 해결책]
(Provide 3 numbered solutions. IMPORTANT: Do NOT write labels like "(현실적인 해결책)". Just write the number and the content.)
1. (Content: Brutally realistic solution. MINIMUM 5 SENTENCES. Be extremely detailed.)
2. (Content: The most effective way out. MINIMUM 5 SENTENCES. Be extremely detailed.)
3. (Content: Witty, funny, internet-brained approach. MINIMUM 5 SENTENCES. Be extremely detailed.)
${specialSection}
${platinumNote}
`;
};

// --- EMERGENCY FALLBACK TEXT ---
// Used when all API calls fail to prevent the UI from getting stuck.
const EMERGENCY_FALLBACK_RESPONSE = `
[내용 분석]
지금 우주의 기운이 메롱하거나, 구글 서버가 내 운명을 질투해서 답변을 막고 있어요. (혹은 사용량이 너무 많아서 잠시 쉬어야 해요). 하지만 카드가 나왔다는 건 이미 답은 정해졌다는 뜻이죠. 당신은 이미 답을 알고 있지 않나요? 지금 당신 머릿속에 떠오른 그 생각, 그게 정답입니다. 쫄지 마세요.

[조언 한마디]
시스템 오류도 운명의 일부, 잠시 후 다시 시도하는 인내심을 가지세요.

[실질적인 해결책]
1. 잠시 숨을 고르고 1분 뒤에 다시 버튼을 눌러보세요.
2. 이 화면을 캡처해서 "나 서버 터트림 ㅋㅋㅋ" 하고 자랑하세요.
3. 폰을 껐다 켜거나, 블랙 타로 개발자에게 맛있는 걸 사주라고 기도하세요.
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
// UPDATED: Use fast models.
const MODEL_FALLBACK_CHAIN = [
    'gemini-3-flash-preview', 
    'gemini-flash-latest'
];

async function retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3, // Increased default attempts
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
            // 'fetch failed' or 'network error' or 'failed to fetch'
            if (
                status === 429 || 
                status >= 500 || 
                errorMessage.includes('fetch') || 
                errorMessage.includes('network') || 
                errorMessage.includes('overloaded') ||
                errorMessage.includes('aborted')
            ) {
                // If it's the last attempt, don't wait, just throw in next iteration logic (or break)
                if (i === maxAttempts - 1) break;

                const delay = baseDelay * Math.pow(2, i); 
                console.warn(`Retry ${i+1}/${maxAttempts} after ${delay}ms due to error:`, error.message);
                await wait(delay);
                continue;
            }
            // If error is not retryable, throw
            throw error;
        }
    }
    throw lastError;
}

async function callGenAI(prompt: string, baseConfig: any, preferredModel: string = 'gemini-3-flash-preview', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    // Timeout set to 300s (was 180s). 
    // Increased to allow full 4000 token generation without premature timeout.
    const API_TIMEOUT = 300000;   
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

    // Construct model chain with preferred model first
    const chainSet = new Set([preferredModel, ...MODEL_FALLBACK_CHAIN]);
    const modelsToTry = Array.from(chainSet);

    for (const model of modelsToTry) {
        try {
            console.log(`Attempting generation with model: ${model}`);
            
            const config = { ...baseConfig, safetySettings: SAFETY_SETTINGS };
            if (!config.maxOutputTokens) config.maxOutputTokens = 4000; // Ensure max tokens for full reading

            // Clean up config for flash models
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
                    // Wrap SDK call in timeout and retry
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
                    }, 3, 500), API_TIMEOUT);

                    if (responseText) return responseText;

                } catch (e: any) {
                    console.warn(`Client-side SDK failed for ${model}. trying proxy...`, e.message);
                    if (e.message.includes("Blocked")) throw e;
                }
            }

            // 2. Proxy Fallback
            // Now wrapped in retryOperation to handle "Failed to fetch" (network blips)
            try {
                const proxyPromise = retryOperation(async () => {
                    const body: any = { prompt, config, model };
                    if (imageParts) body.imageParts = imageParts;

                    try {
                        const constEqRes = await fetch('/api/gemini', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                        });
                        
                        if (!constEqRes.ok) {
                            // If 404, it means proxy doesn't exist (local dev without vercel), do not retry
                            if (constEqRes.status === 404) {
                                throw new Error("Proxy endpoint not found (404)");
                            }
                            const errText = await constEqRes.text().catch(() => constEqRes.statusText);
                            throw new Error(`Proxy ${constEqRes.status}: ${errText}`);
                        }
                        const data = await constEqRes.json();
                        if (!data.text) throw new Error("Empty response from proxy");
                        return data.text as string;
                    } catch (fetchErr: any) {
                        // Catch network errors specifically here. 
                        // If it is 404 (thrown above), retryOperation might retry unless we change logic,
                        // but 404 usually isn't a fetch error, it's a response error.
                        // "Failed to fetch" usually means network connection issue.
                        throw new Error(`Fetch failed: ${fetchErr.message}`);
                    }
                }, 3, 500);

                return await withTimeout(proxyPromise, API_TIMEOUT);

            } catch (proxyError: any) {
                console.error(`Proxy failed for ${model}:`, proxyError);
                lastErrorMessage = proxyError.message || "Proxy Error";
                // Continue to next model in loop
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
      const recentHistory = history.slice(0, 3).map(h => `Q: ${h.question} -> A: ${h.interpretation.substring(0, 50)}...`).join("\n");
      personalizationContext = `\n[Context from User History]\n${recentHistory}\nReflect on this past for deeper context.`;
  }

  // Inject Randomness to prevent caching
  const randomSeed = `[Random Seed: ${Date.now()}-${Math.random().toString(36).substring(7)}]`;

  const prompt = `
    ${randomSeed}
    ${userContext}
    ${personalizationContext}
    Q: "${question}"
    Cards: ${cardNames}
    Be brutally honest.
    ${getTarotStructure(lang, tier)}
  `;

  const config = {
    systemInstruction: getBaseInstruction(lang),
    temperature: 0.9, 
    maxOutputTokens: 4000,
  };

  // UPDATED: Use 'gemini-3-flash-preview' for maximum speed and reliability
  return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getCompatibilityReading = async (
    myInfo: UserInfo, 
    partnerBirth: string, 
    lang: Language = 'ko'
): Promise<string> => {
    // Inject Randomness
    const randomSeed = `[Random Seed: ${Date.now()}-${Math.random().toString(36).substring(7)}]`;

    const prompt = `
      ${randomSeed}
      Analyze the SECRET SEXUAL and DEEP COMPATIBILITY between ${myInfo.name} (${myInfo.birthDate}) and Partner (${partnerBirth}).
      Tone: Intense, revealing, unhinged but fictional. Use Saju/Astrology logic but express it in a spicy way.
      Length: EXACTLY 30 lines.
      Structure:
      [속궁합 & 케미] (Detailed physical chemistry)
      [감춰진 욕망] (Hidden desires of both)
      [최종 결론] (One savage line)
    `;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.9,
        maxOutputTokens: 2000,
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getPartnerLifeReading = async (
    partnerBirth: string,
    lang: Language = 'ko'
): Promise<string> => {
    // Inject Randomness
    const randomSeed = `[Random Seed: ${Date.now()}-${Math.random().toString(36).substring(7)}]`;

    const prompt = `
      ${randomSeed}
      Analyze the LIFE PATH (Saju) of a person born on ${partnerBirth}.
      Reveal their true nature, hidden destiny, and fortune.
      Sections: 
      1. [초년기] (Early Years)
      2. [중년기] (Middle Age)
      3. [노년기] (Late Years)
      Tone: Mysterious, exposing, deep.
      Length: Detailed.
    `;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.8,
        maxOutputTokens: 4000,
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    // Inject Randomness
    const randomSeed = `[Random Seed: ${Date.now()}-${Math.random().toString(36).substring(7)}]`;

    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    const prompt = `
      ${randomSeed}
      Analyze this face based on Physiognomy (Face Reading) standards at an expert level.
      Is this person the one the user is looking for?
      Length: EXACTLY 20 lines.
      Tone: Cynical but accurate. NOT too harsh/insulting, but honest.
      Focus on personality, fortune, and relationship potential derived from facial features.
    `;
    // PART Structure for SDK
    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { 
        systemInstruction: getBaseInstruction(lang), 
        temperature: 0.7, 
        maxOutputTokens: 2000,
    };
    // Prioritize 3-flash-preview for vision tasks (multimodal support)
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', [imagePart], lang);
};

export const getLifeReading = async (userInfo: UserInfo, lang: Language = 'ko'): Promise<string> => {
    // Inject Randomness
    const randomSeed = `[Random Seed: ${Date.now()}-${Math.random().toString(36).substring(7)}]`;

    const prompt = `
      ${randomSeed}
      Analyze Saju (Four Pillars) for ${userInfo.name}, Born: ${userInfo.birthDate} at ${userInfo.birthTime || 'Unknown Time'}.
      
      Required Content (EXACTLY 50 LINES total):
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
        maxOutputTokens: 4000, 
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
