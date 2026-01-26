
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  maxDuration: 60, // Try to extend if on Pro, ignored on Hobby but good practice
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

    // Construct contents correctly for the SDK
    let contents: any;
    
    if (imageParts && Array.isArray(imageParts) && imageParts.length > 0) {
        // If images are present, we must use the { parts: [...] } structure
        // imageParts should be an array of objects like { inlineData: { ... } }
        // text prompt should be { text: string }
        contents = { parts: [...imageParts, { text: prompt }] };
    } else {
        // Simple text only
        contents = prompt;
    }

    const response = await ai.models.generateContent({
      model: model || 'gemini-flash-lite-latest',
      contents: contents,
      config: config
    });

    return res.status(200).json({ text: response.text });
  } catch (e: any) {
    console.error("Gemini Proxy Error:", e);
    // Return a valid JSON error structure so the client can parse it and retry
    const status = e.status || (e.response && e.response.status) || 500;
    return res.status(status).json({ 
        error: e.message || "Internal Server Error", 
        details: e.toString() 
    });
  }
}
