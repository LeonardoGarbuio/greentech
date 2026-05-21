import React, { useState, useEffect, useMemo } from 'react';
import MapComponent from './Map';
import ItemDetailSheet from './ItemDetailSheet';
import { api } from '../services/api';

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
};

const Dashboard = ({ items, onAccept, onDelete, onLogout, onNavigate, userRole, currentUserId }) => {
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');

    console.log("Dashboard Items Prop:", items);
    console.log("Dashboard UserRole:", userRole);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterDistance, setFilterDistance] = useState(50); // km
    const [filterWeight, setFilterWeight] = useState(0); // kg
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState(null);

    // Derive selected item from props to ensure it's always fresh
    const selectedItem = items.find(i => i.id === selectedItemId) || null;

    const [optimizedRoute, setOptimizedRoute] = useState(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [userCoords, setUserCoords] = useState(null);

    const categories = [
        { id: 'all', name: 'Todos', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> },
        { id: 'paper', name: 'Papel', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
        { id: 'plastic', name: 'Plástico', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"></path></svg> },
        { id: 'glass', name: 'Vidro', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v12a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V7a5 5 0 0 0-5-5z"></path></svg> },
        { id: 'metal', name: 'Metal', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg> },
        { id: 'electronic', name: 'Eletrônicos', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> },
    ];

    // Filter logic memoized to avoid re-renders
    const filteredItems = useMemo(() => {
        return items.filter(i => {
            // Category Filter
            if (activeCategory !== 'all' && i.type !== activeCategory) return false;

            // Weight Filter
            if (i.weight_kg < filterWeight) return false;

            return true;
        });
    }, [items, activeCategory, filterWeight]);

    // Monitor geolocation in real time
    useEffect(() => {
        if (userRole !== 'collector') return;

        let watchId = null;

        const handlePositionSuccess = (position) => {
            const newLat = position.coords.latitude;
            const newLng = position.coords.longitude;
            console.log("Collector auto-position resolved:", newLat, newLng);

            setUserCoords(prevCoords => {
                if (!prevCoords) {
                    return { lat: newLat, lng: newLng };
                }

                // Check distance
                const distance = getDistanceInMeters(prevCoords.lat, prevCoords.lng, newLat, newLng);
                if (distance > 200) {
                    console.log(`Collector moved significantly (${distance.toFixed(1)}m). Triggering route recalculation.`);
                    return { lat: newLat, lng: newLng };
                }
                return prevCoords;
            });
        };

        const handlePositionError = (error) => {
            console.error("WatchPosition error:", error);
            setUserCoords(prev => prev || { lat: -23.5505, lng: -46.6333 }); // default SP coord
        };

        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                handlePositionSuccess,
                handlePositionError,
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        } else {
            console.warn("Geolocation API not supported.");
            setUserCoords({ lat: -23.5505, lng: -46.6333 });
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [userRole]);

    // Automatically optimize route
    useEffect(() => {
        if (userRole !== 'collector' || !userCoords) return;
        if (filteredItems.length === 0) {
            setOptimizedRoute(null);
            return;
        }

        const autoOptimize = async () => {
            setIsOptimizing(true);
            try {
                console.log("Auto-optimizing route for collector...", userCoords, filteredItems.length);
                const result = await api.optimizeRoute(
                    currentUserId,
                    userCoords,
                    filteredItems
                );
                if (result.success) {
                    setOptimizedRoute(result);
                }
            } catch (error) {
                console.error("Auto-optimize error:", error);
            } finally {
                setIsOptimizing(false);
            }
        };

        autoOptimize();
    }, [userCoords, filteredItems, userRole, currentUserId]);

    const handleSearch = async (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            try {
                const data = await api.searchAddress(searchQuery);
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    setMapCenter([parseFloat(lat), parseFloat(lon)]);
                } else {
                    alert('Endereço não encontrado');
                }
            } catch (error) {
                console.error("Search error:", error);
                alert('Erro ao buscar endereço');
            }
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw', position: 'relative', fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>

            {/* FULL SCREEN MAP LAYER */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}>
                <MapComponent
                    items={filteredItems}
                    onMarkerClick={(item) => setSelectedItemId(item.id)}
                    center={mapCenter}
                    optimizedRoute={optimizedRoute}
                    userCoords={userCoords}
                />
            </div>

            {/* FILTER OVERLAY */}
            {isFilterOpen && (
                <div
                    onClick={() => setIsFilterOpen(false)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 100,
                        backdropFilter: 'blur(2px)'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '80%',
                            maxWidth: '300px',
                            height: '100%',
                            background: 'white',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
                            animation: 'slideIn 0.3s ease-out'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Filtros</h3>
                            <button onClick={() => setIsFilterOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        {/* Weight Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)' }}>Peso Mínimo: {filterWeight}kg</label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="1"
                                value={filterWeight}
                                onChange={(e) => setFilterWeight(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#95a5a6' }}>
                                <span>0kg</span>
                                <span>50kg+</span>
                            </div>
                        </div>

                        {/* Distance Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)' }}>Distância Máxima: {filterDistance}km</label>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                step="1"
                                value={filterDistance}
                                onChange={(e) => setFilterDistance(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#95a5a6' }}>
                                <span>1km</span>
                                <span>50km</span>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <button
                                onClick={() => {
                                    setFilterWeight(0);
                                    setFilterDistance(50);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#f1f2f6',
                                    color: 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginBottom: '12px'
                                }}
                            >
                                Limpar Filtros
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FLOATING TOP BAR (Search & Filter) */}
            <div style={{
                position: 'absolute',
                top: '40px',
                left: '20px',
                right: '20px',
                zIndex: 10,
                display: 'flex',
                gap: '12px'
            }}>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'white',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                    }}>
                    {/* Filter Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                </button>

                <div style={{
                    flex: 1,
                    background: 'white',
                    borderRadius: '24px',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#95a5a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                        type="text"
                        placeholder="Buscar catadores ou pontos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        style={{
                            border: 'none',
                            outline: 'none',
                            width: '100%',
                            padding: '14px',
                            fontSize: '1rem',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>
            </div>

            {/* CATEGORY FILTERS */}
            <div style={{
                position: 'absolute',
                top: '100px',
                left: 0,
                right: 0,
                zIndex: 10,
                overflowX: 'auto',
                display: 'flex',
                gap: '12px',
                padding: '0 20px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                            background: activeCategory === cat.id ? 'var(--primary-color)' : 'white',
                            color: activeCategory === cat.id ? 'white' : 'var(--text-primary)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat.icon}
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* PRODUCER ONLY: Add Item Button */}
            {userRole === 'producer' && (
                <button
                    onClick={() => onNavigate('post-item')}
                    style={{
                        position: 'absolute',
                        bottom: '100px', // Aligned with where map controls were
                        right: '20px', // In the corner
                        background: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        zIndex: 20,
                        cursor: 'pointer',
                        height: '40px'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Anunciar Resíduo
                </button>
            )}


            {/* SP COOPERATIVE RECOMMENDATIONS (Melhores Preços SP) */}
            {userRole === 'collector' && filteredItems.length === 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '100px',
                    left: '20px',
                    width: 'calc(100% - 40px)',
                    maxWidth: '480px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                    zIndex: 30,
                    fontFamily: "'Outfit', sans-serif",
                    animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Pesquisa Real - São Paulo</span>
                            <h4 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Cooperativas & Melhores Preços</h4>
                        </div>
                        <span style={{ fontSize: '1.5rem' }}>💰</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                        Todas as coletas foram concluídas! Entregue seus materiais onde pagam melhor na cidade:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                        {/* PET/Plastic */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#334155' }}>PET & Plásticos (Melhor Preço)</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 Coopercaps Centro</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>R$ 2,50/kg</span>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>PEAD: R$ 3,10/kg</span>
                            </div>
                        </div>

                        {/* Aluminum/Metal */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#334155' }}>Latinhas & Metais</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 Coop. Vira Lata (Ipiranga)</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>R$ 7,50/kg</span>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Cobre: R$ 32,00/kg</span>
                            </div>
                        </div>

                        {/* Cardboard/Paper */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#334155' }}>Papelão & Papéis</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 Coopere Centro-Oeste</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>R$ 0,90/kg</span>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Papel Branco: R$ 1,20/kg</span>
                            </div>
                        </div>

                        {/* Glass */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#334155' }}>Garrafas & Vidro</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 Recifran (Centro)</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>R$ 0,35/kg</span>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Especiais: R$ 0,45/kg</span>
                            </div>
                        </div>

                        {/* Electronics */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#334155' }}>Sucata & Eletrônicos</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 Coopermiti (Barra Funda)</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>R$ 4,50/kg</span>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Computadores: R$ 5,50/kg</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ITEM DETAIL SHEET */}
            <ItemDetailSheet
                item={selectedItem}
                onClose={() => setSelectedItemId(null)}
                onAccept={onAccept}
                onDelete={onDelete}
                currentUserId={currentUserId}
                userRole={userRole}
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default Dashboard;
