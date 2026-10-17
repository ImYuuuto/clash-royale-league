import type { Player } from './player';

export type TournamentFormat = 'single_round_robin' | 'double_round_robin';
export type CardCooldownDuration = 0 | 2 | 3;
export type MatchFormatBo = 3 | 5;
export type TiebreakerMode = 'bo5' | 'head_to_head' | 'shared_victory';
export type TournamentStatus = 'draft' | 'active' | 'tiebreaker' | 'completed';

export interface TournamentRules {
  cooldown_duration: CardCooldownDuration;
  ban_duplicate_decks: boolean;
  match_format_bo: MatchFormatBo;
  tiebreaker_mode: TiebreakerMode;
}

export interface Tournament {
  id: number;
  name: string;
  status: TournamentStatus;
  format: TournamentFormat;
  winner_player_id?: number | null;
  winner_name?: string | null;
  cooldown_duration: CardCooldownDuration;
  ban_duplicate_decks: boolean;
  match_format_bo: MatchFormatBo;
  tiebreaker_mode: TiebreakerMode;
  created_at: string;
  players: Player[];
}

export interface CreateTournamentInput {
  name: string;
  format: TournamentFormat;
  cooldown_duration: CardCooldownDuration;
  ban_duplicate_decks: boolean;
  match_format_bo: MatchFormatBo;
  tiebreaker_mode: TiebreakerMode;
  playerIds: number[];
}

export interface StandingsEntry {
  rank: number;
  player_id: number;
  player_name: string;
  player_tag: string;
  avatar_url?: string;
  points: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  crowns_for: number;
  crowns_against: number;
  crown_diff: number;
  form?: ('W' | 'L')[];
  isLeader?: boolean;
  inTiebreaker?: boolean;
}
