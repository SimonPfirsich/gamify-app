import { store } from './store.js';
import { ActionView } from './components/ActionView.js';
import { LeaderboardView } from './components/LeaderboardView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { LogbookView } from './components/LogbookView.js';
import { ChatView } from './components/ChatView.js';

class App {
    constructor() {
        this.currentTab = 'actions';
        this.views = {
            actions: new ActionView(),
            leaderboard: new LeaderboardView(),
            analytics: new AnalyticsView(),
            logbook: new LogbookView(),
            chat: new ChatView()
        };

        this.init();
    }

    init() {
        const nav = document.querySelector('.bottom-nav');

        // Global Keyboard Handling
        const updateLayout = () => {
            const isKeyboardOpen = window.innerHeight < window.outerHeight * 0.7;
            const activeEl = document.activeElement;
            const isInput = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');

            if (isKeyboardOpen && isInput) {
                document.body.classList.add('keyboard-open');
            } else {
                document.body.classList.remove('keyboard-open');
            }
        };

        window.visualViewport?.addEventListener('resize', updateLayout);
        window.addEventListener('resize', updateLayout);
        document.addEventListener('focusin', updateLayout);
        document.addEventListener('focusout', () => setTimeout(updateLayout, 100));

        // Bind Nav
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.closest('.nav-item').dataset.tab;
                this.switchTab(tab);
            });
        });

        // Initial Render
        this.switchTab('actions');

        store.subscribe(() => {
            this.render();
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Force Show Nav on Tab Switch (Safety)
        const nav = document.querySelector('.bottom-nav');
        if (nav) nav.style.display = 'flex';

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

// Start App
new App();
