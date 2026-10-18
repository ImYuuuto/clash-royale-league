export interface PlayerAnalytics {
  playerId: number;
  playerName: string;
  playerTag: string;
  avatarUrl?: string | null;
  winRate: number;
  matchesWon: number;
  matchesPlayed: number;
  crownEfficiency: number; // Crowns scored per match
  clutchPerformance: number | null; // Backend overview does not expose the per-player denominator
  deckDiversity: number; // Number of unique decks played
  totalDecksPlayed: number;
}

export interface CardAnalytics {
  cardId: number;
  cardName: string;
  rarity: string;
  elixirCost: number;
  iconUrl?: string | null;
  usageCount: number;
  winCount: number;
  winRate: number;
  exhaustionCount: number; // How many times it hit cooldown
}

export interface TournamentAnalyticsOverview {
  totalMatches: number;
  matchesCompleted: number;
  totalGames: number;
  totalCrowns: number;
  averageCrownsPerGame: number;
  averageDeckElixir: number;
  playerAnalytics: PlayerAnalytics[];
  cardAnalytics: CardAnalytics[];
  elixirDistribution: { cost: number; count: number }[];
  rarityDistribution: { rarity: string; count: number }[];
}
