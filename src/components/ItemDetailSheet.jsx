import React, { useEffect, useState } from 'react';
import Garden from './Garden';
import { api } from '../services/api';

const ItemDetailSheet = ({ item, onClose, onAccept, onDelete, currentUserId, userRole, onNavigate }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [showScheduleInput, setShowScheduleInput] = useState(false);
    const [scheduleTime, setScheduleTime] = useState('');
    const [customTime, setCustomTime] = useState('');
    const [showGarden, setShowGarden] = useState(false);
    const [startY, setStartY] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);

    useEffect(() => {
        if (item) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
            setShowGarden(false);
        }
    }, [item]);

    if (!item) return null;

    // Ensure we compare numbers/strings correctly. 
    // item.producer_id comes from DB (likely number), currentUserId comes from state (likely number).
    // MUST check role because Producer ID 1 and Collector ID 1 are different people!
    const isOwner = userRole === 'producer' && item.producer_id === currentUserId;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1001,
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s',
                    pointerEvents: isVisible ? 'auto' : 'none'
                }}
            />

            {/* Sheet */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                background: 'white',
                borderTopLeftRadius: '32px',
                borderTopRightRadius: '32px',
                padding: '24px',
                zIndex: 1002,
                transform: isVisible ? `translateY(${dragOffset}px)` : 'translateY(100%)',
                transition: dragOffset > 0 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                {/* Drag Handle Area */}
                <div 
                    onClick={onClose}
                    onTouchStart={(e) => setStartY(e.touches[0].clientY)}
                    onTouchMove={(e) => {
                        if (!startY) return;
                        const currentY = e.touches[0].clientY;
                        const offset = Math.max(0, currentY - startY); // Only allow dragging down
                        setDragOffset(offset);
                    }}
                    onTouchEnd={() => {
                        if (dragOffset > 150) { // Threshold to close
                            onClose();
                        }
                        setDragOffset(0);
                        setStartY(null);
                    }}
                    style={{
                        padding: '24px 0',
                        margin: '-24px -24px 12px -24px',
                        cursor: 'grab',
                        display: 'flex',
                        justifyContent: 'center',
                        background: 'transparent'
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '4px',
                        background: '#ccc',
                        borderRadius: '2px',
                    }} />
                </div>

                {/* Profile Section - Only show if NOT owner */}
                {!isOwner && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: '#dfe6e9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem',
                                border: '3px solid var(--primary-color)'
                            }}>
                                {item.producer_avatar ? <img src={item.producer_avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : '👤'}
                            </div>
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                background: 'white',
                                borderRadius: '50%',
                                padding: '4px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }}>
                                <span style={{ fontSize: '1rem' }}>♻️</span>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.producer_name || 'Doador Anônimo'}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Doador Verificado • {item.producer_level || 'Iniciante'}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <span style={{ background: '#f1f2f6', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>📍 {item.distance || 'Perto'}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <span style={{ color: '#f1c40f' }}>★</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>5.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ver Eco-Jardim Button - Show for non-owner views */}
                {!isOwner && item.producer_id && (
                    <button
                        onClick={() => setShowGarden(true)}
                        style={{
                            width: '100%',
                            padding: '14px',
                            marginBottom: '20px',
                            background: 'linear-gradient(135deg, #e6f9f1 0%, #d1fae5 100%)',
                            border: '1.5px solid #a7f3d0',
                            borderRadius: '16px',
                            color: '#047857',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.1)'; }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                            <line x1="9" y1="9" x2="9.01" y2="9"></line>
                            <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                        Ver Eco-Jardim de {item.producer_name || 'Doador'}
                    </button>
                )}

                {/* Owner Message */}
                {isOwner && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        background: item.status === 'reserved' ? '#fff9db' : 'var(--primary-light)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        border: item.status === 'reserved' ? '1px solid #ffe066' : 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.5rem' }}>{item.status === 'reserved' ? '🤝' : '📢'}</span>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: item.status === 'reserved' ? '#f59f00' : 'var(--primary-color)' }}>
                                    {item.status === 'reserved' ? 'Coleta Reservada!' : 'Seu Anúncio'}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {item.status === 'reserved' 
                                        ? `O catador ${item.collector_name || 'Maria Coletora'} se propôs a buscar este material.`
                                        : 'Este item foi anunciado por você e está visível para catadores.'}
                                </p>
                            </div>
                        </div>

                        {item.status === 'reserved' && (
                            <div style={{
                                marginTop: '8px',
                                padding: '12px',
                                background: 'white',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: '#eee',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    overflow: 'hidden'
                                }}>
                                    {item.collector_avatar ? <img src={item.collector_avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>{item.collector_name || 'Catador'}</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Telefone: {item.collector_phone || 'Não informado'}</span>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            const chatRes = await api.getOrCreateChat(item.producer_id, item.collector_id);
                                            if (chatRes.success) {
                                                onClose();
                                                onNavigate('chat', {
                                                    chatId: chatRes.chat.id,
                                                    producerId: item.producer_id,
                                                    collectorId: item.collector_id,
                                                    partnerName: item.collector_name || 'Catador'
                                                });
                                            }
                                        } catch (error) {
                                            console.error("Erro ao iniciar chat:", error);
                                            alert("Não foi possível iniciar o chat.");
                                        }
                                    }}
                                    style={{
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        fontWeight: '700',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px var(--primary-glow)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    Conversar
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Services List - Hide if owner */}
                {!isOwner && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                        {['Retira Entulho', 'Poda de Árvore', 'Móveis Velhos', 'Recicláveis'].map(service => (
                            <span key={service} style={{
                                border: '1px solid var(--primary-color)',
                                color: 'var(--primary-color)',
                                padding: '6px 12px',
                                borderRadius: '16px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}>
                                ✓ {service}
                            </span>
                        ))}
                    </div>
                )}

                {/* Contact Buttons - Hide if owner */}
                {!isOwner && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                        <button 
                            onClick={async () => {
                                try {
                                    const chatRes = await api.getOrCreateChat(item.producer_id, currentUserId);
                                    if (chatRes.success) {
                                        onClose();
                                        onNavigate('chat', {
                                            chatId: chatRes.chat.id,
                                            producerId: item.producer_id,
                                            collectorId: currentUserId,
                                            partnerName: item.producer_name || 'Doador'
                                        });
                                    }
                                } catch (error) {
                                    console.error("Erro ao iniciar chat:", error);
                                    alert("Não foi possível iniciar o chat.");
                                }
                            }}
                            style={{
                                flex: 1,
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                padding: '14px',
                                borderRadius: '16px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}>
                            <span>💬</span> Mensagem
                        </button>
                        <button style={{
                            flex: 1,
                            background: 'var(--secondary-color)',
                            color: 'white',
                            border: 'none',
                            padding: '14px',
                            borderRadius: '16px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}>
                            <span>📞</span> Ligar
                        </button>
                    </div>
                )}

                {!isOwner && <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', marginBottom: '24px' }} />}

                {/* Item Details */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Material Disponível</h3>

                    <div style={{
                        background: 'var(--bg-color)',
                        padding: '16px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '16px',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            {item.type === 'paper' && '📦'}
                            {item.type === 'plastic' && '🥤'}
                            {item.type === 'glass' && '🍾'}
                            {item.type === 'metal' && '🥫'}
                            {item.type === 'electronic' && '🔌'}
                            {item.type === 'other' && '📍'}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{item.title}</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.distance} • {item.location}</p>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                {isOwner ? (
                    // OWNER ACTIONS
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={() => {
                                if (window.confirm('Tem certeza que deseja excluir este anúncio?')) {
                                    onDelete(item.id);
                                    onClose();
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '18px',
                                fontSize: '1.1rem',
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
                            }}
                        >
                            Excluir Anúncio
                        </button>
                    </div>
                ) : userRole === 'collector' ? (
                    // COLLECTOR ACTIONS
                    item.status === 'reserved' && item.collector_id === currentUserId ? (
                        // Reserved by THIS collector -> Show Confirmation
                        <div style={{
                            background: '#e8f5e9',
                            padding: '16px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            border: '1px solid #a5d6a7'
                        }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#2e7d32', fontSize: '1.1rem' }}>Lixo já coletado?</h4>
                            <p style={{ fontSize: '0.9rem', color: '#1b5e20', marginBottom: '16px' }}>Confirme apenas se você já pegou o material.</p>
                            <button
                                onClick={() => {
                                    onAccept(item.id, 'collected');
                                    onClose();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    fontSize: '1rem',
                                    background: '#2ecc71',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)'
                                }}
                            >
                                ✅ Sim, Confirmar Coleta
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const chatRes = await api.getOrCreateChat(item.producer_id, currentUserId);
                                        if (chatRes.success) {
                                            onClose();
                                            onNavigate('chat', {
                                                chatId: chatRes.chat.id,
                                                producerId: item.producer_id,
                                                collectorId: currentUserId,
                                                partnerName: item.producer_name || 'Doador'
                                            });
                                        }
                                    } catch (error) {
                                        console.error("Erro ao iniciar chat:", error);
                                        alert("Não foi possível iniciar o chat.");
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    marginTop: '8px',
                                    fontSize: '1.05rem',
                                    background: 'white',
                                    color: 'var(--primary-color)',
                                    border: '1.5px solid var(--primary-color)',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Falar com o Doador
                            </button>
                        </div>
                    ) : item.status === 'reserved' ? (
                        // Reserved by SOMEONE ELSE
                        <button
                            disabled
                            style={{
                                width: '100%',
                                padding: '18px',
                                fontSize: '1.1rem',
                                background: '#bdc3c7',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontWeight: '700',
                                cursor: 'not-allowed'
                            }}
                        >
                            ⚠️ Reservado por outro catador
                        </button>
                    ) : (
                        // Available -> Schedule Collection
                        showScheduleInput ? (
                            <div style={{ marginTop: '16px', background: '#f8f9fa', padding: '16px', borderRadius: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '16px', fontWeight: '700', color: '#2c3e50', textAlign: 'center' }}>Em quanto tempo você chega?</label>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: scheduleTime === 'custom' ? '12px' : '20px' }}>
                                    {[
                                        { label: 'Em 15 min', val: 'Em ~15 min', icon: '⚡' },
                                        { label: 'Em 30 min', val: 'Em ~30 min', icon: '🚗' },
                                        { label: 'Em 1 hora', val: 'Em ~1 hora', icon: '⏳' },
                                        { label: 'Personalizado', val: 'custom', icon: '⏱️' },
                                    ].map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => setScheduleTime(opt.val)}
                                            style={{
                                                padding: '12px 8px',
                                                background: scheduleTime === opt.val ? 'var(--primary-color)' : 'white',
                                                color: scheduleTime === opt.val ? 'white' : 'var(--text-primary)',
                                                border: `2px solid ${scheduleTime === opt.val ? 'var(--primary-color)' : '#e0e0e0'}`,
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s',
                                                boxShadow: scheduleTime === opt.val ? '0 4px 12px var(--primary-glow)' : 'none'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {scheduleTime === 'custom' && (
                                    <div style={{ marginBottom: '20px', animation: 'fadeIn 0.2s ease-out' }}>
                                        <input
                                            type="text"
                                            placeholder="Ex: Chego às 15:30"
                                            value={customTime}
                                            onChange={(e) => setCustomTime(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '14px',
                                                borderRadius: '12px',
                                                border: '2px solid var(--primary-color)',
                                                outline: 'none',
                                                fontSize: '0.95rem',
                                                fontWeight: '500'
                                            }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => setShowScheduleInput(false)}
                                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#e0e0e0', fontWeight: '700', color: '#4b6076', cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            const finalTime = scheduleTime === 'custom' ? customTime.trim() : scheduleTime;
                                            if (!finalTime) return alert('Escolha ou digite um tempo estimado!');
                                            onAccept(item.id, 'reserved', finalTime);
                                            onClose();
                                        }}
                                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--primary-color)', fontWeight: '700', color: 'white', cursor: 'pointer', opacity: (scheduleTime && scheduleTime !== 'custom') || (scheduleTime === 'custom' && customTime.trim()) ? 1 : 0.5 }}
                                        disabled={!scheduleTime || (scheduleTime === 'custom' && !customTime.trim())}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowScheduleInput(true)}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '18px',
                                    fontSize: '1.1rem',
                                    background: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px var(--primary-glow)'
                                }}
                            >
                                Agendar Coleta
                            </button>
                        )
                    )
                ) : (
                    // PRODUCER VIEWER (Not Owner)
                    <div style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem'
                    }}>
                        Apenas catadores podem agendar coletas.
                    </div>
                )}

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '16px',
                        marginTop: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Fechar
                </button>
            </div>

            {/* Garden Modal Overlay */}
            {showGarden && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '480px',
                        maxHeight: '85vh',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '28px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #e6f9f1 0%, #d1fae5 100%)'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#047857' }}>
                                    Eco-Jardim de {item.producer_name || 'Doador'}
                                </h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#059669' }}>Conquistas ecológicas</p>
                            </div>
                            <button
                                onClick={() => setShowGarden(false)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'rgba(0,0,0,0.08)',
                                    color: '#333',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        {/* Garden content */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <Garden
                                user={{ id: item.producer_id, role: 'producer' }}
                                viewOnly={true}
                                userId={item.producer_id}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default ItemDetailSheet;
