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
                    onLogin(email, password);
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
            setLoading(false);
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
            padding: '24px',
            background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '56px 32px 40px 32px',
                borderRadius: '32px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                width: '100%',
                maxWidth: '440px',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ 
                        color: '#102a43', 
                        fontSize: '2.8rem', 
                        fontWeight: '900', 
                        letterSpacing: '-1.5px',
                        marginBottom: '8px' 
                    }}>GreenTech</h1>
                    <p style={{ color: '#627d98', fontWeight: '500', fontSize: '1.1rem' }}>Conexão solidária para o planeta</p>
                </div>

                {error && <div style={{ 
                    color: '#cb2b1d', textAlign: 'center', marginBottom: '24px', 
                    fontWeight: '600', fontSize: '0.9rem', padding: '12px', 
                    background: '#fff5f5', borderRadius: '12px', border: '1px solid #fee2e2' 
                }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {isRegisterMode && (
                        <div style={{ position: 'relative', animation: 'fadeIn 0.3s ease-in-out' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#334e68', fontWeight: '700', fontSize: '0.9rem' }}>Nome Completo</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px',
                                    border: '1px solid #d9e2ec', outline: 'none', fontSize: '1rem',
                                    background: '#f8fafc', transition: 'border-color 0.2s', boxSizing: 'border-box'
                                }}
                                placeholder="Como quer ser chamado?"
                            />
                            <div style={{ position: 'absolute', left: '16px', top: '42px', color: '#9fb3c8' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                        </div>
                    )}
                    
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#334e68', fontWeight: '700', fontSize: '0.9rem' }}>E-mail</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px',
                                border: '1px solid #d9e2ec', outline: 'none', fontSize: '1rem',
                                background: '#f8fafc', boxSizing: 'border-box'
                            }}
                            placeholder="seu@exemplo.com"
                        />
                        <div style={{ position: 'absolute', left: '16px', top: '42px', color: '#9fb3c8' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#334e68', fontWeight: '700', fontSize: '0.9rem' }}>Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px',
                                border: '1px solid #d9e2ec', outline: 'none', fontSize: '1rem',
                                background: '#f8fafc', boxSizing: 'border-box'
                            }}
                            placeholder="••••••••"
                        />
                        <div style={{ position: 'absolute', left: '16px', top: '42px', color: '#9fb3c8' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                    </div>

                    {isRegisterMode && (
                        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                            <label style={{ display: 'block', marginBottom: '12px', color: '#334e68', fontWeight: '700', fontSize: '0.9rem' }}>Eu quero ser um...</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setRole('producer')}
                                    style={{
                                        flex: 1, padding: '14px',
                                        background: role === 'producer' ? '#e8f5e9' : 'white',
                                        color: role === 'producer' ? '#1b5e20' : '#627d98',
                                        border: role === 'producer' ? '2px solid #27ae60' : '2px solid #d9e2ec',
                                        borderRadius: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    🌱 Doador
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('collector')}
                                    style={{
                                        flex: 1, padding: '14px',
                                        background: role === 'collector' ? '#fff3e0' : 'white',
                                        color: role === 'collector' ? '#e65100' : '#627d98',
                                        border: role === 'collector' ? '2px solid #f39c12' : '2px solid #d9e2ec',
                                        borderRadius: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    🚛 Catador
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                        marginTop: '12px',
                        padding: '18px',
                        background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '1.2rem',
                        fontWeight: '800',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 8px 16px rgba(39, 174, 96, 0.25)',
                        transition: 'all 0.3s',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        {loading ? 'Processando...' : (isRegisterMode ? 'Criar Minha Conta' : 'Entrar na GreenTech')}
                    </button>
                    
                    {/* Toggle Mode Link (Substituindo as abas anteriores) */}
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <span style={{ color: '#627d98', fontSize: '0.95rem', fontWeight: '500' }}>
                            {isRegisterMode ? 'Já tem uma conta? ' : 'Ainda não faz parte? '}
                        </span>
                        <button 
                            type="button" 
                            onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}
                            style={{ 
                                background: 'transparent', border: 'none', 
                                color: '#27ae60', fontWeight: '800', fontSize: '0.95rem',
                                cursor: 'pointer', padding: '0 0 0 4px',
                                textDecoration: 'underline', textUnderlineOffset: '4px'
                            }}
                        >
                            {isRegisterMode ? 'Fazer Login' : 'Criar Conta'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '40px', borderTop: '2px dashed #e4e9f2', paddingTop: '32px' }}>
                    <p style={{ textAlign: 'center', color: '#9fb3c8', marginBottom: '20px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Acesso de Demonstração</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('producer')}
                            style={{
                                flex: 1, padding: '12px', background: 'white',
                                color: '#27ae60', border: '1px solid #d9e2ec', borderRadius: '12px',
                                fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                fontSize: '0.9rem', boxSizing: 'border-box'
                            }}
                        >
                            Modo Doador
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('collector')}
                            style={{
                                flex: 1, padding: '12px', background: 'white',
                                color: '#f39c12', border: '1px solid #d9e2ec', borderRadius: '12px',
                                fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                fontSize: '0.9rem', boxSizing: 'border-box'
                            }}
                        >
                            Modo Catador
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
