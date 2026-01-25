import { store } from '../store.js';

export class ChatView {
    constructor() {
        this.currentReplyId = null;
        this.longPressTimer = null;
        this.touchStartX = 0;
        this.activeSwipeId = null;
    }

    render() {
        const chat = store.state.chat.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const currentUser = store.state.currentUser;

        return `
            <div class="header">
                <h1>Team Chat</h1>
            </div>

            <div id="chat-feed" style="display: flex; flex-direction: column; gap: 20px; padding-bottom: 140px; overflow-x: hidden;">
                ${chat.map(msg => {
            const isMe = msg.user_id === currentUser.id;
            const user = store.state.users.find(u => u.id === msg.user_id) || { name: 'Unbekannt', avatar: '👤' };
            const isEvent = msg.type === 'event';
            const replyMsg = msg.reply_to ? chat.find(m => m.id === msg.reply_to) : null;

            // Reaction logic
            const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
            const emojiCounts = {};
            reactions.forEach(r => emojiCounts[r.e] = (emojiCounts[r.e] || 0) + 1);
            const topEmojis = Object.keys(emojiCounts).slice(0, 4);

            return `
                        <div class="message-wrapper" 
                             data-id="${msg.id}"
                             style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; position: relative; transition: transform 0.2s; width: 100%;">
                            
                            ${isEvent ? `
                                <div style="align-self: center; background: #f1f5f9; padding: 6px 12px; border-radius: 20px; font-size: 11px; color: var(--text-muted); margin: 4px 0;">
                                    <span>${user.avatar} <strong>${user.name}</strong> ${msg.content}</span>
                                </div>
                            ` : `
                                <div class="swipe-indicator" style="position: absolute; left: -40px; top: 50%; transform: translateY(-50%); opacity: 0;">
                                    <i class="ph ph-arrow-bend-up-left" style="font-size: 20px; color: var(--primary);"></i>
                                </div>

                                <div class="message-container" style="display: flex; align-items: flex-end; gap: 8px; flex-direction: ${isMe ? 'row-reverse' : 'row'}; max-width: 85%; padding: 0 20px;">
                                    <div style="width: 28px; height: 28px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">
                                        ${user.avatar}
                                    </div>
                                    
                                    <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; position: relative;">
                                        <div class="message-bubble" style="
                                            background: ${isMe ? 'var(--primary)' : 'white'}; 
                                            color: ${isMe ? 'white' : 'var(--text-dark)'};
                                            padding: 10px 14px; 
                                            border-radius: 18px; 
                                            border-bottom-${isMe ? 'right' : 'left'}-radius: 4px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                            border: ${isMe ? 'none' : '1px solid #e2e8f0'};
                                        ">
                                            ${replyMsg ? `
                                                <div style="background: rgba(0,0,0,0.05); padding: 6px 8px; border-radius: 8px; font-size: 11px; margin-bottom: 6px; border-left: 3px solid ${isMe ? 'white' : 'var(--primary)'};">
                                                    <strong>${store.state.users.find(u => u.id === replyMsg.user_id)?.name}</strong><br>
                                                    ${replyMsg.content.substring(0, 30)}...
                                                </div>
                                            ` : ''}
                                            <div style="font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${msg.content}</div>
                                        </div>
                                        
                                        ${reactions.length > 0 ? `
                                            <div class="reaction-pill" data-id="${msg.id}" style="
                                                display: flex; align-items: center; gap: 4px; 
                                                background: white; border: 1px solid #e2e8f0; 
                                                border-radius: 12px; padding: 2px 6px; 
                                                margin-top: -10px; margin-${isMe ? 'right' : 'left'}: 10px;
                                                box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 12px; cursor: pointer;
                                            ">
                                                <span>${topEmojis.join('')}</span>
                                                <span style="color: var(--text-muted); font-weight: 600; font-size: 10px; margin-left: 2px;">${reactions.length}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <span style="font-size: 9px; color: var(--text-muted); margin-top: 4px; padding: 0 56px;">
                                    ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            `}
                        </div>
                    `;
        }).join('')}
            </div>

            <!-- Emoji Picker Popover (Hidden by default) -->
            <div id="emoji-picker" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; background: rgba(0,0,0,0.3);">
                <div style="position: absolute; bottom: 30%; left: 50%; transform: translateX(-50%); background: white; border-radius: 30px; padding: 15px; display: flex; gap: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                    ${['🔥', '❤️', '👍', '😂', '😮', '👏'].map(e => `
                        <button class="emoji-choice" data-emoji="${e}" style="background: none; border: none; font-size: 32px; cursor: pointer;">${e}</button>
                    `).join('')}
                </div>
            </div>

            <!-- Reaction Detail Modal -->
            <div id="reaction-modal" style="display: none; position: fixed; bottom: 0; left: 0; width: 100%; height: 100%; z-index: 2000; background: rgba(0,0,0,0.5); align-items: flex-end;">
                <div style="background: white; width: 100%; border-radius: 24px 24px 0 0; padding: 20px; max-height: 70%; overflow-y: auto;">
                    <div style="width: 40px; height: 5px; background: #ddd; border-radius: 10px; margin: 0 auto 20px;"></div>
                    <h3 id="reaction-count-title" style="margin-bottom: 20px;">X Reaktionen</h3>
                    <div id="reaction-users-list"></div>
                </div>
            </div>

            <div style="position: fixed; bottom: var(--nav-height); left: 0; width: 100%; padding: 0 20px 20px 20px; pointer-events: none;">
                <div style="max-width: 450px; margin: 0 auto; pointer-events: auto;">
                    <div id="reply-preview" style="display: none; background: #f8fafc; padding: 10px 15px; border-radius: 15px 15px 0 0; border: 1px solid #e2e8f0; border-bottom: none; font-size: 13px; transform: translateY(5px); justify-content: space-between; align-items: center;">
                        <span id="reply-text" style="color: var(--text-muted); font-weight: 500;">Antworten auf...</span>
                        <button id="cancel-reply" style="background: #e2e8f0; border: none; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">&times;</button>
                    </div>
                    <div style="display: flex; align-items: flex-end; gap: 10px;">
                        <textarea id="chat-input" placeholder="Nachricht schreiben..." rows="1"
                            style="flex: 1; background: white; border: 1px solid #e2e8f0; color: var(--text-dark); padding: 14px 20px; border-radius: 25px; outline: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); resize: none; font-family: inherit; font-size: 15px; max-height: 120px;"></textarea>
                        
                        <button id="send-btn" style="background: var(--primary); color: white; border: none; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px var(--primary-glow); flex-shrink: 0;">
                            <i class="ph-fill ph-paper-plane-right" style="font-size: 24px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    afterRender() {
        const input = document.getElementById('chat-input');
        if (!input) return;

        const sendBtn = document.getElementById('send-btn');
        const container = document.querySelector('.content-area');
        const emojiPicker = document.getElementById('emoji-picker');
        let selectedMsgId = null;

        container.scrollTop = container.scrollHeight;

        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
        });

        const send = () => {
            if (input.value.trim()) {
                store.addMessage(input.value.trim(), 'text', null, this.currentReplyId);
                input.value = '';
                input.style.height = 'auto';
                this.currentReplyId = null;
                document.getElementById('reply-preview').style.display = 'none';
            }
        };

        sendBtn.addEventListener('click', send);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

        // Long Press & Swipe
        document.querySelectorAll('.message-wrapper').forEach(wrapper => {
            const msgId = wrapper.dataset.id;

            // Touch handlers
            wrapper.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.activeSwipeId = msgId;

                this.longPressTimer = setTimeout(() => {
                    selectedMsgId = msgId;
                    emojiPicker.style.display = 'block';
                    if (window.navigator.vibrate) window.navigator.vibrate(50);
                }, 500);
            });

            wrapper.addEventListener('touchmove', (e) => {
                const currentX = e.touches[0].clientX;
                const diff = currentX - this.touchStartX;

                if (diff > 20) {
                    clearTimeout(this.longPressTimer);
                    const move = Math.min(diff, 60);
                    wrapper.style.transform = `translateX(${move}px)`;

                    const indicator = wrapper.querySelector('.swipe-indicator');
                    if (indicator) indicator.style.opacity = move / 60;
                }
            });

            wrapper.addEventListener('touchend', (e) => {
                clearTimeout(this.longPressTimer);
                const diff = e.changedTouches[0].clientX - this.touchStartX;

                if (diff > 50) {
                    this.currentReplyId = msgId;
                    const preview = document.getElementById('reply-preview');
                    const text = document.getElementById('reply-text');
                    const bubble = wrapper.querySelector('.message-bubble');
                    preview.style.display = 'flex';
                    text.innerText = "Antworten auf: " + bubble.innerText.substring(0, 30);
                    input.focus();
                }

                wrapper.style.transform = '';
                const indicator = wrapper.querySelector('.swipe-indicator');
                if (indicator) indicator.style.opacity = 0;
            });
        });

        // Reaction implementation
        document.querySelectorAll('.emoji-choice').forEach(btn => {
            btn.addEventListener('click', () => {
                store.addReaction(selectedMsgId, btn.dataset.emoji);
                emojiPicker.style.display = 'none';
            });
        });
        emojiPicker.addEventListener('click', (e) => { if (e.target === emojiPicker) emojiPicker.style.display = 'none'; });

        // Detail Modal
        document.querySelectorAll('.reaction-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const msg = store.state.chat.find(m => m.id === pill.dataset.id);
                const reactions = msg.reactions || [];
                const modal = document.getElementById('reaction-modal');
                const list = document.getElementById('reaction-users-list');
                const title = document.getElementById('reaction-count-title');

                title.innerText = `${reactions.length} Reaktion${reactions.length > 1 ? 'en' : ''}`;
                list.innerHTML = reactions.map(r => {
                    const user = store.state.users.find(u => u.id === r.u);
                    return `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">${user?.avatar}</div>
                                <span style="font-weight: 500;">${user?.name}</span>
                            </div>
                            <span style="font-size: 24px;">${r.e}</span>
                        </div>
                    `;
                }).join('');
                modal.style.display = 'flex';
            });
        });

        const reactModal = document.getElementById('reaction-modal');
        reactModal.addEventListener('click', (e) => { if (e.target === reactModal) reactModal.style.display = 'none'; });

        document.getElementById('cancel-reply').addEventListener('click', () => {
            this.currentReplyId = null;
            document.getElementById('reply-preview').style.display = 'none';
        });
    }
}
