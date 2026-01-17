
import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
      {/* Base: Purple (#3b0764) -> Darker Violet (#240a40) -> Very Dark Indigo (#0f0826) -> Black (#000000) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3b0764_0%,#240a40_25%,#0f0826_55%,#000000_85%)] opacity-100" />
      
      {/* Subdued Aurora Effects - Darkened to keep focus on black aesthetic */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[#1a0526] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#0f0420] rounded-full blur-[140px] opacity-20 animate-pulse" style={{ animationDuration: '10s' }} />
      
      {/* Stars/Dust - Subtle Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-15 mix-blend-screen" />
      
      {/* Vignette - Strong fade to true black at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(transparent_30%,#000000_90%)]" />
    </div>
  );
};

export default Background;
