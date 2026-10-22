// ---------- Data ----------
var habits = [];
var STORAGE_KEY = "dailyHabits";

// Load saved habits from localStorage
function loadHabits() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    habits = saved ? JSON.parse(saved) : [];
  } catch (e) {
    habits = [];
  }
}

// Save habits to localStorage
function saveHabits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error("Could not save habits", e);
  }
}

// ---------- Actions ----------
function addHabit() {
  var input = document.getElementById("habitInput");
  var text = input.value.trim();
  if (text === "") return;

  habits.push({ id: Date.now(), text: text, done: false });
  input.value = "";
  saveHabits();
  render();
}

function toggleDone(id) {
  for (var i = 0; i < habits.length; i++) {
    if (habits[i].id === id) {
      habits[i].done = !habits[i].done;
    }
  }
  saveHabits();
  render();
}

function deleteHabit(id) {
  habits = habits.filter(function (h) { return h.id !== id; });
  saveHabits();
  render();
}

// ---------- Render ----------
function render() {
  var list = document.getElementById("habitList");
  list.innerHTML = "";

  habits.forEach(function (habit) {
    var li = document.createElement("li");
    li.className = "habit-row" + (habit.done ? " completed" : "");

    var span = document.createElement("span");
    span.className = "habit-text";
    span.textContent = habit.text;

    var actions = document.createElement("div");
    actions.className = "actions";

    var doneBtn = document.createElement("button");
    doneBtn.className = "btn btn-done";
    doneBtn.textContent = habit.done ? "Undo" : "Done";
    doneBtn.onclick = function () { toggleDone(habit.id); };

    var delBtn = document.createElement("button");
    delBtn.className = "btn btn-delete";
    delBtn.textContent = "Delete";
    delBtn.onclick = function () { deleteHabit(habit.id); };

    actions.appendChild(doneBtn);
    actions.appendChild(delBtn);
    li.appendChild(span);
    li.appendChild(actions);
    list.appendChild(li);
  });

  // Progress text + empty message
  var doneCount = habits.filter(function (h) { return h.done; }).length;
  document.getElementById("progressText").textContent =
    doneCount + " of " + habits.length + " habits done";
  document.getElementById("emptyMsg").style.display =
    habits.length === 0 ? "block" : "none";
}

// ---------- Events ----------
document.getElementById("addBtn").addEventListener("click", addHabit);
document.getElementById("habitInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") addHabit();
});

// ---------- Start ----------
loadHabits();
render();
