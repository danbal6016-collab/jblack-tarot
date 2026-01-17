
import React from 'react';

const Logo: React.FC<{ size?: 'small' | 'large' }> = ({ size = 'large' }) => {
  return (
    <div className={`text-center relative z-10 ${size === 'large' ? 'mb-12' : 'mb-6'}`}>
      <h1 className={`font-occult text-gold-gradient drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] ${size === 'large' ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'}`}>
        Black Tarot
      </h1>
      <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-yellow-700 to-transparent mx-auto mt-2 opacity-70"></div>
    </div>
  );
};

export default Logo;
