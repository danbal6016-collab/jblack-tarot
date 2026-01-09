import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
      {/* Deep Purple Base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,#2e1065_0%,#000000_100%)] opacity-80" />
      
      {/* Aurora Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900 rounded-full blur-[120px] opacity-30 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900 rounded-full blur-[150px] opacity-20 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[80%] h-[40%] bg-fuchsia-900 rounded-full blur-[180px] opacity-20" />

      {/* Stars/Dust */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,#000000_90%)]" />
    </div>
  );
};

export default Background;
