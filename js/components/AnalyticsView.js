import { store } from '../store.js';

export class AnalyticsView {
    constructor() {
        this.filterUser = 'all';
        this.filterTime = 'all';
    }

    render() {
        const users = store.state.users;
        const allActions = store.state.challenges.flatMap(c => c.actions);
        const events = store.state.events;
        const currentUser = store.state.currentUser;

        // LOAD SAVED RATIOS
        const savedRatios = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');

        return `
            <div class="header">
                <h1>Analytics</h1>
                <p style="font-size: 13px; color: var(--text-muted); opacity: 0.8;">Performance & Quoten</p>
            </div>

            <!-- FILTERS -->
            <div class="filter-bar">
                <select id="ana-filter-user" class="filter-pill">
                    <option value="all">Teammitglieder</option>
                    ${users.map(u => `<option value="${u.id}" ${this.filterUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                </select>
                <select id="ana-filter-time" class="filter-pill">
                    <option value="all">Zeitraum</option>
                    <option value="today" ${this.filterTime === 'today' ? 'selected' : ''}>Heute</option>
                    <option value="week" ${this.filterTime === 'week' ? 'selected' : ''}>7 Tage</option>
                    <option value="month" ${this.filterTime === 'month' ? 'selected' : ''}>30 Tage</option>
                </select>
                <button id="add-ratio-trigger" class="add-log-btn">
                    <i class="ph ph-plus"></i>
                </button>
            </div>

            <!-- RATIOS SECTION -->
            <div id="ratios-container" style="margin-top: 10px;">
                <h3 style="padding: 0 16px; font-size: 14px; margin-bottom: 12px; color: var(--text-muted);">QUOTEN</h3>
                ${savedRatios.length === 0 ? `
                    <div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px;">
                        Klicke auf +, um eine Quote zu erstellen (z.B. Leads zu Sales).
                    </div>
                ` : ''}
                <div id="ratio-list">
                    ${savedRatios.map((ratio, index) => this.renderRatioCard(ratio, index, events, allActions)).join('')}
                </div>
            </div>

            <!-- CHARTS PLACEHOLDER -->
            <div style="margin-top: 30px; padding: 0 16px 100px;">
                <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--text-muted);">DIAGRAMME</h3>
                <div style="height: 180px; background: #f8fafc; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; border: 2px dashed #edf2f7;">
                    <div style="text-align: center;">
                        <i class="ph ph-chart-line-up" style="font-size: 30px;"></i>
                        <p style="font-size: 11px; margin-top: 5px;">Trend-Visualisierung folgt...</p>
                    </div>
                </div>
            </div>

            <!-- RATIO MODAL -->
            <div id="ratio-modal" class="modal-layer">
                <div id="ratio-modal-overlay" style="position: absolute; width:100%; height:100%;"></div>
                <div id="ratio-sheet" class="bottom-sheet">
                    <div style="padding: 24px 24px 40px;">
                        <div style="width: 40px; height: 5px; background: #f1f5f9; border-radius: 10px; margin: 0 auto 24px;"></div>
                        <h2 id="ratio-modal-title" style="font-size: 20px; font-weight: 700; margin-bottom: 24px;">Quote definieren</h2>
                        
                        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Action 1 (Zähler)</label>
                                <select id="ratio-act-1" class="form-control">
                                    ${allActions.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('')}
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Action 2 (Nenner)</label>
                                <select id="ratio-act-2" class="form-control">
                                    ${allActions.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 10px;">
                            <button id="close-ratio-modal" style="flex: 1; padding: 14px; border-radius: 16px; border: 1px solid #e2e8f0; background: white; font-weight: 600;">Abbrechen</button>
                            <button id="submit-ratio-btn" style="flex: 1; padding: 14px; border-radius: 16px; border: none; background: var(--primary); color: white; font-weight: 700;">Hinzufügen</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRatioCard(ratio, index, events, allActions) {
        const act1 = allActions.find(a => a.id === ratio.act1);
        const act2 = allActions.find(a => a.id === ratio.act2);
        if (!act1 || !act2) return '';

        // CALCULATE RATIO BASED ON FILTERS
        let filteredEvents = events;
        if (this.filterUser !== 'all') filteredEvents = filteredEvents.filter(e => e.user_id === this.filterUser);
        if (this.filterTime !== 'all') {
            const now = new Date();
            filteredEvents = filteredEvents.filter(e => {
                const diff = (now - new Date(e.created_at)) / (1000 * 60 * 60 * 24);
                if (this.filterTime === 'today') return diff < 1;
                if (this.filterTime === 'week') return diff < 7;
                if (this.filterTime === 'month') return diff < 30;
                return true;
            });
        }

        const count1 = filteredEvents.filter(e => e.action_id === ratio.act1).length;
        const count2 = filteredEvents.filter(e => e.action_id === ratio.act2).length;

        const percentage = count2 === 0 ? 0 : Math.round((count1 / count2) * 100);

        return `
            <div class="ratio-card" data-index="${index}" draggable="true">
                <div class="ratio-info">
                    <span class="ratio-label">${act1.name} zu ${act2.name}</span>
                    <span class="ratio-value">${percentage}%</span>
                    <span class="ratio-details">${count1} / ${count2} Einheiten</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="edit-ratio-btn" data-index="${index}" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; color: #64748b;"><i class="ph ph-pencil-simple"></i></button>
                    <button class="delete-ratio-btn" data-index="${index}" style="background: #fee2e2; border: none; width: 32px; height: 32px; border-radius: 8px; color: #ef4444;"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        `;
    }

    afterRender() {
        const modal = document.getElementById('ratio-modal');
        const sheet = document.getElementById('ratio-sheet');
        const overlay = document.getElementById('ratio-modal-overlay');
        const trigger = document.getElementById('add-ratio-trigger');
        const submitBtn = document.getElementById('submit-ratio-btn');
        const closeBtn = document.getElementById('close-ratio-modal');

        const act1Select = document.getElementById('ratio-act-1');
        const act2Select = document.getElementById('ratio-act-2');

        const userFilter = document.getElementById('ana-filter-user');
        const timeFilter = document.getElementById('ana-filter-time');

        let currentId = null; // null = Add, index = Edit

        const openModal = (index = null) => {
            currentId = index;
            const ratios = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
            if (index !== null) {
                document.getElementById('ratio-modal-title').innerText = "Quote bearbeiten";
                submitBtn.innerText = "Speichern";
                act1Select.value = ratios[index].act1;
                act2Select.value = ratios[index].act2;
            } else {
                document.getElementById('ratio-modal-title').innerText = "Quote definieren";
                submitBtn.innerText = "Hinzufügen";
                act1Select.selectedIndex = 0;
                act2Select.selectedIndex = 1;
            }
            modal.classList.add('active');
            setTimeout(() => { modal.style.background = 'rgba(0,0,0,0.4)'; sheet.classList.add('open'); }, 10);
        };

        const closeModal = () => {
            modal.style.background = 'rgba(0,0,0,0)';
            sheet.classList.remove('open');
            setTimeout(() => modal.classList.remove('active'), 300);
        };

        if (trigger) trigger.onclick = () => openModal();
        if (overlay) overlay.onclick = closeModal;
        if (closeBtn) closeBtn.onclick = closeModal;

        if (userFilter) userFilter.onchange = () => { this.filterUser = userFilter.value; this.renderUpdate(); };
        if (timeFilter) timeFilter.onchange = () => { this.filterTime = timeFilter.value; this.renderUpdate(); };

        submitBtn.onclick = () => {
            const ratios = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
            const newRatio = { act1: act1Select.value, act2: act2Select.value };
            if (currentId !== null) ratios[currentId] = newRatio;
            else ratios.push(newRatio);
            localStorage.setItem('gamify_ratios', JSON.stringify(ratios));
            closeModal();
            this.renderUpdate();
        };

        document.querySelectorAll('.delete-ratio-btn').forEach(btn => {
            btn.onclick = () => {
                const ratios = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
                ratios.splice(btn.dataset.index, 1);
                localStorage.setItem('gamify_ratios', JSON.stringify(ratios));
                this.renderUpdate();
            };
        });

        document.querySelectorAll('.edit-ratio-btn').forEach(btn => {
            btn.onclick = () => openModal(parseInt(btn.dataset.index));
        });

        // DRAG AND DROP
        const cards = document.querySelectorAll('.ratio-card');
        cards.forEach(card => {
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                const newOrder = [...document.querySelectorAll('.ratio-card')].map(c => {
                    const ratios = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
                    return ratios[c.dataset.index];
                });
                localStorage.setItem('gamify_ratios', JSON.stringify(newOrder));
                this.renderUpdate();
            });
        });

        const list = document.getElementById('ratio-list');
        if (list) {
            list.addEventListener('dragover', e => {
                e.preventDefault();
                const dragging = document.querySelector('.dragging');
                const afterElement = this.getDragAfterElement(list, e.clientY);
                if (afterElement == null) list.appendChild(dragging);
                else list.insertBefore(dragging, afterElement);
            });
        }
    }

    getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll('.ratio-card:not(.dragging)')];
        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            else return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    renderUpdate() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = this.render();
            this.afterRender();
        }
    }
}
