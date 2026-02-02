import { store } from '../store.js';
import { translations } from '../translations.js';

export class LogbookView {
    constructor() {
        this.filterUser = 'all';
        this.filterAction = 'all';
        this.filterTime = 'all';
        this.customStart = '';
        this.customStart = '';
        this.customEnd = '';
        this.editingId = null; // Single item edit mode
        this.longPressTimer = null;
    }

    t(key) {
        return translations[store.state.language][key] || key;
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

                if (this.filterTime === 'today') {
                    timeMatch = date.toDateString() === now.toDateString();
                } else if (this.filterTime === 'week') {
                    const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
                    firstDay.setHours(0, 0, 0, 0);
                    timeMatch = date >= firstDay;
                } else if (this.filterTime === 'month') {
                    timeMatch = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                } else if (this.filterTime === 'year') {
                    timeMatch = date.getFullYear() === now.getFullYear();
                } else if (this.filterTime === 'custom') {
                    if (this.customStart) timeMatch = timeMatch && date >= new Date(this.customStart);
                    if (this.customEnd) timeMatch = timeMatch && date <= new Date(this.customEnd + 'T23:59:59');
                }
            }
            return userMatch && actionMatch && timeMatch;
        });

        return `
            <div class="header">
                <h1>${this.t('logbook')}</h1>
                <p style="font-size: 13px; color: var(--text-muted); opacity: 0.8;">${filteredEvents.length} ${this.t('activities_total')}</p>
            </div>

            <div class="filter-bar">
                <select id="filter-user" class="filter-pill">
                    <option value="all">${this.t('team_members')}</option>
                    ${users.map(u => `<option value="${u.id}" ${this.filterUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                </select>
                <select id="filter-action" class="filter-pill">
                    <option value="all">${this.t('all_actions')}</option>
                    ${allActions.map(a => `<option value="${a.id}" ${this.filterAction === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
                <select id="filter-time" class="filter-pill">
                    <option value="all">${this.t('timeframe')}</option>
                    <option value="today" ${this.filterTime === 'today' ? 'selected' : ''}>${this.t('today')}</option>
                    <option value="week" ${this.filterTime === 'week' ? 'selected' : ''}>${this.t('this_week')}</option>
                    <option value="month" ${this.filterTime === 'month' ? 'selected' : ''}>${this.t('this_month')}</option>
                    <option value="year" ${this.filterTime === 'year' ? 'selected' : ''}>${this.t('this_year')}</option>
                    <option value="custom" ${this.filterTime === 'custom' ? 'selected' : ''}>${this.t('custom')}</option>
                </select>
                <button id="add-log-trigger" class="add-log-btn">
                    <i class="ph ph-plus"></i>
                </button>
            </div>

            ${this.filterTime === 'custom' ? `
                <div class="filter-bar" style="padding-top: 0;">
                    <div style="display:flex; align-items:center; gap:5px; flex:1;">
                        <span style="font-size:11px; color:var(--text-muted)">${this.t('from')}</span>
                        <input type="date" id="custom-start" class="date-pill" value="${this.customStart}">
                    </div>
                    <div style="display:flex; align-items:center; gap:5px; flex:1;">
                        <span style="font-size:11px; color:var(--text-muted)">${this.t('to')}</span>
                        <input type="date" id="custom-end" class="date-pill" value="${this.customEnd}">
                    </div>
                </div>
            ` : ''}

            <div id="log-list" style="padding-bottom: 20px;">
                ${filteredEvents.length === 0 ? `
                    <div style="padding: 60px 40px; text-align: center; color: var(--text-muted); font-size: 14px;">${this.t('no_entries')}</div>
                ` : ''}
                
                ${filteredEvents.map(event => {
            const user = users.find(u => u.id === event.user_id) || { name: 'Unbekannt', avatar: '👤' };
            const challenge = store.state.challenges.find(c => c.id === event.challenge_id);
            const action = challenge?.actions.find(a => a.id === event.action_id) || { name: 'Action', points: 0, icon: '❓', color: '#ccc' };
            const isMe = event.user_id === currentUser.id;
            const date = new Date(event.created_at);

            const fDate = date.toLocaleDateString(store.state.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const fTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const isEditingThis = this.editingId === event.id;

            return `
                        <div class="log-item ${isEditingThis ? 'edit-mode-item' : ''}" data-id="${event.id}" style="position: relative; display: flex; align-items: center;">


                            <div class="log-left" style="opacity: ${isEditingThis ? 0.3 : 1}; flex: 1;">
                <div class="log-info-main">
                    <span class="log-title">${action.name}</span>
                    <span class="log-subtitle">${user.name}</span>
                </div>
            </div>
            <div class="log-right" style="opacity: ${isEditingThis ? 0.3 : 1};">
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <span class="log-score">+${action.points}</span>
                    <span class="log-ts">${fTime} • ${fDate}</span>
                </div>
            </div>
                            
                            ${isEditingThis && isMe ? `
                                <div class="edit-controls-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; gap: 12px; z-index: 102;">
                                    <button class="action-mini-btn edit-log-btn" data-id="${event.id}" style="pointer-events: auto; width: 44px; height: 44px; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none; display: flex; align-items: center; justify-content: center;">
                                        <i class="ph ph-pencil-simple" style="font-size: 22px; color: #64748b;"></i>
                                    </button>
                                    <button class="action-mini-btn delete-log-btn" data-id="${event.id}" style="pointer-events: auto; width: 44px; height: 44px; border-radius: 12px; background: #fee2e2; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none; display: flex; align-items: center; justify-content: center;">
                                        <i class="ph ph-trash" style="font-size: 22px; color: #ef4444;"></i>
                                    </button>
                                </div>
                            ` : ''
                }
                        </div >
                `;
        }).join('')
            }
            </div >

            < !--MODAL FOR ADD / EDIT-- >
    <div id="log-modal" class="modal-layer">
        <div id="log-modal-overlay" style="position: absolute; width:100%; height:100%;"></div>
        <div id="log-sheet" class="bottom-sheet">
            <div style="padding: 24px 24px 40px;">
                <div style="width: 40px; height: 5px; background: #f1f5f9; border-radius: 10px; margin: 0 auto 24px;"></div>
                <h2 id="modal-title" style="font-size: 20px; font-weight: 700; margin-bottom: 24px; color: var(--text-dark);">${this.t('log_activity')}</h2>

                <div class="form-group" id="user-select-group" style="display: none;">
                    <label>${this.t('team_member_admin')}</label>
                    <select id="log-user-select" class="form-control-pill select-pill">
                        ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>${this.t('select_action')}</label>
                    <select id="log-action-select" class="form-control-pill select-pill">
                        ${allActions.map(a => `<option value="${a.id}">${a.name} (${a.points} Pkt)</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>${this.t('date_time')}</label>
                    <input type="datetime-local" id="log-date-input" class="form-control-pill">
                </div>

                <div style="display: flex; gap: 12px; margin-top: 10px;">
                    <button id="close-log-modal" style="flex: 1; padding: 14px; border-radius: 16px; border: 1px solid #e2e8f0; background: white; font-weight: 600; font-size: 15px;">${this.t('cancel')}</button>
                    <button id="submit-log-btn" style="flex: 1; padding: 14px; border-radius: 16px; border: none; background: var(--primary); color: white; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px var(--primary-glow);">${this.t('confirm')}</button>
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
        const customStart = document.getElementById('custom-start');
        const customEnd = document.getElementById('custom-end');

        const triggerAdd = document.getElementById('add-log-trigger');
        const modal = document.getElementById('log-modal');
        const sheet = document.getElementById('log-sheet');
        const overlay = document.getElementById('log-modal-overlay');
        const submitBtn = document.getElementById('submit-log-btn');
        const closeBtn = document.getElementById('close-log-modal');

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
                document.getElementById('modal-title').innerText = this.t('edit_activity');
                logActionSelect.value = ev.action_id;
                logUserSelect.value = ev.user_id;
                userGroup.style.display = 'none';
                const d = new Date(ev.created_at);
                const offset = d.getTimezoneOffset() * 60000;
                logDateInput.value = (new Date(d - offset)).toISOString().slice(0, 16);
            } else {
                document.getElementById('modal-title').innerText = this.t('log_activity');
                logActionSelect.selectedIndex = 0;
                logUserSelect.value = currentUser.id;
                userGroup.style.display = isAdmin ? 'block' : 'none';
                const now = new Date();
                const offset = now.getTimezoneOffset() * 60000;
                logDateInput.value = (new Date(now - offset)).toISOString().slice(0, 16);
            }
            modal.classList.add('active');
            setTimeout(() => { modal.style.background = 'rgba(0,0,0,0.4)'; sheet.classList.add('open'); }, 10);
        };

        const closeModal = () => {
            if (this.editingId) {
                this.editingId = null;
                this.renderUpdate();
                return;
            }
            modal.style.background = 'rgba(0,0,0,0)';
            sheet.classList.remove('open');
            setTimeout(() => modal.classList.remove('active'), 300);
        };

        this.closeModal = closeModal;

        if (userSelect) userSelect.onchange = () => { this.filterUser = userSelect.value; this.renderUpdate(); };
        if (actionSelect) actionSelect.onchange = () => { this.filterAction = actionSelect.value; this.renderUpdate(); };
        if (timeSelect) timeSelect.onchange = () => { this.filterTime = timeSelect.value; this.renderUpdate(); };
        if (customStart) customStart.onchange = () => { this.customStart = customStart.value; this.renderUpdate(); };
        if (customEnd) customEnd.onchange = () => { this.customEnd = customEnd.value; this.renderUpdate(); };

        if (triggerAdd) triggerAdd.onclick = () => openModal();
        if (overlay) overlay.onclick = closeModal;
        if (closeBtn) closeBtn.onclick = closeModal;

        const container = document.getElementById('log-list');

        document.querySelectorAll('.log-item').forEach(item => {
            item.onmousedown = item.ontouchstart = (e) => {
                if (this.editingId) return;
                this.longPressTimer = setTimeout(() => {
                    this.editingId = item.dataset.id;
                    if (navigator.vibrate) navigator.vibrate(50);
                    // Push state for back button integration
                    history.pushState({ editMode: true }, '');
                    this.renderUpdate();
                }, 700);
            };

            item.onmouseup = item.onmouseleave = item.ontouchend = () => {
                clearTimeout(this.longPressTimer);
            };
        });

        // Exit Edit Mode Logic - Global / Container
        const appContainer = document.getElementById('app');
        if (appContainer) { // Global click to catch outside
            this.handleOutsideClick = (e) => {
                if (this.editingId && !e.target.closest('.log-item')) {
                    if (history.state && history.state.editMode) history.back();
                    else {
                        this.editingId = null;
                        this.renderUpdate();
                    }
                }
            };
            document.body.addEventListener('click', this.handleOutsideClick, { once: true });
        }

        if (container) {
            container.onclick = (e) => {
                if (this.editingId && !e.target.closest('.log-item') && !e.target.closest('.edit-controls-list')) {
                    if (history.state && history.state.editMode) history.back();
                    else {
                        this.editingId = null;
                        this.renderUpdate();
                    }
                }
            };
        }

        document.querySelectorAll('.edit-log-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); openModal(btn.dataset.id); });
        document.querySelectorAll('.delete-log-btn').forEach(btn => btn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(this.t('delete_confirm'))) {
                await store.deleteEvent(btn.dataset.id);
                // Stay in edit mode if there are other items? 
                // Currently store delete triggers notify -> re-render -> isEditMode persists if instance not recreated?
                // The re-render creates a new view instance if done via app.js? No, app.js calls render() on same instance.
            }
        });

        if (submitBtn) {
            submitBtn.onclick = async () => {
                const actionId = logActionSelect.value;
                const userId = logUserSelect.value;
                const date = new Date(logDateInput.value).toISOString();
                if (currentId) await store.updateEvent(currentId, actionId, date);
                else {
                    const challenge = store.state.challenges.find(c => c.actions.some(a => a.id === actionId));
                    await store.addEventManual(challenge.id, actionId, userId, date);
                }
                closeModal();
            };
        }
    }

    renderUpdate() {
        const content = document.getElementById('content');
        if (content) { content.innerHTML = this.render(); this.afterRender(); }
    }
}
