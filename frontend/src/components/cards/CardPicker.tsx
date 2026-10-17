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

export const CardPicker: React.FC<CardPickerProps> = ({
  selectedCardIds,
  onToggleCard,
  bannedCardIds = new Set(),
  cardCooldowns = new Map(),
  maxSelection = 8,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [selectedElixir, setSelectedElixir] = useState<number | 'All'>('All');

  const rarities = ['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Champion'];
  const elixirs: (number | 'All')[] = ['All', 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const filteredCards = useMemo(() => {
    return CLASH_ROYALE_CARDS.filter((card) => {
      // Search filter
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
      // Rarity filter
      const matchesRarity = selectedRarity === 'All' || card.rarity === selectedRarity;
      // Elixir filter
      const matchesElixir = selectedElixir === 'All' || card.elixir_cost === selectedElixir;

      return matchesSearch && matchesRarity && matchesElixir;
    });
  }, [searchTerm, selectedRarity, selectedElixir]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search card name..."
            className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Rarity Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
          {rarities.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRarity(r)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                selectedRarity === r
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Elixir Filter Quick Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/60 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1 mr-2">
          <Droplets className="w-3 h-3 fill-purple-400" />
          Cost:
        </span>
        {elixirs.map((cost) => (
          <button
            key={String(cost)}
            onClick={() => setSelectedElixir(cost)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              selectedElixir === cost
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-700'
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
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No cards found matching your search and filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
