import React, { useState, useMemo } from 'react';
import { Card } from '../../types/api';
import { CLASH_ROYALE_CARDS } from '../../data/cards';
import { CardItem } from './CardItem';
import { Search, Filter, Droplets } from 'lucide-react';

interface CardPickerProps {
  selectedCardIds: number[];
  onToggleCard: (card: Card) => void;
  bannedCardIds?: Set<number>;
  cardCooldowns?: Map<number, number>;
  maxSelection?: number;
}

const RARITY_MAP: { [key: string]: string } = {
  Toutes: 'All',
  Commune: 'Common',
  Rare: 'Rare',
  Épique: 'Epic',
  Légendaire: 'Legendary',
  Champion: 'Champion',
};

const RARITY_LABELS = ['Toutes', 'Commune', 'Rare', 'Épique', 'Légendaire', 'Champion'];
const ELIXIRS: (number | 'Tous')[] = ['Tous', 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const CardPicker: React.FC<CardPickerProps> = ({
  selectedCardIds,
  onToggleCard,
  bannedCardIds = new Set(),
  cardCooldowns = new Map(),
  maxSelection = 8,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarityLabel, setSelectedRarityLabel] = useState<string>('Toutes');
  const [selectedElixir, setSelectedElixir] = useState<number | 'Tous'>('Tous');

  const filteredCards = useMemo(() => {
    const targetRarity = RARITY_MAP[selectedRarityLabel] || 'All';
    return CLASH_ROYALE_CARDS.filter((card) => {
      // Search filter
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
      // Rarity filter
      const matchesRarity = targetRarity === 'All' || card.rarity === targetRarity;
      // Elixir filter
      const matchesElixir = selectedElixir === 'Tous' || card.elixir_cost === selectedElixir;

      return matchesSearch && matchesRarity && matchesElixir;
    });
  }, [searchTerm, selectedRarityLabel, selectedElixir]);

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une carte Clash Royale..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-semibold"
          />
        </div>

        {/* Rarity Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {RARITY_LABELS.map((label) => (
            <button
              key={label}
              onClick={() => setSelectedRarityLabel(label)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                selectedRarityLabel === label
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Elixir Filter Quick Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200/80 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1 mr-2">
          <Droplets className="w-3 h-3 fill-purple-600" />
          Élixir :
        </span>
        {ELIXIRS.map((cost) => (
          <button
            key={String(cost)}
            onClick={() => setSelectedElixir(cost)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              selectedElixir === cost
                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cost}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 max-h-[360px] overflow-y-auto p-1 pr-2">
        {filteredCards.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          const isBanned = bannedCardIds.has(card.id);
          const cooldownRemaining = cardCooldowns.get(card.id);

          return (
            <div key={card.id} className="flex justify-center">
              <CardItem
                card={card}
                size="sm"
                isSelected={isSelected}
                isBanned={isBanned}
                cooldownRemaining={cooldownRemaining}
                onClick={() => {
                  if (isSelected || selectedCardIds.length < maxSelection) {
                    onToggleCard(card);
                  }
                }}
              />
            </div>
          );
        })}
        {filteredCards.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-400 text-xs font-medium">
            Aucune carte trouvée correspondant à vos critères de recherche.
          </div>
        )}
      </div>
    </div>
  );
};
