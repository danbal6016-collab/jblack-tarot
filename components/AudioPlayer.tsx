
import React, { useEffect, useRef, useState } from 'react';

// Playlist using reliable Archive.org links (Redirection links for stability)
const BGM_PLAYLIST = [
  "https://archive.org/download/ErikSatieGymnopedieNo1/ErikSatieGymnopedieNo1.mp3",
  "https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3",
  "https://archive.org/download/ChopinNocturneOp.9No.2/Chopin_Nocturne_Op_9_No_2.mp3"
];

interface AudioPlayerProps {
  volume: number;
  userStopped: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ volume, userStopped }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const tryPlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (hasError) return;

    try {
      await audio.play();
    } catch (error) {
      // Autoplay blocked handling
      const resumeOnInteraction = async () => {
        if (!userStopped && audio) {
          try {
            await audio.play();
          } catch (e) { /* squelch */ }
        }
        cleanupListeners();
      };

      const cleanupListeners = () => {
        window.removeEventListener('click', resumeOnInteraction);
        window.removeEventListener('keydown', resumeOnInteraction);
        window.removeEventListener('touchstart', resumeOnInteraction);
      };

      window.addEventListener('click', resumeOnInteraction);
      window.addEventListener('keydown', resumeOnInteraction);
      window.addEventListener('touchstart', resumeOnInteraction);
    }
  };

  // Effect for Play/Pause logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    if (!userStopped) {
      tryPlay();
    } else {
      audio.pause();
    }
  }, [volume, userStopped, hasError, currentTrackIndex]);

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const error = e.currentTarget.error;
    console.warn(`BGM Track ${currentTrackIndex} error:`, error?.message || "Unknown error");

    if (currentTrackIndex < BGM_PLAYLIST.length - 1) {
        const nextIndex = currentTrackIndex + 1;
        setCurrentTrackIndex(nextIndex);
    } else {
        console.error("All BGM tracks failed.");
        setHasError(true);
    }
  };

  // Invisible Audio Element
  return (
    <audio 
      ref={audioRef} 
      src={BGM_PLAYLIST[currentTrackIndex]} 
      loop 
      onError={handleError}
      crossOrigin="anonymous"
    />
  );
};

export default AudioPlayer;
