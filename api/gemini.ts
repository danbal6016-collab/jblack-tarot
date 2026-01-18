
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS for local dev or cross-origin usage if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, config, model, imageParts } = req.body;
    
    if (!process.env.API_KEY) {
        throw new Error("Missing API_KEY in server environment");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Construct contents: if imageParts exist, combine with prompt text
    let contents: any = prompt;
    if (imageParts && Array.isArray(imageParts)) {
        contents = { parts: [...imageParts, { text: prompt }] };
    }

    const response = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents: contents,
      config: config
    });

    return res.status(200).json({ text: response.text });
  } catch (e: any) {
    console.error("Gemini Proxy Error:", e);
    // Extract status code if available to help client retry logic (e.g. 429)
    const status = e.status || (e.response && e.response.status) || 500;
    return res.status(status).json({ error: e.message || "Internal Server Error", details: e });
  }
}