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
            if (!viewport || !inputContainer) return;

            // Difference between full window and current visual area
            const keyboardOpen = viewport.height < window.innerHeight * 0.85;

            if (keyboardOpen) {
                document.body.classList.add('keyboard-open');

                // ABSOLUTE ANCHOR:
                // We position the container using TOP relative to the viewport's visual bottom.
                // This is the only way to prevent it from escaping during scroll shifts.
                const visualBottom = viewport.offsetTop + viewport.height;
                const containerHeight = inputContainer.offsetHeight;

                // Anchor the container so its bottom matches the visual bottom
                inputContainer.style.bottom = 'auto'; // Disable bottom based CSS
                inputContainer.style.top = `${visualBottom - containerHeight}px`;
                inputContainer.style.transform = `translateX(-50%)`;
            } else {
                document.body.classList.remove('keyboard-open');
                // RESTORE default position
                inputContainer.style.top = 'auto';
                inputContainer.style.bottom = 'calc(var(--nav-height) + var(--safe-area-bottom))';
                inputContainer.style.transform = `translateX(-50%)`;
                window.scrollTo(0, 0);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateLayout);
            window.visualViewport.addEventListener('scroll', updateLayout);
        }

        // Global Nav
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        this.switchTab('actions');
        store.subscribe(() => this.render());
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        if (tabName === 'chat') document.body.classList.add('chat-active');
        else document.body.classList.remove('chat-active', 'keyboard-open');

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
