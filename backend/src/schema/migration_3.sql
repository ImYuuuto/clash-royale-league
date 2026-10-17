-- Enforce one row per individual game number within a fixture.
-- Run the duplicate check first. If it returns any rows, investigate and
-- resolve those records deliberately before applying the unique key.
SELECT
    match_id,
    game_number,
    COUNT(*) AS duplicate_count,
    GROUP_CONCAT(id ORDER BY id) AS game_ids
FROM match_games
GROUP BY match_id, game_number
HAVING COUNT(*) > 1;

-- Apply only when the query above returns no rows.
ALTER TABLE match_games
ADD CONSTRAINT uq_match_games_match_game_number
UNIQUE (match_id, game_number);
