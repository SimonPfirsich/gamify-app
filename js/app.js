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
        this.startY = 0;
        this.pullDelta = 0;
        this.isPulling = false;
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

        this.setupPullToRefresh();

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        const savedTab = localStorage.getItem('gamify_last_tab') || 'actions';
        this.switchTab(savedTab);
        store.subscribe(() => this.render());
    }

    setupPullToRefresh() {
        const content = document.getElementById('content');
        const refresher = document.getElementById('pull-to-refresh');
        const icon = document.getElementById('refresh-icon');

        document.addEventListener('touchstart', (e) => {
            const scrollTop = Math.max(content.scrollTop, window.scrollY, document.documentElement.scrollTop);
            if (scrollTop <= 0) {
                this.startY = e.touches[0].pageY;
                this.isPulling = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.isPulling) return;
            const y = e.touches[0].pageY;
            this.pullDelta = Math.max(0, (y - this.startY) * 0.4);

            if (this.pullDelta > 0) {
                refresher.style.opacity = Math.min(this.pullDelta / 50, 1);
                const visualY = Math.min(this.pullDelta, 140);
                refresher.style.transform = `translate3d(-50%, ${visualY}px, 0)`;
                icon.style.transform = `rotate(${this.pullDelta * 4}deg)`;

                if (this.pullDelta > 85) {
                    refresher.style.color = 'var(--primary-dark)';
                } else {
                    refresher.style.color = 'var(--primary)';
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (!this.isPulling) return;
            this.isPulling = false;

            if (this.pullDelta > 85) {
                refresher.style.transform = 'translate3d(-50%, 60px, 0)';
                icon.classList.add('ph-spin');
                // Snappier reload
                setTimeout(() => {
                    location.reload(true);
                }, 50);
            } else {
                refresher.style.transform = 'translate3d(-50%, -100px, 0)';
                refresher.style.opacity = '0';
                icon.style.transform = '';
            }
            this.pullDelta = 0;
        });
    }

    updateNavLabels() {
        const navItems = {
            'actions': this.t('actions'),
            'leaderboard': this.t('leaderboard'),
            'analytics': this.t('analytics'),
            'logbook': this.t('logbook'),
            'chat': this.t('chat')
        };

        Object.entries(navItems).forEach(([tab, label]) => {
            const span = document.querySelector(`[data-tab="${tab}"] span`);
            if (span) span.innerText = label;
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        localStorage.setItem('gamify_last_tab', tabName);
        if (tabName === 'chat') {
            document.body.classList.add('chat-active');
        } else {
            document.body.classList.remove('chat-active', 'keyboard-open');
        }

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // NATIVE MODAL CLOSE ON BACK
        window.onpopstate = (e) => {
            const view = this.views[this.currentTab];
            // If we have an active view with a close method, prioritize it
            if (view && typeof view.closeModal === 'function' && (document.querySelector('.bottom-sheet.open') || document.querySelector('.modal-layer.active') || view.editingId)) {
                view.closeModal();
            } else if (view && typeof view.closePicker === 'function' && (document.getElementById('emoji-picker-container').classList.contains('active'))) {
                view.closePicker();
            } else {
                // Fallback: search and destroy open classes locally
                document.querySelectorAll('.bottom-sheet.open').forEach(s => s.classList.remove('open'));
                document.querySelectorAll('.modal-layer.active').forEach(m => m.classList.remove('active'));
                document.querySelectorAll('.picker-container.active').forEach(p => p.classList.remove('active'));
                const emojiPicker = document.getElementById('emoji-picker-container');
                if (emojiPicker) emojiPicker.classList.remove('active');
            }
        };

        this.render();
        this.updateNavLabels();
    }

    render() {
        const content = document.getElementById('content');
        const view = this.views[this.currentTab];
        content.innerHTML = view.render();
        view.afterRender();
    }
}
new App();
