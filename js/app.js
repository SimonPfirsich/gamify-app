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
        // Since interactive-widget=resizes-content is set,
        // Chrome will now physically resize the viewport.
        // We only need to toggle classes.
        const updateLayout = () => {
            const viewport = window.visualViewport;
            if (!viewport) return;
            const isKeyboardOpen = viewport.height < window.innerHeight * 0.85;
            if (isKeyboardOpen) document.body.classList.add('keyboard-open');
            else {
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
