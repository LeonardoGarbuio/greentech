import { API_BASE_URL } from '../services/api';

const Chat = ({ onNavigate }) => {
    const [conversations, setConversations] = React.useState([]);

    React.useEffect(() => {
        fetch(`${API_BASE_URL}/messages`)
            .then(res => res.json())
            .then(data => setConversations(data))
            .catch(err => console.error("Failed to fetch messages:", err));
    }, []);

    return (
        <div style={{ paddingBottom: '80px' }}>
            <header style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: '1px solid var(--surface-border)'
            }}>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', fontWeight: '700' }}>Mensagens</h1>
            </header>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {conversations.map(chat => (
                    <div key={chat.id} className="glass-panel" style={{
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        background: 'white',
                        cursor: 'pointer'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'var(--bg-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>👤</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <h4 style={{ fontWeight: '600' }}>{chat.name}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{chat.time}</span>
                            </div>
                            <p style={{
                                color: chat.unread ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: chat.unread ? '600' : '400',
                                fontSize: '0.9rem'
                            }}>{chat.lastMessage}</p>
                        </div>
                        {chat.unread > 0 && (
                            <div style={{
                                background: 'var(--primary-color)',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}>{chat.unread}</div>
                        )}
                    </div>
                ))}
            </div>


        </div>
    );
};

export default Chat;
