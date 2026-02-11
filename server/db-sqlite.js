import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database_v3.sqlite');

let dbInstance = null;

function getDb() {
    if (!dbInstance) {
        dbInstance = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to the SQLite database (v3).');
                initDb(dbInstance);
            }
        });
    }
    return dbInstance;
}

function initDb(db) {
    db.serialize(() => {
        // --- PRODUCER TABLES ---
        db.run(`CREATE TABLE IF NOT EXISTS producers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            phone TEXT,
            points INTEGER DEFAULT 0,
            weight_recycled REAL DEFAULT 0,
            level TEXT DEFAULT 'Iniciante',
            avatar_url TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS producer_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producer_id INTEGER,
            title TEXT,
            message TEXT,
            type TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(producer_id) REFERENCES producers(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS producer_addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producer_id INTEGER,
            title TEXT,
            address TEXT,
            lat REAL,
            lng REAL,
            is_default INTEGER DEFAULT 0,
            FOREIGN KEY(producer_id) REFERENCES producers(id)
        )`);

        // --- COLLECTOR TABLES ---
        db.run(`CREATE TABLE IF NOT EXISTS collectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

        db.run(`CREATE TABLE IF NOT EXISTS collector_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collector_id INTEGER,
            title TEXT,
            message TEXT,
            type TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(collector_id) REFERENCES collectors(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS collector_zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collector_id INTEGER,
            title TEXT,
            lat REAL,
            lng REAL,
            radius_km REAL,
            FOREIGN KEY(collector_id) REFERENCES collectors(id)
        )`);

        // --- SHARED MARKETPLACE ---
        db.run(`CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producer_id INTEGER,
            collector_id INTEGER,
            type TEXT,
            title TEXT,
            description TEXT,
            weight_kg REAL,
            status TEXT DEFAULT 'available',
            lat REAL,
            lng REAL,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            collected_at DATETIME,
            FOREIGN KEY(producer_id) REFERENCES producers(id),
            FOREIGN KEY(collector_id) REFERENCES collectors(id)
        )`);

        // --- CHAT SYSTEM ---
        db.run(`CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producer_id INTEGER,
            collector_id INTEGER,
            last_message TEXT,
            last_message_time DATETIME,
            FOREIGN KEY(producer_id) REFERENCES producers(id),
            FOREIGN KEY(collector_id) REFERENCES collectors(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            sender_role TEXT,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            FOREIGN KEY(chat_id) REFERENCES chats(id)
        )`);

        // Seed if empty
        seedData(db);
    });
}

function seedData(db) {
    db.get("SELECT count(*) as count FROM producers", [], (err, row) => {
        if (!err && row && row.count === 0) {
            console.log("Seeding V3 Data...");
            // ... (Seeding code condensed for brevity/can rely on previous run)
            db.run(`INSERT INTO producers (email, password, name, phone, points, weight_recycled, level) 
                   VALUES ('producer@test.com', 'password', 'João Doador', '(11) 99999-9999', 1250, 55.5, 'Reciclador Consciente')`, function (err) {
                if (!err) {
                    const producerId = this.lastID;
                    db.run(`INSERT INTO producer_notifications (producer_id, title, message, type) VALUES 
                        (?, 'Bem-vindo!', 'Comece a reciclar hoje mesmo.', 'system')`, [producerId]);

                    db.run(`INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) VALUES 
                        (?, 'paper', 'Papelão Limpo', 'Caixas de mudança desmontadas', 5.0, 'available', -23.5500, -46.6300, 'Rua das Flores, 123')`, [producerId]);
                }
            });

            db.run(`INSERT INTO collectors (email, password, name, phone, earnings, collections_count, vehicle_type) 
                   VALUES ('collector@test.com', 'password', 'Maria Coletora', '(11) 98888-8888', 350.00, 12, 'carroca')`);
        }
    });
}

// Wrapper to match Postgres-like API
// Note: We need to handle `?` vs `$1`. The code calling this should use `$1` if we want unified, 
// but sticking to `?` is SQLite standard. If I standardize, I should check params.
// Actually, I'll keep the `?` in the wrapper and convert from `$1` if needed, 
// OR I will just ensure my new `index.js` uses `?` and the Postgres wrapper converts `?` to `$n`.
// Converting `?` to `$n` is easier. So the app code will write standard SQL (using `?` placeholders).

export const query = (text, params = []) => {
    const db = getDb();
    return new Promise((resolve, reject) => {
        // Check if it's a SELECT (returns rows) or INSERT/UPDATE/DELETE (returns result info)
        if (text.trim().toUpperCase().startsWith('SELECT')) {
            db.all(text, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows, rowCount: rows.length });
            });
        } else {
            // For modifying queries
            db.run(text, params, function (err) {
                if (err) reject(err);
                else resolve({
                    rows: [],
                    rowCount: this.changes,
                    lastID: this.lastID
                });
            });
        }
    });
};

export const get = (text, params = []) => {
    const db = getDb();
    return new Promise((resolve, reject) => {
        db.get(text, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

export const run = (text, params = []) => {
    const db = getDb();
    return new Promise((resolve, reject) => {
        db.run(text, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

export default { query, get, run };
