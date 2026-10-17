
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";

interface FixtureRow extends RowDataPacket {
  match_id: number;
  match_number: number;
  status: string;
  is_tiebreaker: number;
  player1_id: number;
  player1_name: string;
  player1_tag: string;
  player1_points: number;
  player2_id: number;
  player2_name: string;
  player2_tag: string;
  player2_points: number;
}

interface TournamentRow extends RowDataPacket {
  cooldown_duration: number;
}

interface CardRow extends RowDataPacket {
  id: number;
  name: string;
  rarity: string;
  elixir_cost: number;
  icon_url: string | null;
}

interface GameRow extends RowDataPacket {
  id: number;
}

interface CooldownRow extends RowDataPacket {
  card_id: number;
}

async function getPlayerCardAvailability(
  tournamentId: number,
  playerId: number,
  cooldownDuration: number,
  allCards: CardRow[],
) {
  if (cooldownDuration <= 0) {
    return {
      bannedCards: [],
      availableCards: allCards,
    };
  }

  // Find this player's most recent completed games
  // in this tournament that have a registered deck.
  const [recentGames] = await pool.execute<GameRow[]>(
    `
    SELECT DISTINCT mg.id
    FROM player_decks pd
    JOIN match_games mg ON mg.id = pd.match_game_id
    JOIN matches m ON m.id = mg.match_id
    WHERE pd.tournament_id = ?
      AND pd.player_id = ?
      AND m.tournament_id = ?
    ORDER BY
      m.match_number DESC,
      mg.game_number DESC,
      mg.id DESC
    LIMIT ?
    `,
    [
      tournamentId,
      playerId,
      tournamentId,
      cooldownDuration,
    ],
  );

  const recentGameIds = recentGames.map((game) => game.id);

  if (recentGameIds.length === 0) {
    return {
      bannedCards: [],
      availableCards: allCards,
    };
  }

  const placeholders = recentGameIds.map(() => "?").join(", ");

  const [cooldowns] = await pool.execute<CooldownRow[]>(
    `
    SELECT DISTINCT card_id
    FROM card_cooldowns
    WHERE tournament_id = ?
      AND player_id = ?
      AND match_game_id IN (${placeholders})
    `,
    [tournamentId, playerId, ...recentGameIds],
  );

  const bannedIds = new Set(
    cooldowns.map((cooldown) => cooldown.card_id),
  );

  return {
    bannedCards: allCards.filter((card) => bannedIds.has(card.id)),
    availableCards: allCards.filter((card) => !bannedIds.has(card.id)),
  };
}

export async function getTournamentFixtures(tournamentId: number) {
  const [tournaments] = await pool.execute<TournamentRow[]>(
    `
    SELECT cooldown_duration
    FROM tournaments
    WHERE id = ?
    `,
    [tournamentId],
  );

  const tournament = tournaments[0];

if (!tournament) return null;

const cooldownDuration = tournament.cooldown_duration;

  const [fixtures] = await pool.execute<FixtureRow[]>(
    `
    SELECT
      m.id AS match_id,
      m.match_number,
      m.status,
      m.is_tiebreaker,

      p1.id AS player1_id,
      p1.name AS player1_name,
      p1.player_tag AS player1_tag,

      p2.id AS player2_id,
      p2.name AS player2_name,
      p2.player_tag AS player2_tag,

      COALESCE(tp1.points, 0) AS player1_points,
      COALESCE(tp2.points, 0) AS player2_points

    FROM matches m
    JOIN players p1 ON p1.id = m.player1_id
    JOIN players p2 ON p2.id = m.player2_id

    LEFT JOIN tournament_players tp1
      ON tp1.tournament_id = m.tournament_id
      AND tp1.player_id = m.player1_id

    LEFT JOIN tournament_players tp2
      ON tp2.tournament_id = m.tournament_id
      AND tp2.player_id = m.player2_id

    WHERE m.tournament_id = ?
    ORDER BY m.match_number ASC, m.id ASC
    `,
    [tournamentId],
  );

  const [allCards] = await pool.execute<CardRow[]>(
    `
    SELECT id, name, rarity, elixir_cost, icon_url
    FROM cards
    ORDER BY name ASC
    `,
  );

  const enrichedFixtures = await Promise.all(
    fixtures.map(async (fixture) => {
      const [player1Cards, player2Cards] = await Promise.all([
        getPlayerCardAvailability(
          tournamentId,
          fixture.player1_id,
          cooldownDuration,
          allCards,
        ),
        getPlayerCardAvailability(
          tournamentId,
          fixture.player2_id,
          cooldownDuration,
          allCards,
        ),
      ]);

      return {
        matchId: fixture.match_id,
        matchNumber: fixture.match_number,
        status: fixture.status,
        isTiebreaker: Boolean(fixture.is_tiebreaker),

        player1: {
          id: fixture.player1_id,
          name: fixture.player1_name,
          tag: fixture.player1_tag,
          points: fixture.player1_points,
          ...player1Cards,
        },

        player2: {
          id: fixture.player2_id,
          name: fixture.player2_name,
          tag: fixture.player2_tag,
          points: fixture.player2_points,
          ...player2Cards,
        },
      };
    }),
  );

  return enrichedFixtures;
}
