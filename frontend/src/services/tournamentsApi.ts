import { axiosInstance } from './apiClient';
import type { BackendFixture } from '../types/api';
import type { Tournament, CreateTournamentInput, StandingsEntry } from '../types/tournament';
import { playersApi } from './playersApi';

const STORAGE_KEY = 'crl_tournaments';

function normalizeTournament(raw: any): Tournament {
  const players = Array.isArray(raw.players) ? raw.players.map((player: any) => ({
    id: Number(player.id),
    name: player.name,
    player_tag: player.playerTag ?? player.player_tag ?? player.tag ?? '',
    avatar_url: player.avatarUrl ?? player.avatar_url,
        points: Number(player.points) || 0,
        matches_played: Number(player.matchesPlayed ?? player.matches_played) || 0,
        matches_won: Number(player.matchesWon ?? player.matches_won) || 0,
    crowns_for: Number(player.crownsFor ?? player.crowns_for) || 0,
    crowns_against: Number(player.crownsAgainst ?? player.crowns_against) || 0,
  })) : [];
  return {
    id: Number(raw.id),
    name: raw.name,
    status: raw.status || 'draft',
    format: raw.format || 'single_round_robin',
    winner_player_id: raw.winnerPlayerId ?? raw.winner_player_id ?? null,
    winner_name: raw.winnerName ?? raw.winner_name,
    cooldown_duration: raw.cooldownDuration ?? raw.cooldown_duration ?? 2,
    ban_duplicate_decks: raw.banDuplicateDecks ?? raw.ban_duplicate_decks ?? true,
    match_format_bo: 1,
    tiebreaker_mode: raw.tiebreakerMode ?? raw.tiebreaker_mode ?? 'bo5',
    created_at: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    players,
  };
}

function getCachedTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function cacheTournaments(tournaments: Tournament[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments)); } catch { /* cache is optional */ }
}

export const tournamentsApi = {
  async getAll(): Promise<Tournament[]> {
    try {
      const response = await axiosInstance.get('/api/tournaments');
      const list = response.data?.data || response.data;
      if (!Array.isArray(list)) return [];
      const tournaments = await Promise.all(list.map(async (item: any) => {
        const summary = normalizeTournament(item);
        if (Array.isArray(item.players)) return summary;
        try {
          const detailResponse = await axiosInstance.get(`/api/tournaments/${summary.id}`);
          const detail = detailResponse.data?.data || detailResponse.data;
          return detail?.id ? normalizeTournament(detail) : summary;
        } catch (error) {
          console.warn(`[tournamentsApi] Could not load player details for tournament ${summary.id}:`, error);
          return summary;
        }
      }));
      cacheTournaments(tournaments);
      return tournaments;
    } catch (error) {
      console.warn('[tournamentsApi] Could not load tournaments from backend:', error);
      return getCachedTournaments();
    }
  },

  async getById(id: number): Promise<Tournament | undefined> {
    try {
      const response = await axiosInstance.get(`/api/tournaments/${id}`);
      const raw = response.data?.data || response.data;
      if (raw?.id) return normalizeTournament(raw);
    } catch (error) {
      console.warn(`[tournamentsApi] Could not load tournament ${id} from backend:`, error);
    }
    return getCachedTournaments().find((tournament) => tournament.id === id);
  },

  async create(input: CreateTournamentInput): Promise<Tournament> {
    const players = await playersApi.getAll();
    const enrolledPlayers = players.filter((player) => input.playerIds.includes(player.id));
    const createdResponse = await axiosInstance.post('/api/tournaments', {
      name: input.name.trim(),
      cooldownDuration: input.cooldown_duration,
      banDuplicateDecks: input.ban_duplicate_decks,
      matchFormatBo: input.match_format_bo,
    });
    const created = createdResponse.data?.data || createdResponse.data;
    if (!created?.id) throw new Error('The backend did not return the created tournament.');
    const id = Number(created.id);

    await axiosInstance.post(`/api/tournaments/${id}/players`, { playerIds: input.playerIds });
    await axiosInstance.post(`/api/tournaments/${id}/fixtures/generate`);
    await axiosInstance.patch(`/api/tournaments/${id}`, { status: 'active' });

    const tournament = await this.getById(id) || normalizeTournament(created);
    if (!tournament.players.length) tournament.players = enrolledPlayers;
    cacheTournaments([tournament, ...getCachedTournaments().filter((item) => item.id !== id)]);
    return tournament;
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/tournaments/${id}`);
    cacheTournaments(getCachedTournaments().filter((tournament) => tournament.id !== id));
  },

  async addPlayers(tournamentId: number, playerIds: number[]): Promise<void> {
    await axiosInstance.post(`/api/tournaments/${tournamentId}/players`, { playerIds });
  },

  async removePlayer(tournamentId: number, playerId: number): Promise<void> {
    await axiosInstance.delete(`/api/tournaments/${tournamentId}/players/${playerId}`);
  },

  async generateFixtures(tournamentId: number): Promise<void> {
    await axiosInstance.post(`/api/tournaments/${tournamentId}/fixtures/generate`);
  },

  async getFixtures(tournamentId: number): Promise<BackendFixture[]> {
    try {
      const response = await axiosInstance.get(`/api/tournaments/${tournamentId}/fixtures`);
      const fixtures = response.data?.data || response.data;
      return Array.isArray(fixtures)
        ? fixtures.map((fixture: BackendFixture) => ({ ...fixture, source: 'backend' as const }))
        : [];
    } catch (error) {
      console.warn(`[tournamentsApi] Could not load fixtures for tournament ${tournamentId}:`, error);
      return [];
    }
  },

  async createTiebreaker(tournamentId: number, playerIds: number[]): Promise<void> {
    await axiosInstance.post(`/api/tournaments/${tournamentId}/tiebreaker`, { playerIds });
  },

  async updateStatus(tournamentId: number, status: 'active' | 'completed' | 'tiebreaker'): Promise<void> {
    await axiosInstance.patch(`/api/tournaments/${tournamentId}`, { status });
  },

  computeStandings(tournament: Tournament, fixtures: BackendFixture[]): StandingsEntry[] {
    const playerMap = new Map<number, StandingsEntry>();
    for (const player of tournament.players) {
      playerMap.set(player.id, {
        rank: 1,
        player_id: player.id,
        player_name: player.name,
        player_tag: player.player_tag,
        avatar_url: player.avatar_url,
        points: Number(player.points) || 0,
        matches_played: Number(player.matches_played) || 0,
        matches_won: Number(player.matches_won) || 0,
        matches_lost: Math.max(0, (Number(player.matches_played) || 0) - (Number(player.matches_won) || 0)),
        crowns_for: Number(player.crowns_for) || 0,
        crowns_against: Number(player.crowns_against) || 0,
        crown_diff: (Number(player.crowns_for) || 0) - (Number(player.crowns_against) || 0),
        form: [],
      });
    }

    for (const entry of playerMap.values()) {
      const player = tournament.players.find((candidate) => candidate.id === entry.player_id);
      entry.crowns_for = Number(player?.crowns_for) || 0;
      entry.crowns_against = Number(player?.crowns_against) || 0;
      entry.crown_diff = entry.crowns_for - entry.crowns_against;
    }

    const standings = [...playerMap.values()].sort((a, b) =>
      b.points - a.points || b.matches_won - a.matches_won || b.crown_diff - a.crown_diff || a.player_name.localeCompare(b.player_name),
    );
    standings.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.isLeader = index === 0 && entry.points > 0;
    });
    return standings;
  },
};
