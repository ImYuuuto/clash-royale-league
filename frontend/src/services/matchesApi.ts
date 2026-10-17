import { request, ApiResponse } from './apiClient';
import { GameRegistrationPayload, GameRegistrationResponse, Card } from '../types/api';
import { tournamentsApi } from './tournamentsApi';

export interface RegisteredGameRecord {
  id: number;
  matchId: number;
  gameNumber: number;
  winnerId: number;
  player1: {
    id: number;
    crowns: number;
    cardIds: number[];
  };
  player2: {
    id: number;
    crowns: number;
    cardIds: number[];
  };
  timestamp: string;
}

const GAMES_STORAGE_KEY = 'crl_match_games';

export function getStoredGames(): RegisteredGameRecord[] {
  try {
    const raw = localStorage.getItem(GAMES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredGames(games: RegisteredGameRecord[]) {
  try {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    console.error('Failed to save games', err);
  }
}

export const matchesApi = {
  // Real backend endpoint: POST /api/matches/:matchId/games
  async registerGame(
    matchId: number,
    payload: GameRegistrationPayload,
    tournamentId: number,
    p1Id: number,
    p2Id: number
  ): Promise<GameRegistrationResponse> {
    try {
      const response = await request<GameRegistrationResponse>(
        `/api/matches/${matchId}/games`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      // Record in local history for analytics
      this.recordLocalGame(matchId, payload, p1Id, p2Id);

      return response;
    } catch (error) {
      console.warn(`[matchesApi] Backend POST /api/matches/${matchId}/games failed or unavailable:`, error);
      
      // If server returned a business rule error (409, 400), rethrow it
      if ((error as { statusCode?: number }).statusCode === 409 || (error as { statusCode?: number }).statusCode === 400) {
        throw error;
      }

      // If backend is offline, update local fixtures & record game
      this.recordLocalGame(matchId, payload, p1Id, p2Id);

      // Update local fixtures status
      const fixtures = tournamentsApi.getLocalFixtures(tournamentId);
      const fixture = fixtures.find((f) => f.matchId === matchId);
      if (fixture) {
        if (payload.winnerId === p1Id) {
          fixture.player1.points = (fixture.player1.points || 0) + 3;
        } else {
          fixture.player2.points = (fixture.player2.points || 0) + 3;
        }
        fixture.status = 'completed';
        tournamentsApi.saveLocalFixtures(tournamentId, fixtures);
      }

      return {
        success: true,
        message: 'Game recorded successfully (Local state synchronized).',
        data: {
          matchGameId: Date.now(),
          fixtureCompleted: true,
          winnerId: payload.winnerId,
        },
      };
    }
  },

  recordLocalGame(
    matchId: number,
    payload: GameRegistrationPayload,
    p1Id: number,
    p2Id: number
  ) {
    const list = getStoredGames();
    list.push({
      id: Date.now(),
      matchId,
      gameNumber: payload.gameNumber,
      winnerId: payload.winnerId,
      player1: {
        id: p1Id,
        crowns: payload.player1.crowns,
        cardIds: payload.player1.cardIds,
      },
      player2: {
        id: p2Id,
        crowns: payload.player2.crowns,
        cardIds: payload.player2.cardIds,
      },
      timestamp: new Date().toISOString(),
    });
    saveStoredGames(list);
  },

  // Calculate card cooldowns based on recent games for a player
  calculatePlayerCooldowns(
    playerId: number,
    cooldownDuration: number,
    allCards: Card[]
  ): { bannedCards: Card[]; availableCards: Card[]; remainingMatches: Map<number, number> } {
    if (cooldownDuration <= 0) {
      return {
        bannedCards: [],
        availableCards: allCards,
        remainingMatches: new Map(),
      };
    }

    const allGames = getStoredGames();
    // Filter games involving this player, newest first
    const playerGames = allGames
      .filter((g) => g.player1.id === playerId || g.player2.id === playerId)
      .sort((a, b) => b.id - a.id);

    const recentGames = playerGames.slice(0, cooldownDuration);
    const bannedCardIdToRemaining = new Map<number, number>();

    recentGames.forEach((game, gameIdx) => {
      const cardIds = game.player1.id === playerId ? game.player1.cardIds : game.player2.cardIds;
      const gamesRemaining = cooldownDuration - gameIdx;
      for (const cardId of cardIds) {
        if (!bannedCardIdToRemaining.has(cardId) || (bannedCardIdToRemaining.get(cardId)! < gamesRemaining)) {
          bannedCardIdToRemaining.set(cardId, gamesRemaining);
        }
      }
    });

    const bannedCards = allCards.filter((c) => bannedCardIdToRemaining.has(c.id));
    const availableCards = allCards.filter((c) => !bannedCardIdToRemaining.has(c.id));

    return {
      bannedCards,
      availableCards,
      remainingMatches: bannedCardIdToRemaining,
    };
  },

  // Check if player already registered this exact 8-card combination in the tournament
  checkDuplicateDeck(playerId: number, cardIds: number[]): boolean {
    if (cardIds.length !== 8) return false;
    const sortedHash = [...cardIds].sort((a, b) => a - b).join('-');
    
    const allGames = getStoredGames();
    return allGames.some((g) => {
      if (g.player1.id === playerId) {
        const h = [...g.player1.cardIds].sort((a, b) => a - b).join('-');
        if (h === sortedHash) return true;
      }
      if (g.player2.id === playerId) {
        const h = [...g.player2.cardIds].sort((a, b) => a - b).join('-');
        if (h === sortedHash) return true;
      }
      return false;
    });
  },
};
