
import app from "./app.js";
import { testDatabaseConnection } from "./config/database.js";
import { migrateKlawatTournamentToSingleGame } from "./services/management.service.js";

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  console.log("Starting server...");

  app.listen(PORT, () => {
    console.log(`Tournament API running at http://localhost:${PORT}`);
  });

  try {
    await testDatabaseConnection();
    await migrateKlawatTournamentToSingleGame();
  } catch (error) {
    console.error(
      "API is running, but MySQL is unavailable. Check the database settings and start MySQL:",
      error instanceof Error ? error.message : error,
    );
  }
}

void startServer();
