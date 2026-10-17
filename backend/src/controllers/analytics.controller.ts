import type { NextFunction, Request, Response } from "express";
import {
  AnalyticsError,
  getPlayerTournamentAnalytics,
  getTournamentAnalytics,
} from "../services/analytics.service.js";

export async function getTournamentAnalyticsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({ success: true, data: await getTournamentAnalytics(req.params.id) });
  } catch (error) {
    if (error instanceof AnalyticsError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

export async function getPlayerTournamentAnalyticsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      data: await getPlayerTournamentAnalytics(req.params.id, req.params.playerId),
    });
  } catch (error) {
    if (error instanceof AnalyticsError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}
