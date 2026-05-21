import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const Chat = ({ onNavigate, user, activeChat, setActiveChat }) => {
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [partner, setPartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);
    const isFirstLoadRef = useRef(true);

    // Carregar conversas ativas ao montar o componente
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const data = await api.getChats();
                setChats(data || []);
            } catch (error) {
                console.error("Erro ao carregar conversas:", error);
            } finally {
                setLoadingChats(false);
            }
        };

        fetchChats();
        
        // Atualizar lista de conversas a cada 10 segundos
        const chatsInterval = setInterval(fetchChats, 10000);
        return () => clearInterval(chatsInterval);
    }, []);

    // Monitorar redirecionamento direto / deep-linking vindo dos cards de coleta
    useEffect(() => {
        if (activeChat && activeChat.chatId) {
            setSelectedChatId(activeChat.chatId);
            setPartner({
                name: activeChat.partnerName || 'Conversa',
                phone: activeChat.partnerPhone || '',
                avatar: activeChat.partnerAvatar || '',
                role: user.role === 'producer' ? 'collector' : 'producer'
            });
            isFirstLoadRef.current = true;
        }
    }, [activeChat, user.role]);

    // Polling de mensagens em tempo real quando uma conversa está selecionada
    useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async (isSilent = false) => {
            if (!isSilent) setLoadingMessages(true);
            try {
                const data = await api.getChatMessages(selectedChatId);
                setMessages(prev => {
                    // Evitar atualizações de estado se nada mudou para não quebrar a rolagem
                    if (JSON.stringify(prev) !== JSON.stringify(data)) {
                        return data || [];
                    }
                    return prev;
                });
            } catch (error) {
                console.error("Erro ao carregar mensagens:", error);
            } finally {
                if (!isSilent) setLoadingMessages(false);
            }
        };

        fetchMessages(false);

        // Polling a cada 3 segundos
        const intervalId = setInterval(() => {
            fetchMessages(true);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [selectedChatId]);

    // Rolagem automática para a última mensagem
    useEffect(() => {
        if (messages.length > 0 && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: isFirstLoadRef.current ? 'auto' : 'smooth'
            });
            isFirstLoadRef.current = false;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            const res = await api.sendMessage(selectedChatId, messageText);
            if (res.success) {
                // Compensação de latência: Adicionar mensagem localmente de imediato
                const tempMsg = {
                    id: Date.now(),
                    chat_id: selectedChatId,
                    sender_role: user.role,
                    content: messageText,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, tempMsg]);
                
                // Atualizar texto da última mensagem na lista lateral/geral
                setChats(prevChats => 
                    prevChats.map(c => 
                        c.id === selectedChatId 
                            ? { ...c, last_message: messageText, last_message_time: new Date().toISOString() }
                            : c
                    )
                );
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            alert("Não foi possível enviar a mensagem.");
        } finally {
            setSending(false);
        }
    };

    const handleBackToInbox = () => {
        setSelectedChatId(null);
        setPartner(null);
        setActiveChat(null); // Reseta o estado global de navegação de chat no App.jsx
    };

    // Formatar timestamp do SQLite de forma amigável
    const formatTime = (timestampStr) => {
        if (!timestampStr) return '';
        try {
            const formattedStr = timestampStr.includes(' ') && !timestampStr.includes('T')
                ? timestampStr.replace(' ', 'T') + 'Z' 
                : timestampStr;
            const date = new Date(formattedStr);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Visualização 1: Caixa de Entrada / Lista de Conversas
    if (!selectedChatId) {
        return (
            <div style={{
                paddingBottom: '80px',
                minHeight: '100vh',
                background: '#f8f9fb',
                fontFamily: '"Be Vietnam Pro", sans-serif'
            }}>
                <header style={{
                    padding: '24px 20px',
                    background: 'white',
                    borderBottom: '1px solid #eceef0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 style={{
                            fontSize: '1.6rem',
                            color: '#006d37',
                            fontWeight: '800',
                            margin: 0,
                            letterSpacing: '-0.5px'
                        }}>
                            Mensagens
                        </h1>
                        <span className="material-symbols-outlined" style={{ color: '#006d37', fontSize: '28px' }}>
                            chat_bubble
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#4b6076', lineHeight: '1.4' }}>
                        Converse com {user.role === 'producer' ? 'os catadores parceiros' : 'os doadores'} para combinar a retirada dos materiais recicláveis.
                    </p>
                </header>

                <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loadingChats ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#4b6076' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1.5s linear infinite', color: '#006d37' }}>
                                progress_activity
                            </span>
                            <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Carregando suas conversas...</p>
                        </div>
                    ) : chats.length === 0 ? (
                        <div style={{
                            padding: '48px 24px',
                            textAlign: 'center',
                            background: 'white',
                            borderRadius: '16px',
                            border: '1px dashed #bccabc',
                            color: '#4b6076',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: '#f2f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#006d37'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>forum</span>
                            </div>
                            <div>
                                <h3 style={{ fontWeight: '700', fontSize: '1.1rem', margin: '0 0 6px 0', color: '#191c1e' }}>Nenhuma conversa ativa</h3>
                                <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: '1.5', color: '#4b6076' }}>
                                    {user.role === 'producer' 
                                        ? 'As conversas serão criadas de forma automática quando um catador aceitar retirar uma de suas publicações.'
                                        : 'Confirme a retirada de um material no mapa ou feed para abrir um canal direto de chat com o doador!'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div 
                                key={chat.id} 
                                onClick={() => {
                                    setSelectedChatId(chat.id);
                                    setPartner({
                                        name: chat.partner_name,
                                        phone: chat.partner_phone,
                                        avatar: chat.partner_avatar,
                                        role: chat.partner_role
                                    });
                                    isFirstLoadRef.current = true;
                                }}
                                style={{
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    background: 'white',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                    cursor: 'pointer',
                                    border: '1px solid #eceef0',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                                className="chat-card-item"
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: chat.partner_role === 'collector' 
                                        ? 'linear-gradient(135deg, #7efba4, #006d37)' 
                                        : 'linear-gradient(135deg, #ffdcc5, #944a00)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    color: 'white',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                }}>
                                    {chat.partner_avatar ? (
                                        <img src={chat.partner_avatar} alt={chat.partner_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        getInitials(chat.partner_name)
                                    )}
                                </div>

                                {/* Conteúdo resumido */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                        <h4 style={{ 
                                            fontWeight: '700', 
                                            fontSize: '0.95rem', 
                                            margin: 0, 
                                            color: '#191c1e',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {chat.partner_name}
                                        </h4>
                                        <span style={{ fontSize: '0.75rem', color: '#8a9bb0', flexShrink: 0, marginLeft: '8px' }}>
                                            {formatTime(chat.last_message_time)}
                                        </span>
                                    </div>
                                    <p style={{
                                        color: '#4b6076',
                                        fontSize: '0.85rem',
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        lineHeight: '1.4'
                                    }}>
                                        {chat.last_message || 'Nenhuma mensagem enviada'}
                                    </p>
                                </div>

                                {/* Tag de Identificação da Função */}
                                <span style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    right: '16px',
                                    fontSize: '0.68rem',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    background: chat.partner_role === 'collector' ? '#e8f5e9' : '#fff3e0',
                                    color: chat.partner_role === 'collector' ? '#2e7d32' : '#e65100',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px'
                                }}>
                                    {chat.partner_role === 'collector' ? 'Catador' : 'Doador'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Visualização 2: Chat Interno Aberto / Conversa Ativa
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            background: '#f8f9fb',
            fontFamily: '"Be Vietnam Pro", sans-serif',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000
        }}>
            {/* Header do Chat */}
            <header style={{
                padding: '12px 16px',
                background: 'white',
                borderBottom: '1px solid #eceef0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
                <button 
                    onClick={handleBackToInbox}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#4b6076',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>arrow_back</span>
                </button>

                {/* Avatar do Parceiro */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: partner?.role === 'collector' 
                        ? 'linear-gradient(135deg, #7efba4, #006d37)' 
                        : 'linear-gradient(135deg, #ffdcc5, #944a00)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: 'white',
                    overflow: 'hidden',
                    flexShrink: 0
                }}>
                    {partner?.avatar ? (
                        <img src={partner.avatar} alt={partner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        getInitials(partner?.name)
                    )}
                </div>

                {/* Dados do Parceiro */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                        margin: 0, 
                        fontWeight: '700', 
                        fontSize: '0.98rem', 
                        color: '#191c1e',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {partner?.name || 'Conversa'}
                    </h3>
                    <span style={{ 
                        fontSize: '0.72rem', 
                        color: partner?.role === 'collector' ? '#2e7d32' : '#e65100',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                    }}>
                        {partner?.role === 'collector' ? 'Catador Parceiro' : 'Doador'}
                    </span>
                </div>

                {/* Botão para Ligar */}
                {partner?.phone && (
                    <a 
                        href={`tel:${partner.phone}`}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#f2f4f6',
                            color: '#006d37',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease'
                        }}
                        title="Ligar para o parceiro"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>call</span>
                    </a>
                )}
            </header>

            {/* Corpo das Mensagens */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#f8f9fb'
            }}>
                {loadingMessages && messages.length === 0 ? (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1.5s linear infinite', color: '#006d37' }}>
                            progress_activity
                        </span>
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flex: 1, 
                        color: '#4b6076',
                        padding: '24px',
                        textAlign: 'center',
                        gap: '12px'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#bccabc' }}>waving_hand</span>
                        <p style={{ fontSize: '0.85rem', maxWidth: '240px', lineHeight: '1.5', margin: 0, color: '#4b6076' }}>
                            Envie uma mensagem amigável para combinar o horário e os detalhes da coleta!
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_role === user.role;
                        return (
                            <div 
                                key={msg.id || index}
                                style={{
                                    display: 'flex',
                                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                                    width: '100%'
                                }}
                            >
                                <div style={{ maxWidth: '75%' }}>
                                    {/* Balão de Mensagem */}
                                    <div style={{
                                        background: isMe ? '#27ae60' : 'white',
                                        color: isMe ? 'white' : '#191c1e',
                                        padding: '12px 16px',
                                        borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.4',
                                        wordBreak: 'break-word',
                                        border: isMe ? 'none' : '1px solid #eceef0'
                                    }}>
                                        {msg.content}
                                    </div>
                                    {/* Horário */}
                                    <div style={{
                                        textAlign: isMe ? 'right' : 'left',
                                        fontSize: '0.7rem',
                                        color: '#8a9bb0',
                                        marginTop: '4px',
                                        padding: '0 4px'
                                    }}>
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input de Envio inferior */}
            <form 
                onSubmit={handleSendMessage}
                style={{
                    padding: '12px 16px',
                    background: 'white',
                    borderTop: '1px solid #eceef0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexShrink: 0
                }}
            >
                <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    style={{
                        flex: 1,
                        background: '#f2f4f6',
                        border: '1px solid transparent',
                        borderRadius: '24px',
                        padding: '12px 18px',
                        fontSize: '0.92rem',
                        outline: 'none',
                        color: '#191c1e',
                        transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                        e.target.style.border = '1px solid #27ae60';
                        e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                        e.target.style.border = '1px solid transparent';
                        e.target.style.background = '#f2f4f6';
                    }}
                    disabled={sending}
                />
                
                <button 
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: newMessage.trim() ? '#27ae60' : '#eceef0',
                        color: newMessage.trim() ? 'white' : '#bccabc',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: newMessage.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        boxShadow: newMessage.trim() ? '0 4px 12px rgba(39, 174, 96, 0.2)' : 'none'
                    }}
                >
                    {sending ? (
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>
                            progress_activity
                        </span>
                    ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '22px', marginLeft: '2px' }}>send</span>
                    )}
                </button>
            </form>
        </div>
    );
};

export default Chat;
