import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import { DatabaseModal } from '../components/layout/DatabaseModal';
import {
  Settings,
  Database,
  Server,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { API_BASE_URL } from '../services/apiClient';

export const SettingsPage: React.FC = () => {
  const { serverStatus, databaseStatus, refreshAll } = useTournament();
  const { showNotification } = useNotifications();

  const [dbModalOpen, setDbModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleClearLocalData = () => {
    localStorage.removeItem('crl_global_roster');
    localStorage.removeItem('crl_tournaments');
    localStorage.removeItem('crl_match_games');
    showNotification('success', 'Reset Complete', 'Local workspace cache reset to default factory data.');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#141b2b] to-[#101420] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              System Settings & Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Desktop Electron runtime, Express backend coordination, and database configuration.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => void refreshAll()}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Check Diagnostics
        </Button>
      </div>

      {/* Backend & Database Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backend API Card */}
        <div className="bg-[#101420] border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wide">
                Express Backend API
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                serverStatus === 'online'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              {serverStatus}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>API Base URL:</span>
              <span className="font-mono text-white">{API_BASE_URL}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Health Endpoint:</span>
              <span className="font-mono text-slate-300">/api/health</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Integrated Endpoints:</span>
              <span className="text-emerald-400 font-semibold">GET /fixtures, POST /games</span>
            </div>
          </div>
        </div>

        {/* MySQL Database Card */}
        <div className="bg-[#101420] border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wide">
                MySQL Database
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                databaseStatus === 'online'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              {databaseStatus}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Storage Driver:</span>
              <span className="font-semibold text-white">mysql2 / promise</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IPC Channel:</span>
              <span className="font-mono text-slate-300">database:save-settings</span>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDbModalOpen(true)}
                icon={<Database className="w-3.5 h-3.5 text-amber-400" />}
                className="w-full text-xs"
              >
                Configure MySQL Credentials
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Strict Responsibility & Architecture Policy */}
      <div className="bg-[#101420] border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wide">
            Developer Responsibility & Architectural Boundaries
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <strong className="text-white block font-semibold">Developer 1 (Frontend & Desktop UI)</strong>
            <p>
              Exclusively responsible for React UI, Vite+ build toolchain, Tailwind CSS, Electron IPC communication, validation UX, Clash Royale card picker, and pre-match briefings.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <strong className="text-white block font-semibold">Developer 2 (Backend & Database)</strong>
            <p>
              Exclusively responsible for Express controllers, services, database schemas, table migrations, SHA-256 deck hashing, and authoritative database integrity. Zero backend files are modified by Frontend.
            </p>
          </div>
        </div>
      </div>

      {/* Tooling Stack Information */}
      <div className="bg-[#101420] border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wide">
            Toolchain Specifications
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Tooling</div>
            <div className="font-display font-bold text-base text-white mt-1">Vite+ (1.3.0)</div>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">UI Library</div>
            <div className="font-display font-bold text-base text-white mt-1">React 19</div>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Styling</div>
            <div className="font-display font-bold text-base text-white mt-1">Tailwind CSS 4</div>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Desktop</div>
            <div className="font-display font-bold text-base text-white mt-1">Electron 37</div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400">Clear cached local roster and fixtures:</span>
          <Button variant="danger" size="sm" onClick={handleClearLocalData}>
            Reset Local Storage Cache
          </Button>
        </div>
      </div>

      <DatabaseModal isOpen={dbModalOpen} onClose={() => setDbModalOpen(false)} />
    </div>
  );
};
