// Main dashboard script: Todo list, Pomodoro timer, Notes, Calendar
document.addEventListener('DOMContentLoaded', () => {
	// ---------- Helpers ----------
	const qs = (sel) => {
		const element = document.querySelector(sel);
		console.log(`Query selector "${sel}" result:`, element);
		return element;
	};
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

	// ---------- EXPENSE MANAGER ----------
	const addExpenseBtn = qs('#add-expense-btn');
	const setBudgetBtn = qs('#set-budget-btn');
	const saveExpenseBtn = qs('#save-expense');
	const cancelExpenseBtn = qs('#cancel-expense');
	const saveBudgetBtn = qs('#save-budget');
	const cancelBudgetBtn = qs('#cancel-budget');
	const expenseList = qs('#expense-list');
	const budgetAmountDisplay = qs('#budget-amount');
	const spentAmountDisplay = qs('#spent-amount');
	const remainingAmountDisplay = qs('#remaining-amount');
	const addExpensePanel = qs('#add-expense-panel');
	const setBudgetPanel = qs('#set-budget-panel');

	// Expense form elements
	const expenseAmountInput = qs('#expense-amount');
	const expenseCategorySelect = qs('#expense-category');
	const expenseDateInput = qs('#expense-date');
	const expenseDescriptionInput = qs('#expense-description');
	const budgetAmountInput = qs('#budget-amount-input');

	// Initialize with today's date
	if (expenseDateInput) {
		const today = new Date();
		expenseDateInput.value = today.toISOString().split('T')[0];
	}

	// Load data from localStorage
	let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
	let budget = JSON.parse(localStorage.getItem('expense-budget') || '{"amount": 0, "month": ""}');

	// Set current month for budget if not set
	const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
	if (budget.month !== currentMonth) {
		budget = { amount: budget.amount, month: currentMonth };
		localStorage.setItem('expense-budget', JSON.stringify(budget));
	}

	// Save functions
	const saveExpenses = () => localStorage.setItem('expenses', JSON.stringify(expenses));
	const saveBudget = () => localStorage.setItem('expense-budget', JSON.stringify(budget));

	// Format currency
	function formatCurrency(amount) {
		return '$' + amount.toFixed(2);
	}

	// Get current month's expenses
	function getCurrentMonthExpenses() {
		const now = new Date();
		const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
		return expenses.filter(expense => expense.date.startsWith(currentMonth));
	}

	// Calculate total expenses for current month
	function calculateTotalExpenses() {
		const currentMonthExpenses = getCurrentMonthExpenses();
		return currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
	}

	// Update budget display
	function updateBudgetDisplay() {
		const totalExpenses = calculateTotalExpenses();
		const remaining = budget.amount - totalExpenses;

		if (budgetAmountDisplay) budgetAmountDisplay.textContent = formatCurrency(budget.amount);
		if (spentAmountDisplay) spentAmountDisplay.textContent = formatCurrency(totalExpenses);
		if (remainingAmountDisplay) remainingAmountDisplay.textContent = formatCurrency(remaining);
	}

	// Render expenses
	function renderExpenses() {
		if (!expenseList) return;
		expenseList.innerHTML = '';

		const currentMonthExpenses = getCurrentMonthExpenses();
		// Sort by date descending (newest first)
		currentMonthExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

		currentMonthExpenses.forEach((expense, i) => {
			const li = document.createElement('li');
			li.className = 'expense-item p-2 rounded-lg dark:bg-dark-widget light:bg-light-widget flex justify-between items-center';

			const date = new Date(expense.date);
			const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

			li.innerHTML = `
				<div class="flex items-center">
					<div class="mr-3">
						<div class="font-semibold">${formatCurrency(expense.amount)}</div>
						<div class="text-xs dark:text-dark-text/60 light:text-light-text/60">${dateStr}</div>
					</div>
					<div>
						<div class="font-medium">${expense.description || 'Untitled Expense'}</div>
						<div class="text-xs dark:text-dark-text/60 light:text-light-text/60 capitalize">${expense.category}</div>
					</div>
				</div>
				<button class="expense-delete text-red-500 hover:text-red-700" data-id="${expense.id}">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
				</button>
			`;

			expenseList.appendChild(li);
		});

		// Add event listeners to delete buttons
		qsa('.expense-delete').forEach(btn => {
			btn.addEventListener('click', () => {
				const id = btn.getAttribute('data-id');
				deleteExpense(id);
			});
		});
	}

	// Add expense
	function addExpense() {
		if (!expenseAmountInput || !expenseDateInput) return;

		const amount = parseFloat(expenseAmountInput.value);
		const category = expenseCategorySelect ? expenseCategorySelect.value : 'other';
		const date = expenseDateInput.value;
		const description = expenseDescriptionInput ? expenseDescriptionInput.value.trim() : '';

		if (isNaN(amount) || amount <= 0 || !date) {
			alert('Please enter a valid amount and date.');
			return;
		}

		const expense = {
			id: 'exp_' + Date.now(), // Unique ID
			amount: amount,
			category: category,
			date: date,
			description: description,
			timestamp: Date.now()
		};

		expenses.push(expense);
		saveExpenses();
		renderExpenses();
		updateBudgetDisplay();

		// Reset form
		expenseAmountInput.value = '';
		if (expenseDescriptionInput) expenseDescriptionInput.value = '';
		
		// Hide panel
		if (addExpensePanel) addExpensePanel.classList.add('hidden');
	}

	// Delete expense
	function deleteExpense(id) {
		expenses = expenses.filter(expense => expense.id !== id);
		saveExpenses();
		renderExpenses();
		updateBudgetDisplay();
	}

	// Set budget
	function setBudget() {
		if (!budgetAmountInput) return;

		const amount = parseFloat(budgetAmountInput.value);

		if (isNaN(amount) || amount <= 0) {
			alert('Please enter a valid budget amount.');
			return;
		}

		budget.amount = amount;
		budget.month = new Date().toISOString().slice(0, 7); // Update to current month
		saveBudget();
		updateBudgetDisplay();

		// Hide panel
		if (setBudgetPanel) setBudgetPanel.classList.add('hidden');
	}

	// Event listeners
	if (addExpenseBtn) addExpenseBtn.addEventListener('click', () => {
		if (addExpensePanel) addExpensePanel.classList.remove('hidden');
		if (setBudgetPanel) setBudgetPanel.classList.add('hidden');
	});

	if (setBudgetBtn) setBudgetBtn.addEventListener('click', () => {
		if (setBudgetPanel) setBudgetPanel.classList.remove('hidden');
		if (addExpensePanel) addExpensePanel.classList.add('hidden');
		if (budgetAmountInput) budgetAmountInput.value = budget.amount;
	});

	if (saveExpenseBtn) saveExpenseBtn.addEventListener('click', addExpense);
	if (cancelExpenseBtn) cancelExpenseBtn.addEventListener('click', () => {
		if (addExpensePanel) addExpensePanel.classList.add('hidden');
	});

	if (saveBudgetBtn) saveBudgetBtn.addEventListener('click', setBudget);
	if (cancelBudgetBtn) cancelBudgetBtn.addEventListener('click', () => {
		if (setBudgetPanel) setBudgetPanel.classList.add('hidden');
	});

	// Initialize display
	updateBudgetDisplay();
	renderExpenses();

	// ---------- CALCULATOR ----------
	const calcDisplay = qs('#calc-display');
	const calcHistory = qs('#calc-history');
	const calcButtons = qsa('.calc-btn');
	const calcModeToggle = qs('#calc-mode-toggle');
	const calcBasicButtons = qs('#calc-basic-buttons');
	const calcScientificButtons = qs('#calc-scientific-buttons');
	
	let currentInput = '0';
	let previousInput = '';
	let operation = null;
	let shouldResetDisplay = false;
	let memory = 0;
	let history = '';
	let isScientificMode = false;
	
	// Load memory from localStorage
	memory = parseFloat(localStorage.getItem('calculator-memory')) || 0;
	isScientificMode = localStorage.getItem('calculator-mode') === 'scientific';
	
	// Initialize mode
	if (isScientificMode) {
		if (calcScientificButtons) calcScientificButtons.classList.remove('hidden');
		if (calcModeToggle) calcModeToggle.textContent = 'Basic';
	} else {
		if (calcScientificButtons) calcScientificButtons.classList.add('hidden');
		if (calcModeToggle) calcModeToggle.textContent = 'Scientific';
	}
	
	function updateDisplay() {
		if (calcDisplay) calcDisplay.textContent = currentInput;
		if (calcHistory) calcHistory.textContent = history;
	}
	
	function clearAll() {
		currentInput = '0';
		previousInput = '';
		operation = null;
		history = '';
		shouldResetDisplay = false;
		updateDisplay();
	}
	
	function clearEntry() {
		currentInput = '0';
		shouldResetDisplay = false;
		updateDisplay();
	}
	
	function backspace() {
		if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
			currentInput = '0';
		} else {
			currentInput = currentInput.slice(0, -1);
		}
		updateDisplay();
	}
	
	function appendNumber(number) {
		if (shouldResetDisplay) {
			currentInput = '0';
			shouldResetDisplay = false;
		}
		if (number === '.' && currentInput.includes('.')) return;
		if (currentInput === '0' && number !== '.') {
			currentInput = number;
		} else {
			currentInput += number;
		}
		updateDisplay();
	}
	
	function chooseOperation(op) {
		if (currentInput === '') return;
		if (previousInput !== '') {
			calculate();
		}
		operation = op;
		previousInput = currentInput;
		shouldResetDisplay = true;
		history = `${previousInput} ${op}`;
		updateDisplay();
	}
	
	function calculate() {
		let computation;
		const prev = parseFloat(previousInput);
		const current = parseFloat(currentInput);
		if (isNaN(prev) || isNaN(current)) return;
		
		switch (operation) {
			case '+':
				computation = prev + current;
				break;
			case '-':
				computation = prev - current;
				break;
			case '*':
				computation = prev * current;
				break;
			case '/':
				computation = prev / current;
				break;
			case '^':
				computation = Math.pow(prev, current);
				break;
			default:
				return;
		}
		
		history = `${previousInput} ${operation} ${currentInput} =`;
		currentInput = computation.toString();
		operation = null;
		previousInput = '';
		shouldResetDisplay = true;
		updateDisplay();
	}
	
	function calculateScientific(func) {
		const current = parseFloat(currentInput);
		if (isNaN(current)) return;
		
		let result;
		switch (func) {
			case 'sin':
				result = Math.sin(current * Math.PI / 180); // Convert to radians
				history = `sin(${current}) =`;
				break;
			case 'cos':
				result = Math.cos(current * Math.PI / 180); // Convert to radians
				history = `cos(${current}) =`;
				break;
			case 'tan':
				result = Math.tan(current * Math.PI / 180); // Convert to radians
				history = `tan(${current}) =`;
				break;
			case 'log':
				if (current <= 0) {
					currentInput = 'Error';
					updateDisplay();
					return;
				}
				result = Math.log10(current);
				history = `log(${current}) =`;
				break;
			case 'ln':
				if (current <= 0) {
					currentInput = 'Error';
					updateDisplay();
					return;
				}
				result = Math.log(current);
				history = `ln(${current}) =`;
				break;
			case 'sqrt':
				if (current < 0) {
					currentInput = 'Error';
					updateDisplay();
					return;
				}
				result = Math.sqrt(current);
				history = `√(${current}) =`;
				break;
			case 'factorial':
				if (current < 0 || !Number.isInteger(current)) {
					currentInput = 'Error';
					updateDisplay();
					return;
				}
				result = factorial(current);
				history = `fact(${current}) =`;
				break;
			case 'pi':
				result = Math.PI;
				history = `π =`;
				break;
			case 'reciprocal':
				if (current === 0) {
					currentInput = 'Error';
					updateDisplay();
					return;
				}
				result = 1 / current;
				history = `1/(${current}) =`;
				break;
			case 'percentage':
				result = current / 100;
				history = `${current}% =`;
				break;
			case 'plusMinus':
				result = current * -1;
				history = `(-${current}) =`;
				break;
			default:
				return;
		}
		
		currentInput = result.toString();
		shouldResetDisplay = true;
		updateDisplay();
	}
	
	function factorial(n) {
		if (n === 0 || n === 1) return 1;
		let result = 1;
		for (let i = 2; i <= n; i++) {
			result *= i;
		}
		return result;
	}
	
	// Memory functions
	function memoryClear() {
		memory = 0;
		localStorage.setItem('calculator-memory', memory.toString());
	}
	
	function memoryRecall() {
		currentInput = memory.toString();
		shouldResetDisplay = false;
		updateDisplay();
	}
	
	function memoryAdd() {
		const current = parseFloat(currentInput);
		if (!isNaN(current)) {
			memory += current;
			localStorage.setItem('calculator-memory', memory.toString());
		}
	}
	
	function memorySubtract() {
		const current = parseFloat(currentInput);
		if (!isNaN(current)) {
			memory -= current;
			localStorage.setItem('calculator-memory', memory.toString());
		}
	}
	
	function memoryStore() {
		const current = parseFloat(currentInput);
		if (!isNaN(current)) {
			memory = current;
			localStorage.setItem('calculator-memory', memory.toString());
		}
	}
	
	// Toggle calculator mode
	function toggleCalculatorMode() {
		isScientificMode = !isScientificMode;
		localStorage.setItem('calculator-mode', isScientificMode ? 'scientific' : 'basic');
		
		if (isScientificMode) {
			if (calcScientificButtons) calcScientificButtons.classList.remove('hidden');
			if (calcModeToggle) calcModeToggle.textContent = 'Basic';
		} else {
			if (calcScientificButtons) calcScientificButtons.classList.add('hidden');
			if (calcModeToggle) calcModeToggle.textContent = 'Scientific';
		}
	}
	
	// Keyboard support
	function handleKeyboardInput(e) {
		// Prevent default behavior for keys we're handling
		if (['0','1','2','3','4','5','6','7','8','9','+','-','*','/','.','Enter','Escape','Backspace','%'].includes(e.key)) {
			e.preventDefault();
		}
		
		// Handle number keys
		if (/[0-9]/.test(e.key)) {
			appendNumber(e.key);
		}
		// Handle operator keys
		else if (e.key === '+') {
			chooseOperation('+');
		} else if (e.key === '-') {
			chooseOperation('-');
		} else if (e.key === '*') {
			chooseOperation('*');
		} else if (e.key === '/') {
			chooseOperation('/');
		} else if (e.key === '.') {
			appendNumber('.');
		} else if (e.key === 'Enter' || e.key === '=') {
			calculate();
		} else if (e.key === 'Escape') {
			clearAll();
		} else if (e.key === 'Backspace') {
			backspace();
		} else if (e.key === '%') {
			calculateScientific('percentage');
		}
	}
	
	// Add event listeners to calculator buttons
	calcButtons.forEach(button => {
		button.addEventListener('click', () => {
			const action = button.getAttribute('data-action');
			const value = button.getAttribute('data-value');
			
			if (value !== null) {
				appendNumber(value);
			} else if (action !== null) {
				switch (action) {
					case 'clear':
						clearAll();
						break;
					case 'clearEntry':
						clearEntry();
						break;
					case 'backspace':
						backspace();
						break;
					case 'add':
					case 'subtract':
					case 'multiply':
					case 'divide':
					case 'power':
						chooseOperation(action === 'multiply' ? '*' : action === 'divide' ? '/' : action === 'power' ? '^' : action);
						break;
					case 'equals':
						calculate();
						break;
					case 'sin':
					case 'cos':
					case 'tan':
					case 'log':
					case 'ln':
					case 'sqrt':
					case 'factorial':
					case 'pi':
					case 'reciprocal':
					case 'percentage':
					case 'plusMinus':
						calculateScientific(action);
						break;
					case 'memoryClear':
						memoryClear();
						break;
					case 'memoryRecall':
						memoryRecall();
						break;
					case 'memoryAdd':
						memoryAdd();
						break;
					case 'memorySubtract':
						memorySubtract();
						break;
					case 'memoryStore':
						memoryStore();
						break;
					case 'openParen':
						appendNumber('(');
						break;
					case 'closeParen':
						appendNumber(')');
						break;
				}
			}
		});
	});
	
	// Add event listener for mode toggle
	if (calcModeToggle) {
		calcModeToggle.addEventListener('click', toggleCalculatorMode);
	}
	
	// Add keyboard event listener
	document.addEventListener('keydown', handleKeyboardInput);

	// Initialize display
	updateDisplay();

	// ---------- WORD OF THE DAY ----------
	const wordWidget = qs('#word-widget');
	console.log('Word widget element:', wordWidget);
	
	const wordLoading = qs('#word-loading');
	console.log('Word loading element:', wordLoading);
	
	const wordDisplay = qs('#word-display');
	console.log('Word display element:', wordDisplay);
	
	const wordWord = qs('#word-word');
	console.log('Word word element:', wordWord);
	
	const wordPronunciation = qs('#word-pronunciation');
	console.log('Word pronunciation element:', wordPronunciation);
	
	const wordDefinition = qs('#word-definition');
	console.log('Word definition element:', wordDefinition);
	
	const wordExample = qs('#word-example');
	console.log('Word example element:', wordExample);
	
	// A collection of words with definitions
	const wordCollection = [
		{
			word: "Ephemeral",
			pronunciation: "ih-FEM-er-uhl",
			definition: "Lasting for a very short time; transitory",
			example: "The ephemeral beauty of cherry blossoms reminds us to appreciate the present moment."
		},
		{
			word: "Serendipity",
			pronunciation: "ser-en-DIP-i-tee",
			definition: "The occurrence of events by chance in a happy or beneficial way",
			example: "Finding my favorite book at the flea market was a delightful serendipity."
		},
		{
			word: "Ubiquitous",
			pronunciation: "yoo-BIK-wi-tus",
			definition: "Present, appearing, or found everywhere",
			example: "Mobile phones have become ubiquitous in modern society."
		},
		{
			word: "Eloquent",
			pronunciation: "EL-oh-kwent",
			definition: "Fluent or persuasive in speaking or writing",
			example: "Her eloquent speech moved the entire audience to tears."
		},
		{
			word: "Resilient",
			pronunciation: "ri-ZIL-yent",
			definition: "Able to withstand or recover quickly from difficult conditions",
			example: "Children are often remarkably resilient in the face of adversity."
		},
		{
			word: "Mellifluous",
			pronunciation: "meh-LIF-loo-us",
			definition: "Sweet or musical; pleasant to hear",
			example: "The singer's mellifluous voice captivated everyone in the concert hall."
		},
		{
			word: "Pragmatic",
			pronunciation: "prag-MAT-ik",
			definition: "Dealing with things sensibly and realistically",
			example: "We need a pragmatic approach to solve this complex problem."
		},
		{
			word: "Quintessential",
			pronunciation: "kwin-ti-SEN-shul",
			definition: "Representing the most perfect or typical example of a quality or class",
			example: "This dish is the quintessential representation of Italian cuisine."
		},
		{
			word: "Ineffable",
			pronunciation: "in-EF-uh-bul",
			definition: "Too great or extreme to be expressed in words",
			example: "The ineffable beauty of the sunset left us speechless."
		},
		{
			word: "Surreptitious",
			pronunciation: "sur-up-TISH-us",
			definition: "Kept secret, especially because it would not be approved of",
			example: "He took a surreptitious glance at his watch during the meeting."
		}
	];
	
	console.log('Word collection initialized:', wordCollection);
	
	// Function to get a random word from the collection
	function getRandomWord() {
		console.log('Getting random word from local collection');
		const randomIndex = Math.floor(Math.random() * wordCollection.length);
		const selectedWord = wordCollection[randomIndex];
		console.log('Selected local word:', selectedWord);
		return selectedWord;
	}
	
	function displayWord(wordData) {
		console.log('Displaying word data:', wordData);
		
		if (wordWord) {
			wordWord.textContent = wordData.word || '';
			console.log('Set word:', wordData.word);
		}
		
		if (wordPronunciation) {
			// Display only English pronunciation, no IPA
			const pronunciationText = wordData.pronunciation || '';
			
			console.log('Pronunciation text:', pronunciationText);
			
			// Set pronunciation text without IPA
			wordPronunciation.textContent = pronunciationText;
			console.log('Set pronunciation only');
		}
		
		if (wordDefinition) {
			wordDefinition.textContent = wordData.definition || '';
			console.log('Set definition:', wordData.definition);
		}
		
		if (wordExample) {
			if (wordData.example) {
				wordExample.textContent = `"${wordData.example}"`;
				console.log('Set example:', wordData.example);
			} else {
				wordExample.textContent = '';
				console.log('Cleared example');
			}
		}
		
		// Add speak button
		const speakButton = document.createElement('button');
		speakButton.id = 'word-speak';
		speakButton.className = 'mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm';
		speakButton.textContent = '🔊 Pronounce';
		speakButton.addEventListener('click', () => speakWord(wordData.word));
		
		// Clear any existing speak button
		const existingSpeakButton = document.getElementById('word-speak');
		if (existingSpeakButton) existingSpeakButton.remove();
		
		// Add speak button to the word display
		if (wordDisplay) {
			wordDisplay.appendChild(speakButton);
			console.log('Added speak button');
		}
		
		// Hide loading and show word display
		if (wordLoading) {
			wordLoading.classList.add('hidden');
			console.log('Hidden loading');
		}
		if (wordDisplay) {
			wordDisplay.classList.remove('hidden');
			console.log('Shown word display');
		}
	}
	
	// Function to speak the word using Web Speech API
	function speakWord(word) {
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(word);
			utterance.lang = 'en-US';
			utterance.rate = 0.8; // Slightly slower for clarity
			speechSynthesis.speak(utterance);
		} else {
			console.warn('Speech Synthesis not supported in this browser');
			// Fallback alert if needed
			// alert('Sorry, your browser does not support text-to-speech.');
		}
	}
	
	// Initialize word widget with a random word from local collection
	if (wordWidget) {
		console.log('Initializing word widget');
		try {
			// Get and display a random word from local collection
			const randomWord = getRandomWord();
			displayWord(randomWord);
		} catch (error) {
			console.error('Error loading word:', error);
			if (wordLoading) wordLoading.textContent = 'Failed to load word';
		}
	} else {
		console.log('Word widget not found');
	}

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

