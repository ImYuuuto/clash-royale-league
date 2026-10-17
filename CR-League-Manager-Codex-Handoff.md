# CR League Manager — Codex Handoff

## Purpose

Continue development of **CR League Manager**, a local desktop application for managing Clash Royale tournaments. This document is the project handoff for Codex: inspect the existing repository first, preserve its conventions, verify assumptions against the actual code and database, and implement changes incrementally.

Do not blindly rewrite working files. Before editing, inspect the current repository, `package.json`, TypeScript configuration, SQL schema/migrations, and Git status.

## Current stack

- Frontend: React + JavaScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MySQL, using `mysql2/promise`
- Desktop shell planned/used by the project: Electron
- Styling preference for the current React work: Tailwind CSS
- Backend working directory (Windows):  
  `C:\Users\yasse\Desktop\Dev\Projects\cr-league\cr-league-app\backend`

Use the existing project structure and dependencies. Do not introduce a framework or ORM without a clear need.

## Developer preferences

- Explain and implement changes step by step.
- Favor practical, readable, maintainable code and sensible validation.
- Keep HTTP controllers thin; put business logic in services.
- Use parameterized SQL queries.
- Keep TypeScript strict; do not “fix” type errors by disabling strict compiler options or adding unsafe casts/non-null assertions without justification.
- Run the available build/tests after changes and report exact outcomes.
- Do not assume database seed data exists.
- Do not silently change the tournament rules listed below.

## Tournament rules

1. A fixture is a match between two tournament players. An individual game is one game inside that fixture.
2. A normal fixture uses the tournament's configured `match_format_bo` (normally best-of-three). The first player to win `ceil(match_format_bo / 2)` individual games wins the fixture.
3. A tiebreaker is a best-of-five mini-final: first to three individual-game wins.
4. Winning a fixture awards **3 tournament points**; losing awards **0**. Do not award tournament points after every individual game.
5. A deck contains exactly 8 distinct cards.
6. A player may not reuse the same exact 8-card combination during the same tournament. Card order does not matter. This is controlled by the tournament's `ban_duplicate_decks` setting.
7. After a player uses a deck in an individual game, all 8 cards used by that player are unavailable for that player's next `cooldown_duration` individual games. The default is 2 games. Cooldowns are per player, and games by the opponent do not advance that player's cooldown.
8. A card becomes available again after it is outside the player's most recent `cooldown_duration` individual games. If a card is reused after becoming available, its cooldown starts again.
9. Opponents may use overlapping cards. There is no rule preventing both players from using the same Clash Royale card.
10. After a game, record the winner, both players' crown counts, and each player's 8-card deck.
11. The app should show fixtures, player details, and each player's banned/available cards before a game. Ideally show each banned card's remaining cooldown count.
12. Analytics planned: win rate, crown efficiency, clutch score (wins in Game 3/Game 5), unique card/deck diversity, most exhausted cards, card win rates, card synergy heatmap, and average elixir cost for winning versus losing decks.

## Database schema supplied by the user

The schema uses these tables and columns:

```sql
CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    player_tag VARCHAR(20) UNIQUE NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status ENUM('draft', 'active', 'tiebreaker', 'completed') DEFAULT 'draft',
    winner_player_id INT NULL,
    cooldown_duration INT DEFAULT 2,
    ban_duplicate_decks BOOLEAN DEFAULT TRUE,
    match_format_bo INT DEFAULT 3,
    tiebreaker_mode VARCHAR(30) DEFAULT 'bo5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_player_id) REFERENCES players(id)
);

CREATE TABLE tournament_players (
    tournament_id INT,
    player_id INT,
    points INT DEFAULT 0,
    matches_played INT DEFAULT 0,
    matches_won INT DEFAULT 0,
    crowns_for INT DEFAULT 0,
    crowns_against INT DEFAULT 0,
    PRIMARY KEY (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    match_number INT NOT NULL,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    winner_id INT NULL,
    is_tiebreaker BOOLEAN DEFAULT FALSE,
    status ENUM('scheduled', 'in_progress', 'completed') DEFAULT 'scheduled',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player1_id) REFERENCES players(id),
    FOREIGN KEY (player2_id) REFERENCES players(id),
    FOREIGN KEY (winner_id) REFERENCES players(id)
);

CREATE TABLE match_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    game_number INT NOT NULL,
    winner_id INT NOT NULL,
    p1_crowns INT DEFAULT 0,
    p2_crowns INT DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (winner_id) REFERENCES players(id)
);

CREATE TABLE cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    rarity ENUM('Common', 'Rare', 'Epic', 'Legendary', 'Champion') NOT NULL,
    elixir_cost INT NOT NULL,
    icon_url VARCHAR(255)
);

CREATE TABLE card_cooldowns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    player_id INT NOT NULL,
    card_id INT NOT NULL,
    match_number_played INT NOT NULL,
    cooldown_until_match INT NOT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);

CREATE TABLE player_decks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    player_id INT NOT NULL,
    match_game_id INT NOT NULL,
    deck_hash VARCHAR(64) NOT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (match_game_id) REFERENCES match_games(id)
);
```

## Database changes already reported as successful

The user confirmed that both migrations below have been run successfully:

```sql
ALTER TABLE card_cooldowns
ADD COLUMN match_game_id INT NULL,
ADD CONSTRAINT fk_cooldowns_match_game
    FOREIGN KEY (match_game_id)
    REFERENCES match_games(id);
```

```sql
ALTER TABLE player_decks
ADD CONSTRAINT uq_player_deck_tournament_hash
UNIQUE (tournament_id, player_id, deck_hash);
```

**Important design issue:** The unique key on `(tournament_id, player_id, deck_hash)` prevents repeated decks even when `tournaments.ban_duplicate_decks = FALSE`. If that setting must genuinely allow duplicates, this constraint is incompatible with the rule. Inspect the current database and discuss a robust alternative before changing it. Do not simply ignore the configuration flag or silently drop a constraint without considering race safety. Also note that a `UNIQUE` key across these columns is correct for enforcing no duplicate deck per player per tournament when the setting is always enabled.

The new `match_game_id` column is nullable to accommodate any old rows. New registrations should populate it. Old rows with `NULL` need a considered migration/backfill if any historical data exists.

## Backend status

The backend is using Express, TypeScript, `mysql2/promise`, and `tsx` for development. The user confirmed the server starts and connects to MySQL.

Scripts currently expected in `backend/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

Existing database module is expected at `src/config/database.ts`. It uses `mysql.createPool`, validates required environment variables, and exports `pool` and `testDatabaseConnection()`.

Expected environment variables in `backend/.env` (never commit the actual `.env` or reveal secrets):

```dotenv
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-local-password
DB_NAME=cr_league
```

The server currently mounts the API router at `/api` and exposes:
- `GET /api/health`
- `GET /api/health/db`
- `GET /api/`

The route index imports and mounts:
- fixture routes under `/api/tournaments`
- game routes under `/api/matches`

Inspect the actual files before relying on this description.

## Fixture API already implemented

Endpoint:

`GET /api/tournaments/:id/fixtures`

Files expected:
- `src/services/fixture.service.ts`
- `src/controllers/fixture.controller.ts`
- `src/routes/fixture.routes.ts`

The service fetches tournament fixtures, player details, points, and card availability for each player. It gets each player's recent individual games from `player_decks` joined to `match_games` and `matches`, then uses `card_cooldowns.match_game_id` to identify banned cards.

Known limitations to review:
- Fixture response currently returns `bannedCards` and `availableCards`, but doesn't yet include remaining cooldown count for each banned card.
- It may enrich historical/completed fixtures with current availability, which is misleading if the endpoint returns all fixtures. Decide whether to return only upcoming/in-progress fixtures or clearly separate current pre-match availability from historical fixture data.
- Ensure recent-game ordering is based on the player's actual individual-game chronology, such as `m.match_number DESC, mg.game_number DESC, mg.id DESC`, and not only `mg.id`.
- Cooldowns must count the player's own individual games, not fixtures or opponent games.
- If no cards are seeded in `cards`, availability lists will be empty; this is a data-seeding issue, not necessarily an API error.

The service's `getTournamentFixtures` returns `null` for a nonexistent tournament. Controller responds 404 for that case and 400 for an invalid tournament ID.

## Game-registration endpoint in progress

Target endpoint:

`POST /api/matches/:matchId/games`

Expected request body:

```json
{
  "gameNumber": 1,
  "winnerId": 12,
  "player1": {
    "crowns": 2,
    "cardIds": [1, 2, 3, 4, 5, 6, 7, 8]
  },
  "player2": {
    "crowns": 1,
    "cardIds": [9, 10, 11, 12, 13, 14, 15, 16]
  }
}
```

These are example IDs only. Real player/card IDs must exist in the database.

Expected files:
- `src/services/game.service.ts`
- `src/controllers/game.controller.ts`
- `src/routes/game.routes.ts`
- `src/routes/index.ts`

Controller catches `GameRegistrationError` and returns its status code/message. Other errors go to Express `next(error)`.

The service currently implements:
- Request shape/basic validation.
- Canonical deck hash with SHA-256 over sorted card IDs.
- Transaction and fixture row lock (`SELECT ... FOR UPDATE`).
- Checks that the fixture exists, is not complete, and the tournament is active or in tiebreaker state.
- Checks winner is one of the fixture players.
- Sequential game number check.
- Bo3/Bo5 game-win threshold.
- Card existence check.
- Tournament-player membership check.
- Cooldown validation based on the player's recent games.
- Duplicate deck validation when `ban_duplicate_decks` is enabled.
- Inserts a `match_games` row.
- Inserts one `player_decks` row and eight `card_cooldowns` rows per player.
- Adds crown totals to `tournament_players`.
- When the fixture is decided, marks `matches` completed and awards 3 points to the fixture winner, 0 to the loser, and increments fixture-level matches played/won.
- Commits on success; rolls back on failure.

## Immediate next action: verify build and repair issues

The user ran `npm run build` and reported exactly two TypeScript errors:

```text
src/services/fixture.service.ts:124:28 - error TS2532:
Object is possibly 'undefined'.
124 const cooldownDuration = tournaments[0].cooldown_duration;

src/services/game.service.ts:398:20 - error TS2532:
Object is possibly 'undefined'.
398 if (Number(existingDecks[0].total) > 0) {
```

The suggested fixes were:

In `fixture.service.ts`:

```ts
const tournament = tournaments[0];
if (!tournament) return null;
const cooldownDuration = tournament.cooldown_duration;
```

In `game.service.ts`:

```ts
const existingDeck = existingDecks[0];
if (existingDeck && Number(existingDeck.total) > 0) {
  throw new GameRegistrationError(
    `Player ${submission.playerId} has already used this deck in the tournament`,
    409,
  );
}
```

User has not yet reported the build result after applying these changes. First ask for/inspect the current state and run `npm run build` if you have tool access to the repo; do not assume they applied the fixes.

## Critical logic concerns to fix before calling the endpoint production-ready

Inspect actual current code and repair carefully:

1. **Cooldown query ordering.** `getBannedCardIds` must order by:
   ```sql
   ORDER BY m.match_number DESC, mg.game_number DESC, mg.id DESC
   ```
   rather than ID alone. Because it finds the latest `cooldown_duration` games played by this player, cards from those games are banned.

2. **`card_cooldowns` data model.** New code should insert one row per used card per player and set `match_game_id`. The service also fills legacy `match_number_played` and `cooldown_until_match`; those legacy fixture-based columns should not drive cooldown logic because cooldowns are based on individual games.

3. **Crowns validation.** Current service only validates non-negative integer crowns. It does not ensure the winner's crown count is greater than the loser's. Decide the rule explicitly before enforcing; overtime/draw rules might mean the game's actual winner cannot always be inferred solely from crowns. The submitted `winnerId` remains authoritative unless product requirements say otherwise.

4. **Cross-player overlapping cards.** A prior version wrongly rejected overlapping cards between opponents. The user rules do not prohibit it; ensure this restriction has been removed.

5. **Duplicate deck config and DB unique constraint.** As noted above, DB unique constraint currently conflicts with `ban_duplicate_decks = FALSE`. Need resolve before treating feature as complete. A common approach is to store a nullable uniqueness key that is populated only when enforcement is enabled, or enforce duplicates consistently for all tournaments and remove/ignore the toggle—but the latter changes requirements. Discuss or implement a race-safe schema approach. For MySQL, a generated column or nullable `unique_enforcement_key` may work but must be designed carefully with current schema and duplicate history.

6. **Deck hash includes card IDs only.** It sorts IDs so card order doesn't matter. This is correct.

7. **Series concurrency / game number.** `SELECT ... FOR UPDATE` on the fixture row serializes registrations for that fixture. Keep game-number validation inside the transaction. Add/consider a unique key `(match_id, game_number)` on `match_games` as defense-in-depth, after checking existing data.

8. **Fixture completion and points.** Tournament points are awarded once only when fixture reaches its required win count. Ensure duplicate request/retry cannot award points twice. Since a completed fixture is rejected and the fixture row is locked, that should work, but test it.

9. **Tiebreaker logic.** The current service sets `gamesToWin = 3` if `is_tiebreaker` or tournament status is `tiebreaker`. Confirm that is consistent with the intended workflow; a tiebreaker should be a Bo5 mini-final, while normal fixtures use `match_format_bo`.

10. **Player membership.** Ensure both players are enrolled in the tournament.

11. **Player deck FK.** The supplied schema has `player_decks.match_game_id INT NOT NULL` with FK to `match_games`. Ensure game insert precedes deck inserts (current code does).

12. **Transactions and error handling.** Roll back and release in all error paths. Be mindful that an error during rollback could mask the original error; improve if needed.

13. **HTTP error handling.** Unexpected errors currently go to `next(error)`. Confirm there is centralized error middleware; if not, add a safe JSON error handler without exposing internal SQL/secret details.

14. **Schema correctness.** Supplied `match_games` does not currently declare a foreign key on `match_id`, although logically it should. Don't alter without checking the actual DB and any existing records.

15. **Data seeding.** To test endpoint, ensure there are two players, an active tournament, both players in `tournament_players`, a fixture in `matches`, and at least 16 real card rows. Do not assume IDs 1–16 exist.

## Recommended next development sequence

1. Confirm build now passes; fix any new compile errors.
2. Audit and correct logic issues above.
3. Add database uniqueness for `(match_id, game_number)` after checking data.
4. Add centralized error middleware if missing.
5. Prepare test data or a reproducible seed script.
6. Test success, invalid card count, unknown card IDs, invalid winner, banned card, repeated deck, wrong game number, fixture completion, and duplicate submission.
7. Improve fixture availability to return remaining cooldown count.
8. Implement tournament/player CRUD endpoints, then analytics.
9. Connect frontend to API only after the endpoint and response shape are stable.
10. Integrate with Electron after the web app workflow is stable.

## Commands

From the backend directory:

```powershell
npm run build
npm run dev
```

Test the endpoint with an API client:
- Method: `POST`
- URL: `http://localhost:3000/api/matches/1/games`
- Body: JSON request shown above, using real IDs.

Do not commit `.env`, database passwords, or other secrets.

## Working agreement for Codex

Start by inspecting the current working tree and the relevant files. Then:
1. State what is currently implemented and what you found.
2. Fix the build errors if still present.
3. Make a small, logically grouped change.
4. Run `npm run build` and any existing tests.
5. Report files changed, commands run, results, and remaining risks.
6. Do not assume the user wants a broad refactor. Keep changes aligned with the tournament rules and this handoff.
