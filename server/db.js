import sqliteDb from './db-sqlite.js';
import postgresDb from './db-postgres.js';

const isPostgres = !!process.env.POSTGRES_URL;

console.log(`Database Provider: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
if (!isPostgres) {
    console.warn("POSTGRES_URL environment variable is missing or empty.");
}

const db = isPostgres ? postgresDb : sqliteDb;

// Initialize Postgres if needed (SQLite inits on load)
// Removed automatic init on startup to avoid Vercel timeouts. 
// Can be triggered manually via /api/health?init=true if needed.
// if (isPostgres) {
//     postgresDb.initDb().catch(console.error);
// }

export default db;
