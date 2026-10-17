
import type { Request, Response, NextFunction } from "express";
import { getTournamentFixtures } from "../services/fixture.service.js";

export async function getFixtures(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tournamentId = Number(req.params.id);

    if (
      !Number.isSafeInteger(tournamentId) ||
      tournamentId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid tournament ID",
      });
      return;
    }

    const fixtures = await getTournamentFixtures(tournamentId);

    if (fixtures === null) {
      res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: fixtures,
    });
  } catch (error) {
    next(error);
  }
}
