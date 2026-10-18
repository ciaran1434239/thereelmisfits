'use client';

import { useState } from 'react';

export function CriticBadge({ src, name, className = '' }: { src: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const style = { border: '3px solid #F4F0E6' };

  if (!src || failed) {
    return (
      <span title={name} className={`${className} rounded-full flex items-center justify-center text-[13px] font-bold text-white`} style={{ ...style, background: '#C8201F' }}>
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      title={name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover`}
      style={style}
    />
  );
}
