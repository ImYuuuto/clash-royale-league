-- Disable foreign key checks during batch insert
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE cards;
SET FOREIGN_KEY_CHECKS = 1; 

-- ========================================================
-- COMMONS
-- ========================================================
INSERT INTO cards (id, name, rarity, elixir_cost, icon_url) VALUES
(1, 'Skeletons', 'Common', 1, '/assets/cards/skeletons.png'),
(2, 'Electro Spirit', 'Common', 1, '/assets/cards/electro-spirit.png'),
(3, 'Fire Spirit', 'Common', 1, '/assets/cards/fire-spirit.png'),
(4, 'Ice Spirit', 'Common', 1, '/assets/cards/ice-spirit.png'),
(5, 'Heal Spirit', 'Common', 1, '/assets/cards/heal-spirit.png'),
(6, 'Goblins', 'Common', 2, '/assets/cards/goblins.png'),
(7, 'Spear Goblins', 'Common', 2, '/assets/cards/spear-goblins.png'),
(8, 'Bats', 'Common', 2, '/assets/cards/bats.png'),
(9, 'Zap', 'Common', 2, '/assets/cards/zap.png'),
(10, 'Giant Snowball', 'Common', 2, '/assets/cards/giant-snowball.png'),
(11, 'Berserker', 'Common', 2, '/assets/cards/berserker.png'),
(12, 'Archers', 'Common', 3, '/assets/cards/archers.png'),
(13, 'Minions', 'Common', 3, '/assets/cards/minions.png'),
(14, 'Knight', 'Common', 3, '/assets/cards/knight.png'),
(15, 'Skeleton Barrel', 'Common', 3, '/assets/cards/skeleton-barrel.png'),
(16, 'Goblin Gang', 'Common', 3, '/assets/cards/goblin-gang.png'),
(17, 'Firecracker', 'Common', 3, '/assets/cards/firecracker.png'),
(18, 'Arrows', 'Common', 3, '/assets/cards/arrows.png'),
(19, 'Cannon', 'Common', 3, '/assets/cards/cannon.png'),
(20, 'Royal Delivery', 'Common', 3, '/assets/cards/royal-delivery.png'),
(21, 'Skeleton Dragons', 'Common', 4, '/assets/cards/skeleton-dragons.png'),
(22, 'Mortar', 'Common', 4, '/assets/cards/mortar.png'),
(23, 'Tesla', 'Common', 4, '/assets/cards/tesla.png'),
(24, 'Barbarians', 'Common', 5, '/assets/cards/barbarians.png'),
(25, 'Minion Horde', 'Common', 5, '/assets/cards/minion-horde.png'),
(26, 'Rascals', 'Common', 5, '/assets/cards/rascals.png'),
(27, 'Royal Giant', 'Common', 6, '/assets/cards/royal-giant.png'),
(28, 'Elite Barbarians', 'Common', 6, '/assets/cards/elite-barbarians.png'),
(29, 'Royal Recruits', 'Common', 7, '/assets/cards/royal-recruits.png');

-- ========================================================
-- RARES
-- ========================================================
INSERT INTO cards (id, name, rarity, elixir_cost, icon_url) VALUES
(30, 'Ice Golem', 'Rare', 2, '/assets/cards/ice-golem.png'),
(31, 'Mega Minion', 'Rare', 3, '/assets/cards/mega-minion.png'),
(32, 'Dart Goblin', 'Rare', 3, '/assets/cards/dart-goblin.png'),
(33, 'Elixir Golem', 'Rare', 3, '/assets/cards/elixir-golem.png'),
(34, 'Tombstone', 'Rare', 3, '/assets/cards/tombstone.png'),
(35, 'Earthquake', 'Rare', 3, '/assets/cards/earthquake.png'),
(36, 'Fireball', 'Rare', 4, '/assets/cards/fireball.png'),
(37, 'Mini P.E.K.K.A', 'Rare', 4, '/assets/cards/mini-pekka.png'),
(38, 'Musketeer', 'Rare', 4, '/assets/cards/musketeer.png'),
(39, 'Hog Rider', 'Rare', 4, '/assets/cards/hog-rider.png'),
(40, 'Valkyrie', 'Rare', 4, '/assets/cards/valkyrie.png'),
(41, 'Battle Ram', 'Rare', 4, '/assets/cards/battle-ram.png'),
(42, 'Zappies', 'Rare', 4, '/assets/cards/zappies.png'),
(43, 'Flying Machine', 'Rare', 4, '/assets/cards/flying-machine.png'),
(44, 'Heal Spirit Rare', 'Rare', 4, '/assets/cards/battle-healer.png'),
(45, 'Bomb Tower', 'Rare', 4, '/assets/cards/bomb-tower.png'),
(46, 'Goblin Cage', 'Rare', 4, '/assets/cards/goblin-cage.png'),
(47, 'Furnace', 'Rare', 4, '/assets/cards/furnace.png'),
(48, 'Giant', 'Rare', 5, '/assets/cards/giant.png'),
(49, 'Wizard', 'Rare', 5, '/assets/cards/wizard.png'),
(50, 'Royal Hogs', 'Rare', 5, '/assets/cards/royal-hogs.png'),
(51, 'Inferno Tower', 'Rare', 5, '/assets/cards/inferno-tower.png'),
(52, 'Elixir Collector', 'Rare', 6, '/assets/cards/elixir-collector.png'),
(53, 'Rocket', 'Rare', 6, '/assets/cards/rocket.png'),
(54, 'Barbarian Hut', 'Rare', 6, '/assets/cards/barbarian-hut.png'),
(55, 'Three Musketeers', 'Rare', 9, '/assets/cards/three-musketeers.png');

-- ========================================================
-- EPICS
-- ========================================================
INSERT INTO cards (id, name, rarity, elixir_cost, icon_url) VALUES
(56, 'Mirror', 'Epic', 1, '/assets/cards/mirror.png'),
(57, 'Barbarian Barrel', 'Epic', 2, '/assets/cards/barbarian-barrel.png'),
(58, 'Wall Breakers', 'Epic', 2, '/assets/cards/wall-breakers.png'),
(59, 'Rage', 'Epic', 2, '/assets/cards/rage.png'),
(60, 'Goblin Barrel', 'Epic', 3, '/assets/cards/goblin-barrel.png'),
(61, 'Guards', 'Epic', 3, '/assets/cards/guards.png'),
(62, 'Clone', 'Epic', 3, '/assets/cards/clone.png'),
(63, 'Tornado', 'Epic', 3, '/assets/cards/tornado.png'),
(64, 'Skeleton Army', 'Epic', 3, '/assets/cards/skeleton-army.png'),
(65, 'Baby Dragon', 'Epic', 4, '/assets/cards/baby-dragon.png'),
(66, 'Dark Prince', 'Epic', 4, '/assets/cards/dark-prince.png'),
(67, 'Hunter', 'Epic', 4, '/assets/cards/hunter.png'),
(68, 'Prince', 'Epic', 5, '/assets/cards/prince.png'),
(69, 'Electro Dragon', 'Epic', 5, '/assets/cards/electro-dragon.png'),
(70, 'Bowler', 'Epic', 5, '/assets/cards/bowler.png'),
(71, 'Executioner', 'Epic', 5, '/assets/cards/executioner.png'),
(72, 'Cannon Cart', 'Epic', 5, '/assets/cards/cannon-cart.png'),
(73, 'Witch', 'Epic', 5, '/assets/cards/witch.png'),
(74, 'Balloon', 'Epic', 5, '/assets/cards/balloon.png'),
(75, 'Poison', 'Epic', 4, '/assets/cards/poison.png'),
(76, 'Freeze', 'Epic', 4, '/assets/cards/freeze.png'),
(77, 'Goblin Giant', 'Epic', 6, '/assets/cards/goblin-giant.png'),
(78, 'Giant Skeleton', 'Epic', 6, '/assets/cards/giant-skeleton.png'),
(79, 'Lightning', 'Epic', 6, '/assets/cards/lightning.png'),
(80, 'X-Bow', 'Epic', 6, '/assets/cards/x-bow.png'),
(81, 'P.E.K.K.A', 'Epic', 7, '/assets/cards/pekka.png'),
(82, 'Electro Giant', 'Epic', 7, '/assets/cards/electro-giant.png'),
(83, 'Golem', 'Epic', 8, '/assets/cards/golem.png');

-- ========================================================
-- LEGENDARIES
-- ========================================================
INSERT INTO cards (id, name, rarity, elixir_cost, icon_url) VALUES
(84, 'The Log', 'Legendary', 2, '/assets/cards/the-log.png'),
(85, 'Ice Wizard', 'Legendary', 3, '/assets/cards/ice-wizard.png'),
(86, 'Princess', 'Legendary', 3, '/assets/cards/princess.png'),
(87, 'Miner', 'Legendary', 3, '/assets/cards/miner.png'),
(88, 'Bandit', 'Legendary', 3, '/assets/cards/bandit.png'),
(89, 'Royal Ghost', 'Legendary', 3, '/assets/cards/royal-ghost.png'),
(90, 'Fisherman', 'Legendary', 3, '/assets/cards/fisherman.png'),
(91, 'Lumberjack', 'Legendary', 4, '/assets/cards/lumberjack.png'),
(92, 'Inferno Dragon', 'Legendary', 4, '/assets/cards/inferno-dragon.png'),
(93, 'Electro Wizard', 'Legendary', 4, '/assets/cards/electro-wizard.png'),
(94, 'Night Witch', 'Legendary', 4, '/assets/cards/night-witch.png'),
(95, 'Magic Archer', 'Legendary', 4, '/assets/cards/magic-archer.png'),
(96, 'Mother Witch', 'Legendary', 4, '/assets/cards/mother-witch.png'),
(97, 'Phoenix', 'Legendary', 4, '/assets/cards/phoenix.png'),
(98, 'Graveyard', 'Legendary', 5, '/assets/cards/graveyard.png'),
(99, 'Ram Rider', 'Legendary', 5, '/assets/cards/ram-rider.png'),
(100, 'Sparky', 'Legendary', 6, '/assets/cards/sparky.png'),
(101, 'Mega Knight', 'Legendary', 7, '/assets/cards/mega-knight.png'),
(102, 'Lava Hound', 'Legendary', 7, '/assets/cards/lava-hound.png');

-- ========================================================
-- CHAMPIONS
-- ========================================================
INSERT INTO cards (id, name, rarity, elixir_cost, icon_url) VALUES
(103, 'Mighty Miner', 'Champion', 4, '/assets/cards/mighty-miner.png'),
(104, 'Golden Knight', 'Champion', 4, '/assets/cards/golden-knight.png'),
(105, 'Skeleton King', 'Champion', 4, '/assets/cards/skeleton-king.png'),
(106, 'Archer Queen', 'Champion', 5, '/assets/cards/archer-queen.png'),
(107, 'Monk', 'Champion', 5, '/assets/cards/monk.png'),
(108, 'Little Prince', 'Champion', 3, '/assets/cards/little-prince.png'),
(109, 'Goblin Machine', 'Champion', 5, '/assets/cards/goblin-machine.png');
INSERT INTO cards ( name, rarity, elixir_cost, icon_url) VALUES
('Mighty Miner', 'Champion', 4, '/assets/cards/bomber.png'),
( 'Golden Knight', 'Champion', 4, '/assets/cards/goblin-drill.png'),
( 'Golden Knight', 'Champion', 4, '/assets/cards/goblin-hut.png');
INSERT INTO cards ( name, rarity, elixir_cost, icon_url) VALUES
('Suspicious Bush', 'Rare', 2, '/assets/cards/suspicious-bush.png'),
( 'Goblin Curse', 'Epic', 2, '/assets/cards/goblin-curse.png'),
( 'Vines', 'Epic', 3, '/assets/cards/vines.png'),
( 'Minion Giant', 'Rare', 4, '/assets/cards/minion-giant.png'),
( 'Rune Giant', 'Epic', 4, '/assets/cards/rune-giant.png'),
( 'Goblin Demolisher', 'Rare', 4, '/assets/cards/goblin-demolisher.png'),
( 'Void', 'Epic', 5, '/assets/cards/void.png'),
( 'Ronin', 'Legendary', 5, '/assets/cards/ronin.png'),
( 'Goblinstein', 'Champion', 2, '/assets/cards/goblinstein.png'),
( 'Spirit Empress', 'Legendary', 2, '/assets/cards/spirit-empress.png'),
( 'Boss Bandit', 'Legendary', 2, '/assets/cards/boss-bandit.png'),
( 'Golden Knight', 'Champion', 4, '/assets/cards/goblin-hut.png');

select * from cards where elixir_cost = 2;

