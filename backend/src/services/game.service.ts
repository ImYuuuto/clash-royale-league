import { createHash } from "node:crypto";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { pool } from "../config/database.js";

interface MatchRow extends RowDataPacket {
  id: number;
  tournament_id: number;
  match_number: number;
  player1_id: number;
  player2_id: number;
  status: "scheduled" | "in_progress" | "completed";
  is_tiebreaker: number;
  tournament_status: "draft" | "active" | "tiebreaker" | "completed";
  cooldown_duration: number;
  ban_duplicate_decks: number;
  match_format_bo: number;
  tiebreaker_mode: string;
}

interface IdRow extends RowDataPacket {
  id: number;
}

interface GameRow extends RowDataPacket {
  id: number;
  winner_id: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export interface RegisterGameInput {
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

export class GameRegistrationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "GameRegistrationError";
  }
}

function validatePlayerSubmission(
  player: RegisterGameInput["player1"],
  label: string,
): void {
  if (!player || !Array.isArray(player.cardIds)) {
    throw new GameRegistrationError(`${label} must provide cardIds`);
  }

  if (
    player.cardIds.length !== 8 ||
    player.cardIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
    new Set(player.cardIds).size !== 8
  ) {
    throw new GameRegistrationError(
      `${label} must submit exactly 8 distinct, valid card IDs`,
    );
  }

  if (!Number.isSafeInteger(player.crowns) || player.crowns < 0) {
    throw new GameRegistrationError(
      `${label} crowns must be a non-negative integer`,
    );
  }
}

function createDeckHash(cardIds: number[]): string {
  const canonicalDeck = [...cardIds].sort((a, b) => a - b).join(",");
  return createHash("sha256").update(canonicalDeck).digest("hex");
}

async function getBannedCardIds(
  connection: PoolConnection,
  tournamentId: number,
  playerId: number,
  cooldownDuration: number,
): Promise<Set<number>> {
  if (cooldownDuration <= 0) return new Set();

  // Get this player's most recent individual games in this tournament.
  const [recentGames] = await connection.execute<IdRow[]>(
    `
    SELECT mg.id
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
    [tournamentId, playerId, tournamentId, cooldownDuration],
  );

  if (recentGames.length === 0) return new Set();

  const placeholders = recentGames.map(() => "?").join(", ");

  const [cooldowns] = await connection.execute<
    Array<RowDataPacket & { card_id: number }>
  >(
    `
    SELECT DISTINCT card_id
    FROM card_cooldowns
    WHERE tournament_id = ?
      AND player_id = ?
      AND match_game_id IN (${placeholders})
    `,
    [tournamentId, playerId, ...recentGames.map((game) => game.id)],
  );

  return new Set(cooldowns.map((row) => row.card_id));
}

async function validateCardsExist(
  connection: PoolConnection,
  cardIds: number[],
): Promise<void> {
  const uniqueCardIds = [...new Set(cardIds)];
  const placeholders = uniqueCardIds.map(() => "?").join(", ");
  const [cards] = await connection.execute<IdRow[]>(
    `SELECT id FROM cards WHERE id IN (${placeholders})`,
    uniqueCardIds,
  );

  if (cards.length !== uniqueCardIds.length) {
    throw new GameRegistrationError(
      "One or more submitted card IDs do not exist",
    );
  }
}

async function registerDeck(
  connection: PoolConnection,
  args: {
    tournamentId: number;
    playerId: number;
    matchGameId: number;
    matchNumber: number;
    cooldownDuration: number;
    cardIds: number[];
    deckHash: string;
  },
): Promise<void> {
  const {
    tournamentId,
    playerId,
    matchGameId,
    matchNumber,
    cooldownDuration,
    cardIds,
    deckHash,
  } = args;

  await connection.execute(
    `
    INSERT INTO player_decks
      (tournament_id, player_id, match_game_id, deck_hash)
    VALUES (?, ?, ?, ?)
    `,
    [tournamentId, playerId, matchGameId, deckHash],
  );

  // One cooldown record per card used by this player in this game.
  for (const cardId of cardIds) {
    await connection.execute(
      `
      INSERT INTO card_cooldowns
        (
          tournament_id,
          player_id,
          card_id,
          match_game_id,
          match_number_played,
          cooldown_until_match
        )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        tournamentId,
        playerId,
        cardId,
        matchGameId,
        matchNumber,
        matchNumber + cooldownDuration,
      ],
    );
  }
}

export async function registerGame(matchId: number, input: RegisterGameInput) {
  if (!Number.isSafeInteger(matchId) || matchId <= 0) {
    throw new GameRegistrationError("Invalid match ID");
  }

  if (
    !input ||
    !Number.isSafeInteger(input.gameNumber) ||
    input.gameNumber <= 0
  ) {
    throw new GameRegistrationError("gameNumber must be a positive integer");
  }

  if (!Number.isSafeInteger(input.winnerId) || input.winnerId <= 0) {
    throw new GameRegistrationError("winnerId must be a positive integer");
  }

  validatePlayerSubmission(input.player1, "player1");
  validatePlayerSubmission(input.player2, "player2");

  const player1Hash = createDeckHash(input.player1.cardIds);
  const player2Hash = createDeckHash(input.player2.cardIds);

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [matches] = await connection.execute<MatchRow[]>(
      `
      SELECT
        m.id,
        m.tournament_id,
        m.match_number,
        m.player1_id,
        m.player2_id,
        m.status,
        m.is_tiebreaker,
        t.status AS tournament_status,
        t.cooldown_duration,
        t.ban_duplicate_decks,
        t.match_format_bo,
        t.tiebreaker_mode
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = ?
      FOR UPDATE
      `,
      [matchId],
    );

    const match = matches[0];

    if (!match) {
      throw new GameRegistrationError("Fixture not found", 404);
    }

    if (match.status === "completed") {
      throw new GameRegistrationError("This fixture is already completed", 409);
    }

    if (
      match.tournament_status !== "active" &&
      match.tournament_status !== "tiebreaker"
    ) {
      throw new GameRegistrationError(
        "The tournament is not accepting game results",
        409,
      );
    }

    if (
      (match.tournament_status === "tiebreaker" && !match.is_tiebreaker) ||
      (match.tournament_status === "active" && match.is_tiebreaker)
    ) {
      throw new GameRegistrationError(
        "This fixture is not eligible for game results in the current tournament stage",
        409,
      );
    }

    if (
      input.winnerId !== match.player1_id &&
      input.winnerId !== match.player2_id
    ) {
      throw new GameRegistrationError(
        "winnerId must match one of the fixture's players",
      );
    }

    const [previousGames] = await connection.execute<GameRow[]>(
      `
      SELECT id, winner_id
      FROM match_games
      WHERE match_id = ?
      ORDER BY game_number ASC
      `,
      [matchId],
    );

    const expectedGameNumber = previousGames.length + 1;

    if (input.gameNumber !== expectedGameNumber) {
      throw new GameRegistrationError(
        `Expected game number ${expectedGameNumber}`,
        409,
      );
    }

    // Regular fixtures are one registered game. Championship tie-breakers
    // remain a Bo5 series.
    const gamesToWin = match.is_tiebreaker ? 3 : 1;

    const player1WinsBefore = previousGames.filter(
      (game) => game.winner_id === match.player1_id,
    ).length;
    const player2WinsBefore = previousGames.filter(
      (game) => game.winner_id === match.player2_id,
    ).length;

    if (player1WinsBefore >= gamesToWin || player2WinsBefore >= gamesToWin) {
      throw new GameRegistrationError(
        "This fixture has already reached its required number of wins",
        409,
      );
    }

    await validateCardsExist(connection, [
      ...input.player1.cardIds,
      ...input.player2.cardIds,
    ]);

    const [players] = await connection.execute<IdRow[]>(
      `
      SELECT player_id AS id
      FROM tournament_players
      WHERE tournament_id = ?
        AND player_id IN (?, ?)
      `,
      [match.tournament_id, match.player1_id, match.player2_id],
    );

    if (players.length !== 2) {
      throw new GameRegistrationError(
        "Both fixture players must be registered in this tournament",
        409,
      );
    }

    const submissions = [
      {
        playerId: match.player1_id,
        cardIds: input.player1.cardIds,
        deckHash: player1Hash,
      },
      {
        playerId: match.player2_id,
        cardIds: input.player2.cardIds,
        deckHash: player2Hash,
      },
    ];

    for (const submission of submissions) {
      const bannedCards = await getBannedCardIds(
        connection,
        match.tournament_id,
        submission.playerId,
        match.cooldown_duration,
      );

      const forbiddenCards = submission.cardIds.filter((id) =>
        bannedCards.has(id),
      );

      if (forbiddenCards.length > 0) {
        throw new GameRegistrationError(
          `Player ${submission.playerId} submitted cards on cooldown: ${forbiddenCards.join(", ")}`,
          409,
        );
      }

      if (match.ban_duplicate_decks) {
        const [existingDecks] = await connection.execute<CountRow[]>(
          `
          SELECT COUNT(*) AS total
          FROM player_decks
          WHERE tournament_id = ?
            AND player_id = ?
            AND deck_hash = ?
          `,
          [match.tournament_id, submission.playerId, submission.deckHash],
        );

        const existingDeck = existingDecks[0];

        if (existingDeck && Number(existingDeck.total) > 0) {
          throw new GameRegistrationError(
            `Player ${submission.playerId} has already used this deck in the tournament`,
            409,
          );
        }
      }
    }

    const [insertResult] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO match_games
        (match_id, game_number, winner_id, p1_crowns, p2_crowns)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        matchId,
        input.gameNumber,
        input.winnerId,
        input.player1.crowns,
        input.player2.crowns,
      ],
    );

    const matchGameId = insertResult.insertId;

    for (const submission of submissions) {
      await registerDeck(connection, {
        tournamentId: match.tournament_id,
        playerId: submission.playerId,
        matchGameId,
        matchNumber: match.match_number,
        cooldownDuration: match.cooldown_duration,
        cardIds: submission.cardIds,
        deckHash: submission.deckHash,
      });
    }

    // Accumulate crowns for each individual game.
    await connection.execute(
      `
      UPDATE tournament_players
      SET crowns_for = crowns_for + ?,
          crowns_against = crowns_against + ?
      WHERE tournament_id = ? AND player_id = ?
      `,
      [
        input.player1.crowns,
        input.player2.crowns,
        match.tournament_id,
        match.player1_id,
      ],
    );

    await connection.execute(
      `
      UPDATE tournament_players
      SET crowns_for = crowns_for + ?,
          crowns_against = crowns_against + ?
      WHERE tournament_id = ? AND player_id = ?
      `,
      [
        input.player2.crowns,
        input.player1.crowns,
        match.tournament_id,
        match.player2_id,
      ],
    );

    const player1Wins =
      player1WinsBefore + (input.winnerId === match.player1_id ? 1 : 0);
    const player2Wins =
      player2WinsBefore + (input.winnerId === match.player2_id ? 1 : 0);

    let fixtureWinnerId: number | null = null;

    if (player1Wins >= gamesToWin) {
      fixtureWinnerId = match.player1_id;
    } else if (player2Wins >= gamesToWin) {
      fixtureWinnerId = match.player2_id;
    }

    if (fixtureWinnerId !== null) {
      await connection.execute(
        `
        UPDATE matches
        SET winner_id = ?, status = 'completed'
        WHERE id = ?
        `,
        [fixtureWinnerId, matchId],
      );

      const fixtureLoserId =
        fixtureWinnerId === match.player1_id
          ? match.player2_id
          : match.player1_id;

      await connection.execute(
        `
        UPDATE tournament_players
        SET points = points + 3,
            matches_played = matches_played + 1,
            matches_won = matches_won + 1
        WHERE tournament_id = ? AND player_id = ?
        `,
        [match.tournament_id, fixtureWinnerId],
      );

      await connection.execute(
        `
        UPDATE tournament_players
        SET matches_played = matches_played + 1
        WHERE tournament_id = ? AND player_id = ?
        `,
        [match.tournament_id, fixtureLoserId],
      );

      if (match.is_tiebreaker) {
        await connection.execute(
          `UPDATE tournaments SET status = 'completed', winner_player_id = ? WHERE id = ?`,
          [fixtureWinnerId, match.tournament_id],
        );
      }
    } else {
      await connection.execute(
        `UPDATE matches SET status = 'in_progress' WHERE id = ?`,
        [matchId],
      );
    }

    await connection.commit();
    transactionStarted = false;

    return {
      matchGameId,
      matchId,
      gameNumber: input.gameNumber,
      gameWinnerId: input.winnerId,
      fixtureWinnerId,
      fixtureCompleted: fixtureWinnerId !== null,
      score: {
        player1Wins,
        player2Wins,
        gamesToWin,
      },
    };
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateGame(matchId: number, gameId: number, input: RegisterGameInput) {
  if (!Number.isSafeInteger(matchId) || matchId <= 0 || !Number.isSafeInteger(gameId) || gameId <= 0) {
    throw new GameRegistrationError("Invalid fixture or game ID");
  }
  if (!input || !Number.isSafeInteger(input.winnerId) || input.winnerId <= 0) {
    throw new GameRegistrationError("winnerId must be a positive integer");
  }
  validatePlayerSubmission(input.player1, "player1");
  validatePlayerSubmission(input.player2, "player2");
  const deckSubmissions = [input.player1.cardIds, input.player2.cardIds];
  const hashes = deckSubmissions.map(createDeckHash);

  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const [matches] = await connection.execute<MatchRow[]>(
      `SELECT m.id, m.tournament_id, m.match_number, m.player1_id, m.player2_id,
              m.status, m.is_tiebreaker, t.status AS tournament_status,
              t.cooldown_duration, t.ban_duplicate_decks, t.match_format_bo, t.tiebreaker_mode
       FROM matches m JOIN tournaments t ON t.id = m.tournament_id
       WHERE m.id = ? FOR UPDATE`, [matchId],
    );
    const match = matches[0];
    if (!match) throw new GameRegistrationError("Fixture not found", 404);
    const [gameRows] = await connection.execute<Array<GameRow & { game_number: number }>>(
      "SELECT id, winner_id, game_number FROM match_games WHERE id = ? AND match_id = ? FOR UPDATE",
      [gameId, matchId],
    );
    const game = gameRows[0];
    if (!game) throw new GameRegistrationError("Registered game not found", 404);
    if (input.gameNumber !== game.game_number) throw new GameRegistrationError("The game number cannot be changed", 409);
    if (input.winnerId !== match.player1_id && input.winnerId !== match.player2_id) {
      throw new GameRegistrationError("winnerId must match one of the fixture's players");
    }
    await validateCardsExist(connection, [...input.player1.cardIds, ...input.player2.cardIds]);

    const playerIds = [match.player1_id, match.player2_id];
    const [duplicateRows] = await connection.execute<Array<CountRow & { player_id: number }>>(
      `SELECT player_id, COUNT(*) AS total FROM player_decks
       WHERE tournament_id = ? AND player_id IN (?, ?) AND deck_hash IN (?, ?)
         AND match_game_id <> ? GROUP BY player_id, deck_hash`,
      [match.tournament_id, ...playerIds, ...hashes, gameId],
    );
    if (match.ban_duplicate_decks && duplicateRows.length) {
      throw new GameRegistrationError("This deck has already been used in the tournament", 409);
    }

    const [otherGames] = await connection.execute<Array<RowDataPacket & { id: number }>>(
      `SELECT mg.id FROM match_games mg JOIN matches m ON m.id = mg.match_id
       WHERE m.tournament_id = ? AND mg.id <> ? AND m.match_number >= ?`,
      [match.tournament_id, gameId, match.match_number],
    );
    if (otherGames.length) {
      const [cooldownOverlap] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS total FROM card_cooldowns cc
         WHERE cc.tournament_id = ? AND cc.match_game_id IN (${otherGames.map(() => "?").join(",")})
           AND ((cc.player_id = ? AND cc.card_id IN (${input.player1.cardIds.map(() => "?").join(",")}))
             OR (cc.player_id = ? AND cc.card_id IN (${input.player2.cardIds.map(() => "?").join(",")})))`,
        [match.tournament_id, ...otherGames.map((row) => row.id), match.player1_id, ...input.player1.cardIds, match.player2_id, ...input.player2.cardIds],
      );
      if (Number(cooldownOverlap[0]?.total ?? 0)) {
        throw new GameRegistrationError("The updated decks conflict with cooldowns in later registered games", 409);
      }
    }

    await connection.execute("DELETE FROM card_cooldowns WHERE match_game_id = ?", [gameId]);
    await connection.execute("DELETE FROM player_decks WHERE match_game_id = ?", [gameId]);
    for (let index = 0; index < 2; index += 1) {
      await registerDeck(connection, {
        tournamentId: match.tournament_id,
        playerId: playerIds[index]!,
        matchGameId: gameId,
        matchNumber: match.match_number,
        cooldownDuration: match.cooldown_duration,
        cardIds: deckSubmissions[index]!,
        deckHash: hashes[index]!,
      });
    }
    await connection.execute(
      `UPDATE match_games SET winner_id = ?, p1_crowns = ?, p2_crowns = ? WHERE id = ?`,
      [input.winnerId, input.player1.crowns, input.player2.crowns, gameId],
    );

    if (match.is_tiebreaker) {
      const [gameResults] = await connection.execute<Array<GameRow & { game_number: number }>>(
        "SELECT id, winner_id, game_number FROM match_games WHERE match_id = ? ORDER BY game_number",
        [matchId],
      );
      const p1Wins = gameResults.filter((result) => result.winner_id === match.player1_id).length;
      const p2Wins = gameResults.filter((result) => result.winner_id === match.player2_id).length;
      const tieWinner = p1Wins >= 3 ? match.player1_id : p2Wins >= 3 ? match.player2_id : null;
      await connection.execute(
        "UPDATE matches SET winner_id = ?, status = ? WHERE id = ?",
        [tieWinner, tieWinner ? "completed" : "in_progress", matchId],
      );
      if (tieWinner) {
        await connection.execute("UPDATE tournaments SET winner_player_id = ? WHERE id = ?", [tieWinner, match.tournament_id]);
      } else {
        await connection.execute("UPDATE tournaments SET winner_player_id = NULL WHERE id = ?", [match.tournament_id]);
      }
    } else {
      await connection.execute(
        "UPDATE matches SET winner_id = ?, status = 'completed' WHERE id = ?",
        [input.winnerId, matchId],
      );
    }

    // Recompute the tournament totals from the preserved game and fixture rows.
    await connection.execute(
      `UPDATE tournament_players tp
       LEFT JOIN (
         SELECT m.player1_id AS player_id, COUNT(*) AS played,
                SUM(m.winner_id = m.player1_id) AS won,
                SUM((SELECT COALESCE(SUM(all_games.p1_crowns), 0) FROM match_games all_games WHERE all_games.match_id = m.id)) AS crowns_for,
                SUM((SELECT COALESCE(SUM(all_games.p2_crowns), 0) FROM match_games all_games WHERE all_games.match_id = m.id)) AS crowns_against
         FROM matches m JOIN match_games mg ON mg.match_id = m.id AND mg.game_number = 1
         WHERE m.tournament_id = ? AND m.is_tiebreaker = FALSE AND m.status = 'completed'
         GROUP BY m.player1_id
       ) p1 ON p1.player_id = tp.player_id
       LEFT JOIN (
         SELECT m.player2_id AS player_id, COUNT(*) AS played,
                SUM(m.winner_id = m.player2_id) AS won,
                SUM((SELECT COALESCE(SUM(all_games.p2_crowns), 0) FROM match_games all_games WHERE all_games.match_id = m.id)) AS crowns_for,
                SUM((SELECT COALESCE(SUM(all_games.p1_crowns), 0) FROM match_games all_games WHERE all_games.match_id = m.id)) AS crowns_against
         FROM matches m JOIN match_games mg ON mg.match_id = m.id AND mg.game_number = 1
         WHERE m.tournament_id = ? AND m.is_tiebreaker = FALSE AND m.status = 'completed'
         GROUP BY m.player2_id
       ) p2 ON p2.player_id = tp.player_id
       SET tp.matches_played = COALESCE(p1.played, 0) + COALESCE(p2.played, 0),
           tp.matches_won = COALESCE(p1.won, 0) + COALESCE(p2.won, 0),
           tp.points = 3 * (COALESCE(p1.won, 0) + COALESCE(p2.won, 0)),
           tp.crowns_for = COALESCE(p1.crowns_for, 0) + COALESCE(p2.crowns_for, 0),
           tp.crowns_against = COALESCE(p1.crowns_against, 0) + COALESCE(p2.crowns_against, 0)
       WHERE tp.tournament_id = ?`, [match.tournament_id, match.tournament_id, match.tournament_id],
    );
    await connection.commit();
    transactionStarted = false;
    return { matchGameId: gameId, matchId, gameNumber: game.game_number, gameWinnerId: input.winnerId };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
