// api/gemini.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. API 키 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API Key가 설정되지 않았습니다." });
  }

  // 2. 프론트엔드에서 보낸 질문 받기 (POST 요청 본문)
  // 프론트에서 { "prompt": "안녕?" } 이렇게 보낸다고 가정
  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "질문(prompt)이 없습니다." });
  }

  try {
    // 3. Google Gemini API에 진짜 요청 보내기
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    // 4. 결과 반환
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Gemini API 오류" });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 내부 오류 발생" });
  }
}
