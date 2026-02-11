import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Guide = ({ onNavigate }) => {
    const [tips, setTips] = useState([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        api.getRecyclingGuide().then(data => setTips(data));
    }, []);

    const filteredTips = tips.filter(tip =>
        tip.title.toLowerCase().includes(filter.toLowerCase()) ||
        tip.description.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div style={{ paddingBottom: '100px', backgroundColor: '#eafaf1', minHeight: '100vh' }}>
            <div style={{
                padding: '24px',
                background: 'white',
                borderBottom: '1px solid var(--surface-border)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', textAlign: 'center' }}>Guia de Reciclagem 📚</h1>
                <div style={{ marginTop: '16px' }}>
                    <input
                        type="text"
                        placeholder="O que você quer reciclar?"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: '#f1f2f6',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {filteredTips.map(tip => (
                    <div key={tip.id} style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '20px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: '#e8f5e9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem'
                        }}>
                            {tip.icon}
                        </div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '700' }}>{tip.title}</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>{tip.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Guide;
