// src/lib/device.ts
export const getDeviceId = (): string => {
  const KEY = "tarot_device_id";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const id =
    (crypto as any)?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(KEY, id);
  return id;
};
