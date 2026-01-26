import { store } from '../store.js';
import { translations } from '../translations.js';

export class ActionView {
    t(key) {
        return translations[store.state.language][key] || key;
    }

    render() {
        const challenges = store.state.challenges;
        const currentUser = store.state.currentUser;

        return `
            <div class="header">
                <h1>Gamify</h1>
                <p>${this.t('actions')}</p>
            </div>
            <div style="padding: 10px 16px;">
                ${challenges.length === 0 ? '<p>Keine Actions verfügbar.</p>' : ''}
                ${challenges.map(c => `
                    <div class="challenge-group" style="margin-bottom: 25px;">
                        <h3 style="font-size: 14px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; font-weight: 600;">${c.name}</h3>
                        <div class="actions-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            ${c.actions.map(a => {
            const count = store.state.events.filter(e => e.action_id === a.id && e.user_id === currentUser.id).length;
            return `
                                    <button class="action-card" data-cid="${c.id}" data-aid="${a.id}" style="
                                        display: flex; flex-direction: column; align-items: flex-start; padding: 15px;
                                        background: white; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                                        text-align: left; cursor: pointer; transition: transform 0.1s; position: relative;
                                    ">
                                        <div style="font-size: 24px; margin-bottom: 8px;">${a.icon}</div>
                                        <div style="font-weight: 600; font-size: 14px; color: var(--text-dark);">${a.name}</div>
                                        <div style="font-size: 11px; color: #10b981; font-weight: 500;">+${a.points} Pkt</div>
                                        ${count > 0 ? `<div style="position: absolute; top: 10px; right: 10px; background: var(--primary); color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${count}</div>` : ''}
                                    </button>
                                `;
        }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    afterRender() {
        document.querySelectorAll('.action-card').forEach(card => {
            card.onclick = () => {
                const cId = card.dataset.cid;
                const aId = card.dataset.aid;
                store.addEvent(cId, aId);
                if (navigator.vibrate) navigator.vibrate(20);
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.style.transform = '', 100);
            };
        });
    }
}
