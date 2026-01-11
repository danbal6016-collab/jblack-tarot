import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Missing server API key" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // 🔥 Gemini REST API 직접 호출 (서버에서만)
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + key,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  res.status(200).json(data);
}
