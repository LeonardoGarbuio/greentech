import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const CollectorHome = ({ onNavigate, user: currentUser }) => {
    const [stats, setStats] = useState({ earnings: 0, collections: 0 });
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!currentUser || !currentUser.id) return;

        const fetchData = async () => {
            try {
                // Fetch Stats
                const statsData = await api.getUserStats(currentUser.id, currentUser.role);
                setStats({
                    earnings: statsData.earnings || 0,
                    collections: statsData.collections_count || 0
                });

                // Fetch History
                const historyData = await api.getHistory(currentUser.id, currentUser.role);
                // Ensure historyData is an array before setting
                setHistory(Array.isArray(historyData) ? historyData : []);
            } catch (error) {
                console.error('Error fetching collector data:', error);
            }
        };

        fetchData();
    }, [currentUser]);

    return (
        <div style={{
            paddingBottom: '100px',
            minHeight: '100vh',
            background: 'var(--bg-color)',
            fontFamily: "'Outfit', sans-serif"
        }}>

            {/* Header - Corporate & Minimal (Matches Home.jsx) */}
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
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Painel do Catador</p>
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
                </div>
            </header>

            {/* KPI Cards - Data Driven (Matches Home.jsx Grid) */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Earnings Card */}
                <div style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: '#d1f2eb', borderRadius: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>GANHOS</span>
                    </div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>R$ {stats.earnings}</h2>
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        <span style={{ fontSize: '0.8rem', color: '#2ecc71', fontWeight: '600' }}>+R$ 45</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>hoje</span>
                    </div>
                </div>

                {/* Collections Count Card */}
                <div style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: '#fff8e1', borderRadius: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>COLETAS</span>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.collections}</h2>
                    <div style={{ marginTop: '8px', width: '100%', height: '4px', background: '#f1f2f6', borderRadius: '2px' }}>
                        <div style={{ width: '60%', height: '100%', background: 'var(--accent-color)', borderRadius: '2px' }}></div>
                    </div>
                </div>
            </div>

            {/* Primary Actions - Hybrid Style (Matches Home.jsx) */}
            <div style={{ padding: '0 24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Ações Rápidas</h3>

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
                            🗺️
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Buscar Coletas</span>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ver mapa de resíduos</span>
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
                    onClick={() => onNavigate('history')}
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
                            📋
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Histórico</span>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ver coletas passadas</span>
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

            {/* Recent Activity - Table Style (Matches Home.jsx) */}
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Últimas Coletas</h3>
                    <span
                        onClick={() => onNavigate('history')}
                        style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Ver tudo
                    </span>
                </div>

                <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                    {history.slice(0, 3).map((item, index) => (
                        <div key={item.id} style={{
                            padding: '16px',
                            borderBottom: index < history.length - 1 ? '1px solid var(--surface-border)' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hoje, {item.time}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#27ae60' }}>
                                    {item.val}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '500' }}>Concluído</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default CollectorHome;
