
import "dotenv/config";
import mysql from "mysql2/promise";

function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

const DB_HOST = getRequiredEnv("DB_HOST");
const DB_USER = getRequiredEnv("DB_USER");
const DB_NAME = getRequiredEnv("DB_NAME");
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
const DB_PORT = Number(process.env.DB_PORT ?? 3306);

if (!Number.isInteger(DB_PORT) || DB_PORT < 1 || DB_PORT > 65535) {
  throw new Error("DB_PORT must be a valid port number");
}

export const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.query("SELECT 1");
    console.log("MySQL database connected successfully");
  } finally {
    connection.release();
  }
}
