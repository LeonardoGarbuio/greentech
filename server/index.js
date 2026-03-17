import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'greentech-super-secret-key-2024';

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
        req.user = user;
        next();
    });
};

// Health Check / DB Status
app.get('/api/health', async (req, res) => {
    const { init } = req.query;
    console.log(`Health check requested (init=${init})`);

    try {
        if (init === 'true' && process.env.POSTGRES_URL) {
            console.log("Manual DB initialization triggered...");
            await db.initDb(true);
        }

        const result = await db.get("SELECT 1 as val");
        res.json({
            status: 'ok',
            db_provider: process.env.POSTGRES_URL ? 'PostgreSQL' : 'SQLite',
            db_connected: !!result,
            time: new Date().toISOString()
        });
    } catch (err) {
        console.error("Health check error:", err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// --- AUTHENTICATION ---

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    try {
        // 1. Try finding in Producers
        const producer = await db.get("SELECT * FROM producers WHERE email = ?", [email]);

        if (producer) {
            // Handle both legacy plain-text and new bcrypt hashes for smooth transition
            const isMatch = producer.password.startsWith('$2') 
                ? await bcrypt.compare(password, producer.password)
                : producer.password === password;

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Senha incorreta' });
            }
            
            const token = jwt.sign({ id: producer.id, role: 'producer' }, JWT_SECRET, { expiresIn: '7d' });
            
            return res.json({
                success: true,
                token,
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
        const collector = await db.get("SELECT * FROM collectors WHERE email = ?", [email]);

        if (collector) {
            const isMatch = collector.password.startsWith('$2') 
                ? await bcrypt.compare(password, collector.password)
                : collector.password === password;

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Senha incorreta' });
            }

            const token = jwt.sign({ id: collector.id, role: 'collector' }, JWT_SECRET, { expiresIn: '7d' });

            return res.json({
                success: true,
                token,
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
        res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    console.log(`Register attempt for email: ${email}, role: ${role}`);

    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios.' });
    }

    const table = role === 'producer' ? 'producers' : 'collectors';

    try {
        // Check if email already exists in either table
        const producerExists = await db.get("SELECT id FROM producers WHERE email = ?", [email]);
        const collectorExists = await db.get("SELECT id FROM collectors WHERE email = ?", [email]);

        if (producerExists || collectorExists) {
            return res.status(400).json({ success: false, message: 'Este e-mail já está cadastrado.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        let newUserId;
        if (role === 'producer') {
            const result = await db.run(
                "INSERT INTO producers (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword]
            );
            newUserId = result.lastID;

            // Welcome notification
            await db.run(
                "INSERT INTO producer_notifications (producer_id, title, message, type) VALUES (?, ?, ?, ?)",
                [newUserId, 'Bem-vindo!', 'Sua conta de Doador foi criada com sucesso.', 'system']
            );

        } else {
            const result = await db.run(
                "INSERT INTO collectors (name, email, password, vehicle_type) VALUES (?, ?, ?, ?)",
                [name, email, hashedPassword, 'Outro'] // Default vehicle type
            );
            newUserId = result.lastID;
        }

        // Return the user directly so they can be logged in automatically on the frontend
        const newUser = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [newUserId]);
        
        const token = jwt.sign({ id: newUser.id, role: role }, JWT_SECRET, { expiresIn: '7d' });
        
        return res.json({
            success: true,
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: role,
                avatar_url: newUser.avatar_url,
                points: newUser.points || 0,
                earnings: newUser.earnings || 0
            }
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
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

app.post('/api/items', authenticateToken, async (req, res) => {
    const { type, title, description, weight_kg, lat, lng, address, producer_id } = req.body;

    console.log("POST /api/items - body:", JSON.stringify(req.body));

    if (!producer_id) return res.status(400).json({ error: 'Producer ID is required' });

    try {
        const result = await db.run(`
            INSERT INTO items (producer_id, type, title, description, weight_kg, status, lat, lng, address) 
            VALUES (?, ?, ?, ?, ?, 'available', ?, ?, ?)
        `, [producer_id, type, title, description, weight_kg, lat, lng, address]);

        console.log("Item created successfully, result:", JSON.stringify(result));

        res.json({ success: true, id: result.lastID });
    } catch (err) {
        console.error("Error creating item:", err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.run("DELETE FROM items WHERE id = ?", [id]);
        res.json({ success: true, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}); // Fixed missing brace here

app.put('/api/items/:id/status', authenticateToken, async (req, res) => {
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

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
    const { userId, role } = req.query;
    if (!userId || !role) return res.status(400).json({ error: 'Missing userId or role' });

    try {
        let rows = [];
        if (role === 'producer') {
            const result = await db.query("SELECT * FROM producer_notifications WHERE producer_id = ? ORDER BY created_at DESC", [userId]);
            rows = result.rows;
        } else {
            // Collector notifications (if any table existed, currently none in schema/seed?)
            // For now return empty or implement similar table if needed.
            // Let's assume collectors don't have notifications table yet or use same logic
            rows = [];
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    const { id, role, name, email, phone } = req.body;
    console.log("PUT /api/user - body:", JSON.stringify(req.body));

    if (!id || !role) return res.status(400).json({ error: 'Missing id or role' });

    const table = role === 'producer' ? 'producers' : 'collectors';
    try {
        await db.run(`UPDATE ${table} SET name = ?, email = ?, phone = ? WHERE id = ?`,
            [name, email, phone, id]);

        // Return the updated user data
        const updatedUser = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        console.log("User updated successfully:", JSON.stringify(updatedUser));
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error("Error updating user:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Allow Vercel to export app, but listen if run directly
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
