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
        // Global Keyboard Handling using VisualViewport
        const updateLayout = () => {
            const viewport = window.visualViewport;
            if (!viewport) return;

            // When the viewport height is significantly less than the screen height, keyboard is likely open
            const isKeyboardOpen = viewport.height < window.innerHeight * 0.85;
            const activeEl = document.activeElement;
            const isInput = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');

            if (isKeyboardOpen && isInput) {
                document.body.classList.add('keyboard-open');
            } else {
                document.body.classList.remove('keyboard-open');
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateLayout);
            window.visualViewport.addEventListener('scroll', updateLayout);
        }

        // Additional Focus listeners as backup
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                // Short delay to let keyboard animation start
                setTimeout(updateLayout, 100);
            }
        });

        document.addEventListener('focusout', () => {
            setTimeout(updateLayout, 300);
        });

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

        // Reset visibility just in case
        document.body.classList.remove('keyboard-open');

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
