import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/database.js";

export class ManagementError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "ManagementError";
  }
}

type TournamentStatus = "draft" | "active" | "tiebreaker" | "completed";

function positiveId(value: unknown, label: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new ManagementError(`${label} must be a positive integer`);
  }
  return id;
}

export async function listPlayers() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, player_tag AS playerTag, avatar_url AS avatarUrl, created_at AS createdAt
     FROM players ORDER BY name, id`,
  );
  return rows;
}

export async function getPlayer(idInput: unknown) {
  const id = positiveId(idInput, "player ID");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, player_tag AS playerTag, avatar_url AS avatarUrl, created_at AS createdAt
     FROM players WHERE id = ?`, [id],
  );
  if (!rows[0]) return null;
  const [tournaments] = await pool.execute<RowDataPacket[]>(
    `SELECT t.id, t.name, t.status, tp.points, tp.matches_played AS matchesPlayed,
            tp.matches_won AS matchesWon, tp.crowns_for AS crownsFor, tp.crowns_against AS crownsAgainst
     FROM tournament_players tp JOIN tournaments t ON t.id = tp.tournament_id
     WHERE tp.player_id = ? ORDER BY t.created_at DESC, t.id DESC`, [id],
  );
  return { ...rows[0], tournaments };
}

export async function createPlayer(input: unknown) {
  const body = input as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const playerTag = typeof body?.playerTag === "string" ? body.playerTag.trim() : "";
  const avatarUrl = typeof body?.avatarUrl === "string" && body.avatarUrl.trim()
    ? body.avatarUrl.trim()
    : null;
  if (!name || name.length > 100) throw new ManagementError("name is required and must be at most 100 characters");
  if (!playerTag || playerTag.length > 20) throw new ManagementError("playerTag is required and must be at most 20 characters");
  if (avatarUrl && avatarUrl.length > 255) throw new ManagementError("avatarUrl must be at most 255 characters");

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO players (name, player_tag, avatar_url) VALUES (?, ?, ?)",
      [name, playerTag, avatarUrl],
    );
    return { id: result.insertId, name, playerTag, avatarUrl };
  } catch (error) {
    if (isDuplicateKey(error)) throw new ManagementError("A player with that tag already exists", 409);
    throw error;
  }
}

export async function updatePlayer(idInput: unknown, input: unknown) {
  const id = positiveId(idInput, "player ID");
  const body = input as Record<string, unknown> | null;
  const fields: string[] = [];
  const values: unknown[] = [];
  if (body && Object.hasOwn(body, "name")) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) {
      throw new ManagementError("name must be a non-empty string of at most 100 characters");
    }
    fields.push("name = ?"); values.push(body.name.trim());
  }
  if (body && Object.hasOwn(body, "playerTag")) {
    if (typeof body.playerTag !== "string" || !body.playerTag.trim() || body.playerTag.trim().length > 20) {
      throw new ManagementError("playerTag must be a non-empty string of at most 20 characters");
    }
    fields.push("player_tag = ?"); values.push(body.playerTag.trim());
  }
  if (body && Object.hasOwn(body, "avatarUrl")) {
    if (body.avatarUrl !== null && (typeof body.avatarUrl !== "string" || body.avatarUrl.trim().length > 255)) {
      throw new ManagementError("avatarUrl must be null or a string of at most 255 characters");
    }
    fields.push("avatar_url = ?"); values.push(typeof body.avatarUrl === "string" && body.avatarUrl.trim() ? body.avatarUrl.trim() : null);
  }
  if (fields.length === 0) throw new ManagementError("Provide at least one player field to update");
  try {
    const [result] = await pool.query<ResultSetHeader>(`UPDATE players SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
    if (!result.affectedRows) throw new ManagementError("Player not found", 404);
  } catch (error) {
    if (isDuplicateKey(error)) throw new ManagementError("A player with that tag already exists", 409);
    throw error;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, player_tag AS playerTag, avatar_url AS avatarUrl, created_at AS createdAt FROM players WHERE id = ?`, [id],
  );
  return rows[0];
}

export async function deletePlayer(idInput: unknown) {
  const id = positiveId(idInput, "player ID");
  const [players] = await pool.execute<RowDataPacket[]>("SELECT id FROM players WHERE id = ?", [id]);
  if (!players[0]) throw new ManagementError("Player not found", 404);
  const [references] = await pool.execute<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM tournament_players WHERE player_id = ?) +
       (SELECT COUNT(*) FROM matches WHERE player1_id = ? OR player2_id = ? OR winner_id = ?) +
       (SELECT COUNT(*) FROM match_games WHERE winner_id = ?) +
       (SELECT COUNT(*) FROM player_decks WHERE player_id = ?) +
       (SELECT COUNT(*) FROM card_cooldowns WHERE player_id = ?) AS total`,
    [id, id, id, id, id, id, id],
  );
  if (Number(references[0]?.total ?? 0) > 0) {
    throw new ManagementError("This player is referenced by tournament history and cannot be deleted", 409);
  }
  await pool.execute("DELETE FROM players WHERE id = ?", [id]);
  return { id, deleted: true };
}

export async function listTournaments() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT t.id, t.name, t.status, t.winner_player_id AS winnerPlayerId,
            t.cooldown_duration AS cooldownDuration, t.ban_duplicate_decks AS banDuplicateDecks,
            t.match_format_bo AS matchFormatBo, t.tiebreaker_mode AS tiebreakerMode,
            COUNT(DISTINCT tp.player_id) AS playerCount, COUNT(DISTINCT m.id) AS fixtureCount
     FROM tournaments t
     LEFT JOIN tournament_players tp ON tp.tournament_id = t.id
     LEFT JOIN matches m ON m.tournament_id = t.id
     GROUP BY t.id ORDER BY t.created_at DESC, t.id DESC`,
  );
  return rows;
}

export async function createTournament(input: unknown) {
  const body = input as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) throw new ManagementError("name is required and must be at most 100 characters");
  const cooldownDuration = body?.cooldownDuration === undefined ? 2 : Number(body.cooldownDuration);
  const matchFormatBo = body?.matchFormatBo === undefined ? 3 : Number(body.matchFormatBo);
  const banDuplicateDecks = body?.banDuplicateDecks === undefined ? true : body.banDuplicateDecks;
  if (!Number.isSafeInteger(cooldownDuration) || cooldownDuration < 0) throw new ManagementError("cooldownDuration must be a non-negative integer");
  if (![3, 5].includes(matchFormatBo)) throw new ManagementError("matchFormatBo must be 3 or 5");
  if (typeof banDuplicateDecks !== "boolean") throw new ManagementError("banDuplicateDecks must be a boolean");
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO tournaments (name, cooldown_duration, ban_duplicate_decks, match_format_bo)
     VALUES (?, ?, ?, ?)`, [name, cooldownDuration, banDuplicateDecks, matchFormatBo],
  );
  return { id: result.insertId, name, status: "draft", cooldownDuration, banDuplicateDecks, matchFormatBo };
}

export async function getTournament(idInput: unknown) {
  const id = positiveId(idInput, "tournament ID");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, status, winner_player_id AS winnerPlayerId, cooldown_duration AS cooldownDuration,
            ban_duplicate_decks AS banDuplicateDecks, match_format_bo AS matchFormatBo,
            tiebreaker_mode AS tiebreakerMode, created_at AS createdAt
     FROM tournaments WHERE id = ?`, [id],
  );
  if (!rows[0]) return null;
  const [players] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id, p.name, p.player_tag AS playerTag, tp.points, tp.matches_played AS matchesPlayed,
            tp.matches_won AS matchesWon, tp.crowns_for AS crownsFor, tp.crowns_against AS crownsAgainst
     FROM tournament_players tp JOIN players p ON p.id = tp.player_id
     WHERE tp.tournament_id = ? ORDER BY tp.points DESC, p.name`, [id],
  );
  return { ...rows[0], players };
}

export async function updateTournament(idInput: unknown, input: unknown) {
  const id = positiveId(idInput, "tournament ID");
  const body = input as Record<string, unknown> | null;
  const [existingRows] = await pool.execute<RowDataPacket[]>("SELECT status FROM tournaments WHERE id = ?", [id]);
  const existing = existingRows[0] as (RowDataPacket & { status: TournamentStatus }) | undefined;
  if (!existing) throw new ManagementError("Tournament not found", 404);
  const assignments: string[] = [];
  const values: unknown[] = [];
  if (body && Object.hasOwn(body, "name")) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) throw new ManagementError("name must be a non-empty string of at most 100 characters");
    assignments.push("name = ?"); values.push(body.name.trim());
  }
  if (body && Object.hasOwn(body, "status")) {
    const allowed: TournamentStatus[] = ["draft", "active", "tiebreaker", "completed"];
    if (typeof body.status !== "string" || !allowed.includes(body.status as TournamentStatus)) throw new ManagementError("status must be draft, active, tiebreaker, or completed");
    if (body.status === "tiebreaker") throw new ManagementError("Create the tiebreaker through POST /api/tournaments/:id/tiebreaker", 409);
    if (body.status === "completed" && existing.status === "completed") throw new ManagementError("Tournament is already completed", 409);
    if (existing.status === "completed" && body.status !== "completed") throw new ManagementError("A completed tournament cannot be reopened", 409);
    assignments.push("status = ?"); values.push(body.status);
  }
  if (body && Object.hasOwn(body, "cooldownDuration")) {
    const value = Number(body.cooldownDuration);
    if (!Number.isSafeInteger(value) || value < 0) throw new ManagementError("cooldownDuration must be a non-negative integer");
    assignments.push("cooldown_duration = ?"); values.push(value);
  }
  if (body && Object.hasOwn(body, "matchFormatBo")) {
    const value = Number(body.matchFormatBo);
    if (![3, 5].includes(value)) throw new ManagementError("matchFormatBo must be 3 or 5");
    assignments.push("match_format_bo = ?"); values.push(value);
  }
  if (body && Object.hasOwn(body, "banDuplicateDecks")) {
    if (typeof body.banDuplicateDecks !== "boolean") throw new ManagementError("banDuplicateDecks must be a boolean");
    assignments.push("ban_duplicate_decks = ?"); values.push(body.banDuplicateDecks);
  }
  if (assignments.length === 0) throw new ManagementError("Provide at least one tournament field to update");
  if (body && Object.hasOwn(body, "status")) {
    const targetStatus = body.status as TournamentStatus;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [lockedRows] = await connection.execute<RowDataPacket[]>("SELECT status FROM tournaments WHERE id = ? FOR UPDATE", [id]);
      const current = lockedRows[0] as (RowDataPacket & { status: TournamentStatus }) | undefined;
      if (!current) throw new ManagementError("Tournament not found", 404);
      if (targetStatus !== current.status) {
        if (targetStatus === "active") {
          if (current.status !== "draft") throw new ManagementError("Only a draft tournament can be started", 409);
          const [counts] = await connection.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT tp.player_id) AS players, COUNT(DISTINCT m.id) AS fixtures
             FROM tournaments t LEFT JOIN tournament_players tp ON tp.tournament_id = t.id
             LEFT JOIN matches m ON m.tournament_id = t.id WHERE t.id = ?`, [id],
          );
          const count = counts[0] as (RowDataPacket & { players: number; fixtures: number }) | undefined;
          if (!count || Number(count.players) < 2 || Number(count.fixtures) < 1) {
            throw new ManagementError("Enroll at least two players and generate fixtures before starting", 409);
          }
        } else if (targetStatus === "completed") {
          if (current.status !== "active") throw new ManagementError("Only an active tournament can be completed directly", 409);
          const [pending] = await connection.execute<RowDataPacket[]>(
            "SELECT COUNT(*) AS total FROM matches WHERE tournament_id = ? AND status <> 'completed'", [id],
          );
          const [leaders] = await connection.execute<RowDataPacket[]>(
            `SELECT tp.player_id, tp.points FROM tournament_players tp
             WHERE tp.tournament_id = ? AND tp.points = (
               SELECT MAX(points) FROM tournament_players WHERE tournament_id = ?
             ) ORDER BY tp.player_id`, [id, id],
          );
          if (Number(pending[0]?.total ?? 0) > 0) throw new ManagementError("Complete all fixtures before completing the tournament", 409);
          if (leaders.length !== 1) throw new ManagementError("The tournament is tied; create a tiebreaker fixture instead", 409);
          assignments.push("winner_player_id = ?");
          values.push((leaders[0] as RowDataPacket & { player_id: number }).player_id);
        } else {
          throw new ManagementError("This tournament status transition is not allowed", 409);
        }
      }
      await connection.query<ResultSetHeader>(`UPDATE tournaments SET ${assignments.join(", ")} WHERE id = ?`, [...values, id]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } else {
    await pool.query<ResultSetHeader>(`UPDATE tournaments SET ${assignments.join(", ")} WHERE id = ?`, [...values, id]);
  }
  return getTournament(id);
}

export async function createTiebreakerFixture(tournamentIdInput: unknown, playerIdsInput: unknown) {
  const tournamentId = positiveId(tournamentIdInput, "tournament ID");
  if (!Array.isArray(playerIdsInput) || playerIdsInput.length !== 2) {
    throw new ManagementError("playerIds must contain exactly the two tied leaders");
  }
  const playerIds = playerIdsInput.map((value) => positiveId(value, "player ID"));
  if (playerIds[0] === playerIds[1]) throw new ManagementError("Tiebreaker players must be different");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tournaments] = await connection.execute<RowDataPacket[]>("SELECT status FROM tournaments WHERE id = ? FOR UPDATE", [tournamentId]);
    if (!tournaments[0]) throw new ManagementError("Tournament not found", 404);
    if (tournaments[0].status !== "active") throw new ManagementError("Only an active tournament can enter a tiebreaker", 409);
    const [pending] = await connection.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM matches WHERE tournament_id = ? AND status <> 'completed'", [tournamentId],
    );
    if (Number(pending[0]?.total ?? 0) > 0) throw new ManagementError("Complete all regular fixtures before starting a tiebreaker", 409);
    const [leaders] = await connection.execute<RowDataPacket[]>(
      `SELECT tp.player_id, tp.points FROM tournament_players tp
       WHERE tp.tournament_id = ? AND tp.points = (
         SELECT MAX(points) FROM tournament_players WHERE tournament_id = ?
       ) ORDER BY tp.player_id`, [tournamentId, tournamentId],
    );
    const leaderIds = leaders.map((row) => Number(row.player_id)).sort((a, b) => a - b);
    const selectedIds = [...playerIds].sort((a, b) => a - b);
    if (leaderIds.length !== 2 || leaderIds[0] !== selectedIds[0] || leaderIds[1] !== selectedIds[1]) {
      throw new ManagementError("A Bo5 tiebreaker is supported when exactly two players are tied for first", 409);
    }
    const [maxRows] = await connection.execute<RowDataPacket[]>("SELECT COALESCE(MAX(match_number), 0) AS max_number FROM matches WHERE tournament_id = ?", [tournamentId]);
    const matchNumber = Number(maxRows[0]?.max_number ?? 0) + 1;
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO matches (tournament_id, match_number, player1_id, player2_id, is_tiebreaker)
       VALUES (?, ?, ?, ?, TRUE)`, [tournamentId, matchNumber, playerIds[0], playerIds[1]],
    );
    await connection.execute("UPDATE tournaments SET status = 'tiebreaker' WHERE id = ?", [tournamentId]);
    await connection.commit();
    return { matchId: result.insertId, tournamentId, matchNumber, player1Id: playerIds[0], player2Id: playerIds[1], format: "bo5" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function addTournamentPlayers(tournamentIdInput: unknown, playerIdsInput: unknown) {
  const tournamentId = positiveId(tournamentIdInput, "tournament ID");
  if (!Array.isArray(playerIdsInput) || playerIdsInput.length === 0) throw new ManagementError("playerIds must be a non-empty array");
  const playerIds = [...new Set(playerIdsInput.map((value) => positiveId(value, "player ID")))];
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tournaments] = await connection.execute<RowDataPacket[]>("SELECT status FROM tournaments WHERE id = ? FOR UPDATE", [tournamentId]);
    if (!tournaments[0]) throw new ManagementError("Tournament not found", 404);
    if (tournaments[0].status !== "draft") throw new ManagementError("Players can only be added while a tournament is in draft", 409);
    const placeholders = playerIds.map(() => "?").join(",");
    const [players] = await connection.execute<RowDataPacket[]>(`SELECT id FROM players WHERE id IN (${placeholders})`, playerIds);
    if (players.length !== playerIds.length) throw new ManagementError("One or more player IDs do not exist");
    for (const playerId of playerIds) {
      await connection.execute("INSERT IGNORE INTO tournament_players (tournament_id, player_id) VALUES (?, ?)", [tournamentId, playerId]);
    }
    await connection.commit();
    return { tournamentId, playerIds };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function removeTournamentPlayer(tournamentIdInput: unknown, playerIdInput: unknown) {
  const tournamentId = positiveId(tournamentIdInput, "tournament ID");
  const playerId = positiveId(playerIdInput, "player ID");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tournaments] = await connection.execute<RowDataPacket[]>("SELECT status FROM tournaments WHERE id = ? FOR UPDATE", [tournamentId]);
    if (!tournaments[0]) throw new ManagementError("Tournament not found", 404);
    if (tournaments[0].status !== "draft") throw new ManagementError("Players can only be removed while a tournament is in draft", 409);
    const [fixtures] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM matches WHERE tournament_id = ? AND (player1_id = ? OR player2_id = ?) LIMIT 1",
      [tournamentId, playerId, playerId],
    );
    if (fixtures.length) throw new ManagementError("Cannot remove a player after fixtures have been created", 409);
    const [result] = await connection.execute<ResultSetHeader>(
      "DELETE FROM tournament_players WHERE tournament_id = ? AND player_id = ?", [tournamentId, playerId],
    );
    if (!result.affectedRows) throw new ManagementError("Player is not enrolled in this tournament", 404);
    await connection.commit();
    return { tournamentId, playerId, removed: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function generateRoundRobinFixtures(tournamentIdInput: unknown) {
  const tournamentId = positiveId(tournamentIdInput, "tournament ID");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tournaments] = await connection.execute<RowDataPacket[]>("SELECT status FROM tournaments WHERE id = ? FOR UPDATE", [tournamentId]);
    if (!tournaments[0]) throw new ManagementError("Tournament not found", 404);
    if (tournaments[0].status !== "draft") throw new ManagementError("Fixtures can only be generated while a tournament is in draft", 409);
    const [existing] = await connection.execute<RowDataPacket[]>("SELECT id FROM matches WHERE tournament_id = ? LIMIT 1", [tournamentId]);
    if (existing.length) throw new ManagementError("Fixtures already exist for this tournament", 409);
    const [players] = await connection.execute<Array<RowDataPacket & { player_id: number }>>(
      "SELECT player_id FROM tournament_players WHERE tournament_id = ? ORDER BY player_id", [tournamentId],
    );
    if (players.length < 2) throw new ManagementError("Add at least two players before generating fixtures", 409);
    let matchNumber = 1;
    const fixtures: Array<{ matchNumber: number; player1Id: number; player2Id: number }> = [];
    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const player1Id = players[i]?.player_id;
        const player2Id = players[j]?.player_id;
        if (player1Id === undefined || player2Id === undefined) continue;
        await connection.execute(
          "INSERT INTO matches (tournament_id, match_number, player1_id, player2_id) VALUES (?, ?, ?, ?)",
          [tournamentId, matchNumber, player1Id, player2Id],
        );
        fixtures.push({ matchNumber, player1Id, player2Id });
        matchNumber += 1;
      }
    }
    await connection.commit();
    return { tournamentId, fixtureCount: fixtures.length, fixtures };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}
