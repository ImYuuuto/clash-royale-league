import { Router } from "express";
import {
  getTournamentById,
  getTournaments,
  deleteTournamentController,
  deleteTournamentPlayer,
  patchTournament,
  postGenerateFixtures,
  postTournament,
  postTournamentPlayers,
  postTiebreaker,
} from "../controllers/management.controller.js";
import { getFixtures } from "../controllers/fixture.controller.js";
import {
  getPlayerTournamentAnalyticsController,
  getTournamentAnalyticsController,
} from "../controllers/analytics.controller.js";

const router = Router();
router.get("/", getTournaments);
router.post("/", postTournament);
router.get("/:id", getTournamentById);
router.delete("/:id", deleteTournamentController);
router.patch("/:id", patchTournament);
router.post("/:id/tiebreaker", postTiebreaker);
router.post("/:id/players", postTournamentPlayers);
router.delete("/:id/players/:playerId", deleteTournamentPlayer);
router.post("/:id/fixtures/generate", postGenerateFixtures);
router.get("/:id/fixtures", getFixtures);
router.get("/:id/analytics", getTournamentAnalyticsController);
router.get("/:id/analytics/players/:playerId", getPlayerTournamentAnalyticsController);
export default router;
