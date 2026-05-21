import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

/* ═══════════════════════════════════════════════════════════════
   ECO-JARDIM — Interactive Farming Mini-Game
   ═══════════════════════════════════════════════════════════════ */

const GRID_SIZE = 4;
const TOTAL_PLOTS = GRID_SIZE * GRID_SIZE;

const PLANT_TYPES = {
  basic:  { name: 'Hortaliça',  cost: 10, reward: 15, color: '#4CAF50' },
  flower: { name: 'Flor',       cost: 25, reward: 35, color: '#E91E63' },
  tree:   { name: 'Árvore',     cost: 50, reward: 75, color: '#795548' },
};

const GROWTH_STAGES = ['planted', 'growing', 'mature', 'harvestable'];
const STAGE_DURATIONS = { planted: 30000, growing: 60000, mature: 90000 };
const WATER_BOOST = 15000;

/* ────────────────── UTILITY HELPERS ────────────────── */

const getStorageKey = (userId) => `garden_game_${userId}`;

const createEmptyGrid = () =>
  Array.from({ length: TOTAL_PLOTS }, () => ({ state: 'empty' }));

const loadGame = (userId) => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return null;
};

const saveGame = (userId, data) => {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
};

const getPlotStage = (plot, now) => {
  if (plot.state === 'empty') return 'empty';
  const elapsed = now - plot.plantedAt - (plot.waterBonus || 0);
  if (elapsed < STAGE_DURATIONS.planted) return 'planted';
  if (elapsed < STAGE_DURATIONS.planted + STAGE_DURATIONS.growing) return 'growing';
  if (elapsed < STAGE_DURATIONS.planted + STAGE_DURATIONS.growing + STAGE_DURATIONS.mature) return 'mature';
  return 'harvestable';
};

/* ═══════════════════════════════════════════════════
   SVG ART COMPONENTS — Rich, detailed inline graphics
   ═══════════════════════════════════════════════════ */

/* ── Empty Soil Tile ── */
const SoilSVG = () => (
  <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="64" height="64" rx="6" fill="#8D6E63" />
    <rect x="5" y="5" width="60" height="60" rx="5" fill="#A1887F" />
    <rect x="7" y="7" width="56" height="56" rx="4" fill="#8D6E63" />
    {/* Soil texture lines */}
    <line x1="12" y1="20" x2="28" y2="20" stroke="#795548" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="38" y1="28" x2="58" y2="28" stroke="#795548" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    <line x1="15" y1="40" x2="35" y2="40" stroke="#6D4C41" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
    <line x1="42" y1="48" x2="56" y2="48" stroke="#795548" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
    <line x1="18" y1="55" x2="50" y2="55" stroke="#6D4C41" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
    {/* Soil dots */}
    <circle cx="20" cy="30" r="1.5" fill="#6D4C41" opacity="0.4" />
    <circle cx="50" cy="18" r="1.2" fill="#6D4C41" opacity="0.35" />
    <circle cx="40" cy="50" r="1.8" fill="#5D4037" opacity="0.3" />
    <circle cx="25" cy="48" r="1" fill="#5D4037" opacity="0.4" />
    {/* Highlight */}
    <rect x="8" y="8" width="20" height="8" rx="3" fill="rgba(255,255,255,0.08)" />
  </svg>
);

/* ── Seed Stage ── */
const SeedSVG = ({ type }) => {
  const seedColor = type === 'flower' ? '#E8A87C' : type === 'tree' ? '#5D4037' : '#A1887F';
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soil base */}
      <rect x="3" y="3" width="64" height="64" rx="6" fill="#8D6E63" />
      <rect x="5" y="5" width="60" height="60" rx="5" fill="#A1887F" />
      <rect x="7" y="7" width="56" height="56" rx="4" fill="#8D6E63" />
      {/* Dirt mound */}
      <ellipse cx="35" cy="45" rx="16" ry="8" fill="#795548" />
      <ellipse cx="35" cy="44" rx="14" ry="7" fill="#8D6E63" />
      <ellipse cx="35" cy="43" rx="11" ry="5.5" fill="#9E8E82" />
      {/* Seed */}
      <ellipse cx="35" cy="40" rx="5" ry="3.5" fill={seedColor} transform="rotate(-15 35 40)" />
      <ellipse cx="34" cy="39" rx="3" ry="2" fill="rgba(255,255,255,0.15)" transform="rotate(-15 34 39)" />
      {/* Tiny sprout hint */}
      <path d="M35 38 Q36 35 35 33" stroke="#81C784" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* Soil particles */}
      <circle cx="25" cy="47" r="1.5" fill="#6D4C41" opacity="0.5" className="soil-particle" />
      <circle cx="44" cy="46" r="1.2" fill="#6D4C41" opacity="0.4" className="soil-particle" />
      <circle cx="30" cy="50" r="1" fill="#5D4037" opacity="0.5" className="soil-particle" />
    </svg>
  );
};

/* ── Sprout Stage ── */
const SproutSVG = ({ type }) => {
  const leafColor1 = type === 'flower' ? '#66BB6A' : type === 'tree' ? '#558B2F' : '#81C784';
  const leafColor2 = type === 'flower' ? '#A5D6A7' : type === 'tree' ? '#689F38' : '#A5D6A7';
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="64" height="64" rx="6" fill="#8D6E63" />
      <rect x="5" y="5" width="60" height="60" rx="5" fill="#A1887F" />
      <rect x="7" y="7" width="56" height="56" rx="4" fill="#8D6E63" />
      {/* Soil */}
      <ellipse cx="35" cy="52" rx="14" ry="5" fill="#795548" />
      {/* Stem */}
      <rect x="33.5" y="30" width="3" height="22" rx="1.5" fill="#66BB6A" className="sway-plant" />
      {/* Left leaf */}
      <path d="M35 38 Q25 30 22 22 Q30 28 35 38z" fill={leafColor1} className="sway-plant" />
      <path d="M34 37 Q27 31 25 25 Q31 30 34 37z" fill={leafColor2} opacity="0.7" />
      {/* Right leaf */}
      <path d="M35 34 Q45 26 48 18 Q40 24 35 34z" fill={leafColor1} className="sway-plant" />
      <path d="M36 33 Q43 27 45 21 Q39 26 36 33z" fill={leafColor2} opacity="0.7" />
      {/* Tiny dew drop */}
      <circle cx="27" cy="28" r="1.5" fill="#B3E5FC" opacity="0.7" />
    </svg>
  );
};

/* ── Mature Basic Plant ── */
const MaturePlantSVG = () => (
  <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="64" height="64" rx="6" fill="#8D6E63" />
    <rect x="5" y="5" width="60" height="60" rx="5" fill="#A1887F" />
    <rect x="7" y="7" width="56" height="56" rx="4" fill="#8D6E63" />
    <ellipse cx="35" cy="56" rx="14" ry="4" fill="#795548" />
    {/* Main stem */}
    <rect x="33" y="25" width="4" height="30" rx="2" fill="#558B2F" className="sway-plant" />
    {/* Branch left */}
    <path d="M35 40 Q22 34 18 22 Q28 30 35 40z" fill="#66BB6A" className="sway-plant" />
    <path d="M35 40 Q24 36 20 26 Q30 32 35 40z" fill="#81C784" opacity="0.8" />
    {/* Branch right */}
    <path d="M35 36 Q48 30 52 18 Q42 26 35 36z" fill="#66BB6A" className="sway-plant" />
    <path d="M35 36 Q46 32 50 22 Q40 28 35 36z" fill="#81C784" opacity="0.8" />
    {/* Top leaves */}
    <path d="M35 25 Q42 18 40 10 Q34 16 35 25z" fill="#4CAF50" className="sway-plant" />
    <path d="M35 25 Q28 18 30 10 Q36 16 35 25z" fill="#66BB6A" className="sway-plant" />
    {/* Lower leaves */}
    <path d="M35 48 Q24 44 20 36 Q30 40 35 48z" fill="#81C784" opacity="0.7" />
    <path d="M35 48 Q46 44 50 36 Q40 40 35 48z" fill="#81C784" opacity="0.7" />
    {/* Small fruits */}
    <circle cx="22" cy="28" r="3" fill="#FF7043" opacity="0.8" />
    <circle cx="48" cy="24" r="2.5" fill="#FF7043" opacity="0.7" />
    <circle cx="36" cy="14" r="2" fill="#EF5350" opacity="0.6" />
  </svg>
);

/* ── Mature Flower ── */
const MatureFlowerSVG = () => {
  const petalColors = ['#E91E63', '#F48FB1', '#FF80AB', '#EC407A', '#F06292'];
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="64" height="64" rx="6" fill="#8D6E63" />
      <rect x="5" y="5" width="60" height="60" rx="5" fill="#A1887F" />
      <rect x="7" y="7" width="56" height="56" rx="4" fill="#8D6E63" />
      <ellipse cx="35" cy="56" rx="14" ry="4" fill="#795548" />
      {/* Stem */}
      <rect x="33.5" y="28" width="3" height="28" rx="1.5" fill="#388E3C" className="sway-plant" />
      {/* Leaves on stem */}
      <path d="M35 44 Q25 38 22 30 Q30 36 35 44z" fill="#66BB6A" />
      <path d="M35 50 Q45 44 48 36 Q40 42 35 50z" fill="#81C784" />
      {/* Flower head — petals */}
      {petalColors.map((c, i) => {
        const angle = (i * 72) * Math.PI / 180;
        const px = 35 + Math.cos(angle) * 9;
        const py = 22 + Math.sin(angle) * 9;
        return <ellipse key={i} cx={px} cy={py} rx="6" ry="9" fill={c}
          transform={`rotate(${i * 72} ${px} ${py})`} className="sway-plant" opacity="0.9" />;
      })}
      {/* Flower center */}
      <circle cx="35" cy="22" r="5" fill="#FFC107" />
      <circle cx="35" cy="22" r="3" fill="#FFD54F" />
      <circle cx="34" cy="21" r="1.2" fill="#FFF9C4" opacity="0.7" />
      {/* Secondary small flower */}
      <circle cx="24" cy="36" r="3" fill="#F48FB1" opacity="0.6" />
      <circle cx="24" cy="36" r="1.5" fill="#FFC107" opacity="0.7" />
    </svg>
  );
};

/* ── Mature Tree ── */
const MatureTreeSVG = () => (
  <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="64" height="64" rx="6" fill="#8D6E63" />
    <rect x="5" y="5" width="60" height="60" rx="5" fill="#A1887F" />
    <rect x="7" y="7" width="56" height="56" rx="4" fill="#8D6E63" />
    <ellipse cx="35" cy="58" rx="14" ry="4" fill="#795548" />
    {/* Trunk */}
    <rect x="31" y="38" width="8" height="20" rx="3" fill="#6D4C41" />
    <rect x="29" y="42" width="12" height="4" rx="2" fill="#795548" />
    {/* Canopy layers */}
    <ellipse cx="35" cy="28" rx="24" ry="20" fill="#2E7D32" className="sway-plant" />
    <ellipse cx="35" cy="25" rx="20" ry="17" fill="#388E3C" />
    <ellipse cx="28" cy="20" rx="12" ry="10" fill="#43A047" />
    <ellipse cx="42" cy="22" rx="11" ry="9" fill="#4CAF50" />
    <ellipse cx="35" cy="16" rx="9" ry="7" fill="#66BB6A" />
    {/* Highlights */}
    <ellipse cx="30" cy="14" rx="5" ry="3" fill="#81C784" opacity="0.5" />
    {/* Fruits */}
    <circle cx="22" cy="30" r="2.5" fill="#FF7043" opacity="0.8" />
    <circle cx="48" cy="26" r="2" fill="#FF8A65" opacity="0.7" />
    <circle cx="35" cy="12" r="2" fill="#FFAB91" opacity="0.6" />
    <circle cx="26" cy="22" r="1.8" fill="#FF7043" opacity="0.6" />
  </svg>
);

/* ── Water Drop Animation ── */
const WaterDropOverlay = () => (
  <svg width="70" height="70" viewBox="0 0 70 70" fill="none"
    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 20 }}>
    <g className="water-drop-anim">
      <path d="M35 8 C35 8 25 22 25 28 a10 10 0 0 0 20 0 C45 22 35 8 35 8z" fill="#4FC3F7" opacity="0.8" />
      <ellipse cx="32" cy="25" rx="3" ry="4" fill="#B3E5FC" opacity="0.5" />
    </g>
    <g className="water-drop-anim" style={{ animationDelay: '0.3s' }}>
      <circle cx="25" cy="45" r="2" fill="#4FC3F7" opacity="0.6" />
      <circle cx="46" cy="40" r="1.5" fill="#4FC3F7" opacity="0.5" />
      <circle cx="35" cy="50" r="1.8" fill="#29B6F6" opacity="0.5" />
    </g>
  </svg>
);

/* ── Sparkle / Glow Overlay for Harvestable ── */
const SparkleOverlay = () => (
  <svg width="70" height="70" viewBox="0 0 70 70" fill="none"
    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 15 }}>
    <circle cx="15" cy="15" r="2" fill="#FFD700" className="sparkle-1" />
    <circle cx="55" cy="12" r="1.5" fill="#FFC107" className="sparkle-2" />
    <circle cx="12" cy="50" r="1.8" fill="#FFD700" className="sparkle-3" />
    <circle cx="58" cy="52" r="2" fill="#FFC107" className="sparkle-1" />
    <circle cx="35" cy="8" r="1.5" fill="#FFD700" className="sparkle-2" />
    <circle cx="35" cy="60" r="1.2" fill="#FFC107" className="sparkle-3" />
    {/* Star sparkles */}
    <path d="M20 35 l2-2 2 2-2 2z" fill="#FFD700" className="sparkle-2" />
    <path d="M50 30 l2-2 2 2-2 2z" fill="#FFD700" className="sparkle-1" />
    <path d="M35 5 l1.5-1.5 1.5 1.5-1.5 1.5z" fill="#FFC107" className="sparkle-3" />
  </svg>
);

/* ── Sun with Rays ── */
const SunSVG = ({ phase }) => {
  const sunY = phase < 0.5 ? 10 + phase * 20 : 10 + (1 - phase) * 20;
  const opacity = phase > 0.75 ? Math.max(0, 1 - (phase - 0.75) * 4) : phase < 0.2 ? Math.min(1, phase * 5) : 1;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ opacity }}>
      <g className="sun-rotate">
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const x1 = 30 + Math.cos(angle) * 16;
          const y1 = sunY + Math.sin(angle) * 16;
          const x2 = 30 + Math.cos(angle) * 24;
          const y2 = sunY + Math.sin(angle) * 24;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#FFD600" strokeWidth="2" strokeLinecap="round" opacity="0.7" />;
        })}
        <circle cx="30" cy={sunY} r="12" fill="#FFD600" />
        <circle cx="30" cy={sunY} r="9" fill="#FFEB3B" />
        <circle cx="27" cy={sunY - 2} r="3" fill="#FFF9C4" opacity="0.5" />
      </g>
    </svg>
  );
};

/* ── Butterfly (animated) ── */
const ButterflySVG = ({ color = '#E91E63', size = 1, style }) => (
  <svg width={24 * size} height={20 * size} viewBox="0 0 24 20" fill="none" style={style}>
    <g className="butterfly-fly">
      {/* Left wing */}
      <ellipse cx="8" cy="8" rx="7" ry="5" fill={color} opacity="0.8" className="wing-left" />
      <ellipse cx="7" cy="7" rx="4" ry="3" fill="rgba(255,255,255,0.3)" />
      {/* Right wing */}
      <ellipse cx="16" cy="8" rx="7" ry="5" fill={color} opacity="0.8" className="wing-right" />
      <ellipse cx="17" cy="7" rx="4" ry="3" fill="rgba(255,255,255,0.3)" />
      {/* Body */}
      <rect x="11" y="5" width="2" height="10" rx="1" fill="#333" />
      {/* Antennae */}
      <line x1="12" y1="5" x2="9" y2="1" stroke="#333" strokeWidth="0.7" />
      <line x1="12" y1="5" x2="15" y2="1" stroke="#333" strokeWidth="0.7" />
      <circle cx="9" cy="1" r="0.8" fill="#333" />
      <circle cx="15" cy="1" r="0.8" fill="#333" />
    </g>
  </svg>
);

/* ── Cloud ── */
const CloudSVG = ({ style }) => (
  <svg width="80" height="36" viewBox="0 0 80 36" fill="none" style={style}>
    <ellipse cx="30" cy="22" rx="28" ry="12" fill="rgba(255,255,255,0.7)" />
    <ellipse cx="50" cy="18" rx="20" ry="14" fill="rgba(255,255,255,0.8)" />
    <ellipse cx="22" cy="18" rx="16" ry="10" fill="rgba(255,255,255,0.75)" />
    <ellipse cx="40" cy="14" rx="18" ry="12" fill="rgba(255,255,255,0.85)" />
  </svg>
);

/* ── Coin Icon ── */
const CoinIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#FFD600" />
    <circle cx="12" cy="12" r="9" fill="#FFEB3B" />
    <circle cx="12" cy="12" r="7.5" fill="#FFC107" />
    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#F57F17" fontFamily="'Inter', sans-serif">$</text>
    <circle cx="12" cy="12" r="9" fill="none" stroke="#F9A825" strokeWidth="1" />
  </svg>
);

/* ── Leaf Icon ── */
const LeafIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 2 C16 2 20 6 20 11 C20 18 11 20 11 20 C11 20 2 18 2 11 C2 6 6 2 11 2z" fill="#4CAF50" />
    <path d="M11 6 Q11 12 7 16" stroke="#81C784" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M11 8 Q14 11 13 14" stroke="#81C784" strokeWidth="1" fill="none" strokeLinecap="round" />
  </svg>
);


/* ═══════════════════════════════════════════════════
   PLANT MODAL COMPONENT
   ═══════════════════════════════════════════════════ */

const PlantModal = ({ onClose, onPlant, balance }) => {
  const types = Object.entries(PLANT_TYPES);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
      fontFamily: "'Inter', sans-serif"
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '28px',
        maxWidth: '340px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'modalIn 0.3s ease-out'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#2E7D32', fontWeight: 800 }}>
          🌱 Plantar Semente
        </h3>
        <p style={{ margin: '0 0 18px', color: '#666', fontSize: '0.82rem' }}>
          Escolha o que deseja plantar. Saldo: <strong style={{ color: '#F9A825' }}>{balance} GC</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {types.map(([key, info]) => {
            const canAfford = balance >= info.cost;
            return (
              <button key={key} disabled={!canAfford}
                onClick={() => canAfford && onPlant(key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', border: canAfford ? `2px solid ${info.color}` : '2px solid #ddd',
                  borderRadius: '14px', cursor: canAfford ? 'pointer' : 'not-allowed',
                  background: canAfford ? `${info.color}10` : '#f5f5f5',
                  opacity: canAfford ? 1 : 0.5, transition: 'all 0.2s',
                  fontFamily: "'Inter', sans-serif"
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: info.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: '700'
                  }}>
                    {key === 'basic' ? '🥬' : key === 'flower' ? '🌸' : '🌳'}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#333' }}>{info.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                      Lucro: +{info.reward - info.cost} GC
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontWeight: 700, fontSize: '0.95rem', color: canAfford ? info.color : '#999'
                }}>
                  <CoinIcon size={16} /> {info.cost}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{
          marginTop: '16px', width: '100%', padding: '10px',
          border: 'none', borderRadius: '10px', background: '#eee',
          color: '#666', fontWeight: 600, cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", fontSize: '0.9rem'
        }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════
   HARVEST POPUP
   ═══════════════════════════════════════════════════ */

const HarvestPopup = ({ reward, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      zIndex: 1100, animation: 'harvestPop 1.8s ease-out forwards', pointerEvents: 'none'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #FFF8E1, #FFFDE7)', borderRadius: '20px',
        padding: '24px 36px', boxShadow: '0 10px 40px rgba(255,193,7,0.4)',
        textAlign: 'center', border: '2px solid #FFD600',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🎉</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F57F17' }}>
          +{reward} GC
        </div>
        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>Colheita realizada!</div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════
   TUTORIAL MODAL COMPONENT
   ═══════════════════════════════════════════════════ */

const TutorialModal = ({ onClose, onNext, step }) => {
  const slides = [
    {
      title: "Boas-vindas ao EcoJardim! 🌿",
      text: "Este é o seu canteiro sustentável! Aqui você pode plantar vegetais, flores e árvores gastando GreenCoins (GC), e colhê-los para lucrar e obter ainda mais pontos e moedas para usar na loja!",
      emoji: "🌱"
    },
    {
      title: "Como Funciona? 💧",
      text: "1. Clique em qualquer quadrado de terra vazio e selecione uma semente.\n2. Aguarde as fases de crescimento: Semente (30s) -> Broto (60s) -> Maduro (90s).\n3. Dica: Clique na planta enquanto cresce para regá-la e acelerar 15s (uma vez por estágio)!",
      emoji: "💦"
    },
    {
      title: "Colheita Abundante! 🎉",
      text: "Quando a planta estiver madura e brilhando com estrelas douradas, clique nela para colhê-la! Você receberá seus GreenCoins de volta com um excelente lucro sustentável. Suas moedas são salvas e sincronizadas com a sua conta principal!",
      emoji: "✨"
    }
  ];

  const currentSlide = slides[step];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1050, backdropFilter: 'blur(5px)',
      fontFamily: "'Inter', sans-serif"
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '32px',
        maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative', textAlign: 'center',
        animation: 'modalIn 0.3s ease-out'
      }} onClick={e => e.stopPropagation()}>
        {/* Step Indicator */}
        <div style={{
          position: 'absolute', top: '16px', right: '24px',
          fontSize: '0.78rem', color: '#888', fontWeight: 600
        }}>
          {step + 1} de {slides.length}
        </div>

        {/* Beautiful Floating Icon */}
        <div style={{
          fontSize: '4rem', margin: '12px 0 20px',
          filter: 'drop-shadow(0 8px 16px rgba(46,125,50,0.15))'
        }}>
          {currentSlide.emoji}
        </div>

        <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', color: '#2E7D32', fontWeight: 800 }}>
          {currentSlide.title}
        </h3>
        
        <p style={{
          margin: '0 0 28px', color: '#555', fontSize: '0.88rem',
          lineHeight: 1.6, whiteSpace: 'pre-line', textAlign: 'left',
          background: '#f9f9f9', padding: '16px', borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.03)'
        }}>
          {currentSlide.text}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', border: 'none', borderRadius: '12px',
            background: '#f0f0f0', color: '#666', fontWeight: 700, cursor: 'pointer',
            fontSize: '0.9rem', transition: 'all 0.2s'
          }}>
            Pular
          </button>
          <button onClick={onNext} style={{
            flex: 2, padding: '12px', border: 'none', borderRadius: '12px',
            background: 'linear-gradient(135deg, #4CAF50, #2E7D32)', color: '#fff',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(46,125,50,0.2)', transition: 'all 0.2s'
          }}>
            {step === slides.length - 1 ? 'Começar!' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════
   MAIN GARDEN COMPONENT
   ═══════════════════════════════════════════════════ */

const Garden = ({ user: currentUser, viewOnly = false, userId }) => {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [balance, setBalance] = useState(0);
  const [totalHarvests, setTotalHarvests] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [harvestPopup, setHarvestPopup] = useState(null);
  const [wateringPlot, setWateringPlot] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [dayPhase, setDayPhase] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const tickRef = useRef(null);
  const targetId = userId || (currentUser && currentUser.id);

  /* ── Load initial data ── */
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    api.getUserStats(currentUser.id, currentUser.role)
      .then(data => {
        if (cancelled) return;
        const pts = data.points || 0;
        return api.getGardenStatus(pts).then(() => {
          const saved = loadGame(targetId);
          if (saved) {
            setGrid(saved.grid || createEmptyGrid());
            setBalance(pts); // ALWAYS sync balance with database points (pts)
            setTotalHarvests(saved.totalHarvests || 0);
          } else {
            setBalance(pts);
          }
          
          // Check tutorial seen state
          const seen = localStorage.getItem(`garden_tutorial_seen_${targetId}`);
          if (!seen && !viewOnly) {
            setShowTutorial(true);
            setTutorialStep(0);
          }
          setLoading(false);
        });
      })
      .catch(() => {
        if (!cancelled) {
          const saved = loadGame(targetId);
          if (saved) {
            setGrid(saved.grid || createEmptyGrid());
            setBalance(saved.balance != null ? saved.balance : 0);
            setTotalHarvests(saved.totalHarvests || 0);
          }
          const seen = localStorage.getItem(`garden_tutorial_seen_${targetId}`);
          if (!seen && !viewOnly) {
            setShowTutorial(true);
            setTutorialStep(0);
          }
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [currentUser, targetId, viewOnly]);

  /* ── Game tick — update clock for growth ── */
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  /* ── Day/night cycle ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setDayPhase(prev => (prev + 0.002) % 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  /* ── Save to localStorage whenever state changes ── */
  useEffect(() => {
    if (loading || !targetId) return;
    saveGame(targetId, { grid, balance, totalHarvests });
  }, [grid, balance, totalHarvests, targetId, loading]);

  /* ── Watering effect cleanup ── */
  useEffect(() => {
    if (wateringPlot !== null) {
      const t = setTimeout(() => setWateringPlot(null), 1200);
      return () => clearTimeout(t);
    }
  }, [wateringPlot]);

  /* ── ACTIONS ── */

  const handlePlotClick = useCallback((index) => {
    if (viewOnly) return;
    const plot = grid[index];
    const stage = getPlotStage(plot, now);

    if (stage === 'empty') {
      setSelectedPlot(index);
      setShowModal(true);
      return;
    }

    if (stage === 'harvestable') {
      const reward = PLANT_TYPES[plot.type].reward;
      setBalance(b => {
        const next = b + reward;
        api.updateUserPoints(currentUser.id, currentUser.role, next).catch(console.error);
        return next;
      });
      setTotalHarvests(h => h + 1);
      setGrid(g => {
        const ng = [...g];
        ng[index] = { state: 'empty' };
        return ng;
      });
      setHarvestPopup({ reward });
      return;
    }

    // Watering — only once per stage
    const currentStageIndex = GROWTH_STAGES.indexOf(stage);
    const wateredStage = plot.wateredStages || [];
    if (currentStageIndex >= 0 && !wateredStage.includes(stage)) {
      setWateringPlot(index);
      setGrid(g => {
        const ng = [...g];
        ng[index] = {
          ...ng[index],
          waterBonus: (ng[index].waterBonus || 0) + WATER_BOOST,
          wateredStages: [...wateredStage, stage],
        };
        return ng;
      });
    }
  }, [grid, now, viewOnly, balance, currentUser]);

  const handlePlant = useCallback((type) => {
    if (selectedPlot === null) return;
    const cost = PLANT_TYPES[type].cost;
    if (balance < cost) return;

    setBalance(b => {
      const next = b - cost;
      api.updateUserPoints(currentUser.id, currentUser.role, next).catch(console.error);
      return next;
    });
    setGrid(g => {
      const ng = [...g];
      ng[selectedPlot] = {
        state: 'planted',
        type,
        plantedAt: Date.now(),
        waterBonus: 0,
        wateredStages: [],
      };
      return ng;
    });
    setShowModal(false);
    setSelectedPlot(null);
  }, [selectedPlot, balance, currentUser]);

  /* ── Computed stats ── */
  const plantedCount = grid.filter(p => p.state !== 'empty').length;

  /* ── Day/Night gradient ── */
  const getBgGradient = () => {
    if (dayPhase < 0.25) {
      // Morning
      const t = dayPhase / 0.25;
      return `linear-gradient(180deg, 
        hsl(${140 + t * 10}, ${50 + t * 15}%, ${85 + t * 5}%) 0%, 
        hsl(${130}, ${40 + t * 20}%, ${75 + t * 10}%) 100%)`;
    } else if (dayPhase < 0.5) {
      // Midday
      return 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 60%, #A5D6A7 100%)';
    } else if (dayPhase < 0.75) {
      // Evening
      const t = (dayPhase - 0.5) / 0.25;
      return `linear-gradient(180deg, 
        hsl(${150 - t * 30}, ${65 - t * 20}%, ${90 - t * 20}%) 0%, 
        hsl(${140 - t * 50}, ${60 - t * 15}%, ${80 - t * 25}%) 100%)`;
    } else {
      // Night
      const t = (dayPhase - 0.75) / 0.25;
      return `linear-gradient(180deg, 
        hsl(${220 + t * 10}, ${30 + t * 10}%, ${30 + t * 20}%) 0%, 
        hsl(${200}, ${25}%, ${20 + t * 15}%) 100%)`;
    }
  };

  /* ── Get the right SVG for a plot ── */
  const getPlotVisual = (plot, stage) => {
    if (stage === 'empty') return <SoilSVG />;
    if (stage === 'planted') return <SeedSVG type={plot.type} />;
    if (stage === 'growing') return <SproutSVG type={plot.type} />;
    if (stage === 'mature' || stage === 'harvestable') {
      if (plot.type === 'flower') return <MatureFlowerSVG />;
      if (plot.type === 'tree') return <MatureTreeSVG />;
      return <MaturePlantSVG />;
    }
    return <SoilSVG />;
  };

  const getPlotTooltip = (plot, stage) => {
    if (stage === 'empty') return 'Clique para plantar';
    const info = PLANT_TYPES[plot.type];
    if (stage === 'harvestable') return `${info.name} pronta! Clique para colher (+${info.reward} GC)`;
    const wateredStages = plot.wateredStages || [];
    const canWater = !wateredStages.includes(stage);
    if (canWater) return `${info.name} — clique para regar (acelera 15s)`;
    return `${info.name} — crescendo...`;
  };

  const getPlotProgress = (plot, stage) => {
    if (stage === 'empty' || stage === 'harvestable') return null;
    const elapsed = now - plot.plantedAt - (plot.waterBonus || 0);
    const totalTime = STAGE_DURATIONS.planted + STAGE_DURATIONS.growing + STAGE_DURATIONS.mature;
    return Math.min(1, Math.max(0, elapsed / totalTime));
  };

  /* ── LOADING STATE ── */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 100%)',
        fontFamily: "'Inter', sans-serif", flexDirection: 'column', gap: '16px'
      }}>
        <div className="loading-spinner" style={{
          width: '40px', height: '40px', border: '4px solid #C8E6C9',
          borderTop: '4px solid #4CAF50', borderRadius: '50%'
        }} />
        <span style={{ color: '#2E7D32', fontWeight: 600, fontSize: '1rem' }}>
          Preparando o jardim...
        </span>
        <style>{`
          .loading-spinner { animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Inter', sans-serif",
      background: getBgGradient(), transition: 'background 2s ease',
      overflow: 'hidden', position: 'relative', paddingBottom: '80px'
    }}>

      {/* ═══ CSS Animations ═══ */}
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-1.5deg); }
          50% { transform: rotate(1.5deg); }
        }
        .sway-plant { animation: sway 3s ease-in-out infinite; transform-origin: bottom center; }

        @keyframes sparkle1 {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes sparkle2 {
          0%, 100% { opacity: 0; transform: scale(0.3); }
          40% { opacity: 1; transform: scale(1.8); }
        }
        @keyframes sparkle3 {
          0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
          60% { opacity: 1; transform: scale(1.4) rotate(180deg); }
        }
        .sparkle-1 { animation: sparkle1 1.5s ease-in-out infinite; }
        .sparkle-2 { animation: sparkle2 2s ease-in-out infinite 0.3s; }
        .sparkle-3 { animation: sparkle3 1.8s ease-in-out infinite 0.6s; }

        @keyframes harvestGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.4), inset 0 0 4px rgba(255,215,0,0.1); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.7), inset 0 0 8px rgba(255,215,0,0.2); }
        }

        @keyframes waterDrop {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(30px) scale(0.5); }
        }
        .water-drop-anim { animation: waterDrop 1.2s ease-out forwards; }

        @keyframes modalIn {
          from { transform: scale(0.85) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes harvestPop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          15% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          30% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          80% { transform: translate(-50%, -80%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -120%) scale(0.8); opacity: 0; }
        }

        @keyframes sunRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sun-rotate { animation: sunRotate 30s linear infinite; transform-origin: 30px 20px; }

        @keyframes butterflyFloat {
          0% { transform: translate(0, 0); }
          25% { transform: translate(15px, -10px); }
          50% { transform: translate(30px, 5px); }
          75% { transform: translate(10px, 12px); }
          100% { transform: translate(0, 0); }
        }
        .butterfly-fly { animation: butterflyFloat 8s ease-in-out infinite; }

        @keyframes wingFlap {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.3); }
        }
        .wing-left { animation: wingFlap 0.3s ease-in-out infinite; transform-origin: right center; }
        .wing-right { animation: wingFlap 0.3s ease-in-out infinite 0.05s; transform-origin: left center; }

        @keyframes cloudDrift {
          from { transform: translateX(-120px); }
          to { transform: translateX(calc(100vw + 120px)); }
        }

        @keyframes plotHover {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }

        @keyframes progressPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ═══ Ambient: Clouds ═══ */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        <CloudSVG style={{ position: 'absolute', top: '10px', animation: 'cloudDrift 45s linear infinite' }} />
        <CloudSVG style={{ position: 'absolute', top: '40px', animation: 'cloudDrift 60s linear infinite 15s', opacity: 0.6, transform: 'scale(0.7)' }} />
        <CloudSVG style={{ position: 'absolute', top: '25px', animation: 'cloudDrift 55s linear infinite 30s', opacity: 0.5, transform: 'scale(0.5)' }} />
      </div>

      {/* ═══ Ambient: Butterflies ═══ */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
        <ButterflySVG color="#E91E63" size={1} style={{
          position: 'absolute', top: '15%', left: '10%',
          animation: 'butterflyFloat 10s ease-in-out infinite'
        }} />
        <ButterflySVG color="#FF9800" size={0.8} style={{
          position: 'absolute', top: '25%', right: '15%',
          animation: 'butterflyFloat 12s ease-in-out infinite 3s'
        }} />
        <ButterflySVG color="#9C27B0" size={0.7} style={{
          position: 'absolute', top: '60%', left: '75%',
          animation: 'butterflyFloat 9s ease-in-out infinite 6s'
        }} />
      </div>

      {/* ═══ HEADER ═══ */}
      <div style={{
        padding: '16px 20px', background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fadeInUp 0.5s ease-out'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LeafIcon />
          <h1 style={{ margin: 0, color: '#2E7D32', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
            Eco-Jardim
          </h1>
          {!viewOnly && (
            <button
              onClick={() => { setTutorialStep(0); setShowTutorial(true); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', borderRadius: '50%', transition: 'background 0.2s, color 0.2s'
              }}
              title="Como jogar"
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#2E7D32'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </button>
          )}
          <SunSVG phase={dayPhase} />
          {viewOnly && (
            <span style={{
              padding: '3px 10px', background: '#C8E6C9', color: '#2E7D32',
              borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              Visitando
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'linear-gradient(135deg, #FFF8E1, #FFFDE7)',
            padding: '6px 14px', borderRadius: '20px',
            border: '1.5px solid #FFD600', fontWeight: 700,
            fontSize: '0.95rem', color: '#F57F17'
          }}>
            <CoinIcon size={18} /> {balance}
          </div>
          <div style={{
            display: 'flex', gap: '12px', fontSize: '0.78rem',
            color: '#555', fontWeight: 600
          }}>
            <span>Colheitas: {totalHarvests}</span>
            <span>Plantas: {plantedCount}</span>
          </div>
        </div>
      </div>

      {/* ═══ GARDEN AREA ═══ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px', position: 'relative', zIndex: 5,
        animation: 'fadeInUp 0.7s ease-out 0.1s both'
      }}>

        {/* ── Wooden Fence Border ── */}
        <div style={{
          position: 'relative', padding: '20px',
          background: 'linear-gradient(135deg, #8D6E63 0%, #6D4C41 100%)',
          borderRadius: '18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.1)',
          border: '3px solid #5D4037'
        }}>
          {/* Fence posts — top */}
          <div style={{ position: 'absolute', top: '-8px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between' }}>
            {[...Array(6)].map((_, i) => (
              <div key={`ft-${i}`} style={{
                width: '10px', height: '16px', background: 'linear-gradient(180deg, #A1887F, #6D4C41)',
                borderRadius: '3px 3px 0 0', border: '1px solid #5D4037'
              }} />
            ))}
          </div>
          {/* Fence posts — bottom */}
          <div style={{ position: 'absolute', bottom: '-8px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between' }}>
            {[...Array(6)].map((_, i) => (
              <div key={`fb-${i}`} style={{
                width: '10px', height: '16px', background: 'linear-gradient(0deg, #A1887F, #6D4C41)',
                borderRadius: '0 0 3px 3px', border: '1px solid #5D4037'
              }} />
            ))}
          </div>

          {/* ── Green Grass Inner Area ── */}
          <div style={{
            background: 'linear-gradient(145deg, #66BB6A 0%, #4CAF50 40%, #43A047 100%)',
            borderRadius: '12px', padding: '16px',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1), inset 0 -1px 0 rgba(255,255,255,0.15)',
            position: 'relative'
          }}>
            {/* Grass texture */}
            {[...Array(12)].map((_, i) => (
              <div key={`g-${i}`} style={{
                position: 'absolute',
                width: `${2 + (i * 7 % 5)}px`,
                height: `${2 + (i * 11 % 5)}px`,
                background: i % 2 === 0 ? 'rgba(129,199,132,0.4)' : 'rgba(56,142,60,0.25)',
                borderRadius: '50%',
                left: `${8 + (i * 47 % 290)}px`,
                top: `${8 + (i * 31 % 290)}px`,
                pointerEvents: 'none'
              }} />
            ))}

            {/* ── 4x4 GRID ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 78px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 78px)`,
              gap: '6px',
              position: 'relative',
              zIndex: 5
            }}>
              {grid.map((plot, index) => {
                const stage = getPlotStage(plot, now);
                const isHarvestable = stage === 'harvestable';
                const isWatering = wateringPlot === index;
                const progress = getPlotProgress(plot, stage);
                const canInteract = !viewOnly && (
                  stage === 'empty' ||
                  stage === 'harvestable' ||
                  (stage !== 'empty' && !(plot.wateredStages || []).includes(stage))
                );

                return (
                  <div
                    key={index}
                    onClick={() => handlePlotClick(index)}
                    title={getPlotTooltip(plot, stage)}
                    style={{
                      width: '78px', height: '78px',
                      borderRadius: '12px',
                      cursor: canInteract ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'transform 0.2s ease, box-shadow 0.3s',
                      transform: canInteract ? undefined : undefined,
                      animation: isHarvestable ? 'harvestGlow 1.5s ease-in-out infinite' : undefined,
                      boxShadow: isHarvestable
                        ? '0 0 16px rgba(255,215,0,0.5), 0 4px 12px rgba(0,0,0,0.15)'
                        : '0 3px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: isHarvestable ? '2px solid #FFD600' : '2px solid rgba(0,0,0,0.08)',
                      background: isHarvestable
                        ? 'linear-gradient(135deg, rgba(255,248,225,0.3), rgba(255,253,231,0.2))'
                        : 'transparent'
                    }}
                    onMouseEnter={e => {
                      if (canInteract) e.currentTarget.style.transform = 'scale(1.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {getPlotVisual(plot, stage)}

                    {/* Sparkle overlay for harvestable */}
                    {isHarvestable && <SparkleOverlay />}

                    {/* Water animation overlay */}
                    {isWatering && <WaterDropOverlay />}

                    {/* Growth progress bar */}
                    {progress !== null && (
                      <div style={{
                        position: 'absolute', bottom: '4px', left: '8px', right: '8px',
                        height: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px',
                        overflow: 'hidden', zIndex: 25
                      }}>
                        <div style={{
                          width: `${progress * 100}%`,
                          height: '100%',
                          background: progress > 0.8
                            ? 'linear-gradient(90deg, #66BB6A, #FFD600)'
                            : 'linear-gradient(90deg, #66BB6A, #81C784)',
                          borderRadius: '2px',
                          transition: 'width 1s linear',
                          animation: progress > 0.8 ? 'progressPulse 1s ease-in-out infinite' : undefined
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ TIP ═══ */}
        {!viewOnly && (
          <div style={{
            marginTop: '24px', padding: '14px 24px',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '16px', fontSize: '0.82rem', color: '#333',
            maxWidth: '420px', textAlign: 'center', lineHeight: 1.5,
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.03)',
            animation: 'fadeInUp 0.8s ease-out 0.2s both'
          }}>
            💧 <strong>Como jogar:</strong> Clique em terras vazias para plantar sementes gastando GC.
            Clique nelas enquanto crescem para regá-las (acelera 15s)!
            Quando brilharem, clique para colher o lucro!
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      {showModal && (
        <PlantModal
          onClose={() => { setShowModal(false); setSelectedPlot(null); }}
          onPlant={handlePlant}
          balance={balance}
        />
      )}

      {harvestPopup && (
        <HarvestPopup
          reward={harvestPopup.reward}
          onDone={() => setHarvestPopup(null)}
        />
      )}

      {showTutorial && (
        <TutorialModal
          step={tutorialStep}
          onClose={() => {
            setShowTutorial(false);
            localStorage.setItem(`garden_tutorial_seen_${targetId}`, 'true');
          }}
          onNext={() => {
            if (tutorialStep < 2) {
              setTutorialStep(s => s + 1);
            } else {
              setShowTutorial(false);
              localStorage.setItem(`garden_tutorial_seen_${targetId}`, 'true');
            }
          }}
        />
      )}
    </div>
  );
};

export default Garden;
