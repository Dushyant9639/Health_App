// ======= DOM ELEMENT REFERENCES =======
// These grab references to HTML elements so we can use them in JS
const habitList = document.getElementById("habitList");       // The <ul> where habits will be listed
const habitModal = document.getElementById("habitModal");     // The popup modal to add a new habit
const addHabitBtn = document.getElementById("addHabitBtn");   // Button to open the add habit modal
const habitForm = document.getElementById("habitForm");       // Form element for habit creation
const closeModal = document.getElementById("closeModal");     // Close button inside the modal
const reportsSection = document.getElementById("reportsSection"); // Section to display weekly/monthly reports
const categoryFilter = document.getElementById("categoryFilter"); // Dropdown to filter by category
const chartCanvas = document.getElementById("progressChart"); // Canvas element for Chart.js progress chart

// ======= APP STATE =======
let habits = [];                                       // Array to hold all habit objects
let todayStr = () => new Date().toISOString().slice(0,10); // Helper function to get current date in YYYY-MM-DD format
let chart;                                             // Will store the Chart.js chart instance

// ======= LOAD FROM LOCAL STORAGE ON START =======
if(localStorage.getItem('habits')){
  // If habits exist in browser storage, load them
  habits = JSON.parse(localStorage.getItem('habits'));
}
renderHabits(); // Draw habits in UI immediately

// ======= SAVE TO LOCAL STORAGE =======
function saveHabits() {
  // Convert habits array to a string and store in browser's localStorage
  localStorage.setItem('habits', JSON.stringify(habits));
}

// ======= RENDER HABITS LIST =======
function renderHabits() {
  habitList.innerHTML = ''; // Clear list

  // Apply category filter, if any
  let cat = categoryFilter.value;
  let shownHabits = cat ? habits.filter(h => h.category === cat) : habits;

  // If there are no habits, show a message
  if (shownHabits.length === 0) {
    habitList.innerHTML = "<li>No habits in this category. Add one!</li>";
    return;
  }

  // Loop over each habit and create a list item
  shownHabits.forEach((habit, index) => {
    let li = document.createElement("li");

    // Add CSS class if today's habit is marked as completed
    li.className = habit.log[todayStr()] ? "completed" : "";

    // Create the HTML for each habit row
    li.innerHTML = `
      <span>
        ${habit.log[todayStr()] ? "✅" : "⬜"} 
        <strong>${habit.name}</strong> 
        <span style="color:#888; font-size:12px;">(${habit.category})</span>
      </span>
      <span>
        <span class="streak" title="Current Streak">🔥${habit.streak}</span>
        <button onclick="logHabit(${index})">${habit.log[todayStr()] ? "Undo" : "Done"}</button>
        <button onclick="deleteHabit(${index})">🗑️</button>
      </span>
    `;
    habitList.appendChild(li);
  });

  // Populate category filter dropdown
  let allCats = Array.from(new Set(habits.map(h => h.category))).filter(Boolean);
  categoryFilter.innerHTML = `<option value="">All Categories</option>`;
  allCats.forEach(c => categoryFilter.innerHTML += `<option value="${c}">${c}</option>`);
  categoryFilter.value = cat; // Keep current selection

  // Update summary reports and refresh the chart
  renderReports();
  drawProgressChart();
}

// ======= TOGGLE HABIT COMPLETION =======
window.logHabit = function(index) {
  let habit = habits[index];
  let t = todayStr();
  
  // If already marked complete today, remove it; otherwise mark complete
  if (habit.log[t]) {
    delete habit.log[t];
  } else {
    habit.log[t] = true;
  }

  // Recalculate streak and longest streak
  habit.streak = recalcStreak(habit);
  if (habit.streak > habit.longestStreak) habit.longestStreak = habit.streak;

  saveHabits();
  renderHabits();
};

// ======= DELETE A HABIT =======
window.deleteHabit = function(index) {
  if (confirm("Delete this habit?")) {
    habits.splice(index, 1); // Remove from array
    saveHabits();
    renderHabits();
  }
};

// ======= MODAL OPEN/CLOSE HANDLERS =======
addHabitBtn.onclick = () => { habitModal.style.display = "block"; };
closeModal.onclick = () => { habitModal.style.display = "none"; };
window.onclick = (e) => {
  // Clicking outside the modal closes it
  if (e.target === habitModal) habitModal.style.display = "none";
};

// ======= ADD NEW HABIT FROM FORM =======
habitForm.onsubmit = function(e) {
  e.preventDefault();

  let name = document.getElementById("habitName").value.trim();
  let category = document.getElementById("habitCategory").value.trim();
  if (!name) return; // Ensure name field is filled

  // Add new habit object with default values
  habits.push({ name, category, log: {}, streak: 0, longestStreak: 0 });

  habitForm.reset(); // Clear form inputs
  habitModal.style.display = "none"; // Close modal
  saveHabits();
  renderHabits();
};

// ======= CATEGORY FILTER HANDLER =======
categoryFilter.onchange = renderHabits;

// ======= CALCULATE STREAK =======
// Checks how many consecutive days (starting from today) this habit was completed
function recalcStreak(habit) {
  let streak = 0;
  for (let i = 0; i < 365; i++) { // check up to last 365 days
    let d = new Date();
    d.setDate(d.getDate() - i);
    let key = d.toISOString().slice(0, 10);
    if (habit.log[key]) streak++;
    else break; // stop at first uncompleted day
  }
  return streak;
}

// ======= RENDER REPORTS =======
function renderReports() {
  let html = `<h3>Habit Reports</h3>`;
  html += habits.map(h => {
    let week = getCompletionCount(h, 7);
    let month = getCompletionCount(h, 30);
    return `
      <div>
        <b>${h.name}</b> (${h.category})<br>
        This week: <strong>${week}/7</strong> days,
        This month: <strong>${month}/30</strong> days <br>
        Longest Streak: <strong>${h.longestStreak}</strong>
      </div>
    `;
  }).join("");
  reportsSection.innerHTML = html;
}

// ======= HELPER: COUNT COMPLETIONS IN GIVEN DAYS =======
function getCompletionCount(habit, numDays) {
  let count = 0;
  for (let i = 0; i < numDays; i++) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    let k = d.toISOString().slice(0, 10);
    if (habit.log[k]) count++;
  }
  return count;
}

// ======= DRAW PROGRESS CHART WITH CHART.JS =======
function drawProgressChart() {
  if (chart) chart.destroy(); // Remove previous chart

  // X-axis labels for last 7 days
  let labels = [];
  for (let i = 6; i >= 0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toISOString().slice(5, 10)); // Format MM-DD
  }

  // Create dataset for each habit
  let datasets = habits.map(habit => {
    return {
      label: habit.name,
      data: labels.map((lbl, i) => {
        let d = new Date();
        d.setDate(d.getDate() - (6 - i));
        let k = d.toISOString().slice(0, 10);
        return habit.log[k] ? 1 : 0; // 1 if done on that day, else 0
      }),
      backgroundColor: "#" + Math.floor(Math.random() * 999999).toString(16) // random color
    };
  });

  // Create a bar chart
  chart = new Chart(chartCanvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Habits Completed (Last 7 Days)'
        }
      },
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            stepSize: 1,
            callback: v => v ? '✔' : '' // Show ✔ for 1, blank for 0
          }
        }
      }
    }
  });
}
