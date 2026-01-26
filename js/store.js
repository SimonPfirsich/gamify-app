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
        // Lade User-Status (für Tests zwischen Julius und Simon umschaltbar)
        const savedUser = localStorage.getItem('gamify_user');
        this.state = {
            currentUser: savedUser ? JSON.parse(savedUser) : initialState.currentUser,
            users: [],
            challenges: [],
            events: [],
            chat: []
        };
        this.listeners = [];
        this.init();
    }

    switchUser(id, name, avatar) {
        const newUser = { id, name, avatar };
        this.state.currentUser = newUser;
        localStorage.setItem('gamify_user', JSON.stringify(newUser));
        this.notify();
    }

    async init() {
        await this.fetchData();
        this.setupSubscriptions();
    }

    async fetchData() {
        try {
            // Fetch challenges with actions
            const { data: challenges } = await supabaseClient.from('challenges').select('*, actions(*)');
            // Fetch profiles/users
            const { data: profiles } = await supabaseClient.from('profiles').select('*');
            // Fetch events
            const { data: events } = await supabaseClient.from('events').select('*');
            // Fetch messages
            const { data: messages } = await supabaseClient.from('messages').select('*');

            if (challenges) this.state.challenges = challenges;
            if (profiles) this.state.users = profiles;
            if (events) this.state.events = events;
            if (messages) {
                // ADD TEST MESSAGE WITH 7 REACTIONS
                const testMsg = {
                    id: 'test-7-reactions',
                    user_id: this.state.currentUser.id,
                    content: 'Dies ist eine Testnachricht mit 7 Reaktionen zum Prüfen der Ansicht! 🚀',
                    type: 'text',
                    created_at: new Date().toISOString(),
                    reactions: [
                        { u: '1', e: '👍' }, { u: '2', e: '❤️' }, { u: '3', e: '😂' },
                        { u: '4', e: '😮' }, { u: '5', e: '😢' }, { u: '6', e: '🙏' },
                        { u: this.state.currentUser.id, e: '🎉' }
                    ]
                };
                this.state.chat = [...messages, testMsg];
            }

            this.notify();
        } catch (e) {
            console.error("Supabase Sync Error:", e);
        }
    }

    setupSubscriptions() {
        supabaseClient.channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => this.fetchData())
            .subscribe();
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(l => l(this.state));
    }

    async addEvent(challengeId, actionId) {
        // Optimistic Update: Sofort lokal anzeigen
        const action = this.state.challenges.find(c => c.id === challengeId).actions.find(a => a.id === actionId);
        const tempEvent = {
            id: 'temp_' + Date.now(),
            user_id: this.state.currentUser.id,
            action_id: actionId,
            challenge_id: challengeId,
            created_at: new Date().toISOString()
        };

        this.state.events.push(tempEvent);
        this.notify();

        // Hintergrund-Sync mit Supabase
        const { data, error } = await supabaseClient.from('events').insert([
            { user_id: this.state.currentUser.id, action_id: actionId, challenge_id: challengeId }
        ]).select();

        if (error) {
            this.state.events = this.state.events.filter(e => e.id !== tempEvent.id);
            this.notify();
            return console.error(error);
        }

        // Auto-post to chat
        await this.addMessage(`hat ${action ? action.name : 'eine Action'} ausgeführt!`, 'event', data[0].id);
    }

    async addMessage(text, type = 'text', eventId = null, replyTo = null) {
        // Optimistic Update
        const tempMsg = {
            id: 'temp_' + Date.now(),
            user_id: this.state.currentUser.id,
            content: text,
            type: type,
            event_id: eventId,
            reply_to: replyTo,
            challenge_id: this.state.challenges[0]?.id,
            created_at: new Date().toISOString(),
            reactions: {}
        };
        this.state.chat.push(tempMsg);
        this.notify();

        const { error } = await supabaseClient.from('messages').insert([
            {
                user_id: this.state.currentUser.id,
                content: text,
                type: type,
                event_id: eventId,
                reply_to: replyTo,
                challenge_id: this.state.challenges[0]?.id
            }
        ]);

        if (error) {
            this.state.chat = this.state.chat.filter(m => m.id !== tempMsg.id);
            this.notify();
            console.error("Send Message Error:", error);
        }

        // Realtime Subscription wird den finalen State glattziehen
    }

    async addReaction(messageId, emoji) {
        const msg = this.state.chat.find(m => m.id === messageId);
        if (!msg) return;

        let reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
        const userId = this.state.currentUser.id;

        // Find existing reaction from this user
        const userActionIdx = reactions.findIndex(r => r.u === userId);

        if (userActionIdx > -1) {
            if (reactions[userActionIdx].e === emoji) {
                // Same emoji? Remove it (Toggle)
                reactions.splice(userActionIdx, 1);
            } else {
                // Different emoji? Replace it
                reactions[userActionIdx].e = emoji;
            }
        } else {
            // Add new reaction
            reactions.push({ u: userId, e: emoji });
        }

        // Optimistic
        msg.reactions = reactions;
        this.notify();

        const { error } = await supabaseClient.from('messages')
            .update({ reactions: reactions })
            .eq('id', messageId);

        if (error) console.error("Reaction Error:", error);
    }

    // Helper to get totals
    getLeaderboard(challengeId, filterActionId = null, timeFilter = 'all') {
        // Filter events by challenge, time, and action
        let filteredEvents = this.state.events.filter(e => e.challenge_id === challengeId);

        if (filterActionId) {
            filteredEvents = filteredEvents.filter(e => e.action_id === filterActionId);
        }

        // Aggregate by user
        const scores = {};
        this.state.users.forEach(u => scores[u.id] = 0);

        filteredEvents.forEach(e => {
            const challenge = this.state.challenges.find(c => c.id === e.challenge_id);
            if (!challenge) return;
            const action = challenge.actions.find(a => a.id === e.action_id);
            if (action && scores[e.user_id] !== undefined) {
                scores[e.user_id] += action.points;
            }
        });

        return Object.entries(scores)
            .map(([userId, score]) => ({
                user: this.state.users.find(u => u.id === userId) || { name: 'Unbekannt', avatar: '👤' },
                score
            }))
            .sort((a, b) => b.score - a.score);
    }
}

export const store = new Store();
