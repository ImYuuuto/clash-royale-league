ALTER TABLE card_cooldowns
ADD COLUMN match_game_id INT NULL,
ADD CONSTRAINT fk_cooldowns_match_game
    FOREIGN KEY (match_game_id)
    REFERENCES match_games(id);

-- Duplicate-deck enforcement is performed transactionally by the API because
-- it depends on tournaments.ban_duplicate_decks. A table-wide UNIQUE key would
-- incorrectly forbid duplicates in tournaments where that setting is disabled.
