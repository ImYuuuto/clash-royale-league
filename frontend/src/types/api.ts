export interface Card {
  id: number;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Champion';
  elixir_cost: number;
  icon_url: string | null;
}

export interface PlayerStats {
  id: number;
  name: string;
  tag: string;
  points: number;
  bannedCards?: Card[];
  availableCards?: Card[];
}

export interface BackendFixture {
  matchId: number;
  matchNumber: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  isTiebreaker: boolean;
  player1: PlayerStats;
  player2: PlayerStats;
}

export interface GameRegistrationPayload {
  gameNumber: number;
  winnerId: number;
  player1: {
    crowns: number;
    cardIds: number[];
  };
  player2: {
    crowns: number;
    cardIds: number[];
  };
}

export interface GameRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    matchGameId: number;
    fixtureCompleted: boolean;
    winnerId: number;
  };
}

export interface HealthStatus {
  apiReady: boolean;
  databaseConnected: boolean;
  message?: string;
}
