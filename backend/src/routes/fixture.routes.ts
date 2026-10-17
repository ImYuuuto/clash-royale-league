
import { Router } from "express";
import { getFixtures } from "../controllers/fixture.controller.js";

const router = Router();

router.get("/:id/fixtures", getFixtures);

export default router;
