import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import traceabilityService from './services/traceabilityService.js';
import aiService from './services/aiService.js';

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
                    avatar_url: producer.avatar_url,
                    onboarding_completed: !!producer.onboarding_completed
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
                    avatar_url: collector.avatar_url,
                    onboarding_completed: !!collector.onboarding_completed
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
                earnings: newUser.earnings || 0,
                onboarding_completed: false
            }
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
});
// --- GOOGLE AUTH ---
app.post('/api/auth/google', async (req, res) => {
    const { name, email, photoUrl, role, isCreate } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email obrigatório' });

    try {
        // Tentar buscar em producers
        let user = await db.get('SELECT * FROM producers WHERE email = ?', [email]);
        if (user) {
            const token = jwt.sign({ id: user.id, role: 'producer' }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: 'producer',
                    avatar_url: user.avatar_url || photoUrl,
                    points: user.points,
                    onboarding_completed: !!user.onboarding_completed
                },
                isNewUser: false
            });
        }

        // Tentar buscar em collectors
        user = await db.get('SELECT * FROM collectors WHERE email = ?', [email]);
        if (user) {
            const token2 = jwt.sign({ id: user.id, role: 'collector' }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({
                success: true,
                token: token2,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: 'collector',
                    avatar_url: user.avatar_url || photoUrl,
                    earnings: user.earnings,
                    onboarding_completed: !!user.onboarding_completed
                },
                isNewUser: false
            });
        }

        // Não existe → se não for explicitamente uma criação com papel escolhido, pedir papel
        if (!isCreate) {
            return res.json({ success: true, requiresRole: true });
        }

        const userRole = role || 'producer';
        const table = userRole === 'collector' ? 'collectors' : 'producers';
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const result = await db.run(
            `INSERT INTO ${table} (name, email, password, avatar_url) VALUES (?, ?, ?, ?)`,
            [name || email.split('@')[0], email, hashedPassword, photoUrl || '']
        );

        const newUser = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [
            result.lastID || result.id
        ]);

        const newToken = jwt.sign({ id: newUser.id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token: newToken,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: userRole,
                avatar_url: newUser.avatar_url,
                points: newUser.points || 0,
                earnings: newUser.earnings || 0,
                onboarding_completed: false
            },
            isNewUser: true
        });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
});

// --- ROTA DE VALIDAÇÃO DE SESSÃO (/me) ---
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user;
        const table = role === 'collector' ? 'collectors' : 'producers';
        
        const user = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: role,
                avatar_url: user.avatar_url,
                points: user.points || 0,
                earnings: user.earnings || 0,
                onboarding_completed: !!user.onboarding_completed
            }
        });
    } catch (err) {
        console.error('Auth verify error:', err);
        res.status(500).json({ success: false, message: 'Erro interno' });
    }
});

// --- ONBOARDING ---
app.put('/api/user/onboarding', async (req, res) => {
    const { id, role } = req.body;
    if (!id || !role) return res.status(400).json({ error: 'Faltando id ou role' });

    const table = role === 'producer' ? 'producers' : 'collectors';
    try {
        await db.run(`UPDATE ${table} SET onboarding_completed = 1 WHERE id = ?`, [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao atualizar onboarding:', err);
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
    const { collectorId, producerId } = req.query;

    let query = `
        SELECT items.*, 
               producers.name as producer_name, 
               producers.avatar_url as producer_avatar,
               collectors.name as collector_name,
               collectors.avatar_url as collector_avatar,
               collectors.phone as collector_phone
        FROM items 
        LEFT JOIN producers ON items.producer_id = producers.id 
        LEFT JOIN collectors ON items.collector_id = collectors.id
        WHERE items.status = 'available'
    `;

    const params = [];

    if (collectorId) {
        query += ` OR (items.status = 'reserved' AND items.collector_id = ?)`;
        params.push(collectorId);
    } else if (producerId) {
        query += ` OR (items.producer_id = ? AND items.status IN ('available', 'reserved'))`;
        params.push(producerId);
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

        const itemId = result.lastID;
        console.log("Item created successfully, result ID:", itemId);

        // GRAVA NO LEDGER CRIPTOGRÁFICO: Bloco Gênesis de Descarte
        await traceabilityService.addLedgerEntry(itemId, 'DISCARD', producer_id, 'producer', {
            type,
            title,
            weight_kg,
            address,
            lat,
            lng
        });

        res.json({ success: true, id: itemId });
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
    const { status, collector_id, weightCoop, industryId, batchCode } = req.body;
    const { id } = req.params;

    // Se for reserva ou coleta, precisa de coletor
    if ((status === 'reserved' || status === 'collected') && !collector_id) {
        return res.status(400).json({ error: 'Collector ID required for this action' });
    }

    const collectedAt = status === 'collected' ? new Date().toISOString() : null;

    try {
        let result;
        if (collector_id) {
            result = await db.run("UPDATE items SET status = ?, collector_id = ?, collected_at = ? WHERE id = ?",
                [status, collector_id, collectedAt, id]);
        } else {
            result = await db.run("UPDATE items SET status = ? WHERE id = ?",
                [status, id]);
        }

        // GRAVA NO LEDGER CRIPTOGRÁFICO DE ACORDO COM O STATUS
        if (status === 'reserved') {
            await traceabilityService.addLedgerEntry(id, 'RESERVE', collector_id, 'collector', {
                reserved_at: new Date().toISOString()
            });
        } else if (status === 'collected') {
            await traceabilityService.addLedgerEntry(id, 'COLLECTION', collector_id, 'collector', {
                collected_at: collectedAt || new Date().toISOString()
            });
            await updateStatsAfterCollection(id, collector_id);
        } else if (status === 'homologated') {
            // Cooperativa valida e pesa o lote
            await traceabilityService.addLedgerEntry(id, 'COOP_RECEIPT', 1, 'cooperative', {
                cooperative_name: "Coopercaps Centro",
                balanza_weight_kg: weightCoop || 12.5,
                receipt_number: `REC-${Math.floor(Math.random() * 900000) + 100000}`,
                timestamp_coop: new Date().toISOString()
            });
        } else if (status === 'recycled') {
            // Indústria recicla e emite o crédito final
            await traceabilityService.addLedgerEntry(id, 'INDUSTRY_RECYCLE', industryId || 101, 'industry', {
                industry_name: "Coca-Cola Indústrias S.A.",
                recycling_batch: batchCode || `BATCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
                credit_issued: true
            });
        }

        res.json({ success: true, changes: result.changes });
    } catch (err) {
        console.error("Error updating item status:", err.message);
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

app.put('/api/user/points', async (req, res) => {
    const { id, role, points } = req.body;
    if (!id || !role || points === undefined) {
        return res.status(400).json({ error: 'Missing id, role, or points' });
    }
    const table = role === 'producer' ? 'producers' : 'collectors';
    try {
        await db.run(`UPDATE ${table} SET points = ? WHERE id = ?`, [points, id]);
        res.json({ success: true, points });
    } catch (err) {
        console.error("Error updating user points:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 🏢 NOVAS ROTAS: RASTREABILIDADE & B2B ESG
// ==========================================

// 1. Obter Timeline de Rastreabilidade e Validação Criptográfica do Item
app.get('/api/traceability/:itemId', async (req, res) => {
    const { itemId } = req.params;
    try {
        const item = await db.get("SELECT items.*, producers.name as producer_name, collectors.name as collector_name FROM items LEFT JOIN producers ON items.producer_id = producers.id LEFT JOIN collectors ON items.collector_id = collectors.id WHERE items.id = ?", [itemId]);
        
        if (!item) return res.status(404).json({ error: 'Item não encontrado' });

        // Rodar verificação criptográfica do Ledger
        const audit = await traceabilityService.verifyLedger(itemId);

        res.json({
            success: true,
            item,
            audit
        });
    } catch (err) {
        console.error("Erro ao obter rastreabilidade:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Obter estatísticas do painel B2B para Coca-Cola, Ambev, Unilever
app.get('/api/b2b/stats', async (req, res) => {
    try {
        // Peso total reciclado no sistema (homologado na balança ou coletado)
        const weightResult = await db.get("SELECT SUM(weight_kg) as total_weight FROM items WHERE status IN ('collected', 'homologated', 'recycled')");
        const totalWeight = weightResult?.total_weight || 0;

        // Total de créditos emitidos
        const creditsResult = await db.query("SELECT * FROM b2b_credits ORDER BY created_at DESC");
        const totalCreditsBought = creditsResult.rows.reduce((sum, row) => sum + row.weight_kg, 0);

        res.json({
            success: true,
            total_recycled_kg: totalWeight,
            total_credits_bought_kg: totalCreditsBought,
            co2_saved_tons: parseFloat((totalWeight * 0.0028).toFixed(2)), // Estimativa ESG (2.8 kg CO2 p/ kg de plástico reciclado)
            transactions_count: weightResult ? 142 : 0, // simulação de contagem total
            credits_history: creditsResult.rows
        });
    } catch (err) {
        console.error("Erro ao obter estatísticas B2B:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Comprar Créditos de Reciclagem B2B
app.post('/api/b2b/credits', async (req, res) => {
    const { companyName, weightKg } = req.body;
    if (!companyName || !weightKg) {
        return res.status(400).json({ error: 'Razão social e peso dos créditos em KG são necessários.' });
    }

    try {
        const amountPaid = parseFloat((weightKg * 0.35).toFixed(2)); // R$ 0.35 por KG de crédito (valor de mercado)
        const certificateUuid = crypto.randomUUID ? crypto.randomUUID() : `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const result = await db.run(
            "INSERT INTO b2b_credits (company_name, weight_kg, amount_paid, certificate_uuid) VALUES (?, ?, ?, ?)",
            [companyName, weightKg, amountPaid, certificateUuid]
        );

        res.json({
            success: true,
            creditId: result.lastID,
            data: {
                companyName,
                weightKg,
                amountPaid,
                certificateUuid,
                created_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error("Erro ao adquirir créditos ESG:", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 🤖 NOVAS ROTAS: INTELIGÊNCIA ARTIFICIAL (GEMINI)
// ==========================================

// 1. Analisar foto do descarte (Visão Computacional + Antifraude)
app.post('/api/ai/analyze-image', async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Dados da imagem em Base64 são obrigatórios.' });

    try {
        const analysis = await aiService.analyzeImage(imageBase64);
        res.json({ success: true, analysis });
    } catch (err) {
        console.error("Erro na rota de análise de imagem IA:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Otimizar rota de coleta para catadores
app.post('/api/ai/optimize-route', async (req, res) => {
    const { collectorId, currentCoords, activePoints } = req.body;
    if (!currentCoords) return res.status(400).json({ error: 'Coordenadas atuais do coletor são obrigatórias.' });

    try {
        const routeOptimization = await aiService.optimizeRoute(collectorId, currentCoords, activePoints || []);
        res.json({ success: true, ...routeOptimization });
    } catch (err) {
        console.error("Erro na rota de otimização de rota IA:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Estimar renda mensal e fornecer coach de metas
app.post('/api/ai/financial-forecast', async (req, res) => {
    const { collectorId } = req.body;
    if (!collectorId) return res.status(400).json({ error: 'Collector ID é obrigatório.' });

    try {
        const forecast = await aiService.getFinancialForecast(collectorId);
        res.json({ success: true, forecast });
    } catch (err) {
        console.error("Erro na rota de previsão de faturamento IA:", err);
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 💬 ROTAS DO SISTEMA DE CHAT (PRODUTOR & CATADOR)
// ==========================================

// 1. Obter ou Criar Conversa (Chat)
app.post('/api/chats', authenticateToken, async (req, res) => {
    const { producer_id, collector_id } = req.body;
    if (!producer_id || !collector_id) {
        return res.status(400).json({ error: 'IDs do produtor e coletor são obrigatórios.' });
    }

    try {
        // Verificar se já existe conversa
        let chat = await db.get(
            "SELECT * FROM chats WHERE producer_id = ? AND collector_id = ?",
            [producer_id, collector_id]
        );

        if (!chat) {
            // Criar nova conversa
            const result = await db.run(
                "INSERT INTO chats (producer_id, collector_id, last_message, last_message_time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                [producer_id, collector_id, 'Conversa iniciada']
            );
            chat = {
                id: result.lastID,
                producer_id,
                collector_id,
                last_message: 'Conversa iniciada',
                last_message_time: new Date().toISOString()
            };
        }

        res.json({ success: true, chat });
    } catch (err) {
        console.error("Erro ao obter/criar conversa:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Listar Conversas Ativas do Usuário Autenticado
app.get('/api/chats', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        let query = '';
        let params = [userId];

        if (userRole === 'producer') {
            // Usuário é produtor: juntar dados do coletor
            query = `
                SELECT chats.*, 
                       collectors.name as partner_name, 
                       collectors.avatar_url as partner_avatar,
                       collectors.phone as partner_phone,
                       'collector' as partner_role
                FROM chats
                INNER JOIN collectors ON chats.collector_id = collectors.id
                WHERE chats.producer_id = ?
                ORDER BY chats.last_message_time DESC
            `;
        } else if (userRole === 'collector') {
            // Usuário é coletor: juntar dados do produtor
            query = `
                SELECT chats.*, 
                       producers.name as partner_name, 
                       producers.avatar_url as partner_avatar,
                       producers.phone as partner_phone,
                       'producer' as partner_role
                FROM chats
                INNER JOIN producers ON chats.producer_id = producers.id
                WHERE chats.collector_id = ?
                ORDER BY chats.last_message_time DESC
            `;
        } else {
            return res.status(400).json({ error: 'Regra de usuário inválida para o chat.' });
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar conversas:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Obter Histórico de Mensagens de um Chat Específico
app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Verificar se a conversa pertence ao usuário atual
        const chat = await db.get("SELECT * FROM chats WHERE id = ?", [chatId]);
        if (!chat) {
            return res.status(404).json({ error: 'Conversa não encontrada.' });
        }

        if (
            (userRole === 'producer' && chat.producer_id !== userId) ||
            (userRole === 'collector' && chat.collector_id !== userId)
        ) {
            return res.status(403).json({ error: 'Acesso negado a esta conversa.' });
        }

        const messagesResult = await db.query(
            "SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC",
            [chatId]
        );

        res.json(messagesResult.rows);
    } catch (err) {
        console.error("Erro ao obter mensagens:", err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Enviar uma Nova Mensagem no Chat
app.post('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Mensagem vazia.' });
    }

    try {
        // Verificar se a conversa existe e pertence ao usuário atual
        const chat = await db.get("SELECT * FROM chats WHERE id = ?", [chatId]);
        if (!chat) {
            return res.status(404).json({ error: 'Conversa não encontrada.' });
        }

        if (
            (userRole === 'producer' && chat.producer_id !== userId) ||
            (userRole === 'collector' && chat.collector_id !== userId)
        ) {
            return res.status(403).json({ error: 'Acesso negado a esta conversa.' });
        }

        // Inserir a nova mensagem
        const insertResult = await db.run(
            "INSERT INTO messages (chat_id, sender_role, content, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
            [chatId, userRole, content.trim()]
        );

        const newMessage = {
            id: insertResult.lastID,
            chat_id: parseInt(chatId),
            sender_role: userRole,
            content: content.trim(),
            timestamp: new Date().toISOString(),
            is_read: 0
        };

        // Atualizar metadados da conversa
        await db.run(
            "UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?",
            [content.trim(), chatId]
        );

        res.status(201).json({ success: true, message: newMessage });
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
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
