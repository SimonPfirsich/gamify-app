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
            const { data: challenges } = await supabaseClient.from('challenges').select('*, actions(*)');
            const { data: profiles } = await supabaseClient.from('profiles').select('*');
            const { data: events } = await supabaseClient.from('events').select('*');
            const { data: messages } = await supabaseClient.from('messages').select('*');

            if (challenges) this.state.challenges = challenges;
            if (profiles) this.state.users = profiles;
            if (events) this.state.events = events;

            // --- TEST MESSAGE INJECTION ---
            const testMsg = {
                id: 'test-7-reactions-fixed',
                user_id: '8fcb9560-f435-430c-8090-e4b2d41a7986', // Simon
                content: 'Dies ist eine Testnachricht mit 7 Reaktionen zum Prüfen der Ansicht! 🚀',
                type: 'text',
                created_at: new Date().toISOString(), // ENSURE IT IS NEWEST
                reactions: [
                    { u: '1', e: '👍' }, { u: '2', e: '❤️' }, { u: '3', e: '😂' },
                    { u: '4', e: '😮' }, { u: '5', e: '😢' }, { u: '6', e: '🙏' },
                    { u: this.state.currentUser.id, e: '🎉' }
                ]
            };

            if (messages) {
                this.state.chat = [...messages, testMsg];
            } else {
                this.state.chat = [testMsg];
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

    subscribe(listener) { this.listeners.push(listener); }
    notify() { this.listeners.forEach(l => l(this.state)); }

    async addEvent(challengeId, actionId) {
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
        const { data, error } = await supabaseClient.from('events').insert([
            { user_id: this.state.currentUser.id, action_id: actionId, challenge_id: challengeId }
        ]).select();
        if (error) {
            this.state.events = this.state.events.filter(e => e.id !== tempEvent.id);
            this.notify();
            return console.error(error);
        }
        await this.addMessage(`hat ${action ? action.name : 'eine Action'} ausgeführt!`, 'event', data[0].id);
    }

    async addMessage(text, type = 'text', eventId = null, replyTo = null) {
        const tempMsg = {
            id: 'temp_' + Date.now(),
            user_id: this.state.currentUser.id,
            content: text,
            type: type,
            created_at: new Date().toISOString(),
            reply_to: replyTo,
            reactions: []
        };
        this.state.chat.push(tempMsg);
        this.notify();
        await supabaseClient.from('messages').insert([{
            user_id: this.state.currentUser.id,
            content: text,
            type: type,
            event_id: eventId,
            reply_to: replyTo
        }]);
    }

    async addReaction(messageId, emoji) {
        const msg = this.state.chat.find(m => m.id === messageId);
        if (!msg) return;
        let reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
        const userId = this.state.currentUser.id;
        const idx = reactions.findIndex(r => r.u === userId);
        if (idx > -1) {
            if (reactions[idx].e === emoji) reactions.splice(idx, 1);
            else reactions[idx].e = emoji;
        } else reactions.push({ u: userId, e: emoji });
        msg.reactions = reactions;
        this.notify();
        await supabaseClient.from('messages').update({ reactions }).eq('id', messageId);
    }

    getLeaderboard(challengeId) {
        const scores = {};
        this.state.users.forEach(u => scores[u.id] = 0);
        this.state.events.filter(e => e.challenge_id === challengeId).forEach(e => {
            const action = this.state.challenges.find(c => c.id === challengeId)?.actions.find(a => a.id === e.action_id);
            if (action) scores[e.user_id] += action.points;
        });
        return Object.entries(scores).map(([uId, s]) => ({
            user: this.state.users.find(u => u.id === uId) || { name: 'Unbekannt', avatar: '👤' },
            score: s
        })).sort((a, b) => b.score - a.score);
    }
}
export const store = new Store();
