import { store } from '../store.js';
import { translations } from '../translations.js';

export class LeaderboardView {
    constructor() {
        this.selectedChallenge = null;
    }

    t(key) {
        return translations[store.state.language][key] || key;
    }

    render() {
        const challenges = store.state.challenges;
        if (challenges.length > 0 && !this.selectedChallenge) {
            this.selectedChallenge = challenges[0].id;
        }

        const leaderboard = store.getLeaderboard(this.selectedChallenge);

        return `
            <div class="header">
                <h1>Bestenliste</h1>
                <p>Champions</p>
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
                ${leaderboard.map((entry, idx) => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: white; border-radius: 16px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-weight: 700; width: 20px; color: ${idx < 3 ? 'var(--primary)' : '#94a3b8'};">#${idx + 1}</div>
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 18px;">${entry.user.avatar}</div>
                            <div style="font-weight: 600; font-size: 14px;">${entry.user.name}</div>
                        </div>
                        <div style="font-weight: 700; color: var(--primary);">${entry.score} <span style="font-size: 10px; font-weight: 400; color: var(--text-muted);">Pkt</span></div>
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
    }

    renderUpdate() {
        const content = document.getElementById('content');
        content.innerHTML = this.render();
        this.afterRender();
    }
}
