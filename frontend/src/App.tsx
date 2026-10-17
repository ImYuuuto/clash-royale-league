import { useState } from 'react';
import { AudioProvider } from './context/AudioContext';
import { TournamentProvider } from './context/TournamentContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppShell } from './components/layout/AppShell';
import type { NavItem } from './components/layout/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { PlayersPage } from './pages/PlayersPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { StandingsPage } from './pages/StandingsPage';
import { MatchesPage } from './pages/MatchesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

declare global {
  interface Window {
    desktop?: {
      getDatabaseStatus: () => Promise<{ configured: boolean; apiReady: boolean }>;
      getDatabaseSettings: () => Promise<Record<string, string> | null>;
      saveDatabaseSettings: (settings: Record<string, string>) => Promise<{ success: boolean; message?: string }>;
    };
  }
}

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavItem>('overview');

  const pageMeta: Record<NavItem, { title: string; description: string }> = {
    overview: {
      title: 'Tournament Overview',
      description: 'Active league standing, upcoming match fixtures, and competitive alerts.',
    },
    players: {
      title: 'Global Roster',
      description: 'Official Clash Royale competitors registry, tags, and profiles.',
    },
    tournaments: {
      title: 'League Configurations',
      description: 'Multi-step tournament wizard, card exhaustion rules, and format options.',
    },
    standings: {
      title: 'Official Standings',
      description: 'Live tournament table, crown differentials, and championship qualifications.',
    },
    matches: {
      title: 'Match Day Lobby',
      description: 'Pre-match briefings, card cooldown tracking, and post-match deck registration.',
    },
    analytics: {
      title: 'Tournament Analytics',
      description: 'Player win-rates, card exhaustion frequencies, and elixir curve distributions.',
    },
    settings: {
      title: 'System Settings',
      description: 'League engine configuration, API diagnostics, and cache management.',
    },
  };

  const renderActivePage = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'players':
        return <PlayersPage />;
      case 'tournaments':
        return <TournamentsPage />;
      case 'standings':
        return <StandingsPage />;
      case 'matches':
        return <MatchesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  const currentMeta = pageMeta[currentTab] || pageMeta.overview;

  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      pageTitle={currentMeta.title}
      pageDescription={currentMeta.description}
    >
      {renderActivePage()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <NotificationProvider>
        <TournamentProvider>
          <MainApp />
        </TournamentProvider>
      </NotificationProvider>
    </AudioProvider>
  );
}
