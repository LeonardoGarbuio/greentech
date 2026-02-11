import React, { useState } from 'react';
import MapComponent from './Map';
import ItemDetailSheet from './ItemDetailSheet';
import { api } from '../services/api';

const Dashboard = ({ items, onAccept, onDelete, onLogout, onNavigate, userRole, currentUserId }) => {
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterDistance, setFilterDistance] = useState(50); // km
    const [filterWeight, setFilterWeight] = useState(0); // kg
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState(null);

    // Derive selected item from props to ensure it's always fresh
    const selectedItem = items.find(i => i.id === selectedItemId) || null;

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

    const categories = [
        { id: 'all', name: 'Todos', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> },
        { id: 'paper', name: 'Papel', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
        { id: 'plastic', name: 'Plástico', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"></path></svg> },
        { id: 'glass', name: 'Vidro', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v12a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V7a5 5 0 0 0-5-5z"></path></svg> },
        { id: 'metal', name: 'Metal', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg> },
        { id: 'electronic', name: 'Eletrônicos', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> },
    ];

    // Filter logic
    const filteredItems = items.filter(i => {
        // Category Filter
        if (activeCategory !== 'all' && i.type !== activeCategory) return false;

        // Weight Filter
        if (i.weight_kg < filterWeight) return false;

        // Distance Filter (Mocked for now, assuming all items are within range if filter is max)
        // In a real app, we would calculate distance from user location here
        // For demo purposes, we'll just say if filterDistance < 5, hide items with '100m' in distance text if we had it parsed
        // But since we don't have real distance calc, we will skip this or implement a dummy check
        return true;
    });

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

            {/* ITEM DETAIL SHEET */}
            <ItemDetailSheet
                item={selectedItem}
                onClose={() => setSelectedItemId(null)}
                onAccept={onAccept}
                onDelete={onDelete}
                currentUserId={currentUserId}
                userRole={userRole}
            />
        </div>
    );
};

export default Dashboard;
