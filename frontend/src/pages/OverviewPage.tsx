import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { NavItem } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { PostMatchModal } from '../components/games/PostMatchModal';
import { BackendFixture } from '../types/api';
import {
  Trophy,
  Swords,
  Users,
  Activity,
  ArrowRight,
  Crown,
  Flame,
} from 'lucide-react';

interface OverviewPageProps {
  onNavigate: (tab: NavItem) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const {
    activeTournament,
    fixtures,
    standings,
    refreshFixtures,
  } = useTournament();

  const [registerFixture, setRegisterFixture] = useState<BackendFixture | null>(null);

  const completedMatches = fixtures.filter((f) => f.status === 'completed');
  const upcomingMatches = fixtures.filter((f) => f.status !== 'completed');

  const totalMatches = fixtures.length;
  const progressPercent = Math.min(
    100,
    totalMatches ? Math.round((completedMatches.length / totalMatches) * 100) : 0
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b2559] via-[#0e2d6b] to-[#1746a0] p-8 shadow-lg">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300/90">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Control Center</span>
              <span className="text-white/30">•</span>
              <span className="text-white/60">Clash Royale League</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-wide text-white leading-tight">
              {activeTournament ? activeTournament.name : 'No Active League'}
            </h1>
            <p className="text-sm text-blue-100/70 leading-relaxed">
              Manage fixtures, standings, and card cooldowns in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="gold"
              size="lg"
              onClick={() => onNavigate('matches')}
              icon={<Swords className="w-5 h-5" />}
            >
              Match Lobby
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('tournaments')}
              icon={<Trophy className="w-5 h-5" />}
              className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20"
            >
              New Tournament
            </Button>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Enrolled Players */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm card-hover">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span>Enrolled Players</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-slate-900">
            {activeTournament?.players.length || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Players in the Global Roster
          </div>
        </div>

        {/* Matches Completed */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm card-hover">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span>Completed Matches</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Swords className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-emerald-600">
            {completedMatches.length}{' '}
            <span className="text-sm font-sans font-medium text-slate-400">/ {fixtures.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {upcomingMatches.length} fixtures remaining
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm card-hover">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span>Progression</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-amber-600">
            {progressPercent}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cooldown Rule */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm card-hover">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span>Cooldown Rule</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-slate-900 truncate">
            {activeTournament && activeTournament.cooldown_duration > 0
              ? `${activeTournament.cooldown_duration} Matches Lock`
              : 'Disabled'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {activeTournament?.ban_duplicate_decks ? 'No Duplicate Decks' : 'Doublons Alloweds'}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Fixtures */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-500" />
                <span>Upcoming Fixtures</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Next matchups on the tournament schedule.
              </p>
            </div>
            <button
              onClick={() => onNavigate('matches')}
              className="text-xs font-semibold text-[#0b2559] hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingMatches.slice(0, 4).map((f) => (
              <div
                key={f.matchId}
                className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 flex items-center justify-between gap-4 transition-all card-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[8px] uppercase font-bold text-slate-400">M</span>
                  <span className="font-display font-black text-sm text-[#0b2559]">
                    {String(f.matchNumber).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center gap-3">
                  <div className="text-right flex-1 truncate">
                    <span className="font-bold text-sm text-slate-800 block truncate">{f.player1.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{f.player1.tag}</span>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-[#0b2559] flex items-center justify-center font-display font-black text-[10px] text-amber-400 shrink-0">
                    VS
                  </span>
                  <div className="text-left flex-1 truncate">
                    <span className="font-bold text-sm text-slate-800 block truncate">{f.player2.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{f.player2.tag}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setRegisterFixture(f)}
                  icon={<Swords className="w-3.5 h-3.5" />}
                >
                  Save
                </Button>
              </div>
            ))}

            {upcomingMatches.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                All scheduled fixtures have been completed.
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Standings</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top players in the league.</p>
            </div>
            <button
              onClick={() => onNavigate('standings')}
              className="text-xs font-semibold text-[#0b2559] hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Tableau Complet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {standings.slice(0, 5).map((entry) => (
              <div
                key={entry.player_id}
                className={`p-3 rounded-xl flex items-center justify-between text-xs transition-all ${
                  entry.rank === 1 && entry.points > 0
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-slate-50 border border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg font-display font-black flex items-center justify-center text-xs ${
                      entry.rank === 1 && entry.points > 0
                        ? 'bg-amber-500 text-white'
                        : entry.rank === 2 && entry.points > 0
                        ? 'bg-slate-300 text-slate-800'
                        : entry.rank === 3 && entry.points > 0
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">{entry.player_name}</div>
                    <div className="text-[10px] text-slate-400">{entry.matches_won}V - {entry.matches_lost}D</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display font-black text-base text-[#0b2559]">
                    {entry.points} PTS
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {entry.crown_diff > 0 ? `+${entry.crown_diff}` : entry.crown_diff} diff
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Post Match Modal */}
      {registerFixture && activeTournament && (
        <PostMatchModal
          isOpen={Boolean(registerFixture)}
          onClose={() => setRegisterFixture(null)}
          fixture={registerFixture}
          tournament={activeTournament}
          onSuccess={async () => {
            await refreshFixtures();
          }}
        />
      )}
    </div>
  );
};
