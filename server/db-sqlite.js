import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database_v3.sqlite');

let dbInstance = null;

// Helper to generate SHA-256 hashes
export function generateSHA256(data) {
    return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
}

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
            avatar_url TEXT,
            onboarding_completed INTEGER DEFAULT 0
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
            avatar_url TEXT,
            onboarding_completed INTEGER DEFAULT 0
        )`);

        // --- COOPERATIVE TABLES ---
        db.run(`CREATE TABLE IF NOT EXISTS cooperatives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        db.run(`ALTER TABLE producers ADD COLUMN onboarding_completed INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE collectors ADD COLUMN onboarding_completed INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE cooperatives ADD COLUMN onboarding_completed INTEGER DEFAULT 0`, () => {});

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
            cooperative_id INTEGER,
            homologated_weight_kg REAL,
            homologated_type TEXT,
            final_destination TEXT,
            receipt_number TEXT,
            homologated_at DATETIME,
            FOREIGN KEY(producer_id) REFERENCES producers(id),
            FOREIGN KEY(collector_id) REFERENCES collectors(id),
            FOREIGN KEY(cooperative_id) REFERENCES cooperatives(id)
        )`);

        db.run(`ALTER TABLE items ADD COLUMN cooperative_id INTEGER`, () => {});
        db.run(`ALTER TABLE items ADD COLUMN homologated_weight_kg REAL`, () => {});
        db.run(`ALTER TABLE items ADD COLUMN homologated_type TEXT`, () => {});
        db.run(`ALTER TABLE items ADD COLUMN final_destination TEXT`, () => {});
        db.run(`ALTER TABLE items ADD COLUMN receipt_number TEXT`, () => {});
        db.run(`ALTER TABLE items ADD COLUMN homologated_at DATETIME`, () => {});

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
            image TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            FOREIGN KEY(chat_id) REFERENCES chats(id)
        )`);

        // Migration: add image column if it doesn't exist
        db.run(`ALTER TABLE messages ADD COLUMN image TEXT`, (err) => {
            // Ignore error if column already exists
        });

        // --- B2B & BLOCK-LOG DE RASTREABILIDADE CRIPTOGRÁFICA ---
        db.run(`CREATE TABLE IF NOT EXISTS traceability_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER,
            step TEXT, -- 'DISCARD', 'COLLECTION', 'COOP_RECEIPT', 'INDUSTRY_RECYCLE'
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            actor_id INTEGER,
            actor_role TEXT,
            payload TEXT,
            previous_hash TEXT,
            current_hash TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS b2b_credits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            weight_kg REAL,
            amount_paid REAL,
            certificate_uuid TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Seed if empty
        seedData(db);
    });
}

function seedData(db) {
    db.run(`INSERT OR IGNORE INTO cooperatives
        (email, password, name, phone, cnpj, address, onboarding_completed)
        VALUES ('cooperative@test.com', 'password', 'Cooperativa GreenTech PG', '(42) 3222-1206',
        '08.018.008/0001-97', 'Ponta Grossa - PR', 1)`);

    db.get("SELECT count(*) as count FROM producers", [], (err, row) => {
        if (!err && row && row.count === 0) {
            console.log("Seeding V3 Data...");
            // Seed producer Joaõ Doador and SP-based items
            db.run(`INSERT INTO producers (email, password, name, phone, points, weight_recycled, level) 
                   VALUES ('producer@test.com', 'password', 'João Doador', '(11) 99999-9999', 1250, 55.5, 'Reciclador Consciente')`, function (err) {
                if (!err) {
                    const producerId = this.lastID;
                    db.run(`INSERT INTO producer_notifications (producer_id, title, message, type) VALUES 
                        (?, 'Bem-vindo!', 'Comece a reciclar hoje mesmo.', 'system')`, [producerId]);

                    // Original item
                    db.run(`INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) VALUES 
                        (?, 'paper', 'Papelão Limpo', 'Caixas de mudança desmontadas', 5.0, 'available', -23.5500, -46.6300, 'Rua das Flores, 123')`, [producerId]);

                    // SP Item 1: Paper
                    db.run(`INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) VALUES 
                        (?, 'paper', 'Fardos de Papelão', 'Caixas de papelão ondulado de entregas comerciais', 12.5, 'available', -23.5489, -46.6388, 'Av. Ipiranga, 1040 - República')`, [producerId]);

                    // SP Item 2: Plastic
                    db.run(`INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) VALUES 
                        (?, 'plastic', 'Garrafas PET e Embalagens', 'Garrafas de refrigerante e água mineral limpas e prensadas', 8.2, 'available', -23.5525, -46.6295, 'Rua Galvão Bueno, 350 - Liberdade')`, [producerId]);

                    // SP Item 3: Metal
                    db.run(`INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) VALUES 
                        (?, 'metal', 'Latinhas de Alumínio', 'Sacos cheios de latinhas de cerveja e refrigerante amassadas', 4.5, 'available', -23.5445, -46.6358, 'Rua Direita, 150 - Sé')`, [producerId]);

                    // SP Item 4: Glass
                    db.run(`INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) VALUES 
                        (?, 'glass', 'Garrafas de Vidro (Verde/Ambar)', 'Garrafas vazias de cerveja e vinho separadas em caixa', 15.0, 'available', -23.5562, -46.6435, 'Rua Treze de Maio, 450 - Bela Vista')`, [producerId]);

                    // SP Item 5: Electronic
                    db.run(`INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) VALUES 
                        (?, 'electronic', 'Sucata Eletrônica', 'Fontes de computador antigas, cabos e placas de circuito', 6.0, 'available', -23.5412, -46.6415, 'Rua Santa Ifigênia, 280 - Centro')`, [producerId]);
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
