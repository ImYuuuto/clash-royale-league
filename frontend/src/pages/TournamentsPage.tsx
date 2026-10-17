import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { playersApi } from '../services/playersApi';
import { Player } from '../types/player';
import { TournamentWizard } from '../components/tournaments/TournamentWizard';
import { Button } from '../components/ui/Button';
import { Trophy, Plus, Shield, Users, Flame, Ban, ChevronRight } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0b2559] to-[#1746a0] p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Gestionnaire de Tournois
            </h2>
            <p className="text-xs text-blue-100/70 mt-0.5">
              Créez des ligues, configurez les règles d'épuisement et inspectez les calendriers.
            </p>
          </div>
        </div>

        {!wizardOpen && (
          <Button
            variant="gold"
            onClick={() => setWizardOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Créer Tournoi
          </Button>
        )}
      </div>

      {/* Main Content */}
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
                className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between card-hover ${
                  isActive
                    ? 'bg-white border-[#0b2559] shadow-md ring-1 ring-[#0b2559]/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2559] to-[#1746a0]" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            t.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          {t.status === 'active' ? 'Actif' : t.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 capitalize">
                          {t.format.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-display uppercase tracking-wide text-slate-900 mt-1 leading-snug">
                        {t.name}
                      </h3>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-[#0b2559]/10 text-[#0b2559] border border-[#0b2559]/20 shrink-0">
                        Ligue Active
                      </span>
                    )}
                  </div>

                  {/* Rules Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="text-[11px] font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-slate-600 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#0b2559]" />
                      <span>Best of {t.match_format_bo}</span>
                    </div>

                    <div className="text-[11px] font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-slate-600 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>
                        {t.cooldown_duration > 0
                          ? `${t.cooldown_duration} Matchs Épuisement`
                          : 'Sans Cooldown'}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-slate-600 flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t.ban_duplicate_decks ? 'Pas de Doublons' : 'Doublons Autorisés'}</span>
                    </div>

                    <div className="text-[11px] font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-slate-600 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.players.length} Compétiteurs</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Créé le : {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#0b2559] hover:text-blue-700">
                    <span>{isActive ? 'Actuellement Active' : 'Activer la Ligue'}</span>
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
