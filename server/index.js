import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// --- AUTHENTICATION ---

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // 1. Try finding in Producers
    db.get("SELECT * FROM producers WHERE email = ? AND password = ?", [email, password], (err, producer) => {
        if (err) return res.status(500).json({ error: err.message });

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
        db.get("SELECT * FROM collectors WHERE email = ? AND password = ?", [email, password], (err, collector) => {
            if (err) return res.status(500).json({ error: err.message });

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
        });
    });
});

// --- USER DATA ---

app.get('/api/user', (req, res) => {
    const { id, role } = req.query; // Require role to know which table to query

    if (!id || !role) return res.status(400).json({ error: 'Missing id or role' });

    const table = role === 'producer' ? 'producers' : 'collectors';

    db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'User not found' });
        res.json(row);
    });
});

// --- ITEMS (MARKETPLACE) ---

// Get Available Items (Feed)
// Get Available Items (Feed) + Reserved by current collector
app.get('/api/items', (req, res) => {
    const { collectorId } = req.query;

    // Join with producers to get name/avatar if needed
    let query = `
        SELECT items.*, producers.name as producer_name, producers.avatar_url as producer_avatar, producers.level as producer_level
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

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Post New Item (Producer only)
app.post('/api/items', (req, res) => {
    const { type, title, description, weight_kg, lat, lng, address, producer_id } = req.body;

    const stmt = db.prepare(`
        INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) 
        VALUES (?, ?, ?, ?, ?, 'available', ?, ?, ?)
    `);

    stmt.run([producer_id, type, title, description, weight_kg, lat, lng, address], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// Delete Item (Producer only)
app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM items WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

// Accept/Collect Item (Collector action)
app.put('/api/items/:id/status', (req, res) => {
    const { status, collector_id } = req.body; // 'reserved' or 'collected'
    const { id } = req.params;

    if (!collector_id) return res.status(400).json({ error: 'Collector ID required' });

    const collectedAt = status === 'collected' ? new Date().toISOString() : null;

    db.run("UPDATE items SET status = ?, collector_id = ?, collected_at = ? WHERE id = ?",
        [status, collector_id, collectedAt, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // If collected, update stats for both parties
            if (status === 'collected') {
                updateStatsAfterCollection(id, collector_id);
            }

            res.json({ success: true, changes: this.changes });
        }
    );
});

function updateStatsAfterCollection(itemId, collectorId) {
    db.get("SELECT * FROM items WHERE id = ?", [itemId], (err, item) => {
        if (item) {
            const points = Math.round(item.weight_kg * 10);
            const earnings = item.weight_kg * 0.50; // Mock: R$0.50 per kg

            // Update Producer
            db.run("UPDATE producers SET points = points + ?, weight_recycled = weight_recycled + ? WHERE id = ?",
                [points, item.weight_kg, item.producer_id]);

            // Update Collector
            db.run("UPDATE collectors SET earnings = earnings + ?, collections_count = collections_count + 1 WHERE id = ?",
                [earnings, collectorId]);

            // Send Notifications
            db.run("INSERT INTO producer_notifications (producer_id, title, message, type) VALUES (?, ?, ?, ?)",
                [item.producer_id, 'Coleta Realizada!', `Você ganhou ${points} pontos.`, 'success']);
        }
    });
}

// --- HISTORY ---

app.get('/api/history', (req, res) => {
    const { userId, role } = req.query;

    if (!userId || !role) return res.status(400).json({ error: 'Missing params' });

    let query = '';
    if (role === 'producer') {
        query = "SELECT * FROM items WHERE producer_id = ? ORDER BY created_at DESC";
    } else {
        query = "SELECT * FROM items WHERE collector_id = ? ORDER BY collected_at DESC";
    }

    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- NOTIFICATIONS ---

app.get('/api/notifications', (req, res) => {
    const { userId, role } = req.query;
    const table = role === 'producer' ? 'producer_notifications' : 'collector_notifications';
    const idColumn = role === 'producer' ? 'producer_id' : 'collector_id';

    db.all(`SELECT * FROM ${table} WHERE ${idColumn} = ? ORDER BY created_at DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- ADDRESSES ---

app.get('/api/addresses', (req, res) => {
    const { userId, role } = req.query;

    if (!userId || !role) return res.status(400).json({ error: 'Missing params' });

    if (role === 'producer') {
        db.all("SELECT * FROM producer_addresses WHERE producer_id = ?", [userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        res.json([]);
    }
});

app.post('/api/addresses', (req, res) => {
    const { userId, role, title, address, lat, lng } = req.body;

    if (role === 'producer') {
        db.run("INSERT INTO producer_addresses (producer_id, title, address, lat, lng) VALUES (?, ?, ?, ?, ?)",
            [userId, title, address, lat || 0, lng || 0],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID });
            }
        );
    } else {
        res.status(400).json({ error: 'Only producers can have addresses currently' });
    }
});

app.delete('/api/addresses/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM producer_addresses WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- USER UPDATES ---

app.put('/api/user', (req, res) => {
    const { id, role, name, email, phone } = req.body;

    if (!id || !role) return res.status(400).json({ error: 'Missing id or role' });

    const table = role === 'producer' ? 'producers' : 'collectors';

    db.run(`UPDATE ${table} SET name = ?, email = ?, phone = ? WHERE id = ?`,
        [name, email, phone, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
