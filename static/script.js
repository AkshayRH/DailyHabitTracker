// ==========================================================================
// Daily Habit Tracker - Application Logic
// Clean, reliable vanilla JavaScript without emojis or artificial gimmicks.
// ==========================================================================

// ==========================================================================
// ThemeManager Class
// Manages dark mode toggling, accessibility attributes, and localStorage persistence.
// ==========================================================================
class ThemeManager {
  constructor() {
    this.storageKey = "dailyHabits_theme";
    this.toggleBtn = null;
    this.toggleText = null;
  }

  init() {
    this.toggleBtn = document.getElementById("themeToggleBtn");
    this.toggleText = document.getElementById("themeToggleText");

    var savedTheme = null;
    try {
      savedTheme = localStorage.getItem(this.storageKey);
    } catch (e) {
      console.warn("Storage access not available for theme", e);
    }

    var prefersDark = false;
    try {
      prefersDark = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch (e) {
      prefersDark = false;
    }

    var isDark = savedTheme ? savedTheme === "dark" : prefersDark;
    this.applyTheme(isDark);

    if (this.toggleBtn) {
      var self = this;
      this.toggleBtn.onclick = function (e) {
        if (e) e.preventDefault();
        self.toggle();
      };
    }

    // Follow OS color scheme changes if user hasn't explicitly set a preference
    try {
      if (window.matchMedia) {
        var self = this;
        var mq = window.matchMedia("(prefers-color-scheme: dark)");
        var handler = function (e) {
          var userPref = null;
          try {
            userPref = localStorage.getItem(self.storageKey);
          } catch (err) {}
          if (!userPref) {
            self.applyTheme(e.matches);
          }
        };
        if (mq.addEventListener) {
          mq.addEventListener("change", handler);
        } else if (mq.addListener) {
          mq.addListener(handler);
        }
      }
    } catch (e) {
      // Ignore media query listener issues
    }
  }

  applyTheme(isDark) {
    if (document.body) {
      document.body.classList.toggle("dark-mode", isDark);
    }

    if (this.toggleText) {
      this.toggleText.textContent = isDark ? "Light Mode" : "Dark Mode";
    }

    if (this.toggleBtn) {
      this.toggleBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
      this.toggleBtn.setAttribute("title", isDark ? "Switch to daylight mode" : "Switch to dark mode");
    }

    try {
      localStorage.setItem(this.storageKey, isDark ? "dark" : "light");
    } catch (e) {}
  }

  toggle() {
    var isCurrentlyDark = document.body ? document.body.classList.contains("dark-mode") : false;
    this.applyTheme(!isCurrentlyDark);
  }
}

// ---------- Data State ----------
var habits = [];
var currentFilter = "all";
var STORAGE_KEY = "dailyHabits";
var REMINDER_STORAGE_KEY = "dailyHabits_nextDayReminder";

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

// ---------- Date & Time Formatting ----------
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

function formatTime(timestamp) {
  if (!timestamp) return "";
  var date = new Date(timestamp);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return hours + ":" + minutes + " " + ampm;
}

function getHabitTimestampText(habit) {
  if (habit.done && habit.completedAt) {
    return "Completed at " + formatTime(habit.completedAt);
  }
  var created = habit.createdAt || habit.id;
  if (created) {
    return "Added at " + formatTime(created);
  }
  return "";
}

// ---------- Habit Actions ----------
function addHabit() {
  var input = document.getElementById("habitInput");
  if (!input) return;
  var text = input.value.trim();
  if (text === "") return;

  var now = Date.now();
  habits.push({
    id: now,
    text: text,
    done: false,
    createdAt: now,
    completedAt: null
  });

  input.value = "";
  saveHabits();
  render();
}

function toggleDone(id) {
  for (var i = 0; i < habits.length; i++) {
    if (habits[i].id === id) {
      habits[i].done = !habits[i].done;
      habits[i].completedAt = habits[i].done ? Date.now() : null;
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

// ---------- Next Day Recommendation & Reminder Logic ----------
function updateRecommendations() {
  var recText = document.getElementById("recommendationText");
  if (!recText) return;

  var total = habits.length;
  var completedCount = habits.filter(function (h) { return h.done; }).length;
  var pendingCount = total - completedCount;

  if (total === 0) {
    recText.textContent = "Your list is currently clear. Recommendation for tomorrow: Begin with 1 or 2 small, foundational habits (such as 15 minutes of quiet reading or morning hydration) to start building sustainable daily momentum.";
  } else if (completedCount === total) {
    recText.textContent = "Outstanding work: All daily habits have been achieved today. Recommendation for tomorrow: Keep this momentum going by preparing your morning environment tonight so you can begin without friction.";
  } else if (completedCount === 0) {
    recText.textContent = "You have " + total + " habits scheduled with none finished yet today. Recommendation for tomorrow: Complete just one high-impact habit first thing tomorrow morning to generate positive forward momentum.";
  } else {
    var nextPending = habits.find(function (h) { return !h.done; });
    var habitName = nextPending ? '"' + nextPending.text + '"' : "your remaining tasks";
    recText.textContent = "You have finished " + completedCount + " of " + total + " habits today (" + pendingCount + " remaining). Recommendation for tomorrow: Prioritize " + habitName + " before noon tomorrow to stay ahead of your schedule.";
  }
}

function saveReminder() {
  var input = document.getElementById("reminderInput");
  if (!input) return;
  var text = input.value.trim();
  if (text === "") return;

  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify({
      text: text,
      createdAt: Date.now()
    }));
  } catch (e) {
    console.error("Unable to save next day reminder", e);
  }

  input.value = "";
  renderReminder();
}

function clearReminder() {
  try {
    localStorage.removeItem(REMINDER_STORAGE_KEY);
  } catch (e) {
    console.error("Unable to clear next day reminder", e);
  }
  renderReminder();
}

function renderReminder() {
  var displayBox = document.getElementById("savedReminderDisplay");
  var displayText = document.getElementById("savedReminderText");
  if (!displayBox || !displayText) return;

  var saved = null;
  try {
    var raw = localStorage.getItem(REMINDER_STORAGE_KEY);
    saved = raw ? JSON.parse(raw) : null;
  } catch (e) {
    saved = null;
  }

  if (saved && saved.text) {
    displayBox.style.display = "flex";
    displayText.textContent = saved.text;
  } else {
    displayBox.style.display = "none";
    displayText.textContent = "";
  }
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

  if (!list) return;
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

    // Habit content container (text + timestamp)
    var contentWrapper = document.createElement("div");
    contentWrapper.className = "habit-content";

    var span = document.createElement("span");
    span.className = "habit-text";
    span.textContent = habit.text;

    var timestampSpan = document.createElement("span");
    timestampSpan.className = "habit-timestamp";
    timestampSpan.textContent = getHabitTimestampText(habit);

    contentWrapper.appendChild(span);
    contentWrapper.appendChild(timestampSpan);

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
    li.appendChild(contentWrapper);
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
  if (emptyMsg) {
    if (filteredHabits.length === 0) {
      emptyMsg.style.display = "block";
      if (total === 0) {
        if (emptyTitle) emptyTitle.textContent = "No habits listed yet";
        if (emptyDesc) emptyDesc.textContent = "Add your first habit above to begin tracking your routine for today.";
      } else if (currentFilter === "pending") {
        if (emptyTitle) emptyTitle.textContent = "All habits completed";
        if (emptyDesc) emptyDesc.textContent = "You have finished every habit scheduled for today.";
      } else if (currentFilter === "completed") {
        if (emptyTitle) emptyTitle.textContent = "No completed habits yet";
        if (emptyDesc) emptyDesc.textContent = "Mark habits as done once you finish them.";
      }
    } else {
      emptyMsg.style.display = "none";
    }
  }

  // Update next day recommendations
  updateRecommendations();
}

// ---------- Initialization Routine ----------
function initApp() {
  // Initialize ThemeManager class
  var themeManager = new ThemeManager();
  themeManager.init();
  window.themeManager = themeManager;

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

  // Next Day Reminder listeners
  var reminderForm = document.getElementById("reminderForm");
  var saveReminderBtn = document.getElementById("saveReminderBtn");
  var clearReminderBtn = document.getElementById("clearReminderBtn");
  var reminderInput = document.getElementById("reminderInput");

  if (reminderForm) {
    reminderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveReminder();
    });
  }

  if (saveReminderBtn) {
    saveReminderBtn.addEventListener("click", function (e) {
      e.preventDefault();
      saveReminder();
    });
  }

  if (reminderInput) {
    reminderInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        saveReminder();
      }
    });
  }

  if (clearReminderBtn) {
    clearReminderBtn.addEventListener("click", function (e) {
      e.preventDefault();
      clearReminder();
    });
  }

  loadHabits();
  render();
  renderReminder();
}

// Ensure execution whether DOM is already loaded or still loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
