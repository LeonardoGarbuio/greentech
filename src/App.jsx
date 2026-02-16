import React, { useState } from 'react';
import Login from './components/Login';
import Home from './components/Home';
import CollectorHome from './components/CollectorHome';
import Dashboard from './components/Dashboard';
import PostItem from './components/PostItem';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Map from './components/Map';
import BottomNavigation from './components/BottomNavigation';
import Garden from './components/Garden';
import Leaderboard from './components/Leaderboard';
import Guide from './components/Guide';
import History from './components/History';
import { api } from './services/api';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('producer'); // 'producer' or 'collector'
  const [userId, setUserId] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // Default to home
  const [feedItems, setFeedItems] = useState([]);

  // Fetch items from backend (Initial + Polling)
  React.useEffect(() => {
    if (!isLoggedIn) return; // Don't fetch if not logged in

    const fetchItems = () => {
      const getItems = async () => {
        try {
          const data = await api.getItems(userId, userRole);
          setFeedItems(data);
        } catch (err) {
          console.error("Failed to fetch items:", err);
        }
      };
      getItems();
    };

    // Initial fetch
    fetchItems();

    // Poll every 10 seconds
    const intervalId = setInterval(fetchItems, 10000);

    return () => clearInterval(intervalId);
  }, [userId, userRole, isLoggedIn]);

  const handleAddItem = async (newItem) => {
    setCurrentView('home');

    try {
      // Send to backend first and get the real ID
      const result = await api.createItem(newItem, userId);
      console.log('Item created on backend:', result);

      // Re-fetch all items from backend to get consistent state
      const data = await api.getItems(userId, userRole);
      setFeedItems(data);
    } catch (err) {
      console.error("Failed to post item:", err);
      alert('Erro ao publicar item. Tente novamente.');
    }
  };

  const handleAcceptItem = (id, newStatus = 'reserved') => {
    if (newStatus === 'collected') {
      // Remove from list immediately so it disappears from map
      setFeedItems(feedItems.filter(item => item.id !== id));
    } else {
      // Just update status AND collector_id so we own it immediately!
      setFeedItems(feedItems.map(item =>
        item.id === id ? { ...item, status: newStatus, collector_id: userId } : item
      ));
    }

    // Update backend
    // Update backend
    api.updateItemStatus(id, newStatus, userId)
      .catch(err => console.error("Failed to update item:", err));
  };

  const handleDeleteItem = (id) => {
    // Optimistic update
    setFeedItems(feedItems.filter(item => item.id !== id));
    setCurrentView('home');

    // Send to backend
    // Send to backend
    api.deleteItem(id)
      .catch(err => console.error("Failed to delete item:", err));
  };

  const handleLogin = async (email, password) => {
    try {
      const data = await api.login(email, password);
      if (data.success) {
        setIsLoggedIn(true);
        setUserRole(data.user.role || 'producer');
        setUserId(data.user.id);
        setCurrentView('home');
      } else {
        alert(data.message || 'Login falhou');
      }
    } catch (error) {
      console.error("Login error:", error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('login');
    setUserRole('producer');
    setUserId(null);
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const user = { id: userId, role: userRole };

  // Navigation Handler
  const renderScreen = () => {
    switch (currentView) {
      case 'home':
        return userRole === 'collector'
          ? <CollectorHome onNavigate={handleNavigate} user={user} />
          : <Home onNavigate={handleNavigate} user={user} />;
      case 'dashboard':
        return <Dashboard
          items={feedItems}
          onAccept={handleAcceptItem}
          onDelete={handleDeleteItem}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          userRole={userRole}
          currentUserId={userId}
        />;
      case 'post-item': // Kept as 'post-item' to match existing usage
        return <PostItem onAddItem={handleAddItem} onBack={() => setCurrentView('home')} />;
      case 'history':
        return <History onBack={() => setCurrentView('home')} user={user} />;
      case 'profile':
        return <Profile onNavigate={handleNavigate} onLogout={handleLogout} user={user} />;
      case 'chat':
        return <Chat onNavigate={handleNavigate} />;
      case 'map':
        return <Map onNavigate={handleNavigate} />;
      case 'garden':
        return <Garden user={user} />;
      case 'leaderboard':
        return <Leaderboard user={user} />;
      case 'guide':
        return <Guide onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} user={user} />;
    }
  };

  return (
    <>
      {renderScreen()}

      {/* Persistent Bottom Navigation (except on Post Item) */}
      {currentView !== 'post-item' && (
        <BottomNavigation
          currentView={currentView}
          onNavigate={handleNavigate}
          userRole={userRole}
        />
      )}
    </>
  )
}

export default App
