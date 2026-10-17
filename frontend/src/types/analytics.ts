export interface PlayerAnalytics {
  playerId: number;
  playerName: string;
  playerTag: string;
  winRate: number;
  matchesWon: number;
  matchesPlayed: number;
  crownEfficiency: number; // Crowns scored per match
  clutchPerformance: number; // Win rate in decider games (Game 3/Game 5)
  deckDiversity: number; // Number of unique decks played
  totalDecksPlayed: number;
}

export interface CardAnalytics {
  cardId: number;
  cardName: string;
  rarity: string;
  elixirCost: number;
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
