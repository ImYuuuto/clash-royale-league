-- Active: 1790167023671@@127.0.0.1@3306@clash_royale_league
-- Global Players
drop database clash_royale_league;
create database clash_royale_league;
use clash_royale_league;
CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    player_tag VARCHAR(20) UNIQUE NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments with Configurable Rules Columns
CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status ENUM('draft', 'active', 'tiebreaker', 'completed') DEFAULT 'draft',
    winner_player_id INT NULL,
    -- Dynamic Rules Configuration Columns
    cooldown_duration INT DEFAULT 2,          -- Number of matches a card stays banned (0 = disabled)
    ban_duplicate_decks BOOLEAN DEFAULT TRUE, -- Prevent playing the exact same 8-card deck twice
    match_format_bo INT DEFAULT 3,            -- 3 for Bo3, 5 for Bo5 standard fixtures
    tiebreaker_mode VARCHAR(30) DEFAULT 'bo5', -- 'bo5', 'head_to_head', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_player_id) REFERENCES players(id)
);

-- Tournament Standings Table
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

-- Fixtures
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

-- Individual Games in Sets
CREATE TABLE match_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    game_number INT NOT NULL,
    winner_id INT NOT NULL,
    p1_crowns INT DEFAULT 0,
    p2_crowns INT DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (winner_id) REFERENCES players(id),
    UNIQUE KEY uq_match_games_match_game_number (match_id, game_number)
);

-- Cards Master Catalog
CREATE TABLE cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    rarity ENUM('Common', 'Rare', 'Epic', 'Legendary', 'Champion') NOT NULL,
    elixir_cost INT NOT NULL,
    icon_url VARCHAR(255)
);

-- Dynamic Cooldown Tracker
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

-- 8-Card Deck Signatures. Duplicate prevention is conditional on the
-- tournament setting and is enforced transactionally by the API.
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
