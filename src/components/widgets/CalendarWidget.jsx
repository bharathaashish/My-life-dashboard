import React, { useState, useEffect } from 'react';

const CalendarWidget = () => {
  const [visibleDate, setVisibleDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem('calendar-events');
    return savedEvents ? JSON.parse(savedEvents) : {};
  });
  const [eventInput, setEventInput] = useState('');

  useEffect(() => {
    localStorage.setItem('calendar-events', JSON.stringify(events));
  }, [events]);

  const renderCalendar = () => {
    const year = visibleDate.getFullYear();
    const month = visibleDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }
    
    // Cells for each day of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = dateStr === selectedDate;
      const hasEvent = events[dateStr] && events[dateStr].length > 0;
      
      days.push(
        <button
          key={d}
          className={`calendar-cell rounded-lg flex items-center justify-center h-8 w-8 ${isSelected ? 'bg-primary dark:text-dark-text light:text-light-text' : ''} ${hasEvent ? 'has-event border-b-2 border-primary' : ''} hover:bg-opacity-10 dark:hover:bg-dark-accent light:hover:bg-light-accent transition-all duration-300`}
          onClick={() => setSelectedDate(dateStr)}
        >
          {d}
        </button>
      );
    }
    
    return days;
  };

  const renderEvents = () => {
    const dateEvents = events[selectedDate] || [];
    
    return dateEvents.map((event, index) => (
      <li key={index} className="event-item flex items-center justify-between p-3 rounded-xl hover:bg-opacity-10 dark:hover:bg-dark-accent light:hover:bg-light-accent transition-all duration-300">
        <span>{event}</span>
        <button
          className="event-delete text-error hover:text-red-700 font-bold transition-colors duration-300"
          onClick={() => {
            const newEvents = {...events};
            newEvents[selectedDate].splice(index, 1);
            if (newEvents[selectedDate].length === 0) {
              delete newEvents[selectedDate];
            }
            setEvents(newEvents);
          }}
          aria-label="Delete event"
        >
          ✕
        </button>
      </li>
    ));
  };

  const addEvent = () => {
    if (eventInput.trim() === '') return;
    
    const newEvents = {...events};
    if (!newEvents[selectedDate]) {
      newEvents[selectedDate] = [];
    }
    newEvents[selectedDate].push(eventInput.trim());
    setEvents(newEvents);
    setEventInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addEvent();
    }
  };

  const prevMonth = () => {
    setVisibleDate(new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setVisibleDate(new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 1));
  };

  const monthYearString = visibleDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <section
      id="calendar-widget"
      data-widget="calendar-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[320px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent">
        <h2 className="text-xl font-semibold">Calendar</h2>
      </div>
      <div className="flex-1 p-4 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <button
            id="cal-prev"
            onClick={prevMonth}
            className="text-2xl dark:text-dark-text light:text-light-text hover:opacity-90 px-3 py-1 rounded-full hover:bg-dark-accent light:hover:bg-light-accent transition-all duration-300"
          >
            ‹
          </button>
          <div id="cal-month-year" className="text-lg font-medium">
            {monthYearString}
          </div>
          <button
            id="cal-next"
            onClick={nextMonth}
            className="text-2xl dark:text-dark-text light:text-light-text hover:opacity-90 px-3 py-1 rounded-full hover:bg-dark-accent light:hover:bg-light-accent transition-all duration-300"
          >
            ›
          </button>
        </div>
 
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <div className="grid grid-cols-7 gap-1 text-xs mb-1">
              <div className="text-center font-medium p-1">Su</div>
              <div className="text-center font-medium p-1">Mo</div>
              <div className="text-center font-medium p-1">Tu</div>
              <div className="text-center font-medium p-1">We</div>
              <div className="text-center font-medium p-1">Th</div>
              <div className="text-center font-medium p-1">Fr</div>
              <div className="text-center font-medium p-1">Sa</div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div id="calendar-days" className="grid grid-cols-7 gap-1 text-xs">
                {renderCalendar()}
              </div>
            </div>
          </div>
          <div id="calendar-events" className="calendar-events flex flex-col min-h-0">
            <h3 id="events-date-title" className="text-sm font-medium mb-2 mt-1">
              Events — {selectedDate}
            </h3>
            <ul id="events-list" className="space-y-2 mb-2 overflow-y-auto flex-1 min-h-0">
              {renderEvents()}
            </ul>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                id="event-input"
                value={eventInput}
                onChange={(e) => setEventInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="New event for selected date"
                className="flex-1 px-4 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                id="add-event-btn"
                onClick={addEvent}
                className="bg-primary dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarWidget;