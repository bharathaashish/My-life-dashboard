import React, { useState, useEffect } from 'react';

const TodoWidget = () => {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Failed to parse tasks', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (inputValue.trim() === '') return;
    const newTask = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false
    };
    setTasks([...tasks, newTask]);
    setInputValue('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  return (
    <section
      id="todo-widget"
      data-widget="todo-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[280px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent">
        <h2 className="text-xl font-semibold">To-Do List</h2>
      </div>
      <div className="p-4 flex flex-col">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            id="todo-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task"
            className="flex-1 px-4 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            id="add-task"
            onClick={addTask}
            className="bg-primary dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul id="todo-list" className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="todo-item flex items-center justify-between gap-2 p-3 rounded-xl hover:bg-opacity-10 dark:hover:bg-dark-accent light:hover:bg-light-accent transition-all duration-300">
                <span
                  onClick={() => toggleTask(task.id)}
                  className={`cursor-pointer flex-1 ${task.completed ? 'line-through opacity-60' : ''}`}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="task-delete text-error hover:text-red-700 font-bold transition-colors duration-300"
                  aria-label="Delete task"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default TodoWidget;