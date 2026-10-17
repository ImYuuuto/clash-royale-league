-- Allow repeated decks when tournaments.ban_duplicate_decks is disabled.
-- The API checks for prior hashes while holding the fixture row lock in its
-- transaction, so a table-wide unique key would conflict with the setting.
-- Safe to run only if migration_1.sql's constraint exists; this migration
-- removes that unconditional restriction.
ALTER TABLE player_decks
DROP INDEX uq_player_deck_tournament_hash;
