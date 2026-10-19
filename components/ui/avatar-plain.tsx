'use client';

import { useState } from 'react';

export function AvatarPlain({ src, name, className = 'w-11 h-11' }: { src: string | null | undefined; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={`${className} rounded-full shrink-0 flex items-center justify-center text-[15px] font-bold text-white`} style={{ background: '#C8201F' }}>
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover shrink-0`}
    />
  );
}
