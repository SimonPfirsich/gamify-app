import { store } from '../store.js';

export class LogbookView {
    constructor() {
        this.filterUser = 'all';
        this.filterAction = 'all';
    }

    render() {
        const events = [...store.state.events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const users = store.state.users;
        const allActions = store.state.challenges.flatMap(c => c.actions);

        const filteredEvents = events.filter(e => {
            const userMatch = this.filterUser === 'all' || e.user_id === this.filterUser;
            const actionMatch = this.filterAction === 'all' || e.action_id === this.filterAction;
            return userMatch && actionMatch;
        });

        return `
            <div class="header">
                <h1>Logbuch</h1>
                <p>${filteredEvents.length} Einträge</p>
            </div>

            <!-- FILTERS -->
            <div style="padding: 0 20px 15px; display: flex; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <select id="filter-user" style="padding: 6px 12px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; font-size: 13px; outline: none; flex-shrink: 0;">
                    <option value="all">Alle User</option>
                    ${users.map(u => `<option value="${u.id}" ${this.filterUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                </select>
                <select id="filter-action" style="padding: 6px 12px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; font-size: 13px; outline: none; flex-shrink: 0; max-width: 150px;">
                    <option value="all">Alle Actions</option>
                    ${allActions.map(a => `<option value="${a.id}" ${this.filterAction === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
            </div>

            <div id="log-list">
                ${filteredEvents.length === 0 ? '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Keine Einträge gefunden.</div>' : ''}
                ${filteredEvents.map(event => {
            const user = users.find(u => u.id === event.user_id) || { name: 'Unbekannt', avatar: '👤' };
            const challenge = store.state.challenges.find(c => c.id === event.challenge_id);
            const action = challenge?.actions.find(a => a.id === event.action_id) || { name: 'Unbekannte Action', points: 0, icon: '❓', color: '#ccc' };
            const isMe = event.user_id === store.state.currentUser.id;

            return `
                        <div class="log-card" data-id="${event.id}">
                            <div class="user-info">
                                <div class="action-icon" style="background: ${action.color}15; color: ${action.color};">${action.icon}</div>
                                <div class="log-details">
                                    <span style="font-weight: 600; font-size: 14px;">${action.name}</span>
                                    <span style="font-size: 12px; color: var(--text-muted)">${user.name}</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="text-align: right;">
                                    <div class="log-points">+${action.points}</div>
                                    <div class="log-time">${new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${new Date(event.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}</div>
                                </div>
                                ${isMe ? `
                                    <div class="log-actions">
                                        <i class="ph ph-note-pencil edit-log-btn" data-id="${event.id}" title="Bearbeiten"></i>
                                        <i class="ph ph-trash delete-log-btn" data-id="${event.id}" style="color: #ef4444;" title="Löschen"></i>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>

            <!-- MODALS ALREADY IN INDEX.HTML (reuse for consistency) -->
            <div id="edit-log-modal" class="modal-layer">
                <div id="edit-overlay" style="position: absolute; width:100%; height:100%;"></div>
                <div id="edit-sheet" class="bottom-sheet">
                    <div style="padding: 24px;">
                        <div style="width: 40px; height: 5px; background: #ddd; border-radius: 10px; margin: 0 auto 20px;"></div>
                        <h2 style="font-size: 18px; margin-bottom: 15px;">Eintrag bearbeiten</h2>
                        
                        <div class="edit-table">
                            <div>
                                <label>Action</label>
                                <select id="edit-action-select">
                                    ${allActions.map(a => `<option value="${a.id}">${a.name} (${a.points} Pkt)</option>`).join('')}
                                </select>
                            </div>
                            <div style="margin-top: 15px;">
                                <label>Datum & Uhrzeit</label>
                                <input type="datetime-local" id="edit-date-input">
                            </div>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 30px;">
                            <button id="cancel-edit-btn" style="flex: 1; padding: 12px; border-radius: 15px; border: 1px solid #e2e8f0; background: white; font-weight: 600;">Abbrechen</button>
                            <button id="save-edit-btn" style="flex: 1; padding: 12px; border-radius: 15px; border: none; background: var(--primary); color: white; font-weight: 600;">Speichern</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    afterRender() {
        const userSelect = document.getElementById('filter-user');
        const actionSelect = document.getElementById('filter-action');
        const editModal = document.getElementById('edit-log-modal');
        const editSheet = document.getElementById('edit-sheet');
        const editActionSelect = document.getElementById('edit-action-select');
        const editDateInput = document.getElementById('edit-date-input');

        let currentEditingId = null;

        const closeEdit = () => {
            editModal.style.background = 'rgba(0,0,0,0)';
            editSheet.classList.remove('open');
            setTimeout(() => editModal.classList.remove('active'), 300);
        };

        userSelect.onchange = () => {
            this.filterUser = userSelect.value;
            this.renderUpdate();
        };

        actionSelect.onchange = () => {
            this.filterAction = actionSelect.value;
            this.renderUpdate();
        };

        document.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Eintrag wirklich löschen?')) {
                    await store.deleteEvent(btn.dataset.id);
                }
            };
        });

        document.querySelectorAll('.edit-log-btn').forEach(btn => {
            btn.onclick = () => {
                const event = store.state.events.find(e => e.id === btn.dataset.id);
                if (!event) return;
                currentEditingId = event.id;

                editActionSelect.value = event.action_id;
                // Format for datetime-local: YYYY-MM-DDTHH:MM
                const d = new Date(event.created_at);
                const offset = d.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(d - offset)).toISOString().slice(0, 16);
                editDateInput.value = localISOTime;

                editModal.classList.add('active');
                setTimeout(() => {
                    editModal.style.background = 'rgba(0,0,0,0.4)';
                    editSheet.classList.add('open');
                }, 10);
            };
        });

        document.getElementById('edit-overlay').onclick = closeEdit;
        document.getElementById('cancel-edit-btn').onclick = closeEdit;

        document.getElementById('save-edit-btn').onclick = async () => {
            const newActionId = editActionSelect.value;
            const newDate = new Date(editDateInput.value).toISOString();
            await store.updateEvent(currentEditingId, newActionId, newDate);
            closeEdit();
        };
    }

    renderUpdate() {
        const content = document.getElementById('content');
        content.innerHTML = this.render();
        this.afterRender();
    }
}
