import { supabaseClient } from './supabase.js';

const initialState = {
    currentUser: { id: '7fcb9560-f435-430c-8090-e4b2d41a7985', name: 'Julius', avatar: '👨‍🚀' },
    users: [],
    challenges: [],
    events: [],
    chat: []
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
