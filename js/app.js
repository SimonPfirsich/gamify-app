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
        const inputContainer = document.getElementById('chat-input-container');

        const updateLayout = () => {
            const viewport = window.visualViewport;
            if (!viewport) return;

            const isKeyboardOpen = viewport.height < window.innerHeight * 0.85;
            const activeEl = document.activeElement;
            const isInput = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');

            if (isKeyboardOpen && isInput) {
                document.body.classList.add('keyboard-open');
                // FORCE repositioning using top instead of bottom for absolute screen stability
                const keyboardHeight = window.innerHeight - viewport.height;
                // Place it exactly ABOVE the keyboard
                if (inputContainer) {
                    inputContainer.style.bottom = `${keyboardHeight}px`;
                }
            } else {
                document.body.classList.remove('keyboard-open');
                if (inputContainer) {
                    // Back to standard position (above nav)
                    inputContainer.style.bottom = '65px';
                }
                window.scrollTo(0, 0);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateLayout);
            window.visualViewport.addEventListener('scroll', updateLayout);
        }

        // Global Nav
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.closest('.nav-item').dataset.tab;
                this.switchTab(tab);
            });
        });

        this.switchTab('actions');
        store.subscribe(() => this.render());
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        if (tabName === 'chat') document.body.classList.add('chat-active');
        else {
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
