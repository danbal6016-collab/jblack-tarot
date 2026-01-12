import React, { useEffect, useRef, useState } from 'react';

// MYSTICAL & DREAMY BGM PLAYLIST
// Reliable Direct MP3 Links
const BGM_PLAYLIST = [
  // "Fluidscape" - Very dreamy, water-like, mystical (Kevin MacLeod)
  "https://ia800301.us.archive.org/5/items/Fluidscape/Fluidscape.mp3",
  // "Angel Share" - Ethereal, harp-like, soft
  "https://ia800305.us.archive.org/30/items/AngelShare/AngelShare.mp3",
  // "Clean Soul" - Simple, emotional, moving
  "https://ia800309.us.archive.org/5/items/CleanSoul/CleanSoul.mp3",
  // "Meditation Impromptu" - Calm, soothing, deep
  "https://ia600303.us.archive.org/29/items/MeditationImpromptu01/MeditationImpromptu01.mp3"
];

interface AudioPlayerProps {
  volume: number;
  userStopped: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ volume, userStopped }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const handlePlayError = (err: any) => {
    if (!isMountedRef.current) return;
    
    // Ignore AbortError (happens when pausing/unloading while loading)
    if (err.name === 'AbortError') return;
    
    // Auto-play policy error
    if (err.name === 'NotAllowedError') {
      console.log("Autoplay blocked. Waiting for interaction...");
      const unlockAudio = () => {
        if (!isMountedRef.current) {
          removeListeners();
          return;
        }
        
        const audio = audioRef.current;
        if (audio && !userStopped) {
          audio.play().catch(e => {
            if (e.name !== 'AbortError') console.warn("Unlock play failed:", e);
          });
        }
        removeListeners();
      };

      const removeListeners = () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      
      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
    } else {
      console.warn("Audio playback error:", err);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Update volume
    audio.volume = volume;

    if (!userStopped) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
          })
          .catch(handlePlayError);
      }
    } else {
      audio.pause();
    }
    
    return () => {
       if (isMountedRef.current === false && audio) {
         audio.pause(); 
       }
    };
  }, [volume, userStopped, currentTrackIndex]);

  const handleTrackEnd = () => {
    if (!isMountedRef.current) return;
    setCurrentTrackIndex((prev) => (prev + 1) % BGM_PLAYLIST.length);
  };

  const handleError = (e: any) => {
    if (!isMountedRef.current) return;
    console.warn(`Track ${currentTrackIndex} failed to load. Skipping.`, e);
    // Prevent infinite rapid loops if all fail
    setTimeout(() => {
        if(isMountedRef.current) setCurrentTrackIndex((prev) => (prev + 1) % BGM_PLAYLIST.length);
    }, 1000);
  };

  return (
    <audio 
      ref={audioRef} 
      src={BGM_PLAYLIST[currentTrackIndex]} 
      onEnded={handleTrackEnd}
      onError={handleError}
      loop={false} 
      playsInline
      preload="auto"
    />
  );
};

export default AudioPlayer;