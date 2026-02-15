
// --- State Management ---
let state = {
    streak: 0,
    lastVisit: null,      
    lastStreakDate: null, // Date streak was last incremented
    defaultQuests: ["Drink Water", "Read 10 Pages", "Plan Tomorrow"],
    tasks: []
};

// --- Init ---
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkDailyReset();
    renderBoard();
    setupDragAndDrop();
});

// --- Logic: Persistence ---
function saveState() {
    localStorage.setItem('zen_focus_v2', JSON.stringify(state));
}

function loadState() {
    const data = localStorage.getItem('zen_focus_v2');
    if (data) state = JSON.parse(data);
}

// --- Logic: Daily Reset ---
function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];

    if (state.lastVisit !== today) {
        // It's a new day!
        // 1. Wipe current tasks
        state.tasks = [];

        // 2. Load defaults into Todo
        state.defaultQuests.forEach((q, i) => {
            state.tasks.push({
                id: Date.now() + i,
                content: q,
                status: 'todo'
            });
        });

        // 3. Update visit date
        state.lastVisit = today;
        saveState();
    }
}

// --- Logic: Progress & Streak ---
function updateProgress() {
    const total = state.tasks.length;
    const done = state.tasks.filter(t => t.status === 'done').length;

    // 1. Update Bar
    const percent = total === 0 ? 0 : (done / total) * 100;
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('progress-text').innerText = `${done}/${total} Completed`;

    const today = new Date().toISOString().split('T')[0];

    // 2. Check Streak Condition
    if (percent === 100 && total > 0) {
        // If we haven't credited today's streak yet
        if (state.lastStreakDate !== today) {
            state.streak++;
            state.lastStreakDate = today;
            saveState();
            triggerConfetti(); // Celebration!
        }
    } else {
        // BUG FIX: If progress drops below 100% AND we already credited the streak today...
        if (state.lastStreakDate === today) {
            state.streak = Math.max(0, state.streak - 1); // Decrease streak (min 0)
            state.lastStreakDate = null; // Reset date so you can earn it again today
            saveState();
        }
    }

    // Update Streak Badge
    document.getElementById('streak-display').innerText = state.streak;
}

// --- Logic: Rendering ---
function renderBoard() {
    const todoList = document.getElementById('todo-list');
    const doneList = document.getElementById('done-list');

    todoList.innerHTML = '';
    doneList.innerHTML = '';

    state.tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.id = task.id;
        card.textContent = task.content;

        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);

        if (task.status === 'todo') {
            todoList.appendChild(card);
        } else {
            doneList.appendChild(card);
        }
    });

    updateProgress();
}

// --- Logic: Drag & Drop ---
let draggedItem = null;

function setupDragAndDrop() {
    document.querySelectorAll('.column').forEach(col => {
        col.addEventListener('dragover', e => {
            e.preventDefault();
            col.classList.add('drag-over');
        });
        col.addEventListener('dragleave', () => {
            document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
        });
        col.addEventListener('drop', drop);
    });
}

function dragStart(e) {
    draggedItem = this;
    e.dataTransfer.setData('text/plain', this.dataset.id);
    setTimeout(() => this.classList.add('dragging'), 0);
}

function dragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
}

function drop(e) {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData('text/plain'));
    const newStatus = this.getAttribute('data-status'); // 'todo' or 'done'

    const task = state.tasks.find(t => t.id === id);

    // If task exists and status changed
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveState();
        renderBoard(); // Re-render triggers updateProgress()
    }
}

// --- Logic: Settings ---
function openSettings() {
    document.getElementById('defaults-input').value = state.defaultQuests.join('\n');
    document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function saveDefaults() {
    const raw = document.getElementById('defaults-input').value;
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    state.defaultQuests = lines;
    saveState();
    closeSettings();

    // For now, simple alert.
    alert("Saved! New habits will appear tomorrow.");
}

// --- Logic: Simple Confetti ---
function triggerConfetti() {
    // Simple DOM confetti
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.style.position = 'fixed';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = '-10px';
        p.style.width = '8px';
        p.style.height = '8px';
        p.style.background = ['#74b9ff', '#55efc4', '#fab1a0'][Math.floor(Math.random() * 3)];
        p.style.transition = 'top 2s ease-in, opacity 2s ease-out';
        p.style.zIndex = '999';
        document.body.appendChild(p);

        setTimeout(() => {
            p.style.top = '100vh';
            p.style.opacity = '0';
        }, 100);
        setTimeout(() => p.remove(), 2000);
    }
}