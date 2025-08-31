import React, { useState, useEffect } from 'react';

const CalculatorWidget = () => {
  const [currentInput, setCurrentInput] = useState('0');
  const [previousInput, setPreviousInput] = useState('');
  const [operation, setOperation] = useState(null);
  const [history, setHistory] = useState('');
  const [isScientificMode, setIsScientificMode] = useState(() => {
    return localStorage.getItem('calculator-mode') === 'scientific';
  });
  const [memory, setMemory] = useState(() => {
    return parseFloat(localStorage.getItem('calculator-memory')) || 0;
  });

  // Save memory to localStorage
  useEffect(() => {
    localStorage.setItem('calculator-memory', memory.toString());
  }, [memory]);

  // Save mode to localStorage
  useEffect(() => {
    localStorage.setItem('calculator-mode', isScientificMode ? 'scientific' : 'basic');
  }, [isScientificMode]);

  const updateDisplay = () => {
    // This is handled by React state now
  };

  const clearAll = () => {
    setCurrentInput('0');
    setPreviousInput('');
    setOperation(null);
    setHistory('');
  };

  const clearEntry = () => {
    setCurrentInput('0');
  };

  const backspace = () => {
    if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
      setCurrentInput('0');
    } else {
      setCurrentInput(currentInput.slice(0, -1));
    }
  };

  const appendNumber = (number) => {
    if (currentInput === '0' && number !== '.') {
      setCurrentInput(number);
    } else if (number === '.' && currentInput.includes('.')) {
      return;
    } else {
      setCurrentInput(currentInput + number);
    }
  };

  const chooseOperation = (op) => {
    if (currentInput === '') return;
    if (previousInput !== '') {
      calculate();
    }
    setOperation(op);
    setPreviousInput(currentInput);
    setHistory(`${previousInput} ${op}`);
    setCurrentInput('0');
  };

  const calculate = () => {
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

    setHistory(`${previousInput} ${operation} ${currentInput} =`);
    setCurrentInput(computation.toString());
    setOperation(null);
    setPreviousInput('');
  };

  const calculateScientific = (func) => {
    const current = parseFloat(currentInput);
    if (isNaN(current)) return;

    let result;
    switch (func) {
      case 'sin':
        result = Math.sin(current * Math.PI / 180); // Convert to radians
        setHistory(`sin(${current}) =`);
        break;
      case 'cos':
        result = Math.cos(current * Math.PI / 180); // Convert to radians
        setHistory(`cos(${current}) =`);
        break;
      case 'tan':
        result = Math.tan(current * Math.PI / 180); // Convert to radians
        setHistory(`tan(${current}) =`);
        break;
      case 'log':
        if (current <= 0) {
          setCurrentInput('Error');
          return;
        }
        result = Math.log10(current);
        setHistory(`log(${current}) =`);
        break;
      case 'ln':
        if (current <= 0) {
          setCurrentInput('Error');
          return;
        }
        result = Math.log(current);
        setHistory(`ln(${current}) =`);
        break;
      case 'sqrt':
        if (current < 0) {
          setCurrentInput('Error');
          return;
        }
        result = Math.sqrt(current);
        setHistory(`√(${current}) =`);
        break;
      case 'factorial':
        if (current < 0 || !Number.isInteger(current)) {
          setCurrentInput('Error');
          return;
        }
        result = factorial(current);
        setHistory(`fact(${current}) =`);
        break;
      case 'pi':
        result = Math.PI;
        setHistory(`π =`);
        break;
      case 'reciprocal':
        if (current === 0) {
          setCurrentInput('Error');
          return;
        }
        result = 1 / current;
        setHistory(`1/(${current}) =`);
        break;
      case 'percentage':
        result = current / 100;
        setHistory(`${current}% =`);
        break;
      case 'plusMinus':
        result = current * -1;
        setHistory(`(-${current}) =`);
        break;
      default:
        return;
    }

    setCurrentInput(result.toString());
  };

  const factorial = (n) => {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // Memory functions
  const memoryClear = () => {
    setMemory(0);
    setHistory('Memory cleared');
  };

  const memoryRecall = () => {
    setCurrentInput(memory.toString());
    setHistory(`Memory recalled: ${memory}`);
  };

  const memoryAdd = () => {
    const current = parseFloat(currentInput);
    if (!isNaN(current)) {
      const newMemory = memory + current;
      setMemory(newMemory);
      setHistory(`Memory: ${memory} + ${current} = ${newMemory}`);
    }
  };

  const memorySubtract = () => {
    const current = parseFloat(currentInput);
    if (!isNaN(current)) {
      const newMemory = memory - current;
      setMemory(newMemory);
      setHistory(`Memory: ${memory} - ${current} = ${newMemory}`);
    }
  };

  const memoryStore = () => {
    const current = parseFloat(currentInput);
    if (!isNaN(current)) {
      setMemory(current);
      setHistory(`Stored ${current} in memory`);
    }
  };

  // Toggle calculator mode
  const toggleCalculatorMode = () => {
    setIsScientificMode(!isScientificMode);
  };

  // Keyboard support
  const handleKeyboardInput = (e) => {
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
  };

  // Add keyboard event listener only when calculator is focused
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Only handle keyboard input if calculator widget is focused
      if (document.activeElement.closest('#calculator-widget')) {
        handleKeyboardInput(e);
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [currentInput, previousInput, operation, handleKeyboardInput]);

  return (
    <section
      id="calculator-widget"
      data-widget="calculator-widget"
      className="dark:bg-dark-widget light:bg-light-widget dark:text-dark-text light:text-light-text rounded-2xl shadow-widget dark:shadow-widget-dark flex flex-col h-[360px] transition-all duration-300 hover:shadow-xl"
    >
      <button className="drag-handle" aria-label="Drag widget">☰</button>
      <div className="p-2 border-b dark:border-dark-accent light:border-light-accent">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Calculator</h2>
          <div className="flex gap-2">
            {/* Memory indicator */}
            {memory !== 0 && (
              <div className="text-xs dark:text-blue-400 light:text-blue-600 font-semibold bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                M: {memory.toFixed(2)}
              </div>
            )}
            <button
              id="calc-mode-toggle"
              onClick={toggleCalculatorMode}
              className="dark:bg-dark-accent light:bg-light-accent px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {isScientificMode ? 'Basic' : 'Scientific'}
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col overflow-y-auto">
        {/* Display */}
        <div className="mb-3">
          <div id="calc-history" className="text-right text-sm dark:text-dark-text/60 light:text-light-text/60 h-5 overflow-x-auto whitespace-nowrap">
            {history}
          </div>
          <div
            id="calc-display"
            className="text-right text-2xl font-semibold dark:bg-dark-accent light:bg-light-accent p-4 rounded-xl h-12 overflow-x-auto whitespace-nowrap flex items-center justify-end transition-all duration-300"
          >
            {currentInput}
          </div>
        </div>

        {/* Memory Functions Row - Always visible */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          <button
            className="calc-btn dark:bg-blue-600 light:bg-blue-500 text-white p-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={memoryClear}
            data-action="memoryClear"
            title="Memory Clear"
          >
            MC
          </button>
          <button
            className="calc-btn dark:bg-blue-600 light:bg-blue-500 text-white p-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={memoryRecall}
            data-action="memoryRecall"
            title="Memory Recall"
          >
            MR
          </button>
          <button
            className="calc-btn dark:bg-blue-600 light:bg-blue-500 text-white p-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={memoryAdd}
            data-action="memoryAdd"
            title="Memory Add"
          >
            M+
          </button>
          <button
            className="calc-btn dark:bg-blue-600 light:bg-blue-500 text-white p-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={memorySubtract}
            data-action="memorySubtract"
            title="Memory Subtract"
          >
            M-
          </button>
          <button
            className="calc-btn dark:bg-blue-600 light:bg-blue-500 text-white p-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={memoryStore}
            data-action="memoryStore"
            title="Memory Store"
          >
            MS
          </button>
        </div>
        
        {/* Calculator Buttons */}
        <div id="calc-basic-buttons" className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={clearAll}
            data-action="clear"
          >
            C
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={clearEntry}
            data-action="clearEntry"
          >
            CE
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={backspace}
            data-action="backspace"
          >
            ⌫
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => chooseOperation('/')}
            data-action="divide"
          >
            /
          </button>
          
          {/* Row 2 */}
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('7')}
            data-value="7"
          >
            7
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('8')}
            data-value="8"
          >
            8
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('9')}
            data-value="9"
          >
            9
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => chooseOperation('*')}
            data-action="multiply"
          >
            *
          </button>
          
          {/* Row 3 */}
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('4')}
            data-value="4"
          >
            4
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('5')}
            data-value="5"
          >
            5
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('6')}
            data-value="6"
          >
            6
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => chooseOperation('-')}
            data-action="subtract"
          >
            -
          </button>
          
          {/* Row 4 */}
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('1')}
            data-value="1"
          >
            1
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('2')}
            data-value="2"
          >
            2
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('3')}
            data-value="3"
          >
            3
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => chooseOperation('+')}
            data-action="add"
          >
            +
          </button>
          
          {/* Row 5 */}
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => calculateScientific('plusMinus')}
            data-action="plusMinus"
          >
            ±
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('0')}
            data-value="0"
          >
            0
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => appendNumber('.')}
            data-value="."
          >
            .
          </button>
          <button
            className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={calculate}
            data-action="equals"
          >
            =
          </button>
        </div>
        
        {isScientificMode && (
          <div id="calc-scientific-buttons" className="grid grid-cols-5 gap-2 mt-2">
            {/* Row 1 - Parentheses and advanced functions */}
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => appendNumber('(')}
              data-action="openParen"
            >
              (
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => appendNumber(')')}
              data-action="closeParen"
            >
              )
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('pi')}
              data-action="pi"
            >
              π
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => chooseOperation('^')}
              data-action="power"
            >
              ^
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('percentage')}
              data-action="percentage"
            >
              %
            </button>
            
            {/* Row 2 - Trigonometric functions */}
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('sin')}
              data-action="sin"
            >
              sin
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('cos')}
              data-action="cos"
            >
              cos
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('tan')}
              data-action="tan"
            >
              tan
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('reciprocal')}
              data-action="reciprocal"
            >
              1/x
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('factorial')}
              data-action="factorial"
            >
              !
            </button>
            
            {/* Row 3 - Logarithmic and root functions */}
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('log')}
              data-action="log"
            >
              log
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('ln')}
              data-action="ln"
            >
              ln
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => calculateScientific('sqrt')}
              data-action="sqrt"
            >
              √
            </button>
            <button
              className="calc-btn dark:bg-dark-accent light:bg-light-accent p-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg col-span-2"
              onClick={calculate}
              data-action="equals"
            >
              =
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CalculatorWidget;