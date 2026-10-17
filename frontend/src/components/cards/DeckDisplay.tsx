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
  title = 'Deck Enregistré (8 Cartes)',
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
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-sm">
      {/* Deck Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div>
          <div className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>{title}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                isComplete
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {cards.length} / 8 Cartes
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Average Elixir Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-100 border border-purple-200 text-purple-800">
          <Droplets className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
          <span className="text-xs font-semibold">Moyenne :</span>
          <span className="text-sm font-bold text-purple-900">{avgElixir}</span>
        </div>
      </div>

      {/* Duplicate warning */}
      {isInvalidDuplicate && (
        <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Cette combinaison exacte de 8 cartes a déjà été utilisée par ce joueur dans ce tournoi.</span>
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
            className="w-16 h-22 rounded-xl border-2 border-dashed border-slate-300 bg-white/70 flex flex-col items-center justify-center text-slate-400 select-none"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">Slot {cards.length + idx + 1}</span>
            <span className="text-xs mt-0.5 text-slate-400 font-bold">+</span>
          </div>
        ))}
      </div>

      {/* Helper text */}
      <div className="mt-3 text-right">
        {isComplete ? (
          <span className="text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Deck complet et prêt
          </span>
        ) : (
          <span className="text-xs text-amber-600 font-bold">
            Sélectionnez encore {emptySlotsCount} carte{emptySlotsCount > 1 ? 's' : ''} pour compléter le deck
          </span>
        )}
      </div>
    </div>
  );
};
