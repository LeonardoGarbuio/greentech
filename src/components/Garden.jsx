import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Garden = ({ user: currentUser }) => {
    const [gardenData, setGardenData] = useState(null);
    const [userPoints, setUserPoints] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        // Fetch user points and then garden status
        api.getUserStats(currentUser.id, currentUser.role).then(data => {
            setUserPoints(data.points || 0);
            return api.getGardenStatus(data.points || 0);
        }).then(status => {
            setGardenData(status);
        });
    }, [currentUser]);

    if (!gardenData) return <div style={{ padding: '20px', textAlign: 'center' }}>Regando as plantas...</div>;

    const getPlantEmoji = () => {
        switch (gardenData.stage) {
            case 'seed': return '🌰';
            case 'sprout': return '🌱';
            case 'plant': return '🪴';
            case 'tree': return '🌳';
            case 'forest': return '🏡🌲';
            default: return '🌱';
        }
    };

    const progress = gardenData.nextLevel === 0 ? 100 : Math.min(100, (userPoints / gardenData.nextLevel) * 100);

    return (
        <div style={{ paddingBottom: '100px', backgroundColor: '#e8f5e9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
                <h1 style={{ margin: 0, color: '#2e7d32', fontSize: '1.5rem', textAlign: 'center' }}>Meu Jardim 🌻</h1>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

                {/* Sun Animation */}
                <div style={{
                    fontSize: '3rem',
                    marginBottom: '20px',
                    animation: 'spin 10s linear infinite'
                }}>☀️</div>

                {/* Plant Container */}
                <div style={{
                    width: '200px',
                    height: '200px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(46, 125, 50, 0.2)',
                    marginBottom: '30px',
                    position: 'relative'
                }}>
                    <div style={{ fontSize: '5rem', animation: 'bounce 2s infinite ease-in-out' }}>
                        {getPlantEmoji()}
                    </div>
                    {/* Water particles */}
                    <div style={{ position: 'absolute', top: '-20px', right: '10px', fontSize: '1.5rem' }}>💧</div>
                </div>

                {/* Status */}
                <h2 style={{ color: '#1b5e20', margin: '0 0 8px 0' }}>
                    {gardenData.stage === 'seed' ? 'Fase 1: Semente' :
                        gardenData.stage === 'sprout' ? 'Fase 2: Broto' :
                            gardenData.stage === 'plant' ? 'Fase 3: Planta Jovem' :
                                gardenData.stage === 'tree' ? 'Fase 4: Árvore Adulta' : 'Fase Final: Floresta Viva'}
                </h2>
                <p style={{ textAlign: 'center', color: '#388e3c', maxWidth: '300px', marginBottom: '30px' }}>
                    {gardenData.message}
                </p>

                {/* Progress Bar */}
                <div style={{ width: '100%', maxWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#555', fontWeight: '600' }}>
                        <span>{userPoints} pts</span>
                        <span>{gardenData.nextLevel === 0 ? 'MÁXIMO' : `${gardenData.nextLevel} pts`}</span>
                    </div>
                    <div style={{
                        height: '12px',
                        background: '#c8e6c9',
                        borderRadius: '6px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #4caf50, #81c784)',
                            transition: 'width 1s ease-out'
                        }}></div>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#777', marginTop: '8px' }}>
                        {gardenData.nextLevel === 0 ? 'Parabéns! Você alcançou o nível máximo!' : `Faltam ${gardenData.nextLevel - userPoints} pontos para crescer.`}
                    </p>
                </div>

            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Garden;
