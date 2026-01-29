import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language, ReadingResult } from "../types";

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

const getBaseInstruction = (lang: Language) => {
    return `
[SYSTEM: PERSONA ACTIVATED]
You are a MYSTERIOUS, INSIGHTFUL, and DIRECT fortune teller.
Output must be CONCISE and CLEAR.
Use Korean Honorifics (존댓말) appropriately.
Your tone is "Cool & Objective" - telling the truth without sugarcoating, but NOT aggressive or rude.

IMPORTANT ADJUSTMENT:
- ANSWER THE USER'S QUESTION DIRECTLY. Do not beat around the bush.
- Be helpful and constructive.
- Be professional and mystical.
- Avoid excessive slang. Use clear, modern language.

STRICT RULES:
1. NO EMOJIS in main text (unless strictly necessary for context).
2. NO INTROS/OUTROS.
3. BE HELPFUL & INSIGHTFUL.
4. ABSOLUTELY NO ASTERISKS (*) OR MARKDOWN BOLDING. Do not use * ever.
5. This is for ENTERTAINMENT PURPOSES ONLY.
`;
};

const getTarotStructure = (lang: Language, tier: string = 'BRONZE') => {
    return `
FORMAT:
[내용 분석]
(6 sentences. Analyze the situation clearly. Focus on the direct answer to the question based on the cards.)

[조언 한마디]
(1 punchy, helpful sentence. A clear direction for the user.)

[실질적인 해결책]
1. (Write the most realistic, grounded solution here. Do NOT use brackets like [현실적인 해결책]. Just start with content.)
(Write AT LEAST 6 sentences. Be grounded, practical, and realistic. Focus on actual steps to take.)

2. (Write the most effective, fast solution here. Do NOT use brackets like [가장 효과적인 해결책]. Just start with content.)
(Write AT LEAST 6 sentences. Provide the most efficient, fastest way to solve the problem.)

3. (Write a creative but logical solution here. Do NOT use brackets like [웃기는 해결책]. Just start with content.)
(Write AT LEAST 6 sentences. Give a creative or alternative perspective that makes sense.)
`;
};

// --- EMERGENCY FALLBACK TEXT ---
const EMERGENCY_FALLBACK_RESPONSE = `
[내용 분석]
지금은 우주의 에너지가 잠시 흐트러져 정확한 리딩을 전달하기 어렵습니다. 카드의 이미지는 당신의 무의식 속에 이미 답을 주고 있을 것입니다. 잠시 마음을 비우고 기다려주세요.

[조언 한마디]
잠시 후 다시 시도하면 더 명확한 답을 얻을 수 있습니다.

[실질적인 해결책]
1. 서버 연결 상태가 좋지 않아 답변을 불러오지 못했습니다. 가장 현실적인 방법은 1분 정도 기다린 후 새로고침을 하는 것입니다. 네트워크 환경을 확인해보세요.

2. 브라우저를 완전히 종료했다가 다시 접속해보세요. 일시적인 오류일 가능성이 높습니다.

3. 잠시 눈을 감고 질문을 마음속으로 다시 정리해보세요. 기술적인 문제는 곧 해결될 것입니다.
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

// Prioritize faster, stable models to prevent timeouts and cutoffs
const MODEL_FALLBACK_CHAIN = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-flash-latest'
];

async function retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3, // Increased attempts
    baseDelay: number = 500
): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed:`, error.message);
            // Exponential backoff
            await wait(baseDelay * Math.pow(2, i));
        }
    }
    throw lastError;
}

async function callGenAI(prompt: string, baseConfig: any, preferredModel: string = 'gemini-3-flash-preview', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    const API_TIMEOUT = 180000; // Increased to 3 minutes to handle retries and slow responses
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
            if (!config.maxOutputTokens) config.maxOutputTokens = 8192; // Increased to prevent cutoffs
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
                        
                        // SDK v1.x compatible content structure
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
                        throw new Error("No text generated from model.");
                    }, 2, 800), API_TIMEOUT);

                    if (responseText) return responseText;

                } catch (e: any) {
                    console.warn(`Client-side SDK failed for ${model}.`, e.message);
                }
            }

            // 2. Proxy Fallback
            try {
                const proxyPromise = retryOperation(async () => {
                    const body: any = { prompt, config, model };
                    if (imageParts) body.imageParts = imageParts;

                    const controller = new AbortController();
                    // Reduce client fetch timeout slightly to allow graceful error before hard cut
                    const timeoutId = setTimeout(() => controller.abort(), 175000); 

                    try {
                        const constEqRes = await fetch('/api/gemini', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body),
                            signal: controller.signal
                        });
                        
                        clearTimeout(timeoutId);

                        if (!constEqRes.ok) throw new Error(`Proxy error: ${constEqRes.status}`);
                        const data = await constEqRes.json();
                        if (!data.text) throw new Error("Empty response from proxy");
                        return data.text as string;
                    } catch (fetchErr: any) {
                        clearTimeout(timeoutId);
                        throw fetchErr;
                    }
                }, 2, 1000);

                return await withTimeout(proxyPromise, API_TIMEOUT);

            } catch (proxyError: any) {
                console.error(`Proxy failed for ${model}:`, proxyError);
                lastErrorMessage = proxyError.message;
            }

        } catch (modelError: any) {
            console.warn(`Model ${model} failed fully.`);
            continue;
        }
    }

    console.error("All models failed. Returning Emergency Fallback.");
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
  const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;

  const prompt = `
    ${randomSeed}
    ${userContext}
    Q: "${question}"
    Cards: ${cardNames}
    FAST RESPONSE REQUIRED.
    STRICTLY NO ASTERISKS (*)
    ${getTarotStructure(lang, tier)}
  `;

  const config = {
    systemInstruction: getBaseInstruction(lang),
    temperature: 0.9, 
    maxOutputTokens: 8192, 
  };

  return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getCompatibilityReading = async (
    myInfo: UserInfo, 
    partnerBirth: string, 
    lang: Language = 'ko'
): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    // 19+ Logic: Spicy Compatibility
    // Roleplay: Best friend chatting about boyfriend.
    const prompt = `
      ${randomSeed}
      Analyze 'INTENSE 19+ PHYSICAL & SAJU COMPATIBILITY' between ${myInfo.name} (${myInfo.birthDate}) and Partner (${partnerBirth}).
      
      ROLEPLAY: You are the user's best friend (a girl who is very open and a bit dirty-minded). You are gossiping in a private room.
      TONE: High-rated (19+), very spicy, arousing, explicit but friendly. Use slang like '얘기해줄게', '미쳤어', '완전 쩔어'.
      Make it feel "delicious" and exciting to read. Describe the chemistry vividly.
      
      STRICTLY NO ASTERISKS (*).
      
      MINIMUM 30 SENTENCES.
      
      Structure:
      [속궁합 분석]
      (Talk about their physical fit, energy, and bedroom chemistry explicitly and provocatively. How good is he/she?)
      
      [숨겨진 욕망]
      (What does he secretly want to do to you? What is his fetish? Be bold.)
      
      [결론 및 조언]
      (Final verdict. Should you sleep with him tonight? Best position?)
    `;
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 1.0, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getPartnerLifeReading = async (partnerBirth: string, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    // Celebrity/Partner Life Logic
    const prompt = `
      ${randomSeed}
      Analyze 'COMPLETE LIFE PATH SAJU' for birthdate: ${partnerBirth}.
      Tone: Cynical, Realistic, Sharp.
      STRICTLY NO ASTERISKS (*).
      MINIMUM 30 SENTENCES.

      Structure:
      [초년운 (Early Life)]
      (Analyze their youth, foundation, and early struggles/successes.)

      [중년운 (Middle Life)]
      (Analyze their prime years, career peak, and major turning points.)

      [말년운 (Late Life)]
      (Analyze their later years, wealth accumulation, and final reputation.)

      [덕질 조언 (Fandom Advice)]
      (How to support this person based on their destiny. What fans should know.)
    `;
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.8, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    
    // Face Reading Logic: Detailed, Witty, Physiognomy-based
    const prompt = `
        ${randomSeed}
        [SYSTEM: FACE READER MODE ACTIVATED]
        Perform a comprehensive 'KOREAN PHYSIOGNOMY (Gwansang/관상) & DESTINY ANALYSIS' on the person in this image.
        
        TASK:
        1. **Image Detection**: Identify the person's key facial features, expression, and vibe.
        2. **Physiognomy Analysis (Based on Saju principles)**: Interpret their eyes, nose, mouth, and face shape to reveal their innate destiny, wealth luck, and love luck.
        3. **Appearance Evaluation (얼평)**: Provide a witty, honest, and engaging evaluation of their looks. You can be playful and teasing, but DO NOT use overly offensive or degrading language (no harsh insults). Focus on their "charm" and "vibe".
        4. **Length**: YOU MUST WRITE AT LEAST 20 SENTENCES. This is a hard requirement.
        
        TONE:
        - Mystical yet modern.
        - Witty, slightly cynical but ultimately insightful.
        - Use Korean honorifics (존댓말).
        
        STRUCTURE:
        [인물 인식 및 관상 총평]
        (Describe the face and general energy. Is it a "wealthy" face? A "lonely" face? Connect to Saju elements.)
        
        [이목구비 정밀 분석]
        (Analyze specific features. E.g., "Eyes like a fox," "Nose that leaks money.")
        
        [매력 포인트 및 얼평]
        (Witty commentary on their appearance. What makes them attractive or unique? Be fun!)
        
        [운명적 조언]
        (Final verdict and advice based on their face reading.)
        
        STRICTLY NO ASTERISKS (*).
    `;
    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.9, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', [imagePart], lang);
};

export const getLifeReading = async (userInfo: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    // Life Reading Logic: Detailed Saju, 50 lines
    const prompt = `
        ${randomSeed} 
        Analyze 'DETAILED SAJU (Korean Astrology)' for ${userInfo.name}, Born: ${userInfo.birthDate}, Time: ${userInfo.birthTime}.
        Focus on: Wealth Timing, Hidden Talents, Golden Age, Future Spouse Details.
        Tone: Fast, Direct, Cynical, Extremely Detailed.
        MINIMUM 20 SENTENCES.
        STRICTLY NO ASTERISKS (*).

        Structure:
        [재물운: 언제 떼돈을 버는가?]
        (Specific timing, method of wealth accumulation, windfalls.)

        [숨겨진 재능과 인생 팁]
        (Talents they don't know they have. Facts they must know to succeed.)

        [인생의 황금기]
        (Exact age range of peak success and happiness.)

        [미래 배우자 상세 분석]
        (Key details: Height, Appearance/Vibe, Occupation, Personality. Be very specific.)
    `;
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.8, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
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

export const generateTarotCardImage = async (cardName: string): Promise<string> => {
    const prompt = `Mystical Tarot Card: ${cardName}. Dark fantasy style, deep purple and gold aesthetic, ethereal smoke, intricate details, 8k resolution. No text.`;
    
    // API Key retrieval (duplicated for isolation)
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

    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            // @ts-ignore - Allowing loose config for image generation
            imageConfig: {
                aspectRatio: "9:16"
            }
        }
    });

    // Extract image
    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }
    }
    throw new Error("No image generated");
};