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
        try {
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
                    <option value="all">${this.t('team_members')} (alle)</option>
                    ${users.map(u => `<option value="${u.id}" ${this.filterUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                </select>
                <select id="ana-filter-time" class="filter-pill">
                    <option value="all">${this.t('timeframe')} (alle)</option>
                    <option value="today" ${this.filterTime === 'today' ? 'selected' : ''}>${this.t('today')}</option>
                    <option value="week" ${this.filterTime === 'week' ? 'selected' : ''}>${this.t('this_week')}</option>
                    <option value="month" ${this.filterTime === 'month' ? 'selected' : ''}>${this.t('this_month')}</option>
                    <option value="year" ${this.filterTime === 'year' ? 'selected' : ''}>${this.t('this_year')}</option>
                    <option value="custom" ${this.filterTime === 'custom' ? 'selected' : ''}>${this.t('custom')}</option>
                </select>
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
                ${savedRatios.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px;">${this.t('no_entries')}</div>` : ''}
                <div id="ratio-list" class="ratios-grid" style="max-height: 240px; overflow-y: auto;">
                    ${savedRatios.filter(r => r && r.act1 && r.act2).map((ratio, index) => this.renderRatioCard(ratio, index, events, allActions, savedRatios.filter(r => r && r.act1 && r.act2).length)).join('')}
                    <div id="add-ratio-trigger" class="ratio-card ghost-ratio-btn" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: 2px dashed #e2e8f0; opacity: 0.6; cursor: pointer; min-height: 110px; border-radius: 20px;">
                        <i class="ph ph-plus" style="font-size: 32px; color: #cbd5e1;"></i>
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px; padding: 0 16px 100px;">
                
                <!-- LINE CHART: Activity Trend -->
                <div style="background: white; border-radius: 16px; padding: 16px; margin-bottom: 16px; border: 1px solid #f1f5f9;">
                    <div style="font-size: 12px; font-weight: 600; color: var(--text-dark); margin-bottom: 12px;">${this.t('activity_trend') || 'Aktivitäts-Trend'}</div>
                    ${this.renderLineChart(this.getFilteredEvents(events))}
                </div>
                
                <!-- DONUT CHART: Action Distribution -->
                <div style="background: white; border-radius: 16px; padding: 16px; margin-bottom: 16px; border: 1px solid #f1f5f9;">
                    <div style="font-size: 12px; font-weight: 600; color: var(--text-dark); margin-bottom: 12px;">${this.t('action_distribution') || 'Verteilung der Actions'}</div>
                    ${this.renderDonutChart(this.getFilteredEvents(events), allActions)}
                </div>
                
                <!-- BAR CHART: Top Actions -->
                <div style="background: white; border-radius: 16px; padding: 16px; margin-bottom: 16px; border: 1px solid #f1f5f9;">
                    <div style="font-size: 12px; font-weight: 600; color: var(--text-dark); margin-bottom: 12px;">${this.t('top_actions') || 'Top Actions'}</div>
                    ${this.renderBarChart(this.getFilteredEvents(events), allActions)}
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
        } catch (e) {
            console.error("Analytics Render Error:", e);
            return '<div style="padding:40px; text-align:center; color:#ef4444;">Ein Fehler ist aufgetreten: ' + e.message + '</div>';
        }
    }

    renderRatioCard(ratio, index, events, allActions, totalRatios) {
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
        const isFirst = index === 0;
        const isLast = index === totalRatios - 1;

        return `
            <div class="ratio-card ${isEditingThis ? 'edit-mode' : ''}" data-index="${index}" style="position: relative; overflow: visible;">

                <div class="ratio-info" style="opacity: ${isEditingThis ? 0.1 : 1}; word-break: break-word; hyphens: auto; display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%; pointer-events: none;">
                    <span class="ratio-label" style="word-break: break-word; hyphens: auto; font-size: 13px; line-height: 1.3; margin-bottom: 4px;">${plural1} ${this.t('pro')} ${act2.name}</span>
                    <span class="ratio-value">${percentage}%</span>
                    <span class="ratio-details" style="word-break: break-word;">${count1} ${plural1} / ${count2} ${plural2}</span>
                </div>

                <!-- Edit Controls 2x2 Grid -->
                ${isEditingThis ? `
                    <div class="edit-controls-tile" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6px; padding: 6px; z-index: 102; background: rgba(255,255,255,0.93); border-radius: 20px;">
                        <button class="move-ratio-left action-mini-btn" data-index="${index}" ${isFirst ? 'disabled style="opacity:0.3;pointer-events:none; width:100%; height:100%; border:none; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;"' : 'style="width:100%; height:100%; border:none; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;"'}>
                            <i class="ph ph-arrow-left" style="font-size: 20px; color: #334155;"></i>
                        </button>
                        <button class="move-ratio-right action-mini-btn" data-index="${index}" ${isLast ? 'disabled style="opacity:0.3;pointer-events:none; width:100%; height:100%; border:none; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;"' : 'style="width:100%; height:100%; border:none; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;"'}>
                            <i class="ph ph-arrow-right" style="font-size: 20px; color: #334155;"></i>
                        </button>
                        <button class="edit-ratio-btn action-mini-btn" data-index="${index}" style="width:100%; height:100%; border:none; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;">
                            <i class="ph ph-pencil-simple" style="font-size: 20px; color: var(--primary);"></i>
                        </button>
                        <button class="delete-ratio-btn action-mini-btn" data-index="${index}" style="width:100%; height:100%; border:none; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;">
                            <i class="ph ph-trash" style="font-size: 20px; color: #ef4444;"></i>
                        </button>
                    </div>
                ` : ''}
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

        this.closeModal = closeModal;

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

        // Card Event Handlers
        const cards = document.querySelectorAll('.ratio-card:not(.ghost-ratio-btn)');
        cards.forEach(card => {
            // LONG PRESS (Simple)
            card.ontouchstart = (e) => {
                if (this.editingId) return;
                this.longPressTimer = setTimeout(() => {
                    this.editingId = card.dataset.index;
                    if (navigator.vibrate) navigator.vibrate(50);
                    history.pushState({ editMode: true }, '');
                    this.renderUpdate();
                }, 600);
            };

            card.ontouchend = card.ontouchcancel = () => {
                clearTimeout(this.longPressTimer);
            };

            // Mouse events for desktop
            card.onmousedown = (e) => {
                if (this.editingId) return;
                this.longPressTimer = setTimeout(() => {
                    this.editingId = card.dataset.index;
                    if (navigator.vibrate) navigator.vibrate(50);
                    history.pushState({ editMode: true }, '');
                    this.renderUpdate();
                }, 600);
            };

            card.onmouseup = card.onmouseleave = () => {
                clearTimeout(this.longPressTimer);
            };

            // CLICK ACTION
            card.onclick = (e) => {
                if (this.editingId) {
                    if (e.target.closest('.move-ratio-left')) {
                        const idx = parseInt(e.target.closest('.move-ratio-left').dataset.index);
                        this.moveRatio(idx, -1);
                        e.stopPropagation();
                    } else if (e.target.closest('.move-ratio-right')) {
                        const idx = parseInt(e.target.closest('.move-ratio-right').dataset.index);
                        this.moveRatio(idx, 1);
                        e.stopPropagation();
                    } else if (e.target.closest('.edit-ratio-btn')) {
                        const idx = parseInt(e.target.closest('.edit-ratio-btn').dataset.index);
                        this.editingId = null;
                        openModal(idx);
                        e.stopPropagation();
                    } else if (e.target.closest('.delete-ratio-btn')) {
                        const idx = parseInt(e.target.closest('.delete-ratio-btn').dataset.index);
                        // Fade out animation
                        card.classList.add('deleting');
                        this.editingId = null;
                        setTimeout(() => {
                            const rs = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
                            rs.splice(idx, 1);
                            localStorage.setItem('gamify_ratios', JSON.stringify(rs));
                            this.renderUpdate();
                        }, 400);
                        e.stopPropagation();
                    } else {
                        this.editingId = null;
                        this.renderUpdate();
                    }
                    return;
                }
            };
        });

        // Exit edit mode on click outside
        document.body.addEventListener('click', (e) => {
            if (this.editingId && !e.target.closest('.ratio-card')) {
                this.editingId = null;
                this.renderUpdate();
            }
        }, { once: true });
    }

    moveRatio(index, direction) {
        const rs = JSON.parse(localStorage.getItem('gamify_ratios') || '[]');
        const newIdx = index + direction;
        if (newIdx < 0 || newIdx >= rs.length) return;

        // Swap
        [rs[index], rs[newIdx]] = [rs[newIdx], rs[index]];
        localStorage.setItem('gamify_ratios', JSON.stringify(rs));

        // Update editingId to follow the moved ratio
        this.editingId = String(newIdx);
        this.renderUpdate();
    }

    getDragAfterElement(container, x, y) {
        // If only 2 args, y is actually passed as x (for backward compatibility)
        if (y === undefined) { y = x; }
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

    getFilteredEvents(events) {
        let filtered = events;

        // User filter
        if (this.filterUser !== 'all') {
            filtered = filtered.filter(e => e.user_id === this.filterUser);
        }

        // Time filter
        const now = new Date();
        let startDate = null;

        if (this.filterTime === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        } else if (this.filterTime === 'week') {
            // Since Monday 00:00 of current week
            const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday, 0, 0, 0);
        } else if (this.filterTime === 'month') {
            // Since 1st of current month 00:00
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        } else if (this.filterTime === 'year') {
            // Since Jan 1st 00:00 of current year
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        } else if (this.filterTime === 'custom' && this.customStart && this.customEnd) {
            const start = new Date(this.customStart);
            start.setHours(0, 0, 0, 0);
            const end = new Date(this.customEnd);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(e => {
                const d = new Date(e.created_at);
                return d >= start && d <= end;
            });
            return filtered;
        }

        if (startDate) {
            filtered = filtered.filter(e => {
                const d = new Date(e.created_at);
                return d >= startDate;
            });
        }

        return filtered;
    }

    renderLineChart(events) {
        const counts = [];
        const labels = [];
        let numPoints = 7;
        let dateFormat = { weekday: 'short' };

        // Determine range based on filter
        if (this.filterTime === 'today') {
            numPoints = 6;
            dateFormat = { hour: '2-digit' };
            for (let i = numPoints - 1; i >= 0; i--) {
                const d = new Date();
                d.setHours(d.getHours() - i * 4, 0, 0, 0);
                labels.push(d.toLocaleTimeString(store.state.language === 'de' ? 'de-DE' : 'en-US', dateFormat));
                const hEnd = new Date(d);
                hEnd.setHours(d.getHours() + 4, 0, 0, 0);
                let filtered = events.filter(e => {
                    const ed = new Date(e.created_at);
                    return ed >= d && ed < hEnd;
                });
                counts.push(filtered.length);
            }
        } else if (this.filterTime === 'month') {
            numPoints = 4;
            dateFormat = { day: '2-digit', month: 'short' };
            for (let i = numPoints - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i * 7);
                d.setHours(0, 0, 0, 0);
                labels.push(d.toLocaleDateString(store.state.language === 'de' ? 'de-DE' : 'en-US', dateFormat));
                const wEnd = new Date(d);
                wEnd.setDate(wEnd.getDate() + 7);
                let filtered = events.filter(e => {
                    const ed = new Date(e.created_at);
                    return ed >= d && ed < wEnd;
                });
                counts.push(filtered.length);
            }
        } else if (this.filterTime === 'year') {
            numPoints = 6;
            dateFormat = { month: 'short' };
            for (let i = numPoints - 1; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i * 2);
                d.setDate(1);
                d.setHours(0, 0, 0, 0);
                labels.push(d.toLocaleDateString(store.state.language === 'de' ? 'de-DE' : 'en-US', dateFormat));
                const mEnd = new Date(d);
                mEnd.setMonth(mEnd.getMonth() + 2);
                let filtered = events.filter(e => {
                    const ed = new Date(e.created_at);
                    return ed >= d && ed < mEnd;
                });
                counts.push(filtered.length);
            }
        } else {
            // Default: last 7 days (for 'week', 'all', 'custom')
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                labels.push(d.toLocaleDateString(store.state.language === 'de' ? 'de-DE' : 'en-US', { weekday: 'short' }));
                const dayEnd = new Date(d);
                dayEnd.setHours(23, 59, 59, 999);
                let filtered = events.filter(e => {
                    const ed = new Date(e.created_at);
                    return ed >= d && ed <= dayEnd;
                });
                counts.push(filtered.length);
            }
        }

        const max = Math.max(...counts, 1);
        const width = 280;
        const height = 100;
        const padding = 20;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding;
        const numSegs = counts.length - 1;

        const points = counts.map((c, i) => {
            const x = padding + (numSegs > 0 ? (i / numSegs) * chartWidth : chartWidth / 2);
            const y = height - padding - (c / max) * chartHeight;
            return { x, y };
        });

        const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + ' ' + p.x + ' ' + p.y).join(' ');
        const areaD = pathD + ' L ' + points[points.length - 1].x + ' ' + (height - padding) + ' L ' + points[0].x + ' ' + (height - padding) + ' Z';

        const circlesHtml = points.map(p => '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="var(--primary)" />').join('');
        const labelsHtml = labels.map((l, i) => '<text x="' + (padding + (numSegs > 0 ? (i / numSegs) * chartWidth : chartWidth / 2)) + '" y="' + (height - 2) + '" text-anchor="middle" font-size="8" fill="#94a3b8">' + l + '</text>').join('');

        return '<svg width="100%" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" style="display: block;"><defs><linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:var(--primary);stop-opacity:0.3" /><stop offset="100%" style="stop-color:var(--primary);stop-opacity:0" /></linearGradient></defs><path d="' + areaD + '" fill="url(#lineGradient)" /><path d="' + pathD + '" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />' + circlesHtml + labelsHtml + '</svg>';
    }

    renderDonutChart(events, allActions) {
        // Events are already filtered by getFilteredEvents

        const actionCounts = {};
        events.forEach(e => {
            actionCounts[e.action_id] = (actionCounts[e.action_id] || 0) + 1;
        });

        const sortedActions = Object.entries(actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const total = sortedActions.reduce((sum, arr) => sum + arr[1], 0);
        if (total === 0) {
            return '<div style="text-align: center; color: #94a3b8; font-size: 12px; padding: 20px;">' + this.t('no_entries') + '</div>';
        }

        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
        const size = 120;
        const cx = size / 2;
        const cy = size / 2;
        const radius = 45;
        const innerRadius = 28;

        let currentAngle = -90;
        let segmentsHtml = '';
        let legendHtml = '';

        sortedActions.forEach((arr, i) => {
            const actionId = arr[0];
            const count = arr[1];
            const angle = (count / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);
            const x3 = cx + innerRadius * Math.cos(endRad);
            const y3 = cy + innerRadius * Math.sin(endRad);
            const x4 = cx + innerRadius * Math.cos(startRad);
            const y4 = cy + innerRadius * Math.sin(startRad);

            const largeArc = angle > 180 ? 1 : 0;
            const path = 'M ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' L ' + x3 + ' ' + y3 + ' A ' + innerRadius + ' ' + innerRadius + ' 0 ' + largeArc + ' 0 ' + x4 + ' ' + y4 + ' Z';

            const action = allActions.find(a => a.id === actionId);
            const name = action ? action.name : 'Action';

            segmentsHtml += '<path d="' + path + '" fill="' + colors[i] + '" />';
            legendHtml += '<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;"><div style="width: 10px; height: 10px; border-radius: 3px; background: ' + colors[i] + ';"></div><span style="color: var(--text-dark); flex: 1; word-break: break-word;">' + name + '</span><span style="color: #94a3b8;">' + count + '</span></div>';
        });

        return '<div style="display: flex; align-items: center; gap: 16px;"><svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + segmentsHtml + '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="middle" font-size="16" font-weight="700" fill="var(--text-dark)">' + total + '</text></svg><div style="flex: 1; font-size: 11px;">' + legendHtml + '</div></div>';
    }

    renderBarChart(events, allActions) {
        // Events are already filtered by getFilteredEvents

        const actionCounts = {};
        events.forEach(e => {
            actionCounts[e.action_id] = (actionCounts[e.action_id] || 0) + 1;
        });

        const sorted = Object.entries(actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (sorted.length === 0) {
            return '<div style="text-align: center; color: #94a3b8; font-size: 12px; padding: 20px;">' + this.t('no_entries') + '</div>';
        }

        const max = sorted[0][1];

        let barsHtml = '';
        sorted.forEach(arr => {
            const actionId = arr[0];
            const count = arr[1];
            const action = allActions.find(a => a.id === actionId);
            const name = action ? action.name : 'Action';
            const pct = (count / max) * 100;
            barsHtml += '<div style="display: flex; align-items: center; gap: 8px;"><div style="width: 70px; font-size: 11px; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + name + '</div><div style="flex: 1; height: 16px; background: #f1f5f9; border-radius: 8px; overflow: hidden;"><div style="height: 100%; width: ' + pct + '%; background: linear-gradient(90deg, var(--primary), #8b5cf6); border-radius: 8px;"></div></div><div style="width: 24px; font-size: 11px; color: #64748b; text-align: right;">' + count + '</div></div>';
        });

        return '<div style="display: flex; flex-direction: column; gap: 8px;">' + barsHtml + '</div>';
    }
}
