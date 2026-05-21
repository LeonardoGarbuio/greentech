import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CertificateModal from './CertificateModal';

const B2BDashboard = ({ onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_recycled_kg: 12450,
        co2_saved_tons: 4.82,
        total_credits_bought_kg: 8200,
        credits_history: [
            { id: 1, company_name: 'Coca-Cola S.A.', weight_kg: 3000, amount_paid: 1050.00, certificate_uuid: 'ESG-CC-2024-A7F3B', created_at: '2024-11-15T10:30:00Z' },
            { id: 2, company_name: 'Ambev Brasil Ltda.', weight_kg: 2500, amount_paid: 875.00, certificate_uuid: 'ESG-AB-2024-C9D1E', created_at: '2024-12-02T14:20:00Z' },
            { id: 3, company_name: 'Unilever Brasil S.A.', weight_kg: 2700, amount_paid: 945.00, certificate_uuid: 'ESG-UL-2025-F2A8C', created_at: '2025-01-20T09:15:00Z' }
        ]
    });
    const [companyName, setCompanyName] = useState('Coca-Cola Brasil S.A.');
    const [weightKg, setWeightKg] = useState(1500);
    const [buying, setBuying] = useState(false);
    const [message, setMessage] = useState('');
    const [recentItems, setRecentItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);

    // Load stats and recent items for simulation
    const loadB2BData = async () => {
        try {
            setLoading(true);
            const data = await api.getB2BStats();
            setStats(data);
            
            // Fetch all items to simulate coop weigh-ins and industry recycling
            const items = await api.getItems();
            setRecentItems(items.slice(0, 15)); // show latest 15 items
            
            setLoading(false);
        } catch (err) {
            console.error("Error loading B2B Dashboard:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadB2BData();
    }, []);

    const handleBuyCredits = async (e) => {
        e.preventDefault();
        if (!companyName || weightKg <= 0) return;

        try {
            setBuying(true);
            const result = await api.buyRecyclingCredits(companyName, weightKg);
            if (result.success) {
                setMessage(`🎉 Sucesso! R$ ${(weightKg * 0.35).toFixed(2)} em créditos ESG emitidos para ${companyName}.`);
                setWeightKg(1500);
                setTimeout(() => setMessage(''), 4000);
                await loadB2BData(); // refresh stats
            }
            setBuying(false);
        } catch (err) {
            console.error(err);
            setBuying(false);
            alert("Erro ao emitir créditos.");
        }
    };

    // Simulation helpers to fast-forward status in presentations
    const simulateCoopHomologate = async (itemId) => {
        try {
            const result = await api.coopHomologateItem(itemId, 15.8);
            if (result.success) {
                alert("⚖️ Cooperativa: Balança oficial integrada! Lote homologado com sucesso no ledger.");
                await loadB2BData();
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao homologar lote.");
        }
    };

    const simulateIndustryRecycle = async (itemId) => {
        try {
            const result = await api.industryRecycleItem(itemId, 101, "BATCH-COCA-2024-001");
            if (result.success) {
                alert("🏭 Indústria: Lote reciclado e compensado! Crédito de Logística Reversa gerado e imutabilizado.");
                await loadB2BData();
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao reciclar lote.");
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', background: '#f8fafc', color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Conectando com o Ledger Enterprise de Logística Reversa...</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
            
            {/* Header */}
            <div style={{
                padding: '24px',
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                <div>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#10b981', fontWeight: 800 }}>Greentech Enterprise</span>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b', fontWeight: 800 }}>Portal ESG & Logística Reversa 🏢</h1>
                </div>
                <button
                    onClick={() => onNavigate('home')}
                    style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1.5px solid #10b981',
                        borderRadius: '10px',
                        color: '#10b981',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontFamily: "'Outfit', sans-serif"
                    }}
                >
                    Voltar ao App
                </button>
            </div>

            {/* Notification */}
            {message && (
                <div style={{
                    margin: '20px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    borderRadius: '14px',
                    textAlign: 'center',
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)'
                }}>
                    {message}
                </div>
            )}

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

                {/* Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={cardStyle}>
                        <div style={cardAccentBar}></div>
                        <div style={cardInner}>
                            <span style={cardTitleStyle}>Volume Rastreável Ativo</span>
                            <div style={cardValueStyle}>
                                {stats.total_recycled_kg ? (stats.total_recycled_kg / 1000).toFixed(2) : '0.00'} <span style={{ fontSize: '1rem', color: '#10b981' }}>Tons</span>
                            </div>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>Garantido pelo Ledger Criptográfico</p>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <div style={cardAccentBar}></div>
                        <div style={cardInner}>
                            <span style={cardTitleStyle}>Pegada CO2 Reduzida</span>
                            <div style={cardValueStyle}>
                                {stats.co2_saved_tons ? stats.co2_saved_tons.toFixed(2) : '0.00'} <span style={{ fontSize: '1rem', color: '#10b981' }}>Tons</span>
                            </div>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>Cálculo baseado em logística circular</p>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <div style={cardAccentBar}></div>
                        <div style={cardInner}>
                            <span style={cardTitleStyle}>Créditos ESG Compensados</span>
                            <div style={cardValueStyle}>
                                {stats.total_credits_bought_kg ? (stats.total_credits_bought_kg / 1000).toFixed(2) : '0.00'} <span style={{ fontSize: '1rem', color: '#10b981' }}>Tons</span>
                            </div>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>Investido por grandes marcas</p>
                        </div>
                    </div>
                </div>

                {/* Form Buy Credits & General Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {/* Buy Credits Form */}
                    <div style={formCardStyle}>
                        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#059669', fontWeight: 800 }}>Adquirir Créditos de Reciclagem B2B</h2>
                        <p style={{ margin: '0 0 20px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                            Grandes empresas patrocinam a coleta e faturam créditos ESG certificados sob a lei da PNRS para fins fiscais e jurídicos.
                        </p>
                        
                        <form onSubmit={handleBuyCredits}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={formLabelStyle}>Razão Social / Marca</label>
                                <select 
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    style={formInputStyle}
                                >
                                    <option value="Coca-Cola S.A.">Coca-Cola S.A.</option>
                                    <option value="Ambev Brasil Ltda.">Ambev Brasil Ltda.</option>
                                    <option value="Unilever Brasil S.A.">Unilever Brasil S.A.</option>
                                    <option value="P&G Higiene & Limpeza">P&G Higiene & Limpeza</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={formLabelStyle}>Volume de Compensação (KG)</label>
                                <input 
                                    type="number"
                                    value={weightKg}
                                    onChange={(e) => setWeightKg(parseInt(e.target.value))}
                                    style={formInputStyle}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Investimento Total:</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                                    R$ {(weightKg * 0.35).toFixed(2)}
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={buying}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
                                    fontFamily: "'Outfit', sans-serif"
                                }}
                            >
                                {buying ? 'Registrando Transação...' : 'Emitir Certificado ESG'}
                            </button>
                        </form>
                    </div>

                    {/* How it works */}
                    <div style={sectionCardStyle}>
                        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b', fontWeight: 800 }}>Rastreabilidade Total Ponta a Ponta</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={stepDescStyle}>
                                <div style={stepNumStyle}>1</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b' }}>Descarte Certificado</h4>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>Cidadão registra com foto e localização real.</p>
                                </div>
                            </div>
                            
                            <div style={stepDescStyle}>
                                <div style={stepNumStyle}>2</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b' }}>Coleta Verificada</h4>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>Catador autentica o recolhimento com carimbo GPS.</p>
                                </div>
                            </div>

                            <div style={stepDescStyle}>
                                <div style={stepNumStyle}>3</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b' }}>Pesagem Homologada</h4>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>Cooperativa confere peso e emite bilhete fiscal.</p>
                                </div>
                            </div>

                            <div style={stepDescStyle}>
                                <div style={stepNumStyle}>4</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b' }}>Reciclagem & Compensação B2B</h4>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>Indústria queima o lote gerando créditos ESG blindados.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulated Ledger Fast-Forward & Visualizer */}
                <div style={sectionCardStyle}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b', fontWeight: 800 }}>
                        Pesagem & Auditoria Criptográfica de Lotes (Simulador)
                    </h2>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.75rem', color: '#64748b' }}>
                        Utilize os botões de ação para simular o recebimento na cooperativa e reciclagem pela indústria nos lotes criados pelo app. Clique em "Auditar" para ver o certificado e hashes.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                                    <th style={{ padding: '12px' }}>ID Lote</th>
                                    <th style={{ padding: '12px' }}>Doador</th>
                                    <th style={{ padding: '12px' }}>Material</th>
                                    <th style={{ padding: '12px' }}>Peso Est.</th>
                                    <th style={{ padding: '12px' }}>Status Atual</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Passos de Demonstração</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Auditoria</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentItems.map((item, index) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                        <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b' }}>LOT-{item.id}</td>
                                        <td style={{ padding: '12px', color: '#334155' }}>{item.producer_name || 'João Doador'}</td>
                                        <td style={{ padding: '12px', color: '#334155' }}>
                                            {item.type === 'plastic' ? '🥤 Pet' :
                                             item.type === 'aluminum' ? '🥫 Alumínio' :
                                             item.type === 'paper' ? '📦 Papelão' : '🍾 Vidro'}
                                        </td>
                                        <td style={{ padding: '12px', color: '#334155' }}>{item.weight_kg ? `${item.weight_kg.toFixed(1)} kg` : 'N/A'}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                background: item.status === 'recycled' ? '#ecfdf5' :
                                                            item.status === 'homologated' ? '#eff6ff' :
                                                            item.status === 'collected' ? '#fffbeb' : '#f1f5f9',
                                                color: item.status === 'recycled' ? '#059669' :
                                                       item.status === 'homologated' ? '#2563eb' :
                                                       item.status === 'collected' ? '#d97706' : '#64748b',
                                                border: item.status === 'recycled' ? '1px solid #a7f3d0' :
                                                        item.status === 'homologated' ? '1px solid #bfdbfe' :
                                                        item.status === 'collected' ? '1px solid #fde68a' : '1px solid #e2e8f0'
                                            }}>
                                                {item.status === 'available' ? 'Pendente' :
                                                 item.status === 'reserved' ? 'Coleta Reservada' :
                                                 item.status === 'collected' ? 'Coletado' :
                                                 item.status === 'homologated' ? 'Homologado Cooperativa' : 'Reciclado Indústria'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            {item.status === 'collected' && (
                                                <button 
                                                    onClick={() => simulateCoopHomologate(item.id)}
                                                    style={simBtnStyle}
                                                >
                                                    ⚖️ Homologar Balança
                                                </button>
                                            )}
                                            {item.status === 'homologated' && (
                                                <button 
                                                    onClick={() => simulateIndustryRecycle(item.id)}
                                                    style={{ ...simBtnStyle, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                                                >
                                                    🏭 Reciclar Indústria
                                                </button>
                                            )}
                                            {item.status === 'recycled' && (
                                                <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.7rem' }}>✓ Logística Reversa Concluída</span>
                                            )}
                                            {(item.status === 'available' || item.status === 'reserved') && (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.7rem' }}>Aguardando coleta pelo catador</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => setSelectedItemId(item.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#f0fdf4',
                                                    border: '1px solid #a7f3d0',
                                                    borderRadius: '8px',
                                                    color: '#059669',
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                    fontFamily: "'Outfit', sans-serif"
                                                }}
                                            >
                                                Auditar 🛡️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Corporate ESG Credit Purchases list */}
                <div style={sectionCardStyle}>
                    <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b', fontWeight: 800 }}>Histórico de Compras de Créditos ESG (Grandes Empresas)</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                                    <th style={{ padding: '12px' }}>Razão Social</th>
                                    <th style={{ padding: '12px' }}>Volume Compensado</th>
                                    <th style={{ padding: '12px' }}>Investimento</th>
                                    <th style={{ padding: '12px' }}>UUID Certificado PNRS</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Data Transação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.credits_history && stats.credits_history.map((credit, index) => (
                                    <tr key={credit.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                        <td style={{ padding: '12px', fontWeight: 700, color: '#059669' }}>{credit.company_name}</td>
                                        <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b' }}>{credit.weight_kg.toLocaleString()} KG</td>
                                        <td style={{ padding: '12px', color: '#334155' }}>R$ {credit.amount_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>{credit.certificate_uuid}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>
                                            {new Date(credit.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Audit Traceability Certificate Modal popup */}
            {selectedItemId && (
                <CertificateModal 
                    itemId={selectedItemId}
                    onClose={() => setSelectedItemId(null)}
                />
            )}
        </div>
    );
};

// Internal styles — Light corporate theme

const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    padding: 0,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden'
};

const cardAccentBar = {
    width: '4px',
    flexShrink: 0,
    background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
    borderRadius: '4px 0 0 4px'
};

const cardInner = {
    padding: '24px',
    flex: 1
};

const sectionCardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
};

const formCardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
};

const cardTitleStyle = {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 800,
    letterSpacing: '1px',
    marginBottom: '8px'
};

const cardValueStyle = {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#1e293b'
};

const formLabelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    color: '#475569',
    fontWeight: 700,
    marginBottom: '8px',
    textTransform: 'uppercase'
};

const formInputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#1e293b',
    fontSize: '0.9rem',
    fontWeight: 600,
    boxSizing: 'border-box',
    fontFamily: "'Outfit', sans-serif",
    outline: 'none'
};

const stepDescStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '14px',
    border: '1px solid #f1f5f9'
};

const stepNumStyle = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#ecfdf5',
    border: '1.5px solid #10b981',
    color: '#059669',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '0.85rem',
    flexShrink: 0
};

const simBtnStyle = {
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
    fontFamily: "'Outfit', sans-serif"
};

export default B2BDashboard;
