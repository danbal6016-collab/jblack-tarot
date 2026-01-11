// api/gemini.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 여기에 비밀 API 키 사용 로직이 있어야 함
  const apiKey = process.env.GEMINI_API_KEY; 
  
  // ... 로직 수행 ...

  return res.status(200).json({ result: "성공 데이터" });
}

  const data = await response.json();
  res.status(200).json(data);
}
