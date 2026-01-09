import React from 'react';

const Logo: React.FC<{ size?: 'small' | 'large' }> = ({ size = 'large' }) => {
  return (
    <div className={`text-center relative z-10 ${size === 'large' ? 'mb-12' : 'mb-6'}`}>
      <h1 className={`font-occult text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] ${size === 'large' ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'}`}>
        Jennie's Black Tarot
      </h1>
      <div className="w-24 h-1 bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mt-2 opacity-70"></div>
    </div>
  );
};

export default Logo;
