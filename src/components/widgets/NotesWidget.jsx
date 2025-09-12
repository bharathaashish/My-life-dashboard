import React, { useState, useEffect } from 'react';

const NotesWidget = () => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    const savedNotes = localStorage.getItem('quick-notes');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      setNotes(parsedNotes);
    }
  }, []);

  const saveNotesToStorage = (updatedNotes) => {
    localStorage.setItem('quick-notes', JSON.stringify(updatedNotes));
  };

  const handleNewNote = () => {
    setCurrentNote(null);
    setNoteTitle('');
    setNoteContent('');
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim()) {
      alert('Please enter a title for your note');
      return;
    }

    const newNote = {
      id: currentNote ? currentNote.id : Date.now(),
      title: noteTitle.trim(),
      content: noteContent,
      lastModified: new Date().toISOString()
    };

    let updatedNotes;
    if (currentNote) {
      // Update existing note
      updatedNotes = notes.map(note => 
        note.id === currentNote.id ? newNote : note
      );
    } else {
      // Add new note
      updatedNotes = [...notes, newNote];
    }

    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
    setIsEditing(false);
    setCurrentNote(newNote);
  };

  const handleEditNote = (note) => {
    setCurrentNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsEditing(true);
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);
      if (currentNote && currentNote.id === noteId) {
        setCurrentNote(null);
        setIsEditing(false);
      }
    }
  };

  const handleSelectNote = (note) => {
    if (!isEditing) {
      setCurrentNote(note);
      setNoteTitle(note.title);
      setNoteContent(note.content);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (currentNote) {
      setNoteTitle(currentNote.title);
      setNoteContent(currentNote.content);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setCurrentNote(null);
    }
  };

  return (
    <section
      id="notes-widget"
      data-widget="notes-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[360px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent flex justify-between items-center">
        <h2 className="text-xl font-semibold">Quick Notes</h2>
        <button
          onClick={handleNewNote}
          className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm"
        >
          New
        </button>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Notes List */}
        <div className="w-1/3 border-r dark:border-dark-accent light:border-light-accent overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-2 text-sm text-gray-500 text-center">
              No notes yet
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`p-2 border-b dark:border-dark-accent/50 light:border-light-accent/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentNote && currentNote.id === note.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="text-sm font-medium truncate">{note.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {(note.content || '').substring(0, 30)}...
                </div>
              </div>
            ))
          )}
        </div>

        {/* Note Editor/Viewer */}
        <div className="flex-1 flex flex-col">
          {isEditing ? (
            <>
              <div className="p-2 border-b dark:border-dark-accent light:border-light-accent">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full p-2 text-sm dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex-1 p-2">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full h-full p-2 text-sm dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="p-2 border-t dark:border-dark-accent light:border-light-accent flex gap-2">
                <button
                  onClick={handleSaveNote}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : currentNote ? (
            <>
              <div className="p-2 border-b dark:border-dark-accent light:border-light-accent flex justify-between items-center">
                <h3 className="font-medium text-sm truncate">{currentNote.title}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditNote(currentNote)}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteNote(currentNote.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex-1 p-2 overflow-y-auto">
                <div className="text-sm whitespace-pre-wrap">{currentNote.content}</div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Select a note or create a new one
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NotesWidget;