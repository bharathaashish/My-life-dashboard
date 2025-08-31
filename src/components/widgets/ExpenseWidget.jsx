import React, { useState, useEffect } from 'react';

const ExpenseWidget = () => {
  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem('expenses');
    return savedExpenses ? JSON.parse(savedExpenses) : [];
  });
  
  const [budget, setBudget] = useState(() => {
    const savedBudget = localStorage.getItem('expense-budget');
    if (savedBudget) {
      try {
        return JSON.parse(savedBudget);
      } catch (e) {
        return { amount: 0, month: '' };
      }
    }
    return { amount: 0, month: '' };
  });
  
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showBudgetPanel, setShowBudgetPanel] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [budgetAmount, setBudgetAmount] = useState(budget.amount);

  // Set current month for budget if not set or different month
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    if (budget.month !== currentMonth) {
      setBudget(prev => ({ amount: prev.amount, month: currentMonth }));
    }
  }, []);

  // Save expenses to localStorage
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Save budget to localStorage
  useEffect(() => {
    localStorage.setItem('expense-budget', JSON.stringify(budget));
  }, [budget]);

  // Format currency
  const formatCurrency = (amount) => {
    return '$' + amount.toFixed(2);
  };

  // Get current month's expenses
  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    return expenses.filter(expense => expense.date.startsWith(currentMonth));
  };

  // Calculate total expenses for current month
  const calculateTotalExpenses = () => {
    const currentMonthExpenses = getCurrentMonthExpenses();
    return currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Add expense
  const addExpense = () => {
    if (amount === '' || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || date === '') {
      alert('Please enter a valid amount and date.');
      return;
    }

    const newExpense = {
      id: 'exp_' + Date.now(), // Unique ID
      amount: parseFloat(amount),
      category: category,
      date: date,
      description: description.trim(),
      timestamp: Date.now()
    };

    setExpenses([...expenses, newExpense]);
    
    // Reset form
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    
    // Hide panel
    setShowAddPanel(false);
  };

  // Delete expense
  const deleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  // Set budget
  const saveBudget = () => {
    if (isNaN(parseFloat(budgetAmount)) || parseFloat(budgetAmount) <= 0) {
      alert('Please enter a valid budget amount.');
      return;
    }

    const newBudget = {
      amount: parseFloat(budgetAmount),
      month: new Date().toISOString().slice(0, 7) // Update to current month
    };
    
    setBudget(newBudget);
    
    // Hide panel
    setShowBudgetPanel(false);
  };

  // Calculate totals
  const totalExpenses = calculateTotalExpenses();
  const remaining = budget.amount - totalExpenses;

  // Get current month expenses sorted by date
  const currentMonthExpenses = getCurrentMonthExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));

  // Determine budget status for color coding
  const getBudgetStatusColor = () => {
    if (remaining < 0) return 'text-error';
    if (remaining < budget.amount * 0.2) return 'text-warning';
    return 'text-success';
  };

  return (
    <section
      id="expense-widget"
      data-widget="expense-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[360px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent flex justify-between items-center">
        <h2 className="text-xl font-semibold">Expense Manager</h2>
        <div className="flex gap-2">
          <button
            id="set-budget-btn"
            onClick={() => {
              setShowBudgetPanel(true);
              setShowAddPanel(false);
              setBudgetAmount(budget.amount);
            }}
            className="dark:text-dark-text light:text-light-text hover:opacity-90 p-2 rounded-full dark:hover:bg-dark-accent light:hover:bg-light-accent transition-all duration-300"
            aria-label="Set budget"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            id="add-expense-btn"
            onClick={() => {
              setShowAddPanel(true);
              setShowBudgetPanel(false);
            }}
            className="dark:text-dark-text light:text-light-text hover:opacity-90 p-2 rounded-full dark:hover:bg-dark-accent light:hover:bg-light-accent transition-all duration-300"
            aria-label="Add expense"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col">
        {/* Add Expense Panel */}
        {showAddPanel && (
          <div id="add-expense-panel" className="dark:bg-dark-accent light:bg-light-accent p-4 rounded-xl mb-3 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm dark:text-dark-text/80 light:text-light-text/80 block mb-1">Amount ($)</label>
                <input
                  type="number"
                  id="expense-amount"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm dark:text-dark-text/80 light:text-light-text/80 block mb-1">Category</label>
                <select
                  id="expense-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="food">Food</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="transportation">Transportation</option>
                  <option value="utilities">Utilities</option>
                  <option value="shopping">Shopping</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm dark:text-dark-text/80 light:text-light-text/80 block mb-1">Date</label>
                <input
                  type="date"
                  id="expense-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm dark:text-dark-text/80 light:text-light-text/80 block mb-1">Description</label>
                <input
                  type="text"
                  id="expense-description"
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                id="save-expense"
                onClick={addExpense}
                className="flex-1 bg-primary dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Add Expense
              </button>
              <button
                id="cancel-expense"
                onClick={() => setShowAddPanel(false)}
                className="flex-1 bg-dark-accent light:bg-light-accent dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Set Budget Panel */}
        {showBudgetPanel && (
          <div id="set-budget-panel" className="dark:bg-dark-accent light:bg-light-accent p-4 rounded-xl mb-3 transition-all duration-300">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm dark:text-dark-text/80 light:text-light-text/80 block mb-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  id="budget-amount-input"
                  step="0.01"
                  min="0.01"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full px-3 py-2 dark:bg-dark-widget light:bg-light-widget dark:border-dark-accent light:border-light-accent border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                id="save-budget"
                onClick={saveBudget}
                className="flex-1 bg-primary dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Set Budget
              </button>
              <button
                id="cancel-budget"
                onClick={() => setShowBudgetPanel(false)}
                className="flex-1 bg-dark-accent light:bg-light-accent dark:text-dark-text light:text-light-text px-4 py-2 rounded-xl hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Budget Summary */}
        <div className="mb-3 p-3 rounded-xl dark:bg-dark-accent light:bg-light-accent transition-all duration-300">
          <div className="flex justify-between">
            <span>Budget:</span>
            <span id="budget-amount" className="font-semibold">{formatCurrency(budget.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Spent:</span>
            <span id="spent-amount" className="font-semibold">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className={`flex justify-between font-bold ${getBudgetStatusColor()}`}>
            <span>Remaining:</span>
            <span id="remaining-amount">{formatCurrency(remaining)}</span>
          </div>
        </div>
        
        {/* Expense List */}
        <div className="flex-1 overflow-y-auto mb-3">
          <ul id="expense-list" className="space-y-2">
            {currentMonthExpenses.map((expense) => {
              const expenseDate = new Date(expense.date);
              const dateStr = expenseDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              
              return (
                <li
                  key={expense.id}
                  className="expense-item p-3 rounded-xl dark:bg-dark-widget light:bg-light-widget flex justify-between items-center transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                      <div className="text-xs dark:text-dark-text/60 light:text-light-text/60">{dateStr}</div>
                    </div>
                    <div>
                      <div className="font-medium">{expense.description || 'Untitled Expense'}</div>
                      <div className="text-xs dark:text-dark-text/60 light:text-light-text/60 capitalize">{expense.category}</div>
                    </div>
                  </div>
                  <button
                    className="expense-delete text-error hover:text-red-700 transition-colors duration-300"
                    onClick={() => deleteExpense(expense.id)}
                    aria-label="Delete expense"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ExpenseWidget;