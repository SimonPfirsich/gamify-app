import { store } from '../store.js';

export class ChatView {
    render() {
        const chat = store.state.chat.sort((a, b) => a.timestamp - b.timestamp);
        const currentUser = store.state.currentUser;

        return `
            <div class="header">
                <h1>Team Chat</h1>
            </div>

            <div id="chat-feed" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 80px;">
                ${chat.map(msg => {
            const isMe = msg.userId === currentUser.id;
            const user = store.state.users.find(u => u.id === msg.userId);
            const isEvent = msg.type === 'event';

            if (isEvent) {
                return `
                            <div style="align-self: center; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 20px; font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                                <span>${user.avatar} <strong>${user.name}</strong> ${msg.text}</span>
                                <button style="background:none; border:none; cursor:pointer;" onclick="console.log('React')">🔥</button>
                            </div>
                        `;
            }

            return `
                        <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
                            <div style="display: flex; align-items: flex-end; gap: 8px; flex-direction: ${isMe ? 'row-reverse' : 'row'};">
                                <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    ${user.avatar}
                                </div>
                                <div style="
                                    background: ${isMe ? 'var(--primary)' : 'var(--bg-card)'}; 
                                    padding: 12px 16px; 
                                    border-radius: 16px; 
                                    border-bottom-${isMe ? 'right' : 'left'}-radius: 4px;
                                    max-width: 80%;
                                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                ">
                                    <div style="font-size: 14px; line-height: 1.4;">${msg.text}</div>
                                </div>
                            </div>
                            <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px; margin-${isMe ? 'right' : 'left'}: 40px">
                                ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    `;
        }).join('')}
            </div>

            <div style="position: fixed; bottom: var(--nav-height); left: 0; width: 100%; padding: 16px; background: linear-gradient(to top, var(--bg-dark), transparent); pointer-events: none;">
                <div style="pointer-events: auto; display: flex; gap: 8px; max-width: 600px; margin: 0 auto;">
                    <input type="text" id="chat-input" placeholder="Nachricht schreiben..." 
                        style="flex: 1; background: var(--bg-card); border: 1px solid var(--border-color); color: white; padding: 12px 16px; border-radius: 24px; outline: none; backdrop-filter: blur(10px);">
                    <button id="send-btn" style="background: var(--primary); color: white; border: none; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px var(--primary-glow);">
                        <i class="ph-fill ph-paper-plane-right" style="font-size: 20px;"></i>
                    </button>
                </div>
            </div>
        `;
    }

    afterRender() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const feed = document.getElementById('chat-feed');

        // Scroll to bottom
        window.scrollTo(0, document.body.scrollHeight);

        const send = () => {
            if (input.value.trim()) {
                store.addMessage(input.value.trim());
                // Input clears on re-render
            }
        };

        sendBtn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') send();
        });

        // Keep focus
        if (this.shouldFocus) {
            // complex to handle focus lost on re-render in simple arch
        }
    }
}
