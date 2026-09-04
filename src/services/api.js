import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

/**
 * API_BASE_URL - Configuração Inteligente:
 * 1. Web/Navegador: Usa '/api' (Vite proxy no dev, Vercel no prod).
 * 2. Android Emulator: Usa 'http://10.0.2.2:3002/api' para falar com o seu PC.
 * 3. iOS Simulator: Usa 'http://localhost:3002/api' (iOS compartilha rede com Mac).
 * 4. Dispositivo Real: Prefere '/api' se estiver em produção, ou o IP do PC se em dev.
 */
let baseUrl = import.meta.env.VITE_API_URL || '/api';

if (isNative) {
    if (platform === 'android') {
        baseUrl = import.meta.env.VITE_API_URL || 'http://10.0.2.2:3002/api';
    } else if (platform === 'ios') {
        baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    }
}

// Auto-detect localhost/dev environment and override Vercel URL
if (!isNative && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:3002/api';
    }
}

export const API_BASE_URL = baseUrl;

// Helper function to include the JWT token in headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('greentech_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    // User endpoints
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.token) localStorage.setItem('greentech_token', data.token);
        return data;
    },

    register: async (name, email, password, role) => {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await response.json();
        if (data.token) localStorage.setItem('greentech_token', data.token);
        return data;
    },

    getUserStats: async (userId, role) => {
        const response = await fetch(`${API_BASE_URL}/user?id=${userId}&role=${role}`);
        if (!response.ok) throw new Error('Failed to fetch user stats');
        return response.json();
    },

    updateUserPoints: async (userId, role, points) => {
        const response = await fetch(`${API_BASE_URL}/user/points`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, role, points })
        });
        if (!response.ok) throw new Error('Failed to update user points');
        return response.json();
    },

    getHistory: async (userId, role) => {
        const response = await fetch(`${API_BASE_URL}/history?userId=${userId}&role=${role}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    // Item endpoints
    getItems: async (userId, role) => {
        let url = `${API_BASE_URL}/items`;
        if (role === 'collector' && userId) {
            url = `${API_BASE_URL}/items?collectorId=${userId}`;
        } else if (role === 'producer' && userId) {
            url = `${API_BASE_URL}/items?producerId=${userId}`;
        }
        console.log("Fetching items from:", url);
        const response = await fetch(url);
        const data = await response.json();
        console.log("Items fetched:", data);
        return data;
    },

    createItem: async (item, producerId) => {
        const response = await fetch(`${API_BASE_URL}/items`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ...item, producer_id: producerId })
        });
        return response.json();
    },

    updateItemStatus: async (itemId, status, collectorId) => {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status, collector_id: collectorId })
        });
        return response.json();
    },

    deleteItem: async (itemId) => {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return response.json(); // May be empty or status only
    },

    // Notifications & Addresses
    getNotifications: async (userId, role) => {
        const response = await fetch(`${API_BASE_URL}/notifications?userId=${userId}&role=${role}`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return response.json();
    },

    getAddresses: async (userId, role) => {
        const response = await fetch(`${API_BASE_URL}/addresses?userId=${userId}&role=${role}`);
        if (!response.ok) throw new Error('Failed to fetch addresses');
        return response.json();
    },

    addAddress: async (address) => {
        const response = await fetch(`${API_BASE_URL}/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(address)
        });
        if (!response.ok) throw new Error('Failed to add address');
        return response.json();
    },

    deleteAddress: async (id) => {
        const response = await fetch(`${API_BASE_URL}/addresses/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete address');
        return response.json();
    },

    updateUser: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to update user');
        return response.json();
    },

    // External Services
    searchAddress: async (query) => {
        const response = await fetch(`${API_BASE_URL}/geocode?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Erro ao localizar cidade ou endereço');
        return response.json();
    },

    // Mock Data for New Features
    getGardenStatus: async (points) => {
        // Determine plant stage based on points
        let stage = 'seed';
        if (points >= 100) stage = 'sprout';
        if (points >= 300) stage = 'plant';
        if (points >= 600) stage = 'tree';
        if (points >= 1000) stage = 'forest';

        return {
            stage: stage,
            nextLevel: points >= 1000 ? 0 : (stage === 'seed' ? 100 : stage === 'sprout' ? 300 : stage === 'plant' ? 600 : 1000),
            message: stage === 'seed' ? 'Uma pequena semente foi plantada!' :
                stage === 'sprout' ? 'Está crescendo! Continue reciclando.' :
                    stage === 'plant' ? 'Olha que linda! Já é uma planta forte.' :
                        stage === 'tree' ? 'Incrível! Virou uma árvore frondosa.' :
                            'Você criou uma verdadeira floresta!'
        };
    },

    getLeaderboard: async () => {
        return [
            { id: 1, name: 'Maria Silva', points: 1250, rank: 1, avatar: '👩' },
            { id: 2, name: 'João Santos', points: 980, rank: 2, avatar: '👨' },
            { id: 3, name: 'Ana Costa', points: 850, rank: 3, avatar: '👧' },
            { id: 4, name: 'Você', points: 350, rank: 12, avatar: '👤' }, // Should match user points ideally
            { id: 5, name: 'Pedro Lima', points: 720, rank: 4, avatar: '👦' }
        ].sort((a, b) => b.points - a.points);
    },

    getRecyclingGuide: async () => {
        return [
            { id: 'paper', title: 'Papel', description: 'Jornais, revistas, caixas de papelão. Devem estar secos e limpos.', icon: '📄' },
            { id: 'plastic', title: 'Plástico', description: 'Garrafas PET, embalagens de limpeza. Lave para retirar resíduos.', icon: '🥤' },
            { id: 'glass', title: 'Vidro', description: 'Garrafas, potes de conserva. Cuidado ao manusear se estiver quebrado.', icon: '🍾' },
            { id: 'metal', title: 'Metal', description: 'Latas de alumínio (cerveja/refri), latas de conserva.', icon: '🥫' },
            { id: 'electronic', title: 'Eletrônicos', description: 'Celulares antigos, cabos, baterias. Nunca descarte no lixo comum!', icon: '🔌' },
            { id: 'organic', title: 'Orgânico', description: 'Restos de comida, cascas de frutas. Ideal para compostagem.', icon: '🍎' }
        ];
    },

    completeOnboarding: async (userId, role) => {
        const response = await fetch(`${API_BASE_URL}/user/onboarding`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, role })
        });
        return response.json();
    },

    verifySession: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Unauthorized');
        return response.json();
    },

    // --- MÉTODOS DE INTELIGÊNCIA ARTIFICIAL (GEMINI) ---
    analyzeImage: async (imageBase64) => {
        const response = await fetch(`${API_BASE_URL}/ai/analyze-image`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ imageBase64 })
        });
        if (!response.ok) throw new Error('Erro ao analisar imagem com IA');
        return response.json();
    },

    optimizeRoute: async (collectorId, currentCoords, activePoints) => {
        const response = await fetch(`${API_BASE_URL}/ai/optimize-route`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ collectorId, currentCoords, activePoints })
        });
        if (!response.ok) throw new Error('Erro ao otimizar rota com IA');
        const data = await response.json();
        return data.analysis || data;
    },

    getCooperatives: async (coords, radius = 30000) => {
        if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
            throw new Error('Localização necessária para buscar a rede de reciclagem');
        }
        const query = `?lat=${encodeURIComponent(coords.lat)}&lng=${encodeURIComponent(coords.lng)}&radius=${encodeURIComponent(radius)}`;
        const response = await fetch(`${API_BASE_URL}/cooperatives${query}`);
        if (!response.ok) throw new Error('Erro ao carregar a rede de reciclagem');
        return response.json();
    },

    getFinancialForecast: async (collectorId) => {
        const response = await fetch(`${API_BASE_URL}/ai/financial-forecast`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ collectorId })
        });
        if (!response.ok) throw new Error('Erro ao buscar previsão financeira IA');
        return response.json();
    },

    // --- MÉTODOS DE RASTREABILIDADE & B2B ESG ---
    getTraceabilityLedger: async (itemId) => {
        const response = await fetch(`${API_BASE_URL}/traceability/${itemId}`);
        if (!response.ok) throw new Error('Erro ao carregar auditoria de rastreabilidade');
        return response.json();
    },

    // Atualização especializada para Cooperativa Homologar
    getCooperativeLots: async () => {
        const response = await fetch(`${API_BASE_URL}/cooperative/lots`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Erro ao carregar lotes da cooperativa');
        return response.json();
    },

    coopHomologateItem: async (itemId, { weightKg, materialType, destination }) => {
        const response = await fetch(`${API_BASE_URL}/cooperative/lots/${itemId}/homologate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ weightKg, materialType, destination })
        });
        if (!response.ok) throw new Error('Erro ao homologar item na cooperativa');
        return response.json();
    },

    // Atualização especializada para Indústria Reciclar (Crédito completo)
    industryRecycleItem: async (itemId, industryId, batchCode) => {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                status: 'recycled', 
                industryId, 
                batchCode 
            })
        });
        if (!response.ok) throw new Error('Erro ao registrar reciclagem final na indústria');
        return response.json();
    },

    // --- MÉTODOS DO SISTEMA DE CHAT ---
    getOrCreateChat: async (producerId, collectorId) => {
        const response = await fetch(`${API_BASE_URL}/chats`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ producer_id: producerId, collector_id: collectorId })
        });
        if (!response.ok) throw new Error('Erro ao abrir conversa');
        return response.json();
    },

    getChats: async () => {
        const response = await fetch(`${API_BASE_URL}/chats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Erro ao carregar conversas');
        return response.json();
    },

    getChatMessages: async (chatId) => {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Erro ao carregar histórico de mensagens');
        return response.json();
    },

    sendMessage: async (chatId, content, imageBase64 = null) => {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content, image: imageBase64 })
        });
        if (!response.ok) throw new Error('Erro ao enviar mensagem');
        return response.json();
    }
};
