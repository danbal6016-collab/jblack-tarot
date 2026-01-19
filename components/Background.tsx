
import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
      {/* Base: Radial Gradient - Purple (#3b0764) -> Dark Violet (#1c0836) -> Deep Navy (#060b1a) -> Black */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3b0764_0%,#1c0836_30%,#060b1a_60%,#000000_95%)] opacity-100" />
      
      {/* Subdued Aurora Effects - Darkened slightly to match and reduced opacity for subtle look */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[#1a0530] rounded-full blur-[120px] opacity-10 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#120324] rounded-full blur-[140px] opacity-10 animate-pulse" style={{ animationDuration: '10s' }} />
      
      {/* Stars/Dust - Subtle Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-15 mix-blend-screen" />
      
      {/* Vignette - Strong fade to true black at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(transparent_30%,#000000_90%)]" />
    </div>
  );
};

export default Background;
