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
        const updateLayout = () => {
            const viewport = window.visualViewport;
            if (!viewport) return;

            // Robust keyboard detection: if viewport is > 15% smaller than the window, assume keyboard
            const isKeyboardOpen = viewport.height < window.innerHeight * 0.85;
            const activeEl = document.activeElement;
            const isInput = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');

            if (isKeyboardOpen && isInput) {
                document.body.classList.add('keyboard-open');
                // Ensure the focused input is actually the chat input or similar
                // We keep it open as long as any input is focused and space is tight
            } else {
                document.body.classList.remove('keyboard-open');
                window.scrollTo(0, 0);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateLayout);
            window.visualViewport.addEventListener('scroll', updateLayout);
        }

        // Global Navigation Events
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.closest('.nav-item').dataset.tab;
                this.switchTab(tab);
            });
        });

        this.switchTab('actions');

        store.subscribe(() => {
            this.render();
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Visual state based on tab
        if (tabName === 'chat') {
            document.body.classList.add('chat-active');
        } else {
            document.body.classList.remove('chat-active');
            document.body.classList.remove('keyboard-open');
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
