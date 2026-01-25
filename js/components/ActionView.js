import { store } from '../store.js';

export class ActionView {
    render() {
        // Just take the first challenge for now
        const challenge = store.state.challenges[0];

        return `
            <div class="header">
                <h3>${challenge.name}</h3>
                <h1 style="font-size: 36px">Action tracken</h1>
            </div>

            <div class="action-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                ${challenge.actions.map(action => `
                    <button class="action-btn" data-id="${action.id}" 
                        style="
                            background: ${action.color}; 
                            border: none; 
                            border-radius: 20px; 
                            aspect-ratio: 1; 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center;
                            color: white;
                            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                            position: relative;
                            overflow: hidden;
                        "
                    >
                        <i class="${action.icon} ph-fill" style="font-size: 48px; margin-bottom: 8px;"></i>
                        <span style="font-size: 18px; font-weight: 700;">${action.name}</span>
                        <span style="font-size: 12px; opacity: 0.8; margin-top: 4px;">+${action.points} pts</span>
                        <div class="ripple-container"></div>
                    </button>
                `).join('')}
            </div>

            <div style="margin-top: 32px; text-align: center; color: var(--text-muted);">
                <p>Tippe, um Punkte zu sammeln!</p>
            </div>
        `;
    }

    afterRender() {
        const challenge = store.state.challenges[0];
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
