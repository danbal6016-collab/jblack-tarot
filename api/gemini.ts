// api/gemini.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. API 키 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API Key가 서버에 설정되지 않았습니다." });
  }

  // 2. 요청 메서드 확인 (POST만 허용)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 3. 프론트엔드에서 보낸 프롬프트 받기
    // geminiService.ts에서 body: JSON.stringify({ prompt }) 로 보냈으므로 여기서 받음
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "질문 내용(prompt)이 없습니다." });
    }

    // 4. Google Gemini API 호출 (SDK 없이 fetch 사용 - 호환성 좋음)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    // 5. 결과 반환
    if (!response.ok) {
      const errorMessage = data.error?.message || "Gemini API 요청 실패";
      console.error("Gemini Error:", errorMessage);
      return res.status(response.status).json({ error: errorMessage });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
}
