import React from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { Button } from '../ui/Button';

interface TopbarProps {
  pageTitle: string;
  pageDescription?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  pageDescription,
}) => {
  const {
    tournaments,
    activeTournament,
    setActiveTournamentId,
    refreshAll,
    loadingFixtures,
  } = useTournament();

  return (
    <header className="h-20 border-b border-slate-200/80 bg-white px-8 flex items-center justify-between sticky top-0 z-30 select-none shadow-sm">
      {/* Page Title & Breadcrumbs (Matching Screenshot Layout) */}
      <div>
        <h1 className="text-2xl font-black font-display uppercase tracking-wide text-slate-900 leading-tight">
          {pageTitle}
        </h1>
        {pageDescription && (
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
            {pageDescription}
          </p>
        )}
      </div>

      {/* Topbar Actions */}
      <div className="flex items-center gap-3">
        {/* Tournament Selector */}
        {tournaments.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              aria-label="Tournoi Actif"
              value={activeTournament?.id || ''}
              onChange={(e) => setActiveTournamentId(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id} className="bg-white text-slate-900">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}


        {/* Refresh All */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refreshAll()}
          loading={loadingFixtures}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingFixtures ? 'animate-spin' : ''}`} />}
          aria-label="Actualiser les données"
          className="px-3"
        >
          Actualiser
        </Button>
      </div>
    </header>
  );
};
