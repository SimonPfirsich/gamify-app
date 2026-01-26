import { store } from './store.js';
import { ActionView } from './components/ActionView.js';
import { LeaderboardView } from './components/LeaderboardView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { LogbookView } from './components/LogbookView.js';
import { ChatView } from './components/ChatView.js';
import { translations } from './translations.js';

class App {
    constructor() {
        this.currentTab = 'actions';
        this.initialHeight = window.innerHeight;
        this.views = {
            actions: new ActionView(),
            leaderboard: new LeaderboardView(),
            analytics: new AnalyticsView(),
            logbook: new LogbookView(),
            chat: new ChatView()
        };
        this.init();
    }

    t(key) {
        return translations[store.state.language][key] || key;
    }

    init() {
        const updateLayout = () => {
            const viewport = window.visualViewport;
            if (!viewport) return;
            const isKeyboardOpen = viewport.height < this.initialHeight * 0.85;
            if (isKeyboardOpen) {
                document.body.classList.add('keyboard-open');
            } else {
                document.body.classList.remove('keyboard-open');
                window.scrollTo(0, 0);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateLayout);
        }

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        this.switchTab('actions');
        store.subscribe(() => {
            this.updateNavLabels();
            this.render();
        });
        this.updateNavLabels();
    }

    updateNavLabels() {
        document.querySelector('[data-tab="actions"] span').innerText = this.t('actions');
        document.querySelector('[data-tab="leaderboard"] span').innerText = this.t('bestenliste') || 'Bestenliste'; // Fallback
        document.querySelector('[data-tab="analytics"] span').innerText = this.t('analytics');
        document.querySelector('[data-tab="logbook"] span').innerText = this.t('logbook');
        document.querySelector('[data-tab="chat"] span').innerText = this.t('chat');
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        if (tabName === 'chat') {
            document.body.classList.add('chat-active');
        } else {
            document.body.classList.remove('chat-active', 'keyboard-open');
        }

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        this.render();
    }

    render() {
        const content = document.getElementById('content');
        const view = this.views[this.currentTab];
        content.innerHTML = view.render();
        view.afterRender();
    }
}
new App();
