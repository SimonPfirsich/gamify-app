import { store } from '../store.js';

export class ChatView {
    constructor() {
        this.currentReplyId = null;
        this.longPressTimer = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.sheetTouchStartY = 0;
        this.isSwipingSheet = false;
        this.lastMessageCount = 0;
    }

    render() {
        const chat = store.state.chat.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const currentUser = store.state.currentUser;

        // Check if we should scroll (only if a NEW message was added)
        this.shouldScroll = chat.length > this.lastMessageCount;
        this.lastMessageCount = chat.length;

        const emojiList = ['😂', '🙏', '👍', '🙌', '❤️', '👏', '🤩', '🥳', '🔥', '😭', '😮', '🤔', '💯', '✨', '🐘', '🐱', '🚀', '💪', '👑', '🎉', '💡', '✅', '❌', '👀'];

        return `
            <div class="header">
                <h1>Team Chat</h1>
                <div style="font-size: 10px; color: var(--text-muted); cursor: pointer;" id="test-user-switch">
                    Testen als: <strong>${currentUser.name}</strong> (Wechseln)
                </div>
            </div>

            <div id="chat-feed" style="display: flex; flex-direction: column; gap: 20px; padding-bottom: 160px; overflow-x: hidden;">
                ${chat.map(msg => {
            const isMe = msg.user_id === currentUser.id;
            const user = store.state.users.find(u => u.id === msg.user_id) || { name: 'Unbekannt', avatar: '👤' };
            const isEvent = msg.type === 'event';
            const replyMsg = msg.reply_to ? chat.find(m => m.id === msg.reply_to) : null;

            const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
            const emojiCounts = {};
            reactions.forEach(r => emojiCounts[r.e] = (emojiCounts[r.e] || 0) + 1);
            const topEmojis = Object.keys(emojiCounts).slice(0, 4);

            return `
                        <div class="message-wrapper" data-id="${msg.id}" style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; position: relative; transition: transform 0.2s; width: 100%;">
                            
                            <div class="swipe-indicator" style="position: absolute; left: -20px; top: 50%; transform: translateY(-50%); opacity: 0; pointer-events: none;">
                                <i class="ph ph-arrow-bend-up-left" style="font-size: 20px; color: var(--primary);"></i>
                            </div>

                            <div class="message-container" style="display: flex; align-items: flex-end; gap: 8px; flex-direction: ${isMe ? 'row-reverse' : 'row'}; max-width: 92%; padding: 0 10px; width: 100%; box-sizing: border-box;">
                                ${isEvent ? '' : `
                                    <div style="width: 28px; height: 28px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">
                                        ${user.avatar}
                                    </div>
                                `}
                                
                                <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; position: relative; max-width: 100%;">
                                    <div class="message-bubble" style="
                                        background: ${isEvent ? '#f1f5f9' : (isMe ? 'var(--primary)' : 'white')}; 
                                        color: ${isEvent ? '#64748b' : (isMe ? 'white' : 'var(--text-dark)')};
                                        padding: ${isEvent ? '6px 12px' : '9px 12px'}; 
                                        border-radius: ${isEvent ? '20px' : '18px'}; 
                                        ${isEvent ? '' : `border-bottom-${isMe ? 'right' : 'left'}-radius: 4px;`}
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                        border: ${isMe || isEvent ? 'none' : '1px solid #e2e8f0'};
                                        font-size: ${isEvent ? '12px' : '15px'};
                                        cursor: pointer;
                                        -webkit-user-select: none;
                                        user-select: none;
                                        touch-action: pan-y;
                                    ">
                                        ${replyMsg ? `
                                            <div style="background: rgba(0,0,0,0.05); padding: 6px 8px; border-radius: 8px; font-size: 11px; margin-bottom: 6px; border-left: 3px solid ${isMe ? 'white' : 'var(--primary)'};">
                                                <strong>${store.state.users.find(u => u.id === replyMsg.user_id)?.name}</strong><br>
                                                ${replyMsg.content.substring(0, 30)}...
                                            </div>
                                        ` : ''}
                                        <div style="line-height: 1.4; white-space: pre-wrap;">${isEvent ? `${user.avatar} <strong>${user.name}</strong> ` : ''}${msg.content}</div>
                                    </div>
                                    
                                    ${reactions.length > 0 ? `
                                        <div class="reaction-pill" data-id="${msg.id}" style="
                                            display: flex; align-items: center; gap: 4px; 
                                            background: white; border: 1px solid #e2e8f0; 
                                            border-radius: 12px; padding: 2px 6px; 
                                            margin-top: -10px; margin-${isMe ? 'right' : 'left'}: 10px;
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 12px; cursor: pointer;
                                            z-index: 5;
                                        ">
                                            <span>${topEmojis.join('')}</span>
                                            <span style="color: var(--text-muted); font-weight: 600; font-size: 10px; margin-left: 2px;">${reactions.length}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            ${isEvent ? '' : `
                                <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px; padding: 0 46px;">
                                    ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            `}
                        </div>
                    `;
        }).join('')}
            </div>

            <!-- Emoji Picker Popover -->
            <div id="emoji-picker-container" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 3000;">
                <div id="emoji-picker-overlay" style="position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.2);"></div>
                <div id="emoji-bar" style="position: absolute; left: 50%; transform: translateX(-50%); background: white; border-radius: 40px; padding: 8px 12px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: max-content; max-width: 90%; z-index: 3001;">
                    <!-- Will be filled dynamically -->
                    ${['👍', '❤️', '😂', '😮', '😢', '🙏'].map(e => `
                        <button class="emoji-choice" data-emoji="${e}" style="background: none; border: none; font-size: 28px; cursor: pointer; padding: 4px;">${e}</button>
                    `).join('')}
                    <button id="show-full-picker-btn" style="background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 20px; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                </div>
                
                <!-- Full Emoji Grid (Keyboard Style) -->
                <div id="full-emoji-keyboard" style="display: none; position: absolute; bottom: 0; left: 0; width: 100%; background: white; border-radius: 24px 24px 0 0; padding: 20px; box-shadow: 0 -10px 40px rgba(0,0,0,0.1); flex-direction: column; z-index: 3002;">
                    <div style="width: 40px; height: 5px; background: #ddd; border-radius: 10px; margin: 0 auto 15px;"></div>
                    <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; overflow-y: auto; max-height: 40vh; padding-bottom: 20px;">
                        ${emojiList.map(e => `<button class="emoji-choice" data-emoji="${e}" style="background: none; border: none; font-size: 28px; cursor: pointer;">${e}</button>`).join('')}
                    </div>
                </div>
            </div>

            <!-- Reaction Detail Bottom Sheet -->
            <div id="reaction-modal" style="display: none; position: fixed; bottom: 0; left: 0; width: 100%; height: 100%; z-index: 2000; background: rgba(0,0,0,0.4); pointer-events: none; transition: background 0.3s; align-items: flex-end;">
                <div id="reaction-sheet" style="background: white; width: 100%; border-radius: 24px 24px 0 0; padding: 20px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(100%); pointer-events: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.1); max-height: 45vh;">
                    <div id="sheet-handle" style="width: 40px; height: 5px; background: #ddd; border-radius: 10px; margin: 0 auto 20px; cursor: ns-resize;"></div>
                    <h3 id="reaction-count-title" style="margin-bottom: 20px; font-size: 16px;">X Reaktionen</h3>
                    <div id="reaction-users-list" style="overflow-y: auto; max-height: 25vh; padding-bottom: 20px;"></div>
                </div>
            </div>

            <div style="position: fixed; bottom: var(--nav-height); left: 0; width: 100%; padding: 0 10px 10px 10px; pointer-events: none;">
                <div style="max-width: 450px; margin: 0 auto; pointer-events: auto;">
                    <div id="reply-preview" style="display: none; background: #f8fafc; padding: 10px 15px; border-radius: 15px 15px 0 0; border: 1px solid #e2e8f0; border-bottom: none; font-size: 13px; transform: translateY(5px); justify-content: space-between; align-items: center; margin: 0 10px;">
                        <span id="reply-text" style="color: var(--text-muted); font-weight: 500;">Antworten auf...</span>
                        <button id="cancel-reply" style="background: #e2e8f0; border: none; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">&times;</button>
                    </div>
                    <div style="display: flex; align-items: flex-end; gap: 8px;">
                        <textarea id="chat-input" placeholder="Nachricht schreiben..." rows="1"
                            style="flex: 1; background: white; border: 1px solid #e2e8f0; color: var(--text-dark); padding: 12px 16px; border-radius: 20px; outline: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); resize: none; font-family: inherit; font-size: 15px; max-height: 120px;"></textarea>
                        <button id="send-btn" style="background: var(--primary); color: white; border: none; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px var(--primary-glow); flex-shrink: 0;">
                            <i class="ph-fill ph-paper-plane-right" style="font-size: 22px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    afterRender() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        const feedContainer = document.querySelector('.content-area');
        const sheet = document.getElementById('reaction-sheet');
        const modal = document.getElementById('reaction-modal');
        const pickerContainer = document.getElementById('emoji-picker-container');
        const emojiBar = document.getElementById('emoji-bar');
        const fullKeyboard = document.getElementById('full-emoji-keyboard');
        let selectedMsgId = null;

        if (this.shouldScroll) {
            feedContainer.scrollTop = feedContainer.scrollHeight;
        }

        // Switch User Logic
        document.getElementById('test-user-switch').addEventListener('click', () => {
            if (store.state.currentUser.name === 'Julius') {
                store.switchUser('8fcb9560-f435-430c-8090-e4b2d41a7986', 'Simon', '🚀');
            } else {
                store.switchUser('7fcb9560-f435-430c-8090-e4b2d41a7985', 'Julius', '👨‍🚀');
            }
            location.reload();
        });

        // Event Handling
        document.querySelectorAll('.message-wrapper').forEach(wrapper => {
            const msgId = wrapper.dataset.id;
            const bubble = wrapper.querySelector('.message-bubble');

            // Only Long Press on Bubble
            bubble.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;

                this.longPressTimer = setTimeout(() => {
                    selectedMsgId = msgId;

                    // Berechne Position der Nachricht
                    const rect = bubble.getBoundingClientRect();
                    const pickerHeight = 60; // Ca. Höhe des Pickers

                    // Picker über der Nachricht platzieren (mit etwas Abstand)
                    let top = rect.top - pickerHeight - 10;

                    // Falls zu weit oben, dann unter der Nachricht
                    if (top < 60) top = rect.bottom + 10;

                    pickerContainer.style.display = 'block';
                    emojiBar.style.display = 'flex';
                    emojiBar.style.top = `${top}px`;
                    emojiBar.style.bottom = 'auto'; // Reset bottom
                    fullKeyboard.style.display = 'none';

                    // Update Emoji List based on usage
                    this.renderSmartEmojiList();

                    if (window.navigator.vibrate) window.navigator.vibrate(50);
                }, 500);
            }, { passive: true });

            wrapper.addEventListener('touchmove', (e) => {
                const diffX = e.touches[0].clientX - this.touchStartX;
                const diffY = e.touches[0].clientY - this.touchStartY;

                // If moving too much vertically, cancel long press
                if (Math.abs(diffY) > 10 || Math.abs(diffX) > 10) clearTimeout(this.longPressTimer);

                if (diffX > 20 && Math.abs(diffY) < 20) {
                    clearTimeout(this.longPressTimer);
                    wrapper.style.transform = `translateX(${Math.min(diffX, 60)}px)`;
                    wrapper.querySelector('.swipe-indicator').style.opacity = Math.min(diffX / 60, 1);
                }
            }, { passive: true });

            wrapper.addEventListener('touchend', (e) => {
                clearTimeout(this.longPressTimer);
                if (e.changedTouches[0].clientX - this.touchStartX > 50) {
                    this.currentReplyId = msgId;
                    const preview = document.getElementById('reply-preview');
                    preview.style.display = 'flex';
                    document.getElementById('reply-text').innerText = "Antworten auf: " + bubble.innerText.replace(/\n/g, ' ').substring(0, 30);
                    input.focus();
                }
                wrapper.style.transform = '';
                wrapper.querySelector('.swipe-indicator').style.opacity = 0;
            });

            // Prevent Context Menu on Long Press
            bubble.addEventListener('contextmenu', e => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        });

        // Emoji Selection tracking
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-choice')) {
                const emoji = e.target.dataset.emoji;
                store.addReaction(selectedMsgId, emoji);
                this.trackEmojiUsage(emoji);
                pickerContainer.style.display = 'none';
            }
        });

        document.getElementById('show-full-picker-btn').addEventListener('click', () => {
            emojiBar.style.display = 'none';
            fullKeyboard.style.display = 'flex';
        });

        document.getElementById('emoji-picker-overlay').addEventListener('click', () => {
            pickerContainer.style.display = 'none';
        });

        // Sheet Swipe to Close
        const sheetHandle = document.getElementById('sheet-handle');
        sheet.addEventListener('touchstart', (e) => {
            this.sheetTouchStartY = e.touches[0].clientY;
            this.isSwipingSheet = true;
            sheet.style.transition = 'none';
        }, { passive: true });

        sheet.addEventListener('touchmove', (e) => {
            if (!this.isSwipingSheet) return;
            const diffY = e.touches[0].clientY - this.sheetTouchStartY;
            if (diffY > 0) {
                sheet.style.transform = `translateY(${diffY}px)`;
            }
        }, { passive: true });

        sheet.addEventListener('touchend', (e) => {
            this.isSwipingSheet = false;
            sheet.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            const diffY = e.changedTouches[0].clientY - this.sheetTouchStartY;
            if (diffY > 100) {
                modal.style.background = 'rgba(0,0,0,0)';
                modal.style.pointerEvents = 'none';
                sheet.style.transform = 'translateY(100%)';
            } else {
                sheet.style.transform = 'translateY(0)';
            }
        });

        // Open Sheet
        document.querySelectorAll('.reaction-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const msg = store.state.chat.find(m => m.id === pill.dataset.id);
                const reactions = msg.reactions || [];
                document.getElementById('reaction-count-title').innerText = `${reactions.length} Reaktion${reactions.length > 1 ? 'en' : ''}`;
                document.getElementById('reaction-users-list').innerHTML = reactions.map(r => {
                    const user = store.state.users.find(u => u.id === r.u);
                    return `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">${user?.avatar || '👤'}</div>
                                <span style="font-weight: 500; font-size: 14px;">${user?.name || 'Unbekannt'}</span>
                            </div>
                            <span style="font-size: 20px;">${r.e}</span>
                        </div>
                    `;
                }).join('');
                modal.style.display = 'flex';
                modal.style.pointerEvents = 'auto';
                setTimeout(() => {
                    modal.style.background = 'rgba(0,0,0,0.4)';
                    sheet.style.transform = 'translateY(0)';
                }, 10);
            });
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.background = 'rgba(0,0,0,0)';
                modal.style.pointerEvents = 'none';
                sheet.style.transform = 'translateY(100%)';
            }
        });

        // Input
        document.getElementById('send-btn').addEventListener('click', () => {
            if (input.value.trim()) {
                store.addMessage(input.value.trim(), 'text', null, this.currentReplyId);
                input.value = '';
                input.style.height = 'auto';
                this.currentReplyId = null;
                document.getElementById('reply-preview').style.display = 'none';
            }
        });

        document.getElementById('cancel-reply').addEventListener('click', () => {
            this.currentReplyId = null;
            document.getElementById('reply-preview').style.display = 'none';
        });
    }

    trackEmojiUsage(emoji) {
        let usage = JSON.parse(localStorage.getItem('emoji_usage') || '{}');
        usage[emoji] = (usage[emoji] || 0) + 1;
        localStorage.setItem('emoji_usage', JSON.stringify(usage));
    }

    renderSmartEmojiList() {
        const usage = JSON.parse(localStorage.getItem('emoji_usage') || '{}');
        const sorted = Object.keys(usage).sort((a, b) => usage[b] - usage[a]);
        const defaults = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
        const smartList = [...new Set([...sorted.slice(0, 3), ...defaults])].slice(0, 6);

        const bar = document.getElementById('emoji-bar');
        const plusBtn = bar.lastElementChild;

        // Clear all except plus button
        while (bar.firstChild && bar.firstChild !== plusBtn) {
            bar.removeChild(bar.firstChild);
        }

        smartList.forEach(e => {
            const btn = document.createElement('button');
            btn.className = 'emoji-choice';
            btn.dataset.emoji = e;
            btn.style.cssText = 'background: none; border: none; font-size: 28px; cursor: pointer; padding: 4px;';
            btn.innerText = e;
            bar.insertBefore(btn, plusBtn);
        });
    }
}
