// --- State Management ---
let state = {
    streak: 0,
    lastVisit: null,
    lastStreakDate: null,
    defaultQuests: ["Drink Water", "Read 10 Pages", "Plan Tomorrow"],
    tasks: [],
    history: [] // New: Stores past days
};

// --- Init ---
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateDateDisplay();
    checkDailyReset();
    renderBoard();
    setupDragAndDrop();
});

// --- Logic: Date & Display ---
function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date-display').innerText = now.toLocaleDateString('en-US', options);
}

// --- Logic: Persistence ---
function saveState() {
    localStorage.setItem('zen_focus_v2', JSON.stringify(state));
    updateTrashBadge();
}

function loadState() {
    const data = localStorage.getItem('zen_focus_v2');
    if (data) state = JSON.parse(data);
    if (!state.history) state.history = [];
    // Ensure status is valid for old saves
    state.tasks.forEach(t => { if (!t.status) t.status = 'todo'; });
}

// --- Logic: Daily Reset ---
function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];

    if (state.lastVisit && state.lastVisit !== today) {
        // It's a new day! 

        // 1. Archive Yesterday's Achievements
        const completedTasks = state.tasks
            .filter(t => t.status === 'done')
            .map(t => t.content);

        if (completedTasks.length > 0) {
            state.history.unshift({
                date: state.lastVisit,
                items: completedTasks
            });

            // Keep history manageable (last 30 entries)
            if (state.history.length > 30) state.history.pop();
        }

        // Hard Reset (Wipes trash too for a new day)
        state.tasks = [];
        state.defaultQuests.forEach((q, i) => {
            state.tasks.push({
                id: Date.now() + i,
                content: q,
                status: 'todo'
            });
        });

        // 3. Update Date
        state.lastVisit = today;
        saveState();
    } else if (!state.lastVisit) {
        state.lastVisit = today;
        if (state.tasks.length === 0) {
            state.defaultQuests.forEach((q, i) => {
                state.tasks.push({ id: Date.now() + i, content: q, status: 'todo' });
            });
        }
        saveState();
    }
}

// --- Logic: Add/Delete/Restore ---
function addAdhocTask() {
    const input = document.getElementById('adhoc-input');
    const text = input.value.trim();
    if (!text) return;
    state.tasks.push({ id: Date.now(), content: text, status: 'todo' });
    input.value = '';
    saveState();
    renderBoard();
}

function handleEnter(e) { if (e.key === 'Enter') addAdhocTask(); }

// SOFT DELETE: Moves to trash
function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.status = 'deleted';
        saveState();
        renderBoard();
    }
}

// RESTORE: Moves back to todo
function restoreTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.status = 'todo';
        saveState();
        renderBoard();
        // If trash modal is open, refresh it
        openTrash();
    }
}

// --- Logic: Progress & Streak ---
function updateProgress() {
    // Filter OUT deleted tasks for progress calculation
    const activeTasks = state.tasks.filter(t => t.status !== 'deleted');
    const total = activeTasks.length;
    const done = activeTasks.filter(t => t.status === 'done').length;

    const percent = total === 0 ? 0 : (done / total) * 100;

    document.getElementById('progress-bar').style.width = `${percent}%`;

    const today = new Date().toISOString().split('T')[0];

    // Streak Logic
    if (percent === 100 && total > 0) {
        if (state.lastStreakDate !== today) {
            state.streak++;
            state.lastStreakDate = today;
            saveState();
        }
    } else {
        // Revoke if they undo tasks
        if (state.lastStreakDate === today) {
            state.streak = Math.max(0, state.streak - 1);
            state.lastStreakDate = null;
            saveState();
        }
    }
    document.getElementById('streak-display').innerText = state.streak;
    updateTrashBadge();
}

function updateTrashBadge() {
    const trashCount = state.tasks.filter(t => t.status === 'deleted').length;
    const badge = document.getElementById('trash-badge');
    if (trashCount > 0) {
        badge.style.display = 'flex';
        badge.innerText = trashCount;
    } else {
        badge.style.display = 'none';
    }
}

// --- UI: Modals ---
function openSettings() {
    document.getElementById('defaults-input').value = state.defaultQuests.join('\n');
    document.getElementById('settings-modal').style.display = 'flex';
}

function saveSettings() {
    const raw = document.getElementById('defaults-input').value;
    const newDefaults = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. Update the template
    state.defaultQuests = newDefaults;

    // 2. Intelligent Sync (Immediate Update)
    // Strategy: Add any new default that isn't currently on the board.
    // We do NOT remove existing tasks to prevent data loss of ad-hoc tasks.

    let addedCount = 0;
    newDefaults.forEach(defQuest => {
        // Check if this quest text exists in current tasks (todo or done)
        const exists = state.tasks.some(t => t.content === defQuest && t.status !== 'deleted');
        if (!exists) {
            state.tasks.push({ id: Date.now() + Math.random(), content: defQuest, status: 'todo' });
        }
    });

    saveState();
    closeModal('settings-modal');
    renderBoard();
}

// --- Logic: History ---
function openHistory() {
    const container = document.getElementById('history-content');
    container.innerHTML = '';
    if (state.history.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center;">No history recorded yet.</p>';
    } else {
        state.history.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'history-item';
            let listHtml = '<ul class="history-tasks">';
            entry.items.forEach(item => { listHtml += `<li>${item}</li>`; });
            listHtml += '</ul>';
            div.innerHTML = `<div class="history-date">${entry.date}</div><div class="history-count">${entry.items.length} missions</div>${listHtml}`;
            container.appendChild(div);
        });
    }
    document.getElementById('history-modal').style.display = 'flex';
}

function openTrash() {
    const container = document.getElementById('trash-content');
    container.innerHTML = '';

    const deletedTasks = state.tasks.filter(t => t.status === 'deleted');

    if (deletedTasks.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center;">Trash is empty.</p>';
    } else {
        deletedTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'trash-item';
            div.innerHTML = `
                        <span>${task.content}</span>
                        <button class="restore-btn" onclick="restoreTask(${task.id})">Restore</button>
                    `;
            container.appendChild(div);
        });
    }
    document.getElementById('trash-modal').style.display = 'flex';
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- Logic: Rendering & Drag/Drop ---
function renderBoard() {
    const todoList = document.getElementById('todo-list');
    const doneList = document.getElementById('done-list');
    todoList.innerHTML = '';
    doneList.innerHTML = '';

    state.tasks.forEach(task => {
        // Don't render deleted tasks in columns
        if (task.status === 'deleted') return;

        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.id = task.id;

        // Add Delete Button Logic
        card.innerHTML = `
                    <span>${task.content}</span>
                    <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete">×</button>
                `;

        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);

        if (task.status === 'todo') todoList.appendChild(card);
        else doneList.appendChild(card);
    });
    updateProgress();
}

let draggedItem = null;
function setupDragAndDrop() {
    document.querySelectorAll('.column').forEach(col => {
        col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
        col.addEventListener('dragleave', () => document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over')));
        col.addEventListener('drop', drop);
    });
}
function dragStart(e) { draggedItem = this; e.dataTransfer.setData('text/plain', this.dataset.id); setTimeout(() => this.classList.add('dragging'), 0); }
function dragEnd() { this.classList.remove('dragging'); document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over')); }
function drop(e) {
    e.preventDefault();
    const id = parseFloat(e.dataTransfer.getData('text/plain'));
    const newStatus = this.getAttribute('data-status');
    const task = state.tasks.find(t => t.id === id);
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveState();
        renderBoard();
    }
}