import React, { useState, useEffect, useRef } from 'react';
import { WorkTimeTracker } from '../../utils/workTimeTracker';

const PomodoroWidget = () => {
  const [workMinutes, setWorkMinutes] = useState(() => {
    return parseInt(localStorage.getItem('workMinutes') || '25', 10);
  });
  const [breakMinutes, setBreakMinutes] = useState(() => {
    return parseInt(localStorage.getItem('breakMinutes') || '5', 10);
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const [millisecondsLeft, setMillisecondsLeft] = useState(() => {
    return workMinutes * 60 * 1000;
  });
  const [totalWorkMilliseconds, setTotalWorkMilliseconds] = useState(() => {
    return parseInt(localStorage.getItem('totalWorkMilliseconds') || '0', 10);
  });
  const [showSettings, setShowSettings] = useState(false);
  const [workInput, setWorkInput] = useState(workMinutes);
  const [breakInput, setBreakInput] = useState(breakMinutes);
  const [todayWorkTime, setTodayWorkTime] = useState(0);
  
  const timerRef = useRef(null);
  const elapsedWorkTimeRef = useRef(0);

  // Load today's work time and listen for updates
  useEffect(() => {
    const updateTodayWorkTime = () => {
      const today = WorkTimeTracker.getTodayDateString();
      const workTime = WorkTimeTracker.getWorkTimeForDate(today);
      setTodayWorkTime(workTime);
    };

    // Initial load
    updateTodayWorkTime();

    // Listen for work time updates
    const handleWorkTimeUpdate = () => {
      updateTodayWorkTime();
    };

    window.addEventListener('workTimeUpdated', handleWorkTimeUpdate);
    
    return () => {
      window.removeEventListener('workTimeUpdated', handleWorkTimeUpdate);
    };
  }, []);

  // Update millisecondsLeft when workMinutes changes
  useEffect(() => {
    if (isWork) {
      setMillisecondsLeft(workMinutes * 60 * 1000);
    }
  }, [workMinutes, isWork]);

  // Update millisecondsLeft when breakMinutes changes
  useEffect(() => {
    if (!isWork) {
      setMillisecondsLeft(breakMinutes * 60 * 1000);
    }
  }, [breakMinutes, isWork]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('workMinutes', workMinutes.toString());
  }, [workMinutes]);

  useEffect(() => {
    localStorage.setItem('breakMinutes', breakMinutes.toString());
  }, [breakMinutes]);

  useEffect(() => {
    localStorage.setItem('totalWorkMilliseconds', totalWorkMilliseconds.toString());
  }, [totalWorkMilliseconds]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setMillisecondsLeft(prev => {
          const newTime = prev - 10;
          
          if (isWork) {
            elapsedWorkTimeRef.current += 10;
            
            // Track daily work time every 10ms
            const today = WorkTimeTracker.getTodayDateString();
            WorkTimeTracker.addWorkTime(today, 10);
            
            if (elapsedWorkTimeRef.current >= 60000) { // 1 minute passed
              setTotalWorkMilliseconds(prevTotal => prevTotal + 60000);
              elapsedWorkTimeRef.current = 0; // Reset for next minute
            }
          }
          
          if (newTime < 0) {
            // Switch modes
            setIsWork(prevIsWork => {
              const newIsWork = !prevIsWork;
              // lightweight notification
              try {
                window.navigator.vibrate && window.navigator.vibrate(200);
              } catch (e) {}
              if (newIsWork) {
                alert('Break over — back to work!');
              } else {
                alert('Work session complete — take a break!');
              }
              return newIsWork;
            });
            return (isWork ? breakMinutes : workMinutes) * 60 * 1000;
          }
          return newTime;
        });
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isWork, workMinutes, breakMinutes]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}:${milliseconds}`;
  };

  const startTimer = () => {
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsWork(true);
    setMillisecondsLeft(workMinutes * 60 * 1000);
    elapsedWorkTimeRef.current = 0;
  };

  const saveSettings = () => {
    const w = parseInt(workInput, 10) || workMinutes;
    const b = parseInt(breakInput, 10) || breakMinutes;
    if (w >= 1 && b >= 1) {
      setWorkMinutes(w);
      setBreakMinutes(b);
      resetTimer();
      setShowSettings(false);
    }
  };

  const totalWorkMinutes = Math.floor(totalWorkMilliseconds / (60 * 1000));

  return (
    <section
      id="pomodoro-widget"
      data-widget="pomodoro-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[360px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pomodoro Timer</h2>
        <button
          id="timer-settings"
          onClick={() => setShowSettings(!showSettings)}
          className="dark:text-dark-text light:text-light-text hover:opacity-90 p-2 rounded-full dark:hover:bg-dark-accent light:hover:bg-light-accent transition-all duration-300"
          aria-label="Timer settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          {showSettings && (
            <div id="timer-settings-panel" className="dark:bg-dark-accent light:bg-light-accent p-4 rounded-xl mb-3 transition-all duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm dark:text-dark-text/80 light:text-light-text/80 block mb-1">Work Time (min)</label>
                  <input
                    type="number"
                    id="work-time-input"
                    min="1"
                    max="60"
                    value={workInput}
                    onChange={(e) => setWorkInput(e.target.value)}
                    className="w-full px-3 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm dark:text-dark-text/80 light:text-light-text/80 block mb-1">Break Time (min)</label>
                  <input
                    type="number"
                    id="break-time-input"
                    min="1"
                    max="30"
                    value={breakInput}
                    onChange={(e) => setBreakInput(e.target.value)}
                    className="w-full px-3 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <button
                id="save-timer-settings"
                onClick={saveSettings}
                className="w-full mt-3 bg-primary dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Save Settings
              </button>
            </div>
          )}
          <div id="timer-display" className="text-5xl font-bold text-center my-4 transition-all duration-300">
            {formatTime(millisecondsLeft)}
          </div>
          <div className="flex justify-center gap-3">
            {isRunning ? (
              <button
                id="stop-timer"
                onClick={stopTimer}
                className="bg-error dark:text-dark-text light:text-light-text px-5 py-2 rounded-xl hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Stop
              </button>
            ) : (
              <button
                id="start-timer"
                onClick={startTimer}
                className="bg-success dark:text-dark-text light:text-light-text px-5 py-2 rounded-xl hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Start
              </button>
            )}
            <button
              id="reset-timer"
              onClick={resetTimer}
              className="bg-dark-accent light:bg-light-accent text-white light:text-dark-text px-5 py-2 rounded-xl hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="dark:bg-dark-accent light:bg-light-accent -mx-4 -mb-4 p-3 border-t dark:border-dark-accent light:border-light-accent rounded-b-2xl">
          <div className="text-center text-sm dark:text-dark-text/80 light:text-light-text/80 space-y-1">
            <p>Today: {WorkTimeTracker.formatTime(todayWorkTime)}</p>
            <p className="text-xs">Session Total: {totalWorkMinutes} mins</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PomodoroWidget;