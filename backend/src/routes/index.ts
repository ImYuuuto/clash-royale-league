import { Router } from "express";
import fixtureRoutes from "./fixture.routes.js";
import gameRoutes from "./game.routes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Tournament API",
  });
});

router.use("/tournaments", fixtureRoutes);
router.use("/matches", gameRoutes);

export default router;