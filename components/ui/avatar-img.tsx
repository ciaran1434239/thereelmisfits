'use client';

import { useState } from 'react';

interface AvatarImgProps {
  src: string | null | undefined;
  name: string;
  className?: string;
  fallbackClassName?: string;
}

export function AvatarImg({ src, name, className = 'w-10 h-10', fallbackClassName }: AvatarImgProps) {
  const [failed, setFailed] = useState(false);

  const fallback = (
    <div className={`${className} rounded-full bg-[#E21D1D] flex items-center justify-center text-white font-black shrink-0 border-2 border-[#C8201F] shadow-[2px_2px_0_0_#FFFFFF] ${fallbackClassName ?? ''}`}>
      <span className="text-[52%] leading-none tracking-tight">{name.charAt(0).toUpperCase()}</span>
    </div>
  );

  if (!src || failed) return fallback;

  return (
    <img
      src={src}
      alt={name}
      className={`${className} rounded-full object-cover shrink-0 border-2 border-[#C8201F] shadow-[2px_2px_0_0_#FFFFFF]`}
      onError={() => setFailed(true)}
    />
  );
}
