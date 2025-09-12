import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import DashboardGrid from './components/DashboardGrid';
import WidgetManager from './components/WidgetManager';

function Dashboard() {
  const [showWidgetManager, setShowWidgetManager] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState([
    'todo-widget',
    'pomodoro-widget',
    'notes-widget',
    'calendar-widget',
    'expense-widget',
    'calculator-widget',
    'word-widget',
    'aptitude-widget',
    'youtube-music-widget',
    'collaborative-todo-widget'
  ]);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);

  const handleWidgetOrderChange = (newOrder, newHiddenWidgets) => {
    setWidgetOrder(newOrder);
    setHiddenWidgets(newHiddenWidgets || []);
  };

  const handleUpdateWidgetOrder = (newOrder, newHiddenWidgets) => {
    setWidgetOrder(newOrder);
    setHiddenWidgets(newHiddenWidgets);
    
    // Save to localStorage
    localStorage.setItem('widget-order', JSON.stringify(newOrder));
    localStorage.setItem('hidden-widgets', JSON.stringify(newHiddenWidgets));
  };

  return (
    <div className="App">
      <Header onManageWidgets={() => setShowWidgetManager(true)} />
      <main>
        <DashboardGrid 
          onWidgetOrderChange={handleWidgetOrderChange}
          widgetOrder={widgetOrder}
          hiddenWidgets={hiddenWidgets}
        />
      </main>
      <WidgetManager
        isOpen={showWidgetManager}
        onClose={() => setShowWidgetManager(false)}
        widgetOrder={widgetOrder}
        onUpdateWidgetOrder={handleUpdateWidgetOrder}
        availableWidgets={[
          'todo-widget',
          'pomodoro-widget',
          'notes-widget',
          'calendar-widget',
          'expense-widget',
          'calculator-widget',
          'word-widget',
          'aptitude-widget',
          'youtube-music-widget',
          'collaborative-todo-widget'
        ]}
      />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading, login, register } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [networkError, setNetworkError] = useState(false);

  // Check if backend is reachable (only once, use a public endpoint)
  useEffect(() => {
    fetch('http://localhost:3001/api/words', { method: 'GET' })
      .then(res => {
        if (!res.ok) throw new Error('Backend unreachable');
        setNetworkError(false);
      })
      .catch(() => setNetworkError(true));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light-bg to-light-accent dark:from-dark-bg dark:to-dark-accent">
        <div className="text-light-text dark:text-dark-text text-xl">Loading...</div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-light-bg to-light-accent dark:from-dark-bg dark:to-dark-accent">
        <div className="text-red-600 dark:text-red-400 text-xl mb-4">Cannot connect to backend server.<br />Please ensure the backend is running on port 3001.</div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          onClick={() => window.location.reload()}
        >Retry</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login 
        onLogin={login}
        onSwitchToRegister={() => setAuthMode('register')}
      />
    ) : (
      <Register 
        onRegister={register}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;