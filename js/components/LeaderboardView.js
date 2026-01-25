import { store } from '../store.js';

export class LeaderboardView {
    constructor() {
        this.timeFilter = 'all';
        this.actionFilter = 'all';
    }

    render() {
        const challenge = store.state.challenges[0];
        const leaderboard = store.getLeaderboard(challenge.id, this.actionFilter === 'all' ? null : this.actionFilter);

        return `
            <div class="header">
                <h1>Hall of Fame</h1>
            </div>

            <div class="filters" style="display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px;">
                <select id="time-filter" class="glass-select" style="padding: 8px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-card); color: white;">
                    <option value="all">Gesamtzeit</option>
                    <option value="week">Diese Woche</option>
                    <option value="today">Heute</option>
                </select>

                <select id="action-filter" class="glass-select" style="padding: 8px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-card); color: white;">
                    <option value="all">Alle Actions</option>
                    ${challenge.actions.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select>
            </div>

            <div class="leaderboard-list">
                ${leaderboard.map((entry, index) => `
                    <div class="card" style="display: flex; align-items: center; justify-content: space-between; border-left: 4px solid ${index === 0 ? 'var(--accent-orange)' : 'var(--bg-card)'}">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="font-size: 24px; font-weight: 700; width: 30px; color: var(--text-muted);">#${index + 1}</div>
                            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                ${entry.user.avatar}
                            </div>
                            <div>
                                <div style="font-weight: 600; font-size: 16px;">${entry.user.name}</div>
                                <div style="font-size: 12px; color: var(--text-muted);">Level 5 Guru</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${entry.score}</div>
                            <div style="font-size: 10px; color: var(--text-muted);">Punkte</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    afterRender() {
        const timeSelect = document.getElementById('time-filter');
        const actionSelect = document.getElementById('action-filter');

        // Restore state
        timeSelect.value = this.timeFilter;
        actionSelect.value = this.actionFilter;

        timeSelect.addEventListener('change', (e) => {
            this.timeFilter = e.target.value;
            // Trigger re-render managed by App, but here we just need to update internal state and maybe force app update
            // Since app renders on store update, we might need a manual trigger or just wait. 
            // In a simple app, we can just call app render. 
            // But let's cheat and trigger a store notify or call render directly.
            store.notify(); // Hack to re-render
        });

        actionSelect.addEventListener('change', (e) => {
            this.actionFilter = e.target.value;
            store.notify();
        });
    }
}
