// ==========================================================================
// Daily Habit Tracker - Application Logic
// Clean, reliable vanilla JavaScript without emojis or artificial gimmicks.
// ==========================================================================

var habits = [];
var currentFilter = "all";
var STORAGE_KEY = "dailyHabits";

// ---------- Storage Operations ----------
function loadHabits() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    habits = saved ? JSON.parse(saved) : [];
  } catch (e) {
    habits = [];
  }
}

function saveHabits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error("Unable to save habits to local storage", e);
  }
}

// ---------- Date Display ----------
function updateDateDisplay() {
  var dateElement = document.getElementById("currentDate");
  if (!dateElement) return;

  var now = new Date();
  var options = { weekday: "long", month: "short", day: "numeric" };
  try {
    dateElement.textContent = now.toLocaleDateString(undefined, options);
  } catch (e) {
    dateElement.textContent = "Today";
  }
}

// ---------- Habit Actions ----------
function addHabit() {
  var input = document.getElementById("habitInput");
  var text = input.value.trim();
  if (text === "") return;

  habits.push({
    id: Date.now(),
    text: text,
    done: false
  });

  input.value = "";
  saveHabits();
  render();
}

function toggleDone(id) {
  for (var i = 0; i < habits.length; i++) {
    if (habits[i].id === id) {
      habits[i].done = !habits[i].done;
      break;
    }
  }
  saveHabits();
  render();
}

function deleteHabit(id) {
  habits = habits.filter(function (habit) {
    return habit.id !== id;
  });
  saveHabits();
  render();
}

function setFilter(filter) {
  currentFilter = filter;
  var tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(function (btn) {
    var isActive = btn.getAttribute("data-filter") === filter;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  render();
}

// ---------- Rendering ----------
function render() {
  var list = document.getElementById("habitList");
  var emptyMsg = document.getElementById("emptyMsg");
  var emptyTitle = document.getElementById("emptyTitle");
  var emptyDesc = document.getElementById("emptyDesc");
  var progressText = document.getElementById("progressText");
  var progressBar = document.getElementById("progressBar");
  var progressWrapper = document.getElementById("progressBarWrapper");
  var itemsSummary = document.getElementById("itemsSummary");
  var statCompleted = document.getElementById("statCompleted");
  var statPending = document.getElementById("statPending");
  var statRate = document.getElementById("statRate");

  list.innerHTML = "";

  // Filter items based on active tab
  var filteredHabits = habits.filter(function (habit) {
    if (currentFilter === "pending") return !habit.done;
    if (currentFilter === "completed") return habit.done;
    return true;
  });

  // Render habit items
  filteredHabits.forEach(function (habit) {
    var li = document.createElement("li");
    li.className = "habit-item" + (habit.done ? " is-done" : "");

    // Circular check button
    var checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "habit-check-btn";
    checkBtn.setAttribute("aria-label", habit.done ? "Mark as to-do" : "Mark as completed");
    checkBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 7.5 5.5 10.5 11.5 3.5"></polyline></svg>';
    checkBtn.onclick = function () {
      toggleDone(habit.id);
    };

    // Habit text
    var span = document.createElement("span");
    span.className = "habit-text";
    span.textContent = habit.text;

    // Action buttons container
    var actions = document.createElement("div");
    actions.className = "habit-actions";

    // Text status toggle button
    var toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "btn btn-toggle";
    toggleBtn.textContent = habit.done ? "Undo" : "Done";
    toggleBtn.onclick = function () {
      toggleDone(habit.id);
    };

    // Delete button
    var delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn btn-delete";
    delBtn.textContent = "Delete";
    delBtn.setAttribute("aria-label", "Delete habit");
    delBtn.onclick = function () {
      deleteHabit(habit.id);
    };

    actions.appendChild(toggleBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkBtn);
    li.appendChild(span);
    li.appendChild(actions);
    list.appendChild(li);
  });

  // Calculate statistics
  var total = habits.length;
  var completedCount = habits.filter(function (h) { return h.done; }).length;
  var pendingCount = total - completedCount;
  var percentage = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  // Update progress bar & label
  if (progressText) {
    progressText.textContent = completedCount + " of " + total + " completed (" + percentage + "%)";
  }
  if (progressBar) {
    progressBar.style.width = percentage + "%";
  }
  if (progressWrapper) {
    progressWrapper.setAttribute("aria-valuenow", percentage.toString());
  }

  // Update footer statistics
  if (statCompleted) statCompleted.textContent = completedCount.toString();
  if (statPending) statPending.textContent = pendingCount.toString();
  if (statRate) statRate.textContent = percentage + "%";

  // Update items summary under filter
  if (itemsSummary) {
    if (currentFilter === "pending") {
      itemsSummary.textContent = pendingCount + " to do";
    } else if (currentFilter === "completed") {
      itemsSummary.textContent = completedCount + " done";
    } else {
      itemsSummary.textContent = total + " total";
    }
  }

  // Handle empty state visibility & context message
  if (filteredHabits.length === 0) {
    emptyMsg.style.display = "block";
    if (total === 0) {
      emptyTitle.textContent = "No habits listed yet";
      emptyDesc.textContent = "Add your first habit above to begin tracking your routine for today.";
    } else if (currentFilter === "pending") {
      emptyTitle.textContent = "All habits completed";
      emptyDesc.textContent = "You have finished every habit scheduled for today.";
    } else if (currentFilter === "completed") {
      emptyTitle.textContent = "No completed habits yet";
      emptyDesc.textContent = "Mark habits as done once you finish them.";
    }
  } else {
    emptyMsg.style.display = "none";
  }
}

// ---------- Event Listeners ----------
document.addEventListener("DOMContentLoaded", function () {
  updateDateDisplay();

  var form = document.getElementById("habitForm");
  var addBtn = document.getElementById("addBtn");
  var input = document.getElementById("habitInput");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      addHabit();
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", function (e) {
      e.preventDefault();
      addHabit();
    });
  }

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addHabit();
      }
    });
  }

  // Filter tabs listeners
  var filterButtons = document.querySelectorAll(".tab-btn");
  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filterValue = this.getAttribute("data-filter");
      setFilter(filterValue);
    });
  });

  loadHabits();
  render();
});
