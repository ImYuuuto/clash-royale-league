import type { Request, Response, NextFunction } from "express";
import {
  GameRegistrationError,
  registerGame,
} from "../services/game.service.js";

export async function postGame(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const matchId = Number(req.params.matchId);
    const result = await registerGame(matchId, req.body);

    res.status(201).json({
      success: true,
      message: result.fixtureCompleted
        ? "Game registered. Fixture completed."
        : "Game registered successfully.",
      data: result,
    });
  } catch (error) {
    if (error instanceof GameRegistrationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    next(error);
  }
}