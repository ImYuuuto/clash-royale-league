import { axiosInstance } from './apiClient';
import type { TournamentAnalyticsOverview, PlayerAnalytics, CardAnalytics } from '../types/analytics';
import type { Tournament } from '../types/tournament';
import type { BackendFixture } from '../types/api';

export const analyticsApi = {
  async fetchRemoteTournamentAnalytics(tournamentId: number): Promise<any | null> {
    try {
      const response = await axiosInstance.get(`/api/tournaments/${tournamentId}/analytics`);
      return response.data?.data || response.data;
    } catch (error) {
      console.warn(`[analyticsApi] Could not load tournament analytics ${tournamentId}:`, error);
      return null;
    }
  },

  async fetchPlayerAnalytics(tournamentId: number, playerId: number): Promise<any | null> {
    try {
      const response = await axiosInstance.get(`/api/tournaments/${tournamentId}/analytics/players/${playerId}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.warn(`[analyticsApi] Could not load player analytics ${playerId}:`, error);
      return null;
    }
  },

  getTournamentAnalytics(
    tournament: Tournament,
    fixtures: BackendFixture[],
    remoteData?: any,
  ): TournamentAnalyticsOverview {
    const standings = Array.isArray(remoteData?.standings) ? remoteData.standings : [];
    const playerAnalytics: PlayerAnalytics[] = standings.length
      ? standings.map((row: any) => ({
        playerId: Number(row.playerId),
        playerName: row.name,
        playerTag: row.playerTag || '',
        winRate: Math.round((Number(row.matchWinRate) || 0) * 100),
        matchesWon: Number(row.matchesWon) || 0,
        matchesPlayed: Number(row.matchesPlayed) || 0,
        crownEfficiency: Number(row.crownEfficiency) || 0,
        clutchPerformance: null,
        deckDiversity: Number(row.uniqueDecks) || 0,
        totalDecksPlayed: Number(row.matchesPlayed) || 0,
      }))
      : tournament.players.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        playerTag: player.player_tag,
        winRate: 0,
        matchesWon: 0,
        matchesPlayed: 0,
        crownEfficiency: 0,
        clutchPerformance: null,
        deckDiversity: 0,
        totalDecksPlayed: 0,
      }));

    const cards: CardAnalytics[] = (Array.isArray(remoteData?.cards) ? remoteData.cards : []).map((card: any) => ({
      cardId: Number(card.cardId),
      cardName: card.name,
      rarity: card.rarity,
      elixirCost: Number(card.elixirCost) || 0,
      usageCount: Number(card.uses) || 0,
      winCount: Number(card.gameWins) || 0,
      winRate: Math.round((Number(card.winRate) || 0) * 100),
      exhaustionCount: Number(card.uses) || 0,
    }));
    const elixirDistribution = Array.from({ length: 9 }, (_, index) => ({
      cost: index + 1,
      count: cards.filter((card) => card.elixirCost === index + 1)
        .reduce((total, card) => total + card.usageCount, 0),
    }));
    const rarityDistribution = ['Common', 'Rare', 'Epic', 'Legendary', 'Champion'].map((rarity) => ({
      rarity,
      count: cards.filter((card) => card.rarity === rarity)
        .reduce((total, card) => total + card.usageCount, 0),
    }));
    const elixirRows = Array.isArray(remoteData?.averageDeckElixirCost) ? remoteData.averageDeckElixirCost : [];
    const deckCount = elixirRows.reduce((total: number, row: any) => total + (Number(row.decks) || 0), 0);
    const averageDeckElixir = deckCount
      ? elixirRows.reduce((total: number, row: any) => total + (Number(row.averageElixirCost) || 0) * (Number(row.decks) || 0), 0) / deckCount
      : 0;
    const totalCrowns = standings.reduce((total: number, row: any) => total + (Number(row.crownsFor) || 0), 0);
    const totalGames = Number(remoteData?.summary?.gamesPlayed) || 0;

    return {
      totalMatches: fixtures.length,
      matchesCompleted: fixtures.filter((fixture) => fixture.status === 'completed').length,
      totalGames,
      totalCrowns,
      averageCrownsPerGame: totalGames ? Number((totalCrowns / totalGames).toFixed(1)) : 0,
      averageDeckElixir: Number(averageDeckElixir.toFixed(2)),
      playerAnalytics,
      cardAnalytics: cards,
      elixirDistribution,
      rarityDistribution,
    };
  },
};
