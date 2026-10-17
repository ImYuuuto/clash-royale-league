import { axiosInstance } from './apiClient';
import type { BackendFixture } from '../types/api';
import type { Tournament, CreateTournamentInput, StandingsEntry } from '../types/tournament';
import { INITIAL_TOURNAMENTS } from '../data/mockData';
import { playersApi } from './playersApi';

const STORAGE_KEY = 'crl_tournaments';

function normalizeTournament(raw: any): Tournament {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status || 'draft',
    format: raw.format || 'single_round_robin',
    winner_player_id: raw.winnerPlayerId ?? raw.winner_player_id ?? null,
    winner_name: raw.winnerName ?? raw.winner_name,
    cooldown_duration: raw.cooldownDuration ?? raw.cooldown_duration ?? 2,
    ban_duplicate_decks: raw.banDuplicateDecks ?? raw.ban_duplicate_decks ?? true,
    match_format_bo: raw.matchFormatBo ?? raw.match_format_bo ?? 3,
    tiebreaker_mode: raw.tiebreakerMode ?? raw.tiebreaker_mode ?? 'bo5',
    created_at: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    players: Array.isArray(raw.players) ? raw.players : [],
  };
}

function getStoredTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOURNAMENTS));
      return INITIAL_TOURNAMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TOURNAMENTS;
  }
}

function saveTournaments(tournaments: Tournament[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  } catch (err) {
    console.error('Failed to save tournaments to storage', err);
  }
}

export const tournamentsApi = {
  // GET /api/tournaments
  async getAll(): Promise<Tournament[]> {
    try {
      const response = await axiosInstance.get('/api/tournaments');
      const list = response.data?.data || response.data;
      if (Array.isArray(list)) {
        const normalized = list.map(normalizeTournament);
        saveTournaments(normalized);
        return normalized;
      }
    } catch (error) {
      console.warn('[tournamentsApi] GET /api/tournaments failed, using local storage:', error);
    }
    return getStoredTournaments();
  },

  // GET /api/tournaments/:id
  async getById(id: number): Promise<Tournament | undefined> {
    try {
      const response = await axiosInstance.get(`/api/tournaments/${id}`);
      const raw = response.data?.data || response.data;
      if (raw && raw.id) {
        return normalizeTournament(raw);
      }
    } catch (error) {
      console.warn(`[tournamentsApi] GET /api/tournaments/${id} failed, using local cache:`, error);
    }
    const all = await this.getAll();
    return all.find((t) => t.id === id);
  },

  // Full tournament creation flow as per notesForFrontend.md:
  // 1. POST /api/tournaments
  // 2. POST /api/tournaments/:id/players
  // 3. POST /api/tournaments/:id/fixtures/generate
  // 4. PATCH /api/tournaments/:id -> { status: 'active' }
  async create(input: CreateTournamentInput): Promise<Tournament> {
    const allPlayers = await playersApi.getAll();
    const tournamentPlayers = allPlayers.filter((p) => input.playerIds.includes(p.id));

    try {
      // Step 1: Create tournament
      const createRes = await axiosInstance.post('/api/tournaments', {
        name: input.name.trim(),
        cooldownDuration: input.cooldown_duration,
        banDuplicateDecks: input.ban_duplicate_decks,
        matchFormatBo: input.match_format_bo,
      });
      const createdTournament = createRes.data?.data || createRes.data;
      const tournamentId = createdTournament.id;

      // Step 2: Enroll players
      if (input.playerIds.length >= 2) {
        await axiosInstance.post(`/api/tournaments/${tournamentId}/players`, {
          playerIds: input.playerIds,
        });

        // Step 3: Generate fixtures
        await axiosInstance.post(`/api/tournaments/${tournamentId}/fixtures/generate`);

        // Step 4: Set status to active
        await axiosInstance.patch(`/api/tournaments/${tournamentId}`, {
          status: 'active',
        });
      }

      // Fetch fresh tournament details
      const fresh = await this.getById(tournamentId);
      if (fresh) {
        fresh.players = tournamentPlayers;
        const stored = getStoredTournaments();
        stored.unshift(fresh);
        saveTournaments(stored);
        return fresh;
      }
    } catch (error) {
      console.warn('[tournamentsApi] Remote tournament creation flow encountered error, falling back locally:', error);
      if ((error as any)?.statusCode >= 400 && (error as any)?.statusCode < 500) {
        throw error;
      }
    }

    // Local fallback
    const newTournament: Tournament = {
      id: Date.now(),
      name: input.name,
      status: 'active',
      format: input.format,
      winner_player_id: null,
      cooldown_duration: input.cooldown_duration,
      ban_duplicate_decks: input.ban_duplicate_decks,
      match_format_bo: input.match_format_bo,
      tiebreaker_mode: input.tiebreaker_mode,
      created_at: new Date().toISOString(),
      players: tournamentPlayers,
    };

    const stored = getStoredTournaments();
    stored.unshift(newTournament);
    saveTournaments(stored);

    this.generateRoundRobinFixtures(newTournament);
    return newTournament;
  },

  // POST /api/tournaments/:id/players
  async addPlayers(tournamentId: number, playerIds: number[]): Promise<void> {
    try {
      await axiosInstance.post(`/api/tournaments/${tournamentId}/players`, { playerIds });
    } catch (error) {
      console.warn(`[tournamentsApi] Failed to add players to tournament ${tournamentId}:`, error);
      throw error;
    }
  },

  // DELETE /api/tournaments/:id/players/:playerId
  async removePlayer(tournamentId: number, playerId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/api/tournaments/${tournamentId}/players/${playerId}`);
    } catch (error) {
      console.warn(`[tournamentsApi] Failed to remove player ${playerId}:`, error);
      throw error;
    }
  },

  // POST /api/tournaments/:id/fixtures/generate
  async generateFixtures(tournamentId: number): Promise<void> {
    try {
      await axiosInstance.post(`/api/tournaments/${tournamentId}/fixtures/generate`);
    } catch (error) {
      console.warn(`[tournamentsApi] Failed to generate fixtures for ${tournamentId}:`, error);
      throw error;
    }
  },

  // GET /api/tournaments/:id/fixtures
  async getFixtures(tournamentId: number): Promise<BackendFixture[]> {
    try {
      const response = await axiosInstance.get(`/api/tournaments/${tournamentId}/fixtures`);
      const fixtures = response.data?.data || response.data;
      if (Array.isArray(fixtures)) {
        return fixtures;
      }
    } catch (error) {
      console.warn(`[tournamentsApi] GET /api/tournaments/${tournamentId}/fixtures failed, using local fixtures:`, error);
    }
    return this.getLocalFixtures(tournamentId);
  },

  // POST /api/tournaments/:id/tiebreaker with { playerIds: [p1, p2] }
  async createTiebreaker(tournamentId: number, playerIds: number[]): Promise<void> {
    try {
      await axiosInstance.post(`/api/tournaments/${tournamentId}/tiebreaker`, { playerIds });
    } catch (error) {
      console.warn(`[tournamentsApi] Failed to create tiebreaker:`, error);
      throw error;
    }
  },

  // PATCH /api/tournaments/:id with { status: 'completed' | 'active' }
  async updateStatus(tournamentId: number, status: 'active' | 'completed' | 'tiebreaker'): Promise<void> {
    try {
      await axiosInstance.patch(`/api/tournaments/${tournamentId}`, { status });
    } catch (error) {
      console.warn(`[tournamentsApi] Failed to update tournament ${tournamentId} status:`, error);
      throw error;
    }
  },

  // Local helpers
  getLocalFixtures(tournamentId: number): BackendFixture[] {
    try {
      const raw = localStorage.getItem(`crl_fixtures_${tournamentId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalFixtures(tournamentId: number, fixtures: BackendFixture[]): void {
    try {
      localStorage.setItem(`crl_fixtures_${tournamentId}`, JSON.stringify(fixtures));
    } catch (err) {
      console.error('Failed to save fixtures locally:', err);
    }
  },

  generateRoundRobinFixtures(tournament: Tournament): BackendFixture[] {
    const players = tournament.players;
    const fixtures: BackendFixture[] = [];
    let matchNumber = 1;
    const n = players.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        fixtures.push({
          matchId: tournament.id * 100 + matchNumber,
          matchNumber,
          status: 'scheduled',
          isTiebreaker: false,
          player1: {
            id: players[i].id,
            name: players[i].name,
            tag: players[i].player_tag,
            points: 0,
            bannedCards: [],
            availableCards: [],
          },
          player2: {
            id: players[j].id,
            name: players[j].name,
            tag: players[j].player_tag,
            points: 0,
            bannedCards: [],
            availableCards: [],
          },
        });
        matchNumber++;
      }
    }

    this.saveLocalFixtures(tournament.id, fixtures);
    return fixtures;
  },

  computeStandings(tournament: Tournament, fixtures: BackendFixture[]): StandingsEntry[] {
    const playerMap = new Map<number, StandingsEntry>();
    for (const p of tournament.players) {
      playerMap.set(p.id, {
        rank: 1,
        player_id: p.id,
        player_name: p.name,
        player_tag: p.player_tag,
        avatar_url: p.avatar_url,
        points: 0,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        crowns_for: 0,
        crowns_against: 0,
        crown_diff: 0,
        form: [],
      });
    }

    for (const f of fixtures) {
      if (f.status === 'completed' && !f.isTiebreaker) {
        const s1 = playerMap.get(f.player1.id);
        const s2 = playerMap.get(f.player2.id);
        if (s1 && s2) {
          s1.matches_played++;
          s2.matches_played++;
          if (f.player1.points > f.player2.points) {
            s1.matches_won++;
            s1.points += 3;
            s1.form?.push('W');
            s2.matches_lost++;
            s2.form?.push('L');
          } else {
            s2.matches_won++;
            s2.points += 3;
            s2.form?.push('W');
            s1.matches_lost++;
            s1.form?.push('L');
          }
          s1.crown_diff = s1.crowns_for - s1.crowns_against;
          s2.crown_diff = s2.crowns_for - s2.crowns_against;
        }
      }
    }

    const standings = Array.from(playerMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
      return b.crown_diff - a.crown_diff;
    });

    standings.forEach((entry, idx) => {
      entry.rank = idx + 1;
      entry.isLeader = idx === 0 && entry.points > 0;
    });

    return standings;
  },
};
