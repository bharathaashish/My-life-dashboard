import React, { useState, useEffect } from 'react';
import TodoWidget from './widgets/TodoWidget';
import PomodoroWidget from './widgets/PomodoroWidget';
import NotesWidget from './widgets/NotesWidget';
import CalendarWidget from './widgets/CalendarWidget';
import ExpenseWidget from './widgets/ExpenseWidget';
import CalculatorWidget from './widgets/CalculatorWidget';
import WordWidget from './widgets/WordWidget';
import YouTubeMusicWidget from './widgets/YouTubeMusicWidget';
import CollaborativeTodoWidget from './widgets/CollaborativeTodoWidget';

const DashboardGrid = ({ onWidgetOrderChange, widgetOrder: externalWidgetOrder, hiddenWidgets: externalHiddenWidgets }) => {
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

  useEffect(() => {
    // Load widget order from localStorage
    const savedOrder = localStorage.getItem('widget-order');
    if (savedOrder) {
      try {
        setWidgetOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error('Failed to parse widget order', e);
      }
    }

    // Load hidden widgets from localStorage
    const savedHiddenWidgets = localStorage.getItem('hidden-widgets');
    if (savedHiddenWidgets) {
      try {
        setHiddenWidgets(JSON.parse(savedHiddenWidgets));
      } catch (e) {
        console.error('Failed to parse hidden widgets', e);
      }
    }
  }, []);

  // Update local state when external props change
  useEffect(() => {
    if (externalWidgetOrder) {
      setWidgetOrder(externalWidgetOrder);
    }
  }, [externalWidgetOrder]);

  useEffect(() => {
    if (externalHiddenWidgets) {
      setHiddenWidgets(externalHiddenWidgets);
    }
  }, [externalHiddenWidgets]);

  const saveWidgetOrder = (newOrder) => {
    setWidgetOrder(newOrder);
    localStorage.setItem('widget-order', JSON.stringify(newOrder));
    if (onWidgetOrderChange) {
      onWidgetOrderChange(newOrder, hiddenWidgets);
    }
  };

  const updateHiddenWidgets = (newHiddenWidgets) => {
    setHiddenWidgets(newHiddenWidgets);
    localStorage.setItem('hidden-widgets', JSON.stringify(newHiddenWidgets));
    if (onWidgetOrderChange) {
      onWidgetOrderChange(widgetOrder, newHiddenWidgets);
    }
  };

  const moveWidget = (fromIndex, toIndex) => {
    const visibleWidgets = widgetOrder.filter(id => !hiddenWidgets.includes(id));
    const newOrder = [...visibleWidgets];
    const [movedWidget] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedWidget);
    
    // Reconstruct full order maintaining hidden widgets positions
    const fullOrder = [...widgetOrder];
    const visibleInOriginal = fullOrder.filter(id => !hiddenWidgets.includes(id));
    
    // Replace visible widgets with new order
    let visibleIndex = 0;
    const finalOrder = fullOrder.map(id => {
      if (hiddenWidgets.includes(id)) {
        return id;
      } else {
        return newOrder[visibleIndex++];
      }
    });
    
    saveWidgetOrder(finalOrder);
  };

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'todo-widget':
        return <TodoWidget />;
      case 'pomodoro-widget':
        return <PomodoroWidget />;
      case 'notes-widget':
        return <NotesWidget />;
      case 'calendar-widget':
        return <CalendarWidget />;
      case 'expense-widget':
        return <ExpenseWidget />;
      case 'calculator-widget':
        return <CalculatorWidget />;
      case 'word-widget':
        return <WordWidget />;
      case 'youtube-music-widget':
        return <YouTubeMusicWidget />;
      case 'collaborative-todo-widget':
        return <CollaborativeTodoWidget />;
      default:
        return null;
    }
  };

  // Filter out hidden widgets
  const visibleWidgets = widgetOrder.filter(widgetId => !hiddenWidgets.includes(widgetId));

  return (
    <div 
      id="dashboard-grid" 
      className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-6 transition-all"
    >
      {visibleWidgets.map((widgetId, index) => (
        <div 
          key={widgetId}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('drag-over');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            if (fromIndex !== index) {
              moveWidget(fromIndex, index);
            }
          }}
          onDragEnd={(e) => {
            e.currentTarget.classList.remove('drag-over');
          }}
        >
          {renderWidget(widgetId)}
        </div>
      ))}
    </div>
  );
};

export default DashboardGrid;