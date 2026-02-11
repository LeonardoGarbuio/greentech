import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const History = ({ onBack, user: currentUser }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!currentUser || !currentUser.id) return;

        const fetchHistory = async () => {
            try {
                const data = await api.getHistory(currentUser.id, currentUser.role);
                setHistory(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching history:', error);
            }
        };

        fetchHistory();
    }, [currentUser]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Hoje';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'collected': return 'var(--primary-color)';
            case 'reserved': return '#f1c40f';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'collected': return 'Concluído';
            case 'reserved': return 'Reservado';
            case 'available': return 'Pendente';
            default: return status;
        }
    };

    return (
        <div style={{
            paddingBottom: '100px',
            minHeight: '100vh',
            background: 'var(--bg-color)',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Header */}
            <div style={{
                padding: '24px',
                background: 'white',
                borderBottom: '1px solid var(--surface-border)',
                display: 'flex',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <button onClick={onBack} style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1.5rem',
                    marginRight: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Histórico Completo</h2>
            </div>

            {/* List */}
            <div style={{ padding: '24px' }}>
                <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                    {history.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📜</div>
                            <p>Nenhuma atividade registrada ainda.</p>
                        </div>
                    ) : (
                        history.map((item, index) => (
                            <div key={item.id} style={{
                                padding: '16px',
                                borderBottom: index < history.length - 1 ? '1px solid var(--surface-border)' : 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(item.created_at || item.collected_at)}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                        {/* Mock points/value */}
                                        {currentUser && currentUser.role === 'collector' ? `R$ ${(item.weight_kg * 0.5).toFixed(2)}` : `+${Math.round(item.weight_kg * 10)} pts`}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: getStatusColor(item.status), fontWeight: '500' }}>{getStatusLabel(item.status)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;
