import React from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  TableProperties,
  Swords,
  BarChart3,
  Settings,
  Shield,
  Radio,
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';

export type NavItem =
  | 'overview'
  | 'players'
  | 'tournaments'
  | 'standings'
  | 'matches'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { activeTournament, serverStatus, databaseStatus } = useTournament();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'players', label: 'Players Roster', icon: Users, badge: 'Global' },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'standings', label: 'Live Standings', icon: TableProperties },
    { id: 'matches', label: 'Match Lobby', icon: Swords },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside aria-label="Main Navigation" className="w-64 bg-[#0d111a] border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/70 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40 text-slate-950 font-black font-display text-lg tracking-wider">
            CR
          </div>
          <div>
            <div className="font-display font-extrabold text-lg text-white tracking-wider flex items-center gap-1.5 leading-none">
              LEAGUE <span className="text-amber-400">MANAGER</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Esports Edition</span>
            </div>
          </div>
        </div>

        {/* Active Tournament Highlight */}
        <div className="px-4 py-3 mx-3 my-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Active League</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-xs font-semibold text-white mt-1 truncate">
            {activeTournament ? activeTournament.name : 'No Tournament Selected'}
          </div>
          {activeTournament && (
            <div className="text-[10px] text-amber-400/90 font-medium mt-0.5">
              BO{activeTournament.match_format_bo} • {activeTournament.cooldown_duration > 0 ? `${activeTournament.cooldown_duration} Matches CD` : 'No Cooldown'}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/15 to-transparent text-amber-300 font-semibold border-l-2 border-amber-400 pl-3'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {'badge' in item && item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            Backend Sync
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              serverStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                serverStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            {serverStatus}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">MySQL DB</span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              databaseStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                databaseStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            {databaseStatus}
          </span>
        </div>
      </div>
    </aside>
  );
};
