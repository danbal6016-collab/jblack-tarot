// src/lib/device.ts
export function getDeviceId(): string {
  const KEY = "tarot_device_id";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const id =
    (crypto?.randomUUID?.() ?? `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`);
  localStorage.setItem(KEY, id);
  return id;
}