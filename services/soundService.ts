
// Sound Effects Service using Web Audio API
// Optimized for satisfying, soft, realistic card swishing effects.

let audioCtx: AudioContext | null = null;
let shuffleInterval: any = null;

const getCtx = () => {
  try {
    if (!audioCtx) {
      // @ts-ignore
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) {
          audioCtx = new Ctor();
      }
    }
    // Always attempt resume if suspended
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch(e) {
    console.warn("AudioContext not supported", e);
    return null;
  }
};

export const initSounds = () => {
  getCtx();
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 0.1) => {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
};

// Simulate a soft "swish" card sliding sound (ASMR-like)
const playCardSwish = () => {
    try {
        const ctx = getCtx();
        if (!ctx) return;

        const bufferSize = ctx.sampleRate * 0.1; // 100ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.8; // White noise
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter for "paper" sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
    } catch (e) {}
};

export const playSound = (type: 'SELECT' | 'REVEAL' | 'SWOOSH') => {
  const ctx = getCtx();
  if (!ctx) return;

  switch (type) {
    case 'SELECT':
        createOscillator('sine', 400, 0.1, 0.05);
        break;
    case 'REVEAL':
        createOscillator('triangle', 800, 0.3, 0.1);
        break;
    case 'SWOOSH':
        playShuffleLoop();
        break;
  }
};

export const playShuffleLoop = () => {
    if (shuffleInterval) return;
    const ctx = getCtx();
    if (!ctx) return;

    // Initial play
    playCardSwish();
    // Fast, satisfying rhythm
    shuffleInterval = setInterval(() => {
        playCardSwish();
    }, 120); 
};

export const stopShuffleLoop = () => {
    if (shuffleInterval) {
        clearInterval(shuffleInterval);
        shuffleInterval = null;
    }
};
