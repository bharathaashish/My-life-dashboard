import React, { useState, useEffect } from 'react';
import TodoWidget from './widgets/TodoWidget';
import PomodoroWidget from './widgets/PomodoroWidget';
import NotesWidget from './widgets/NotesWidget';
import CalendarWidget from './widgets/CalendarWidget';
import ExpenseWidget from './widgets/ExpenseWidget';
import CalculatorWidget from './widgets/CalculatorWidget';
import WordWidget from './widgets/WordWidget';

const DashboardGrid = () => {
  const [widgetOrder, setWidgetOrder] = useState([
    'todo-widget',
    'pomodoro-widget',
    'notes-widget',
    'calendar-widget',
    'expense-widget',
    'calculator-widget',
    'word-widget'
  ]);

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
  }, []);

  const saveWidgetOrder = (newOrder) => {
    setWidgetOrder(newOrder);
    localStorage.setItem('widget-order', JSON.stringify(newOrder));
  };

  const moveWidget = (fromIndex, toIndex) => {
    const newOrder = [...widgetOrder];
    const [movedWidget] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedWidget);
    saveWidgetOrder(newOrder);
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
      default:
        return null;
    }
  };

  return (
    <div 
      id="dashboard-grid" 
      className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-6 transition-all"
    >
      {widgetOrder.map((widgetId, index) => (
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