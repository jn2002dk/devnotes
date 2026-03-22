import mysql, { type Pool } from "mysql2/promise";

declare global {
  var __devnotesPool__: Pool | undefined;
  var __devnotesSchemaReady__: Promise<void> | undefined;
}

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to connect to MariaDB.`);
  }

  return value;
};

const getPool = () => {
  if (!globalThis.__devnotesPool__) {
    globalThis.__devnotesPool__ = mysql.createPool({
      host: getRequiredEnv("DB_HOST"),
      port: Number(process.env.DB_PORT || "3306"),
      database: getRequiredEnv("DB_NAME"),
      user: getRequiredEnv("DB_USER"),
      password: getRequiredEnv("DB_PASSWORD"),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4"
    });
  }

  return globalThis.__devnotesPool__;
};

export const ensureWorkspaceSchema = async () => {
  if (!globalThis.__devnotesSchemaReady__) {
    globalThis.__devnotesSchemaReady__ = getPool().query(`
      CREATE TABLE IF NOT EXISTS workspace_snapshots (
        owner_key VARCHAR(191) NOT NULL PRIMARY KEY,
        version INT NOT NULL,
        payload LONGTEXT NOT NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `).then(() => undefined);
  }

  await globalThis.__devnotesSchemaReady__;
};

export const getDatabasePool = async () => {
  await ensureWorkspaceSchema();
  return getPool();
};

export const pingDatabase = async () => {
  const pool = await getDatabasePool();

  await pool.query("SELECT 1");
};