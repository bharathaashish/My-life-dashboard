import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import DashboardGrid from './components/DashboardGrid';
import WidgetManager from './components/WidgetManager';

function App() {
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

export default App;