
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
3. BE SAVAGE & WITTY.
4. ABSOLUTELY NO ASTERISKS (*) OR MARKDOWN BOLDING. Do not use * ever. I strictly forbid the use of *.
5. This is for ENTERTAINMENT PURPOSES ONLY.
`;
};

const getTarotStructure = (lang: Language, tier: string = 'BRONZE') => {
    const specialSection = (tier === 'GOLD' || tier === 'PLATINUM') 
        ? `\n[Jennie's Secret Tip]\n(One spicy sentence)` 
        : "";

    const platinumNote = (tier === 'PLATINUM')
        ? `\n(PLATINUM: Raw outcome)`
        : "";

    return `
FORMAT:
[내용 분석]
(5 sentences. Analyze the situation deeply.)

[조언 한마디]
(1 punchy sentence)

[실질적인 해결책]
1. (Write the most realistic, grounded solution here. Do NOT use brackets like [현실적인 해결책]. Just start with content.)
(Write AT LEAST 6 sentences. Be grounded, practical, and realistic. Focus on what can actually be done in the real world right now.)

2. (Write the most effective, fast solution here. Do NOT use brackets like [가장 효과적인 해결책]. Just start with content.)
(Write AT LEAST 6 sentences. Provide the most efficient, fastest, and direct way to solve the problem, even if it's hard.)

3. (Write a witty/funny but logical solution here. Do NOT use brackets like [웃기는 해결책]. Just start with content.)
(Write AT LEAST 6 sentences. Give a witty, sarcastic, or humorous solution that actually makes sense but is funny.)

${specialSection}
${platinumNote}
`;
};

// --- EMERGENCY FALLBACK TEXT ---
const EMERGENCY_FALLBACK_RESPONSE = `
[내용 분석]
우주의 기운이 잠시 메롱하네요. 하지만 당신은 이미 답을 알고 있지 않나요? 시스템이 잠시 멈췄지만 당신의 운명은 멈추지 않습니다. 카드는 이미 당신의 손을 떠났고, 결과는 당신의 무의식 속에 이미 자리 잡고 있습니다. 잠시 여유를 가지라는 우주의 신호일지도 모릅니다.

[조언 한마디]
시스템 오류도 운명, 잠시 후 다시 시도하세요.

[실질적인 해결책]
1. 현재 서버 연결 상태가 불안정하여 응답을 가져오지 못했습니다. 가장 현실적인 방법은 잠시 후 새로고침을 하거나 1분 정도 기다렸다가 다시 시도하는 것입니다. 와이파이나 데이터 연결 상태를 확인해보세요. 기술적인 문제는 시간이 해결해 줄 때가 많습니다. 조급해하지 말고 차 한 잔 마시며 기다려보세요. 지금은 잠시 쉬어가는 타이밍입니다.

2. 가장 빠른 방법은 브라우저를 완전히 닫았다가 다시 여는 것입니다. 캐시가 꼬였을 수도 있으니 강력 새로고침을 시도해보세요. 다른 기기로 접속해보는 것도 하나의 방법입니다. 네트워크 환경이 좋은 곳으로 이동하여 다시 시도하면 해결될 확률이 높습니다. 오류가 계속된다면 잠시 폰을 꺼두는 것도 방법입니다.

3. 개발자가 지금쯤 식은땀을 흘리며 서버를 고치고 있을 겁니다. 그에게 힘내라고 텔레파시를 보내보세요. 아니면 모니터 앞에서 '열려라 참깨'를 외쳐보는 건 어떨까요? 운명이 당신의 인내심을 테스트하고 있는 중입니다. 이 오류 화면마저도 당신의 특별한 운명 중 하나라고 생각하고 웃어넘기세요. 화내면 주름만 늘어납니다.
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
    'gemini-1.5-flash',     // Fastest and most reliable for long context
    'gemini-2.0-flash',     // Good alternative
    'gemini-flash-latest'   // Alias
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

async function callGenAI(prompt: string, baseConfig: any, preferredModel: string = 'gemini-1.5-flash', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    const API_TIMEOUT = 90000; // 90 seconds timeout
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
                    const timeoutId = setTimeout(() => controller.abort(), 85000); 

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

  return await callGenAI(prompt, config, 'gemini-1.5-flash', undefined, lang);
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
    return await callGenAI(prompt, config, 'gemini-1.5-flash', undefined, lang);
};

export const getPartnerLifeReading = async (partnerBirth: string, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    // Celebrity/Partner Life Logic
    const prompt = `
      ${randomSeed}
      Analyze 'COMPLETE LIFE PATH SAJU' for birthdate: ${partnerBirth}.
      Tone: Mysterious, Insightful, Cynical.
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
    return await callGenAI(prompt, config, 'gemini-1.5-flash', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    
    // Face Reading Logic: Updated for "Korean Gwansang" + Tasty text
    const prompt = `
        ${randomSeed}
        Perform an 'EXPERT KOREAN PHYSIOGNOMY (Gwansang/관상)' analysis on this image.
        Role: A famous, witty Korean fortune teller who speaks "deliciously" and funnily.
        Task: Analyze the Eyes, Nose, Mouth, and Face Shape specifically according to traditional Gwansang principles.
        
        TONE: Very engaging, slightly cynical but fun ("Tasty text"), practical. 
        Output must be around 20 SENTENCES long.
        STRICTLY NO ASTERISKS (*).

        Structure:
        [관상 분석]
        (Analyze specific features: Eyes (wealth/wisdom), Nose (money flow), Mouth (love/speech). Connect them to personality.)

        [운세 총평]
        (Final verdict on their life destiny - Wealth, Success, and Love based on the face.)
    `;
    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.8, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-1.5-flash', [imagePart], lang);
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
    return await callGenAI(prompt, config, 'gemini-1.5-flash', undefined, lang);
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
