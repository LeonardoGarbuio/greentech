import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Home = ({ onNavigate, user: currentUser }) => {
    const [user, setUser] = useState({ points: 0, weight_recycled: 0 });
    const [history, setHistory] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        if (!currentUser || !currentUser.id) return;

        const fetchData = async () => {
            try {
                // Fetch User Stats
                const userData = await api.getUserStats(currentUser.id, currentUser.role);
                setUser(userData);

                // Fetch History
                const historyData = await api.getHistory(currentUser.id, currentUser.role);
                setHistory(Array.isArray(historyData) ? historyData : []);

                // Fetch Notifications
                const notificationsData = await api.getNotifications(currentUser.id, currentUser.role);
                setNotificationCount(Array.isArray(notificationsData) ? notificationsData.length : 0);
            } catch (error) {
                console.error('Error fetching home data:', error);
            }
        };

        fetchData();
    }, [currentUser]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Hoje';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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

            {/* Header - Corporate & Minimal */}
            <header style={{
                padding: '24px',
                background: 'white',
                borderBottom: '1px solid var(--surface-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>GreenTech</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Painel de Controle</p>
                </div>
                <div
                    onClick={() => onNavigate('profile')}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--bg-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                >
                    {/* Bell Icon SVG */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {notificationCount > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '10px',
                            height: '10px',
                            background: '#e74c3c',
                            borderRadius: '50%',
                            border: '2px solid white'
                        }}></div>
                    )}
                </div>
            </header>

            {/* KPI Cards - Data Driven */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Total Recycled */}
                <div style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--primary-light)', borderRadius: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>TOTAL</span>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{user.weight_recycled || 0}<span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>kg</span></h2>
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {history.filter(i => i.status !== 'collected').reduce((acc, curr) => acc + (curr.weight_kg || 0), 0) > 0 ? (
                            <>
                                <span style={{ fontSize: '0.8rem', color: '#f1c40f', fontWeight: '600' }}>
                                    +{history.filter(i => i.status !== 'collected').reduce((acc, curr) => acc + (curr.weight_kg || 0), 0)}kg
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pendente</span>
                            </>
                        ) : (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                <span style={{ fontSize: '0.8rem', color: '#2ecc71', fontWeight: '600' }}>+12%</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>vs mês ant.</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Eco Points */}
                <div style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: '#fff8e1', borderRadius: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>PONTOS</span>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{user.points || 0}</h2>
                    <div style={{ marginTop: '8px', width: '100%', height: '4px', background: '#f1f2f6', borderRadius: '2px' }}>
                        <div style={{ width: '70%', height: '100%', background: 'var(--accent-color)', borderRadius: '2px' }}></div>
                    </div>
                </div>
            </div>

            {/* Primary Actions - Hybrid Style */}
            <div style={{ padding: '0 24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>O que vamos fazer hoje?</h3>

                <button
                    onClick={() => onNavigate('post-item')}
                    style={{
                        width: '100%',
                        background: 'white',
                        border: '1px solid var(--surface-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                        boxShadow: 'var(--shadow-md)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            fontSize: '2.5rem',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                        }}>
                            ♻️
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Quero Reciclar</span>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tenho materiais para doar</span>
                        </div>
                    </div>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-color)'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </button>

                <button
                    onClick={() => onNavigate('dashboard')}
                    style={{
                        width: '100%',
                        background: 'white',
                        border: '1px solid var(--surface-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-md)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            fontSize: '2.5rem',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                        }}>
                            🚛
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Buscar Coleta</span>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Encontrar catadores próximos</span>
                        </div>
                    </div>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-color)'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </button>
            </div>

            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Atividade Recente</h3>
                    <span
                        onClick={() => onNavigate('history')}
                        style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Ver tudo
                    </span>
                </div>

                <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                    {history.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Nenhuma atividade recente.
                        </div>
                    ) : (
                        history.slice(0, 3).map((item, index) => (
                            <div key={item.id} style={{
                                padding: '16px',
                                borderBottom: index < history.length - 1 ? '1px solid var(--surface-border)' : 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(item.createdAt)}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                        {/* Mock points calculation based on type/weight could go here, using simple +10 for now */}
                                        +10 pts
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

export default Home;
