# 📅 Habit Tracker Web App

A simple, **localStorage-based Habit Tracking App** built with **HTML, CSS, and JavaScript**.  
This app helps you add, track, and manage your daily habits, view progress reports, and see a **7-day bar chart visualization** of your progress — all without a backend.

---

## ✨ Features

- **➕ Add New Habits** — Specify a habit name and category.  
- **✅ Mark as Done / Undo** — Quickly log completion for today.  
- **📊 Streak Tracking** — Displays current and longest streak for each habit.  
- **📂 Category Filter** — View habits by category or show all.  
- **📅 Progress Reports**:  
  - Weekly completion count  
  - Monthly completion count  
  - Longest streak so far  
- **📈 Progress Visualization** — Chart.js bar chart for last 7 days’ completions per habit.  
- **🗑 Delete Habits** — Remove unwanted habits anytime.  
- **💾 Local Persistence** — All data is stored in browser’s `localStorage` and restored on page load.  
- **📱 Responsive Design** — Works well on both desktop and mobile.


## 🛠 How to Use

1. **Add a Habit**
- Click **"+ Add New Habit"**.
- Enter Habit Name and Category.
- Click **Add Habit**.

2. **Log Completion**
- Click **Done** next to a habit to mark it as completed for today.
- Click **Undo** to remove today's completion.

3. **View Streak & Reports**
- See current streak (`🔥x`) next to each habit.
- Scroll to the **Habit Reports** section for weekly/monthly stats.

4. **Chart**
- Shows last **7 days** completions for all habits.
- ✔ means habit was completed that day.

5. **Filter by Category**
- Use the dropdown to filter habits by category.

6. **Delete a Habit**
- Click the 🗑 icon to delete.

---

## 💡 Data Storage

- Data is stored in your browser's **localStorage** under the key `habits`.  
- Data persists until you clear browser storage or switch browsers/devices.  
- Using private/incognito mode will reset data when you close the browser.



