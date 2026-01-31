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
    'gemini-flash-latest'
];

async function retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3, 
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

// Global Timeout Wrapper to enforce strict 60s limit (increased from 50s)
async function callGenAI(prompt: string, baseConfig: any, preferredModel: string = 'gemini-3-flash-preview', imageParts?: any[], lang: Language = 'ko'): Promise<string> {
    const GLOBAL_TIMEOUT = 60000; // 60 seconds strict limit

    // The actual generation logic wrapped in a function
    const generationTask = async () => {
        let lastErrorMessage = "";
        const chainSet = new Set([preferredModel, ...MODEL_FALLBACK_CHAIN]);
        const modelsToTry = Array.from(chainSet);

        // Increase max tokens per request to ensure completeness
        const config = { ...baseConfig, safetySettings: SAFETY_SETTINGS };
        if (!config.maxOutputTokens) config.maxOutputTokens = 8192; // Ensure sufficient tokens
        if (config.thinkingConfig) delete config.thinkingConfig;

        for (const model of modelsToTry) {
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
                        }, 2, 500); // Fast retry

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
                        const timeoutId = setTimeout(() => controller.abort(), 50000); // 50s fetch limit

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
                    }, 2, 500);

                    if (responseText) return responseText;
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
    };

    // The timeout race
    const timeoutTask = new Promise<string>((resolve) => {
        setTimeout(() => {
            console.error("Global API Timeout (60s reached). Returning fallback to prevent stuck screen.");
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
      [USER DATA INTEGRATION]
      Name: ${userInfo.name}
      Birthdate: ${userInfo.birthDate}
      
      INSTRUCTION:
      1. **Internally** calculate the User's Saju (Four Pillars) and dominant Element (e.g., Fire, Water) based on the birthdate.
      2. Interpret the Tarot Cards (${cardNames}) *through the lens* of this user's specific energy/destiny.
      3. **CRITICAL CONSTRAINT**: Do NOT use technical Saju terms (like "Ilju", "Day Pillar", "Wood Element") in the final output.
      4. Instead, describe the *traits* naturally. (e.g., if they are Fire, talk about their "innate passion" or "tendency to burn out", not "Because you are Fire...").
      `;
  }

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
    
    let prompt;
    if (lang === 'en') {
        prompt = `
          ${randomSeed}
          [DEEP COMPATIBILITY ANALYSIS]
          User: ${myInfo.name} (Born: ${myInfo.birthDate})
          Partner: Born ${partnerBirth}
          
          CRITICAL TASK:
          1. Internally calculate Saju (Day Pillars) for BOTH people to understand their true dynamic (Harmony/Clash).
          2. Provide an 'INTENSE 19+ PHYSICAL ANALYSIS' rooted in this specific energy interaction.
          3. **CONSTRAINT**: DO NOT explicitly mention "Saju", "Elements", or "Pillars" in the text. 
          4. Describe the *sensation* and *chemistry* vividly instead of the mechanics.
          
          ROLEPLAY: You are the user's best friend (gossiping in private).
          TONE: Explicit, spicy, brutally honest, exciting. Use slang like 'OMG', 'Wild', 'Hot'.
          STRICTLY NO ASTERISKS (*).
          MINIMUM 20 SENTENCES.
          
          Structure:
          [Physical Chemistry]
          (Talk about their physical fit and bedroom chemistry explicitly. Describe the heat/cold/conflict/harmony vividly.)
          
          [What are they holding back?]
          (What urges or thoughts are they suppressing right now? Be specific about their restraint based on their hidden nature.)
          
          [Verdict]
          (Final verdict. Should you go for it tonight?)

          [Their Taste]
          (Specific preferences, styles, or types they are really into. What turns them on?)
        `;
    } else {
        prompt = `
          ${randomSeed}
          [심층 속궁합 정밀 분석]
          나: ${myInfo.name} (생년월일: ${myInfo.birthDate})
          상대방: 생년월일 ${partnerBirth}
          
          핵심 과제:
          1. 두 사람의 생년월일을 바탕으로 **내부적으로** 사주(일주, 오행)를 계산하여 실제 궁합(합/충/원진 등)을 파악하세요.
          2. 이 계산된 에너지를 바탕으로, 두 사람만이 가질 수 있는 독특하고 적나라한 19금 속궁합을 묘사하세요.
          3. **절대 금지**: "사주에 따르면", "물과 불이라서", "무슨 무슨 일주라서" 같은 사주 용어를 겉으로 드러내지 마세요.
          4. 대신 그 *느낌*과 *현상*을 구체적으로 서술하세요. (예: "서로 미친듯이 끌리지만 만나면 피 터지게 싸우는 에너지가 있어..." 등)
          
          ROLEPLAY: 친한 친구(약간 변태적이고 솔직한)와 비밀 이야기 중.
          TONE: 19금, 화끈하고, 자극적이며, 적나라하게. '얘기해줄게', '미쳤어', '완전 쩔어' 같은 말투 사용.
          별표(*) 사용 금지.
          
          최소 20문장 이상.
          
          구조:
          [속궁합 분석]
          (두 사람의 에너지 충돌이나 조화를 바탕으로 신체적 궁합을 적나라하게 묘사하세요.)
          
          [그 사람 지금 뭘 참고 있을까?]
          (상대방이 본능적으로 억누르고 있는 욕망을 꿰뚫어 보고 설명하세요.)
          
          [결론 및 조언]
          (오늘 밤 승부를 봐도 될지, 어떤 분위기가 좋은지 조언하세요.)

          [그 사람의 취향]
          (그 사람의 은밀한 성적 취향이나 이성 스타일을 구체적으로 까발리세요.)
        `;
    }

    const config = { systemInstruction: getBaseInstruction(lang), temperature: 1.0, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
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
          1. Internally calculate the Saju (Four Pillars) based on ${partnerBirth} to determine the person's true nature and destiny flow.
          2. Provide a HIGHLY SPECIFIC analysis based *only* on this birthdate's energy.
          3. **CONSTRAINT**: DO NOT explicitly mention "Ilju", "Saju", "Elements", or "Pillars".
          4. Describe the personality, destiny, and fate flow naturally as if you are seeing it directly.

          Output Language: English (Cynical, Realistic, Sharp tone).
          STRICTLY NO ASTERISKS (*).
          MINIMUM 25 SENTENCES.

          Structure:
          [Born Destiny]
          (Analyze the innate character and destiny depth based on their hidden pillars. Describe their core essence.)

          [Early Life]
          (Analyze youth and foundation.)

          [Middle Life]
          (Analyze the prime age and career peak. Mention specific struggles or successes typical for this destiny.)

          [Late Life]
          (Analyze final years and reputation.)

          [Advice for Fans]
          (Provide strategic advice for fans based on this person's luck flow. E.g., "They need warmth, so send red gifts" -> "Fill their life with passion and warmth...", imply the element without naming it.)
        `;
    } else {
        prompt = `
          ${randomSeed}
          [운명 정밀 분석 모드]
          대상 생년월일: ${partnerBirth}

          중요 지시사항:
          1. 입력된 생년월일을 바탕으로 **내부적으로** 정확한 사주팔자(일주, 오행 구성)를 계산하세요.
          2. 이 계산 결과를 바탕으로, 이 사람만의 고유한 기질과 운명의 흐름을 아주 상세하게 분석하세요.
          3. **절대 금지**: "사주에", "일주가", "오행이" 같은 단어를 결과 텍스트에 직접 쓰지 마세요.
          4. 대신 그 특징을 풀어서 설명하세요. (예: "갑자일주"라고 말하는 대신, "우두머리가 되려는 기질이 강하고 고집이 세지만..." 처럼 묘사하세요.)
          5. 생년월일이 바뀌면 결과 내용도 완전히 달라져야 합니다.

          어조: 냉철하고, 예리하며, 신비로운 블랙 타로의 어조.
          절대 규칙: 별표(*) 사용 금지.
          분량: 최소 25문장 이상 상세하게.

          구조:
          [타고난 팔자 (Born Destiny)]
          (이 사람이 타고난 그릇과 본성을 분석하세요. 겉모습 뒤에 숨겨진 진짜 성격을 꿰뚫어 보세요.)

          [초년운 (Early Life)]
          (어린 시절의 환경, 부모운, 학업운을 냉정하게 분석하세요.)

          [중년운 (Middle Life)]
          (전성기, 직업적 성취, 재물운의 흐름, 그리고 겪게 될 인생의 파도를 설명하세요.)

          [말년운 (Late Life)]
          (말년의 명예, 고독, 혹은 평안함을 예측하세요.)

          [덕질 조언 (Fandom Advice)]
          (이 사람에게 부족한 기운이나 운의 흐름에 맞춰 팬들이 해야 할 '구체적이고 전략적인' 행동 지침을 제시하세요. 사주 용어는 쓰지 말고 실질적인 조언으로 바꾸세요.)
        `;
    }

    // Slightly lower temperature for stability in long generation, remove complex configs
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.8, maxOutputTokens: 8192 };
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', undefined, lang);
};

export const getFaceReading = async (imageBase64: string, userInfo?: UserInfo, lang: Language = 'ko'): Promise<string> => {
    const randomSeed = `[ID:${Date.now().toString().slice(-4)}]`;
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    
    let prompt;
    if (lang === 'en') {
        prompt = `
            ${randomSeed}
            [SYSTEM: FACE READER MODE ACTIVATED]
            Perform a 'BRUTAL PHYSIOGNOMY ANALYSIS' on this person.
            
            TASK:
            1. **Physiognomy**: Interpret features for destiny, wealth, love.
            2. **Appearance Evaluation**: Be WITTY and slightly ROASTING. Honest but charming.
            3. **Length**: AT LEAST 20 SENTENCES.
            
            TONE:
            - Sharp, observant, brutally honest.
            
            STRUCTURE:
            [Overall Vibe & Rating]
            (Give a harsh but fair rating of the face. Is it a wealthy face? A lonely face?)
            
            [Detailed Feature Analysis]
            (Eyes, nose, mouth details. What do they signify in destiny?)
            
            [Charm Point]
            (Witty commentary on attractiveness.)
            
            [Destiny Advice]
            (Final verdict on life path based on face.)
            
            STRICTLY NO ASTERISKS (*).
        `;
    } else {
        prompt = `
            ${randomSeed}
            [SYSTEM: FACE READER MODE ACTIVATED]
            Perform a comprehensive 'KOREAN PHYSIOGNOMY (Gwansang/관상) & DETAILED APPEARANCE EVALUATION' on the person in this image.
            
            TASK:
            1. **Image Detection**: Identify the person's key facial features, expression, and vibe.
            2. **Physiognomy Analysis**: Interpret their eyes, nose, mouth, and face shape to reveal their innate destiny, wealth luck, and love luck.
            3. **Detailed Appearance Evaluation (얼평)**: Provide a very specific, witty, honest, and engaging evaluation of their looks. Don't hold back on the details. Evaluate their vibe, attractiveness, and first impression.
            4. **Length**: YOU MUST WRITE AT LEAST 20 SENTENCES. This is a hard requirement. The answer must be long and detailed.
            
            TONE:
            - Mystical yet modern.
            - Witty, slightly cynical but ultimately insightful.
            - Use Korean honorifics (존댓말).
            
            STRUCTURE:
            [관상 및 외모 총평]
            (Describe the face and general energy. Give a detailed evaluation of their looks. Is it a "wealthy" face? A "lonely" face?)
            
            [이목구비 정밀 분석]
            (Analyze specific features deeply. E.g., "Eyes like a fox," "Nose that leaks money." Explain what each feature means for their destiny.)
            
            [매력 포인트 및 호감도]
            (Witty commentary on their appearance. What makes them attractive or unique? How do others perceive them?)
            
            [운명적 조언]
            (Final verdict and advice based on their face reading regarding future success and love.)
            
            STRICTLY NO ASTERISKS (*).
        `;
    }

    const imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
    const config = { systemInstruction: getBaseInstruction(lang), temperature: 0.9, maxOutputTokens: 8192 };
    // Image generation still uses older vision model or gemini-2.5-flash if capable, but for stability sticking to what works for vision
    // gemini-2.5-flash is good for vision
    return await callGenAI(prompt, config, 'gemini-3-flash-preview', [imagePart], lang);
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
            1. Internally calculate the EXACT Four Pillars (Year, Month, Day, Hour) based on the input.
            2. Provide a brutal, realistic analysis based SOLELY on this calculation.
            3. **CONSTRAINT**: DO NOT explicitly mention "Saju", "Ilju", or "Daewoon" in the text.
            4. Describe the destiny flow, luck timing, and personality traits as direct insights.
            
            Tone: Fast, Direct, Cynical, Brutally Honest.
            MINIMUM 20 SENTENCES.
            STRICTLY NO ASTERISKS (*).

            Structure:
            [Wealth Luck: When and How?]
            (Specific timing, method of wealth accumulation based on their luck flow.)

            [Genius Talent & Hidden Potential]
            (Talents derived from their strongest energy.)

            [Golden Age of Life]
            (Exact age range of peak success.)

            [Future Spouse Detailed Analysis]
            (Height, Looks, Vibe, Occupation, Personality based on the spouse palace.)

            [Noble Person (Gui-in)]
            (Who is the key person? Describe their characteristics.)

            [Innate Personality & Nature]
            (Deep dive into their true self.)

            [Cautionary Points]
            (Critical advice based on their risks.)
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
            3. **절대 금지**: "사주에 따르면", "무슨 무슨 일주라서", "대운이" 같은 사주 용어를 직접적으로 쓰지 마세요.
            4. 대신 운명의 흐름을 이야기하듯 자연스럽게 서술하세요. (예: "30대 중반에 큰 물이 들어오듯 기회가..." 등)
            5. 절대 별표(*)를 쓰지 마세요.
            
            분량: 최소 20문장 이상.

            구조:
            [재물운: 언제, 무엇으로 떼돈을 버는가?]
            (구체적인 시기와 돈 버는 수단을 분석하세요.)

            [천재적 재능과 숨겨진 잠재력]
            (가장 발달한 기운을 바탕으로 숨겨진 무기를 설명하세요.)

            [인생의 황금기]
            (운의 흐름이 가장 좋을 때의 정확한 나이대를 예측하세요.)

            [미래 배우자 상세 분석]
            (배우자 자리의 기운을 해석하여 외모, 능력, 성격을 구체적으로 묘사하세요.)

            [내 인생의 귀인]
            (나에게 부족한 기운을 채워줄 귀인의 특징을 설명하세요.)

            [타고난 성격과 성향]
            (본인도 모르는 깊은 내면을 파헤치세요.)

            [인생에서 주의해야 할 점]
            (조심해야 할 사고, 사람, 시기를 경고하세요.)
        `;
    }

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