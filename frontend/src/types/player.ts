export interface Player {
  id: number;
  name: string;
  player_tag: string;
  avatar_url?: string;
  created_at?: string;
  // Computed / league stats
  matches_played?: number;
  matches_won?: number;
  crowns_for?: number;
  crowns_against?: number;
  points?: number;
  win_rate?: number;
}

export interface CreatePlayerInput {
  name: string;
  player_tag: string;
  avatar_url?: string;
}
