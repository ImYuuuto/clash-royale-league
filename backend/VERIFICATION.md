# Backend verification

The game-flow integration verifier writes temporary players, a tournament, a fixture, game results, decks, and cooldown rows. It only runs when `DB_NAME` ends in `_test` and removes the records it creates when it finishes.

## Prepare an isolated test database

1. Create a dedicated MySQL database whose name ends with `_test` (for example, `cr_league_test`).
2. Apply `src/schema/schema.sql` to that database, then apply the incremental migrations needed by the current app, including `migration_1.sql`, `migration_2.sql`, and `migration_3.sql`. Do not run the schema file against a database with data: it drops and recreates its database.
3. Seed at least 48 cards using `src/seeds/seed_cards.sql`.
4. Create a `.env.test` file with credentials for only that test database. Keep it uncommitted.
5. Start the backend with `CR_LEAGUE_SETTINGS_PATH=.env.test` and `PORT=3001` (or another unused port).
6. In a second terminal, run the verifier with the same `.env.test` and set `CR_LEAGUE_TEST_API` to the running API address.

PowerShell example:

```powershell
$env:CR_LEAGUE_SETTINGS_PATH = ".env.test"
$env:PORT = "3001"
npm run dev
```

In another PowerShell terminal:

```powershell
$env:CR_LEAGUE_SETTINGS_PATH = ".env.test"
$env:CR_LEAGUE_TEST_API = "http://127.0.0.1:3001"
npm run verify:integration
```

The verifier exits on the first failed assertion and prints each successful check. If cleanup fails because of a connection interruption, inspect the dedicated test database before rerunning.

## Checks covered

- Required schema migrations and card seed availability
- Invalid deck size, unknown cards, and winner outside the fixture
- Valid game registration and sequential game numbering
- Card cooldown and repeated-deck enforcement
- Best-of-three fixture completion and one-time tournament points/match totals
- Rejection of results after fixture completion
