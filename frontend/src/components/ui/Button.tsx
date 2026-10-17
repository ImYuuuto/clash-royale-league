import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  let playSound: ((type?: any) => void) | undefined;
  try {
    const audio = useAudio();
    playSound = audio.playSound;
  } catch {
    // context optional fallback
  }

  const baseStyles =
    'inline-flex items-center justify-center font-display uppercase tracking-wider font-bold cursor-pointer transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-xl focus:outline-none';

  const variantStyles = {
    // Primary Navy Button (Matching the screenshot "Enregistrer les modifications")
    primary:
      'bg-[#0b2559] hover:bg-[#081d45] text-white shadow-sm border border-[#081d45] active:translate-y-0.5',

    // Secondary / Blue Action
    secondary:
      'bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-sm border border-[#1e40af] active:translate-y-0.5',

    // Red Danger Button
    danger:
      'bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-sm border border-[#b91c1c] active:translate-y-0.5',

    // Clean Outline / Neutral White Button
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm active:translate-y-0.5',

    // Transparent Ghost
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:translate-y-0.5',

    // Royal Gold Button
    gold:
      'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-sm border border-amber-400/40 active:translate-y-0.5',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      playSound?.('click');
    }
    onClick?.(e);
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
};
