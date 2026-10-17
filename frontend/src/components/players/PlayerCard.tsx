import React from 'react';
import { Player } from '../../types/player';
import { Edit2, Trash2, Trophy, Swords, Crown } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onEdit, onDelete }) => {
  const winRate =
    player.matches_played && player.matches_played > 0
      ? Math.round(((player.matches_won ?? 0) / player.matches_played) * 100)
      : 0;

  return (
    <div className="bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-md rounded-2xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 group">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={player.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
              alt={player.name}
              className="w-13 h-13 rounded-full object-cover border-2 border-slate-200 group-hover:border-amber-400 transition-colors shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full ring-2 ring-white shadow-sm">
              <Crown className="w-3 h-3 fill-slate-950" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors tracking-wide leading-tight">
              {player.name}
            </h3>
            <span className="font-mono text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mt-0.5">
              {player.player_tag}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(player)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Modifier le joueur"
            aria-label="Modifier le joueur"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(player)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Supprimer le joueur"
            aria-label="Supprimer le joueur"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span>PTS</span>
          </div>
          <div className="font-display font-black text-lg text-amber-600 mt-0.5">
            {player.points ?? 0}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-center gap-1">
            <Swords className="w-3 h-3 text-blue-600" />
            <span>MATCHS</span>
          </div>
          <div className="font-display font-bold text-lg text-slate-800 mt-0.5">
            {player.matches_won ?? 0} / {player.matches_played ?? 0}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[10px] uppercase font-bold text-slate-500">VICTOIRES</div>
          <div className="font-display font-bold text-lg text-emerald-600 mt-0.5">
            {winRate}%
          </div>
        </div>
      </div>
    </div>
  );
};
