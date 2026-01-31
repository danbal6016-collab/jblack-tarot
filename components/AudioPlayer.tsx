
import React, { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  volume: number;
  userStopped: boolean;
  currentTrack?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ volume, userStopped, currentTrack }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  
  // Effect 1: Handle Volume Changes Instantly (No playback side effects)
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  // Effect 2: Handle Play/Pause/Track Changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
                    setBlocked(true);
                });
        }
    } else {
        audio.pause();
    }
  }, [userStopped, currentTrack]);

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
