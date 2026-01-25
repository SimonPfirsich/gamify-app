import { store } from '../store.js';

export class LogbookView {
    render() {
        const challenge = store.state.challenges && store.state.challenges[0];
        if (!challenge) return `<div style="padding: 40px; text-align: center;">Lade Logbuch...</div>`;

        const events = store.state.events
            .filter(e => e.challenge_id === challenge.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return `
            <div class="header">
                <h1>Logbuch</h1>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${events.length === 0 ? '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Keine Einträge vorhanden.</div>' : ''}
                
                ${events.map(event => {
            const action = challenge.actions.find(a => a.id === event.action_id);
            const user = store.state.users.find(u => u.id === event.user_id) || { name: 'Unbekannt' };
            const date = new Date(event.created_at);
            const isMe = user.id === store.state.currentUser.id;

            return `
                        <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 0;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="
                                    width: 40px; height: 40px; 
                                    background: ${action ? action.color : '#ccc'}20; 
                                    color: ${action ? action.color : '#ccc'};
                                    border-radius: 12px; 
                                    display: flex; align-items: center; justify-content: center;
                                    font-size: 20px;
                                ">
                                    <i class="${action ? action.icon : 'ph-question'} ph-fill"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600; font-size: 14px;">${action ? action.name : 'Unbekannte Action'}</div>
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
