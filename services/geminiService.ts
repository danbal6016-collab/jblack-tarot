// services/geminiService.ts
import type { Language, UserInfo } from "../types";

export async function getTarotReading(
  question: string,
  cards: { name: string; isReversed: boolean }[],
  userInfo: UserInfo | undefined,
  lang: Language
): Promise<string> {
  const res = await fetch("/api/tarot-reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, cards, userInfo, lang }),
  });

  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(data?.error || "tarot-reading failed");
  return data.text as string;
}

export async function generateTarotImage(cardName: string): Promise<string> {
  const seed = Math.floor(Math.random() * 1_000_000);
  const encodedName = encodeURIComponent(cardName);
  return `https://image.pollinations.ai/prompt/tarot%20card%20${encodedName}%20mystical%20dark%20fantasy%20gothic%20style%20highly%20detailed%20masterpiece%20ominous%20beautiful?width=400&height=600&nologo=true&seed=${seed}`;
}
