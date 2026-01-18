
// services/soundService.ts
// Satisfying card shuffle SFX (humanized) using Web Audio API

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let comp: DynamicsCompressorNode | null = null;

let noiseBuffer: AudioBuffer | null = null;

let shuffleTimer: number | null = null;
let shuffleRunning = false;

const getCtx = () => {
  if (!audioCtx) {
    // @ts-ignore
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

const ensureGraph = () => {
  const ctx = getCtx();

  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35; // overall SFX volume baseline
  }

  if (!comp) {
    comp = ctx.createDynamicsCompressor();
    // gentle glue so repeated snaps feel “one satisfying texture”
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
  }

  // connect once
  // master -> compressor -> destination
  // (order matters: master into comp feels nicer for overall leveling)
  masterGain.disconnect();
  comp.disconnect();
  masterGain.connect(comp);
  comp.connect(ctx.destination);

  // prebuild noise buffer once
  if (!noiseBuffer) {
    const len = Math.floor(ctx.sampleRate * 0.12); // 120ms
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);

    // pink-ish noise approximation by integrating white noise a bit
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last * 0.97) + (w * 0.03);
      // slight decay envelope baked in
      const env = 1 - i / len;
      d[i] = last * env;
    }
    noiseBuffer = b;
  }

  return { ctx, masterGain, comp };
};

export const initSounds = () => {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    ensureGraph();
  } catch (e) {
    console.error("Audio init failed", e);
  }
};

// optional: let UI control SFX volume if you want
export const setSfxVolume = (v: number) => {
  // v: 0..1
  try {
    const { ctx } = ensureGraph();
    if (masterGain) {
      masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)) * 0.45, ctx.currentTime, 0.02);
    }
  } catch {}
};

const playOneShuffleGrain = (intensity = 1) => {
  try {
    const { ctx } = ensureGraph();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    // --- “paper friction” layer (noise + filters) ---
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer!;

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900 + Math.random() * 900;
    band.Q.value = 0.8 + Math.random() * 0.8;

    const hi = ctx.createBiquadFilter();
    hi.type = "highpass";
    hi.frequency.value = 180 + Math.random() * 120;

    const g = ctx.createGain();
    const t = ctx.currentTime;
    const dur = 0.06 + Math.random() * 0.04; // 60~100ms

    // fast attack, slightly longer release = “satisfying”
    const peak = (0.18 + Math.random() * 0.12) * intensity;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    // subtle stereo motion = richer texture
    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.35;

    src.connect(band);
    band.connect(hi);
    hi.connect(g);
    g.connect(pan);
    pan.connect(masterGain!);

    // --- “body thump” layer (low sine + tiny click) ---
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 90 + Math.random() * 40;

    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.12 * intensity, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    osc.connect(og);
    og.connect(masterGain!);

    src.start(t);
    src.stop(t + 0.12);

    osc.start(t);
    osc.stop(t + 0.07);
  } catch {}
};

const scheduleNext = () => {
  if (!shuffleRunning) return;

  // humanized timing: 45~120ms, with occasional “accent”
  const accent = Math.random() < 0.18;
  const intensity = accent ? 1.25 : 1.0;

  playOneShuffleGrain(intensity);

  const base = accent ? 90 : 70;
  const jitter = accent ? 60 : 45;
  const nextMs = base + Math.random() * jitter;

  shuffleTimer = window.setTimeout(scheduleNext, nextMs);
};

export const playShuffleLoop = () => {
  if (shuffleRunning) return;
  shuffleRunning = true;
  scheduleNext();
};

// --- NEW: a satisfying ending "clack" when shuffle finishes ---
const playShuffleEndClack = () => {
  try {
    const { ctx } = ensureGraph();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const t = ctx.currentTime;

    // tiny click (very short noise)
    const click = ctx.createBufferSource();
    click.buffer = noiseBuffer!;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    click.connect(hp);
    hp.connect(g);
    g.connect(masterGain!);

    // short low thump (like deck landing)
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, t);

    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.14, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(og);
    og.connect(masterGain!);

    click.start(t);
    click.stop(t + 0.03);

    osc.start(t);
    osc.stop(t + 0.08);
  } catch {}
};

// --- NEW: long, natural shuffle for a fixed duration ---
// durationMs 동안 셔플 루프를 돌리고, 끝날 때 "딱" 마감음을 넣는다.
export const playShuffleFor = (durationMs: number = 2800) => {
  playShuffleLoop();

  window.setTimeout(() => {
    stopShuffleLoop();
    playShuffleEndClack();
  }, durationMs);
};

// --- NEW: call this when you stop shuffle manually (optional helper) ---
export const stopShuffleWithClack = () => {
  stopShuffleLoop();
  playShuffleEndClack();
};


export const stopShuffleLoop = () => {
  shuffleRunning = false;
  if (shuffleTimer) {
    clearTimeout(shuffleTimer);
    shuffleTimer = null;
  }
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol = 0.1) => {
  try {
    const { ctx } = ensureGraph();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
};

export const playSound = (type: "SELECT" | "REVEAL" | "SWOOSH") => {
  try {
    const { ctx } = ensureGraph();
    if (ctx.state === "suspended") ctx.resume();

    switch (type) {
      case "SELECT":
        createOscillator("sine", 800, 0.05, 0.06);
        break;
      case "REVEAL":
        createOscillator("sine", 600, 0.35, 0.11);
        setTimeout(() => createOscillator("triangle", 1200, 0.28, 0.10), 40);
        break;
     case "SWOOSH":
  // one-shot swoosh: just 2~3 grains quickly (NOT loop)
  playOneShuffleGrain(1.0);
  setTimeout(() => playOneShuffleGrain(0.95), 40);
  setTimeout(() => playOneShuffleGrain(1.1), 85);
  break;

    }
  } catch {}
};
