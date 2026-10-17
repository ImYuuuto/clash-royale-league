import { request, ApiResponse } from './apiClient';
import { BackendFixture } from '../types/api';
import { Tournament, CreateTournamentInput, StandingsEntry } from '../types/tournament';
import { INITIAL_TOURNAMENTS } from '../data/mockData';
import { playersApi } from './playersApi';

const STORAGE_KEY = 'crl_tournaments';

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
  // Fetch real fixtures from the backend API: GET /api/tournaments/:id/fixtures
  async getFixtures(tournamentId: number): Promise<BackendFixture[]> {
    try {
      const response = await request<ApiResponse<BackendFixture[]>>(
        `/api/tournaments/${tournamentId}/fixtures`
      );
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn(`[tournamentsApi] Failed to fetch remote fixtures for tournament ${tournamentId}:`, error);
      // Fallback to simulated fixtures generated for the tournament
      return this.getLocalFixtures(tournamentId);
    }
  },

  async getAll(): Promise<Tournament[]> {
    return getStoredTournaments();
  },

  async getById(id: number): Promise<Tournament | undefined> {
    const all = await this.getAll();
    return all.find((t) => t.id === id);
  },

  async create(input: CreateTournamentInput): Promise<Tournament> {
    // Attempt backend endpoint if available
    try {
      const response = await request<ApiResponse<Tournament>>('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (response.success && response.data) {
        const stored = getStoredTournaments();
        stored.unshift(response.data);
        saveTournaments(stored);
        return response.data;
      }
    } catch {
      // Backend does not implement POST /api/tournaments yet.
      // Gracefully store locally to keep application functional.
    }

    const allPlayers = await playersApi.getAll();
    const tournamentPlayers = allPlayers.filter((p) => input.playerIds.includes(p.id));

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

    // Seed local fixtures for this tournament
    this.generateRoundRobinFixtures(newTournament);

    return newTournament;
  },

  generateRoundRobinFixtures(tournament: Tournament): BackendFixture[] {
    const players = tournament.players;
    const fixtures: BackendFixture[] = [];
    let matchNumber = 1;

    const n = players.length;
    // Generate pairings
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

    if (tournament.format === 'double_round_robin') {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          fixtures.push({
            matchId: tournament.id * 100 + matchNumber,
            matchNumber,
            status: 'scheduled',
            isTiebreaker: false,
            player1: {
              id: players[j].id,
              name: players[j].name,
              tag: players[j].player_tag,
              points: 0,
              bannedCards: [],
              availableCards: [],
            },
            player2: {
              id: players[i].id,
              name: players[i].name,
              tag: players[i].player_tag,
              points: 0,
              bannedCards: [],
              availableCards: [],
            },
          });
          matchNumber++;
        }
      }
    }

    try {
      localStorage.setItem(`crl_fixtures_${tournament.id}`, JSON.stringify(fixtures));
    } catch (err) {
      console.error(err);
    }

    return fixtures;
  },

  getLocalFixtures(tournamentId: number): BackendFixture[] {
    try {
      const raw = localStorage.getItem(`crl_fixtures_${tournamentId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }

    // Default sample fixtures for tournament 1
    const stored = getStoredTournaments();
    const tourney = stored.find((t) => t.id === tournamentId);
    if (tourney && tourney.players.length >= 2) {
      return this.generateRoundRobinFixtures(tourney);
    }

    return [];
  },

  saveLocalFixtures(tournamentId: number, fixtures: BackendFixture[]) {
    try {
      localStorage.setItem(`crl_fixtures_${tournamentId}`, JSON.stringify(fixtures));
    } catch (err) {
      console.error(err);
    }
  },

  // Calculate standings from tournament and fixture results
  calculateStandings(tournament: Tournament, fixtures: BackendFixture[]): StandingsEntry[] {
    const playerStatsMap = new Map<number, StandingsEntry>();

    for (const p of tournament.players) {
      playerStatsMap.set(p.id, {
        rank: 0,
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
      if (f.status === 'completed') {
        const p1 = playerStatsMap.get(f.player1.id);
        const p2 = playerStatsMap.get(f.player2.id);

        if (p1 && p2) {
          p1.matches_played += 1;
          p2.matches_played += 1;

          // Points are retrieved from fixture player points if present
          if (f.player1.points > f.player2.points) {
            p1.matches_won += 1;
            p1.points += 3;
            p2.matches_lost += 1;
            p1.form?.push('W');
            p2.form?.push('L');
          } else if (f.player2.points > f.player1.points) {
            p2.matches_won += 1;
            p2.points += 3;
            p1.matches_lost += 1;
            p2.form?.push('W');
            p1.form?.push('L');
          }
        }
      }
    }

    // If no fixtures completed yet, populate from player league history
    const entries = Array.from(playerStatsMap.values());
    if (entries.every((e) => e.matches_played === 0)) {
      for (const entry of entries) {
        const found = tournament.players.find((p) => p.id === entry.player_id);
        if (found && (found.matches_played ?? 0) > 0) {
          entry.matches_played = found.matches_played ?? 0;
          entry.matches_won = found.matches_won ?? 0;
          entry.matches_lost = Math.max(0, (found.matches_played ?? 0) - (found.matches_won ?? 0));
          entry.points = found.points ?? (entry.matches_won * 3);
          entry.crowns_for = found.crowns_for ?? 0;
          entry.crowns_against = found.crowns_against ?? 0;
          entry.crown_diff = entry.crowns_for - entry.crowns_against;
        }
      }
    }

    // Sort by points DESC, then crown_diff DESC, then crowns_for DESC
    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.crown_diff !== a.crown_diff) return b.crown_diff - a.crown_diff;
      return b.crowns_for - a.crowns_for;
    });

    // Check for tiebreakers at top of table
    const topPoints = entries[0]?.points ?? 0;
    const tiedForFirst = entries.filter((e) => e.points === topPoints && e.points > 0);
    const hasTiebreaker = tiedForFirst.length > 1;

    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
      entry.isLeader = idx === 0 && entry.points > 0;
      entry.inTiebreaker = hasTiebreaker && entry.points === topPoints;
    });

    return entries;
  },
};
