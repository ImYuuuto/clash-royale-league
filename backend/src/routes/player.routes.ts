import { Router } from "express";
import { getPlayerById, getPlayers, patchPlayer, postPlayer } from "../controllers/management.controller.js";

const router = Router();
router.get("/", getPlayers);
router.post("/", postPlayer);
router.get("/:id", getPlayerById);
router.patch("/:id", patchPlayer);
export default router;
