import { store } from '../store.js';
import { translations } from '../translations.js';

export class LeaderboardView {
    constructor() {
        this.selectedChallenge = null;
        this.filterTime = 'all';
        this.filterAction = 'all';
        this.customStart = '';
        this.customEnd = '';
    }

    t(key) {
        return translations[store.state.language][key] || key;
    }

    getFilteredEvents() {
        let events = store.state.events;
        const now = new Date();

        return events.filter(e => {
            const date = new Date(e.created_at);
            let timeMatch = true;

            if (this.filterTime === 'today') {
                timeMatch = date.toDateString() === now.toDateString();
            } else if (this.filterTime === 'week') {
                const firstDay = new Date(now);
                firstDay.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
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

            let actionMatch = true;
            if (this.filterAction !== 'all') {
                actionMatch = e.action_id === this.filterAction;
            }

            return timeMatch && actionMatch;
        });
    }

    getLeaderboard(challengeId) {
        const challenge = store.state.challenges.find(c => c.id === challengeId);
        if (!challenge) return [];

        const events = this.getFilteredEvents().filter(e => e.challenge_id === challengeId);
        const userScores = {};

        events.forEach(e => {
            const action = challenge.actions.find(a => a.id === e.action_id);
            if (action) {
                userScores[e.user_id] = (userScores[e.user_id] || 0) + action.points;
            }
        });

        return Object.entries(userScores)
            .map(([userId, score]) => ({
                user: store.state.users.find(u => u.id === userId) || { name: 'Unknown', avatar: '👤' },
                score
            }))
            .sort((a, b) => b.score - a.score);
    }

    render() {
        const challenges = store.state.challenges;
        const allActions = challenges.flatMap(c => c.actions);

        if (challenges.length > 0 && !this.selectedChallenge) {
            this.selectedChallenge = challenges[0].id;
        }

        const leaderboard = this.getLeaderboard(this.selectedChallenge);
        const medals = ['🥇', '🥈', '🥉'];

        return `
            <div class="header">
                <h1>${this.t('leaderboard')}</h1>
                <p>${this.t('champions') || 'Champions'}</p>
            </div>
            
            <div class="filter-bar">
                <select id="lb-filter-action" class="filter-pill">
                    <option value="all">${this.t('all_actions')} (alle)</option>
                    ${allActions.map(a => `<option value="${a.id}" ${this.filterAction === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
                <select id="lb-filter-time" class="filter-pill">
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
                        <input type="date" id="lb-custom-start" class="date-pill" value="${this.customStart}">
                    </div>
                    <div style="display:flex; align-items:center; gap:5px; flex:1;">
                        <span style="font-size:11px; color:var(--text-muted)">${this.t('to')}</span>
                        <input type="date" id="lb-custom-end" class="date-pill" value="${this.customEnd}">
                    </div>
                </div>
            ` : ''}
            
            <div style="padding: 0 16px;">
                <div style="background: white; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow: hidden; border: 1px solid #f1f5f9; padding: 8px 0;">
                    ${leaderboard.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px;">${this.t('no_entries')}</div>` : ''}
                    
                    ${leaderboard.map((entry, idx) => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; margin-bottom: 2px; background: ${idx < 3 ? 'linear-gradient(to right, #ffffff, #fdfdfd)' : 'white'};">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="font-weight: 800; width: 28px; font-size: 24px; color: ${idx < 3 ? 'var(--text-dark)' : '#cbd5e1'}; text-align: center; line-height: 1;">
                                    ${idx < 3 ? medals[idx] : '#' + (idx + 1)}
                                </div>
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid ${idx === 0 ? '#fbbf24' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#b45309' : 'transparent'))};">
                                    ${entry.user.avatar}
                                </div>
                                <div style="font-weight: 600; font-size: 15px; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
                                    ${entry.user.name}
                                    ${idx === 0 ? '🏆' : ''}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 800; font-size: 18px; color: var(--primary);">${entry.score}</div>
                                <div style="font-size: 10px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${entry.score === 1 ? (this.t('point') || 'Punkt') : (this.t('points') || 'Punkte')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    afterRender() {
        const timeFilter = document.getElementById('lb-filter-time');
        if (timeFilter) {
            timeFilter.onchange = () => {
                this.filterTime = timeFilter.value;
                this.renderUpdate();
            };
        }

        const actionFilter = document.getElementById('lb-filter-action');
        if (actionFilter) {
            actionFilter.onchange = () => {
                this.filterAction = actionFilter.value;
                this.renderUpdate();
            };
        }

        const startInput = document.getElementById('lb-custom-start');
        const endInput = document.getElementById('lb-custom-end');

        if (startInput) startInput.onchange = () => { this.customStart = startInput.value; this.renderUpdate(); };
        if (endInput) endInput.onchange = () => { this.customEnd = endInput.value; this.renderUpdate(); };
    }

    renderUpdate() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = this.render();
            this.afterRender();
        }
    }
}

