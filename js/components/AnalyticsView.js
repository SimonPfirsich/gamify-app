import { store } from '../store.js';

export class AnalyticsView {
    constructor() {
        this.numeratorId = 'a4'; // Default to Sale
        this.denominatorId = 'a2'; // Default to Call
    }

    render() {
        const challenge = store.state.challenges[0];

        // Calculate Metric
        const events = store.state.events.filter(e => e.challengeId === challenge.id);
        const countNum = events.filter(e => e.actionId === this.numeratorId).length;
        const countDenom = events.filter(e => e.actionId === this.denominatorId).length;

        let ratio = 0;
        let displayValue = "0%";

        if (countDenom > 0) {
            ratio = (countNum / countDenom) * 100;
            displayValue = ratio.toFixed(1) + '%';
        } else if (countNum > 0) {
            displayValue = "∞";
        }

        const numAction = challenge.actions.find(a => a.id === this.numeratorId);
        const denomAction = challenge.actions.find(a => a.id === this.denominatorId);

        return `
            <div class="header">
                <h1>Analytics</h1>
            </div>

            <div class="card" style="background: linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.1) 100%);">
                <h3 style="margin-bottom: 16px; color: var(--text-muted);">Custom KPI Builder</h3>
                
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px;">
                    <div style="flex: 1;">
                        <label style="font-size: 10px; color: var(--text-muted); display: block; margin-bottom: 4px;">Zähler (Ziel)</label>
                        <select id="kpi-num" class="glass-select" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-color);">
                            ${challenge.actions.map(a => `<option value="${a.id}" ${a.id === this.numeratorId ? 'selected' : ''}>${a.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="font-size: 20px; color: var(--text-muted); padding-top: 16px;">/</div>
                    
                    <div style="flex: 1;">
                        <label style="font-size: 10px; color: var(--text-muted); display: block; margin-bottom: 4px;">Nenner (Basis)</label>
                        <select id="kpi-denom" class="glass-select" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-color);">
                            ${challenge.actions.map(a => `<option value="${a.id}" ${a.id === this.denominatorId ? 'selected' : ''}>${a.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="text-align: center; padding: 24px 0; position: relative;">
                    <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">
                        Conversion Rate
                    </div>
                    <div style="font-size: 48px; font-weight: 700; color: var(--accent-green); text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);">
                        ${displayValue}
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                        ${countNum} ${numAction.name}s aus ${countDenom} ${denomAction.name}s
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>Aktivität</h3>
                 <div style="height: 150px; display: flex; align-items: flex-end; justify-content: space-between; gap: 4px; padding-top: 24px;">
                    ${[50, 80, 40, 90, 30, 60, 100].map(h => `
                        <div style="width: 100%; background: var(--primary); height: ${h}%; border-radius: 4px; opacity: 0.5;"></div>
                    `).join('')}
                 </div>
                 <div style="text-align: center; font-size: 10px; color: var(--text-muted); margin-top: 8px;">Letzte 7 Tage (Mockup)</div>
            </div>
        `;
    }

    afterRender() {
        document.getElementById('kpi-num').addEventListener('change', (e) => {
            this.numeratorId = e.target.value;
            store.notify();
        });
        document.getElementById('kpi-denom').addEventListener('change', (e) => {
            this.denominatorId = e.target.value;
            store.notify();
        });
    }
}
