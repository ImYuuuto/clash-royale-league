
import app from "./app.js";
import { testDatabaseConnection } from "./config/database.js";
import { migrateKlawatTournamentToSingleGame } from "./services/management.service.js";

const PORT = Number(process.env.PORT) || 4000;

async function startServer(): Promise<void> {
  console.log("Starting server...");

  try {
    await new Promise<void>((resolve, reject) => {
      const server = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Tournament API running at http://127.0.0.1:${PORT}`);
        resolve();
      });
      server.once("error", reject);
    });
  } catch (error) {
    console.error(
      `API could not listen on 127.0.0.1:${PORT}:`,
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
    return;
  }

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
