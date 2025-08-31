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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light-bg to-light-accent dark:from-dark-bg dark:to-dark-accent">
        <div className="text-light-text dark:text-dark-text text-xl">Loading...</div>
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