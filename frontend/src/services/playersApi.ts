import { axiosInstance } from './apiClient';
import type { Player, CreatePlayerInput } from '../types/player';
const STORAGE_KEY = 'crl_global_roster';

function normalizePlayer(raw: any): Player {
  return {
    id: Number(raw.id),
    name: raw.name,
    player_tag: raw.playerTag || raw.player_tag || '',
    avatar_url: raw.avatarUrl ?? raw.avatar_url ?? undefined,
    created_at: raw.createdAt || raw.created_at,
    matches_played: Number(raw.matchesPlayed ?? raw.matches_played) || 0,
    matches_won: Number(raw.matchesWon ?? raw.matches_won) || 0,
    crowns_for: Number(raw.crownsFor ?? raw.crowns_for) || 0,
    crowns_against: Number(raw.crownsAgainst ?? raw.crowns_against) || 0,
    points: Number(raw.points) || 0,
    win_rate: Number(raw.winRate) || 0,
  };
}

function getCachedPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function cachePlayers(players: Player[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(players)); } catch { /* cache is optional */ }
}

export const playersApi = {
  async getAll(): Promise<Player[]> {
    try {
      const response = await axiosInstance.get('/api/players');
      const list = response.data?.data || response.data;
      if (Array.isArray(list)) {
        const players = list.map(normalizePlayer);
        cachePlayers(players);
        return players;
      }
      return [];
    } catch (error) {
      console.warn('[playersApi] Could not load players from backend:', error);
      return getCachedPlayers();
    }
  },

  async getById(id: number): Promise<Player | undefined> {
    try {
      const response = await axiosInstance.get(`/api/players/${id}`);
      const raw = response.data?.data || response.data;
      return raw?.id ? normalizePlayer(raw) : undefined;
    } catch (error) {
      console.warn(`[playersApi] Could not load player ${id} from backend:`, error);
      return getCachedPlayers().find((player) => player.id === id);
    }
  },

  async create(input: CreatePlayerInput): Promise<Player> {
    const normalizedTag = input.player_tag.startsWith('#')
      ? input.player_tag.toUpperCase()
      : `#${input.player_tag.toUpperCase()}`;
    const response = await axiosInstance.post('/api/players', {
      name: input.name.trim(),
      playerTag: normalizedTag,
      avatarUrl: input.avatar_url || '',
    });
    const raw = response.data?.data || response.data;
    if (!raw?.id) throw new Error('The backend did not return the created player.');
    const player = normalizePlayer(raw);
    cachePlayers([...getCachedPlayers().filter((item) => item.id !== player.id), player]);
    return player;
  },

  async update(id: number, input: Partial<CreatePlayerInput>): Promise<Player> {
    const payload: Record<string, string> = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.player_tag !== undefined) {
      payload.playerTag = input.player_tag.startsWith('#') ? input.player_tag.toUpperCase() : `#${input.player_tag.toUpperCase()}`;
    }
    if (input.avatar_url !== undefined) payload.avatarUrl = input.avatar_url;
    const response = await axiosInstance.patch(`/api/players/${id}`, payload);
    const raw = response.data?.data || response.data;
    if (!raw?.id) throw new Error('The backend did not return the updated player.');
    const player = normalizePlayer(raw);
    cachePlayers([...getCachedPlayers().filter((item) => item.id !== id), player]);
    return player;
  },

  async delete(id: number): Promise<boolean> {
    await axiosInstance.delete(`/api/players/${id}`);
    cachePlayers(getCachedPlayers().filter((player) => player.id !== id));
    return true;
  },
};
