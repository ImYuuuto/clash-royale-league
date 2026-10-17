import React from 'react';
import { RefreshCw, Database, Trophy, Sparkles } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { Button } from '../ui/Button';

interface TopbarProps {
  onOpenDatabaseSetup: () => void;
  pageTitle: string;
  pageDescription?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenDatabaseSetup,
  pageTitle,
  pageDescription,
}) => {
  const {
    tournaments,
    activeTournament,
    setActiveTournamentId,
    refreshAll,
    loadingFixtures,
    serverStatus,
  } = useTournament();

  return (
    <header className="h-20 border-b border-slate-800/80 bg-[#0d111a]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Page Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Esports Desk</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{pageTitle}</span>
        </div>
        <h1 className="text-xl font-bold font-display uppercase tracking-wide text-white leading-tight mt-0.5">
          {pageTitle}
        </h1>
        {pageDescription && (
          <p className="text-xs text-slate-400 hidden lg:block">{pageDescription}</p>
        )}
      </div>

      {/* Topbar Actions */}
      <div className="flex items-center gap-3">
        {/* Tournament Selector */}
        {tournaments.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-1.5 shadow-sm">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              aria-label="Active Tournament"
              value={activeTournament?.id || ''}
              onChange={(e) => setActiveTournamentId(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Database Config Modal Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDatabaseSetup}
          icon={<Database className="w-3.5 h-3.5 text-amber-400" />}
          className="text-xs"
        >
          MySQL Setup
        </Button>

        {/* Refresh All */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refreshAll()}
          loading={loadingFixtures}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingFixtures ? 'animate-spin' : ''}`} />}
          aria-label="Refresh data"
          className="px-2.5"
        />

        {/* Server Indicator Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            serverStatus === 'online'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`}
          />
          <span className="hidden sm:inline">API</span> {serverStatus}
        </div>
      </div>
    </header>
  );
};
