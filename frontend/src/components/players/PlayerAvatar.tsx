import React, { useEffect, useState } from 'react';


interface PlayerAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ src, name, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const backendPath = src?.trim();
  const imageSrc = backendPath
    ? /^(https?:|data:|blob:|file:)/i.test(backendPath)
      ? backendPath
      : `/${backendPath.replace(/^\/+/, '')}`
    : undefined;

  useEffect(() => {
    setFailed(false);
  }, [imageSrc]);

  if (!imageSrc || failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className={`flex items-center justify-center bg-amber-100 text-amber-800 font-bold uppercase ${className}`}
      >
        {name.trim().charAt(0) || '?'}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
