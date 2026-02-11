import React, { useEffect, useState } from 'react';

const ItemDetailSheet = ({ item, onClose, onAccept, onDelete, currentUserId, userRole }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [showScheduleInput, setShowScheduleInput] = useState(false);
    const [scheduleTime, setScheduleTime] = useState('');

    useEffect(() => {
        if (item) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
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
                    zIndex: 100,
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
                zIndex: 101,
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                {/* Drag Handle */}
                <div style={{
                    width: '40px',
                    height: '4px',
                    background: '#e0e0e0',
                    borderRadius: '2px',
                    margin: '0 auto 24px auto'
                }} />

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

                        <div>
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

                {/* Owner Message */}
                {isOwner && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        background: 'var(--primary-light)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>📢</span>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-color)' }}>Seu Anúncio</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Este item foi anunciado por você e está visível para catadores.</p>
                        </div>
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
                        <button style={{
                            flex: 1,
                            background: '#25D366',
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
                            <span>💬</span> WhatsApp
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
                            <div style={{ marginTop: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Quando você pode buscar?</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid #ddd',
                                        marginBottom: '12px'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setShowScheduleInput(false)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#eee' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!scheduleTime) return alert('Escolha um horário!');
                                            onAccept(item.id, 'reserved', scheduleTime);
                                            onClose();
                                        }}
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
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
        </>
    );
};

export default ItemDetailSheet;
