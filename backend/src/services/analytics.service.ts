import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../config/database.js";

export class AnalyticsError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "AnalyticsError";
  }
}

function parseId(value: unknown, label: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new AnalyticsError(`${label} must be a positive integer`);
  return id;
}

async function ensureTournament(tournamentId: number): Promise<void> {
  const [rows] = await pool.execute<RowDataPacket[]>("SELECT id FROM tournaments WHERE id = ?", [tournamentId]);
  if (!rows[0]) throw new AnalyticsError("Tournament not found", 404);
}

export async function getTournamentAnalytics(tournamentIdInput: unknown) {
  const tournamentId = parseId(tournamentIdInput, "tournament ID");
  await ensureTournament(tournamentId);

  const [standings] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id AS playerId, p.name, p.player_tag AS playerTag,
            tp.points, tp.matches_played AS matchesPlayed, tp.matches_won AS matchesWon,
            CASE WHEN tp.matches_played = 0 THEN 0 ELSE ROUND(tp.matches_won / tp.matches_played, 4) END AS matchWinRate,
            tp.crowns_for AS crownsFor, tp.crowns_against AS crownsAgainst,
            CASE WHEN tp.crowns_for + tp.crowns_against = 0 THEN 0
                 ELSE ROUND(tp.crowns_for / (tp.crowns_for + tp.crowns_against), 4) END AS crownEfficiency,
            (SELECT COUNT(DISTINCT pd.deck_hash) FROM player_decks pd
             WHERE pd.tournament_id = tp.tournament_id AND pd.player_id = tp.player_id) AS uniqueDecks,
            (SELECT COUNT(DISTINCT cc.card_id) FROM card_cooldowns cc
             WHERE cc.tournament_id = tp.tournament_id AND cc.player_id = tp.player_id) AS uniqueCardsUsed
     FROM tournament_players tp JOIN players p ON p.id = tp.player_id
     WHERE tp.tournament_id = ? ORDER BY tp.points DESC, tp.matches_won DESC, crownEfficiency DESC, p.name`,
    [tournamentId],
  );

  const [cardStats] = await pool.execute<RowDataPacket[]>(
    `SELECT c.id AS cardId, c.name, c.rarity, c.elixir_cost AS elixirCost,
            COUNT(*) AS uses,
            SUM(mg.winner_id = pd.player_id) AS gameWins,
            CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND(SUM(mg.winner_id = pd.player_id) / COUNT(*), 4) END AS winRate
     FROM card_cooldowns cc
     JOIN cards c ON c.id = cc.card_id
     JOIN player_decks pd ON pd.match_game_id = cc.match_game_id AND pd.player_id = cc.player_id AND pd.tournament_id = cc.tournament_id
     JOIN match_games mg ON mg.id = cc.match_game_id
     WHERE cc.tournament_id = ?
     GROUP BY c.id, c.name, c.rarity, c.elixir_cost
     ORDER BY uses DESC, c.name`,
    [tournamentId],
  );

  const [elixirStats] = await pool.execute<RowDataPacket[]>(
    `SELECT outcome, ROUND(AVG(deck_elixir_cost), 2) AS averageElixirCost, COUNT(*) AS decks
     FROM (
       SELECT pd.id AS player_deck_id,
              CASE WHEN mg.winner_id = pd.player_id THEN 'winning' ELSE 'losing' END AS outcome,
              AVG(c.elixir_cost) AS deck_elixir_cost
       FROM player_decks pd
       JOIN match_games mg ON mg.id = pd.match_game_id
       JOIN card_cooldowns cc ON cc.match_game_id = pd.match_game_id
         AND cc.player_id = pd.player_id AND cc.tournament_id = pd.tournament_id
       JOIN cards c ON c.id = cc.card_id
       WHERE pd.tournament_id = ?
       GROUP BY pd.id, outcome
     ) deck_costs
     GROUP BY outcome ORDER BY outcome`,
    [tournamentId],
  );

  const [synergy] = await pool.execute<RowDataPacket[]>(
    `SELECT c1.id AS card1Id, c1.name AS card1Name, c2.id AS card2Id, c2.name AS card2Name,
            COUNT(*) AS uses,
            SUM(mg.winner_id = pd1.player_id) AS gameWins,
            ROUND(SUM(mg.winner_id = pd1.player_id) / COUNT(*), 4) AS winRate
     FROM card_cooldowns cc1
     JOIN card_cooldowns cc2 ON cc2.match_game_id = cc1.match_game_id
       AND cc2.player_id = cc1.player_id AND cc2.tournament_id = cc1.tournament_id
       AND cc2.card_id > cc1.card_id
     JOIN player_decks pd1 ON pd1.match_game_id = cc1.match_game_id
       AND pd1.player_id = cc1.player_id AND pd1.tournament_id = cc1.tournament_id
     JOIN match_games mg ON mg.id = cc1.match_game_id
     JOIN cards c1 ON c1.id = cc1.card_id
     JOIN cards c2 ON c2.id = cc2.card_id
     WHERE cc1.tournament_id = ?
     GROUP BY c1.id, c1.name, c2.id, c2.name
     ORDER BY uses DESC, card1Name, card2Name LIMIT 100`,
    [tournamentId],
  );

  const [gameSummary] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS gamesPlayed,
            SUM(mg.game_number IN (3, 5)) AS clutchGames
     FROM match_games mg JOIN matches m ON m.id = mg.match_id
     WHERE m.tournament_id = ?`, [tournamentId],
  );

  return {
    tournamentId,
    summary: gameSummary[0] ?? { gamesPlayed: 0, clutchGames: 0 },
    standings,
    cards: cardStats,
    averageDeckElixirCost: elixirStats,
    cardSynergy: synergy,
  };
}

export async function getPlayerTournamentAnalytics(tournamentIdInput: unknown, playerIdInput: unknown) {
  const tournamentId = parseId(tournamentIdInput, "tournament ID");
  const playerId = parseId(playerIdInput, "player ID");
  await ensureTournament(tournamentId);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id AS playerId, p.name, p.player_tag AS playerTag,
            tp.points, tp.matches_played AS matchesPlayed, tp.matches_won AS matchesWon,
            CASE WHEN tp.matches_played = 0 THEN 0 ELSE ROUND(tp.matches_won / tp.matches_played, 4) END AS matchWinRate,
            tp.crowns_for AS crownsFor, tp.crowns_against AS crownsAgainst,
            CASE WHEN tp.crowns_for + tp.crowns_against = 0 THEN 0
                 ELSE ROUND(tp.crowns_for / (tp.crowns_for + tp.crowns_against), 4) END AS crownEfficiency,
            COUNT(DISTINCT pd.match_game_id) AS gamesPlayed,
            COUNT(DISTINCT pd.deck_hash) AS uniqueDecks,
            COUNT(DISTINCT cc.card_id) AS uniqueCardsUsed,
            COUNT(DISTINCT CASE WHEN mg.game_number IN (3, 5) AND mg.winner_id = p.id THEN mg.id END) AS clutchWins
     FROM tournament_players tp JOIN players p ON p.id = tp.player_id
     LEFT JOIN player_decks pd ON pd.tournament_id = tp.tournament_id AND pd.player_id = tp.player_id
     LEFT JOIN match_games mg ON mg.id = pd.match_game_id
     LEFT JOIN card_cooldowns cc ON cc.match_game_id = pd.match_game_id
       AND cc.player_id = pd.player_id AND cc.tournament_id = pd.tournament_id
     WHERE tp.tournament_id = ? AND tp.player_id = ?
     GROUP BY p.id, p.name, p.player_tag, tp.points, tp.matches_played, tp.matches_won,
              tp.crowns_for, tp.crowns_against`,
    [tournamentId, playerId],
  );
  if (!rows[0]) throw new AnalyticsError("Player is not enrolled in this tournament", 404);
  return rows[0];
}
