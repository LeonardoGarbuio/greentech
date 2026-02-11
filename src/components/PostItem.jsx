import React, { useState } from 'react';

const PostItem = ({ onBack, onAddItem }) => {
    const [type, setType] = useState('paper');
    const [weight, setWeight] = useState('');
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState('');
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
    const [coords, setCoords] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setImage(imageUrl);
        }
    };

    const handleGetLocation = () => {
        setLocationStatus('loading');
        if (!navigator.geolocation) {
            setLocationStatus('error');
            alert('Geolocalização não suportada pelo seu navegador.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationStatus('success');
            },
            (error) => {
                console.error("Error getting location:", error);
                setLocationStatus('error');
                alert('Erro ao obter localização. Verifique as permissões.');
            }
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Default mock location if no real location captured
        const finalLat = coords ? coords.lat : -23.5505 + (Math.random() * 0.01 - 0.005);
        const finalLng = coords ? coords.lng : -46.6333 + (Math.random() * 0.01 - 0.005);

        // Map Portuguese display names to English keys for DB/Map consistency
        const typeMapping = {
            'Papel': 'paper',
            'Plástico': 'plastic',
            'Vidro': 'glass',
            'Metal': 'metal',
            'Eletrônico': 'electronic',
            'Outro': 'other'
        };

        const newItem = {
            type: typeMapping[type] || 'other',
            title: `${weight}kg de ${type}`,
            distance: coords ? '0m (Aqui)' : '100m',
            location: description || (coords ? 'Localização Exata' : 'Localização Aproximada'),
            status: 'available',
            lat: finalLat,
            lng: finalLng,
            image: image,
            weight_kg: parseFloat(weight) || 0
        };

        if (onAddItem) {
            onAddItem(newItem);
        } else {
            console.error("onAddItem prop is missing!");
        }
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', paddingBottom: '80px', background: '#f5f6fa' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={onBack} style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1.5rem',
                    marginRight: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Anunciar Resíduo</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Photo Upload */}
                <div
                    onClick={() => fileInputRef.current.click()}
                    style={{
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: image ? 'none' : '2px dashed #cbd5e0',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        background: 'white',
                        transition: 'all 0.2s',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />

                    {image ? (
                        <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <>
                            <span style={{ fontSize: '2rem', marginBottom: '10px' }}>📷</span>
                            <p style={{ color: '#718096', fontWeight: '500' }}>Toque para adicionar foto</p>
                        </>
                    )}
                </div>

                {/* Type Selection */}
                <div>
                    <label style={{ display: 'block', marginBottom: '12px', color: '#4a5568', fontWeight: '600', fontSize: '0.9rem' }}>TIPO DE MATERIAL</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {['Papel', 'Plástico', 'Vidro', 'Metal', 'Eletrônico', 'Outro'].map(t => (
                            <div key={t} style={{
                                padding: '16px',
                                textAlign: 'center',
                                background: type === t ? 'var(--primary-color)' : 'white',
                                color: type === t ? 'white' : '#4a5568',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s',
                                border: type === t ? 'none' : '1px solid #e2e8f0'
                            }} onClick={() => setType(t)}>
                                {t}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details */}
                <div>
                    <label style={{ display: 'block', marginBottom: '12px', color: '#4a5568', fontWeight: '600', fontSize: '0.9rem' }}>PESO ESTIMADO (KG)</label>
                    <input
                        type="number"
                        placeholder="Ex: 5"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            outline: 'none',
                            fontSize: '1rem',
                            background: 'white'
                        }}
                    />
                </div>

                {/* Location Picker */}
                <div>
                    <label style={{ display: 'block', marginBottom: '12px', color: '#4a5568', fontWeight: '600', fontSize: '0.9rem' }}>ONDE ESTÁ O LIXO?</label>

                    <button
                        type="button"
                        onClick={handleGetLocation}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid var(--primary-color)',
                            background: locationStatus === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'white',
                            color: 'var(--primary-color)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '12px'
                        }}
                    >
                        {locationStatus === 'loading' ? 'Obtendo localização...' :
                            locationStatus === 'success' ? '📍 Localização Atual Definida!' :
                                '📍 Usar Minha Localização Atual'}
                    </button>

                    <textarea
                        rows="3"
                        placeholder="Ou descreva o local (Ex: Em frente ao portão azul...)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            outline: 'none',
                            resize: 'none',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            background: 'white'
                        }}
                    />
                </div>

                <button type="submit" style={{
                    marginTop: '20px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    padding: '18px',
                    borderRadius: '16px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)'
                }}>
                    PUBLICAR AGORA
                </button>

            </form>
        </div>
    );
};

export default PostItem;
