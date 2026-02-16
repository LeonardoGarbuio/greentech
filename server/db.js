import sqliteDb from './db-sqlite.js';
import postgresDb from './db-postgres.js';

const isPostgres = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);

console.log(`Database Provider: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
if (!isPostgres) {
    console.warn("POSTGRES_URL / DATABASE_URL environment variable is missing or empty.");
}

const db = isPostgres ? postgresDb : sqliteDb;

// Initialize Postgres on startup (guarded against duplicate runs in db-postgres.js)
if (isPostgres) {
    postgresDb.initDb().catch(err => console.error("Auto-init failed:", err.message));
}

export default db;
