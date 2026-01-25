import { store } from '../store.js';

export class ActionView {
    render() {
        // Just take the first challenge for now
        const challenge = store.state.challenges && store.state.challenges[0];

        if (!challenge) {
            return `
                <div class="header">
                    <h1>Willkommen!</h1>
                </div>
                <div class="card" style="text-align: center; padding: 40px;">
                    <i class="ph-fill ph-database" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                    <p>Warte auf Daten...</p>
                    <p style="font-size: 12px; margin-top: 8px; color: var(--text-muted);">
                        Die App verbindet sich gerade mit deiner Cloud.
                    </p>
                </div>
            `;
        }

        return `
            <div class="header">
                <h3>${challenge.name}</h3>
                <h1 style="font-size: 36px">Action tracken</h1>
            </div>

            <div class="action-list" style="display: flex; flex-direction: column; gap: 12px;">
                ${challenge.actions.map(action => `
                    <button class="action-btn" data-id="${action.id}" 
                        style="
                            background: ${action.color}; 
                            border: none; 
                            border-radius: 20px; 
                            width: 100%;
                            padding: 20px;
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            color: white;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                            position: relative;
                            cursor: pointer;
                        "
                    >
                        <span style="font-size: 20px; font-weight: 600;">${action.name}</span>
                    </button>
                `).join('')}
            </div>

            <div style="margin-top: 32px; text-align: center; color: var(--text-muted);">
                <p>Tippe, um Punkte zu sammeln!</p>
            </div>
        `;
    }

    afterRender() {
        const challenge = store.state.challenges && store.state.challenges[0];
        if (!challenge) return;

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = btn.dataset.id;

                // Animation Feedback
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = 'scale(1)', 100);

                store.addEvent(challenge.id, actionId);
            });
        });
    }
}
