import { store } from '../store.js';

export class ChatView {
    constructor() {
        this.currentReplyId = null;
        this.longPressTimer = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.sheetTouchStartY = 0;
        this.isSwipingSheet = false;
        this.lastThreadLength = 0;
        this.selectedMsgId = null;
        this.forceScroll = false;
    }

    render() {
        const chat = store.state.chat.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const currentUser = store.state.currentUser;

        // Scroll logic: pulse forceScroll on send
        this.shouldScrollNow = (chat.length > this.lastThreadLength) || this.forceScroll;
        this.lastThreadLength = chat.length;
        this.forceScroll = false;

        return `
            <div class="header">
                <h1>Team Chat</h1>
                <div style="font-size: 10px; color: var(--text-muted); cursor: pointer;" id="test-user-switch">
                    Testen als: <strong>${currentUser.name}</strong> (Wechseln)
                </div>
            </div>

            <div id="chat-feed" style="display: flex; flex-direction: column; gap: 10px; padding-bottom: 140px; padding-top: 10px; overflow-x: hidden;">
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
                        <div class="message-wrapper" data-id="${msg.id}" style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; position: relative; width: 100%;">
                            <div class="message-container" style="display: flex; align-items: flex-end; gap: 6px; flex-direction: ${isMe ? 'row-reverse' : 'row'}; max-width: 100%; padding: 0 10px; width: 100%; box-sizing: border-box;">
                                ${isEvent ? '' : `<div style="width: 28px; height: 28px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">${user.avatar}</div>`}
                                <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; position: relative; max-width: ${isEvent ? '85%' : '100%'};">
                                    <div class="message-bubble" style="
                                        background: ${isEvent ? '#f1f5f9' : (isMe ? 'var(--primary)' : 'white')}; 
                                        color: ${isEvent ? '#64748b' : (isMe ? 'white' : 'var(--text-dark)')};
                                        padding: ${isEvent ? '4px 10px' : '8px 12px'}; 
                                        border-radius: 18px; 
                                        ${isEvent ? '' : `border-bottom-${isMe ? 'right' : 'left'}-radius: 4px;`}
                                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                                        border: ${isMe || isEvent ? 'none' : '1px solid #e2e8f0'};
                                        font-size: ${isEvent ? '11px' : '15px'};
                                        cursor: pointer;
                                        user-select: none; -webkit-user-select: none;
                                    ">
                                        ${replyMsg ? `
                                            <div style="background: rgba(0,0,0,0.05); padding: 4px 6px; border-radius: 6px; font-size: 11px; margin-bottom: 4px; border-left: 2px solid ${isMe ? 'white' : 'var(--primary)'}; opacity: 0.8;">
                                                <strong>${replyMsg.user_id === currentUser.id ? 'Du' : (store.state.users.find(u => u.id === replyMsg.user_id)?.name || 'User')}</strong><br>
                                                ${replyMsg.content.substring(0, 25)}...
                                            </div>
                                        ` : ''}
                                        <div style="line-height: 1.4; white-space: pre-wrap;">${isEvent ? `${user.avatar} <strong>${user.name}</strong> ` : ''}${msg.content}</div>
                                    </div>
                                    ${reactions.length > 0 ? `
                                        <div class="reaction-pill" data-id="${msg.id}" style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2px 6px; margin-top: -10px; margin-${isMe ? 'right' : 'left'}: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 12px; cursor: pointer; z-index: 5;">
                                            <span>${topEmojis.join('')}</span>
                                            <span style="color: var(--text-muted); font-weight: 600; font-size: 10px; margin-left: 2px;">${reactions.length}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="swipe-indicator" style="position: absolute; left: -25px; top: 50%; transform: translateY(-50%); opacity: 0; pointer-events: none;">
                                <i class="ph ph-arrow-bend-up-left" style="font-size: 20px; color: var(--primary);"></i>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>

            <!-- Global Modals (Outside #app context) -->
            <div id="emoji-picker-container" class="modal-layer">
                <div id="emoji-picker-overlay" style="position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.01);"></div>
                <div id="emoji-bar" style="position: absolute; left: 50%; transform: translateX(-50%); background: white; border-radius: 40px; padding: 8px 12px; display: flex; align-items: center; gap: 4px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: max-content;">
                    <button id="show-full-picker-btn" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 18px; color: #64748b; cursor: pointer;">+</button>
                </div>
                <div id="single-emoji-input-container" class="bottom-sheet" style="padding: 15px; background: #f8f9fa;">
                    <div style="background: white; padding: 5px; border-radius: 25px; border: 1px solid #eee;">
                        <input type="text" id="single-emoji-input" placeholder="Wähle ein Emoji..." style="width: 100%; background: transparent; border: none; padding: 10px; text-align: center; font-size: 18px; outline: none;">
                    </div>
                </div>
            </div>

            <div id="reaction-modal" class="modal-layer">
                <div id="reaction-sheet" class="bottom-sheet">
                    <div style="padding: 20px 20px 40px 20px;">
                        <div id="sheet-handle" style="width: 40px; height: 5px; background: #ddd; border-radius: 10px; margin: 0 auto 20px; cursor: pointer;"></div>
                        <h3 id="reaction-count-title" style="margin-bottom: 20px; font-size: 16px;">Reaktionen</h3>
                        <div id="reaction-users-list" style="overflow-y: auto; max-height: 40vh;"></div>
                    </div>
                </div>
            </div>

            <!-- Chat Input (Fixed ABOVE Tabs, Quote inside Bubble) -->
            <div id="chat-input-container">
                <div style="width: 100%; max-width: 450px; margin: 0 auto;">
                    <div style="display: flex; flex-direction: column; background: white; border: 1px solid #eee; border-radius: 25px; padding: 3px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 0 10px; overflow: hidden;">
                        <div id="reply-preview" style="display: none; background: #f8fafc; padding: 8px 15px; border-radius: 20px 20px 0 0; border-bottom: 1px solid #eee; font-size: 11px; align-items: center; justify-content: space-between;">
                            <span id="reply-text" style="color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%;">Antworten auf...</span>
                            <button id="cancel-reply" style="border: none; background: none; font-size: 20px; cursor: pointer; color: #999; line-height: 1;">&times;</button>
                        </div>
                        <div style="display: flex; align-items: flex-end; gap: 8px;">
                            <textarea id="chat-input" placeholder="Nachricht..." rows="1" style="flex: 1; background: transparent; border: none; padding: 10px 15px; outline: none; resize: none; font-size: 16px; font-family: inherit; max-height: 100px;"></textarea>
                            <button id="send-btn" style="background: var(--primary); color: white; border: none; width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 4px 12px var(--primary-glow); display: flex; align-items: center; justify-content: center; margin-right: 2px; margin-bottom: 2px;">
                                <i class="ph-fill ph-paper-plane-right" style="font-size: 18px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    afterRender() {
        const input = document.getElementById('chat-input');
        const pickerContainer = document.getElementById('emoji-picker-container');
        const emojiBar = document.getElementById('emoji-bar');
        const sheet = document.getElementById('reaction-sheet');
        const modal = document.getElementById('reaction-modal');
        const singleEmojiInput = document.getElementById('single-emoji-input');
        const feedContainer = document.querySelector('.content-area');

        if (this.shouldScrollNow) {
            setTimeout(() => {
                feedContainer.scrollTo({ top: feedContainer.scrollHeight, behavior: 'auto' });
            }, 50);
            this.shouldScrollNow = false;
        }

        // Long Press Emoji
        document.querySelectorAll('.message-wrapper').forEach(wrapper => {
            const bubble = wrapper.querySelector('.message-bubble');
            const msgId = wrapper.dataset.id;

            bubble.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.longPressTimer = setTimeout(() => {
                    document.activeElement?.blur(); // Prevent keyboard glitch
                    this.selectedMsgId = msgId;
                    const rect = bubble.getBoundingClientRect();
                    pickerContainer.classList.add('active');
                    emojiBar.style.top = `${rect.top < 150 ? rect.bottom + 10 : rect.top - 65}px`;
                    this.renderSmartEmojiList();
                    if (navigator.vibrate) navigator.vibrate(50);
                }, 400);
            }, { passive: true });

            wrapper.addEventListener('touchmove', (e) => {
                const diffX = e.touches[0].clientX - this.touchStartX;
                const diffY = e.touches[0].clientY - this.touchStartY;
                if (Math.abs(diffY) > 10 || Math.abs(diffX) > 10) clearTimeout(this.longPressTimer);
                if (diffX > 25 && Math.abs(diffY) < 20) {
                    wrapper.style.transform = `translateX(${Math.min(diffX, 60)}px)`;
                    wrapper.querySelector('.swipe-indicator').style.opacity = Math.min(diffX / 60, 1);
                }
            }, { passive: true });

            wrapper.addEventListener('touchend', (e) => {
                clearTimeout(this.longPressTimer);
                if (e.changedTouches[0].clientX - this.touchStartX > 50) {
                    this.currentReplyId = msgId;
                    const msg = store.state.chat.find(m => m.id === msgId);
                    const user = store.state.users.find(u => u.id === msg.user_id);
                    document.getElementById('reply-preview').style.display = 'flex';
                    const cleanText = msg.content.substring(0, 25);
                    document.getElementById('reply-text').innerText = `${user?.name || 'User'}: ${cleanText}...`;
                    input.focus();
                }
                wrapper.style.transform = '';
                wrapper.querySelector('.swipe-indicator').style.opacity = 0;
            });
            bubble.addEventListener('contextmenu', e => e.preventDefault());
        });

        const closeModal = () => {
            modal.style.background = 'rgba(0,0,0,0)';
            sheet.classList.remove('open');
            setTimeout(() => modal.classList.remove('active'), 300);
        };

        // Reaction Detail
        document.querySelectorAll('.reaction-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                document.activeElement?.blur(); // Prevent keyboard glitch
                const reactions = (store.state.chat.find(m => m.id === pill.dataset.id))?.reactions || [];
                document.getElementById('reaction-count-title').innerText = `${reactions.length} Reaktionen`;
                document.getElementById('reaction-users-list').innerHTML = reactions.map(r => {
                    const user = store.state.users.find(u => u.id === r.u);
                    const isMe = r.u === store.state.currentUser.id;
                    return `
                        <div class="reaction-row" data-emoji="${r.e}" data-is-me="${isMe}" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; cursor: ${isMe ? 'pointer' : 'default'};">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center;">${user?.avatar || '👤'}</div>
                                <span style="font-weight: 500;">${user?.name || 'Unbekannt'} ${isMe ? '(Du)' : ''}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 20px;">${r.e}</span>
                                ${isMe ? '<span style="font-size: 14px; color: #ef4444; font-weight: bold;">✕</span>' : ''}
                            </div>
                        </div>
                    `;
                }).join('');

                document.querySelectorAll('.reaction-row').forEach(row => {
                    if (row.dataset.isMe === 'true') row.onclick = () => {
                        store.addReaction(pill.dataset.id, row.dataset.emoji);
                        closeModal();
                    };
                });

                modal.classList.add('active');
                setTimeout(() => { modal.style.background = 'rgba(0,0,0,0.4)'; sheet.classList.add('open'); }, 10);
            });
        });

        modal.onclick = (e) => { if (e.target === modal) closeModal(); };

        // Swipe down to close sheet
        let startY = 0;
        let sheetOffset = 0;
        sheet.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            sheet.style.transition = 'none';
        }, { passive: true });

        sheet.addEventListener('touchmove', (e) => {
            const diff = e.touches[0].clientY - startY;
            if (diff > 0) {
                sheetOffset = diff;
                sheet.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: true });

        sheet.addEventListener('touchend', () => {
            sheet.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            if (sheetOffset > 100) {
                closeModal();
            } else {
                sheet.style.transform = 'translateY(0)';
            }
            sheetOffset = 0;
        });

        // Custom Emoji Picker
        document.getElementById('show-full-picker-btn').onclick = () => {
            emojiBar.style.display = 'none';
            document.getElementById('single-emoji-input-container').classList.add('open');
            singleEmojiInput.focus();
        };

        singleEmojiInput.oninput = () => {
            const match = singleEmojiInput.value.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
            if (match) {
                const usedEmoji = match[0];
                store.addReaction(this.selectedMsgId, usedEmoji);
                this.trackEmojiUsage(usedEmoji);

                // Close and refresh
                pickerContainer.classList.remove('active');
                document.getElementById('single-emoji-input-container').classList.remove('open');
                singleEmojiInput.value = '';
                this.renderSmartEmojiList(); // Refresh list immediately
            }
        };

        document.getElementById('emoji-picker-overlay').onclick = () => {
            pickerContainer.classList.remove('active');
            document.getElementById('single-emoji-input-container').classList.remove('open');
        };

        document.getElementById('send-btn').onclick = () => {
            if (input.value.trim()) {
                this.forceScroll = true;
                store.addMessage(input.value.trim(), 'text', null, this.currentReplyId);
                input.value = '';
                document.getElementById('reply-preview').style.display = 'none';
                this.currentReplyId = null;
            }
        };

        document.getElementById('cancel-reply').onclick = () => {
            this.currentReplyId = null;
            document.getElementById('reply-preview').style.display = 'none';
        }

        document.getElementById('test-user-switch').onclick = () => {
            if (store.state.currentUser.name === 'Julius') store.switchUser('8fcb9560-f435-430c-8090-e4b2d41a7986', 'Simon', '🚀');
            else store.switchUser('7fcb9560-f435-430c-8090-e4b2d41a7985', 'Julius', '👨‍🚀');
            location.reload();
        };
    }

    trackEmojiUsage(e) {
        let usage = JSON.parse(localStorage.getItem('emoji_usage') || '{}');
        usage[e] = (usage[e] || 0) + 1;
        localStorage.setItem('emoji_usage', JSON.stringify(usage));
    }

    renderSmartEmojiList() {
        const usage = JSON.parse(localStorage.getItem('emoji_usage') || '{}');
        const sorted = Object.keys(usage).sort((a, b) => usage[b] - usage[a]);
        const list = [...new Set([...sorted.slice(0, 3), '👍', '❤️', '😂', '😮', '😢', '🙏'])].slice(0, 6);
        const bar = document.getElementById('emoji-bar');
        const plus = document.getElementById('show-full-picker-btn');
        bar.querySelectorAll('.emoji-choice').forEach(n => n.remove());
        list.reverse().forEach(e => {
            const btn = document.createElement('button');
            btn.className = 'emoji-choice';
            btn.style.cssText = 'background:none;border:none;font-size:26px;padding:4px;cursor:pointer;';
            btn.innerText = e;
            btn.onclick = () => {
                store.addReaction(this.selectedMsgId, e);
                this.trackEmojiUsage(e);
                document.getElementById('emoji-picker-container').classList.remove('active');
            };
            bar.insertBefore(btn, plus);
        });
        bar.style.display = 'flex';
    }
}
