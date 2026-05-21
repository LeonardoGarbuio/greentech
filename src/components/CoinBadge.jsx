import React from 'react';

/**
 * CoinBadge — Flat, reusable coin‑wallet pill.
 *
 * Props:
 *   coins     – numeric balance to display
 *   onClick   – callback (usually navigates to the EcoStore)
 *   size      – 'small' | 'medium' (default 'medium')
 */
const CoinBadge = ({ coins = 0, onClick, size = 'medium' }) => {
    const isSmall = size === 'small';

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8f9fa',
                padding: isSmall ? '4px 10px' : '6px 14px',
                borderRadius: '50px',
                border: '1px solid #e0e0e0',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'background 0.2s',
                userSelect: 'none'
            }}
            onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = '#f1f2f6'; }}
            onMouseLeave={(e) => { if (onClick) e.currentTarget.style.background = '#f8f9fa'; }}
        >
            {/* Flat coin SVG */}
            <svg
                width={isSmall ? '16' : '18'}
                height={isSmall ? '16' : '18'}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f1c40f"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M9 12h6" />
            </svg>

            <span style={{
                fontSize: isSmall ? '0.85rem' : '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary, #1a1a2e)',
                marginLeft: '6px'
            }}>
                {coins}
                <span style={{
                    fontSize: isSmall ? '0.65rem' : '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #6b7280)',
                    marginLeft: '3px'
                }}>
                    GC
                </span>
            </span>
        </div>
    );
};

export default CoinBadge;
