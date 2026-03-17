import React, { useState } from 'react';
import { api } from '../services/api';

const Login = ({ onLogin }) => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('producer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (isRegisterMode) {
            try {
                const data = await api.register(name, email, password, role);
                if (data.success) {
                    onLogin(email, password); // Execute login immediately after successful registration
                } else {
                    setError(data.message || 'Erro ao criar conta.');
                    setLoading(false);
                }
            } catch (err) {
                console.error("Register error:", err);
                setError('Erro ao comunicar com o servidor.');
                setLoading(false);
            }
        } else {
            onLogin(email, password);
            setLoading(false); // onLogin in App.jsx handles its own loading state implicitly but we'll reset here just in case it fails quickly
        }
    };

    const handleQuickLogin = (quickRole) => {
        if (quickRole === 'producer') {
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
                <div style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--primary-color)',
                        borderRadius: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </div>
                    <h1 style={{ color: '#2c3e50', fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>GreenTech</h1>
                    <p style={{ color: '#7f8c8d' }}>Conexão solidária para o planeta</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', marginBottom: '24px', borderRadius: '12px', background: '#f8f9fa', padding: '4px' }}>
                    <button 
                        onClick={() => { setIsRegisterMode(false); setError(''); }}
                        style={{
                            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                            background: !isRegisterMode ? 'white' : 'transparent',
                            boxShadow: !isRegisterMode ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            color: !isRegisterMode ? 'var(--primary-color)' : '#95a5a6',
                            fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s'
                        }}
                    >
                        Entrar
                    </button>
                    <button 
                        onClick={() => { setIsRegisterMode(true); setError(''); }}
                        style={{
                            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                            background: isRegisterMode ? 'white' : 'transparent',
                            boxShadow: isRegisterMode ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            color: isRegisterMode ? 'var(--primary-color)' : '#95a5a6',
                            fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s'
                        }}
                    >
                        Criar Conta
                    </button>
                </div>

                {error && <div style={{ color: '#e74c3c', textAlign: 'center', marginBottom: '16px', fontWeight: '600', fontSize: '0.9rem', padding: '10px', background: '#fdf0ed', borderRadius: '8px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {isRegisterMode && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '600' }}>Nome Completo</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '12px',
                                    border: '1px solid #bdc3c7', outline: 'none', fontSize: '1rem'
                                }}
                                placeholder="João Silva"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '600' }}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '12px',
                                border: '1px solid #bdc3c7', outline: 'none', fontSize: '1rem'
                            }}
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '600' }}>Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '12px',
                                border: '1px solid #bdc3c7', outline: 'none', fontSize: '1rem'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {isRegisterMode && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '600' }}>Qual é o seu perfil?</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setRole('producer')}
                                    style={{
                                        flex: 1, padding: '10px',
                                        background: role === 'producer' ? '#e8f5e9' : '#f8f9fa',
                                        color: role === 'producer' ? '#27ae60' : '#7f8c8d',
                                        border: role === 'producer' ? '2px solid #27ae60' : '2px solid transparent',
                                        borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    🌱 Doador
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('collector')}
                                    style={{
                                        flex: 1, padding: '10px',
                                        background: role === 'collector' ? '#fff3e0' : '#f8f9fa',
                                        color: role === 'collector' ? '#e67e22' : '#7f8c8d',
                                        border: role === 'collector' ? '2px solid #e67e22' : '2px solid transparent',
                                        borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    ♻️ Catador
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                        marginTop: '10px',
                        padding: '14px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        opacity: loading ? 0.7 : 1
                    }}>
                        {loading ? 'Aguarde...' : (isRegisterMode ? 'Criar Conta' : 'Entrar')}
                    </button>
                </form>

                <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <p style={{ textAlign: 'center', color: '#95a5a6', marginBottom: '15px', fontSize: '0.9rem' }}>Acesso Rápido (Teste)</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('producer')}
                            style={{
                                flex: 1, padding: '8px', background: 'transparent',
                                color: '#27ae60', border: '1px solid #27ae60', borderRadius: '8px',
                                fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            Doador
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('collector')}
                            style={{
                                flex: 1, padding: '8px', background: 'transparent',
                                color: '#e67e22', border: '1px solid #e67e22', borderRadius: '8px',
                                fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            Catador
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
