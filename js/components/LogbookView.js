import { store } from '../store.js';

export class LogbookView {
    render() {
        const events = store.state.events
            .filter(e => e.challengeId === store.state.challenges[0].id)
            .sort((a, b) => b.timestamp - a.timestamp);

        const challenge = store.state.challenges[0];

        return `
            <div class="header">
                <h1>Logbuch</h1>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${events.length === 0 ? '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Keine Einträge vorhanden.</div>' : ''}
                
                ${events.map(event => {
            const action = challenge.actions.find(a => a.id === event.actionId);
            const user = store.state.users.find(u => u.id === event.userId);
            const date = new Date(event.timestamp);
            const isMe = user.id === store.state.currentUser.id;

            return `
                        <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 0;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="
                                    width: 40px; height: 40px; 
                                    background: ${action.color}20; 
                                    color: ${action.color};
                                    border-radius: 12px; 
                                    display: flex; align-items: center; justify-content: center;
                                    font-size: 20px;
                                ">
                                    <i class="${action.icon} ph-fill"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600; font-size: 14px;">${action.name}</div>
                                    <div style="font-size: 11px; color: var(--text-muted);">
                                        ${user.name} • ${date.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            
                            ${isMe ? `
                                <button class="delete-btn" data-id="${event.id}" style="background: none; border: none; color: #ef4444; opacity: 0.5; padding: 8px; cursor: pointer;">
                                    <i class="ph-fill ph-trash" style="font-size: 18px;"></i>
                                </button>
                            ` : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    afterRender() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Eintrag wirklich löschen?')) {
                    const id = btn.dataset.id;
                    store.state.events = store.state.events.filter(e => e.id !== id);
                    store.notify();
                }
            });
        });
    }
}
