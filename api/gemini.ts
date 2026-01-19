import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const TIMEOUT_MS = 15000;

// 필요할 때만 설정 (같은 도메인이면 보통 필요 없음)
const ALLOWED_ORIGINS = new Set([
  // "https://your-domain.com",
  // "http://localhost:5173",
]);

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || "";
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    // 같은 도메인 호출이면 CORS 헤더 없어도 됨.
    // cross-origin 허용 안 할 거면 아예 안 줘도 됨.
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (필요 없으면 setCors 통째로 제거해도 됨)
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ requestId, error: "Missing API_KEY in server environment" });
    }

    const { prompt, config, model, imageParts } = req.body || {};

    if (typeof prompt !== "string" || prompt.trim().length < 1) {
      return res.status(400).json({ requestId, error: "Invalid prompt" });
    }

    // 과도한 입력 방지 (원하면 조정)
    if (prompt.length > 20000) {
      return res.status(413).json({ requestId, error: "Prompt too large" });
    }

    const ai = new GoogleGenAI({ apiKey });

    // contents는 항상 parts 구조로 만드는 게 안전
    const parts: any[] = [];
    if (Array.isArray(imageParts) && imageParts.length > 0) {
      parts.push(...imageParts);
    }
    parts.push({ text: prompt });

    const safeConfig = config && typeof config === "object" ? config : {};

    console.log(JSON.stringify({
      requestId,
      model: model || DEFAULT_MODEL,
      hasImage: Array.isArray(imageParts) && imageParts.length > 0,
      promptLen: prompt.length,
      time: Date.now(),
    }));

    const response = await withTimeout(
      ai.models.generateContent({
        model: model || DEFAULT_MODEL,
        contents: { parts },
        config: safeConfig,
      }),
      TIMEOUT_MS
    );

    // response.text가 undefined일 수도 있으니 안전 처리
    const text = (response as any)?.text;
    if (!text) {
      return res.status(502).json({ requestId, error: "Empty response from model" });
    }

    return res.status(200).json({ requestId, text });
  } catch (e: any) {
    const status = e?.status || e?.response?.status || 500;
    const message = e?.message || "Internal Server Error";

    console.error(JSON.stringify({
      requestId,
      status,
      message,
      name: e?.name,
      time: Date.now(),
    }));

    // details는 절대 통째로 내려주지 마 (터질 수도 있고 노출도 위험)
    return res.status(status).json({
      requestId,
      error: message,
    });
  }
}
