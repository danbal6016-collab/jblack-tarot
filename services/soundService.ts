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
    return audioCtx;
  } catch(e) {
    console.warn("AudioContext not supported or failed to initialize", e);
    return null;
  }
};

export const initSounds = () => {
  try {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (e) {
    console.error("Audio init failed", e);
  }
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
  } catch(e) {
    // Ignore audio errors
  }
};

// Simulate a soft "swish" card sliding sound using filtered noise
// This creates a "breath" or "slide" texture
const playCardSwish = () => {
    try {
        const ctx = getCtx();
        if (!ctx) return;

        // Create a buffer of white noise
        const bufferSize = ctx.sampleRate * 0.15; // 150ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Use a Lowpass filter to cut harsh high frequencies
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime); // Start slightly bright
        filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.15); // Sweep down

        const gain = ctx.createGain();
        // Envelope: Soft attack, sustain, fade out
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05); // Peak
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15); // Release

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
    } catch (e) {}
};

export const playSound = (type: 'SELECT' | 'REVEAL' | 'SWOOSH') => {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();

  switch (type) {
    case 'SELECT':
        // Very soft click/touch
        createOscillator('sine', 350, 0.08, 0.05);
        break;
    case 'REVEAL':
        // Mystical shimmer
        createOscillator('sine', 600, 0.4, 0.1);
        setTimeout(() => createOscillator('triangle', 1200, 0.3, 0.1), 50);
        break;
    case 'SWOOSH':
        // Start shuffle loop
        playShuffleLoop();
        break;
  }
};

export const playShuffleLoop = () => {
    if (shuffleInterval) return;
    
    const ctx = getCtx();
    if(ctx && ctx.state === 'suspended') ctx.resume();

    // Play swish sound rhythmically
    playCardSwish();
    shuffleInterval = setInterval(() => {
        playCardSwish();
    }, 160); // Slower, relaxed shuffle rhythm
};

export const stopShuffleLoop = () => {
    if (shuffleInterval) {
        clearInterval(shuffleInterval);
        shuffleInterval = null;
    }
};
