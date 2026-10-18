import { Router } from "express";
import { patchGame, postGame } from "../controllers/game.controller.js";

const router = Router();

router.post("/:matchId/games", postGame);
router.patch("/:matchId/games/:gameId", patchGame);

export default router;
