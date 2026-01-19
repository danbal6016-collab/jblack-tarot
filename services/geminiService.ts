
import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language, ReadingResult } from "../types";

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

const getBaseInstruction = (lang: Language) => {
    return `
You are 'Jennie', a REALISTIC, CYNICAL, WITTY, INTERNET-ADDICTED CONSULTANT.
You use Korean Honorifics (존댓말) but your vocabulary is that of a heavy internet user (Twitter/Community vibe).
You are NOT a mystical fortune teller. You are a cold truth-teller.

STRICT RULES - DO NOT IGNORE:
1. NO EMOJIS ALLOWED in main text: Do not use emojis unless specified. Keep it text-only and dry.
2. NO INTROS/OUTROS: IMMEDIATELY start the analysis.
3. TONE & STYLE: Savage, Witty, Internet Slang (알빠노, 누칼협, 뇌절, 억까, 가불기, 폼 미쳤다, 능지처참, 오히려 좋아).
4. UNIQUE READINGS: Every reading must be unique.
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
(MINIMUM 10 SENTENCES. Analyze the reality of the situation. Be cynical and realistic. Use slang like 억까, 뇌절.)

[조언 한마디]
(EXACTLY ONE SENTENCE. Short, punchy, savage.)

[실질적인 해결책]
(Provide 3 numbered solutions. IMPORTANT: Do NOT write labels like "(현실적인 해결책)". Just write the number and the content.)
1. (Content: Brutally realistic solution. Min 3 sentences.)
2. (Content: The most effective way out. Min 3 sentences.)
3. (Content: Witty, funny, internet-brained approach. Min 3 sentences.)
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
// 1. Prefer strict versioned models
// 2. Fallback to 'latest' alias which is generally stable
const MODEL_FALLBACK_CHAIN = [
    'gemini-3-flash-preview',
    'gemini-2.0-flash', 
    'gemini-flash-latest'
];

async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 2000
): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const status = error.status || error.response?.status;
            const msg = error.message?.toLowerCase() || '';
            
            // Critical: If Referrer Blocked (403), do NOT retry the same way, throw immediately to trigger proxy fallback
            if (status === 403 || msg.includes('referer') || msg.includes('permission_denied')) {
                throw error; 
            }

            // Retry on rate limits (429), server errors (500+), or network issues
            if (status === 429 || status >= 500 || msg.includes('fetch') || msg.includes('network') || msg.includes('overloaded')) {
                const delay = baseDelay * Math.pow(2, i); 
                console.warn(`Retry ${i+1}/${maxRetries} after ${delay}ms due to error:`, error.message);
                await wait(delay);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

async function callGenAI(prompt: string, baseConfig: any, preferredModel: string = 'gemini-3-flash-preview', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    // Timeout set to 30s. 
    // Increased from 12s/18s to allow models enough time to generate, minimizing false failure reports.
    const API_TIMEOUT = 30000;   
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
            if (!config.maxOutputTokens) config.maxOutputTokens = 1500; 

            if (!model.includes('gemini-3') && !model.includes('gemini-2.5')) {
                if (config.thinkingConfig) delete config.thinkingConfig;
            }

            let responseText = "";
            
    

            // 2. Proxy Fallback
            // If client failed (403/Referrer) or no key, try server-side proxy
            try {
                const proxyPromise = (async () => {
                    const body: any = { prompt, config, model };
                    if (imageParts) body.imageParts = imageParts;

                    const constEqRes = await fetch('/api/gemini', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    
                    if (!constEqRes.ok) {
                        const errText = await constEqRes.text().catch(() => constEqRes.statusText);
                        throw new Error(`Proxy ${constEqRes.status}: ${errText}`);
                    }
                    const data = await constEqRes.json();
                    if (!data.text) throw new Error("Empty response from proxy");
                    return data.text as string;
                })();

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

    // If ALL models fail, return the emergency fallback text.
    // This ensures the user ALWAYS sees a result and the app doesn't hang.
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

  const prompt = `
    ${userContext}
    ${personalizationContext}
    Q: "${question}"
    Cards: ${cardNames}
    Be brutally honest.
    ${getTarotStructure(lang, tier)}
  `;

  const config = {
    systemInstruction: getBaseInstruction(lang),
    temperature: 0.8,
    maxOutputTokens: 1500, // Optimized
  };

  return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getCompatibilityReading = async (
    myInfo: UserInfo, 
    partnerBirth: string, 
    lang: Language = 'ko'
): Promise<string> => {
    const prompt = `
      Analyze the SECRET SEXUAL and DEEP COMPATIBILITY between ${myInfo.name} (${myInfo.birthDate}) and Partner (${partnerBirth}).
      Tone: Erotic, intense, revealing, unhinged. Use Saju/Astrology logic but express it in a spicy way.
      Length: EXACTLY 30 lines.
      Structure:
      [속궁합 & 케미] (Detailed physical chemistry)
      [감춰진 욕망] (Hidden desires of both)
      [최종 결론] (One savage line)
    `;
    const config = {
        systemInstruction: getBaseInstruction(lang),
        temperature: 0.9,
        maxOutputTokens: 1000,
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getPartnerLifeReading = async (
    partnerBirth: string,
    lang: Language = 'ko'
): Promise<string> => {
    const prompt = `
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
        maxOutputTokens: 1500,
    };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    const prompt = `
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
        maxOutputTokens: 800,
    };
    // Prioritize 2.5-flash-image for vision tasks
    return await callGenAI(prompt, config, 'gemini-2.5-flash-image', [imagePart], lang);
};

export const getLifeReading = async (userInfo: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const prompt = `
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
        maxOutputTokens: 1500, 
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
