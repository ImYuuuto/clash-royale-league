import express from "express";
import routes from "./routes/index.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Clash Royale Tournament API is running",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const { pool } = await getDatabase();
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error instanceof Error ? error.message : error);

    res.status(503).json({
      success: false,
      database: "unavailable",
    });
  }
});

let databasePromise: Promise<typeof import("./config/database.js")> | undefined;
function getDatabase(): Promise<typeof import("./config/database.js")> {
  databasePromise ??= import("./config/database.js");
  return databasePromise;
}

app.use("/api", routes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API request failed:", error instanceof Error ? error.message : error);
  res.status(500).json({ success: false, message: "An unexpected server error occurred" });
});

export default app;
