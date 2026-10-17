import type { NextFunction, Request, Response } from "express";
import {
  addTournamentPlayers,
  createPlayer,
  createTournament,
  createTiebreakerFixture,
  deletePlayer,
  generateRoundRobinFixtures,
  getPlayer,
  getTournament,
  listPlayers,
  listTournaments,
  ManagementError,
  removeTournamentPlayer,
  updatePlayer,
  updateTournament,
} from "../services/management.service.js";

type Handler = (req: Request, res: Response) => Promise<unknown>;

function respond(handler: Handler, successStatus = 200) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await handler(req, res);
      if (res.headersSent) return;
      res.status(successStatus).json({ success: true, data });
    } catch (error) {
      if (error instanceof ManagementError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  };
}

export const getPlayers = respond(() => listPlayers());
export const getPlayerById = respond(async (req, res) => {
  const player = await getPlayer(req.params.id);
  if (!player) {
    res.status(404).json({ success: false, message: "Player not found" });
    return;
  }
  return player;
});
export const postPlayer = respond((req) => createPlayer(req.body), 201);
export const patchPlayer = respond((req) => updatePlayer(req.params.id, req.body));
export const deletePlayerController = respond((req) => deletePlayer(req.params.id));
export const getTournaments = respond(() => listTournaments());
export const postTournament = respond((req) => createTournament(req.body), 201);
export const getTournamentById = respond(async (req, res) => {
  const tournament = await getTournament(req.params.id);
  if (!tournament) {
    res.status(404).json({ success: false, message: "Tournament not found" });
    return;
  }
  return tournament;
});
export const patchTournament = respond((req) => updateTournament(req.params.id, req.body));
export const postTiebreaker = respond((req) => createTiebreakerFixture(req.params.id, req.body?.playerIds), 201);
export const postTournamentPlayers = respond((req) => addTournamentPlayers(req.params.id, req.body?.playerIds), 201);
export const deleteTournamentPlayer = respond((req) => removeTournamentPlayer(req.params.id, req.params.playerId));
export const postGenerateFixtures = respond((req) => generateRoundRobinFixtures(req.params.id), 201);
