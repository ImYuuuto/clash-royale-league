import { Router } from "express";
import { postGame } from "../controllers/game.controller.js";

const router = Router();

router.post("/:matchId/games", postGame);

export default router;