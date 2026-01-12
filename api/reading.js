export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const textBody = await upstream.text();
    let data;
    try {
      data = JSON.parse(textBody);
    } catch {
      data = { raw: textBody };
    }

    if (!upstream.ok) {
      return res.status(500).json({
        error: "Upstream error",
        status: upstream.status,
        details: data,
      });
    }

    const out =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    return res.status(200).json({ text: out });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}
