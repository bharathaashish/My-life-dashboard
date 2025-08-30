import React, { useState, useEffect } from 'react';

const NotesWidget = () => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    localStorage.setItem('notes', newNotes);
  };

  return (
    <section
      id="notes-widget"
      data-widget="notes-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[280px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent">
        <h2 className="text-xl font-semibold">Quick Notes</h2>
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <textarea
          id="notes-area"
          value={notes}
          onChange={handleNotesChange}
          placeholder="Write your notes here..."
          className="w-full h-full p-4 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-dark-text/80 light:text-light-text/80"
        />
      </div>
    </section>
  );
};

export default NotesWidget;