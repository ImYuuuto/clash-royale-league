import React, { useState } from 'react';

export const DEFAULT_PLAYER_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

interface PlayerAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ src, name, className = '' }) => {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={!failed && src ? src : DEFAULT_PLAYER_AVATAR}
      alt={name}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
