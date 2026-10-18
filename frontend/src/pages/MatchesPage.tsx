import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { BackendFixture } from '../types/api';
import { PreMatchBriefing } from '../components/matches/PreMatchBriefing';
import { PostMatchModal } from '../components/games/PostMatchModal';
import { Button } from '../components/ui/Button';
import { Swords, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0b2559] to-[#1746a0] p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Lobby & Fixtures
            </h2>
            <p className="text-xs text-blue-100/70 mt-0.5">
              Review matchups, check card availability, and record results.
            </p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 p-1.5 rounded-xl backdrop-blur-sm">
          <Filter className="w-3.5 h-3.5 text-white/50 ml-2 mr-1" />
          {(['all', 'scheduled', 'in_progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-white text-[#0b2559] font-bold shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s === 'scheduled' ? 'Upcoming' : s === 'in_progress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Fixtures List */}
      <div className="space-y-3">
        {filteredFixtures.map((fixture) => {
          const isCompleted = fixture.status === 'completed';
          const isInProgress = fixture.status === 'in_progress';

          return (
            <div
              key={fixture.matchId}
              onClick={() => setSelectedFixture(fixture)}
              className="bg-white hover:shadow-md border border-slate-200 hover:border-slate-300 p-5 rounded-2xl transition-all duration-150 cursor-pointer shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Match Number */}
              <div className="flex items-center gap-4 min-w-[140px]">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">MATCH</span>
                  <span className="font-display font-black text-lg text-[#0b2559] leading-none">
                    {String(fixture.matchNumber).padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-slate-50 text-slate-500 border-slate-200'
                        : isInProgress
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Upcoming'}
                  </span>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    {fixture.isTiebreaker ? 'Tiebreaker BO5' : 'Single Match'}
                  </div>
                </div>
              </div>

              {/* VS Section */}
              <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8">
                <div className="flex items-center gap-3 justify-end flex-1">
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-800 group-hover:text-[#0b2559] transition-colors leading-tight">
                      {fixture.player1.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{fixture.player1.tag}</div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#0b2559] flex items-center justify-center font-display font-black text-xs text-amber-400 shrink-0 shadow-sm">
                  VS
                </div>

                <div className="flex items-center gap-3 justify-start flex-1">
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-800 group-hover:text-[#0b2559] transition-colors leading-tight">
                      {fixture.player2.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{fixture.player2.tag}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                  {isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Record Result'}
                </Button>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          );
        })}

        {filteredFixtures.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs shadow-sm">
            No matches found for the selected filter.
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
