import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { BackendFixture } from '../types/api';
import { PreMatchBriefing } from '../components/matches/PreMatchBriefing';
import { PostMatchModal } from '../components/games/PostMatchModal';
import { Button } from '../components/ui/Button';
import { Swords, Shield, Clock, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

export const MatchesPage: React.FC = () => {
  const { activeTournament, fixtures, refreshFixtures } = useTournament();

  const [selectedFixture, setSelectedFixture] = useState<BackendFixture | null>(null);
  const [registeringFixture, setRegisteringFixture] = useState<BackendFixture | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');

  const filteredFixtures = fixtures.filter((f) => {
    if (statusFilter === 'all') return true;
    return f.status === statusFilter;
  });

  if (selectedFixture && activeTournament) {
    return (
      <>
        <PreMatchBriefing
          fixture={selectedFixture}
          tournament={activeTournament}
          onBack={() => setSelectedFixture(null)}
          onOpenRegister={(f) => setRegisteringFixture(f)}
        />
        {registeringFixture && (
          <PostMatchModal
            isOpen={Boolean(registeringFixture)}
            onClose={() => setRegisteringFixture(null)}
            fixture={registeringFixture}
            tournament={activeTournament}
            onSuccess={async () => {
              await refreshFixtures();
              setSelectedFixture(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#141b2b] to-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Match Lobby & Fixtures
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect upcoming pairings, review pre-match card availability, and record game results.
            </p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          {(['all', 'scheduled', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1 rounded-xl capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Fixtures List */}
      <div className="space-y-3">
        {filteredFixtures.map((fixture) => {
          const isCompleted = fixture.status === 'completed';

          return (
            <div
              key={fixture.matchId}
              onClick={() => setSelectedFixture(fixture)}
              className="bg-[#101420] hover:bg-[#131929] border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl transition-all duration-150 cursor-pointer shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Match Number & Format */}
              <div className="flex items-center gap-4 min-w-[140px]">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">MATCH</span>
                  <span className="font-display font-black text-lg text-amber-400 leading-none">
                    {String(fixture.matchNumber).padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {fixture.status}
                  </span>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    {fixture.isTiebreaker ? 'Tiebreaker BO5' : `Series BO${activeTournament?.match_format_bo || 3}`}
                  </div>
                </div>
              </div>

              {/* Competitors Versus */}
              <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8">
                {/* Player 1 */}
                <div className="flex items-center gap-3 justify-end flex-1">
                  <div className="text-right">
                    <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors leading-tight">
                      {fixture.player1.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{fixture.player1.tag}</div>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80"
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                </div>

                {/* VS Badge */}
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-display font-black text-xs text-amber-400 shrink-0">
                  VS
                </div>

                {/* Player 2 */}
                <div className="flex items-center gap-3 justify-start flex-1">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div className="text-left">
                    <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors leading-tight">
                      {fixture.player2.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{fixture.player2.tag}</div>
                  </div>
                </div>
              </div>

              {/* Actions / Status */}
              <div className="flex items-center gap-3 justify-end min-w-[180px]">
                <Button
                  variant={isCompleted ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (!isCompleted) {
                      setRegisteringFixture(fixture);
                    } else {
                      setSelectedFixture(fixture);
                    }
                  }}
                  icon={isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Swords className="w-3.5 h-3.5" />}
                >
                  {isCompleted ? 'Inspect Match' : 'Register Result'}
                </Button>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          );
        })}

        {filteredFixtures.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-[#101420] border border-slate-800 text-slate-400 text-xs">
            No matches found for the selected status filter.
          </div>
        )}
      </div>

      {/* Post Match Modal */}
      {registeringFixture && activeTournament && (
        <PostMatchModal
          isOpen={Boolean(registeringFixture)}
          onClose={() => setRegisteringFixture(null)}
          fixture={registeringFixture}
          tournament={activeTournament}
          onSuccess={async () => {
            await refreshFixtures();
          }}
        />
      )}
    </div>
  );
};
