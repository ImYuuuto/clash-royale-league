import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { playersApi } from '../services/playersApi';
import { Player } from '../types/player';
import { TournamentWizard } from '../components/tournaments/TournamentWizard';
import { Button } from '../components/ui/Button';
import { Trophy, Plus, Shield, Users, Flame, Ban, CheckCircle2, ChevronRight } from 'lucide-react';

export const TournamentsPage: React.FC = () => {
  const {
    tournaments,
    activeTournament,
    setActiveTournamentId,
    createTournament,
  } = useTournament();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  useEffect(() => {
    void playersApi.getAll().then(setAllPlayers);
  }, [wizardOpen]);

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
              Tournament Manager
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create leagues, configure custom card exhaustion rules, and inspect schedules.
            </p>
          </div>
        </div>

        {!wizardOpen && (
          <Button
            variant="primary"
            onClick={() => setWizardOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Tournament
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      {wizardOpen ? (
        <TournamentWizard
          players={allPlayers}
          onCancel={() => setWizardOpen(false)}
          onLaunch={async (input) => {
            await createTournament(input);
            setWizardOpen(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tournaments.map((t) => {
            const isActive = activeTournament?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setActiveTournamentId(t.id)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-br from-[#161d2d] to-[#121724] border-amber-500/60 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/30'
                    : 'bg-[#101420] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            t.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 capitalize">
                          {t.format.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white mt-1 leading-snug">
                        {t.name}
                      </h3>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                        Active League
                      </span>
                    )}
                  </div>

                  {/* Rules Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="text-[11px] font-medium bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Best of {t.match_format_bo}</span>
                    </div>

                    <div className="text-[11px] font-medium bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>
                        {t.cooldown_duration > 0
                          ? `${t.cooldown_duration} Matches Exhaustion`
                          : 'No Cooldown'}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-300 flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.ban_duplicate_decks ? 'No Duplicate Decks' : 'Duplicates Allowed'}</span>
                    </div>

                    <div className="text-[11px] font-medium bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t.players.length} Competitors</span>
                    </div>
                  </div>
                </div>

                {/* Footer Switcher */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Created: {new Date(t.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300">
                    <span>{isActive ? 'Currently Active' : 'Switch to League'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
