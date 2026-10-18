import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import {
  Settings,
  Server,
  RefreshCw,
  Trophy,
  Shield,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';

export const SettingsPage: React.FC = () => {
  const { activeTournament, refreshAll } = useTournament();
  const { showNotification } = useNotifications();
  const [clearing, setClearing] = useState(false);

  const handleClearLocalData = () => {
    setClearing(true);
    localStorage.removeItem('crl_global_roster');
    localStorage.removeItem('crl_tournaments');
    showNotification('success', 'Cache Cleared', 'The local cache has been reset.');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0b2559] to-[#1746a0] p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Settings & Preferences
            </h2>
            <p className="text-xs text-blue-100/70 mt-0.5">
              Tournament engine configuration, API diagnostics, and cache management.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refreshAll()}
          icon={<RefreshCw className="w-4 h-4" />}
          className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20"
        >
          Sync Data
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Active Tournament Rules Summary */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wide">
              Active Tournament Rules
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">Selected League:</span>
              <span className="font-bold text-slate-800">
                {activeTournament ? activeTournament.name : 'None'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">Match Format:</span>
              <span className="font-bold text-[#0b2559]">
                Single Match
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">Cooldown Rule:</span>
              <span className="font-bold text-slate-800">
                {activeTournament && activeTournament.cooldown_duration > 0
                  ? `${activeTournament.cooldown_duration} cooldown matches`
                  : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Duplicate Decks:</span>
              <span className="font-bold text-emerald-600">
                {activeTournament?.ban_duplicate_decks ? 'Prohibited (Strict)' : 'Allowed'}
              </span>
            </div>
          </div>
        </div>

        {/* Backend API */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Server className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wide">
              Server & API Status
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">API Gateway:</span>
              <span className="font-mono text-slate-800 text-[11px]">{API_BASE_URL}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">Health Check:</span>
              <span className="font-mono text-emerald-600 text-[11px]">/api/health</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">Endpoints :</span>
              <span className="font-mono text-blue-600 text-[11px]">/api/tournaments, /api/matches</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Connection Status:</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wide">
              Client Storage & Maintenance
            </h3>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
          <div>
            <div className="text-sm font-semibold text-slate-800">Clear Local Cache</div>
            <p className="text-xs text-slate-400 mt-0.5">
              Clears cached browser data and reloads state from the database.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleClearLocalData}
            loading={clearing}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Clear Cache
          </Button>
        </div>
      </div>
    </div>
  );
};
