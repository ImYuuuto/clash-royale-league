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
  const placeholders = cardIds.map(() => "?").join(", ");
  const [cards] = await connection.execute<IdRow[]>(
    `SELECT id FROM cards WHERE id IN (${placeholders})`,
    cardIds,
  );

  if (cards.length !== cardIds.length) {
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

    const gamesToWin = match.is_tiebreaker
      ? 3
      : Math.ceil(match.match_format_bo / 2);

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
