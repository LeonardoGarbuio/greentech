import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CoinBadge from './CoinBadge';

/* ── Inline SVG icon helper ──────────────────────────────────────────── */
const getItemSVG = (itemId) => {
    const s = { width: 32, height: 32, fill: 'none', stroke: '#047857', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const svgProps = { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: 32, height: 32, fill: 'none', stroke: '#047857', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

    switch (itemId) {
        /* Drink cup / bottle – Coca-Cola coupon */
        case 'coca_10':
            return (
                <svg {...svgProps}>
                    <path d="M8 2h8l1 5v11a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V7l1-5z" />
                    <path d="M8 7h8" />
                    <path d="M9 2v2" />
                    <path d="M15 2v2" />
                    <path d="M10 12h4" />
                </svg>
            );

        /* Beer bottle – Ambev / Ze Delivery coupon */
        case 'ambev_15':
            return (
                <svg {...svgProps}>
                    <path d="M10 2h4v3l1.5 2v4.5c0 .5-.5 1-1 1h-5c-.5 0-1-.5-1-1V7L10 5V2z" />
                    <path d="M8.5 12.5v7a2.5 2.5 0 0 0 2.5 2.5h2a2.5 2.5 0 0 0 2.5-2.5v-7" />
                    <path d="M10 5h4" />
                    <path d="M9 16h6" />
                </svg>
            );

        /* Soap bar – Unilever eco-soap */
        case 'uni_soap':
            return (
                <svg {...svgProps}>
                    <rect x="3" y="10" width="18" height="10" rx="3" />
                    <path d="M7 10V8a2 2 0 0 1 2-2h0" />
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="15" cy="3" r="1.5" />
                    <circle cx="9" cy="3" r="1" />
                    <path d="M8 15h8" />
                </svg>
            );

        /* Bamboo stalks – garden decoration */
        case 'decor_bamboo':
            return (
                <svg {...svgProps}>
                    <path d="M7 22V4" />
                    <path d="M7 4c3-2 5 1 5 1" />
                    <path d="M7 8c3-2 5 1 5 1" />
                    <path d="M7 12h1" />
                    <path d="M7 16h1" />
                    <path d="M15 22V6" />
                    <path d="M15 6c3-2 5 1 5 1" />
                    <path d="M15 10c3-2 5 1 5 1" />
                    <path d="M15 14h1" />
                    <path d="M15 18h1" />
                </svg>
            );

        /* Flowering tree – Ipe Amarelo */
        case 'decor_tree':
            return (
                <svg {...svgProps}>
                    <path d="M12 22v-8" />
                    <path d="M12 14c-4 0-7-3-7-7a7 7 0 0 1 14 0c0 4-3 7-7 7z" />
                    <circle cx="10" cy="6" r="1" fill="#047857" stroke="none" />
                    <circle cx="14" cy="7" r="1" fill="#047857" stroke="none" />
                    <circle cx="12" cy="4" r="1" fill="#047857" stroke="none" />
                    <circle cx="9" cy="9" r="1" fill="#047857" stroke="none" />
                    <circle cx="15" cy="10" r="1" fill="#047857" stroke="none" />
                    <path d="M9 22h6" />
                </svg>
            );

        /* Solar panel */
        case 'decor_solar':
            return (
                <svg {...svgProps}>
                    <rect x="2" y="8" width="20" height="12" rx="1" />
                    <path d="M2 12h20" />
                    <path d="M2 16h20" />
                    <path d="M8 8v12" />
                    <path d="M14 8v12" />
                    <circle cx="18" cy="4" r="2" />
                    <path d="M18 1v1" />
                    <path d="M21 4h1" />
                    <path d="M20.1 1.9l-.7.7" />
                    <path d="M20.1 6.1l-.7-.7" />
                </svg>
            );

        /* Pond with waves */
        case 'decor_pond':
            return (
                <svg {...svgProps}>
                    <ellipse cx="12" cy="16" rx="10" ry="5" />
                    <path d="M5 13c1.5-1 3-.5 4.5 0s3 1 4.5 0 3-.5 4.5 0" />
                    <path d="M6 10c1.5-1 3-.5 4.5 0s3 1 4.5 0" />
                    <path d="M14 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#047857" stroke="none" />
                    <path d="M13 7v3" />
                    <path d="M11 8l2-1" />
                    <path d="M15 8l-2-1" />
                </svg>
            );

        /* Star badge – premium profile */
        case 'coll_star':
            return (
                <svg {...svgProps}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
            );

        /* Fork + knife – meal voucher */
        case 'coll_meal':
            return (
                <svg {...svgProps}>
                    <path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2" />
                    <path d="M5 2v20" />
                    <path d="M7 2v6" />
                    <path d="M3 2v6" />
                    <path d="M19 2c0 0 2 3 2 6s-2 4-2 4v10" />
                    <path d="M19 12V2" />
                </svg>
            );

        /* Glove / protective hand */
        case 'coll_gloves':
            return (
                <svg {...svgProps}>
                    <path d="M6 15V8a1 1 0 0 1 2 0v3" />
                    <path d="M8 11V6a1 1 0 0 1 2 0v5" />
                    <path d="M10 11V5a1 1 0 0 1 2 0v6" />
                    <path d="M12 11V7a1 1 0 0 1 2 0v4" />
                    <path d="M14 11l1.5-1.5a1 1 0 0 1 1.5 0v0a1 1 0 0 1 0 1.5L15 13" />
                    <path d="M6 15a6 6 0 0 0 6 6h1a5 5 0 0 0 5-5v-2" />
                </svg>
            );

        /* Ticket – raffle entry */
        case 'coll_ticket':
            return (
                <svg {...svgProps}>
                    <path d="M2 9a3 3 0 0 1 0 6v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a3 3 0 0 1 0-6V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v3z" />
                    <path d="M9 5v2" />
                    <path d="M9 11v2" />
                    <path d="M9 17v2" />
                </svg>
            );

        default:
            return (
                <svg {...svgProps}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4" />
                    <circle cx="12" cy="16" r="0.5" fill="#047857" />
                </svg>
            );
    }
};

/* Small inline accent SVGs used in text areas */
const LeafIcon = ({ size = 18 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}
        fill="none" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ verticalAlign: 'middle', marginLeft: 6 }}>
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66" />
        <path d="M2 2c0 0 8-1 13 5 5 6 3 13 3 13" />
    </svg>
);

const LightbulbIcon = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}
        fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ verticalAlign: 'middle', marginRight: 4 }}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
);

const ErrorIcon = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ verticalAlign: 'middle', marginRight: 4 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6" />
        <path d="M9 9l6 6" />
    </svg>
);

const SuccessIcon = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ verticalAlign: 'middle', marginRight: 4 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

/* ── Main component (logic unchanged) ────────────────────────────────── */
const EcoStore = ({ user: currentUser, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState(currentUser?.role === 'collector' ? 'collector' : 'citizen');
    const [coins, setCoins] = useState(currentUser?.points || 0);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');  // 'success' | 'error'
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [celebrationTrigger, setCelebrationTrigger] = useState(0);

    useEffect(() => {
        if (!currentUser) return;
        // Refresh coins from backend
        api.getUserStats(currentUser.id, currentUser.role).then(data => {
            const userCoins = currentUser.role === 'producer' ? (data.points || 0) : Math.round(data.earnings || 0);
            setCoins(userCoins);
        });

        // Load purchased items from localStorage for simplicity/persistence
        const saved = localStorage.getItem(`purchased_items_${currentUser.id}`);
        if (saved) {
            setPurchasedItems(JSON.parse(saved));
        }
    }, [currentUser]);

    const handlePurchase = (item) => {
        if (coins < item.cost) {
            setMessageType('error');
            setMessage(`GreenCoins insuficientes! Faltam ${item.cost - coins} GC.`);
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        const newCoins = coins - item.cost;
        setCoins(newCoins);
        setCelebrationTrigger(prev => prev + 1);

        // Save item
        const updatedPurchases = [...purchasedItems, item.id];
        setPurchasedItems(updatedPurchases);
        localStorage.setItem(`purchased_items_${currentUser.id}`, JSON.stringify(updatedPurchases));

        // If it's a garden decor item, save to garden items list
        if (item.type === 'garden') {
            const gardenDecor = JSON.parse(localStorage.getItem(`garden_decorations_${currentUser.id}`) || '[]');
            gardenDecor.push({ id: item.id, emoji: item.emoji, label: item.title });
            localStorage.setItem(`garden_decorations_${currentUser.id}`, JSON.stringify(gardenDecor));
        }

        // Notify backend of coin update
        if (currentUser.role === 'producer') {
            const updatedUser = { ...currentUser, points: newCoins };
            api.updateUser({
                id: currentUser.id,
                role: currentUser.role,
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone
            }).then(() => {
                if (onUpdateUser) onUpdateUser(updatedUser);
            });
        } else {
            const updatedUser = { ...currentUser, earnings: newCoins };
            api.updateUser({
                id: currentUser.id,
                role: currentUser.role,
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone
            }).then(() => {
                if (onUpdateUser) onUpdateUser(updatedUser);
            });
        }

        setMessageType('success');
        setMessage(`Sucesso! Voce resgatou "${item.title}".`);
        setTimeout(() => setMessage(''), 4000);
    };

    const citizenItems = [
        { id: 'coca_10', title: 'R$ 10 Coca-Cola Retornavel', description: 'Desconto exclusivo na compra de embalagens retornaveis Coca-Cola.', cost: 80, emoji: 'coca_10', sponsor: 'Coca-Cola', type: 'coupon' },
        { id: 'ambev_15', title: '15% Off Ze Delivery', description: 'Cupom de 15% de desconto para pedidos no app Ze Delivery.', cost: 120, emoji: 'ambev_15', sponsor: 'Ambev', type: 'coupon' },
        { id: 'uni_soap', title: 'Kit Sabao Ecologico Omo', description: 'Desconto de 40% no novo Omo Liquido Ecologico em parceiros.', cost: 60, emoji: 'uni_soap', sponsor: 'Unilever', type: 'coupon' },
        { id: 'decor_bamboo', title: 'Fonte de Arvore de Bambu', description: 'Item virtual para embelezar seu Jardim Ecologico no app.', cost: 50, emoji: 'decor_bamboo', type: 'garden' },
        { id: 'decor_tree', title: 'Ipe Amarelo Premium', description: 'Adicione o magnifico Ipe Amarelo no centro do seu jardim.', cost: 100, emoji: 'decor_tree', type: 'garden' },
        { id: 'decor_solar', title: 'Paineis Solares Virtuais', description: 'Gere energia limpa virtual e aumente o design do seu quintal.', cost: 150, emoji: 'decor_solar', type: 'garden' },
        { id: 'decor_pond', title: 'Lago de Carpas', description: 'Um belo lago de carpas cristalino para decorar seu Jardim.', cost: 200, emoji: 'decor_pond', type: 'garden' }
    ];

    const collectorItems = [
        { id: 'coll_star', title: 'Perfil Destaque (7 Dias)', description: 'Seu perfil no topo da lista e destacado no mapa dos doadores.', cost: 100, emoji: 'coll_star', type: 'premium' },
        { id: 'coll_meal', title: 'Vale Refeicao R$ 25', description: 'Cupom de alimentacao valido em redes de restaurantes parceiras.', cost: 150, emoji: 'coll_meal', type: 'coupon' },
        { id: 'coll_gloves', title: 'Luvas de Protecao Premium', description: 'Equipamento de protecao profissional antiderrapante reforcado.', cost: 80, emoji: 'coll_gloves', type: 'physical' },
        { id: 'coll_ticket', title: 'Bilhete Sorteio Triciclo Eletrico', description: 'Participe do sorteio mensal de um triciclo eletrico de carga.', cost: 50, emoji: 'coll_ticket', type: 'raffle' }
    ];

    const currentStoreItems = activeTab === 'citizen' ? citizenItems : collectorItems;

    return (
        <div style={{ paddingBottom: '100px', backgroundColor: '#f4fbf7', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{
                padding: '20px 24px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(15px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h1 style={{ margin: 0, color: '#047857', fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center' }}>
                        EcoStore <LeafIcon size={22} />
                    </h1>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#666' }}>Troque suas acoes ecologicas por premios</p>
                </div>
                
                {/* Wallet design */}
                <CoinBadge coins={coins} />
            </div>

            {/* Notification message */}
            {message && (
                <div style={{
                    margin: '15px 20px',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: messageType === 'error' ? '#fee2e2' : '#d1fae5',
                    color: messageType === 'error' ? '#ef4444' : '#065f46',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {messageType === 'error' ? <ErrorIcon /> : <SuccessIcon />}
                    {message}
                </div>
            )}

            {/* Tab Bar for Coletor/Cidadao */}
            <div style={{ display: 'flex', padding: '0 20px', margin: '20px 0 10px 0', gap: '10px' }}>
                <button
                    onClick={() => setActiveTab('citizen')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'citizen' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e6f4ed',
                        color: activeTab === 'citizen' ? '#fff' : '#047857',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: activeTab === 'citizen' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                    }}
                >
                    Loja do Cidadao
                </button>
                <button
                    onClick={() => setActiveTab('collector')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'collector' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e6f4ed',
                        color: activeTab === 'collector' ? '#fff' : '#047857',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: activeTab === 'collector' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                    }}
                >
                    Loja do Coletor
                </button>
            </div>

            {/* Sub-text */}
            <div style={{ padding: '0 24px', margin: '15px 0' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start' }}>
                    <LightbulbIcon />
                    <span>
                        {activeTab === 'citizen' 
                            ? 'Use suas GreenCoins ganhas ao reciclar para resgatar cupons de grandes marcas ou decorar o seu Jardim!'
                            : 'Use suas moedas (convertidas de seus ganhos) para impulsionar seu perfil de catador ou obter itens de trabalho!'}
                    </span>
                </p>
            </div>

            {/* Store Grid list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 20px' }}>
                {currentStoreItems.map(item => {
                    const isOwned = purchasedItems.includes(item.id);
                    return (
                        <div key={item.id} style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'center',
                            border: '1px solid rgba(16, 185, 129, 0.08)',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Sponsor Tag */}
                            {item.sponsor && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    padding: '4px 10px',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    borderBottomLeftRadius: '12px',
                                    color: 'white',
                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
                                }}>
                                    {item.sponsor}
                                </div>
                            )}

                            {/* SVG Icon Container */}
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '14px',
                                background: '#f0fdf4',
                                border: '1px solid #d1fae5',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexShrink: 0
                            }}>
                                {getItemSVG(item.id)}
                            </div>

                            {/* Item Content details */}
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#111827', fontWeight: 700 }}>
                                    {item.title}
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.3 }}>
                                    {item.description}
                                </p>

                                {/* Cost & Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                                    {/* Price tag */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#047857' }}>{item.cost}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#059669' }}>GC</span>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        onClick={() => handlePurchase(item)}
                                        disabled={isOwned && item.type !== 'raffle'}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: isOwned && item.type !== 'raffle' 
                                                ? '#e5e7eb' 
                                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: isOwned && item.type !== 'raffle' ? '#9ca3af' : '#fff',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            cursor: isOwned && item.type !== 'raffle' ? 'default' : 'pointer',
                                            boxShadow: isOwned && item.type !== 'raffle' ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.15)',
                                            transition: 'transform 0.1s'
                                        }}
                                    >
                                        {isOwned && item.type !== 'raffle' ? 'Resgatado' : 'Resgatar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default EcoStore;
