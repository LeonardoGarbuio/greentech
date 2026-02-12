import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health Check / DB Status
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.get("SELECT 1 as val");
        res.json({
            status: 'ok',
            db_provider: process.env.POSTGRES_URL ? 'PostgreSQL' : 'SQLite',
            db_connected: !!result
        });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// --- AUTHENTICATION ---

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Try finding in Producers
        const producer = await db.get("SELECT * FROM producers WHERE email = ? AND password = ?", [email, password]);

        if (producer) {
            return res.json({
                success: true,
                user: {
                    id: producer.id,
                    name: producer.name,
                    email: producer.email,
                    points: producer.points,
                    role: 'producer',
                    avatar_url: producer.avatar_url
                }
            });
        }

        // 2. Try finding in Collectors
        const collector = await db.get("SELECT * FROM collectors WHERE email = ? AND password = ?", [email, password]);

        if (collector) {
            return res.json({
                success: true,
                user: {
                    id: collector.id,
                    name: collector.name,
                    email: collector.email,
                    earnings: collector.earnings,
                    role: 'collector',
                    avatar_url: collector.avatar_url
                }
            });
        }

        // 3. Not found
        res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- USER DATA ---

app.get('/api/user', async (req, res) => {
    const { id, role } = req.query;

    if (!id || !role) return res.status(400).json({ error: 'Missing id or role' });

    const table = role === 'producer' ? 'producers' : 'collectors';

    try {
        const row = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        if (!row) return res.status(404).json({ error: 'User not found' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ITEMS (MARKETPLACE) ---

app.get('/api/items', async (req, res) => {
    const { collectorId } = req.query;

    let query = `
        SELECT items.*, producers.name as producer_name, producers.avatar_url as producer_avatar 
        FROM items 
        LEFT JOIN producers ON items.producer_id = producers.id 
        WHERE items.status = 'available'
    `;

    const params = [];

    if (collectorId) {
        query += ` OR (items.status = 'reserved' AND items.collector_id = ?)`;
        params.push(collectorId);
    }

    query += ` ORDER BY items.created_at DESC`;

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/items', async (req, res) => {
    const { type, title, description, weight_kg, lat, lng, address, producer_id } = req.body;

    // We must ensure 'producer_id' is passed.
    // And for Postgres, query text must use RETURNING id if we want lastID.
    // Our db-postgres run wrapper tries to handle this by guessing or we can be explicit.
    // For universal compatibility, explicitly asking for RETURNING id works in Postgres but FAILS in SQLite (syntax error).
    // So we rely on db.run returning lastID (which our Postgres wrapper handles by looking at result).
    // BUT our Postgres wrapper 'run' implementation only returns lastID if the query itself returned it?
    // Wait, the PG wrapper I wrote checks `res.rows[0].id`.
    // So the query must be `INSERT ... RETURNING id` for Postgres.
    // But SQLite doesn't support `RETURNING id`.
    // Solution: The db-postgres wrapper should Append `RETURNING id` to INSERT queries automatically?
    // Or I make the query explicit and `db-sqlite` strips it?
    // It's safer to just rely on `db.run` returning `lastID` via `this.lastID` (SQLite) 
    // and manually implementing that in Postgres wrapper.
    // In Postgres wrapper: `const res = await pool.query(text + ' RETURNING id', params)` if it's an insert.

    // Let's modify the query here to be standard INSERT and assume `db.run` handles it.

    try {
        const result = await db.run(`
            INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) 
            VALUES (?, ?, ?, ?, ?, 'available', ?, ?, ?)
        `, [producer_id, type, title, description, weight_kg, lat, lng, address]);

        res.json({ success: true, id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.run("DELETE FROM items WHERE id = ?", [id]);
        res.json({ success: true, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}); // Fixed missing brace here

app.put('/api/items/:id/status', async (req, res) => {
    const { status, collector_id } = req.body;
    const { id } = req.params;

    if (!collector_id) return res.status(400).json({ error: 'Collector ID required' });

    const collectedAt = status === 'collected' ? new Date().toISOString() : null;

    try {
        const result = await db.run("UPDATE items SET status = ?, collector_id = ?, collected_at = ? WHERE id = ?",
            [status, collector_id, collectedAt, id]);

        if (status === 'collected') {
            await updateStatsAfterCollection(id, collector_id);
        }

        res.json({ success: true, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function updateStatsAfterCollection(itemId, collectorId) {
    try {
        const item = await db.get("SELECT * FROM items WHERE id = ?", [itemId]);
        if (item) {
            const points = Math.round(item.weight_kg * 10);
            const earnings = item.weight_kg * 0.50;

            await db.run("UPDATE producers SET points = points + ?, weight_recycled = weight_recycled + ? WHERE id = ?",
                [points, item.weight_kg, item.producer_id]);

            await db.run("UPDATE collectors SET earnings = earnings + ?, collections_count = collections_count + 1 WHERE id = ?",
                [earnings, collectorId]);

            await db.run("INSERT INTO producer_notifications (producer_id, title, message, type) VALUES (?, ?, ?, ?)",
                [item.producer_id, 'Coleta Realizada!', `Você ganhou ${points} pontos.`, 'success']);
        }
    } catch (err) {
        console.error("Error updating stats:", err);
    }
}

// --- HISTORY ---

app.get('/api/history', async (req, res) => {
    const { userId, role } = req.query;
    if (!userId || !role) return res.status(400).json({ error: 'Missing params' });

    let query = '';
    if (role === 'producer') {
        query = "SELECT * FROM items WHERE producer_id = ? ORDER BY created_at DESC";
    } else {
        query = "SELECT * FROM items WHERE collector_id = ? ORDER BY collected_at DESC";
    }

    try {
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- NOTIFICATIONS & ADDRESSES & USER UPDATES ---
// (Refactored similarly to async/await)

app.get('/api/addresses', async (req, res) => {
    const { userId, role } = req.query;
    if (role === 'producer') {
        try {
            const result = await db.query("SELECT * FROM producer_addresses WHERE producer_id = ?", [userId]);
            res.json(result.rows);
        } catch (err) { res.status(500).json({ error: err.message }); }
    } else {
        res.json([]);
    }
});

app.post('/api/addresses', async (req, res) => {
    const { userId, role, title, address, lat, lng } = req.body;
    if (role === 'producer') {
        try {
            const result = await db.run("INSERT INTO producer_addresses (producer_id, title, address, lat, lng) VALUES (?, ?, ?, ?, ?)",
                [userId, title, address, lat || 0, lng || 0]);
            res.json({ success: true, id: result.lastID });
        } catch (err) { res.status(500).json({ error: err.message }); }
    } else {
        res.status(400).json({ error: 'Only producers' });
    }
});

app.delete('/api/addresses/:id', async (req, res) => {
    // ... code for delete
    try {
        const result = await db.run("DELETE FROM producer_addresses WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/user', async (req, res) => {
    // ... code for update
    const { id, role, name, email, phone } = req.body;
    const table = role === 'producer' ? 'producers' : 'collectors';
    try {
        const result = await db.run(`UPDATE ${table} SET name = ?, email = ?, phone = ? WHERE id = ?`,
            [name, email, phone, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Allow Vercel to export app, but listen if run directly
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
