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

    // Automatically append RETURNING id for INSERTs if not present
    let modifiedText = text;
    if (text.trim().toUpperCase().startsWith("INSERT") && !text.toLowerCase().includes("returning")) {
        modifiedText += " RETURNING id";
    }

    const { text: newText } = convertQuery(modifiedText, params);
    const res = await pool.query(newText, params);

    let lastID = null;
    if (res.rows && res.rows.length > 0) {
        lastID = res.rows[0].id;
    }

    return {
        lastID,
        changes: res.rowCount
    };
};

let isInitializing = false;
let isInitialized = false;

// Initial Schema Creation for Postgres
export const initDb = async (force = false) => {
    if (!pool) return;
    if (isInitialized && !force) {
        console.log("Postgres DB already initialized.");
        return;
    }
    if (isInitializing) {
        console.log("Postgres DB initialization already in progress...");
        return;
    }

    isInitializing = true;
    console.log("Starting Postgres DB initialization...");

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

            await client.query(`CREATE TABLE IF NOT EXISTS producer_notifications (
                id SERIAL PRIMARY KEY,
                producer_id INTEGER REFERENCES producers(id),
                title TEXT,
                message TEXT,
                type TEXT,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS producer_addresses (
                id SERIAL PRIMARY KEY,
                producer_id INTEGER REFERENCES producers(id),
                title TEXT,
                address TEXT,
                lat REAL,
                lng REAL,
                is_default INTEGER DEFAULT 0
            )`);

            // Collectors
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

            await client.query(`CREATE TABLE IF NOT EXISTS collector_notifications (
                id SERIAL PRIMARY KEY,
                collector_id INTEGER REFERENCES collectors(id),
                title TEXT,
                message TEXT,
                type TEXT,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS collector_zones (
                id SERIAL PRIMARY KEY,
                collector_id INTEGER REFERENCES collectors(id),
                title TEXT,
                lat REAL,
                lng REAL,
                radius_km REAL
            )`);

            // Items
            await client.query(`CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                producer_id INTEGER REFERENCES producers(id),
                collector_id INTEGER, 
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

            // Chats & Messages
            await client.query(`CREATE TABLE IF NOT EXISTS chats (
                id SERIAL PRIMARY KEY,
                producer_id INTEGER REFERENCES producers(id),
                collector_id INTEGER REFERENCES collectors(id),
                last_message TEXT,
                last_message_time TIMESTAMP
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                chat_id INTEGER REFERENCES chats(id),
                sender_role TEXT,
                content TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read INTEGER DEFAULT 0
            )`);

            await client.query('COMMIT');

            // Seed Data
            await seedData(client);

            isInitialized = true;
            console.log("Postgres DB initialization completed successfully.");

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Failed to init Postgres DB:", err);
        throw err; // Re-throw to allow handler to report error
    } finally {
        isInitializing = false;
    }
};

const seedData = async (client) => {
    // Check if producers exist
    const res = await client.query("SELECT count(*) as count FROM producers");
    if (res.rows[0].count > 0) return;

    console.log("Seeding Postgres Data...");

    // Insert Producer matching seed
    const producerRes = await client.query(`
        INSERT INTO producers (email, password, name, phone, points, weight_recycled, level) 
        VALUES ('producer@test.com', 'password', 'João Doador', '(11) 99999-9999', 1250, 55.5, 'Reciclador Consciente')
        RETURNING id
    `);
    const producerId = producerRes.rows[0].id;

    await client.query(`
        INSERT INTO producer_notifications (producer_id, title, message, type) 
        VALUES ($1, 'Bem-vindo!', 'Comece a reciclar hoje mesmo.', 'system')
    `, [producerId]);

    await client.query(`
        INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) 
        VALUES ($1, 'paper', 'Papelão Limpo', 'Caixas de mudança desmontadas', 5.0, 'available', -23.5500, -46.6300, 'Rua das Flores, 123')
    `, [producerId]);

    // Insert Collector
    await client.query(`
        INSERT INTO collectors (email, password, name, phone, earnings, collections_count, vehicle_type) 
        VALUES ('collector@test.com', 'password', 'Maria Coletora', '(11) 98888-8888', 350.00, 12, 'carroca')
    `);
};

export default { query, get, run, initDb };
