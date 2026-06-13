import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const CertificateModal = ({ itemId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [traceData, setTraceData] = useState(null);
    const [corruptSimulated, setCorruptSimulated] = useState(false);

    useEffect(() => {
        if (!itemId) return;
        setLoading(true);
        api.getTraceabilityLedger(itemId)
            .then(data => {
                setTraceData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [itemId]);

    if (loading) {
        return (
            <div style={modalOverlayStyle}>
                <div style={modalContentStyle}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={spinnerStyle}></div>
                        <p style={{ marginTop: '20px', color: '#047857', fontWeight: 600 }}>Decodificando chaves do Ledger Criptográfico...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!traceData || !traceData.item) {
        return (
            <div style={modalOverlayStyle}>
                <div style={modalContentStyle}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p style={{ color: '#ef4444' }}>Erro ao carregar dados de rastreabilidade do lote.</p>
                        <button onClick={onClose} style={closeBtnStyle}>Fechar</button>
                    </div>
                </div>
            </div>
        );
    }

    const { item, audit } = traceData;
    
    // Simulate direct DB hack to show anti-fraud verification
    const isChainValid = corruptSimulated ? false : audit.isValid;
    const fraudMessage = corruptSimulated 
        ? "⚠️ CRITICAL FRAUD ALERT: Alteração de dados detectada retroativamente no bloco COOP_RECEIPT! Hash recalculado difere do salvo. Lote bloqueado."
        : audit.reason;

    const renderStepIcon = (step) => {
        switch (step) {
            case 'DISCARD': return '🌰';
            case 'RESERVE': return '🤝';
            case 'COLLECTION': return '🚛';
            case 'COOP_RECEIPT': return '⚖️';
            case 'INDUSTRY_RECYCLE': return '🏭';
            default: return '📍';
        }
    };

    const getStepLabel = (step) => {
        switch (step) {
            case 'DISCARD': return 'Descarte Criado (Cidadão)';
            case 'RESERVE': return 'Coleta Reservada';
            case 'COLLECTION': return 'Coletado pelo Catador';
            case 'COOP_RECEIPT': return 'Recebido & Pesado (Cooperativa)';
            case 'INDUSTRY_RECYCLE': return 'Crédito de Logística Reversa (Indústria)';
            default: return step;
        }
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={{ ...modalContentStyle, maxWidth: '650px', width: '90%' }}>
                {/* Header Certificado */}
                <div style={{
                    padding: '24px',
                    background: isChainValid 
                        ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
                        : 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)',
                    color: 'white',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    position: 'relative'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                        Certificado Digital de Rastreabilidade 🛡️
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                        Chave do Ledger: {item.id ? `ITEM-LOT-${item.id}-2024` : ''}
                    </p>

                    <button onClick={onClose} style={headerCloseBtnStyle}>✕</button>
                </div>

                {/* Audit Integrity Status Banner */}
                <div style={{
                    padding: '16px 24px',
                    background: isChainValid ? '#d1fae5' : '#fee2e2',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.1rem' }}>{isChainValid ? '✓' : '🚨'}</span>
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                color: isChainValid ? '#065f46' : '#991b1b'
                            }}>
                                {isChainValid ? 'CADEIA 100% ÍNTEGRA & HOMOLOGADA' : 'CADEIA ADULTERADA / QUEBRA DE HASH'}
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: isChainValid ? '#047857' : '#b91c1c', lineHeight: 1.3 }}>
                            {fraudMessage}
                        </p>
                    </div>

                    {/* Demonstration Anti-Fraud Button */}
                    <button 
                        onClick={() => setCorruptSimulated(!corruptSimulated)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isChainValid ? '#047857' : '#991b1b',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        {isChainValid ? 'Simular Fraude' : 'Restaurar Ledger'}
                    </button>
                </div>

                {/* Modal scroll area */}
                <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
                    
                    {/* General info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <span style={labelTitleStyle}>Material Rastreável</span>
                            <span style={labelValueStyle}>
                                {item.type === 'plastic' ? '🥤 Plástico PET' :
                                 item.type === 'aluminum' ? '🥫 Alumínio' :
                                 item.type === 'paper' ? '📦 Papelão' : '🍾 Vidro'}
                            </span>
                        </div>
                        <div>
                            <span style={labelTitleStyle}>Peso Homologado</span>
                            <span style={labelValueStyle}>{item.weight_kg ? `${item.weight_kg.toFixed(2)} KG` : 'Aguardando balança'}</span>
                        </div>
                        <div>
                            <span style={labelTitleStyle}>Status Operacional</span>
                            <span style={{
                                ...labelValueStyle, 
                                color: item.status === 'recycled' ? '#10b981' : '#f59e0b',
                                fontWeight: 800
                            }}>
                                {item.status === 'available' ? 'Disponibilizado' :
                                 item.status === 'reserved' ? 'Coleta Reservada' :
                                 item.status === 'collected' ? 'Coletado' :
                                 item.status === 'homologated' ? 'Pesado na Cooperativa' : 'Reciclado (Crédito Gerado)'}
                            </span>
                        </div>
                    </div>

                    {/* Timeline title */}
                    <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '0.95rem', fontWeight: 800 }}>
                        Cadeia de Custódia Criptográfica (Timeline Auditável)
                    </h4>

                    {/* Timeline Elements */}
                    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '20px', borderLeft: '2px dashed #cbd5e1', marginLeft: '12px', gap: '20px' }}>
                        {audit.chain && audit.chain.map((block, idx) => {
                            const payload = JSON.parse(block.payload || '{}');
                            return (
                                <div key={block.id} style={{ position: 'relative' }}>
                                    
                                    {/* Circle Icon Badge */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '-33px',
                                        top: '0px',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: '#fff',
                                        border: `2px solid ${isChainValid ? '#10b981' : '#ef4444'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.9rem',
                                        zIndex: 2
                                    }}>
                                        {renderStepIcon(block.step)}
                                    </div>

                                    {/* Step card */}
                                    <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.01)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>
                                                {getStepLabel(block.step)}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                {new Date(block.timestamp).toLocaleString('pt-BR')}
                                            </span>
                                        </div>

                                        {/* Actor detail */}
                                        <p style={{ margin: '4px 0 8px 0', fontSize: '0.75rem', color: '#4b5563' }}>
                                            Responsável: <b>{block.actor_role === 'producer' ? `Cidadão (${item.producer_name || 'Doador'})` :
                                                             block.actor_role === 'collector' ? `Catador (${item.collector_name || 'Coletor'})` :
                                                             block.actor_role === 'cooperative' ? 'Cooperativa Balança' : 'Indústria Recicladora'}</b>
                                        </p>

                                        {/* Payload specific data */}
                                        <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', fontSize: '0.7rem', color: '#6b7280', fontFamily: 'monospace', overflowX: 'auto', marginBottom: '8px' }}>
                                            {block.step === 'DISCARD' && `📍 Localização: ${payload.address || 'Ponto cadastrado'} \n📦 Peso estimado: ${payload.weight_kg || '0'} kg`}
                                            {block.step === 'RESERVE' && `🚚 Status: Rota aceita e coleta reservada.`}
                                            {block.step === 'COLLECTION' && `🚛 Coleta realizada e assinada digitalmente.`}
                                            {block.step === 'COOP_RECEIPT' && `⚖️ Peso balança homologada: ${payload.balanza_weight_kg} kg \n🎫 Recibo fiscal: ${payload.receipt_number}`}
                                            {block.step === 'INDUSTRY_RECYCLE' && `🏭 Indústria destino: ${payload.industry_name} \n🔑 Lote Indústria: ${payload.recycling_batch}`}
                                        </div>

                                        {/* Cryptography Hash Details */}
                                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.6rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                                            <div>PREV_HASH: <span style={{ color: '#4b5563' }}>{block.previous_hash}</span></div>
                                            <div>CURR_HASH: <span style={{ color: isChainValid ? '#059669' : '#b91c1c', fontWeight: 600 }}>{block.current_hash}</span></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Certificado */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fff',
                    borderBottomLeftRadius: '24px',
                    borderBottomRightRadius: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Simulation QR Code */}
                        <div style={{
                            width: '45px',
                            height: '45px',
                            background: '#111',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#fff',
                            fontSize: '0.4rem',
                            fontWeight: 800,
                            padding: '4px',
                            textAlign: 'center',
                            lineHeight: 1.1,
                            borderRadius: '4px'
                        }}>
                            QR CODE AUDIT
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#6b7280', maxWidth: '120px', lineHeight: 1.2 }}>
                            Escaneie para validar a blockchain do lote no portal de logística reversa.
                        </span>
                    </div>

                    <button 
                        onClick={() => alert("Certificado gerado com sucesso! Arquivo PDF simulado e pronto para arquivamento.")}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: isChainValid ? '#047857' : '#9ca3af',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: isChainValid ? 'pointer' : 'default',
                            boxShadow: isChainValid ? '0 4px 10px rgba(4, 120, 87, 0.15)' : 'none'
                        }}
                        disabled={!isChainValid}
                    >
                        Exportar Certificado
                    </button>
                </div>
            </div>
        </div>
    );
};

// Internal styles (vanilla React styles to match wow aesthetics easily)
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    fontFamily: "'Inter', sans-serif"
};

const modalContentStyle = {
    backgroundColor: '#fff',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
};

const headerCloseBtnStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const closeBtnStyle = {
    padding: '8px 24px',
    borderRadius: '10px',
    background: '#047857',
    color: 'white',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer'
};

const labelTitleStyle = {
    display: 'block',
    fontSize: '0.65rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: '0.5px'
};

const labelValueStyle = {
    display: 'block',
    fontSize: '0.9rem',
    color: '#111827',
    fontWeight: 700,
    marginTop: '2px'
};

const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(16, 185, 129, 0.1)',
    borderTop: '4px solid #047857',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 1s linear infinite'
};

export default CertificateModal;
