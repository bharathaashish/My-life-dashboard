console.log("Dashboard loaded!");

// ---------------- To-Do List ----------------
let tasks = [];

const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-task");
const todoList = document.getElementById("todo-list");

addBtn.addEventListener("click", addTask);

input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});

function addTask() {
    const taskText = input.value.trim();
    if (taskText) {
        tasks.push({ text: taskText, completed: false });
        input.value = "";
        renderTasks();
    }
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
}

function renderTasks() {
    tasks.sort((a, b) => a.completed - b.completed);
    todoList.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task.text;
        if (task.completed) span.classList.add("completed");
        span.addEventListener("click", () => toggleTask(index));

        const delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.classList.add("delete-btn");
        delBtn.addEventListener("click", () => deleteTask(index));

        li.appendChild(span);
        li.appendChild(delBtn);
        todoList.appendChild(li);
    });
}

// ---------------- Pomodoro Timer ----------------
let workDuration = 25 * 60;
let breakDuration = 5 * 60;
let timeLeft = workDuration;
let isWork = true;
let timerInterval = null;
let totalWorkMinutes = 0;

const timerDisplay = document.getElementById("timer-display");
const workTotalDisplay = document.getElementById("work-total");

document.getElementById("set-25-5").addEventListener("click", () => {
    workDuration = 25 * 60;
    breakDuration = 5 * 60;
    resetTimer();
});

document.getElementById("set-50-10").addEventListener("click", () => {
    workDuration = 50 * 60;
    breakDuration = 10 * 60;
    resetTimer();
});

document.getElementById("start-timer").addEventListener("click", startTimer);
document.getElementById("stop-timer").addEventListener("click", stopTimer);
document.getElementById("reset-timer").addEventListener("click", resetTimer);

function startTimer() {
    if (timerInterval) return; 
    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;

            if (isWork) {
                totalWorkMinutes += workDuration / 60;
                workTotalDisplay.textContent = `Total Work Time: ${totalWorkMinutes} mins`;
                timeLeft = breakDuration;
                isWork = false;
                alert("Work session done! Time for a break.");
            } else {
                timeLeft = workDuration;
                isWork = true;
                alert("Break over! Back to work.");
            }
            startTimer();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    stopTimer();
    isWork = true;
    timeLeft = workDuration;
    updateDisplay();
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Init
updateDisplay();
