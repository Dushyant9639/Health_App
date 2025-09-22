// ======= DOM ELEMENT REFERENCES =======
window.onload = () => {
  const habitList = document.getElementById("habitList");
  const habitModal = document.getElementById("habitModal");
  const addHabitBtn = document.getElementById("addHabitBtn");
  const habitForm = document.getElementById("habitForm");
  const closeModal = document.getElementById("closeModal");
  const reportsSection = document.getElementById("reportsSection");
  const categoryFilter = document.getElementById("categoryFilter");
  const chartCanvas = document.getElementById("progressChart");

  // ======= APP STATE =======
  let habits = [];
  let todayStr = () => new Date().toISOString().slice(0, 10);
  let chart;

  // ======= LOAD FROM LOCAL STORAGE ON START =======
  if (localStorage.getItem("habits")) {
    habits = JSON.parse(localStorage.getItem("habits"));
    // Sanitize old data so log/streaks always exist
    habits.forEach((h) => {
      if (!h.log) h.log = {};
      if (typeof h.streak !== "number") h.streak = 0;
      if (typeof h.longestStreak !== "number") h.longestStreak = 0;
    });
  }
  renderHabits();

  // ======= SAVE TO LOCAL STORAGE =======
  function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
  }

  // ======= RENDER HABITS LIST =======
  function renderHabits() {
    habitList.innerHTML = "";

    let cat = categoryFilter.value;
    let shownHabits = cat ? habits.filter((h) => h.category === cat) : habits;

    if (shownHabits.length === 0) {
      habitList.innerHTML = "<li>No habits in this category. Add one!</li>";
      return;
    }

    shownHabits.forEach((habit, index) => {
      let li = document.createElement("li");
      li.className = habit.log[todayStr()] ? "completed" : "";

      li.innerHTML = `
        <span>
          ${habit.log[todayStr()] ? "✅" : "⬜"} 
          <strong>${habit.name}</strong> 
          <span style="color:#888; font-size:12px;">(${habit.category})</span>
        </span>
        <span>
          <span class="streak" title="Current Streak">🔥${habit.streak}</span>
          <button onclick="logHabit(${index})">${
        habit.log[todayStr()] ? "Undo" : "Done"
      }</button>
          <button onclick="deleteHabit(${index})">🗑️</button>
        </span>
      `;
      habitList.appendChild(li);
    });

    let allCats = Array.from(new Set(habits.map((h) => h.category))).filter(
      Boolean
    );
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
    allCats.forEach(
      (c) => (categoryFilter.innerHTML += `<option value="${c}">${c}</option>`)
    );
    categoryFilter.value = cat;

    renderReports();
    drawProgressChart();
  }

  // ======= TOGGLE HABIT COMPLETION =======
  window.logHabit = function (index) {
    let habit = habits[index];
    let t = todayStr();

    if (habit.log[t]) {
      delete habit.log[t];
    } else {
      habit.log[t] = true;
    }

    habit.streak = recalcStreak(habit);
    if (habit.streak > habit.longestStreak) habit.longestStreak = habit.streak;

    saveHabits();
    renderHabits();
  };

  // ======= DELETE A HABIT =======
  window.deleteHabit = function (index) {
    if (confirm("Delete this habit?")) {
      habits.splice(index, 1);
      saveHabits();
      renderHabits();
    }
  };

  // ======= MODAL OPEN/CLOSE HANDLERS =======
  addHabitBtn.onclick = () => {
    habitModal.style.display = "block";
  };
  closeModal.onclick = () => {
    habitModal.style.display = "none";
  };
  window.onclick = (e) => {
    if (e.target === habitModal) habitModal.style.display = "none";
  };

  // ======= ADD NEW HABIT FROM FORM =======
  habitForm.onsubmit = function (e) {
    e.preventDefault();

    let name = document.getElementById("habitName").value.trim();
    let category = document.getElementById("habitCategory").value.trim();
    if (!name) return;

    habits.push({ name, category, log: {}, streak: 0, longestStreak: 0 });

    habitForm.reset();
    habitModal.style.display = "none";
    saveHabits();
    renderHabits();
  };

  // ======= CATEGORY FILTER HANDLER =======
  categoryFilter.onchange = renderHabits;

  // ======= CALCULATE STREAK =======
  function recalcStreak(habit) {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      let d = new Date();
      d.setDate(d.getDate() - i);
      let key = d.toISOString().slice(0, 10);
      if (habit.log[key]) streak++;
      else break;
    }
    return streak;
  }

  // ======= RENDER REPORTS =======
  function renderReports() {
    let html = `<h3>Habit Reports</h3>`;
    html += habits
      .map((h) => {
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
      })
      .join("");
    reportsSection.innerHTML = html;
  }

  // ======= HELPER: COUNT COMPLETIONS =======
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

  // ======= DRAW PROGRESS CHART =======
  function drawProgressChart() {
    if (chart) chart.destroy();

    let labels = [];
    for (let i = 6; i >= 0; i--) {
      let d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toISOString().slice(5, 10));
    }

    let datasets = habits.map((habit) => {
      return {
        label: habit.name,
        data: labels.map((lbl, i) => {
          let d = new Date();
          d.setDate(d.getDate() - (6 - i));
          let k = d.toISOString().slice(0, 10);
          return habit.log[k] ? 1 : 0;
        }),
        backgroundColor: "#" + Math.floor(Math.random() * 999999).toString(16),
      };
    });

    chart = new Chart(chartCanvas.getContext("2d"), {
      type: "bar",
      data: { labels, datasets },
      options: {
        plugins: {
          title: { display: true, text: "Habits Completed (Last 7 Days)" },
        },
        scales: {
          y: {
            min: 0,
            max: 1,
            ticks: {
              stepSize: 1,
              callback: (v) => (v ? "✔" : ""),
            },
          },
        },
      },
    });
  }
};
