/**
 * Simple State Management for Gamify App
 */

const initialState = {
    currentUser: { id: 'user1', name: 'Julius', avatar: '👨‍🚀' },
    users: [
        { id: 'user1', name: 'Julius', avatar: '👨‍🚀' },
        { id: 'user2', name: 'Elon', avatar: '🚀' },
        { id: 'user3', name: 'Jeff', avatar: '📦' }
    ],
    challenges: [
        {
            id: 'c1',
            name: 'Sales Sprint Q1',
            actions: [
                { id: 'a1', name: 'Lead', points: 10, color: 'var(--accent-blue)', icon: 'ph-user-plus' },
                { id: 'a2', name: 'Call', points: 20, color: 'var(--accent-orange)', icon: 'ph-phone-call' },
                { id: 'a3', name: 'Meeting', points: 50, color: 'var(--primary)', icon: 'ph-users' },
                { id: 'a4', name: 'Sale', points: 200, color: 'var(--accent-green)', icon: 'ph-currency-dollar' }
            ]
        },
        {
            id: 'c2',
            name: 'Pickup Challenge',
            actions: [
                { id: 'p1', name: 'Approach', points: 5, color: 'var(--accent-red)', icon: 'ph-chat-circle' },
                { id: 'p2', name: 'Number', points: 50, color: 'var(--accent-green)', icon: 'ph-address-book' }
            ]
        }
    ],
    // Store events: { id, userId, challengeId, actionId, timestamp }
    events: [
        { id: 'e1', userId: 'user1', challengeId: 'c1', actionId: 'a1', timestamp: Date.now() - 10000000 },
        { id: 'e2', userId: 'user2', challengeId: 'c1', actionId: 'a4', timestamp: Date.now() - 5000000 },
        { id: 'e3', userId: 'user1', challengeId: 'c1', actionId: 'a2', timestamp: Date.now() - 200000 },
    ],
    // Chat messages: { id, userId, text, type: 'text'|'event', eventId, timestamp, reactions: {} }
    chat: [
        { id: 'm1', userId: 'user2', text: 'Wie läuft es bei euch?', type: 'text', timestamp: Date.now() - 2000000 },
        { id: 'm2', userId: 'user1', text: 'Läuft! Gerade einen Sale gemacht.', type: 'text', timestamp: Date.now() - 100000 }
    ]
};

class Store {
    constructor() {
        // Load from local storage or use initial state
        const saved = localStorage.getItem('gamify_state');
        this.state = saved ? JSON.parse(saved) : initialState;
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        localStorage.setItem('gamify_state', JSON.stringify(this.state));
        this.listeners.forEach(l => l(this.state));
    }

    addEvent(challengeId, actionId) {
        const action = this.state.challenges.find(c => c.id === challengeId).actions.find(a => a.id === actionId);
        const event = {
            id: 'evt_' + Date.now(),
            userId: this.state.currentUser.id,
            challengeId,
            actionId,
            timestamp: Date.now()
        };
        this.state.events.push(event);
        
        // Post automatically to chat? Maybe not always, but requested "Chat should see events"
        const chatMsg = {
            id: 'msg_' + Date.now(),
            userId: this.state.currentUser.id,
            type: 'event',
            eventId: event.id,
            text: `hat ${action.name} ausgeführt!`,
            timestamp: Date.now(),
            reactions: {}
        };
        this.state.chat.push(chatMsg);

        this.notify();
    }

    addMessage(text) {
        const msg = {
            id: 'msg_' + Date.now(),
            userId: this.state.currentUser.id,
            text,
            type: 'text',
            timestamp: Date.now(),
            reactions: {}
        };
        this.state.chat.push(msg);
        this.notify();
    }

    // Helper to get totals
    getLeaderboard(challengeId, filterActionId = null, timeFilter = 'all') {
        // Filter events by challenge, time, and action
        let filteredEvents = this.state.events.filter(e => e.challengeId === challengeId);
        
        if (filterActionId) {
            filteredEvents = filteredEvents.filter(e => e.actionId === filterActionId);
        }

        // Aggregate by user
        const scores = {};
        this.state.users.forEach(u => scores[u.id] = 0);

        filteredEvents.forEach(e => {
            const challenge = this.state.challenges.find(c => c.id === e.challengeId);
            const action = challenge.actions.find(a => a.id === e.actionId);
            if (scores[e.userId] !== undefined) {
                scores[e.userId] += action.points;
            }
        });

        return Object.entries(scores)
            .map(([userId, score]) => ({ 
                user: this.state.users.find(u => u.id === userId), 
                score 
            }))
            .sort((a, b) => b.score - a.score);
    }
}

export const store = new Store();
