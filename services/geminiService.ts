
import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language, ReadingResult } from "../types";

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

const getBaseInstruction = (lang: Language) => {
    if (lang === 'zh') {
        return `
[SYSTEM: PERSONA ACTIVATED]
You are a BRUTALLY HONEST, SHARP-TONGUED, and DIRECT fortune teller.
Output MUST be entirely in CHINESE (Simplified).
Your tone is "Cool & Objective" - telling the truth without sugarcoating.
IMPORTANT: ANSWER THE USER'S QUESTION DIRECTLY.
STRICT RULES:
1. NO EMOJIS in main text.
2. NO INTROS/OUTROS.
3. ABSOLUTELY NO ASTERISKS (*) OR MARKDOWN BOLDING.
4. **NEVER** MENTION "SAJU", "FOUR PILLARS", or technical fortune terms in the output. Translate insights into natural character traits.
`;
    } else if (lang === 'en') {
        return `
[SYSTEM: PERSONA ACTIVATED]
You are a BRUTALLY HONEST, SHARP-TONGUED, and DIRECT fortune teller.
Output must be in ENGLISH.
Your tone is "Savage Truth-Teller" - no sugarcoating, just raw facts.
IMPORTANT: ANSWER THE USER'S QUESTION DIRECTLY.
STRICT RULES:
1. NO EMOJIS in main text.
2. NO INTROS/OUTROS.
3. ABSOLUTELY NO ASTERISKS (*) OR MARKDOWN BOLDING.
4. **NEVER** MENTION "SAJU", "FOUR PILLARS", OR "ELEMENTS" DIRECTLY IN THE OUTPUT.
`;
    }
    return `
[SYSTEM: PERSONA ACTIVATED]
You are a HONEST, INSIGHTFUL, and DIRECT fortune teller.
Output must be CONCISE and CLEAR in KOREAN.
Use Korean Honorifics (존댓말) appropriately.
Your tone is "Cool & Objective" - telling the truth without sugarcoating like a "Fact-bombing" style.
IMPORTANT: ANSWER THE USER'S QUESTION DIRECTLY.
STRICT RULES:
1. NO EMOJIS in main text.
2. NO INTROS/OUTROS.
3. ABSOLUTELY NO ASTERISKS (*) OR MARKDOWN BOLDING. Do not use * ever.
4. **절대 금지사항**: 결과 텍스트에 "사주", "사주팔자", "일주", "오행", "화기운", "수기운" 등 **사주 명리학 전문 용어**를 절대 직접적으로 언급하지 마세요. 자연스러운 일상 용어로 번역하세요.
`;
};

const getTarotStructure = (lang: Language, tier: string = 'BRONZE') => {
    if (lang === 'zh') {
        return `
FORMAT:
[内容分析]
(6 sentences. Analyze the situation clearly in Chinese.)

[一句话建议]
(1 punchy, helpful sentence in Chinese.)

[实际解决方案]
1. (Write the most realistic solution here. 6+ sentences in Chinese. No brackets for titles.)
2. (Write the fastest solution here. 6+ sentences in Chinese. No brackets for titles.)
3. (Write a creative solution here. 6+ sentences in Chinese. No brackets for titles.)
`;
    } else if (lang === 'en') {
        return `
FORMAT:
[Analysis]
(6 sentences. Analyze the situation clearly in English.)

[One-Line Advice]
(1 punchy, savage but helpful sentence in English.)

[Practical Solutions]
1. (Write the most realistic, grounded solution here. 6+ sentences in English. No brackets for titles.)
2. (Write the most effective, fast solution here. 6+ sentences in English. No brackets for titles.)
3. (Write a creative but logical solution here. 6+ sentences in English. No brackets for titles.)
`;
    }
    return `
FORMAT:
[내용 분석]
(6 sentences. Analyze the situation clearly. Focus on the direct answer to the question based on the cards. in Korean)

[조언 한마디]
(1 punchy, helpful sentence. A clear direction for the user. in Korean)

[실질적인 해결책]
1. (Write the most realistic, grounded solution here. 6+ sentences in Korean. No brackets for titles.)
2. (Write the most effective, fast solution here. 6+ sentences in Korean. No brackets for titles.)
3. (Write a creative but logical solution here. 6+ sentences in Korean. No brackets for titles.)
`;
};

// --- EMERGENCY FALLBACK TEXT ---
const EMERGENCY_FALLBACK_RESPONSE = `
[내용 분석]
cards are silent today...

[조언 한마디]
서버 연결 상태가 좋지 않습니다. 조금 기다린 뒤 새로고침 해 주세요.

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

const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-flash-latest'];

async function retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3, 
    baseDelay: number = 1000 
): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed:`, error.message);
            const delay = baseDelay * Math.pow(2, i) + Math.random() * 500;
            await wait(delay);
        }
    }
    throw lastError;
}

// Global Timeout Wrapper
async function callGenAI(prompt: string, baseConfig: any, preferredModel: string = 'gemini-2.5-flash', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    const GLOBAL_TIMEOUT = 200000; 

    const generationTask = async () => {
        const chain = [preferredModel, ...MODELS_TO_TRY].filter((v, i, a) => a.indexOf(v) === i);
        const config = { ...baseConfig, safetySettings: SAFETY_SETTINGS };
        if (!config.maxOutputTokens) config.maxOutputTokens = 8192; 
        if (config.thinkingConfig) delete config.thinkingConfig;

        for (const model of chain) {
            try {
                console.log(`Attempting generation with model: ${model}`);
                let responseText = "";
                
                let apiKey = '';
                try {
                    // @ts-ignore
                    if (typeof import.meta !== 'undefined' && import.meta.env) apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || '';
                } catch(e) {}
                try {
                    // @ts-ignore
                    if (!apiKey && typeof process !== 'undefined' && process.env) apiKey = process.env.API_KEY || process.env.VITE_API_KEY || '';
                } catch(e) {}

                if (apiKey) {
                    try {
                        responseText = await retryOperation(async () => {
                            const ai = new GoogleGenAI({ apiKey });
                            let contents: any = { parts: [{ text: prompt }] };
                            if (imageParts && imageParts.length > 0) contents = { parts: [...imageParts, { text: prompt }] };

                            const response = await ai.models.generateContent({
                                model: model,
                                contents: contents,
                                config: config
                            });
                            if (response.text) return response.text;
                            throw new Error("No text generated from model.");
                        }, 2, 800);

                        if (responseText) return responseText;
                    } catch (e: any) {
                        console.warn(`Client-side SDK failed for ${model}.`, e.message);
                    }
                }

                try {
                    responseText = await retryOperation(async () => {
                        const body: any = { prompt, config, model };
                        if (imageParts) body.imageParts = imageParts;

                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 120000);

                        try {
                            const constEqRes = await fetch('/api/gemini', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(body),
                                signal: controller.signal
                            });
                            clearTimeout(timeoutId);
                            
                            if (!constEqRes.ok) {
                                const errText = await constEqRes.text();
                                throw new Error(`Proxy error: ${constEqRes.status} ${errText}`);
                            }
                            
                            const data = await constEqRes.json();
                            if (!data.text) throw new Error("Empty response from proxy");
                            return data.text as string;
                        } catch (fetchErr: any) {
                            clearTimeout(timeoutId);
                            throw fetchErr;
                        }
                    }, 3, 1000);

                    if (responseText) return responseText;
                } catch (proxyError: any) {
                    console.error(`Proxy failed for ${model}:`, proxyError);
                }

            } catch (modelError: any) {
                console.warn(`Model ${model} failed fully.`);
                continue;
            }
        }
        console.error("All models failed. Returning Emergency Fallback.");
        return EMERGENCY_FALLBACK_RESPONSE;
    };

    const timeoutTask = new Promise<string>((resolve) => {
        setTimeout(() => {
            console.error("Global API Timeout. Returning fallback.");
            resolve(EMERGENCY_FALLBACK_RESPONSE);
        }, GLOBAL_TIMEOUT);
    });

    return Promise.race([generationTask(), timeoutTask]);
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
  
  let userContext = "User: Anonymous (General Reading)";
  if (userInfo) {
      userContext = `
      [MANDATORY USER ANALYSIS]
      Name: ${userInfo.name}
      Birthdate: ${userInfo.birthDate}
      CRITICAL INSTRUCTION: Calculate "Saju" internally. Do NOT explicitly mention "Saju" or technical terms in output.
      `;
  }

  const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
  const languageDirective = lang === 'zh' ? 'OUTPUT MUST BE IN CHINESE.' : lang === 'en' ? 'OUTPUT MUST BE IN ENGLISH.' : 'OUTPUT MUST BE IN KOREAN.';

  const prompt = `
    ${randomSeed}
    ${userContext}
    Q: "${question}"
    Cards: ${cardNames}
    
    TASK: Provide a tarot reading.
    ${languageDirective}
    STRICTLY NO ASTERISKS (*)
    ${getTarotStructure(lang, tier)}
  `;

  const config = {
    systemInstruction: getBaseInstruction(lang),
    temperature: 0.9, 
    maxOutputTokens: 8192, 
  };

  return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
};

export const getCompatibilityReading = async (
    myInfo: UserInfo, 
    partnerBirth: string, 
    lang: Language = 'ko'
): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    let prompt = "";
    if (lang === 'zh') {
        prompt = `
          ${randomSeed}
          [深度隐秘契合度分析]
          我: ${myInfo.name} (出生日期: ${myInfo.birthDate})
          对方出生日期: ${partnerBirth}
          
          核心任务:
          1. 根据出生日期在内部计算八字契合度。
          2. 提供露骨、火辣的19禁身体契合度分析。
          3. 绝对禁止在输出中提及“八字”、“五行”等术语。
          4. 请必须用中文回答。
          
          结构:
          [身体契合度]
          [对方隐藏的欲望]
          [最终结论]
          [对方的取向]
        `;
    } else if (lang === 'en') {
        prompt = `
          ${randomSeed}
          [DEEP COMPATIBILITY ANALYSIS]
          User: ${myInfo.name} (Born: ${myInfo.birthDate})
          Partner: Born ${partnerBirth}
          
          CRITICAL TASK:
          1. Internally calculate Saju.
          2. Provide an INTENSE 19+ PHYSICAL ANALYSIS.
          3. CONSTRAINT: DO NOT mention "Saju" or "Elements".
          4. OUTPUT MUST BE IN ENGLISH.
          
          Structure:
          [Physical Chemistry]
          [What are they holding back?]
          [Verdict]
          [Their Taste]
        `;
    } else {
        prompt = `
          ${randomSeed}
          [심층 속궁합 정밀 분석]
          나: ${myInfo.name} (생년월일: ${myInfo.birthDate})
          상대방: 생년월일 ${partnerBirth}
          
          핵심 과제:
          1. 내부적으로 사주를 계산하여 속궁합 묘사.
          2. 사주 용어 절대 금지.
          3. 한국어로 작성.
          
          구조:
          [속궁합 분석]
          [그 사람 지금 뭘 참고 있을까?]
          [결론 및 조언]
          [그 사람의 취향]
        `;
    }

    const config = { systemInstruction: getBaseInstruction(lang), temperature: 1.0, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
};

export const getPartnerLifeReading = async (partnerBirth: string, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    let prompt = "";
    if (lang === 'zh') {
        prompt = `
          ${randomSeed}
          [命运精密分析模式]
          对象出生日期: ${partnerBirth}

          重要指示:
          1. 内部计算八字。
          2. 绝对禁止使用八字专业术语。
          3. 必须用中文回答。

          结构:
          [天生宿命]
          [早年运势]
          [中年运势]
          [晚年运势]
          [给粉丝的建议]
        `;
    } else if (lang === 'en') {
        prompt = `
          ${randomSeed}
          [DESTINY ANALYSIS MODE]
          Target Birthdate: ${partnerBirth}

          CRITICAL TASK:
          1. Internally calculate Saju.
          2. NO technical terms.
          3. OUTPUT MUST BE IN ENGLISH.

          Structure:
          [Born Destiny]
          [Early Life]
          [Middle Life]
          [Late Life]
          [Advice for Fans]
        `;
    } else {
        prompt = `
          ${randomSeed}
          [운명 정밀 분석 모드]
          대상 생년월일: ${partnerBirth}

          중요 지시사항:
          1. 내부적으로 사주 계산.
          2. 사주 용어 절대 금지.
          3. 한국어로 작성.

          구조:
          [타고난 팔자 (Born Destiny)]
          [초년운 (Early Life)]
          [중년운 (Middle Life)]
          [말년운 (Late Life)]
          [덕질 조언 (Fandom Advice)]
        `;
    }

    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.8, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    
    let prompt = "";
    if (lang === 'zh') {
        prompt = `
            ${randomSeed}
            [面相与外貌综合评价]
            任务:
            1. 分析面相（财运、命运、爱情）。
            2. 评价外貌（幽默且犀利）。
            3. 必须全部用中文输出。
            
            结构:
            [总体氛围与评分]
            [五官详细分析]
            [魅力点]
            [命运建议]
        `;
    } else if (lang === 'en') {
        prompt = `
            ${randomSeed}
            [SYSTEM: FACE READER MODE ACTIVATED]
            TASK:
            1. Physiognomy analysis.
            2. Appearance Evaluation.
            3. OUTPUT MUST BE IN ENGLISH.
            
            STRUCTURE:
            [Overall Vibe & Rating]
            [Detailed Feature Analysis]
            [Charm Point]
            [Destiny Advice]
        `;
    } else {
        prompt = `
            ${randomSeed}
            [관상 및 외모 총평]
            TASK:
            1. 관상 분석.
            2. 외모 평가.
            3. 한국어로 작성.
            
            STRUCTURE:
            [관상 및 외모 총평]
            [이목구비 정밀 분석]
            [매력 포인트 및 호감도]
            [운명적 조언]
        `;
    }

    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.9, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-2.5-flash', [imagePart], lang);
};

export const getLifeReading = async (userInfo: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    let prompt = "";
    if (lang === 'zh') {
        prompt = `
            ${randomSeed} 
            [人生精密分析模式]
            名字: ${userInfo.name}
            出生日期: ${userInfo.birthDate}
            出生时间: ${userInfo.birthTime}
            
            任务:
            1. 内部计算八字。
            2. 绝对禁止使用八字术语。
            3. 必须全部用中文输出。

            结构:
            [财运]
            [天才般的才能与隐藏潜力]
            [人生的黄金期]
            [未来伴侣详细分析]
            [我生命中的贵人]
            [天生的性格与倾向]
            [人生需要注意的事项]
        `;
    } else if (lang === 'en') {
        prompt = `
            ${randomSeed} 
            [DETAILED LIFE PATH ANALYSIS]
            User: ${userInfo.name}
            Birthdate: ${userInfo.birthDate}
            Time: ${userInfo.birthTime}
            
            TASK:
            1. Internally calculate Saju.
            2. NO Saju terminology.
            3. OUTPUT MUST BE IN ENGLISH.

            Structure:
            [Wealth Luck: When and How?]
            [Genius Talent & Hidden Potential]
            [Golden Age of Life]
            [Future Spouse Detailed Analysis]
            [Noble Person (Gui-in)]
            [Innate Personality & Nature]
            [Cautionary Points]
        `;
    } else {
        prompt = `
            ${randomSeed} 
            [인생 정밀 분석 모드]
            이름: ${userInfo.name}
            생년월일: ${userInfo.birthDate}
            태어난 시간: ${userInfo.birthTime}
            
            지시사항:
            1. 내부적으로 사주 계산.
            2. 사주 용어 절대 금지.
            3. 한국어로 작성.

            구조:
            [재물운]
            [천재적 재능과 숨겨진 잠재력]
            [인생의 황금기]
            [미래 배우자 상세 분석]
            [내 인생의 귀인]
            [타고난 성격과 성향]
            [인생에서 주의해야 할 점]
        `;
    }

    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.8, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
};

