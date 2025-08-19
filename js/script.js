// Main dashboard script: Todo list, Pomodoro timer, Notes, Calendar
document.addEventListener('DOMContentLoaded', () => {
	// ---------- Helpers ----------
	const qs = (sel) => document.querySelector(sel);
	const qsa = (sel) => Array.from(document.querySelectorAll(sel));

	// ---------- TODO LIST ----------
	const todoInput = qs('#todo-input');
	const addTaskBtn = qs('#add-task');
	const todoList = qs('#todo-list');
	let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

	const saveTasks = () => localStorage.setItem('tasks', JSON.stringify(tasks));

	function renderTasks() {
		if (!todoList) return;
		todoList.innerHTML = '';
		tasks.forEach((t, i) => {
			const li = document.createElement('li');
			li.className = 'todo-item';

			const span = document.createElement('span');
			span.textContent = t.text;
			span.className = t.completed ? 'completed' : '';
			span.addEventListener('click', () => toggleTask(i));

			const del = document.createElement('button');
			del.textContent = '✕';
			del.className = 'task-delete';
			del.addEventListener('click', () => deleteTask(i));

			li.appendChild(span);
			li.appendChild(del);
			todoList.appendChild(li);
		});
	}

	function addTask() {
		if (!todoInput) return;
		const value = todoInput.value.trim();
		if (!value) return;
		tasks.push({ text: value, completed: false });
		todoInput.value = '';
		saveTasks();
		renderTasks();
	}

	function toggleTask(i) {
		tasks[i].completed = !tasks[i].completed;
		saveTasks();
		renderTasks();
	}

	function deleteTask(i) {
		tasks.splice(i, 1);
		saveTasks();
		renderTasks();
	}

	if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);
	if (todoInput) todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
	renderTasks();

	// ---------- POMODORO TIMER ----------
	let workMinutes = parseInt(localStorage.getItem('workMinutes') || '25', 10);
	let breakMinutes = parseInt(localStorage.getItem('breakMinutes') || '5', 10);
	let isRunning = false;
	let isWork = true;
	let secondsLeft = workMinutes * 60;
	let timerId = null;

	const timerDisplay = qs('#timer-display');
	const startBtn = qs('#start-timer');
	const stopBtn = qs('#stop-timer');
	const resetBtn = qs('#reset-timer');
	const settingsBtn = qs('#timer-settings');
	const settingsPanel = qs('#timer-settings-panel');
	const workInput = qs('#work-time-input');
	const breakInput = qs('#break-time-input');
	const saveSettingsBtn = qs('#save-timer-settings');

	function formatTime(s) {
		const m = Math.floor(s / 60).toString().padStart(2, '0');
		const sec = (s % 60).toString().padStart(2, '0');
		return `${m}:${sec}`;
	}

	function updateTimerDisplay() {
		if (timerDisplay) timerDisplay.textContent = formatTime(secondsLeft);
	}

	function tick() {
		secondsLeft -= 1;
		if (secondsLeft < 0) {
			// Switch modes
			isWork = !isWork;
			secondsLeft = (isWork ? workMinutes : breakMinutes) * 60;
			// lightweight notification
			try { window.navigator.vibrate && window.navigator.vibrate(200); } catch (e) {}
			if (isWork) alert('Break over — back to work!'); else alert('Work session complete — take a break!');
		}
		updateTimerDisplay();
	}

	function startTimer() {
		if (isRunning) return;
		isRunning = true;
		timerId = setInterval(tick, 1000);
	}

	function stopTimer() {
		isRunning = false;
		if (timerId) { clearInterval(timerId); timerId = null; }
	}

	function resetTimer() {
		stopTimer();
		isWork = true;
		secondsLeft = workMinutes * 60;
		updateTimerDisplay();
	}

	if (startBtn) startBtn.addEventListener('click', startTimer);
	if (stopBtn) stopBtn.addEventListener('click', stopTimer);
	if (resetBtn) resetBtn.addEventListener('click', resetTimer);
	if (settingsBtn) settingsBtn.addEventListener('click', () => settingsPanel && settingsPanel.classList.toggle('hidden'));

	if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
		const w = parseInt(workInput.value, 10) || workMinutes;
		const b = parseInt(breakInput.value, 10) || breakMinutes;
		if (w >= 1 && b >= 1) {
			workMinutes = w; breakMinutes = b;
			localStorage.setItem('workMinutes', String(workMinutes));
			localStorage.setItem('breakMinutes', String(breakMinutes));
			resetTimer();
			settingsPanel && settingsPanel.classList.add('hidden');
		}
	});

	// initialize timer inputs and display
	if (workInput) workInput.value = String(workMinutes);
	if (breakInput) breakInput.value = String(breakMinutes);
	updateTimerDisplay();

	// ---------- NOTES ----------
	const notesArea = qs('#notes-area');
	if (notesArea) {
		notesArea.value = localStorage.getItem('notes') || '';
		notesArea.addEventListener('input', () => localStorage.setItem('notes', notesArea.value));
	}

	// ---------- CALENDAR & EVENTS ----------
	const calPrev = qs('#cal-prev');
	const calNext = qs('#cal-next');
	const calMonthYear = qs('#cal-month-year');
	const calDays = qs('#calendar-days');
	const eventsList = qs('#events-list');
	const eventsTitle = qs('#events-date-title');
	const eventInput = qs('#event-input');
	const addEventBtn = qs('#add-event-btn');

	let visible = new Date();
	let selected = (new Date()).toISOString().slice(0, 10);
	let events = JSON.parse(localStorage.getItem('calendar-events') || '{}');

	function fmtDate(d) { return d.toISOString().slice(0, 10); }

	function renderCalendar() {
		if (!calDays || !calMonthYear) return;
		const year = visible.getFullYear();
		const month = visible.getMonth();
		calMonthYear.textContent = visible.toLocaleString(undefined, { month: 'long', year: 'numeric' });
		calDays.innerHTML = '';

		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		for (let i = 0; i < firstDay; i++) {
			const cell = document.createElement('div'); cell.className = 'calendar-cell empty';
			calDays.appendChild(cell);
		}

		for (let d = 1; d <= daysInMonth; d++) {
			const btn = document.createElement('button');
			btn.className = 'calendar-cell';
			const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			btn.textContent = String(d);
			if (dateStr === selected) btn.classList.add('selected');
			if (events[dateStr] && events[dateStr].length) btn.classList.add('has-event');
			btn.addEventListener('click', () => { selected = dateStr; renderCalendar(); renderEvents(); });
			calDays.appendChild(btn);
		}
	}

	function renderEvents() {
		if (!eventsList || !eventsTitle) return;
		eventsTitle.textContent = `Events — ${selected}`;
		eventsList.innerHTML = '';
		const list = events[selected] || [];
		list.forEach((ev, i) => {
			const li = document.createElement('li'); li.className = 'event-item';
			const span = document.createElement('span'); span.textContent = ev;
			const del = document.createElement('button'); del.textContent = '✕'; del.className = 'event-delete';
			del.addEventListener('click', () => { list.splice(i, 1); events[selected] = list; localStorage.setItem('calendar-events', JSON.stringify(events)); renderEvents(); renderCalendar(); });
			li.appendChild(span); li.appendChild(del); eventsList.appendChild(li);
		});
	}

	function addEvent() {
		if (!eventInput) return;
		const text = eventInput.value.trim(); if (!text) return;
		if (!events[selected]) events[selected] = [];
		events[selected].push(text);
		localStorage.setItem('calendar-events', JSON.stringify(events));
		eventInput.value = '';
		renderEvents(); renderCalendar();
	}

	if (calPrev) calPrev.addEventListener('click', () => { visible = new Date(visible.getFullYear(), visible.getMonth() - 1, 1); renderCalendar(); });
	if (calNext) calNext.addEventListener('click', () => { visible = new Date(visible.getFullYear(), visible.getMonth() + 1, 1); renderCalendar(); });
	if (addEventBtn) addEventBtn.addEventListener('click', addEvent);
	if (eventInput) eventInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addEvent(); });

	renderCalendar(); renderEvents();
});

