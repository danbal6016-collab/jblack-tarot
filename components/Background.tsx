
import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
      {/* Base: Radial Gradient - Purple (#3b0764) -> Dark Violet (#1c0836) -> Deep Navy (#060b1a) -> Black */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3b0764_0%,#1c0836_30%,#060b1a_60%,#000000_95%)] opacity-100" />
      
      {/* Subdued Aurora Effects - Darkened slightly to match and reduced opacity for subtle look */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[#1a0530] rounded-full blur-[120px] opacity-10 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#120324] rounded-full blur-[140px] opacity-10 animate-pulse" style={{ animationDuration: '10s' }} />
      
      {/* Stars/Dust - Inline SVG Data URI for reliability */}
      <div className="absolute inset-0 opacity-15 mix-blend-screen" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`
      }} />
      
      {/* Vignette - Strong fade to true black at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(transparent_30%,#000000_90%)]" />
    </div>
  );
};

export default Background;
