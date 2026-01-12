export async function requestReading(prompt: string): Promise<string> {
  const r = await fetch("/api/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Reading failed");
  return data.text || "";
}
