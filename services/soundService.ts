
// Sound Effects Service
// Using hosted assets for reliable playback

const SFX_URLS = {
  // Updated to a longer, more satisfying card shuffling/fanning sound
  SHUFFLE: "https://cdn.freesound.org/previews/240/240776_4107740-lq.mp3", 
  SELECT: "https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.m4a",  // Magical chime/click
  REVEAL: "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.m4a",  // Card flip/slide
};

// Singleton for shuffle audio to allow looping control
let shuffleAudio: HTMLAudioElement | null = null;

// Preload to cache the files in browser
Object.values(SFX_URLS).forEach(url => {
  const audio = new Audio(url);
  audio.preload = 'auto';
});

export const playSound = (type: 'SELECT' | 'REVEAL') => {
  const url = SFX_URLS[type];
  
  // Always create a new Audio instance to ensure overlapping playback works consistently
  const audio = new Audio(url);
  audio.volume = 0.5;
  
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.warn(`Sound effect '${type}' playback failed:`, error);
    });
  }
};

export const playShuffleLoop = () => {
  if (!shuffleAudio) {
    shuffleAudio = new Audio(SFX_URLS.SHUFFLE);
    shuffleAudio.loop = true; // Loop enabled
    shuffleAudio.volume = 0.8;
  }
  shuffleAudio.currentTime = 0;
  shuffleAudio.play().catch(e => console.warn("Shuffle loop failed", e));
};

export const stopShuffleLoop = () => {
  if (shuffleAudio) {
    shuffleAudio.pause();
    shuffleAudio.currentTime = 0;
  }
};
