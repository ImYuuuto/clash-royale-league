import React from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  TableProperties,
  Swords,
  BarChart3,
  Settings,
  Crown,
  User,
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
  const { activeTournament } = useTournament();

  const sections = [
    {
      title: 'PRINCIPAL',
      items: [
        { id: 'overview' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'players' as NavItem, label: 'Players', icon: Users },
      ],
    },
    {
      title: 'COMPÉTITION',
      items: [
        { id: 'tournaments' as NavItem, label: 'Tournois', icon: Trophy },
        { id: 'standings' as NavItem, label: 'Classement', icon: TableProperties },
        { id: 'matches' as NavItem, label: 'Matchs & Lobby', icon: Swords },
        { id: 'analytics' as NavItem, label: 'Statistiques', icon: BarChart3 },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        { id: 'settings' as NavItem, label: 'Paramètres', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      aria-label="Main Navigation"
      className="w-64 bg-[#0a1633] border-r border-[#15254d] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none shadow-xl"
    >
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#15254d] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 shadow-md shadow-amber-500/10 shrink-0 bg-[#0e1838]">
            <img src="/icon.webp" alt="Clash Royale" className="w-full h-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-sm text-white tracking-wide flex items-center gap-1.5">
              <span>Clash Royale</span>
            </div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              League & Tournois
            </div>
          </div>
        </div>

        {/* Active Tournament Highlight */}
        {activeTournament && (
          <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-[#101f44] border border-[#1e3466]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#7e95be] flex items-center justify-between">
              <span>Ligue active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {activeTournament.name}
            </div>
            <div className="text-[10px] font-semibold text-amber-400 mt-0.5">
              Match unique • {activeTournament.cooldown_duration > 0 ? `${activeTournament.cooldown_duration} Cards CD` : 'Sans Cooldown'}
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="p-3 space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-[#546b94] uppercase">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#182a54] text-amber-400 font-bold border border-amber-500/30 shadow-sm'
                        : 'text-[#8ea4ca] hover:text-white hover:bg-[#122144]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-[#6c85ad]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* User / Admin Profile Card (Matching Screenshot Bottom Pill) */}
      <div className="p-3 border-t border-[#15254d] bg-[#08122b]">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#101e40] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            CR
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              Admin Tournoi
            </div>
            <div className="text-[10px] text-[#7188b0] truncate">
              Organisateur
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
