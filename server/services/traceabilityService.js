import crypto from 'crypto';
import db from '../db.js';

const generateSHA256 = (data) => crypto
    .createHash('sha256')
    .update(typeof data === 'string' ? data : JSON.stringify(data))
    .digest('hex');

export const traceabilityService = {
    /**
     * Adiciona um novo elo (bloco) na cadeia de custódia do resíduo
     */
    addLedgerEntry: async (itemId, step, actorId, actorRole, payload = {}) => {
        try {
            console.log(`[LEDGER] Registrando elo: Item ${itemId}, Passo ${step} por Actor ${actorId} (${actorRole})`);
            
            // 1. Encontrar o último hash inserido no ledger geral ou para este item
            // Usaremos o ledger do próprio item para formar sua sub-cadeia (ou o ledger global).
            // A sub-cadeia do próprio item é mais limpa e ideal para certificados específicos de lote.
            const lastEntry = await db.get(
                "SELECT current_hash FROM traceability_ledger WHERE item_id = ? ORDER BY id DESC LIMIT 1",
                [itemId]
            );

            const previousHash = lastEntry 
                ? lastEntry.current_hash 
                : "0000000000000000000000000000000000000000000000000000000000000000"; // Bloco Gênesis do item

            // 2. Montar os dados para gerar o hash atual
            const timestamp = new Date().toISOString();
            const payloadStr = JSON.stringify(payload);
            const dataToHash = `${itemId}|${step}|${timestamp}|${actorId}|${actorRole}|${payloadStr}|${previousHash}`;
            
            const currentHash = generateSHA256(dataToHash);

            // 3. Salvar no banco
            await db.run(
                `INSERT INTO traceability_ledger (item_id, step, timestamp, actor_id, actor_role, payload, previous_hash, current_hash)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemId, step, timestamp, actorId, actorRole, payloadStr, previousHash, currentHash]
            );

            console.log(`[LEDGER] Elo gravado com sucesso! Hash: ${currentHash.substring(0, 10)}...`);
            return currentHash;
        } catch (err) {
            console.error("[LEDGER] Erro ao gravar elo no ledger:", err);
            throw err;
        }
    },

    /**
     * Valida criptograficamente toda a cadeia de custódia de um determinado resíduo
     */
    verifyLedger: async (itemId) => {
        try {
            const entries = await db.query(
                "SELECT * FROM traceability_ledger WHERE item_id = ? ORDER BY id ASC",
                [itemId]
            );

            const chain = entries.rows;
            if (chain.length === 0) {
                return { isValid: true, chain: [], reason: "Cadeia vazia (sem registros)" };
            }

            let expectedPreviousHash = "0000000000000000000000000000000000000000000000000000000000000000";

            for (let i = 0; i < chain.length; i++) {
                const block = chain[i];

                // 1. Verificar se o previous_hash bate com o esperado da rodada anterior
                if (block.previous_hash !== expectedPreviousHash) {
                    console.error(`[LEDGER FRAUDE] Item ${itemId}: Quebra de cadeia no bloco ${block.id}. Previous hash não corresponde.`);
                    return { 
                        isValid: false, 
                        corruptedBlockId: block.id,
                        reason: `Quebra de cadeia de custódia. Previous hash (${block.previous_hash.substring(0, 8)}) não corresponde ao esperado (${expectedPreviousHash.substring(0, 8)})`
                    };
                }

                // 2. Recalcular o hash atual com os dados salvos no banco para validar integridade dos dados
                const dataToHash = `${block.item_id}|${block.step}|${block.timestamp}|${block.actor_id}|${block.actor_role}|${block.payload}|${block.previous_hash}`;
                const calculatedHash = generateSHA256(dataToHash);

                if (block.current_hash !== calculatedHash) {
                    console.error(`[LEDGER FRAUDE] Item ${itemId}: Dados alterados no bloco ${block.id}. Hash recalculado não bate.`);
                    return {
                        isValid: false,
                        corruptedBlockId: block.id,
                        reason: `Alteração de dados detectada no bloco ${block.id}! Hash recalculado (${calculatedHash.substring(0, 8)}) difere do salvo (${block.current_hash.substring(0, 8)}).`
                    };
                }

                // Avançar o elo esperado para a próxima rodada
                expectedPreviousHash = block.current_hash;
            }

            return { isValid: true, chain, reason: "Cadeia validada criptograficamente com sucesso." };
        } catch (err) {
            console.error(`[LEDGER] Erro ao verificar ledger para item ${itemId}:`, err);
            return { isValid: false, reason: "Erro técnico ao rodar verificação criptográfica: " + err.message };
        }
    }
};

export default traceabilityService;
