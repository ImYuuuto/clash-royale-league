import { axiosInstance, apiRequest } from './apiClient';
import type { Player, CreatePlayerInput } from '../types/player';
import { INITIAL_PLAYERS } from '../data/mockData';

const STORAGE_KEY = 'crl_global_roster';

function normalizePlayer(raw: any): Player {
  return {
    id: raw.id,
    name: raw.name,
    player_tag: raw.playerTag || raw.player_tag || '',
    avatar_url: raw.avatarUrl || raw.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    created_at: raw.createdAt || raw.created_at,
    matches_played: raw.matchesPlayed ?? raw.matches_played ?? 0,
    matches_won: raw.matchesWon ?? raw.matches_won ?? 0,
    crowns_for: raw.crownsFor ?? raw.crowns_for ?? 0,
    crowns_against: raw.crownsAgainst ?? raw.crowns_against ?? 0,
    points: raw.points ?? 0,
    win_rate: raw.winRate ?? (raw.matches_played ? Math.round(((raw.matches_won || 0) / raw.matches_played) * 100) : 0),
  };
}

function getStoredPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PLAYERS));
      return INITIAL_PLAYERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PLAYERS;
  }
}

function savePlayers(players: Player[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  } catch (err) {
    console.error('Failed to save players to storage', err);
  }
}

export const playersApi = {
  // GET /api/players
  async getAll(): Promise<Player[]> {
    try {
      const response = await axiosInstance.get('/api/players');
      const list = response.data?.data || response.data;
      if (Array.isArray(list)) {
        const normalized = list.map(normalizePlayer);
        savePlayers(normalized);
        return normalized;
      }
    } catch (error) {
      console.warn('[playersApi] GET /api/players failed, falling back to local cache:', error);
    }
    return getStoredPlayers();
  },

  // GET /api/players/:id
  async getById(id: number): Promise<Player | undefined> {
    try {
      const response = await axiosInstance.get(`/api/players/${id}`);
      const raw = response.data?.data || response.data;
      if (raw && raw.id) {
        return normalizePlayer(raw);
      }
    } catch (error) {
      console.warn(`[playersApi] GET /api/players/${id} failed, checking local cache:`, error);
    }
    const all = await this.getAll();
    return all.find((p) => p.id === id);
  },

  // POST /api/players with { name, playerTag, avatarUrl }
  async create(input: CreatePlayerInput): Promise<Player> {
    const normalizedTag = input.player_tag.startsWith('#')
      ? input.player_tag.toUpperCase()
      : `#${input.player_tag.toUpperCase()}`;

    const payload = {
      name: input.name.trim(),
      playerTag: normalizedTag,
      avatarUrl: input.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    };

    try {
      const response = await axiosInstance.post('/api/players', payload);
      const created = response.data?.data || response.data;
      if (created && created.id) {
        const player = normalizePlayer(created);
        const list = getStoredPlayers();
        list.push(player);
        savePlayers(list);
        return player;
      }
    } catch (error) {
      console.warn('[playersApi] POST /api/players failed, using local storage:', error);
      // If it's a conflict or validation error from server, propagate it
      if ((error as any)?.statusCode >= 400 && (error as any)?.statusCode < 500) {
        throw error;
      }
    }

    const current = getStoredPlayers();
    if (current.some((p) => p.player_tag.toUpperCase() === normalizedTag)) {
      throw new Error(`Player with tag ${normalizedTag} already exists.`);
    }

    const newPlayer: Player = {
      id: Date.now(),
      name: input.name.trim(),
      player_tag: normalizedTag,
      avatar_url: payload.avatarUrl,
      created_at: new Date().toISOString(),
      matches_played: 0,
      matches_won: 0,
      crowns_for: 0,
      crowns_against: 0,
      points: 0,
    };

    current.push(newPlayer);
    savePlayers(current);
    return newPlayer;
  },

  // PATCH /api/players/:id
  async update(id: number, input: Partial<CreatePlayerInput>): Promise<Player> {
    const payload: Record<string, string> = {};
    if (input.name) payload.name = input.name.trim();
    if (input.player_tag) {
      payload.playerTag = input.player_tag.startsWith('#')
        ? input.player_tag.toUpperCase()
        : `#${input.player_tag.toUpperCase()}`;
    }
    if (input.avatar_url) payload.avatarUrl = input.avatar_url;

    try {
      const response = await axiosInstance.patch(`/api/players/${id}`, payload);
      const updated = response.data?.data || response.data;
      if (updated && updated.id) {
        const player = normalizePlayer(updated);
        const list = getStoredPlayers();
        const idx = list.findIndex((p) => p.id === id);
        if (idx !== -1) list[idx] = player;
        savePlayers(list);
        return player;
      }
    } catch (error) {
      console.warn(`[playersApi] PATCH /api/players/${id} failed:`, error);
      if ((error as any)?.statusCode >= 400 && (error as any)?.statusCode < 500) {
        throw error;
      }
    }

    const current = getStoredPlayers();
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Player not found');

    const updated: Player = {
      ...current[index],
      ...input,
      name: input.name ? input.name.trim() : current[index].name,
      player_tag: input.player_tag
        ? (input.player_tag.startsWith('#') ? input.player_tag.toUpperCase() : `#${input.player_tag.toUpperCase()}`)
        : current[index].player_tag,
    };

    current[index] = updated;
    savePlayers(current);
    return updated;
  },

  async delete(id: number): Promise<boolean> {
    const current = getStoredPlayers();
    const filtered = current.filter((p) => p.id !== id);
    savePlayers(filtered);
    return true;
  },
};
