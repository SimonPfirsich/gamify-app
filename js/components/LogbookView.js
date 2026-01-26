import { store } from '../store.js';

export class LogbookView {
    constructor() {
        this.filterUser = 'all';
        this.filterAction = 'all';
        this.filterTime = 'all'; // TODAY, WEEK, MONTH, ALL
    }

    render() {
        const events = [...store.state.events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const users = store.state.users;
        const allActions = store.state.challenges.flatMap(c => c.actions);
        const currentUser = store.state.currentUser;

        const filteredEvents = events.filter(e => {
            const userMatch = this.filterUser === 'all' || e.user_id === this.filterUser;
            const actionMatch = this.filterAction === 'all' || e.action_id === this.filterAction;

            let timeMatch = true;
            if (this.filterTime !== 'all') {
                const date = new Date(e.created_at);
                const now = new Date();
                const diff = (now - date) / (1000 * 60 * 60 * 24);
                if (this.filterTime === 'today') timeMatch = diff < 1;
                if (this.filterTime === 'week') timeMatch = diff < 7;
                if (this.filterTime === 'month') timeMatch = diff < 30;
            }
            return userMatch && actionMatch && timeMatch;
        });

        return `
            <div class="header">
                <h1>Logbuch</h1>
                <p style="font-size: 13px; color: var(--text-muted); opacity: 0.8;">${filteredEvents.length} Aktivitäten insgesamt</p>
            </div>

            <!-- PREMIUM FILTER BAR -->
            <div class="filter-bar">
                <select id="filter-user" class="filter-pill">
                    <option value="all">Teammitglieder</option>
                    ${users.map(u => `<option value="${u.id}" ${this.filterUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                </select>
                <select id="filter-action" class="filter-pill">
                    <option value="all">Actions</option>
                    ${allActions.map(a => `<option value="${a.id}" ${this.filterAction === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
                <select id="filter-time" class="filter-pill" style="flex: 0.8;">
                    <option value="all">Zeitraum</option>
                    <option value="today" ${this.filterTime === 'today' ? 'selected' : ''}>Heute</option>
                    <option value="week" ${this.filterTime === 'week' ? 'selected' : ''}>7 Tage</option>
                    <option value="month" ${this.filterTime === 'month' ? 'selected' : ''}>30 Tage</option>
                </select>
                <button id="add-log-trigger" class="add-log-btn">
                    <i class="ph ph-plus"></i>
                </button>
            </div>

            <div id="log-list" style="padding-bottom: 20px;">
                ${filteredEvents.length === 0 ? `
                    <div style="padding: 60px 40px; text-align: center;">
                        <i class="ph ph-magnifying-glass" style="font-size: 40px; color: #e2e8f0; margin-bottom: 10px;"></i>
                        <p style="color: var(--text-muted); font-size: 14px;">Keine Einträge gefunden.</p>
                    </div>
                ` : ''}
                
                ${filteredEvents.map(event => {
            const user = users.find(u => u.id === event.user_id) || { name: 'Unbekannt', avatar: '👤' };
            const challenge = store.state.challenges.find(c => c.id === event.challenge_id);
            const action = challenge?.actions.find(a => a.id === event.action_id) || { name: 'Action', points: 0, icon: '❓', color: '#ccc' };
            const isMe = event.user_id === currentUser.id;
            const date = new Date(event.created_at);

            // DATE FORMAT TT.MM.JJJJ
            const formattedDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                        <div class="log-item">
                            <div class="log-left">
                                <div class="log-icon-box" style="background: ${action.color}15; color: ${action.color};">
                                    <i class="${action.icon || 'ph ph-activity'}"></i>
                                </div>
                                <div class="log-info-main">
                                    <span class="log-title">${action.name}</span>
                                    <span class="log-subtitle">${user.name}</span>
                                </div>
                            </div>
                            <div class="log-right">
                                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                    <span class="log-score">+${action.points}</span>
                                    <span class="log-ts">${formattedTime} • ${formattedDate}</span>
                                </div>
                                ${isMe ? `
                                    <div class="log-actions">
                                        <button class="edit-log-btn" data-id="${event.id}">
                                            <i class="ph ph-pencil-simple"></i>
                                        </button>
                                        <button class="delete-log-btn" data-id="${event.id}" style="color: #ef4444; background: #fee2e2;">
                                            <i class="ph ph-trash"></i>
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>

            <!-- MODAL FOR ADD/EDIT -->
            <div id="log-modal" class="modal-layer">
                <div id="log-modal-overlay" style="position: absolute; width:100%; height:100%;"></div>
                <div id="log-sheet" class="bottom-sheet">
                    <div style="padding: 24px 24px 40px;">
                        <div style="width: 40px; height: 5px; background: #f1f5f9; border-radius: 10px; margin: 0 auto 24px;"></div>
                        <h2 id="modal-title" style="font-size: 20px; font-weight: 700; margin-bottom: 24px; color: var(--text-dark);">Aktivität protokollieren</h2>
                        
                        <div class="form-group" id="user-select-group" style="display: none;">
                            <label>Teammitglied (Admin-Only)</label>
                            <select id="log-user-select" class="form-control">
                                ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Aktion auswählen</label>
                            <select id="log-action-select" class="form-control">
                                ${allActions.map(a => `<option value="${a.id}">${a.name} (${a.points} Pkt)</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Datum & Uhrzeit</label>
                            <input type="datetime-local" id="log-date-input" class="form-control">
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 10px;">
                            <button id="close-log-modal" style="flex: 1; padding: 14px; border-radius: 16px; border: 1px solid #e2e8f0; background: white; font-weight: 600; font-size: 15px; color: var(--text-dark);">Abbrechen</button>
                            <button id="submit-log-btn" style="flex: 1; padding: 14px; border-radius: 16px; border: none; background: var(--primary); color: white; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px var(--primary-glow);">Bestätigen</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    afterRender() {
        const userSelect = document.getElementById('filter-user');
        const actionSelect = document.getElementById('filter-action');
        const timeSelect = document.getElementById('filter-time');
        const triggerAdd = document.getElementById('add-log-trigger');
        const modal = document.getElementById('log-modal');
        const sheet = document.getElementById('log-sheet');
        const overlay = document.getElementById('log-modal-overlay');
        const submitBtn = document.getElementById('submit-log-btn');
        const closeBtn = document.getElementById('close-log-modal');
        const titleEl = document.getElementById('modal-title');

        const logUserSelect = document.getElementById('log-user-select');
        const logActionSelect = document.getElementById('log-action-select');
        const logDateInput = document.getElementById('log-date-input');
        const userGroup = document.getElementById('user-select-group');

        const currentUser = store.state.currentUser;
        const isAdmin = currentUser.name === 'Julius';

        let currentId = null;

        const openModal = (id = null) => {
            currentId = id;
            if (id) {
                const ev = store.state.events.find(e => e.id === id);
                if (!ev) return;
                titleEl.innerText = "Eintrag bearbeiten";
                logActionSelect.value = ev.action_id;
                logUserSelect.value = ev.user_id;
                userGroup.style.display = 'none';

                const d = new Date(ev.created_at);
                const offset = d.getTimezoneOffset() * 60000;
                logDateInput.value = (new Date(d - offset)).toISOString().slice(0, 16);
            } else {
                titleEl.innerText = "Aktivität hinzufügen";
                logActionSelect.selectedIndex = 0;
                logUserSelect.value = currentUser.id;
                userGroup.style.display = isAdmin ? 'block' : 'none';

                const now = new Date();
                const offset = now.getTimezoneOffset() * 60000;
                logDateInput.value = (new Date(now - offset)).toISOString().slice(0, 16);
            }

            modal.classList.add('active');
            setTimeout(() => {
                modal.style.background = 'rgba(0,0,0,0.4)';
                sheet.classList.add('open');
            }, 10);
        };

        const closeModal = () => {
            modal.style.background = 'rgba(0,0,0,0)';
            sheet.classList.remove('open');
            setTimeout(() => modal.classList.remove('active'), 300);
        };

        if (userSelect) userSelect.onchange = () => { this.filterUser = userSelect.value; this.renderUpdate(); };
        if (actionSelect) actionSelect.onchange = () => { this.filterAction = actionSelect.value; this.renderUpdate(); };
        if (timeSelect) timeSelect.onchange = () => { this.filterTime = timeSelect.value; this.renderUpdate(); };
        if (triggerAdd) triggerAdd.onclick = () => openModal();
        if (overlay) overlay.onclick = closeModal;
        if (closeBtn) closeBtn.onclick = closeModal;

        document.querySelectorAll('.edit-log-btn').forEach(btn => {
            btn.onclick = (e) => { e.stopPropagation(); openModal(btn.dataset.id); };
        });

        document.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm('Eintrag wirklich löschen?')) {
                    await store.deleteEvent(btn.dataset.id);
                }
            };
        });

        if (submitBtn) {
            submitBtn.onclick = async () => {
                const actionId = logActionSelect.value;
                const userId = logUserSelect.value;
                const date = new Date(logDateInput.value).toISOString();

                if (currentId) {
                    await store.updateEvent(currentId, actionId, date);
                } else {
                    const challenge = store.state.challenges.find(c => c.actions.some(a => a.id === actionId));
                    await store.addEventManual(challenge.id, actionId, userId, date);
                }
                closeModal();
            };
        }
    }

    renderUpdate() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = this.render();
            this.afterRender();
        }
    }
}
