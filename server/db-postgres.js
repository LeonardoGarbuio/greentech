import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let pool;

if (connectionString) {
    pool = new Pool({
        connectionString: connectionString,
    });
} else {
    // Fallback or placeholder if env var missing but file imported
    console.warn("POSTGRES_URL/DATABASE_URL not found, PG pool will fail if used.");
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
                avatar_url TEXT,
                onboarding_completed INTEGER DEFAULT 0
            )`);

            // Migração: adicionar coluna se tabela já existir
            await client.query(`ALTER TABLE producers ADD COLUMN IF NOT EXISTS onboarding_completed INTEGER DEFAULT 0`).catch(() => {});

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
                avatar_url TEXT,
                onboarding_completed INTEGER DEFAULT 0
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS cooperatives (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                phone TEXT,
                cnpj TEXT,
                address TEXT,
                total_received_kg REAL DEFAULT 0,
                homologations_count INTEGER DEFAULT 0,
                avatar_url TEXT,
                onboarding_completed INTEGER DEFAULT 0
            )`);

            // Migração: adicionar coluna se tabela já existir
            await client.query(`ALTER TABLE collectors ADD COLUMN IF NOT EXISTS onboarding_completed INTEGER DEFAULT 0`).catch(() => {});

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
                collected_at TIMESTAMP,
                cooperative_id INTEGER REFERENCES cooperatives(id),
                homologated_weight_kg REAL,
                homologated_type TEXT,
                final_destination TEXT,
                receipt_number TEXT,
                homologated_at TIMESTAMP
            )`);
            await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS cooperative_id INTEGER REFERENCES cooperatives(id)`).catch(() => {});
            await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS homologated_weight_kg REAL`).catch(() => {});
            await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS homologated_type TEXT`).catch(() => {});
            await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS final_destination TEXT`).catch(() => {});
            await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS receipt_number TEXT`).catch(() => {});
            await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS homologated_at TIMESTAMP`).catch(() => {});

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
                image TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read INTEGER DEFAULT 0
            )`);

            // Migration: add image column if it doesn't exist
            await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS image TEXT`).catch(() => {});

            // Cadeia de custódia do resíduo, usada pelo Passaporte Circular.
            await client.query(`CREATE TABLE IF NOT EXISTS traceability_ledger (
                id SERIAL PRIMARY KEY,
                item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
                step TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                actor_id INTEGER,
                actor_role TEXT,
                payload TEXT,
                previous_hash TEXT NOT NULL,
                current_hash TEXT NOT NULL
            )`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_traceability_item ON traceability_ledger(item_id, id)`);

            await client.query(`CREATE TABLE IF NOT EXISTS b2b_credits (
                id SERIAL PRIMARY KEY,
                company_name TEXT NOT NULL,
                weight_kg REAL NOT NULL,
                amount_paid REAL NOT NULL,
                certificate_uuid TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            await client.query(`INSERT INTO cooperatives
                (email, password, name, phone, cnpj, address, onboarding_completed)
                VALUES ('cooperative@test.com', 'password', 'Cooperativa GreenTech PG', '(42) 3222-1206',
                '08.018.008/0001-97', 'Ponta Grossa - PR', 1)
                ON CONFLICT (email) DO NOTHING`);

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
