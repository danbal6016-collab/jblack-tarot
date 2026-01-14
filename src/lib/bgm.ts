// src/lib/bgm.ts
let audio: HTMLAudioElement | null = null;

const VOL_KEY = "bgm_volume"; // 0~1 저장
const DEFAULT_VOL = 0.5;

export function getBgm() {
  if (typeof window === "undefined") return null;

  if (!audio) {
    audio = new Audio("/bgm.mp3"); // 네 bgm 파일 경로로 맞춰
    audio.loop = true;

    const saved = localStorage.getItem(VOL_KEY);
    const vol = saved ? Number(saved) : DEFAULT_VOL;
    audio.volume = Number.isFinite(vol) ? clamp01(vol) : DEFAULT_VOL;
  }
  return audio;
}

export function setBgmVolume(vol01: number) {
  const a = getBgm();
  const v = clamp01(vol01);
  localStorage.setItem(VOL_KEY, String(v));
  if (a) a.volume = v;
}

export function getBgmVolume(): number {
  const saved = typeof window !== "undefined" ? localStorage.getItem(VOL_KEY) : null;
  const v = saved ? Number(saved) : DEFAULT_VOL;
  return Number.isFinite(v) ? clamp01(v) : DEFAULT_VOL;
}

export async function playBgm() {
  const a = getBgm();
  if (!a) return;
  try {
    await a.play();
  } catch {
    // 자동재생 정책 때문에 실패할 수 있음.
    // 첫 사용자 클릭 이후 playBgm() 다시 호출하면 됨.
  }
}

export function pauseBgm() {
  const a = getBgm();
  if (!a) return;
  a.pause();
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
