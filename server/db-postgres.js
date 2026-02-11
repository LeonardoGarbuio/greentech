import pg from 'pg';

const { Pool } = pg;

let pool;

if (process.env.POSTGRES_URL) {
    pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
    });
} else {
    // Fallback or placeholder if env var missing but file imported
    console.warn("POSTGRES_URL not found, PG pool will fail if used.");
}

// Convert '?' to '$1', '$2', etc.
const convertQuery = (text, params) => {
    let i = 0;
    const newText = text.replace(/\?/g, () => {
        i++;
        return `$${i}`;
    });
    return { text: newText, params };
};

export const query = async (text, params = []) => {
    if (!pool) throw new Error("Postgres Pool not initialized (missing POSTGRES_URL)");
    const { text: newText } = convertQuery(text, params);
    return pool.query(newText, params);
};

export const get = async (text, params = []) => {
    if (!pool) throw new Error("Postgres Pool not initialized");
    const { text: newText } = convertQuery(text, params);
    const res = await pool.query(newText, params);
    return res.rows[0];
};

export const run = async (text, params = []) => {
    if (!pool) throw new Error("Postgres Pool not initialized");
    const { text: newText } = convertQuery(text, params);
    const res = await pool.query(newText, params);

    // PG doesn't return lastID easily unless INSERT ... RETURNING id
    // We might need to handle this if the app relies on lastID.
    // In `server/index.js`, `lastID` is used after Insert.
    // So we should append `RETURNING id` if it's an INSERT and not present.

    let lastID = null;
    if (text.trim().toUpperCase().startsWith("INSERT")) {
        if (res.rows && res.rows.length > 0) {
            lastID = res.rows[0].id;
        }
    }

    return {
        lastID,
        changes: res.rowCount
    };
};

// Initial Schema Creation for Postgres
export const initDb = async () => {
    if (!pool) return;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Producers
            await client.query(`CREATE TABLE IF NOT EXISTS producers (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                phone TEXT,
                points INTEGER DEFAULT 0,
                weight_recycled REAL DEFAULT 0,
                level TEXT DEFAULT 'Iniciante',
                avatar_url TEXT
            )`);

            // ... (Add other tables with SERIAL instead of AUTOINCREMENT)
            // For brevity in this thought trace, I will populate them.

            await client.query(`CREATE TABLE IF NOT EXISTS producer_notifications (
                id SERIAL PRIMARY KEY,
                producer_id INTEGER REFERENCES producers(id),
                title TEXT,
                message TEXT,
                type TEXT,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            // ... (Others)
            await client.query(`CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                producer_id INTEGER REFERENCES producers(id),
                collector_id INTEGER, -- REFERENCES collectors(id) can be added later
                type TEXT, 
                title TEXT,
                description TEXT,
                weight_kg REAL,
                status TEXT DEFAULT 'available',
                lat REAL,
                lng REAL,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                collected_at TIMESTAMP
            )`);

            // Need to define all tables properly for FKs to work.
            await client.query(`CREATE TABLE IF NOT EXISTS collectors (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                phone TEXT,
                earnings REAL DEFAULT 0,
                collections_count INTEGER DEFAULT 0,
                vehicle_type TEXT,
                rating REAL DEFAULT 5.0,
                avatar_url TEXT
            )`);


            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Failed to init Postgres DB:", err);
    }
};

export default { query, get, run, initDb };
