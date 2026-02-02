import { store } from '../store.js';
import { translations } from '../translations.js';

export class LeaderboardView {
    constructor() {
        this.selectedChallenge = null;
        this.filterTime = 'all';
        this.filterAction = 'all';
    }

    t(key) {
        return translations[store.state.language][key] || key;
    }

    getFilteredEvents() {
        let events = store.state.events;

        // Time filter
        const now = new Date();
        let startDate = null;

        if (this.filterTime === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        } else if (this.filterTime === 'week') {
            const dayOfWeek = now.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday, 0, 0, 0);
        } else if (this.filterTime === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        } else if (this.filterTime === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        }

        if (startDate) {
            events = events.filter(e => new Date(e.created_at) >= startDate);
        }

        // Action filter
        if (this.filterAction !== 'all') {
            events = events.filter(e => e.action_id === this.filterAction);
        }

        return events;
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
                </select>
            </div>
            
            <div style="padding: 0 16px; margin-bottom: 20px; display: flex; gap: 8px; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch;">
                ${challenges.map(c => `
                    <button class="challenge-tab ${this.selectedChallenge === c.id ? 'active' : ''}" data-id="${c.id}" style="
                        padding: 8px 16px; border-radius: 20px; border: none; font-size: 13px; font-weight: 500;
                        background: ${this.selectedChallenge === c.id ? 'var(--primary)' : '#f1f5f9'};
                        color: ${this.selectedChallenge === c.id ? 'white' : 'var(--text-muted)'};
                        cursor: pointer;
                    ">${c.name}</button>
                `).join('')}
            </div>

            <div style="padding: 0 16px;">
                ${leaderboard.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px;">${this.t('no_entries')}</div>` : ''}
                ${leaderboard.map((entry, idx) => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: white; border-radius: 16px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-weight: 700; width: 20px; color: ${idx < 3 ? 'var(--primary)' : '#94a3b8'};">#${idx + 1}</div>
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 18px;">${entry.user.avatar}</div>
                            <div style="font-weight: 600; font-size: 14px;">${entry.user.name}</div>
                        </div>
                        <div style="font-weight: 700; color: var(--primary);">${entry.score} <span style="font-size: 10px; font-weight: 400; color: var(--text-muted);">${this.t('points') || 'Punkte'}</span></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    afterRender() {
        document.querySelectorAll('.challenge-tab').forEach(tab => {
            tab.onclick = () => {
                this.selectedChallenge = tab.dataset.id;
                this.renderUpdate();
            };
        });

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
    }

    renderUpdate() {
        const content = document.getElementById('content');
        content.innerHTML = this.render();
        this.afterRender();
    }
}

