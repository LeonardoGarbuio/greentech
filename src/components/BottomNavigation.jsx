import React from 'react';

const BottomNavigation = ({ currentView, onNavigate, userRole }) => {
    const navItems = [
        {
            id: 'home',
            label: 'Início',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        },
        {
            id: 'dashboard',
            label: 'Coletas',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><map name=""></map><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"></path><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
        },
        {
            id: 'chat',
            label: 'Chat',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        },
        {
            id: 'profile',
            label: 'Perfil',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        }
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px', // Floating
            left: '20px',
            right: '20px',
            width: 'auto', // Auto width to respect margins
            background: 'white',
            borderRadius: '24px', // Rounded corners
            border: 'none', // Remove top border
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px 0', // Reduced padding for smaller height
            zIndex: 1000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)', // Deeper shadow for floating effect
            fontFamily: "'Outfit', sans-serif"
        }}>
            {navItems.map(item => {
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            color: isActive ? 'var(--primary-color)' : '#95a5a6',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            padding: '0 12px'
                        }}
                    >
                        <div style={{
                            color: isActive ? 'var(--primary-color)' : 'inherit',
                            transform: isActive ? 'translateY(-2px)' : 'none',
                            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}>
                            {item.icon}
                        </div>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: isActive ? '600' : '500',
                            letterSpacing: '0.3px'
                        }}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNavigation;
