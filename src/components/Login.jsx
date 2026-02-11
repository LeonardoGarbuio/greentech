import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    const handleQuickLogin = (role) => {
        if (role === 'producer') {
            onLogin('producer@test.com', 'password');
        } else {
            onLogin('collector@test.com', 'password');
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '24px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>GreenTech</h1>
                    <p style={{ color: '#7f8c8d' }}>Reciclagem Inteligente</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '600' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid #bdc3c7',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '600' }}>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid #bdc3c7',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" style={{
                        marginTop: '10px',
                        padding: '14px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}>
                        Entrar
                    </button>
                </form>

                <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <p style={{ textAlign: 'center', color: '#95a5a6', marginBottom: '15px', fontSize: '0.9rem' }}>Acesso Rápido (Teste)</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => handleQuickLogin('producer')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: '#e8f5e9',
                                color: '#27ae60',
                                border: '1px solid #27ae60',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            👤 Doador
                        </button>
                        <button
                            onClick={() => handleQuickLogin('collector')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: '#fff3e0',
                                color: '#e67e22',
                                border: '1px solid #e67e22',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            🚛 Catador
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
