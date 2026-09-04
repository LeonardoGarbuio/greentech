import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const STATUS_ORDER = ['available', 'reserved', 'collected', 'homologated', 'recycled'];
const COMPLETED_STATUSES = new Set(['collected', 'homologated', 'recycled']);

const MATERIALS = {
    plastic: { label: 'Plástico', color: '#0ea5e9' },
    aluminum: { label: 'Metal', color: '#64748b' },
    paper: { label: 'Papel', color: '#f59e0b' },
    glass: { label: 'Vidro', color: '#8b5cf6' }
};

const formatNumber = (value, digits = 1) => Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
});

const ImpactCenter = ({ user, onBack }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMethod, setShowMethod] = useState(false);
    const [shareLabel, setShareLabel] = useState('Compartilhar impacto');

    useEffect(() => {
        let active = true;

        api.getHistory(user.id, user.role)
            .then((data) => {
                if (active) setHistory(Array.isArray(data) ? data : []);
            })
            .catch((error) => console.error('Erro ao carregar impacto:', error))
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [user.id, user.role]);

    const impact = useMemo(() => {
        const completed = history.filter((item) => COMPLETED_STATUSES.has(item.status));
        const recoveredKg = completed.reduce(
            (total, item) => total + Number(item.homologated_weight_kg || item.weight_kg || 0),
            0
        );
        const byMaterial = completed.reduce((totals, item) => {
            const verifiedType = item.homologated_type || item.type;
            const type = MATERIALS[verifiedType] ? verifiedType : 'other';
            totals[type] = (totals[type] || 0) + Number(item.homologated_weight_kg || item.weight_kg || 0);
            return totals;
        }, {});

        const stages = STATUS_ORDER.map((status) => ({
            status,
            count: history.filter((item) => item.status === status).length
        }));

        return {
            recoveredKg,
            completedCount: completed.length,
            verifiedCount: history.filter((item) => ['homologated', 'recycled'].includes(item.status)).length,
            estimatedIncome: recoveredKg * 0.5,
            completionRate: history.length ? Math.round((completed.length / history.length) * 100) : 0,
            byMaterial,
            stages
        };
    }, [history]);

    const shareImpact = async () => {
        const text = `Meu impacto no GreenTech: ${formatNumber(impact.recoveredKg)} kg encaminhados à reciclagem em ${impact.completedCount} coleta(s). Economia circular que gera renda e cuida da cidade.`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Meu impacto GreenTech', text });
            } else {
                await navigator.clipboard.writeText(text);
                setShareLabel('Resumo copiado!');
                window.setTimeout(() => setShareLabel('Compartilhar impacto'), 2200);
            }
        } catch (error) {
            if (error?.name !== 'AbortError') console.error('Erro ao compartilhar impacto:', error);
        }
    };

    const maxMaterialWeight = Math.max(1, ...Object.values(impact.byMaterial));

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '120px', background: '#f4f7f5', fontFamily: "'Outfit', sans-serif" }}>
            <header style={{ padding: '20px 22px 28px', color: 'white', background: 'linear-gradient(145deg, #064e3b 0%, #059669 100%)', borderRadius: '0 0 28px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={onBack} aria-label="Voltar" style={iconButtonStyle}>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <span style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(255,255,255,.15)', fontSize: '.72rem', fontWeight: 800, letterSpacing: '.08em' }}>DADOS DO APP</span>
                </div>
                <p style={{ margin: '24px 0 4px', opacity: .78, fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Central de Impacto</p>
                <h1 style={{ margin: 0, maxWidth: '330px', fontSize: '1.85rem', lineHeight: 1.12 }}>Cada coleta conta uma história de transformação.</h1>
                <p style={{ margin: '12px 0 0', maxWidth: '380px', opacity: .86, fontSize: '.9rem', lineHeight: 1.5 }}>Indicadores calculados a partir da sua jornada registrada no GreenTech.</p>
            </header>

            <main style={{ padding: '0 20px' }}>
                <section style={{ ...cardStyle, marginTop: '-14px', position: 'relative' }} aria-live="polite">
                    {loading ? (
                        <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>Calculando seu impacto...</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
                                <div>
                                    <span style={eyebrowStyle}>MATERIAL RECUPERADO</span>
                                    <strong style={{ display: 'block', marginTop: '4px', color: '#064e3b', fontSize: '2.35rem', lineHeight: 1 }}>{formatNumber(impact.recoveredKg)} <small style={{ fontSize: '1rem' }}>kg</small></strong>
                                </div>
                                <div style={{ width: '54px', height: '54px', display: 'grid', placeItems: 'center', color: '#047857', background: '#d1fae5', borderRadius: '18px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>compost</span>
                                </div>
                            </div>
                            <div style={{ height: '7px', marginTop: '18px', overflow: 'hidden', background: '#e2e8f0', borderRadius: '999px' }}>
                                <div style={{ width: `${impact.completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #84cc16)', borderRadius: 'inherit' }} />
                            </div>
                            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '.76rem' }}>{impact.completionRate}% dos anúncios já chegaram à etapa de coleta.</p>
                        </>
                    )}
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                    <MetricCard icon="local_shipping" value={impact.completedCount} label="coletas concluídas" />
                    <MetricCard icon="verified" value={impact.verifiedCount} label="lotes homologados" />
                    <MetricCard icon="payments" value={`R$ ${formatNumber(impact.estimatedIncome, 2)}`} label="renda viabilizada*" />
                    <MetricCard icon="diversity_3" value={history.length} label="ações circulares" />
                </section>

                <section style={{ ...cardStyle, marginTop: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <div>
                            <span style={eyebrowStyle}>COMPOSIÇÃO</span>
                            <h2 style={sectionTitleStyle}>Materiais recuperados</h2>
                        </div>
                        <span className="material-symbols-outlined" style={{ color: '#059669' }}>donut_large</span>
                    </div>
                    {Object.keys(impact.byMaterial).length === 0 ? (
                        <p style={emptyStyle}>Conclua a primeira coleta para formar seu painel.</p>
                    ) : Object.entries(impact.byMaterial).sort((a, b) => b[1] - a[1]).map(([type, weight]) => {
                        const material = MATERIALS[type] || { label: 'Outros', color: '#94a3b8' };
                        return (
                            <div key={type} style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '.82rem' }}>
                                    <span style={{ color: '#334155', fontWeight: 700 }}>{material.label}</span>
                                    <span style={{ color: '#64748b' }}>{formatNumber(weight)} kg</span>
                                </div>
                                <div style={{ height: '8px', overflow: 'hidden', background: '#f1f5f9', borderRadius: '999px' }}>
                                    <div style={{ width: `${Math.max(5, (weight / maxMaterialWeight) * 100)}%`, height: '100%', background: material.color, borderRadius: 'inherit' }} />
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section style={{ ...cardStyle, marginTop: '14px' }}>
                    <span style={eyebrowStyle}>CADEIA CIRCULAR</span>
                    <h2 style={sectionTitleStyle}>Onde estão os materiais</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginTop: '20px' }}>
                        {impact.stages.map((stage, index) => (
                            <div key={stage.status} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                                {index < impact.stages.length - 1 && <div style={{ position: 'absolute', top: '15px', left: '58%', width: '84%', height: '2px', background: '#d1fae5' }} />}
                                <div style={{ width: '30px', height: '30px', margin: '0 auto', display: 'grid', placeItems: 'center', position: 'relative', borderRadius: '50%', color: stage.count ? 'white' : '#94a3b8', background: stage.count ? '#059669' : '#e2e8f0', fontSize: '.76rem', fontWeight: 800 }}>{stage.count}</div>
                                <span style={{ display: 'block', marginTop: '7px', color: '#64748b', fontSize: '.58rem', lineHeight: 1.15 }}>{['Anúncio', 'Reserva', 'Coleta', 'Triagem', 'Reciclagem'][index]}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                    <OdsCard number="8" title="Trabalho decente" text="Renda e visibilidade para catadores." color="#a21942" />
                    <OdsCard number="12" title="Consumo responsável" text="Resíduo retorna à cadeia produtiva." color="#bf8b2e" />
                </section>

                <button onClick={shareImpact} style={{ ...primaryButtonStyle, marginTop: '16px' }}>
                    <span className="material-symbols-outlined">ios_share</span>{shareLabel}
                </button>
                <button onClick={() => setShowMethod(!showMethod)} style={secondaryButtonStyle} aria-expanded={showMethod}>
                    <span className="material-symbols-outlined">science</span>Como calculamos
                </button>

                {showMethod && (
                    <div style={{ ...cardStyle, marginTop: '10px', borderColor: '#a7f3d0' }}>
                        <h3 style={{ margin: '0 0 8px', color: '#064e3b', fontSize: '.95rem' }}>Metodologia transparente</h3>
                        <p style={methodTextStyle}>O peso recuperado considera apenas itens com coleta concluída, homologada ou reciclada. Os demais permanecem no funil, sem inflar o resultado.</p>
                        <p style={methodTextStyle}>*A renda viabilizada usa o valor operacional do protótipo (R$ 0,50/kg). É uma estimativa, não renda comprovada nem crédito de carbono auditado.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

const MetricCard = ({ icon, value, label }) => (
    <div style={{ ...cardStyle, padding: '16px' }}>
        <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: '22px' }}>{icon}</span>
        <strong style={{ display: 'block', marginTop: '12px', color: '#0f172a', fontSize: '1.22rem' }}>{value}</strong>
        <span style={{ color: '#64748b', fontSize: '.7rem', lineHeight: 1.2 }}>{label}</span>
    </div>
);

const OdsCard = ({ number, title, text, color }) => (
    <div style={{ padding: '16px', color: 'white', background: color, borderRadius: '18px', minHeight: '142px' }}>
        <span style={{ fontSize: '.7rem', fontWeight: 800, letterSpacing: '.08em' }}>ODS {number}</span>
        <strong style={{ display: 'block', marginTop: '22px', fontSize: '1rem', lineHeight: 1.1 }}>{title}</strong>
        <p style={{ margin: '8px 0 0', fontSize: '.7rem', lineHeight: 1.35, opacity: .9 }}>{text}</p>
    </div>
);

const cardStyle = { padding: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 8px 24px rgba(15, 23, 42, .05)' };
const iconButtonStyle = { width: '40px', height: '40px', display: 'grid', placeItems: 'center', color: 'white', background: 'rgba(255,255,255,.14)', border: 0, borderRadius: '13px', cursor: 'pointer' };
const eyebrowStyle = { color: '#059669', fontSize: '.67rem', fontWeight: 800, letterSpacing: '.08em' };
const sectionTitleStyle = { margin: '4px 0 0', color: '#0f172a', fontSize: '1.08rem' };
const emptyStyle = { margin: 0, padding: '16px', color: '#64748b', background: '#f8fafc', borderRadius: '14px', textAlign: 'center', fontSize: '.82rem' };
const primaryButtonStyle = { width: '100%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'white', background: '#047857', border: 0, borderRadius: '16px', cursor: 'pointer', fontWeight: 800 };
const secondaryButtonStyle = { ...primaryButtonStyle, marginTop: '10px', color: '#047857', background: 'transparent', border: '1px solid #a7f3d0' };
const methodTextStyle = { margin: '7px 0', color: '#475569', fontSize: '.78rem', lineHeight: 1.5 };

export default ImpactCenter;
