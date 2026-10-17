import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { Trophy, AlertTriangle, Crown, Swords, Flame, Sparkles } from 'lucide-react';

export const StandingsPage: React.FC = () => {
  const { activeTournament, standings, loadingFixtures } = useTournament();

  const leader = standings[0];
  const hasTiebreaker = standings.some((s) => s.inTiebreaker);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#141b2b] to-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Official League Standings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tournament rankings, crown differential, and championship qualification.
            </p>
          </div>
        </div>

        {activeTournament && (
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl text-xs font-semibold text-slate-300">
            <span className="text-amber-400 uppercase tracking-wider text-[10px] font-bold">
              Tournament:
            </span>
            <span className="text-white">{activeTournament.name}</span>
          </div>
        )}
      </div>

      {/* Tiebreaker Alert Banner */}
      {hasTiebreaker && (
        <div className="bg-gradient-to-r from-amber-950/60 to-[#1b1510] border border-amber-500/40 p-4 rounded-2xl flex items-center gap-3.5 shadow-lg shadow-amber-950/20">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Championship Tiebreaker Alert</span>
            </div>
            <p className="text-xs text-amber-100/90 mt-0.5">
              Top competitors are tied for 1st place! According to active league rules, resolution mode is{' '}
              <strong className="text-white uppercase font-bold">
                {activeTournament?.tiebreaker_mode === 'bo5' ? 'Best of 5 Mini-Final' : activeTournament?.tiebreaker_mode}
              </strong>.
            </p>
          </div>
        </div>
      )}

      {/* Standings Table Card */}
      <div className="bg-[#101420] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
              Championship Table
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Win awards 3 points. Crown difference (C+ minus C-) breaks standard ties.
            </p>
          </div>

          {leader && leader.points > 0 && (
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500/15 to-transparent border border-amber-500/30 px-3.5 py-1.5 rounded-2xl">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div className="text-xs">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Leader</span>
                <span className="font-bold text-white">{leader.player_name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6 text-center w-16">Rank</th>
                <th className="py-4 px-6">Player</th>
                <th className="py-4 px-4 text-center">Played</th>
                <th className="py-4 px-4 text-center">Wins</th>
                <th className="py-4 px-4 text-center">Losses</th>
                <th className="py-4 px-4 text-center">Crowns For</th>
                <th className="py-4 px-4 text-center">Crowns Ag.</th>
                <th className="py-4 px-4 text-center">Crown Diff</th>
                <th className="py-4 px-6 text-center">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {standings.map((entry) => {
                const isFirst = entry.rank === 1 && entry.points > 0;
                const isSecond = entry.rank === 2 && entry.points > 0;
                const isThird = entry.rank === 3 && entry.points > 0;

                return (
                  <tr
                    key={entry.player_id}
                    className={`transition-colors ${
                      isFirst
                        ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-6 text-center font-display font-extrabold text-base">
                      {isFirst ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black">
                          1
                        </div>
                      ) : isSecond ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-300 text-slate-950 font-black">
                          2
                        </div>
                      ) : isThird ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-700/80 text-amber-100 font-black">
                          3
                        </div>
                      ) : (
                        <span className="text-slate-500">#{entry.rank}</span>
                      )}
                    </td>

                    {/* Player Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                          alt={entry.player_name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5 leading-tight">
                            <span>{entry.player_name}</span>
                            {isFirst && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                            {entry.inTiebreaker && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/40 uppercase font-bold tracking-wider">
                                Tied #1
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-amber-400/90 font-medium">
                            {entry.player_tag}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Played */}
                    <td className="py-4 px-4 text-center font-medium text-slate-300">
                      {entry.matches_played}
                    </td>

                    {/* Wins */}
                    <td className="py-4 px-4 text-center font-semibold text-emerald-400">
                      {entry.matches_won}
                    </td>

                    {/* Losses */}
                    <td className="py-4 px-4 text-center font-semibold text-rose-400">
                      {entry.matches_lost}
                    </td>

                    {/* Crowns For */}
                    <td className="py-4 px-4 text-center text-slate-300">
                      {entry.crowns_for}
                    </td>

                    {/* Crowns Against */}
                    <td className="py-4 px-4 text-center text-slate-400">
                      {entry.crowns_against}
                    </td>

                    {/* Crown Diff */}
                    <td className="py-4 px-4 text-center font-bold">
                      <span
                        className={
                          entry.crown_diff > 0
                            ? 'text-emerald-400'
                            : entry.crown_diff < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {entry.crown_diff > 0 ? `+${entry.crown_diff}` : entry.crown_diff}
                      </span>
                    </td>

                    {/* Points */}
                    <td className="py-4 px-6 text-center font-display font-black text-xl text-amber-300">
                      {entry.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
