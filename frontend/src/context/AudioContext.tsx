import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export type SoundEffect = 'click' | 'toggle' | 'fanfare' | 'swoosh' | 'crown';

interface AudioContextType {
  isMuted: boolean;
  toggleSound: () => void;
  playSound: (effect?: SoundEffect) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('crl_sound_muted');
    return saved !== null ? saved === 'true' : false; // Default sound is ON
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    localStorage.setItem('crl_sound_muted', String(isMuted));
  }, [isMuted]);

  const toggleSound = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (!next) {
        // Play an immediate pleasant chime when enabling sound
        setTimeout(() => playSoundEffect('toggle'), 50);
      }
      return next;
    });
  };

  const playSoundEffect = (effect: SoundEffect = 'click') => {
    if (isMuted) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (effect === 'click') {
        // Crisp Clash Royale UI Button Click (dual frequency pop)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
      } else if (effect === 'toggle') {
        // High pitch toggle confirmation blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.05); // E5

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } else if (effect === 'crown' || effect === 'fanfare') {
        // Royal Brass / Crown Victory Chime (C - E - G - C Arpeggio)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.25);
        });
      } else if (effect === 'swoosh') {
        // Battle swoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // Audio playback silently guarded
    }
  };

  return (
    <AudioContext.Provider value={{ isMuted, toggleSound, playSound: playSoundEffect }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
};
