import assert from "node:assert/strict";
import crypto from "node:crypto";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const envPath = process.env.CR_LEAGUE_SETTINGS_PATH || ".env";
dotenv.config({ path: envPath });

const databaseName = process.env.DB_NAME;
if (!databaseName || !databaseName.toLowerCase().endsWith("_test")) {
  throw new Error("Refusing to run: configure DB_NAME to a dedicated database ending in _test.");
}

const apiUrl = (process.env.CR_LEAGUE_TEST_API || "http://127.0.0.1:4000").replace(/\/$/, "");
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: databaseName,
  connectTimeout: 5000,
});

const suffix = crypto.randomBytes(5).toString("hex");
const tournamentName = `Integration verification ${suffix}`;
const playerTags = [`#T${suffix.slice(0, 8)}`, `#U${suffix.slice(0, 8)}`];
let tournamentId;
let playerIds = [];
let matchId;
let passed = 0;

function check(condition, label) {
  assert.ok(condition, label);
  passed += 1;
  console.log(`PASS ${label}`);
}

async function postGame(payload) {
  const response = await fetch(`${apiUrl}/api/matches/${matchId}/games`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  let body;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
}

function submission(gameNumber, winnerId, deck1, deck2) {
  return {
    gameNumber,
    winnerId,
    player1: { crowns: 2, cardIds: deck1 },
    player2: { crowns: 1, cardIds: deck2 },
  };
}

try {
  const [columns] = await connection.query("SHOW COLUMNS FROM card_cooldowns LIKE 'match_game_id'");
  const [gameNumberIndex] = await connection.query("SHOW INDEX FROM match_games WHERE Key_name = 'uq_match_games_match_game_number'");
  check(columns.length > 0, "card_cooldowns.match_game_id migration is applied");
  check(gameNumberIndex.length > 0, "unique fixture game-number migration is applied");

  const [cards] = await connection.query("SELECT id FROM cards ORDER BY id LIMIT 48");
  check(cards.length >= 48, "at least 48 card rows are seeded for isolated test decks");
  const ids = cards.map((card) => Number(card.id));
  const decks = Array.from({ length: 6 }, (_, index) => ids.slice(index * 8, index * 8 + 8));

  const [players] = await connection.query(
    "INSERT INTO players (name, player_tag) VALUES (?, ?), (?, ?)",
    [`Verifier A ${suffix}`, playerTags[0], `Verifier B ${suffix}`, playerTags[1]],
  );
  playerIds = [Number(players.insertId), Number(players.insertId) + 1];

  const [tournament] = await connection.query(
    `INSERT INTO tournaments (name, status, cooldown_duration, ban_duplicate_decks, match_format_bo)
     VALUES (?, 'active', 1, TRUE, 3)`, [tournamentName],
  );
  tournamentId = Number(tournament.insertId);
  await connection.query(
    "INSERT INTO tournament_players (tournament_id, player_id) VALUES (?, ?), (?, ?)",
    [tournamentId, playerIds[0], tournamentId, playerIds[1]],
  );
  const [match] = await connection.query(
    "INSERT INTO matches (tournament_id, match_number, player1_id, player2_id) VALUES (?, 1, ?, ?)",
    [tournamentId, playerIds[0], playerIds[1]],
  );
  matchId = Number(match.insertId);

  const tooFewCards = submission(1, playerIds[0], decks[0].slice(0, 7), decks[1]);
  check((await postGame(tooFewCards)).status === 400, "rejects a deck with fewer than eight cards");

  const unknownCardDeck = [...decks[0].slice(0, 7), 2147483647];
  check((await postGame(submission(1, playerIds[0], unknownCardDeck, decks[1]))).status === 400,
    "rejects unknown card IDs");

  check((await postGame(submission(1, 999999999, decks[0], decks[1]))).status === 400,
    "rejects a winner outside the fixture");

  const first = await postGame(submission(1, playerIds[0], decks[0], decks[1]));
  check(first.status === 201 && first.body?.data?.fixtureCompleted === false,
    `registers the first valid game (${first.status}: ${first.body?.message || JSON.stringify(first.body)})`);

  check((await postGame(submission(2, playerIds[0], decks[0], decks[2]))).status === 409,
    "rejects a card deck still on cooldown");

  check((await postGame(submission(3, playerIds[0], decks[2], decks[3]))).status === 409,
    "rejects a non-sequential game number");

  const second = await postGame(submission(2, playerIds[1], decks[2], decks[3]));
  check(second.status === 201 && second.body?.data?.fixtureCompleted === false,
    `registers the second valid game (${second.status}: ${second.body?.message || JSON.stringify(second.body)})`);

  check((await postGame(submission(3, playerIds[0], decks[0], decks[4]))).status === 409,
    "rejects a repeated deck after its cards leave cooldown");

  const third = await postGame(submission(3, playerIds[0], decks[4], decks[5]));
  check(third.status === 201 && third.body?.data?.fixtureCompleted === true, "completes the best-of-three fixture");

  check((await postGame(submission(4, playerIds[1], decks[1], decks[0]))).status === 409,
    "rejects submissions after fixture completion");

  const [scoreRows] = await connection.query(
    `SELECT m.status, m.winner_id, tp1.points AS winner_points, tp1.matches_played AS winner_matches,
            tp2.points AS loser_points, tp2.matches_played AS loser_matches
     FROM matches m
     JOIN tournament_players tp1 ON tp1.tournament_id = m.tournament_id AND tp1.player_id = m.winner_id
     JOIN tournament_players tp2 ON tp2.tournament_id = m.tournament_id AND tp2.player_id = IF(m.winner_id = m.player1_id, m.player2_id, m.player1_id)
     WHERE m.id = ?`, [matchId],
  );
  check(scoreRows[0]?.status === "completed" && Number(scoreRows[0]?.winner_points) === 3 && Number(scoreRows[0]?.loser_points) === 0,
    "awards fixture points once to the winner");
  check(Number(scoreRows[0]?.winner_matches) === 1 && Number(scoreRows[0]?.loser_matches) === 1,
    "increments fixture match counts once for both players");

  console.log(`\n${passed} integration checks passed.`);
} finally {
  if (tournamentId) {
    await connection.beginTransaction();
    try {
      await connection.query(
        "DELETE FROM card_cooldowns WHERE tournament_id = ? AND player_id IN (?, ?)",
        [tournamentId, ...playerIds],
      );
      await connection.query("DELETE FROM player_decks WHERE tournament_id = ?", [tournamentId]);
      await connection.query("DELETE FROM match_games WHERE match_id = ?", [matchId]);
      await connection.query("DELETE FROM matches WHERE tournament_id = ?", [tournamentId]);
      await connection.query("DELETE FROM tournament_players WHERE tournament_id = ?", [tournamentId]);
      await connection.query("DELETE FROM tournaments WHERE id = ?", [tournamentId]);
      if (playerIds.length) await connection.query("DELETE FROM players WHERE id IN (?, ?)", playerIds);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error("Test data cleanup failed; inspect the dedicated test database before rerunning.");
      throw error;
    }
  }
  await connection.end();
}
