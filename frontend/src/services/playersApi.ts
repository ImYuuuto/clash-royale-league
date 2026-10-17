import { Player, CreatePlayerInput } from '../types/player';
import { INITIAL_PLAYERS } from '../data/mockData';
import { request, ApiResponse } from './apiClient';

const STORAGE_KEY = 'crl_global_roster';

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
  async getAll(): Promise<Player[]> {
    // Attempt backend endpoint if developer adds it
    try {
      const response = await request<ApiResponse<Player[]>>('/api/players');
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Backend does not expose GET /api/players yet; use local repository
    }
    return getStoredPlayers();
  },

  async getById(id: number): Promise<Player | undefined> {
    const all = await this.getAll();
    return all.find((p) => p.id === id);
  },

  async create(input: CreatePlayerInput): Promise<Player> {
    try {
      const response = await request<ApiResponse<Player>>('/api/players', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (response.success && response.data) {
        const list = getStoredPlayers();
        list.push(response.data);
        savePlayers(list);
        return response.data;
      }
    } catch {
      // Fallback to local store
    }

    const current = getStoredPlayers();
    // Validate unique tag
    const normalizedTag = input.player_tag.startsWith('#')
      ? input.player_tag.toUpperCase()
      : `#${input.player_tag.toUpperCase()}`;

    if (current.some((p) => p.player_tag.toUpperCase() === normalizedTag)) {
      throw new Error(`Player with tag ${normalizedTag} already exists.`);
    }

    const newPlayer: Player = {
      id: Date.now(),
      name: input.name.trim(),
      player_tag: normalizedTag,
      avatar_url: input.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
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

  async update(id: number, input: Partial<CreatePlayerInput>): Promise<Player> {
    try {
      const response = await request<ApiResponse<Player>>(`/api/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      if (response.success && response.data) {
        return response.data;
      }
    } catch {
      // Fallback
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
    try {
      await request(`/api/players/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }

    const current = getStoredPlayers();
    const filtered = current.filter((p) => p.id !== id);
    savePlayers(filtered);
    return true;
  },
};
