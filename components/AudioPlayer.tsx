

import React, { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  volume: number;
  userStopped: boolean;
  currentTrack?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ volume, userStopped, currentTrack }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Apply volume immediately
    audio.volume = volume;

    if (!userStopped && currentTrack) {
        if (audio.src !== currentTrack) {
            audio.src = currentTrack;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    setBlocked(false);
                })
                .catch(error => {
                    // Browser policy blocked autoplay
                    // We silently set blocked state to true to trigger the global listener,
                    // but we do NOT show any UI.
                    setBlocked(true);
                });
        }
    } else {
        audio.pause();
    }
  }, [volume, userStopped, currentTrack]);

  // Global unlocker: Listens for ANY user interaction to start audio seamlessly
  useEffect(() => {
    if (!blocked) return;

    const unlock = () => {
        const audio = audioRef.current;
        if (audio && !userStopped) {
            audio.play().then(() => setBlocked(false)).catch(() => {});
        }
    };

    // Capture the very first interaction anywhere on the page
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
    };
  }, [blocked, userStopped]);

  return (
    <audio 
      ref={audioRef} 
      loop 
      playsInline
      preload="auto"
    />
  );
};

export default AudioPlayer;