
// Sound Effects Service using Web Audio API
// Optimized for satisfying, realistic card shuffling effects.

let audioCtx: AudioContext | null = null;
let shuffleInterval: any = null;

const getCtx = () => {
  if (!audioCtx) {
    // @ts-ignore
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
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

// Simulate a crisp card snap/riffle sound using noise buffer
const playCardSnap = () => {
    try {
        const ctx = getCtx();
        if (!ctx) return;

        // Create a short burst of noise
        const bufferSize = ctx.sampleRate * 0.05; // 50ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // White noise with slight decay
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter to give it that "paper" snap quality
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000 + Math.random() * 500; // Vary slightly
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

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
        // Soft click
        createOscillator('sine', 800, 0.05, 0.05);
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

    // Play a "riffle" sound every ~70ms to simulate fast shuffling
    playCardSnap();
    shuffleInterval = setInterval(() => {
        playCardSnap();
    }, 70);
};

export const stopShuffleLoop = () => {
    if (shuffleInterval) {
        clearInterval(shuffleInterval);
        shuffleInterval = null;
    }
};
