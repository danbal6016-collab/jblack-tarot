import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  maxDuration: 60, 
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
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

    // Strict content formatting for SDK compatibility
    let contents: any;
    
    if (imageParts && Array.isArray(imageParts) && imageParts.length > 0) {
        contents = { parts: [...imageParts, { text: prompt }] };
    } else {
        // Always wrap text in parts to be safe with all models
        contents = { parts: [{ text: prompt }] };
    }

    // Ensure thinkingConfig is removed if present to prevent errors with models that don't support it
    const safeConfig = { ...config };
    if (safeConfig.thinkingConfig) {
        delete safeConfig.thinkingConfig;
    }

    const response = await ai.models.generateContent({
      model: model || 'gemini-flash-latest',
      contents: contents,
      config: safeConfig
    });

    return res.status(200).json({ text: response.text });
  } catch (e: any) {
    console.error("Gemini Proxy Error:", e);
    const status = e.status || (e.response && e.response.status) || 500;
    return res.status(status).json({ 
        error: e.message || "Internal Server Error", 
        details: e.toString() 
    });
  }
}