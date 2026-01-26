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

            // Accurate keyboard height detection
            const keyboardHeight = window.innerHeight - viewport.height;
            const isKeyboardOpen = keyboardHeight > 60; // Threshold

            if (isKeyboardOpen) {
                document.body.classList.add('keyboard-open');
                if (inputContainer) {
                    // Lock to the exact top edge of the keyboard
                    // We use translateY to prevent layout thrashing and keep it 'magnetic'
                    inputContainer.style.bottom = '0px';
                    inputContainer.style.transform = `translateX(-50%) translateY(-${keyboardHeight}px)`;
                }
            } else {
                document.body.classList.remove('keyboard-open');
                if (inputContainer) {
                    inputContainer.style.bottom = 'calc(var(--nav-height) + var(--safe-area-bottom))';
                    inputContainer.style.transform = 'translateX(-50%) translateY(0)';
                }
                window.scrollTo(0, 0);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateLayout);
            window.visualViewport.addEventListener('scroll', updateLayout);
        }

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
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
