import { store } from '../store.js';

export class ChatView {
    constructor() {
        this.currentReplyId = null;
        this.longPressTimer = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastThreadLength = 0;
        this.selectedMsgId = null;
        this.forceScroll = false;
    }

    render() {
        const chat = store.state.chat.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const currentUser = store.state.currentUser;
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
            <div id="chat-feed" style="display: flex; flex-direction: column; gap: 10px; padding-bottom: 20px; padding-top: 10px; overflow-x: hidden;">
                ${chat.map(msg => {
            const isMe = msg.user_id === currentUser.id;
            const user = store.state.users.find(u => u.id === msg.user_id) || { name: 'Unbekannt', avatar: '👤' };
            const isEvent = msg.type === 'event';
            const replyMsg = msg.reply_to ? chat.find(m => m.id === msg.reply_to) : null;
            const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];

            // --- REACTION LOGIC ---
            const myEmojis = reactions.filter(r => r.u === currentUser.id).map(r => r.e);
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
                                        <div class="reaction-pill" data-id="${msg.id}" style="
                                            display: flex; align-items: center; gap: 4px; 
                                            background: white; border: 1px solid #e2e8f0; 
                                            border-radius: 12px; padding: 2px 6px; margin-top: -10px; 
                                            margin-${isMe ? 'right' : 'left'}: 8px; 
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.05); 
                                            font-size: 15px; cursor: pointer; z-index: 10;
                                        ">
                                            <div style="display: flex; align-items: center;">
                                                ${topEmojis.map(e => `
                                                    <span class="emoji-span ${myEmojis.includes(e) ? 'is-mine' : ''}" style="display: inline-flex; font-size: 12px; margin-right: 1px;">${e}</span>
                                                `).join('')}
                                            </div>
                                            <span style="color: var(--text-muted); font-weight: 500; font-size: 11px; margin-left: 2px;">
                                                ${reactions.length}
                                            </span>
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
        `;
    }

    afterRender() {
        const input = document.getElementById('chat-input');
        const pickerContainer = document.getElementById('emoji-picker-container');
        const emojiBar = document.getElementById('emoji-bar');
        const pickerOverlay = document.getElementById('emoji-picker-overlay');
        const reactionModal = document.getElementById('reaction-modal');
        const reactionOverlay = document.getElementById('reaction-modal-overlay');
        const sheet = document.getElementById('reaction-sheet');
        const singleEmojiInput = document.getElementById('single-emoji-input');
        const feedContainer = document.querySelector('.content-area');
        const sendBtn = document.getElementById('send-btn');

        if (this.shouldScrollNow) {
            setTimeout(() => feedContainer.scrollTo({ top: feedContainer.scrollHeight, behavior: 'auto' }), 100);
            this.shouldScrollNow = false;
        }

        const closePicker = () => {
            pickerContainer.classList.remove('active');
            document.getElementById('single-emoji-input-container').classList.remove('open');
        };

        const closeReactionModal = () => {
            reactionModal.style.background = 'rgba(0,0,0,0)';
            sheet.classList.remove('open');
            setTimeout(() => reactionModal.classList.remove('active'), 300);
        }

        this.renderSmartEmojiList();
        pickerOverlay.onclick = closePicker;
        reactionOverlay.onclick = closeReactionModal;

        document.querySelectorAll('.message-wrapper').forEach(wrapper => {
            const bubble = wrapper.querySelector('.message-bubble');
            bubble.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.longPressTimer = setTimeout(() => {
                    if (Math.abs(e.touches[0].clientX - this.touchStartX) < 15) {
                        input?.blur();
                        this.selectedMsgId = wrapper.dataset.id;
                        const rect = bubble.getBoundingClientRect();
                        pickerContainer.classList.add('active');
                        if (emojiBar) {
                            emojiBar.style.display = 'flex';
                            emojiBar.style.top = `${rect.top < 150 ? rect.bottom + 10 : rect.top - 65}px`;
                        }
                        if (navigator.vibrate) navigator.vibrate(50);
                    }
                }, 400);
            }, { passive: true });

            wrapper.addEventListener('touchmove', (e) => {
                const dX = e.touches[0].clientX - this.touchStartX;
                const dY = e.touches[0].clientY - this.touchStartY;
                if (Math.abs(dY) > 20 || dX < -10) clearTimeout(this.longPressTimer);
                if (dX > 20 && Math.abs(dY) < 30) {
                    clearTimeout(this.longPressTimer);
                    wrapper.style.transform = `translateX(${Math.min(dX, 60)}px)`;
                    wrapper.querySelector('.swipe-indicator').style.opacity = Math.min(dX / 60, 1);
                }
            }, { passive: true });

            wrapper.addEventListener('touchend', (e) => {
                clearTimeout(this.longPressTimer);
                const dX = e.changedTouches[0].clientX - this.touchStartX;
                const dY = e.changedTouches[0].clientY - this.touchStartY;
                if (dX > 50 && Math.abs(dY) < 40) {
                    this.currentReplyId = wrapper.dataset.id;
                    const msg = store.state.chat.find(m => m.id === this.currentReplyId);
                    document.getElementById('reply-preview').style.display = 'flex';
                    document.getElementById('reply-text').innerText = `Antwort: ${msg.content.substring(0, 25)}...`;
                    input?.focus();
                }
                wrapper.style.transform = '';
                wrapper.querySelector('.swipe-indicator').style.opacity = 0;
            });
        });

        document.querySelectorAll('.reaction-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                input?.blur();
                const msgId = pill.dataset.id;
                const msg = store.state.chat.find(m => m.id === msgId);
                const reactions = msg?.reactions || [];
                document.getElementById('reaction-count-title').innerText = `${reactions.length} Reaktionen`;
                document.getElementById('reaction-users-list').innerHTML = reactions.map(r => {
                    const user = store.state.users.find(u => u.id === r.u);
                    const isMe = r.u === store.state.currentUser.id;
                    return `
                        <div class="reaction-row" data-emoji="${r.e}" data-id="${r.u}" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center;">${user?.avatar || '👤'}</div>
                                <span style="font-weight: 500;">${user?.name || 'Unbekannt'} ${isMe ? '(Du)' : ''}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 20px;">${r.e}</span>
                                ${isMe ? '<span class="delete-x" style="font-size: 14px; color: #ef4444; font-weight: bold; cursor: pointer; padding: 10px;">✕</span>' : ''}
                            </div>
                        </div>
                    `;
                }).join('');

                document.querySelectorAll('.reaction-row').forEach(row => {
                    const delBtn = row.querySelector('.delete-x');
                    if (delBtn) {
                        row.onclick = () => {
                            row.classList.add('deleting');
                            setTimeout(() => {
                                store.addReaction(msgId, row.dataset.emoji);
                                closeReactionModal();
                            }, 500);
                        };
                    }
                });
                reactionModal.classList.add('active');
                setTimeout(() => { reactionModal.style.background = 'rgba(0,0,0,0.4)'; sheet.classList.add('open'); }, 10);
            });
        });

        const updateQueue = (e) => {
            let queue = JSON.parse(localStorage.getItem('emoji_queue_v6') || '[]');
            queue = queue.filter(x => x !== e);
            queue.unshift(e);
            localStorage.setItem('emoji_queue_v6', JSON.stringify(queue.slice(0, 6)));
        };

        const applyEmoji = (e) => {
            store.addReaction(this.selectedMsgId, e);
            updateQueue(e);
            closePicker();
            this.renderSmartEmojiList();
        };

        document.getElementById('show-full-picker-btn').onclick = (e) => {
            e.stopPropagation();
            if (emojiBar) emojiBar.style.display = 'none';
            document.getElementById('single-emoji-input-container').classList.add('open');
            singleEmojiInput?.focus();
        };

        singleEmojiInput.oninput = () => {
            const m = singleEmojiInput.value.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
            if (m) {
                applyEmoji(m[0]);
                singleEmojiInput.value = '';
            }
        };

        sendBtn.onclick = () => {
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

    renderSmartEmojiList() {
        const queue = JSON.parse(localStorage.getItem('emoji_queue_v6') || '[]');
        const defaults = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
        const list = [...new Set([...queue, ...defaults])].slice(0, 6);
        const bar = document.getElementById('emoji-bar');
        if (!bar) return;
        bar.querySelectorAll('.emoji-choice').forEach(n => n.remove());
        const plus = document.getElementById('show-full-picker-btn');
        list.forEach(e => {
            const btn = document.createElement('button');
            btn.className = 'emoji-choice';
            btn.style.cssText = 'background:none;border:none;font-size:26px;padding:4px;cursor:pointer;';
            btn.innerText = e;
            btn.onclick = (ev) => {
                ev.stopPropagation();
                store.addReaction(this.selectedMsgId, e);
                let q = JSON.parse(localStorage.getItem('emoji_queue_v6') || '[]');
                q = q.filter(x => x !== e); q.unshift(e);
                localStorage.setItem('emoji_queue_v6', JSON.stringify(q.slice(0, 6)));
                document.getElementById('emoji-picker-container').classList.remove('active');
                this.renderSmartEmojiList();
            };
            bar.insertBefore(btn, plus);
        });
    }
}
