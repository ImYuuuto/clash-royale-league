import React from 'react';
import { Card } from '../../types/api';
import { CardItem } from './CardItem';
import { Droplets, CheckCircle2, AlertCircle } from 'lucide-react';

interface DeckDisplayProps {
  cards: Card[];
  onRemoveCard?: (cardId: number) => void;
  title?: string;
  subtitle?: string;
  isInvalidDuplicate?: boolean;
}

export const DeckDisplay: React.FC<DeckDisplayProps> = ({
  cards,
  onRemoveCard,
  title = 'Registered 8-Card Deck',
  subtitle,
  isInvalidDuplicate = false,
}) => {
  const avgElixir =
    cards.length > 0
      ? (cards.reduce((sum, c) => sum + c.elixir_cost, 0) / cards.length).toFixed(1)
      : '0.0';

  const isComplete = cards.length === 8;
  const emptySlotsCount = Math.max(0, 8 - cards.length);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Deck Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div>
          <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>{title}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                isComplete
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {cards.length} / 8 Cards
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Average Elixir Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300">
          <Droplets className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
          <span className="text-xs font-semibold">Avg:</span>
          <span className="text-sm font-bold text-white">{avgElixir}</span>
        </div>
      </div>

      {/* Duplicate warning */}
      {isInvalidDuplicate && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>This exact 8-card combination has already been used by this player in this tournament.</span>
        </div>
      )}

      {/* 8-Card Grid Slots */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
        {cards.map((card) => (
          <div key={card.id} className="flex justify-center">
            <CardItem
              card={card}
              size="sm"
              onRemove={onRemoveCard ? () => onRemoveCard(card.id) : undefined}
            />
          </div>
        ))}

        {/* Empty placeholder slots */}
        {Array.from({ length: emptySlotsCount }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="w-16 h-22 rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-900/30 flex flex-col items-center justify-center text-slate-600 select-none"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">Slot {cards.length + idx + 1}</span>
            <span className="text-xs mt-0.5 text-slate-600">+</span>
          </div>
        ))}
      </div>

      {/* Helper text */}
      <div className="mt-3 text-right">
        {isComplete ? (
          <span className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Deck complete and valid
          </span>
        ) : (
          <span className="text-xs text-amber-400 font-medium">
            Select {emptySlotsCount} more card{emptySlotsCount > 1 ? 's' : ''} to complete deck
          </span>
        )}
      </div>
    </div>
  );
};
