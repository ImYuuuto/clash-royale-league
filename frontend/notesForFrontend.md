The backend endpoints are ready for frontend integration. Please connect the UI to:

- `GET /api/players`, `POST /api/players`, `GET /api/players/:id`, `PATCH /api/players/:id`
- `GET /api/tournaments`, `POST /api/tournaments`, `GET /api/tournaments/:id`, `PATCH /api/tournaments/:id`
- `POST /api/tournaments/:id/players` with `{ "playerIds": [1, 2] }`
- `DELETE /api/tournaments/:id/players/:playerId` while the tournament is in draft
- `POST /api/tournaments/:id/fixtures/generate`
- `GET /api/tournaments/:id/fixtures`
- `POST /api/matches/:matchId/games`
- `POST /api/tournaments/:id/tiebreaker` with `{ "playerIds": [1, 2] }`
- `GET /api/tournaments/:id/analytics`
- `GET /api/tournaments/:id/analytics/players/:playerId`

Tournament setup flow: create tournament, enroll at least two players, generate fixtures, then set status to `active`. When all regular fixtures are complete, either set status to `completed` if there’s one points leader, or create the Bo5 tiebreaker if exactly two players are tied for first. Completing that tiebreaker records the champion.

Responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "message": "..." }`. Please handle loading, empty, validation, and conflict responses in the UI. Analytics and fixture availability depend on seeded cards and applied migrations.