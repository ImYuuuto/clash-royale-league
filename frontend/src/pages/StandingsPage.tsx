import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { useNotifications } from '../context/NotificationContext';
import { tournamentsApi } from '../services/tournamentsApi';
import { Trophy, AlertTriangle, Crown, Sparkles } from 'lucide-react';

export const StandingsPage: React.FC = () => {
  const { activeTournament, standings, refreshAll } = useTournament();
  const { showNotification } = useNotifications();

  const leader = standings[0];
  const hasTiebreaker = standings.some((s) => s.inTiebreaker);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0b2559] to-[#1746a0] p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Classement Officiel
            </h2>
            <p className="text-xs text-blue-100/70 mt-0.5">
              Rankings en direct, différentiel de couronnes et qualifications.
            </p>
          </div>
        </div>

        {activeTournament && (
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-xs font-semibold text-white/90 backdrop-blur-sm">
            <span className="text-amber-300 uppercase tracking-wider text-[10px] font-bold">
              Tournoi :
            </span>
            <span>{activeTournament.name}</span>
          </div>
        )}
      </div>

      {/* Tiebreaker Alert */}
      {hasTiebreaker && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alerte Tiebreaker Championnat</span>
            </div>
            <p className="text-xs text-amber-600 mt-0.5">
              Les meilleurs compétiteurs sont à égalité ! Mode de résolution :{' '}
              <strong className="text-amber-800 uppercase font-bold">
                {activeTournament?.tiebreaker_mode === 'bo5' ? 'Best of 5 Mini-Finale' : activeTournament?.tiebreaker_mode}
              </strong>.
            </p>
          </div>
        </div>
      )}

      {/* Standings Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-wider">
              Tableau du Championnat
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Victoire = 3 points. La différence de couronnes (C+ moins C-) départage les égalités.
            </p>
          </div>

          {leader && leader.points > 0 && (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
              <div className="text-xs">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Leader</span>
                <span className="font-bold text-slate-800">{leader.player_name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6 text-center w-16">Rang</th>
                <th className="py-4 px-6">Joueur</th>
                <th className="py-4 px-4 text-center">Joués</th>
                <th className="py-4 px-4 text-center">Victoires</th>
                <th className="py-4 px-4 text-center">Défaites</th>
                <th className="py-4 px-4 text-center">C. Pour</th>
                <th className="py-4 px-4 text-center">C. Contre</th>
                <th className="py-4 px-4 text-center">Diff.</th>
                <th className="py-4 px-6 text-center">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {standings.map((entry) => {
                const isFirst = entry.rank === 1 && entry.points > 0;
                const isSecond = entry.rank === 2 && entry.points > 0;
                const isThird = entry.rank === 3 && entry.points > 0;

                return (
                  <tr
                    key={entry.player_id}
                    className={`transition-colors ${
                      isFirst
                        ? 'bg-amber-50/50 hover:bg-amber-50'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-6 text-center font-display font-extrabold text-base">
                      {isFirst ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 text-white shadow-sm font-black">
                          1
                        </div>
                      ) : isSecond ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-300 text-slate-800 font-black">
                          2
                        </div>
                      ) : isThird ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-700/80 text-white font-black">
                          3
                        </div>
                      ) : (
                        <span className="text-slate-400">#{entry.rank}</span>
                      )}
                    </td>

                    {/* Player */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 leading-tight">
                            <span>{entry.player_name}</span>
                            {isFirst && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                            {entry.inTiebreaker && (
                              <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-200 uppercase font-bold tracking-wider">
                                Égalité #1
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-[#0b2559]/70 font-medium">
                            {entry.player_tag}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center font-medium text-slate-500">
                      {entry.matches_played}
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-emerald-600">
                      {entry.matches_won}
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-rose-500">
                      {entry.matches_lost}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-500">
                      {entry.crowns_for}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-400">
                      {entry.crowns_against}
                    </td>
                    <td className="py-4 px-4 text-center font-bold">
                      <span
                        className={
                          entry.crown_diff > 0
                            ? 'text-emerald-600'
                            : entry.crown_diff < 0
                            ? 'text-rose-500'
                            : 'text-slate-400'
                        }
                      >
                        {entry.crown_diff > 0 ? `+${entry.crown_diff}` : entry.crown_diff}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-display font-black text-xl text-[#0b2559]">
                      {entry.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tournament Resolution Footer */}
        {activeTournament && activeTournament.status !== 'completed' && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Résolution du Tournoi</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasTiebreaker
                  ? 'Deux joueurs sont à égalité en 1ère place. Lancez le tiebreaker officiel BO5.'
                  : 'Tous les matchs réguliers peuvent être finalisés pour couronner le champion.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {standings.length >= 2 && standings[0].points > 0 && standings[0].points === standings[1].points && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await tournamentsApi.createTiebreaker(activeTournament.id, [
                        standings[0].player_id,
                        standings[1].player_id,
                      ]);
                      await refreshAll();
                      showNotification('success', 'Tiebreaker Créé', 'Match de championnat BO5 créé !');
                    } catch (err: any) {
                      showNotification('error', 'Échec', err.message || 'Impossible de créer le tiebreaker.');
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
                >
                  ⚔️ Créer Tiebreaker BO5
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  try {
                    await tournamentsApi.updateStatus(activeTournament.id, 'completed');
                    await refreshAll();
                    showNotification('success', 'Tournoi Terminé', 'Le champion a été enregistré !');
                  } catch (err: any) {
                    showNotification('error', 'Erreur', err.message || 'Impossible de terminer le tournoi.');
                  }
                }}
                className="px-4 py-2 bg-[#0b2559] hover:bg-[#081d45] text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-[#081d45] cursor-pointer shadow-sm"
              >
                🏆 Finaliser la Ligue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
