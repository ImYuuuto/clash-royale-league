-- Enforce one row per individual game number within a fixture.
-- This migration is safe on fresh schemas where the key is already present.
DELIMITER //
DROP PROCEDURE IF EXISTS apply_match_game_number_unique_migration //
CREATE PROCEDURE apply_match_game_number_unique_migration()
BEGIN
    IF EXISTS (
        SELECT 1
        FROM match_games
        GROUP BY match_id, game_number
        HAVING COUNT(*) > 1
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate match_id/game_number rows exist; resolve them before applying this migration';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'match_games'
          AND index_name = 'uq_match_games_match_game_number'
    ) THEN
        ALTER TABLE match_games
        ADD CONSTRAINT uq_match_games_match_game_number
        UNIQUE (match_id, game_number);
    END IF;
END //
CALL apply_match_game_number_unique_migration() //
DROP PROCEDURE apply_match_game_number_unique_migration //
DELIMITER ;
