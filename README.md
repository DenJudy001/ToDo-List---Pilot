# ☀️ Zen Focus Ultimate: Daily Habit & Quest Board

A distraction-free productivity tool designed to build daily habits. Features a "Morning Sky" aesthetic, automated daily resets, history tracking, and a forgiving recycle bin system—all built with Zero Dependencies.

## 🍃 Philosophy & Vibe

Unlike aggressive productivity tools with red notification badges, Zen Focus uses a soft color palette and positive reinforcement. It treats every day as a fresh start while keeping a gentle record of your past achievements.

**✨ Key Features**

**♻️ Recycle Bin & Restore:** Mistakes happen. If you delete a quest by accident, it's moved to the Recycle Bin (accessible via the Trash icon). You can restore tasks instantly to "Today's Goals".

**📅 Smart Date Display:** The board is time-aware, displaying the current date and resetting itself automatically when a new day begins.

**📜 History Vault:** A dedicated history view allows you to look back at completed missions from previous days.

**⚡ Live Sync Settings:** Changing your "Default Habits" instantly merges new goals into your current day's board—no need to wait for tomorrow to see changes.

**➕ Instant Missions:** Have a specific task just for today? You can now add ad-hoc missions directly to the board without altering your global settings.

**🔥 Mindfulness Streak:** Tracks consecutive days of 100% completion. It smartly revokes the streak if you undo tasks, ensuring the counter remains honest.

## 🛠️ Technical Implementation

This project is built with Pure Vanilla JavaScript to demonstrate mastery of core Web APIs without reliance on frameworks.

**1. State Management & Soft Deletion**

The app uses a robust state object saved to localStorage. Instead of permanently removing items, we use a "Soft Delete" status:
```
let state = {
    streak: 5,
    tasks: [
        { id: 1, content: "Drink Water", status: 'done' },
        { id: 2, content: "Read", status: 'deleted' } // Exists in memory, hidden from main board
    ]
};
```

This allows the "Recycle Bin" modal to simply filter by status === 'deleted' and restore items by flipping the status back to 'todo'.

**2. The Daily Reset Algorithm**

On load, the app checks if lastVisit matches the current date. If they differ:

**Archive:** Completed tasks from the previous session are pushed into the history array.

**Hard Reset:** The current board (including the Recycle Bin) is wiped clean for a fresh start.

**Regenerate:** The board is repopulated using the defaultQuests template.

**3. Drag & Drop API

Uses native HTML5 Drag and Drop events (dragstart, dragover, drop) for a dependency-free interactive experience.

## 💻 How to Run

No npm install. No build. Just code.

Clone the repository:
```
git clone https://github.com/DenJudy001/ToDo-List---Pilot.git
```

Open the app:
Double-click index.html to launch it in your browser.

## 🔮 Future Ideas

[ ] Data Export: Download history as a .json or .csv file.

[ ] Theme Toggle: Switch between "Morning Sky" and "Midnight Focus" modes.

[ ] Audioscapes: Optional ambient rain or forest sounds.

Built with 💙
