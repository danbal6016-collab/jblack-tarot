
// Sound Effects Service
// Completely refreshed sound set using Google Actions Library to guarantee no "No!" hotlink voices.

const SFX_URLS = {
  // A clear paper shuffling sound (loopable)
  SHUFFLE: "https://actions.google.com/sounds/v1/office/paper_shuffling.ogg",
  
  // A clean, sharp click for UI interactions
  SELECT: "https://actions.google.com/sounds/v1/ui/button_click.ogg",  
  
  // A fast whoosh for card reveals
  REVEAL: "https://actions.google.com/sounds/v1/foley/whoosh_fast.ogg",  
  
  // A deeper swoosh for the start of shuffling
  SWOOSH: "https://actions.google.com/sounds/v1/foley/swoosh_2.ogg",
};

// Singleton for shuffle audio to allow looping control
let shuffleAudio: HTMLAudioElement | null = null;

// Preload
try {
  Object.values(SFX_URLS).forEach(url => {
    const audio = new Audio(url);
    audio.preload = 'auto';
  });
} catch(e) { /* Ignore audio support errors */ }

export const playSound = (type: 'SELECT' | 'REVEAL' | 'SWOOSH') => {
  try {
    const url = SFX_URLS[type];
    const audio = new Audio(url);
    
    // Volume adjustments for specific sounds
    if (type === 'SELECT') audio.volume = 0.5;
    if (type === 'REVEAL') audio.volume = 0.4;
    if (type === 'SWOOSH') audio.volume = 0.6; 
    
    // Play ignoring errors (user interaction requirements)
    const p = audio.play();
    if (p !== undefined) {
        p.catch(() => {});
    }
  } catch (e) {
    // Ignore
  }
};

export const playShuffleLoop = () => {
  try {
    if (!shuffleAudio) {
      shuffleAudio = new Audio(SFX_URLS.SHUFFLE);
      shuffleAudio.loop = true;
      shuffleAudio.volume = 0.7; 
    }
    
    // Check if already playing to avoid overlap
    if (shuffleAudio.paused) {
        shuffleAudio.currentTime = 0;
        const p = shuffleAudio.play();
        if (p !== undefined) {
            p.catch(() => {});
        }
    }
  } catch (e) {
    // Ignore
  }
};

export const stopShuffleLoop = () => {
  if (shuffleAudio) {
    try {
      shuffleAudio.pause();
      shuffleAudio.currentTime = 0;
    } catch (e) {
      // Ignore
    }
  }
};
