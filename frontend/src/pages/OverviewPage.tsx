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
  Shield,
  Activity,
  ArrowRight,
  Crown,
  Database,
  Server,
  Sparkles,
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
    serverStatus,
    databaseStatus,
    refreshFixtures,
  } = useTournament();

  const [registerFixture, setRegisterFixture] = useState<BackendFixture | null>(null);

  const completedMatches = fixtures.filter((f) => f.status === 'completed');
  const upcomingMatches = fixtures.filter((f) => f.status !== 'completed');

  const totalMatches = fixtures.length || 15;
  const progressPercent = Math.min(
    100,
    Math.round((completedMatches.length / totalMatches) * 100)
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Tournament Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#172033] via-[#121826] to-[#0d121c] border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Tournament Desk Control Center</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Clash Royale Desktop League</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-wide text-white leading-tight">
              {activeTournament ? activeTournament.name : 'No Active League Selected'}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time fixture pairings, live crown standings, 8-card cooldown enforcement, and desktop backend coordination.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('matches')}
              icon={<Swords className="w-5 h-5" />}
            >
              Match Lobby
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('tournaments')}
              icon={<Trophy className="w-5 h-5" />}
            >
              New Tournament
            </Button>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Players */}
        <div className="bg-[#101420] border border-slate-800 p-5 rounded-3xl shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Enrolled Players</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-display font-black text-3xl text-white">
            {activeTournament?.players.length || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Global Roster Competitors
          </div>
        </div>

        {/* Matches Completed */}
        <div className="bg-[#101420] border border-slate-800 p-5 rounded-3xl shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Matches Completed</span>
            <Swords className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-black text-3xl text-emerald-400">
            {completedMatches.length}{' '}
            <span className="text-sm font-sans font-medium text-slate-500">/ {fixtures.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {upcomingMatches.length} Remaining Fixtures
          </div>
        </div>

        {/* Tournament Progress */}
        <div className="bg-[#101420] border border-slate-800 p-5 rounded-3xl shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>League Progress</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-black text-3xl text-amber-300">
            {progressPercent}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Format & Cooldown */}
        <div className="bg-[#101420] border border-slate-800 p-5 rounded-3xl shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Exhaustion Rule</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="font-display font-black text-2xl text-white truncate">
            {activeTournament && activeTournament.cooldown_duration > 0
              ? `${activeTournament.cooldown_duration} Matches Lock`
              : 'Disabled'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {activeTournament?.ban_duplicate_decks ? 'No Duplicate Decks' : 'Duplicate Decks OK'}
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Fixtures vs Standings Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Fixtures (7 Cols) */}
        <div className="lg:col-span-7 bg-[#101420] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                <span>Upcoming Scheduled Fixtures</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Next pairings in the tournament schedule ready for matchday.
              </p>
            </div>
            <button
              onClick={() => onNavigate('matches')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingMatches.slice(0, 4).map((f) => (
              <div
                key={f.matchId}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[8px] uppercase font-bold text-slate-500">M</span>
                  <span className="font-display font-black text-sm text-amber-400">
                    {String(f.matchNumber).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center gap-3">
                  <div className="text-right flex-1 truncate">
                    <span className="font-bold text-sm text-white block truncate">{f.player1.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{f.player1.tag}</span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-display font-black text-[10px] text-amber-400 shrink-0">
                    VS
                  </span>
                  <div className="text-left flex-1 truncate">
                    <span className="font-bold text-sm text-white block truncate">{f.player2.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{f.player2.tag}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setRegisterFixture(f)}
                  icon={<Swords className="w-3.5 h-3.5" />}
                >
                  Record
                </Button>
              </div>
            ))}

            {upcomingMatches.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">
                All scheduled fixtures have been completed.
              </div>
            )}
          </div>
        </div>

        {/* Live Leaderboard Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-[#101420] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Leaderboard Preview</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top ranked league competitors.</p>
            </div>
            <button
              onClick={() => onNavigate('standings')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {standings.slice(0, 5).map((entry) => (
              <div
                key={entry.player_id}
                className={`p-3 rounded-2xl flex items-center justify-between text-xs ${
                  entry.rank === 1 && entry.points > 0
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-slate-900/40 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg font-display font-black flex items-center justify-center text-xs ${
                      entry.rank === 1 && entry.points > 0
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : entry.rank === 2 && entry.points > 0
                        ? 'bg-slate-300 text-slate-950 font-black'
                        : entry.rank === 3 && entry.points > 0
                        ? 'bg-amber-700 text-white font-black'
                        : 'text-slate-500'
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{entry.player_name}</div>
                    <div className="text-[10px] text-slate-400">{entry.matches_won}W - {entry.matches_lost}L</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display font-black text-base text-amber-300">
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

      {/* Integration & Architecture Health Bar */}
      <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <span className="flex items-center gap-1.5 font-bold text-white uppercase text-[11px] tracking-wider">
            <Server className="w-4 h-4 text-emerald-400" />
            Backend API: <span className="text-emerald-400 font-mono">{serverStatus}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 font-bold text-white uppercase text-[11px] tracking-wider">
            <Database className="w-4 h-4 text-amber-400" />
            MySQL Database: <span className="text-amber-400 font-mono">{databaseStatus}</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Vite+ Tooling Engine • React 19 • Tailwind CSS • Electron Desktop Integration
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
