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

  // Robust play attempt
  const attemptPlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    try {
      // Ensure volume is set before playing
      audio.volume = volume;
      await audio.play();
      console.log("BGM Playing:", BGM_PLAYLIST[currentTrackIndex]);
    } catch (err) {
      console.log("Autoplay blocked. Adding one-time interaction listener.");
      // Browser blocked autoplay -> wait for ANY interaction
      const enableAudio = () => {
        if (!userStopped && audio) {
             audio.play().catch(e => console.error("Play failed even after click:", e));
        }
        cleanup();
      };

      const cleanup = () => {
        window.removeEventListener('click', enableAudio);
        window.removeEventListener('touchstart', enableAudio);
        window.removeEventListener('keydown', enableAudio);
      };
      
      window.addEventListener('click', enableAudio);
      window.addEventListener('touchstart', enableAudio);
      window.addEventListener('keydown', enableAudio);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    if (!userStopped) {
      // Small timeout to allow DOM to settle
      const t = setTimeout(attemptPlay, 500);
      return () => clearTimeout(t);
    } else {
      audio.pause();
    }
  }, [volume, userStopped, currentTrackIndex]);

  const handleTrackEnd = () => {
    // Loop playlist
    setCurrentTrackIndex((prev) => (prev + 1) % BGM_PLAYLIST.length);
  };

  const handleError = () => {
    console.warn(`Track ${currentTrackIndex} failed to load. Skipping to next.`);
    setCurrentTrackIndex((prev) => (prev + 1) % BGM_PLAYLIST.length);
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