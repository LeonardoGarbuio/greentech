import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../services/api';

const Profile = ({ onNavigate, onLogout, user: currentUser }) => {
    const [activeModal, setActiveModal] = useState(null);
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [addresses, setAddresses] = useState([]);

    // Fetch all profile data
    useEffect(() => {
        console.log("Profile Effect Triggered. User:", currentUser);

        if (!currentUser || !currentUser.id) {
            console.warn("Profile: No user ID provided.");
            return;
        }

        let isMounted = true;
        const fetchData = async () => {
            try {
                // ...

                api.getUserStats(currentUser.id, currentUser.role),
                    api.getNotifications(currentUser.id, currentUser.role),
                    api.getAddresses(currentUser.id, currentUser.role)
                ]);

setUser(userData);
setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
setAddresses(Array.isArray(addressesData) ? addressesData : []);
            } catch (error) {
    console.error("Failed to fetch profile data:", error);
    // Allow user to logout if data fails (e.g. user deleted or db reset)
    alert("Erro ao carregar perfil. Por favor, faça login novamente.");
    onLogout();
}
        };
fetchData();
    }, [currentUser]);

const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = {
        id: currentUser.id,
        role: currentUser.role,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone')
    };

    try {
        await api.updateUser(updates);
        setUser({ ...user, ...updates });
        setActiveModal(null);
    } catch (error) {
        console.error("Failed to update profile:", error);
    }
};

const handleAddAddress = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newAddress = {
        userId: currentUser.id,
        role: currentUser.role,
        title: formData.get('title'),
        address: formData.get('address')
    };

    try {
        await api.addAddress(newAddress);
        // Refresh addresses
        const addrData = await api.getAddresses(currentUser.id, currentUser.role);
        setAddresses(Array.isArray(addrData) ? addrData : []);
        setActiveModal('addresses'); // Go back to list
    } catch (error) {
        console.error("Failed to add address:", error);
    }
};

const handleDeleteAddress = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
    try {
        await api.deleteAddress(id);
        setAddresses(addresses.filter(a => a.id !== id));
    } catch (error) {
        console.error("Failed to delete address:", error);
    }
};

const renderModalContent = () => {
    switch (activeModal) {
        case 'edit':
            return (
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Nome Completo</label>
                        <input name="name" type="text" defaultValue={user?.name} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Email</label>
                        <input name="email" type="email" defaultValue={user?.email} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Telefone</label>
                        <input name="phone" type="tel" defaultValue={user?.phone} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }} />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '14px', borderRadius: '12px' }}>Salvar Alterações</button>
                </form>
            );
        case 'notifications':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.length === 0 ? <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma notificação.</p> : notifications.map((notif, i) => (
                        <div key={i} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '12px', borderLeft: '4px solid var(--primary-color)' }}>
                            <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{notif.title}</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{notif.message}</p>
                            <span style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px', display: 'block' }}>{new Date(notif.created_at).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            );
        case 'addresses':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {addresses.map((addr, i) => (
                        <div key={i} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '12px', background: 'white', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <strong>{addr.title}</strong>
                                <button onClick={() => handleDeleteAddress(addr.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>🗑️</button>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>{addr.address}</p>
                        </div>
                    ))}
                    <button
                        onClick={() => setActiveModal('add_address')}
                        style={{ padding: '12px', border: '1px dashed #ccc', borderRadius: '12px', background: 'transparent', color: '#666', cursor: 'pointer' }}
                    >
                        + Adicionar Novo Endereço
                    </button>
                </div>
            );
        case 'add_address':
            return (
                <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Nome do Local (Ex: Casa, Trabalho)</label>
                        <input name="title" type="text" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Endereço Completo</label>
                        <input name="address" type="text" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={() => setActiveModal('addresses')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#eee', cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px' }}>Salvar</button>
                    </div>
                </form>
            );
        case 'help':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { q: 'Como separar o lixo?', a: 'Separe em seco (reciclável) e úmido (orgânico). Lave as embalagens antes de descartar.' },
                        { q: 'O que o app coleta?', a: 'Conectamos você a catadores que recolhem papel, plástico, vidro, metal e eletrônicos.' },
                        { q: 'É gratuito?', a: 'Sim! O app é gratuito para doadores.' }
                    ].map((faq, i) => (
                        <div key={i} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{faq.q}</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{faq.a}</p>
                        </div>
                    ))}
                    <button className="btn-primary" style={{ marginTop: '10px' }}>Falar com Suporte</button>
                </div>
            );
        default:
            return null;
    }
};

const getModalTitle = () => {
    switch (activeModal) {
        case 'edit': return 'Editar Perfil';
        case 'notifications': return 'Notificações';
        case 'addresses': return 'Meus Endereços';
        case 'help': return 'Ajuda & Suporte';
        default: return '';
    }
};

if (!user) return <div>Carregando...</div>;

return (
    <div style={{ paddingBottom: '80px' }}>
        <header style={{
            padding: '20px',
            background: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottom: '1px solid var(--surface-border)'
        }}>
            <h1 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '700' }}>Meu Perfil</h1>
        </header>

        <div style={{ padding: '20px' }}>
            {/* User Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'var(--bg-color)',
                    border: '2px solid var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>{user.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Doador Nível 3</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px' }}>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>{user.points}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Pontos Eco</p>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--secondary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>{user.weight_recycled}kg</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Reciclados</p>
                </div>
            </div>

            {/* Settings List */}
            <div className="glass-panel" style={{ background: 'white', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                {[
                    { id: 'edit', label: 'Editar Perfil' },
                    { id: 'notifications', label: 'Notificações' },
                    { id: 'addresses', label: 'Meus Endereços' },
                    { id: 'help', label: 'Ajuda' }
                ].map((item, index) => (
                    <div
                        key={item.id}
                        onClick={() => setActiveModal(item.id)}
                        style={{
                            padding: '16px 20px',
                            borderBottom: index < 3 ? '1px solid var(--surface-border)' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.label}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                ))}
            </div>

            <button onClick={onLogout} style={{
                marginTop: '30px',
                width: '100%',
                padding: '16px',
                background: 'transparent',
                border: '1px solid #e74c3c',
                color: '#e74c3c',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                SAIR DA CONTA
            </button>
        </div>

        <Modal
            isOpen={!!activeModal}
            onClose={() => setActiveModal(null)}
            title={getModalTitle()}
        >
            {renderModalContent()}
        </Modal>
    </div>
);
};

export default Profile;
