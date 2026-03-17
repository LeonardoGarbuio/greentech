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

    getHistory: async (userId, role) => {
        const response = await fetch(`${API_BASE_URL}/history?userId=${userId}&role=${role}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    // Item endpoints
    getItems: async (userId, role) => {
        const url = role === 'collector' && userId
            ? `${API_BASE_URL}/items?collectorId=${userId}`
            : `${API_BASE_URL}/items`;
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
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search address');
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
    }
};
