// Main dashboard script: Todo list, Pomodoro timer, Notes, Calendar
document.addEventListener('DOMContentLoaded', () => {
	// ---------- Helpers ----------
	const qs = (sel) => document.querySelector(sel);
	const qsa = (sel) => Array.from(document.querySelectorAll(sel));

	// ---------- THEME / DARK MODE ----------
	const themeToggleBtn = qs('#theme-toggle');
	const lightIcon = qs('#light-icon');
	const darkIcon = qs('#dark-icon');

	function applyTheme(theme) {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
			if (lightIcon) lightIcon.classList.remove('hidden');
			if (darkIcon) darkIcon.classList.add('hidden');
		} else {
			document.documentElement.classList.remove('dark');
			if (lightIcon) lightIcon.classList.add('hidden');
			if (darkIcon) darkIcon.classList.remove('hidden');
		}
	}

	// Initialize theme from localStorage or system preference
	let storedTheme = localStorage.getItem('theme');
	if (!storedTheme) {
		storedTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
	}
	applyTheme(storedTheme);

	if (themeToggleBtn) {
		themeToggleBtn.addEventListener('click', () => {
			const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
			applyTheme(newTheme);
			localStorage.setItem('theme', newTheme);
		});
	}

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
	let millisecondsLeft = workMinutes * 60 * 1000;
	let timerId = null;
	let totalWorkMilliseconds = parseInt(localStorage.getItem('totalWorkMilliseconds') || '0', 10);

	const timerDisplay = qs('#timer-display');
	const startBtn = qs('#start-timer');
	const stopBtn = qs('#stop-timer');
	const resetBtn = qs('#reset-timer');
	const settingsBtn = qs('#timer-settings');
	const settingsPanel = qs('#timer-settings-panel');
	const workInput = qs('#work-time-input');
	const breakInput = qs('#break-time-input');
	const saveSettingsBtn = qs('#save-timer-settings');
	const workTotalDisplay = qs('#work-total');

	function formatTime(ms) {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
		const seconds = (totalSeconds % 60).toString().padStart(2, '0');
		const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
		return `${minutes}:${seconds}:${milliseconds}`;
	}

	function updateTimerDisplay() {
		if (timerDisplay) timerDisplay.textContent = formatTime(millisecondsLeft);
	}

	function updateWorkTotalDisplay() {
		if (workTotalDisplay) {
			const totalMinutes = Math.floor(totalWorkMilliseconds / (60 * 1000));
			workTotalDisplay.textContent = `Total Work Time: ${totalMinutes} mins`;
		}
	}

	let elapsedWorkTime = 0;

	function tick() {
		millisecondsLeft -= 10;
		
		if (isWork) {
			elapsedWorkTime += 10;
			if (elapsedWorkTime >= 60000) { // 1 minute passed
				totalWorkMilliseconds += 60000;
				localStorage.setItem('totalWorkMilliseconds', String(totalWorkMilliseconds));
				updateWorkTotalDisplay();
				elapsedWorkTime = 0; // Reset for next minute
			}
		}
		
		if (millisecondsLeft < 0) {
			// Switch modes
			isWork = !isWork;
			millisecondsLeft = (isWork ? workMinutes : breakMinutes) * 60 * 1000;
			// lightweight notification
			try { window.navigator.vibrate && window.navigator.vibrate(200); } catch (e) {}
			if (isWork) alert('Break over — back to work!'); else alert('Work session complete — take a break!');
		}
		updateTimerDisplay();
	}

	function startTimer() {
		if (isRunning) return;
		isRunning = true;
		timerId = setInterval(tick, 10);
	}

	function stopTimer() {
		isRunning = false;
		if (timerId) { clearInterval(timerId); timerId = null; }
	}

	function resetTimer() {
		stopTimer();
		isWork = true;
		millisecondsLeft = workMinutes * 60 * 1000;
		elapsedWorkTime = 0;
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
	updateWorkTotalDisplay();

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

	// DRAG & DROP: reorder widgets without changing their inner alignment
	const grid = qs('#dashboard-grid');
	function saveOrder() {
		if (!grid) return;
		const ids = Array.from(grid.querySelectorAll('section[data-widget]')).map(s => s.getAttribute('data-widget'));
		localStorage.setItem('widget-order', JSON.stringify(ids));
	}

	function applySavedOrder() {
		if (!grid) return;
		const raw = localStorage.getItem('widget-order');
		if (!raw) return;
		try {
			const ids = JSON.parse(raw);
			ids.forEach(id => {
				const el = grid.querySelector(`section[data-widget="${id}"]`);
				if (el) grid.appendChild(el);
			});
		} catch (e) { }
	}

	applySavedOrder();

	let dragSrc = null;

	function onDragStart(e) {
		dragSrc = this.closest('section[data-widget]');
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', dragSrc.getAttribute('data-widget'));
		// add dragging visual
		dragSrc.classList.add('dragging');
	}

	function onDragOver(e) {
		e.preventDefault();
		const sec = this.closest('section[data-widget]');
		if (sec && sec !== dragSrc) sec.classList.add('drag-over');
	}

	function onDragLeave(e) {
		const sec = this.closest('section[data-widget]');
		if (sec) sec.classList.remove('drag-over');
	}

	function onDrop(e) {
		e.preventDefault();
		const target = this.closest('section[data-widget]');
		if (!dragSrc || !target || dragSrc === target) return;
		const children = Array.from(grid.querySelectorAll('section[data-widget]'));
		const srcIndex = children.indexOf(dragSrc);
		const tgtIndex = children.indexOf(target);
		if (srcIndex < tgtIndex) grid.insertBefore(dragSrc, target.nextSibling);
		else grid.insertBefore(dragSrc, target);
		saveOrder();
		target.classList.remove('drag-over');
	}

	function onDragEnd() {
		qsa('.drag-over').forEach(el => el.classList.remove('drag-over'));
		qsa('.dragging').forEach(el => el.classList.remove('dragging'));
		dragSrc = null;
	}

	// wire up handles
	qsa('.drag-handle').forEach(handle => {
		handle.setAttribute('draggable', 'true');
		handle.addEventListener('dragstart', onDragStart);
		handle.addEventListener('dragend', onDragEnd);
		handle.addEventListener('dragover', onDragOver);
		handle.addEventListener('dragleave', onDragLeave);
		handle.addEventListener('drop', onDrop);
	});
});

