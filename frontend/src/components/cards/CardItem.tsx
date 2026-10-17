import React from 'react';
import { Card } from '../../types/api';
import { Lock, Droplets } from 'lucide-react';

const RARITY_COLORS: Record<Card['rarity'], { bg: string; border: string; glow: string; text: string }> = {
  Common: { bg: '#475569', border: '#94a3b8', glow: 'rgba(148,163,184,.5)', text: '#e2e8f0' },
  Rare: { bg: '#9a3412', border: '#fb923c', glow: 'rgba(251,146,60,.5)', text: '#fed7aa' },
  Epic: { bg: '#581c87', border: '#c084fc', glow: 'rgba(192,132,252,.5)', text: '#e9d5ff' },
  Legendary: { bg: '#164e63', border: '#67e8f9', glow: 'rgba(103,232,249,.5)', text: '#cffafe' },
  Champion: { bg: '#78350f', border: '#fbbf24', glow: 'rgba(251,191,36,.5)', text: '#fef3c7' },
};

interface CardItemProps {
  card: Card;
  isSelected?: boolean;
  isBanned?: boolean;
  cooldownRemaining?: number;
  onClick?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showElixir?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  isSelected = false,
  isBanned = false,
  cooldownRemaining,
  onClick,
  onRemove,
  size = 'md',
  showElixir = true,
}) => {
  const rarityStyle = RARITY_COLORS[card.rarity] || RARITY_COLORS.Common;

  const sizeClasses = {
    sm: 'w-16 h-22 text-[10px]',
    md: 'w-20 h-28 text-xs',
    lg: 'w-24 h-34 text-sm',
  };

  return (
    <div
      onClick={isBanned ? undefined : onClick}
      className={`relative group rounded-xl border transition-all duration-150 select-none overflow-hidden flex flex-col justify-between p-1.5 ${
        sizeClasses[size]
      } ${
        isBanned
          ? 'opacity-40 grayscale cursor-not-allowed bg-slate-900 border-slate-700/60'
          : isSelected
          ? 'ring-2 ring-amber-400 scale-[1.03] shadow-lg cursor-pointer'
          : 'hover:scale-[1.04] hover:shadow-md cursor-pointer'
      }`}
      style={{
        backgroundColor: isBanned ? '#0f172a' : rarityStyle.bg,
        borderColor: isBanned ? '#334155' : isSelected ? '#f59e0b' : rarityStyle.border,
        boxShadow: isSelected ? `0 0 15px ${rarityStyle.glow}` : undefined,
      }}
      title={`${card.name} (${card.rarity}, ${card.elixir_cost} Elixir)${isBanned ? ' - On Cooldown' : ''}`}
    >
      {/* Top row: Elixir Droplet & Status */}
      <div className="flex items-center justify-between w-full z-10">
        {showElixir && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-950/90 border border-purple-500/40 text-purple-300 font-bold text-[10px] shadow-sm">
            <Droplets className="w-2.5 h-2.5 text-purple-400 fill-purple-400" />
            <span>{card.elixir_cost}</span>
          </div>
        )}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-4 h-4 rounded-full bg-rose-600/90 text-white flex items-center justify-center text-[10px] font-bold hover:bg-rose-500 transition-colors ml-auto"
            title="Remove card"
          >
            ×
          </button>
        )}
      </div>

      {/* Center: Card Illustration / Avatar */}
      <div className="flex-1 flex items-center justify-center relative my-1">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-inner border"
          style={{
            borderColor: rarityStyle.border,
            color: rarityStyle.text,
            background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.95))',
          }}
        >
          {card.name.charAt(0)}
        </div>

        {/* Cooldown Lock Overlay */}
        {isBanned && (
          <div className="absolute inset-0 bg-slate-950/70 rounded-lg flex flex-col items-center justify-center text-rose-400 font-bold">
            <Lock className="w-4 h-4" />
            {cooldownRemaining !== undefined && cooldownRemaining > 0 && (
              <span className="text-[9px] mt-0.5 font-bold tracking-tight">{cooldownRemaining}M</span>
            )}
          </div>
        )}
      </div>

      {/* Bottom: Name & Rarity badge */}
      <div className="text-center z-10 w-full truncate">
        <div className="font-semibold text-slate-100 truncate tracking-tight text-[10px] leading-tight">
          {card.name}
        </div>
        <div
          className="text-[8px] font-bold uppercase tracking-wider truncate"
          style={{ color: rarityStyle.text }}
        >
          {card.rarity}
        </div>
      </div>
    </div>
  );
};
