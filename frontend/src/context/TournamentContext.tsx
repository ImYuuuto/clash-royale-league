import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Tournament, CreateTournamentInput, StandingsEntry } from '../types/tournament';
import type { BackendFixture } from '../types/api';
import { tournamentsApi } from '../services/tournamentsApi';
import { axiosInstance } from '../services/apiClient';

interface TournamentContextType {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  fixtures: BackendFixture[];
  standings: StandingsEntry[];
  loadingFixtures: boolean;
  serverStatus: 'online' | 'offline' | 'checking';
  databaseStatus: 'online' | 'offline' | 'checking';
  setActiveTournamentId: (id: number) => void;
  refreshAll: () => Promise<void>;
  refreshFixtures: () => Promise<void>;
  createTournament: (input: CreateTournamentInput) => Promise<Tournament>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournamentId, setActiveTournamentIdState] = useState<number | null>(null);
  const [fixtures, setFixtures] = useState<BackendFixture[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [databaseStatus, setDatabaseStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const checkHealth = useCallback(async () => {
    try {
      if (window.desktop) {
        const desktopStatus = await window.desktop.getDatabaseStatus();
        if (!desktopStatus.configured) {
          setServerStatus('offline');
          setDatabaseStatus('offline');
          return;
        }
      }

      const res = await axiosInstance.get('/api/health');
      setServerStatus(res.status === 200 ? 'online' : 'offline');

      const dbRes = await axiosInstance.get('/api/health/db');
      setDatabaseStatus(dbRes.status === 200 ? 'online' : 'offline');
    } catch {
      setServerStatus('offline');
      setDatabaseStatus('offline');
    }
  }, []);

  const loadTournaments = useCallback(async () => {
    const list = await tournamentsApi.getAll();
    setTournaments(list);
    if (list.length > 0 && !activeTournamentId) {
      setActiveTournamentIdState(list[0].id);
    }
  }, [activeTournamentId]);

  const activeTournament = useMemo(() => {
    if (!activeTournamentId) return tournaments[0] || null;
    return tournaments.find((t) => t.id === activeTournamentId) || tournaments[0] || null;
  }, [tournaments, activeTournamentId]);

  const refreshFixtures = useCallback(async () => {
    if (!activeTournament) {
      setFixtures([]);
      return;
    }
    setLoadingFixtures(true);
    try {
      const data = await tournamentsApi.getFixtures(activeTournament.id);
      setFixtures(data);
    } catch (err) {
      console.error('Error refreshing fixtures:', err);
    } finally {
      setLoadingFixtures(false);
    }
  }, [activeTournament]);

  const refreshAll = useCallback(async () => {
    await checkHealth();
    await loadTournaments();
    await refreshFixtures();
  }, [checkHealth, loadTournaments, refreshFixtures]);

  useEffect(() => {
    void checkHealth();
    void loadTournaments();
    const interval = window.setInterval(() => {
      void checkHealth();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [checkHealth, loadTournaments]);

  useEffect(() => {
    if (activeTournament) {
      void refreshFixtures();
    }
  }, [activeTournament, refreshFixtures]);

  const standings = useMemo(() => {
    if (!activeTournament) return [];
    return tournamentsApi.computeStandings(activeTournament, fixtures);
  }, [activeTournament, fixtures]);

  const createTournament = async (input: CreateTournamentInput): Promise<Tournament> => {
    const created = await tournamentsApi.create(input);
    await loadTournaments();
    setActiveTournamentIdState(created.id);
    return created;
  };

  const setActiveTournamentId = (id: number) => {
    setActiveTournamentIdState(id);
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        activeTournament,
        fixtures,
        standings,
        loadingFixtures,
        serverStatus,
        databaseStatus,
        setActiveTournamentId,
        refreshAll,
        refreshFixtures,
        createTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}
