import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import CertificateModal from './CertificateModal';

const MATERIALS = [
    { value: 'paper', label: 'Papel e papelão' },
    { value: 'plastic', label: 'Plástico' },
    { value: 'glass', label: 'Vidro' },
    { value: 'metal', label: 'Metal' },
    { value: 'electronic', label: 'Eletrônicos' },
    { value: 'other', label: 'Outros' }
];

const materialLabel = (type) => MATERIALS.find((material) => material.value === type)?.label || 'Outros';
const formatWeight = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

const CooperativeHome = ({ user, onNavigate, historyOnly = false }) => {
    const [lots, setLots] = useState([]);
    const [stats, setStats] = useState({ pending_count: 0, homologated_count: 0, total_received_kg: 0 });
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLot, setSelectedLot] = useState(null);
    const [certificateItemId, setCertificateItemId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successReceipt, setSuccessReceipt] = useState('');

    const loadLots = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [data, organizationData] = await Promise.all([
                api.getCooperativeLots(),
                api.getUserStats(user.id, user.role)
            ]);
            setLots(Array.isArray(data.lots) ? data.lots : []);
            setStats(data.stats || {});
            setOrganization(organizationData);
        } catch (loadError) {
            console.error('Erro ao carregar lotes:', loadError);
            setError('Não foi possível carregar os lotes agora.');
        } finally {
            setLoading(false);
        }
    }, [user.id, user.role]);

    useEffect(() => {
        loadLots();
    }, [loadLots]);

    const pendingLots = useMemo(() => lots.filter((lot) => lot.status === 'collected'), [lots]);
    const homologatedLots = useMemo(() => lots.filter((lot) => lot.status !== 'collected'), [lots]);

    const handleHomologate = async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSubmitting(true);
        setError('');
        try {
            const result = await api.coopHomologateItem(selectedLot.id, {
                weightKg: form.get('weightKg'),
                materialType: form.get('materialType'),
                destination: form.get('destination')
            });
            setSelectedLot(null);
            setSuccessReceipt(result.receiptNumber);
            await loadLots();
        } catch (submitError) {
            console.error('Erro ao homologar lote:', submitError);
            setError('Não foi possível homologar. Confira os dados e tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const displayedLots = historyOnly ? homologatedLots : pendingLots;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '110px', background: 'var(--bg-color)', fontFamily: "'Outfit', sans-serif" }}>
            <header style={{ padding: '24px', background: 'white', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 800 }}>GreenTech</h1>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '.88rem' }}>Painel da Cooperativa</p>
                </div>
                <button onClick={() => onNavigate('profile')} aria-label="Abrir perfil" style={{ width: '42px', height: '42px', display: 'grid', placeItems: 'center', color: 'var(--primary-color)', background: 'var(--primary-light)', border: 0, borderRadius: '50%', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined">factory</span>
                </button>
            </header>

            {!historyOnly && (
                <>
                    <section style={{ padding: '22px 24px 0' }}>
                        <span style={{ color: '#64748b', fontSize: '.72rem', fontWeight: 800, letterSpacing: '.08em' }}>UNIDADE OPERACIONAL</span>
                        <h2 style={{ margin: '5px 0 0', color: '#0f172a', fontSize: '1.15rem' }}>{organization?.name || 'Cooperativa cadastrada'}</h2>
                        {organization?.address && <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.76rem' }}>{organization.address}</p>}
                    </section>

                    <section style={{ padding: '18px 24px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Metric icon="inventory_2" value={stats.pending_count || 0} label="aguardando triagem" color="#d97706" background="#fffbeb" />
                        <Metric icon="verified" value={stats.homologated_count || 0} label="lotes homologados" color="#047857" background="#ecfdf5" />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Metric icon="scale" value={`${formatWeight(stats.total_received_kg)} kg`} label="peso aferido e registrado pela unidade" color="#0369a1" background="#eff6ff" />
                        </div>
                    </section>

                    <div style={{ margin: '0 24px 22px', padding: '13px 14px', display: 'flex', gap: '10px', color: '#075985', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '14px', fontSize: '.78rem', lineHeight: 1.45 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>shield</span>
                        <span><strong>Homologação responsável.</strong> O peso e a categoria informados pela unidade ficam registrados no Passaporte Circular.</span>
                    </div>
                </>
            )}

            <main style={{ padding: historyOnly ? '24px' : '0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                        <span style={{ color: '#64748b', fontSize: '.69rem', fontWeight: 800, letterSpacing: '.08em' }}>{historyOnly ? 'RASTREABILIDADE' : 'FILA DE RECEBIMENTO'}</span>
                        <h2 style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '1.08rem' }}>{historyOnly ? 'Lotes homologados' : 'Materiais para conferir'}</h2>
                    </div>
                    <button onClick={loadLots} aria-label="Atualizar lotes" style={{ width: '38px', height: '38px', display: 'grid', placeItems: 'center', color: '#047857', background: '#ecfdf5', border: 0, borderRadius: '12px', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
                    </button>
                </div>

                {successReceipt && !historyOnly && (
                    <div style={{ marginBottom: '14px', padding: '13px 14px', color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '13px', fontSize: '.8rem' }}>
                        <strong>Lote homologado.</strong> Comprovante {successReceipt} registrado no Passaporte Circular.
                    </div>
                )}

                {error && <p style={{ padding: '14px', color: '#b91c1c', background: '#fef2f2', borderRadius: '13px', fontSize: '.82rem' }}>{error}</p>}
                {loading ? (
                    <p style={emptyStyle}>Carregando lotes...</p>
                ) : displayedLots.length === 0 ? (
                    <div style={emptyStyle}>
                        <span className="material-symbols-outlined" style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '30px' }}>{historyOnly ? 'history' : 'inbox'}</span>
                        {historyOnly ? 'Nenhum lote homologado por esta unidade.' : 'Nenhum material coletado está aguardando recebimento.'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {displayedLots.map((lot) => (
                            <LotCard
                                key={lot.id}
                                lot={lot}
                                historyOnly={historyOnly}
                                onHomologate={() => { setSuccessReceipt(''); setSelectedLot(lot); }}
                                onCertificate={() => setCertificateItemId(lot.id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {selectedLot && (
                <div onClick={() => !submitting && setSelectedLot(null)} style={{ position: 'fixed', inset: 0, zIndex: 2100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '18px', background: 'rgba(15,23,42,.48)' }}>
                    <form onSubmit={handleHomologate} onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '440px', padding: '22px', background: 'white', borderRadius: '24px', boxShadow: '0 24px 60px rgba(15,23,42,.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
                            <div>
                                <span style={{ color: '#059669', fontSize: '.68rem', fontWeight: 800, letterSpacing: '.08em' }}>CONFERÊNCIA DO LOTE #{selectedLot.id}</span>
                                <h2 style={{ margin: '4px 0 0', fontSize: '1.15rem', color: '#0f172a' }}>{selectedLot.title}</h2>
                            </div>
                            <button type="button" onClick={() => setSelectedLot(null)} aria-label="Fechar" style={closeButtonStyle}>×</button>
                        </div>

                        <label style={labelStyle}>Peso aferido na balança (kg)</label>
                        <input name="weightKg" type="number" min="0.01" step="0.01" required defaultValue={selectedLot.weight_kg || ''} style={inputStyle} />

                        <label style={labelStyle}>Categoria confirmada</label>
                        <select name="materialType" required defaultValue={selectedLot.type || 'other'} style={inputStyle}>
                            {MATERIALS.map((material) => <option key={material.value} value={material.value}>{material.label}</option>)}
                        </select>

                        <label style={labelStyle}>Destino previsto</label>
                        <input name="destination" required placeholder="Ex.: indústria recicladora parceira" style={inputStyle} />

                        <p style={{ margin: '14px 0', color: '#64748b', fontSize: '.75rem', lineHeight: 1.45 }}>Ao confirmar, o sistema cria um comprovante e acrescenta um elo verificável à cadeia de custódia.</p>
                        <button type="submit" disabled={submitting} style={{ width: '100%', padding: '15px', color: 'white', background: '#047857', border: 0, borderRadius: '14px', cursor: submitting ? 'wait' : 'pointer', fontWeight: 800 }}>
                            {submitting ? 'Registrando...' : 'Homologar recebimento'}
                        </button>
                    </form>
                </div>
            )}

            {certificateItemId && <CertificateModal itemId={certificateItemId} onClose={() => setCertificateItemId(null)} />}
        </div>
    );
};

const Metric = ({ icon, value, label, color, background }) => (
    <div style={{ height: '100%', padding: '17px', background: 'white', border: '1px solid var(--surface-border)', borderRadius: '16px', boxSizing: 'border-box' }}>
        <span className="material-symbols-outlined" style={{ padding: '7px', color, background, borderRadius: '9px', fontSize: '20px' }}>{icon}</span>
        <strong style={{ display: 'block', marginTop: '11px', color: '#0f172a', fontSize: '1.35rem' }}>{value}</strong>
        <span style={{ color: '#64748b', fontSize: '.72rem', lineHeight: 1.25 }}>{label}</span>
    </div>
);

const LotCard = ({ lot, historyOnly, onHomologate, onCertificate }) => (
    <article style={{ padding: '17px', background: 'white', border: '1px solid var(--surface-border)', borderRadius: '17px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
            <div>
                <span style={{ color: historyOnly ? '#047857' : '#d97706', fontSize: '.65rem', fontWeight: 800, letterSpacing: '.07em' }}>{historyOnly ? 'HOMOLOGADO' : 'AGUARDANDO TRIAGEM'}</span>
                <h3 style={{ margin: '4px 0', color: '#1e293b', fontSize: '.98rem' }}>{lot.title}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '.76rem' }}>{lot.collector_name ? `Entregue por ${lot.collector_name}` : 'Coleta registrada no aplicativo'}</p>
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '1rem' }}>{formatWeight(lot.homologated_weight_kg || lot.weight_kg)} kg</strong>
                <span style={{ color: '#64748b', fontSize: '.7rem' }}>{materialLabel(lot.homologated_type || lot.type)}</span>
            </div>
        </div>
        {historyOnly && lot.final_destination && <p style={{ margin: '12px 0 0', padding: '9px 10px', color: '#475569', background: '#f8fafc', borderRadius: '10px', fontSize: '.72rem' }}><strong>Destino:</strong> {lot.final_destination}</p>}
        <button onClick={historyOnly ? onCertificate : onHomologate} style={{ width: '100%', marginTop: '14px', padding: '11px', color: historyOnly ? '#047857' : 'white', background: historyOnly ? '#ecfdf5' : '#047857', border: historyOnly ? '1px solid #a7f3d0' : 0, borderRadius: '11px', cursor: 'pointer', fontWeight: 800, fontSize: '.8rem' }}>
            {historyOnly ? 'Ver comprovante verificável' : 'Conferir e homologar'}
        </button>
    </article>
);

const emptyStyle = { margin: 0, padding: '30px 20px', color: '#64748b', background: 'white', border: '1px solid var(--surface-border)', borderRadius: '17px', textAlign: 'center', fontSize: '.82rem' };
const labelStyle = { display: 'block', margin: '13px 0 7px', color: '#334155', fontSize: '.78rem', fontWeight: 800 };
const inputStyle = { width: '100%', padding: '13px', color: '#0f172a', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', boxSizing: 'border-box', font: 'inherit' };
const closeButtonStyle = { width: '34px', height: '34px', color: '#64748b', background: '#f1f5f9', border: 0, borderRadius: '10px', cursor: 'pointer', fontSize: '22px' };

export default CooperativeHome;
