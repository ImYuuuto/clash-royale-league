-- Allow repeated decks when tournaments.ban_duplicate_decks is disabled.
-- The API checks for prior hashes while holding the fixture row lock in its
-- transaction, so a table-wide unique key would conflict with the setting.
-- Safe to run only if migration_1.sql's constraint exists; this migration
-- removes that unconditional restriction.
SET @drop_deck_unique_sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'player_decks'
      AND index_name = 'uq_player_deck_tournament_hash'
  ),
  'ALTER TABLE player_decks DROP INDEX uq_player_deck_tournament_hash',
  'SELECT 1'
);
PREPARE drop_deck_unique_stmt FROM @drop_deck_unique_sql;
EXECUTE drop_deck_unique_stmt;
DEALLOCATE PREPARE drop_deck_unique_stmt;
