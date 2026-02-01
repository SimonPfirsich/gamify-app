import { store } from '../store.js';
import { translations } from '../translations.js';

export class AnalyticsView {
    constructor() {
        this.filterUser = 'all';
        this.filterTime = 'all';
        this.customStart = '';
        this.customEnd = '';
        this.editingId = null; // Single item edit mode
        this.longPressTimer = null;
    }

    t(key) {
        return translations[store.state.language][key] || key;
    }

    // Language-aware pluralization
    pluralize(word) {
        if (!word) return '';

        // Detect word language by checking for German-specific patterns
        const isGermanWord = this.isGermanWord(word);

        if (isGermanWord) {
            // German pluralization rules
            const lowerWord = word.toLowerCase();

            // Exact matches
            if (lowerWord === 'termin') return 'Termine';
            if (lowerWord === 'anruf') return 'Anrufe';
            if (lowerWord === 'sale') return 'Sales';
            if (lowerWord === 'lead') return 'Leads';
            if (lowerWord === 'kontakt' || lowerWord === 'erstkontakt') return word + 'e';

            // Pattern-based
            if (word.endsWith('e')) return word + 'n';
            if (word.endsWith('r') || word.endsWith('l')) return word + 'n';
            if (word.endsWith('ng')) return word + 'en';

            return word + 's';
        } else {
            // English pluralization rules
            const lowerWord = word.toLowerCase();

            // Irregular plurals
            if (lowerWord === 'sale') return 'Sales';
            if (lowerWord === 'lead') return 'Leads';
            if (lowerWord === 'call') return 'Calls';
            if (lowerWord === 'contact') return 'Contacts';

            // Pattern-based
            if (word.endsWith('y') && !'aeiou'.includes(word[word.length - 2])) {
                return word.slice(0, -1) + 'ies';
            }
            if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) {
                return word + 'es';
            }

            return word + 's';
        }
    }

    // Detect if a word is likely German based on patterns
    isGermanWord(word) {
        const lowerWord = word.toLowerCase();

        // Common German endings
        const germanEndings = ['termin', 'anruf', 'kontakt', 'ung', 'heit', 'keit', 'schaft'];
        if (germanEndings.some(ending => lowerWord.endsWith(ending))) return true;

        // German compound words often have capital letters in the middle
        if (/[a-z][A-Z]/.test(word)) return true;

        // German umlauts
        if (/[äöüÄÖÜß]/.test(word)) return true;

        // Common English words (if it's not one of these, assume German in German context)
        const commonEnglishWords = ['sale', 'lead', 'call', 'contact', 'meeting', 'email', 'demo'];
        if (commonEnglishWords.includes(lowerWord)) return false;

        // Default: if UI language is German, assume word is German
        return store.state.language === 'de';
    }

    render() {
        const users = store.state.users;
        const allActions = store.state.challenges.flatMap(c => c.actions);
        const events = store.state.events;
        const savedRatios = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');

        return `
            <div class="header">
                <h1>${this.t('analytics')}</h1>
                <p style="font-size: 13px; color: var(--text-muted); opacity: 0.8;">${this.t('performance')}</p>
            </div>

            <div class="filter-bar">
                <select id="ana-filter-user" class="filter-pill">
                    <option value="all">${this.t('team_members')}</option>
                    ${users.map(u => `<option value="${u.id}" ${this.filterUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                </select>
                <select id="ana-filter-time" class="filter-pill">
                    <option value="all">${this.t('timeframe')}</option>
                    <option value="today" ${this.filterTime === 'today' ? 'selected' : ''}>${this.t('today')}</option>
                    <option value="week" ${this.filterTime === 'week' ? 'selected' : ''}>${this.t('this_week')}</option>
                    <option value="month" ${this.filterTime === 'month' ? 'selected' : ''}>${this.t('this_month')}</option>
                    <option value="year" ${this.filterTime === 'year' ? 'selected' : ''}>${this.t('this_year')}</option>
                    <option value="custom" ${this.filterTime === 'custom' ? 'selected' : ''}>${this.t('custom')}</option>
                </select>
                <button id="add-ratio-trigger" class="add-log-btn">
                    <i class="ph ph-plus"></i>
                </button>
            </div>

            ${this.filterTime === 'custom' ? `
                <div class="filter-bar" style="padding-top: 0;">
                    <div style="display:flex; align-items:center; gap:5px; flex:1;">
                        <span style="font-size:11px; color:var(--text-muted)">${this.t('from')}</span>
                        <input type="date" id="ana-custom-start" class="date-pill" value="${this.customStart}">
                    </div>
                    <div style="display:flex; align-items:center; gap:5px; flex:1;">
                        <span style="font-size:11px; color:var(--text-muted)">${this.t('to')}</span>
                        <input type="date" id="ana-custom-end" class="date-pill" value="${this.customEnd}">
                    </div>
                </div>
            ` : ''}

            <div id="ratios-container" style="margin-top: 10px;">
                <h3 style="padding: 0 16px; font-size: 14px; margin-bottom: 12px; color: var(--text-muted);">${this.t('ratios')}</h3>
                ${savedRatios.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px;">${this.t('no_entries')}</div>` : ''}
                <div id="ratio-list" class="ratios-grid">
                    ${savedRatios.map((ratio, index) => this.renderRatioCard(ratio, index, events, allActions)).join('')}
                </div>
            </div>

            <div style="margin-top: 30px; padding: 0 16px 100px;">
                <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--text-muted);">${this.t('charts')}</h3>
                <div style="height: 120px; background: #f8fafc; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; border: 2px dashed #edf2f7;">
                    <i class="ph ph-chart-line-up" style="font-size: 24px; margin-right: 8px;"></i>
                    <p style="font-size: 11px;">${this.t('trends_loading')}</p>
                </div>
            </div>

            <!-- RATIO MODAL -->
            <div id="ratio-modal" class="modal-layer">
                <div id="ratio-modal-overlay" style="position: absolute; width:100%; height:100%;"></div>
                <div id="ratio-sheet" class="bottom-sheet">
                    <div style="padding: 24px 24px 40px;">
                        <div style="width: 40px; height: 5px; background: #f1f5f9; border-radius: 10px; margin: 0 auto 24px;"></div>
                        <h2 id="ratio-modal-title" style="font-size: 20px; font-weight: 700; margin-bottom: 24px;">${this.t('ratio_definition')}</h2>
                        
                        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">${this.t('action_num')}</label>
                                <select id="ratio-act-1" class="form-control-pill select-pill">
                                    ${allActions.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">${this.t('action_den')}</label>
                                <select id="ratio-act-2" class="form-control-pill select-pill">
                                    ${allActions.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 10px;">
                            <button id="close-ratio-modal" style="flex: 1; padding: 14px; border-radius: 16px; border: 1px solid #e2e8f0; background: white; font-weight: 600;">${this.t('cancel')}</button>
                            <button id="submit-ratio-btn" style="flex: 1; padding: 14px; border-radius: 16px; border: none; background: var(--primary); color: white; font-weight: 700;">${this.t('save')}</button>
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

        let filtered = events;
        if (this.filterUser !== 'all') filtered = filtered.filter(e => e.user_id === this.filterUser);
        if (this.filterTime !== 'all') {
            const now = new Date();
            filtered = filtered.filter(e => {
                const d = new Date(e.created_at);
                if (this.filterTime === 'today') return d.toDateString() === now.toDateString();
                if (this.filterTime === 'week') {
                    const fDay = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
                    fDay.setHours(0, 0, 0, 0);
                    return d >= fDay;
                }
                if (this.filterTime === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                if (this.filterTime === 'year') return d.getFullYear() === now.getFullYear();
                if (this.filterTime === 'custom') {
                    let ok = true;
                    if (this.customStart) ok = ok && d >= new Date(this.customStart);
                    if (this.customEnd) ok = ok && d <= new Date(this.customEnd + 'T23:59:59');
                    return ok;
                }
                return true;
            });
        }

        const count1 = filtered.filter(e => e.action_id === ratio.act1).length;
        const count2 = filtered.filter(e => e.action_id === ratio.act2).length;
        const percentage = count2 === 0 ? 0 : Math.round((count1 / count2) * 100);

        const plural1 = this.pluralize(act1.name);
        const plural2 = this.pluralize(act2.name);

        const isEditingThis = this.editingId === String(index);

        return `
            <div class="ratio-card ${isEditingThis ? 'edit-mode' : ''}" data-index="${index}" draggable="${!!this.editingId}" style="position: relative; overflow: visible;">
                ${isEditingThis ? `
                     <div class="drag-handle-ratio" style="position: absolute; top: 8px; color: #1e293b; width: 100%; display: flex; justify-content: center;">
                        <i class="ph ph-dots-six-vertical" style="font-size: 32px; font-weight: bold;"></i>
                    </div>
                ` : ''}
                
                <div class="ratio-info" style="opacity: ${isEditingThis ? 0.2 : 1};">
                    <span class="ratio-label">${plural1} ${this.t('pro')} ${act2.name}</span>
                    <span class="ratio-value">${percentage}%</span>
                    <span class="ratio-details">${count1} ${plural1} / ${count2} ${plural2}</span>
                </div>

                <div class="edit-controls" style="display: ${isEditingThis ? 'flex' : 'none'}; position: absolute; bottom: 10px; left: 0; width: 100%; justify-content: center; gap: 12px; z-index: 20;">
                    <button class="action-btn edit-ratio-btn" data-index="${index}" style="pointer-events:auto; width: 40px; height: 40px; border-radius: 12px; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.15); border: none; display: flex; align-items: center; justify-content: center;"><i class="ph ph-pencil-simple" style="font-size: 20px; color: #64748b;"></i></button>
                    <button class="action-btn delete delete-ratio-btn" data-index="${index}" style="pointer-events:auto; width: 40px; height: 40px; border-radius: 12px; background: #fee2e2; box-shadow: 0 4px 15px rgba(0,0,0,0.15); border: none; display: flex; align-items: center; justify-content: center;"><i class="ph ph-trash" style="font-size: 20px; color: #ef4444;"></i></button>
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
        const cStart = document.getElementById('ana-custom-start');
        const cEnd = document.getElementById('ana-custom-end');

        let currentId = null;

        const openModal = (index = null) => {
            currentId = index;
            const ratios = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
            if (index !== null) {
                document.getElementById('ratio-modal-title').innerText = this.t('edit_ratio');
                act1Select.value = ratios[index].act1;
                act2Select.value = ratios[index].act2;
            } else {
                document.getElementById('ratio-modal-title').innerText = this.t('ratio_definition');
                act1Select.selectedIndex = 0;
                act2Select.selectedIndex = 1;
            }
            modal.classList.add('active');
            history.pushState({ modal: 'open' }, '');
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

        this.closeModal = closeModal; // Bind to instance for App.js to call

        if (trigger) trigger.onclick = () => openModal();
        if (overlay) overlay.onclick = closeModal;
        if (closeBtn) closeBtn.onclick = closeModal;
        if (userFilter) userFilter.onchange = () => { this.filterUser = userFilter.value; this.renderUpdate(); };
        if (timeFilter) timeFilter.onchange = () => { this.filterTime = timeFilter.value; this.renderUpdate(); };
        if (cStart) cStart.onchange = () => { this.customStart = cStart.value; this.renderUpdate(); };
        if (cEnd) cEnd.onchange = () => { this.customEnd = cEnd.value; this.renderUpdate(); };

        if (submitBtn) submitBtn.onclick = () => {
            const ratios = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
            const newRatio = { act1: act1Select.value, act2: act2Select.value };
            if (currentId !== null) ratios[currentId] = newRatio;
            else ratios.push(newRatio);
            localStorage.setItem('gamify_ratios', JSON.stringify(ratios));
            closeModal();
            this.renderUpdate();
        };

        document.querySelectorAll('.delete-ratio-btn').forEach(btn => btn.onclick = (e) => {
            e.stopPropagation();
            const rs = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
            rs.splice(btn.dataset.index, 1);
            localStorage.setItem('gamify_ratios', JSON.stringify(rs));
            this.renderUpdate();
        });

        document.querySelectorAll('.edit-ratio-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); openModal(parseInt(btn.dataset.index)); });

        // DRAG AND DROP
        // LONG PRESS TO ENTER EDIT MODE
        const cards = document.querySelectorAll('.ratio-card');
        cards.forEach(card => {
            card.onmousedown = card.ontouchstart = (e) => {
                if (this.editingId) return;
                this.longPressTimer = setTimeout(() => {
                    this.editingId = card.dataset.index;
                    if (navigator.vibrate) navigator.vibrate(50);
                    // Push state for back button integration
                    history.pushState({ editMode: true }, '');
                    this.renderUpdate();
                }, 700);
            };
            card.onmouseup = card.onmouseleave = card.ontouchend = () => {
                clearTimeout(this.longPressTimer);
            };

            if (this.editingId) {
                card.addEventListener('dragstart', () => {
                    if (card.dataset.index === this.editingId) card.classList.add('dragging');
                });
                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                    const rs = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
                    // Need to reconstruct order from DOM
                    const newOrder = [...document.querySelectorAll('.ratio-card')].map(c => rs[parseInt(c.dataset.index)]);
                    localStorage.setItem('gamify_ratios', JSON.stringify(newOrder));
                    this.renderUpdate();
                });
            }
        });

        // Exit edit mode on click outside
        // Using global click handler for robustness
        const appContainer = document.getElementById('app');
        if (appContainer) {
            this.handleOutsideClick = (e) => {
                if (this.editingId && !e.target.closest('.ratio-card')) {
                    // Check if history state needs popping
                    if (history.state && history.state.editMode) history.back();
                    else {
                        this.editingId = null;
                        this.renderUpdate();
                    }
                }
            };
            document.body.addEventListener('click', this.handleOutsideClick, { once: true }); // Attach once per render or handle cleanup? 
            // Better: attached globally but checked. Since we render often, maybe attaching to body repeatedly is bad.
            // Actually renderUpdate is called, which re-attaches. 
            // Let's use the local container click for simplicity first, as ActionView did it globally but we can try local if it works.
        }

        const ratioList = document.getElementById('ratio-list');
        if (ratioList) {
            ratioList.onclick = (e) => {
                if (this.editingId && !e.target.closest('.ratio-card') && !e.target.closest('.edit-controls')) {
                    // Manual exit
                    if (history.state && history.state.editMode) history.back();
                    else {
                        this.editingId = null;
                        this.renderUpdate();
                    }
                }
            };
        }

        const list = document.getElementById('ratio-list');
        if (list) {
            list.addEventListener('dragover', e => {
                if (!this.editingId) return;
                e.preventDefault();
                const dragging = document.querySelector('.dragging');
                if (!dragging) return;
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
        if (content) { content.innerHTML = this.render(); this.afterRender(); }
    }
}
