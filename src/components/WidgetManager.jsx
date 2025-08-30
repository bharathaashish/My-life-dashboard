import React, { useState, useEffect } from 'react';

const WidgetManager = ({ isOpen, onClose, widgetOrder, onUpdateWidgetOrder, availableWidgets }) => {
  const [localWidgetOrder, setLocalWidgetOrder] = useState(widgetOrder);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);

  useEffect(() => {
    setLocalWidgetOrder(widgetOrder);
    // Load hidden widgets from localStorage
    const savedHiddenWidgets = localStorage.getItem('hidden-widgets');
    if (savedHiddenWidgets) {
      try {
        setHiddenWidgets(JSON.parse(savedHiddenWidgets));
      } catch (e) {
        console.error('Failed to parse hidden widgets', e);
      }
    }
  }, [widgetOrder]);

  const saveHiddenWidgets = (newHiddenWidgets) => {
    setHiddenWidgets(newHiddenWidgets);
    localStorage.setItem('hidden-widgets', JSON.stringify(newHiddenWidgets));
  };

  const moveWidget = (fromIndex, toIndex) => {
    const newOrder = [...localWidgetOrder];
    const [movedWidget] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedWidget);
    setLocalWidgetOrder(newOrder);
  };

  const toggleWidgetVisibility = (widgetId) => {
    const newHiddenWidgets = hiddenWidgets.includes(widgetId)
      ? hiddenWidgets.filter(id => id !== widgetId)
      : [...hiddenWidgets, widgetId];
    saveHiddenWidgets(newHiddenWidgets);
  };

  const handleSave = () => {
    onUpdateWidgetOrder(localWidgetOrder, hiddenWidgets);
    onClose();
  };

  const handleReset = () => {
    const defaultOrder = [
      'todo-widget',
      'pomodoro-widget',
      'notes-widget',
      'calendar-widget',
      'expense-widget',
      'calculator-widget',
      'word-widget'
    ];
    setLocalWidgetOrder(defaultOrder);
    saveHiddenWidgets([]);
  };

  const getWidgetDisplayName = (widgetId) => {
    const names = {
      'todo-widget': 'Todo List',
      'pomodoro-widget': 'Pomodoro Timer',
      'notes-widget': 'Notes',
      'calendar-widget': 'Calendar',
      'expense-widget': 'Expense Tracker',
      'calculator-widget': 'Calculator',
      'word-widget': 'Word of the Day'
    };
    return names[widgetId] || widgetId;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="dark:bg-dark-widget light:bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-dark-text light:text-light-text">Manage Widgets</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold dark:text-dark-text light:text-light-text mb-3">Widget Order & Visibility</h3>
          <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
            Drag widgets to reorder them. Toggle visibility using the eye icon.
          </p>
          
          <div className="space-y-2">
            {localWidgetOrder.map((widgetId, index) => (
              <div
                key={widgetId}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900');
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  if (fromIndex !== index) {
                    moveWidget(fromIndex, index);
                  }
                }}
                className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600 light:border-gray-300 dark:bg-dark-bg light:bg-gray-50 cursor-move hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                  </svg>
                  <span className="font-medium dark:text-dark-text light:text-light-text">
                    {getWidgetDisplayName(widgetId)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <button
                    onClick={() => toggleWidgetVisibility(widgetId)}
                    className={`p-2 rounded transition-colors ${
                      hiddenWidgets.includes(widgetId)
                        ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900'
                        : 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900'
                    }`}
                    title={hiddenWidgets.includes(widgetId) ? 'Show widget' : 'Hide widget'}
                  >
                    {hiddenWidgets.includes(widgetId) ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetManager;