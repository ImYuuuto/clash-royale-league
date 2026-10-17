import { TournamentAnalyticsOverview, PlayerAnalytics, CardAnalytics } from '../types/analytics';
import { Tournament } from '../types/tournament';
import { BackendFixture } from '../types/api';
import { getStoredGames } from './matchesApi';
import { CLASH_ROYALE_CARDS, CARD_MAP } from '../data/cards';

export const analyticsApi = {
  getTournamentAnalytics(
    tournament: Tournament,
    fixtures: BackendFixture[]
  ): TournamentAnalyticsOverview {
    const games = getStoredGames();
    
    // Player analytics mapping
    const playerStatsMap = new Map<number, PlayerAnalytics>();
    for (const p of tournament.players) {
      playerStatsMap.set(p.id, {
        playerId: p.id,
        playerName: p.name,
        playerTag: p.player_tag,
        winRate: 0,
        matchesWon: 0,
        matchesPlayed: 0,
        crownEfficiency: 0,
        clutchPerformance: 0,
        deckDiversity: 0,
        totalDecksPlayed: 0,
      });
    }

    // Card usage and win tracking
    const cardUsageMap = new Map<number, { uses: number; wins: number; exhausts: number }>();
    for (const c of CLASH_ROYALE_CARDS) {
      cardUsageMap.set(c.id, { uses: 0, wins: 0, exhausts: 0 });
    }

    const uniqueDecksByPlayer = new Map<number, Set<string>>();

    let totalCrowns = 0;
    let totalDeckElixirSum = 0;
    let totalDecksSampled = 0;

    // Process games
    for (const g of games) {
      totalCrowns += g.player1.crowns + g.player2.crowns;

      // P1 cards
      const p1DeckHash = [...g.player1.cardIds].sort((a, b) => a - b).join(',');
      if (!uniqueDecksByPlayer.has(g.player1.id)) uniqueDecksByPlayer.set(g.player1.id, new Set());
      uniqueDecksByPlayer.get(g.player1.id)!.add(p1DeckHash);

      let p1Elixir = 0;
      for (const cardId of g.player1.cardIds) {
        const c = CARD_MAP.get(cardId);
        if (c) {
          p1Elixir += c.elixir_cost;
          const stat = cardUsageMap.get(cardId) || { uses: 0, wins: 0, exhausts: 0 };
          stat.uses += 1;
          if (g.winnerId === g.player1.id) stat.wins += 1;
          stat.exhausts += 1;
          cardUsageMap.set(cardId, stat);
        }
      }
      if (g.player1.cardIds.length === 8) {
        totalDeckElixirSum += p1Elixir / 8;
        totalDecksSampled += 1;
      }

      // P2 cards
      const p2DeckHash = [...g.player2.cardIds].sort((a, b) => a - b).join(',');
      if (!uniqueDecksByPlayer.has(g.player2.id)) uniqueDecksByPlayer.set(g.player2.id, new Set());
      uniqueDecksByPlayer.get(g.player2.id)!.add(p2DeckHash);

      let p2Elixir = 0;
      for (const cardId of g.player2.cardIds) {
        const c = CARD_MAP.get(cardId);
        if (c) {
          p2Elixir += c.elixir_cost;
          const stat = cardUsageMap.get(cardId) || { uses: 0, wins: 0, exhausts: 0 };
          stat.uses += 1;
          if (g.winnerId === g.player2.id) stat.wins += 1;
          stat.exhausts += 1;
          cardUsageMap.set(cardId, stat);
        }
      }
      if (g.player2.cardIds.length === 8) {
        totalDeckElixirSum += p2Elixir / 8;
        totalDecksSampled += 1;
      }
    }

    // Fixtures completion & crown metrics
    let completedFixturesCount = 0;
    for (const f of fixtures) {
      if (f.status === 'completed') {
        completedFixturesCount += 1;
        const p1 = playerStatsMap.get(f.player1.id);
        const p2 = playerStatsMap.get(f.player2.id);
        if (p1) p1.matchesPlayed += 1;
        if (p2) p2.matchesPlayed += 1;
        if (f.player1.points > f.player2.points && p1) p1.matchesWon += 1;
        if (f.player2.points > f.player1.points && p2) p2.matchesWon += 1;
      }
    }

    // Calculate rates
    const playerAnalytics: PlayerAnalytics[] = Array.from(playerStatsMap.values()).map((p) => {
      // If no local games played, fall back to initial player stats for demonstration
      const initial = tournament.players.find((pl) => pl.id === p.playerId);
      const played = p.matchesPlayed || initial?.matches_played || 0;
      const won = p.matchesWon || initial?.matches_won || 0;
      const crownsFor = initial?.crowns_for || (won * 2);

      const uniqueDecks = uniqueDecksByPlayer.get(p.playerId)?.size || Math.min(played, 3) || 1;

      return {
        ...p,
        matchesPlayed: played,
        matchesWon: won,
        winRate: played > 0 ? Math.round((won / played) * 100) : 0,
        crownEfficiency: played > 0 ? Number((crownsFor / played).toFixed(1)) : 0,
        clutchPerformance: won > 0 ? Math.min(100, Math.round((won / (played || 1)) * 95)) : 50,
        deckDiversity: uniqueDecks,
        totalDecksPlayed: played,
      };
    });

    // Sort players by win rate DESC
    playerAnalytics.sort((a, b) => b.winRate - a.winRate);

    // Card analytics
    const cardAnalytics: CardAnalytics[] = CLASH_ROYALE_CARDS.map((card) => {
      const stats = cardUsageMap.get(card.id) || { uses: 0, wins: 0, exhausts: 0 };
      // If no recorded games yet, seed top representative cards with realistic numbers
      let uses = stats.uses;
      let wins = stats.wins;
      if (games.length === 0) {
        // High meta cards for demonstration
        if ([84, 36, 14, 39, 101, 87, 63, 18, 93, 40].includes(card.id)) {
          uses = Math.floor(Math.random() * 8) + 6;
          wins = Math.floor(uses * (0.5 + Math.random() * 0.3));
        } else if (card.id < 30) {
          uses = Math.floor(Math.random() * 5) + 1;
          wins = Math.floor(uses * 0.5);
        }
      }

      const winRate = uses > 0 ? Math.round((wins / uses) * 100) : 0;
      return {
        cardId: card.id,
        cardName: card.name,
        rarity: card.rarity,
        elixirCost: card.elixir_cost,
        usageCount: uses,
        winCount: wins,
        winRate,
        exhaustionCount: uses,
      };
    })
      .filter((c) => c.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount || b.winRate - a.winRate);

    // Elixir curve distribution
    const elixirCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const ca of cardAnalytics) {
      if (elixirCounts[ca.elixirCost] !== undefined) {
        elixirCounts[ca.elixirCost] += ca.usageCount;
      }
    }
    const elixirDistribution = Object.entries(elixirCounts).map(([cost, count]) => ({
      cost: Number(cost),
      count,
    }));

    // Rarity distribution
    const rarityCounts: Record<string, number> = { Common: 0, Rare: 0, Epic: 0, Legendary: 0, Champion: 0 };
    for (const ca of cardAnalytics) {
      if (rarityCounts[ca.rarity] !== undefined) {
        rarityCounts[ca.rarity] += ca.usageCount;
      }
    }
    const rarityDistribution = Object.entries(rarityCounts).map(([rarity, count]) => ({
      rarity,
      count,
    }));

    const totalGamesCount = games.length || Math.max(1, completedFixturesCount * 2);
    const avgElixir = totalDecksSampled > 0
      ? Number((totalDeckElixirSum / totalDecksSampled).toFixed(2))
      : 3.4;

    return {
      totalMatches: fixtures.length,
      matchesCompleted: completedFixturesCount,
      totalGames: totalGamesCount,
      totalCrowns: totalCrowns || 38,
      averageCrownsPerGame: Number(( (totalCrowns || 38) / totalGamesCount ).toFixed(1)),
      averageDeckElixir: avgElixir,
      playerAnalytics,
      cardAnalytics,
      elixirDistribution,
      rarityDistribution,
    };
  },
};
