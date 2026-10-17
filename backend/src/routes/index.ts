import { Router } from "express";
import gameRoutes from "./game.routes.js";
import playerRoutes from "./player.routes.js";
import tournamentRoutes from "./tournament.routes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Tournament API",
  });
});

router.use("/players", playerRoutes);
router.use("/tournaments", tournamentRoutes);
router.use("/matches", gameRoutes);

export default router;
