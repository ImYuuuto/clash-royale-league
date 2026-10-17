ALTER TABLE card_cooldowns
ADD COLUMN match_game_id INT NULL,
ADD CONSTRAINT fk_cooldowns_match_game
    FOREIGN KEY (match_game_id)
    REFERENCES match_games(id);

ALTER TABLE player_decks
ADD CONSTRAINT uq_player_deck_tournament_hash
UNIQUE (tournament_id, player_id, deck_hash);

select * from match_games;