import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Leaderboard = ({ user: currentUser }) => {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        api.getLeaderboard().then(data => setLeaders(data));
    }, []);

    return (
        <div style={{ paddingBottom: '100px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{
                padding: '24px',
                background: 'white',
                borderBottom: '1px solid var(--surface-border)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', textAlign: 'center' }}>Ranking 🏆</h2>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {leaders.map((leader, index) => (
                    <div key={leader.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        background: currentUser && leader.id === currentUser.id ? '#e8f5e9' : 'white',
                        borderRadius: '16px',
                        border: currentUser && leader.id === currentUser.id ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            color: index < 3 ? '#f1c40f' : '#95a5a6'
                        }}>
                            {index + 1}º
                        </div>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            margin: '0 16px',
                            background: '#eee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            {leader.avatar}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{leader.name} {currentUser && leader.id === currentUser.id && '(Você)'}</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nível {Math.floor(leader.points / 100) + 1}</p>
                        </div>
                        <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                            {leader.points} pts
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
