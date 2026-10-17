
import app from "./app.js";
import {
  pool,
  testDatabaseConnection,
} from "./config/database.js";

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  try {
    console.log("Starting server...");

    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(
        `Tournament API running at http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Failed to start the application:", error);

    await pool.end();
    process.exitCode = 1;
  }
}

void startServer();
