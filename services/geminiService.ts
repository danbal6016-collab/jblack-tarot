
import { GoogleGenAI } from "@google/genai";
import { TarotCard, UserInfo, Language, ReadingResult } from "../types";

// ---------------------------------------------------------------------------
// BLACK TAROT PERSONA CONFIGURATION
// ---------------------------------------------------------------------------

const getBaseInstruction = (lang: Language) => {
    if (lang === 'en') {
        return `
[SYSTEM: PERSONA ACTIVATED]
You are a BRUTALLY HONEST, SHARP-TONGUED, and DIRECT fortune teller.
Output must be in ENGLISH.
Your tone is "Savage Truth-Teller" - no sugarcoating, just raw facts.
Don't be rude just to be rude, but do not hide harsh truths. "Fact-bombing" style.

IMPORTANT ADJUSTMENT:
- ANSWER THE USER'S QUESTION DIRECTLY.
- Be helpful but cut the fluff.
- Use modern, sharp language.
- ENSURE THE RESPONSE IS COMPLETE. Do not cut off mid-sentence.

STRICT RULES:
1. NO EMOJIS in main text (unless necessary for context).
2. NO INTROS/OUTROS.
3. BE INSIGHTFUL.
4. ABSOLUTELY NO ASTERISKS (*) OR MARKDOWN BOLDING.
5. This is for ENTERTAINMENT PURPOSES ONLY.
6. **NEVER** MENTION "SAJU", "FOUR PILLARS", "ELEMENTS" (Fire, Water, etc used in a technical way), OR "DAY MASTER" DIRECTLY IN THE OUTPUT. USE NATURAL LANGUAGE INSTADS (e.g., "Your innate nature", "You were born with...").
`;
    }
    return `
[SYSTEM: PERSONA ACTIVATED]
You are a HONEST, INSIGHTFUL, and DIRECT fortune teller.
Output must be CONCISE and CLEAR.
Use Korean Honorifics (존댓말) appropriately.
Your tone is "Cool & Objective" - telling the truth without sugarcoating like a "Fact-bombing" style, but NOT aggressive or rude.

IMPORTANT ADJUSTMENT:
- ANSWER THE USER'S QUESTION DIRECTLY. Do not beat around the bush.
- Be helpful and constructive.
- Be professional and mystical.
- Use appropriate slang. Use clear, modern language.
- ENSURE THE RESPONSE IS COMPLETE. Do not cut off mid-sentence.

STRICT RULES:
1. NO EMOJIS in main text (unless strictly necessary for context).
2. NO INTROS/OUTROS.
3. BE HELPFUL & INSIGHTFUL.
4. ABSOLUTELY NO ASTERISKS (*) OR MARKDOWN BOLDING. Do not use * ever.
5. This is for ENTERTAINMENT PURPOSES ONLY.
6. **절대 금지사항**: 결과 텍스트에 "사주", "사주팔자", "일주", "오행", "화기운", "수기운" 등 **사주 명리학 전문 용어**를 절대 직접적으로 언급하지 마세요.
7. 사주 분석 내용은 "타고난 기질", "운의 흐름", "본능적인 성향" 등 자연스러운 일상 용어로 완벽하게 번역하여 표현하세요.
`;
};

const getTarotStructure = (lang: Language, tier: string = 'BRONZE') => {
    if (lang === 'en') {
        return `
FORMAT:
[Analysis]
(6 sentences. Analyze the situation clearly. Focus on the direct answer to the question based on the cards.)

[One-Line Advice]
(1 punchy, savage but helpful sentence. A clear direction for the user.)

[Practical Solutions]
1. (Write the most realistic, grounded solution here. Do NOT use brackets like [Realistic Solution]. Just start with content.)
(Write AT LEAST 6 sentences. Be grounded, practical, and realistic. Focus on actual steps to take.)

2. (Write the most effective, fast solution here. Do NOT use brackets like [Fastest Solution]. Just start with content.)
(Write AT LEAST 6 sentences. Provide the most efficient, fastest way to solve the problem.)

3. (Write a creative but logical solution here. Do NOT use brackets like [Alternative Solution]. Just start with content.)
(Write AT LEAST 6 sentences. Give a creative or alternative perspective that makes sense.)
`;
    }
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

// Prioritize stability. Use the most stable and fast models first.
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
            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, i) + Math.random() * 500;
            await wait(delay);
        }
    }
    throw lastError;
}

// Global Timeout Wrapper
async function callGenAI(prompt: string, baseConfig: any, preferredModel: string = 'gemini-2.5-flash', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    // Increased Global Timeout to 200 seconds to be safe
    const GLOBAL_TIMEOUT = 200000; 

    const generationTask = async () => {
        // Construct the chain: Preferred -> Fallbacks
        const chain = [preferredModel, ...MODELS_TO_TRY].filter((v, i, a) => a.indexOf(v) === i);

        // Increase max tokens per request to ensure completeness
        const config = { ...baseConfig, safetySettings: SAFETY_SETTINGS };
        if (!config.maxOutputTokens) config.maxOutputTokens = 8192; 
        if (config.thinkingConfig) delete config.thinkingConfig;

        for (const model of chain) {
            try {
                console.log(`Attempting generation with model: ${model}`);
                let responseText = "";
                
                // 1. Client-Side Call (SDK)
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
                        }, 2, 800); // 2 retries per model via SDK

                        if (responseText) return responseText;
                    } catch (e: any) {
                        console.warn(`Client-side SDK failed for ${model}.`, e.message);
                    }
                }

                // 2. Proxy Fallback
                try {
                    responseText = await retryOperation(async () => {
                        const body: any = { prompt, config, model };
                        if (imageParts) body.imageParts = imageParts;

                        const controller = new AbortController();
                        // CRITICAL FIX: Increased fetch timeout to 120 seconds. 
                        // Saju calculation + Tarot interpretation is complex and can be slow.
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
                    }, 3, 1000); // 3 retries per model via Proxy

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

    // The timeout race
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
      The user has provided their birth details. You MUST use this.
      Name: ${userInfo.name}
      Birthdate: ${userInfo.birthDate}
      
      CRITICAL INSTRUCTION:
      1. FIRST, **Internally** calculate the user's "Saju" (Four Pillars of Destiny) based on the birthdate ${userInfo.birthDate}. Identify their Day Master (Ilju) and dominant elements.
      2. SECOND, interpret the Tarot Cards (${cardNames}) specifically for this person's calculated destiny.
      3. Combine the Tarot meaning with their Saju energy.
      4. **STRICT PROHIBITION**: DO NOT mention "Saju", "Ilju", "Five Elements", "Fire", "Water" or any Saju technical terms in the final output.
      5. TRANSLATE Saju insights into natural personality traits (e.g., instead of "You are Fire Day Master", say "You have a passionate and explosive nature").
      `;
  }

  const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;

  const prompt = `
    ${randomSeed}
    ${userContext}
    Q: "${question}"
    Cards: ${cardNames}
    
    TASK: Provide a tarot reading based on the cards AND the user's birth energy (Saju).
    REMINDER: **NO SAJU TERMINOLOGY IN OUTPUT.**
    FAST RESPONSE REQUIRED.
    STRICTLY NO ASTERISKS (*)
    ${getTarotStructure(lang, tier)}
  `;

  const config = {
    systemInstruction: getBaseInstruction(lang),
    temperature: 0.9, 
    maxOutputTokens: 8192, 
  };

  // Use 2.5 flash for speed and reliability
  return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
};

export const getCompatibilityReading = async (
    myInfo: UserInfo, 
    partnerBirth: string, 
    lang: Language = 'ko'
): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    let prompt;
    if (lang === 'en') {
        prompt = `
          ${randomSeed}
          [DEEP COMPATIBILITY ANALYSIS]
          User: ${myInfo.name} (Born: ${myInfo.birthDate})
          Partner: Born ${partnerBirth}
          
          CRITICAL TASK:
          1. Internally calculate Saju (Day Pillars) for BOTH to understand dynamic (Harmony/Clash).
          2. Provide an 'INTENSE 19+ PHYSICAL ANALYSIS' rooted in this energy interaction.
          3. **CONSTRAINT**: DO NOT explicitly mention "Saju", "Elements", or "Pillars" in the text. 
          4. Describe the *sensation* and *chemistry* vividly instead.
          
          ROLEPLAY: Best friend gossiping.
          TONE: Explicit, spicy, brutally honest.
          STRICTLY NO ASTERISKS (*).
          MINIMUM 20 SENTENCES.
          
          Structure:
          [Physical Chemistry]
          (Bedroom chemistry description based on internal calculation.)
          
          [What are they holding back?]
          (Suppressed urges based on their nature.)
          
          [Verdict]
          (Go for it?)

          [Their Taste]
          (Preferences.)
        `;
    } else {
        prompt = `
          ${randomSeed}
          [심층 속궁합 정밀 분석]
          나: ${myInfo.name} (생년월일: ${myInfo.birthDate})
          상대방: 생년월일 ${partnerBirth}
          
          핵심 과제:
          1. 두 사람의 생년월일을 바탕으로 **내부적으로** 사주(일주, 오행)를 계산하여 실제 궁합을 파악하세요.
          2. 이 계산된 에너지를 바탕으로, 독특하고 적나라한 19금 속궁합을 묘사하세요.
          3. **절대 금지**: "사주에 따르면", "물과 불이라서", "무슨 일주라서" 같은 용어를 겉으로 드러내지 마세요.
          4. 대신 그 *느낌*과 *현상*을 구체적으로 서술하세요. (예: "서로 미친듯이 끌리지만 만나면 싸우는 에너지...")
          
          ROLEPLAY: 친한 친구(솔직한)와 비밀 이야기.
          TONE: 19금, 화끈하고, 자극적이며, 적나라하게.
          별표(*) 사용 금지.
          
          최소 20문장 이상.
          
          구조:
          [속궁합 분석]
          (에너지 충돌/조화를 바탕으로 한 신체적 궁합 묘사)
          
          [그 사람 지금 뭘 참고 있을까?]
          (본능적으로 억누르고 있는 욕망)
          
          [결론 및 조언]
          (오늘 밤 승부?)

          [그 사람의 취향]
          (은밀한 취향)
        `;
    }

    const config = { systemInstruction: getBaseInstruction(lang), temperature: 1.0, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
};

export const getPartnerLifeReading = async (partnerBirth: string, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    let prompt;
    if (lang === 'en') {
        prompt = `
          ${randomSeed}
          [DESTINY ANALYSIS MODE]
          Target Birthdate: ${partnerBirth}

          CRITICAL TASK:
          1. Internally calculate the Saju (Four Pillars) based on ${partnerBirth}.
          2. Provide a HIGHLY SPECIFIC analysis based *only* on this birthdate's energy.
          3. **CONSTRAINT**: DO NOT explicitly mention "Ilju", "Saju", "Elements", or "Pillars".
          4. Describe the personality, destiny, and fate flow naturally.

          Output Language: English.
          STRICTLY NO ASTERISKS (*).
          MINIMUM 25 SENTENCES.

          Structure:
          [Born Destiny]
          (Innate character/essence.)

          [Early Life]
          (Youth/foundation.)

          [Middle Life]
          (Prime age/career peak/struggles.)

          [Late Life]
          (Final years/reputation.)

          [Advice for Fans]
          (Strategic advice based on luck flow. No technical terms.)
        `;
    } else {
        prompt = `
          ${randomSeed}
          [운명 정밀 분석 모드]
          대상 생년월일: ${partnerBirth}

          중요 지시사항:
          1. 입력된 생년월일을 바탕으로 **내부적으로** 정확한 사주팔자(일주, 오행)를 계산하세요.
          2. 이 계산 결과를 바탕으로, 고유한 기질과 운명의 흐름을 상세하게 분석하세요.
          3. **절대 금지**: "사주에", "일주가", "오행이" 같은 단어를 결과 텍스트에 직접 쓰지 마세요.
          4. 대신 그 특징을 풀어서 설명하세요. (예: "갑자일주" -> "우두머리가 되려는 기질이 강하고...")
          5. 생년월일이 바뀌면 결과 내용도 달라져야 합니다.

          어조: 냉철하고, 예리하며, 신비로운 블랙 타로.
          절대 규칙: 별표(*) 사용 금지.
          분량: 최소 25문장 이상.

          구조:
          [타고난 팔자 (Born Destiny)]
          (타고난 그릇과 본성, 숨겨진 성격)

          [초년운 (Early Life)]
          (어린 시절, 부모운, 학업운)

          [중년운 (Middle Life)]
          (전성기, 직업, 재물, 인생의 파도)

          [말년운 (Late Life)]
          (말년의 명예, 고독, 평안함)

          [덕질 조언 (Fandom Advice)]
          (부족한 기운이나 운의 흐름에 맞춘 구체적 행동 지침. 사주 용어 없이 실질적 조언으로.)
        `;
    }

    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.8, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    
    let prompt;
    if (lang === 'en') {
        prompt = `
            ${randomSeed}
            [SYSTEM: FACE READER MODE ACTIVATED]
            Perform a 'BRUTAL PHYSIOGNOMY ANALYSIS'.
            
            TASK:
            1. **Physiognomy**: Interpret features for destiny, wealth, love.
            2. **Appearance Evaluation**: Be WITTY and slightly ROASTING. Honest but charming.
            3. **Length**: AT LEAST 20 SENTENCES.
            
            TONE: Sharp, observant, brutally honest.
            
            STRUCTURE:
            [Overall Vibe & Rating]
            (Harsh but fair rating. Wealthy face? Lonely face?)
            
            [Detailed Feature Analysis]
            (Eyes, nose, mouth. Significance in destiny?)
            
            [Charm Point]
            (Witty commentary on attractiveness.)
            
            [Destiny Advice]
            (Final verdict on life path.)
            
            STRICTLY NO ASTERISKS (*).
        `;
    } else {
        prompt = `
            ${randomSeed}
            [SYSTEM: FACE READER MODE ACTIVATED]
            Perform 'KOREAN PHYSIOGNOMY (Gwansang) & DETAILED APPEARANCE EVALUATION'.
            
            TASK:
            1. **Image Detection**: Identify key facial features/expression.
            2. **Physiognomy Analysis**: Interpret eyes, nose, mouth for destiny/wealth/love.
            3. **Detailed Appearance Evaluation (얼평)**: Specific, witty, honest, engaging evaluation. Don't hold back.
            4. **Length**: AT LEAST 20 SENTENCES.
            
            TONE: Mystical yet modern. Witty, slightly cynical but insightful. Use Korean honorifics.
            
            STRUCTURE:
            [관상 및 외모 총평]
            (얼굴과 기운 맛있고 트창처럼 묘사)
            
            [이목구비 정밀 분석]
            (눈, 코, 입 정밀 분석과 운명적 의미. 예: "여우 같은 눈매", "재물이 새는 코")
            
            [매력 포인트 및 호감도]
            (외모에 대한 위트 있고 현실적인 평가. 남들이 보는 이미지.)
            
            [운명적 조언]
            (관상에 기반한 미래 조언.)
            
            STRICTLY NO ASTERISKS (*).
        `;
    }

    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.9, maxOutputTokens: 8192 };
    // Vision works best with standard flash
    return await callGenAI(prompt, config, 'gemini-2.5-flash', [imagePart], lang);
};

export const getLifeReading = async (userInfo: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    
    let prompt;
    if (lang === 'en') {
        prompt = `
            ${randomSeed} 
            [DETAILED LIFE PATH ANALYSIS]
            User: ${userInfo.name}
            Birthdate: ${userInfo.birthDate}
            Time: ${userInfo.birthTime}
            
            TASK:
            1. Internally calculate the EXACT Four Pillars based on input.
            2. Provide a brutal, realistic analysis based SOLELY on this calculation.
            3. **CONSTRAINT**: DO NOT explicitly mention "Saju", "Ilju", or "Daewoon".
            4. Describe the destiny flow, luck timing, and personality traits as direct insights.
            
            Tone: Fast, Direct, Cynical, Brutally Honest.
            MINIMUM 20 SENTENCES.
            STRICTLY NO ASTERISKS (*).

            Structure:
            [Wealth Luck: When and How?]
            (Specific timing/method based on luck flow.)

            [Genius Talent & Hidden Potential]
            (Talents from strongest energy.)

            [Golden Age of Life]
            (Exact age range of peak success.)

            [Future Spouse Detailed Analysis]
            (Height, Looks, Vibe, Occupation, Personality.)

            [Noble Person (Gui-in)]
            (Key person characteristics.)

            [Innate Personality & Nature]
            (Deep dive into true self.)

            [Cautionary Points]
            (Critical advice based on risks.)
        `;
    } else {
        prompt = `
            ${randomSeed} 
            [인생 정밀 분석 모드]
            이름: ${userInfo.name}
            생년월일: ${userInfo.birthDate}
            태어난 시간: ${userInfo.birthTime}
            
            지시사항:
            1. 위 정보를 바탕으로 **내부적으로** 정확한 사주팔자(년/월/일/시주)를 계산하세요.
            2. 이 계산된 운명을 바탕으로 날카로운 독설과 조언을 하세요.
            3. **절대 금지**: "사주에 따르면", "무슨 일주라서", "대운이" 같은 사주 용어를 직접적으로 쓰지 마세요.
            4. 대신 운명의 흐름을 이야기하듯 자연스럽게 서술하세요. (예: "30대 중반에 큰 물이 들어오듯 기회가...")
            5. 절대 별표(*)를 쓰지 마세요.
            
            분량: 최소 20문장 이상.

            구조:
            [재물운]
            (언제, 무엇으로 떼돈을 버는지 구체적인 시기와 수단 분석 및 재물운 흐름 분석)

            [천재적 재능과 숨겨진 잠재력]
            (가장 발달한 기운을 바탕으로 한 무기)

            [인생의 황금기]
            (운의 흐름이 가장 좋을 때의 나이대)

            [미래 배우자 상세 분석]
            (능력, 키, 직업, 얼굴, 몸, 성격 묘사)

            [내 인생의 귀인]
            (나에게 필요한 기운을 가진 사람의 특징)

            [타고난 성격과 성향]
            (깊은 내면 파헤치기)

            [인생에서 주의해야 할 점]
            (조심해야 할 사고, 사람, 시기)
        `;
    }

    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.8, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
};

// NEW: Monthly Mind Receipt Analysis
export const getMonthlyAnalysis = async (history: ReadingResult[], lang: Language = 'ko'): Promise<string> => {
    // Extract recent questions
    const recentQuestions = history.slice(0, 20).map(h => h.question).join("\n");
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;

    const prompt = `
        ${randomSeed}
        [MONTHLY MIND RECEIPT GENERATION]
        
        Analyze the following list of the user's questions from this month:
        ${recentQuestions}

        TASK:
        1. Identify the Top 3 most frequent keywords or themes.
        2. Analyze the user's current mental state based on these questions (3 sentences).
        3. Provide 1 punchy, witty advice sentence.

        OUTPUT FORMAT (JSON):
        {
            "rank1": "Keyword 1",
            "rank2": "Keyword 2",
            "rank3": "Keyword 3",
            "mentalState": "Analysis...",
            "advice": "Witty Advice..."
        }
        
        Language: ${lang === 'en' ? 'English' : 'Korean'}
        Ensure JSON is valid.
    `;

    const config = { 
        responseMimeType: "application/json",
        temperature: 0.7 
    };
    
    return await callGenAI(prompt, config, 'gemini-2.5-flash', undefined, lang);
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
    
    // Use gemini-2.5-flash-image for reliable image generation
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            // @ts-ignore
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
