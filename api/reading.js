export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]

        }),
      }
    );

    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: "Upstream error", details: data });

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}
