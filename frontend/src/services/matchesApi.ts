import { axiosInstance } from './apiClient';
import type { GameRegistrationPayload, GameRegistrationResponse, Card } from '../types/api';
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
      const response = await axiosInstance.post(
        `/api/matches/${matchId}/games`,
        payload
      );

      this.recordLocalGame(matchId, payload, p1Id, p2Id);
      return response.data;
    } catch (error) {
      console.warn(`[matchesApi] Backend POST /api/matches/${matchId}/games failed:`, error);

      // If server returned a business rule error (409, 400), propagate it to UI
      if ((error as any)?.statusCode === 409 || (error as any)?.statusCode === 400) {
        throw error;
      }

      // If backend is offline, update local fixtures & games
      this.recordLocalGame(matchId, payload, p1Id, p2Id);

      const localFixtures = tournamentsApi.getLocalFixtures(tournamentId);
      const fixtureIndex = localFixtures.findIndex((f) => f.matchId === matchId);

      let fixtureCompleted = false;
      if (fixtureIndex !== -1) {
        const fixture = localFixtures[fixtureIndex];
        if (payload.winnerId === p1Id) {
          fixture.player1.points += 1;
        } else {
          fixture.player2.points += 1;
        }

        const requiredWins = fixture.isTiebreaker ? 3 : 2;
        if (fixture.player1.points >= requiredWins || fixture.player2.points >= requiredWins) {
          fixture.status = 'completed';
          fixtureCompleted = true;
        } else {
          fixture.status = 'in_progress';
        }

        tournamentsApi.saveLocalFixtures(tournamentId, localFixtures);
      }

      return {
        success: true,
        message: fixtureCompleted
          ? 'Game registered locally. Fixture completed.'
          : 'Game registered locally.',
        data: {
          matchGameId: Date.now(),
          fixtureCompleted,
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
    const games = getStoredGames();
    games.push({
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
    saveStoredGames(games);
  },

  calculatePlayerCooldowns(
    playerId: number,
    cooldownDuration: number,
    allCards: Card[]
  ): { bannedCards: Card[]; availableCards: Card[]; remainingMatches: Map<number, number> } {
    const remainingMatches = new Map<number, number>();
    if (cooldownDuration <= 0) {
      return { bannedCards: [], availableCards: allCards, remainingMatches };
    }
    const games = getStoredGames();
    const playerGames = games.filter(
      (g) => g.player1.id === playerId || g.player2.id === playerId
    );
    const recentGames = playerGames.slice(-cooldownDuration);
    const bannedCardIds = new Set<number>();
    recentGames.forEach((game, idx) => {
      const matchesAgo = recentGames.length - idx;
      const remaining = cooldownDuration - matchesAgo + 1;
      const cardIds = game.player1.id === playerId ? game.player1.cardIds : game.player2.cardIds;
      for (const id of cardIds) {
        bannedCardIds.add(id);
        remainingMatches.set(id, Math.max(1, remaining));
      }
    });
    const bannedCards = allCards.filter((c) => bannedCardIds.has(c.id));
    const availableCards = allCards.filter((c) => !bannedCardIds.has(c.id));
    return { bannedCards, availableCards, remainingMatches };
  },

  checkDuplicateDeck(playerId: number, cardIds: number[]): boolean {
    if (cardIds.length !== 8) return false;
    const currentSorted = [...cardIds].sort((a, b) => a - b).join(',');
    const games = getStoredGames();
    const playerGames = games.filter(
      (g) => g.player1.id === playerId || g.player2.id === playerId
    );
    for (const g of playerGames) {
      const existingCards = g.player1.id === playerId ? g.player1.cardIds : g.player2.cardIds;
      const existingSorted = [...existingCards].sort((a, b) => a - b).join(',');
      if (currentSorted === existingSorted) return true;
    }
    return false;
  },

  validateDeckRules(
    selectedCards: Card[],
    bannedCards: Card[] = [],
    playerRecentDecks: number[][] = [],
    banDuplicateDecks = true
  ): { valid: boolean; reason?: string } {
    if (selectedCards.length !== 8) {
      return { valid: false, reason: 'A valid Clash Royale battle deck must contain exactly 8 cards.' };
    }

    const bannedCardIds = new Set(bannedCards.map((c) => c.id));
    for (const card of selectedCards) {
      if (bannedCardIds.has(card.id)) {
        return {
          valid: false,
          reason: `Card "${card.name}" is currently on cooldown / exhausted for this player.`,
        };
      }
    }

    if (banDuplicateDecks && playerRecentDecks.length > 0) {
      const currentDeckSorted = selectedCards.map((c) => c.id).sort((a, b) => a - b).join(',');
      for (const deck of playerRecentDecks) {
        const existingDeckSorted = [...deck].sort((a, b) => a - b).join(',');
        if (currentDeckSorted === existingDeckSorted) {
          return {
            valid: false,
            reason: 'This player has already used this exact 8-card combination in this tournament (Duplicate Deck Rule).',
          };
        }
      }
    }

    return { valid: true };
  },
};
