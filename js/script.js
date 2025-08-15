console.log("Dashboard loaded!");

// Task data
let tasks = [];

const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-task");
const todoList = document.getElementById("todo-list");

addBtn.addEventListener("click", addTask);

// Add task when pressing Enter
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

function renderTasks() {
    // Sort: incomplete first, completed last
    tasks.sort((a, b) => a.completed - b.completed);

    todoList.innerHTML = "";
    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.textContent = task.text;
        if (task.completed) {
            li.classList.add("completed");
        }
        li.addEventListener("click", () => toggleTask(index));
        todoList.appendChild(li);
    });
}

