import { store } from '../store.js';
import { translations } from '../translations.js';

export class ActionView {
    constructor() {
        this.editingId = null; // Changed from isEditMode boolean
        this.longPressTimer = null;
        this.currentView = store.state.actionsView || 'tile';
    }

    t(key) {
        return translations[store.state.language][key] || key;
    }

    render() {
        const challenges = store.state.challenges;
        const currentUser = store.state.currentUser;

        return `
            <div class="header">
            <div class="header">
                <div style="display: flex; flex-direction: column; width: 100%; gap: 15px;">
                    <h1 style="text-align: center; margin: 0; font-size: 22px;">${this.t('actions')}</h1>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 4px;">
                        <button id="view-toggle-btn" class="header-icon-btn">
                            <i class="ph ${this.currentView === 'tile' ? 'ph-list' : 'ph-squares-four'}"></i>
                        </button>
                        <button id="add-action-header-btn" class="header-icon-btn">
                            <i class="ph ph-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
            </div>

            <div class="actions-container ${this.editingId ? 'edit-mode' : ''}" style="padding: 10px 16px 120px;">
                ${challenges.length === 0 ? `<p style="text-align:center; padding: 40px; color: var(--text-muted); opacity: 0.6;">${this.t('no_entries')}</p>` : ''}
                ${challenges.map(c => {
            // Apply sorting if available
            let actions = [...c.actions];
            const savedOrder = store.state.actionOrder[c.id];
            if (savedOrder) {
                actions.sort((a, b) => savedOrder.indexOf(a.id) - savedOrder.indexOf(b.id));
            }

            return `
                    <div class="challenge-group" data-cid="${c.id}" style="margin-bottom: 30px;">
                        <h3 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; font-weight: 700; letter-spacing: 0.05em;">${c.name}</h3>
                        <div class="actions-grid ${this.currentView}" style="${this.currentView === 'tile' ? 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;' : 'display: flex; flex-direction: column; gap: 8px;'}">
                            ${actions.map(a => {
                const count = store.state.events.filter(e => e.action_id === a.id && e.user_id === currentUser.id).length;
                // Filter out Phosphor class strings like "ph-users"
                const iconDisplay = (a.icon && a.icon.startsWith('ph-')) ? '🚀' : (a.icon || '🚀');

                const isEditingThis = this.editingId === a.id;

                return `
                                    <div class="action-card ${isEditingThis ? 'edit-active' : ''}" 
                                         data-cid="${c.id}" data-aid="${a.id}" draggable="${!!this.editingId}" 
                                         style="
                                            display: flex; 
                                            flex-direction: ${this.currentView === 'tile' ? 'column' : 'row'}; 
                                            align-items: center;
                                            justify-content: ${this.currentView === 'tile' ? 'center' : 'flex-start'};
                                            padding: ${this.currentView === 'tile' ? '12px 6px' : '14px 18px'};
                                            background: white; border-radius: 20px; border: 1px solid #f1f5f9; 
                                            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                                            text-align: ${this.currentView === 'tile' ? 'center' : 'left'}; 
                                            cursor: pointer; position: relative;
                                            opacity: ${this.editingId && !isEditingThis ? '0.5' : '1'};
                                            transform: ${isEditingThis ? 'scale(1.02)' : 'scale(1)'};
                                            z-index: ${isEditingThis ? '100' : '1'};
                                            min-height: ${this.currentView === 'tile' ? '110px' : 'auto'};
                                         ">
                                        
                                        <!-- Edit Controls Tile View -->
                                        ${isEditingThis && this.currentView === 'tile' ? `
                                            <div class="edit-controls-tile" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; z-index: 102;">
                                                <div style="width: 32px; height: 32px; border-radius: 10px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; cursor: grab;" class="drag-handle-tile">
                                                    <i class="ph ph-hand-grabbing" style="font-size: 16px; color: #64748b; transform: rotate(-30deg);"></i>
                                                </div>
                                                <div style="display: flex; gap: 8px;">
                                                    <button class="action-mini-btn edit-action" data-aid="${a.id}" data-cid="${c.id}" style="pointer-events: auto; width: 32px; height: 32px; border-radius: 10px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: none; display: flex; align-items: center; justify-content: center;">
                                                        <i class="ph ph-pencil-simple" style="font-size: 16px; color: #64748b;"></i>
                                                    </button>
                                                    <button class="action-mini-btn delete-action" data-aid="${a.id}" style="background: white; pointer-events: auto; width: 32px; height: 32px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: none; display: flex; align-items: center; justify-content: center;">
                                                        <i class="ph ph-trash" style="font-size: 16px; color: #64748b;"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ` : ''}

                                        <!-- Edit Controls List View -->
                                        ${isEditingThis && this.currentView === 'list' ? `
                                            <div class="edit-controls-list-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; gap: 10px; z-index: 102;">
                                                <button class="action-mini-btn edit-action" data-aid="${a.id}" data-cid="${c.id}" style="pointer-events: auto; width: 40px; height: 40px; border-radius: 12px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: none; display: flex; align-items: center; justify-content: center;">
                                                    <i class="ph ph-pencil-simple" style="font-size: 20px; color: #64748b;"></i>
                                                </button>
                                                <button class="action-mini-btn delete-action" data-aid="${a.id}" style="background: white; pointer-events: auto; width: 40px; height: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: none; display: flex; align-items: center; justify-content: center;">
                                                    <i class="ph ph-trash" style="font-size: 20px; color: #64748b;"></i>
                                                </button>
                                                <div style="width: 40px; height: 40px; border-radius: 12px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; cursor: grab;" class="drag-handle-list">
                                                    <i class="ph ph-hand-grabbing" style="font-size: 20px; color: #64748b; transform: rotate(-30deg);"></i>
                                                </div>
                                            </div>
                                        ` : ''}

                                        <div style="font-size: ${this.currentView === 'tile' ? '28px' : '20px'}; margin: ${this.currentView === 'tile' ? '0 0 8px 0' : '0 15px 0 0'}; line-height: 1; opacity: ${isEditingThis ? '0.1' : '1'}; pointer-events: none;">${iconDisplay}</div>
                                        <div style="flex:1; opacity: ${isEditingThis ? '0.1' : '1'}; pointer-events: none;">
                                            <div style="font-weight: 700; font-size: ${this.currentView === 'tile' ? '12px' : '14px'}; color: var(--text-dark); word-break: break-word; hyphens: auto;">${a.name}</div>
                                            <div style="font-size: 10px; color: #10b981; font-weight: 600; margin-top: 2px;">+${a.points} ${this.t('points') || 'Punkte'}</div>
                                        </div>


                                    </div>
                                `;
            }).join('')}
                        </div>
                    </div>
                `;
        }).join('')}
            </div>

            <!-- ACTION MODAL (GLIDER) -->
            <div id="action-edit-modal" class="modal-layer">
                <div class="modal-overlay" id="action-modal-overlay"></div>
                <div class="bottom-sheet" id="action-sheet">
                    <div style="padding: 24px 24px 40px;">
                        <div style="width: 40px; height: 5px; background: #f1f5f9; border-radius: 10px; margin: 0 auto 24px;"></div>
                        <h2 id="action-modal-title" style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Action bearbeiten</h2>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Name</label>
                            <input type="text" id="edit-action-name" class="form-control-pill" placeholder="z.B. Anruf">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Punkte</label>
                                <input type="number" id="edit-action-points" class="form-control-pill" value="1">
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Icon</label>
                                <input type="text" id="edit-action-icon" class="form-control-pill" value="🚀">
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button id="cancel-action-edit" style="flex: 1; padding: 14px; border-radius: 16px; border: 1px solid #e2e8f0; background: white; font-weight: 600;">Abbrechen</button>
                            <button id="save-action-edit" style="flex: 1; padding: 14px; border-radius: 16px; border: none; background: var(--primary); color: white; font-weight: 700;">Speichern</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .header-icon-btn {
                    width: 36px; height: 36px; border-radius: 12px; border: none; background: rgba(0,0,0,0.03); 
                    display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-dark);
                }
                .action-mini-btn {
                    width: 44px; height: 44px; border-radius: 14px; border: none; background: white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    display: flex; align-items: center; justify-content: center; cursor: pointer;
                }
                .action-mini-btn i { font-size: 20px !important; }
            </style>
        `;
    }

    afterRender() {
        // VIEW TOGGLE
        const viewBtn = document.getElementById('view-toggle-btn');
        if (viewBtn) {
            viewBtn.onclick = () => {
                this.currentView = this.currentView === 'tile' ? 'list' : 'tile';
                store.setActionsView(this.currentView);
                this.renderUpdate();
            };
        }

        // ADD BUTTON
        const addBtn = document.getElementById('add-action-header-btn');
        if (addBtn) addBtn.onclick = () => this.openModal();

        const cards = document.querySelectorAll('.action-card');

        cards.forEach(card => {
            // LONG PRESS DETECTION
            card.onmousedown = card.ontouchstart = (e) => {
                if (this.editingId) return; // Already editing something
                this.longPressTimer = setTimeout(() => {
                    this.editingId = card.dataset.aid;
                    if (navigator.vibrate) navigator.vibrate(50);
                    // Push state for back button integration
                    history.pushState({ editMode: true }, '');
                    this.renderUpdate();
                }, 600);
            };

            card.onmouseup = card.onmouseleave = card.ontouchend = () => {
                clearTimeout(this.longPressTimer);
            };

            // CLICK ACTION
            card.onclick = (e) => {
                const aId = card.dataset.aid;

                if (this.editingId) {
                    // Controls Logic
                    if (e.target.closest('.delete-action')) {
                        if (confirm(this.t('delete_confirm'))) {
                            store.deleteAction(aId);
                            this.editingId = null;
                        }
                    } else if (e.target.closest('.edit-action')) {
                        const btn = e.target.closest('.edit-action');
                        this.openModal(btn.dataset.aid, btn.dataset.cid);
                        this.editingId = null;
                    } else if (this.editingId === aId) {
                        // Click on the shaking card itself -> exit edit mode?
                        // User didn't request this, they requested controls to be clickable.
                        // Controls are handled above.
                    } else {
                        // Clicked another card while editing one -> switch edit to that one? or exit?
                        // Let's just exit edit mode for safety or switch
                        this.editingId = null;
                        this.renderUpdate();
                    }
                    return;
                }

                const cId = card.dataset.cid;
                store.addEvent(cId, aId);

                if (navigator.vibrate) navigator.vibrate(20);
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.style.transform = '', 100);

                // Confetti celebration
                this.showConfetti();
            };

            // DRAG AND DROP
            if (this.editingId) {
                card.addEventListener('dragstart', () => {
                    if (card.dataset.aid === this.editingId) card.classList.add('dragging');
                });
                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                    this.saveOrder(card.closest('.challenge-group'));
                    // Exit edit mode after drag
                    this.editingId = null;
                    this.renderUpdate();
                });
            }
        });

        // Exit Edit Mode Logic

        // 1. Outside Click
        const appContainer = document.getElementById('app');
        if (appContainer) { // Attach higher up than container to catch everything
            this.handleOutsideClick = (e) => {
                if (this.editingId && !e.target.closest('.action-card')) {
                    this.exitEditMode();
                }
            };
            document.body.addEventListener('click', this.handleOutsideClick);
        }

        // 2. Back Button (Popstate)
        // Store the original popstate to restore it? App.js overrides it. 
        // We need to integrate with App.js logic, or just add a one-time listener.
        // Actually, App.js logic calls methods on current view. Let's implement `closeModal` or a new `exitEditMode` hook?
        // App.js calls `view.closeModal()` if .modal-layer.active etc. 
        // We can make `closeModal` handle edit mode exit too? 
        // Or better: Let's just push state when entering edit mode, and listen for pop.

        // But App.js has a global onpopstate. We should hook into `closeModal` which App.js calls!
        // So we add logic to `closeModal` to also check for `editingId`.

        // DRAG OVER LOGIC
        document.querySelectorAll('.actions-grid').forEach(grid => {
            grid.addEventListener('dragover', e => {
                if (!this.editingId) return;
                e.preventDefault();
                // ... same logic
                const dragging = document.querySelector('.dragging');
                if (!dragging) return;

                const afterElement = this.getDragAfterElement(grid, e.clientX, e.clientY);
                if (afterElement == null) grid.appendChild(dragging);
                else grid.insertBefore(dragging, afterElement);
            });
        });

        // MODAL LOGIC
        const modal = document.getElementById('action-edit-modal');
        const sheet = document.getElementById('action-sheet');
        const overlay = document.getElementById('action-modal-overlay');
        const cancelBtn = document.getElementById('cancel-action-edit');
        const saveBtn = document.getElementById('save-action-edit');

        this.exitEditMode = () => {
            if (this.editingId) {
                this.editingId = null;
                this.renderUpdate();
                // Pop history if we have an editMode state
                if (history.state && history.state.editMode) {
                    history.back();
                }
            }
        };

        this.closeModal = () => {
            if (this.editingId) {
                this.editingId = null;
                this.renderUpdate();
                return; // Prioritize exiting edit mode if it's considered a "modal" state
            }
            sheet.classList.remove('open');
            setTimeout(() => modal.classList.remove('active'), 300);
        };

        if (overlay) overlay.onclick = this.closeModal;
        if (cancelBtn) cancelBtn.onclick = this.closeModal;

        if (saveBtn) {
            saveBtn.onclick = async () => {
                const name = document.getElementById('edit-action-name').value;
                const points = parseInt(document.getElementById('edit-action-points').value);
                const icon = document.getElementById('edit-action-icon').value;
                const aid = saveBtn.dataset.aid;
                const cid = saveBtn.dataset.cid;

                if (aid) {
                    await store.updateAction(aid, name, points, icon);
                } else {
                    await store.addAction(cid, name, points, icon);
                }
                this.closeModal();
                this.renderUpdate();
            };
        }
    }

    openModal(aid = null, cid = null) {
        const modal = document.getElementById('action-edit-modal');
        const sheet = document.getElementById('action-sheet');
        const saveBtn = document.getElementById('save-action-edit');
        const nameInput = document.getElementById('edit-action-name');
        const pointsInput = document.getElementById('edit-action-points');
        const iconInput = document.getElementById('edit-action-icon');

        if (aid) {
            document.getElementById('action-modal-title').innerText = this.t('edit') + ' Action';
            const action = store.state.challenges.flatMap(c => c.actions).find(a => a.id === aid);
            nameInput.value = action.name;
            pointsInput.value = action.points;
            // Hide class names!
            iconInput.value = (action.icon && action.icon.startsWith('ph-')) ? '🚀' : (action.icon || '🚀');
            saveBtn.dataset.aid = aid;
            saveBtn.dataset.cid = cid;
        } else {
            document.getElementById('action-modal-title').innerText = 'Neue Action';
            nameInput.value = '';
            pointsInput.value = '1';
            iconInput.value = '🚀';
            saveBtn.dataset.aid = '';
            saveBtn.dataset.cid = store.state.challenges[0]?.id || '';
        }

        modal.classList.add('active');
        history.pushState({ modal: 'open' }, '');
        setTimeout(() => sheet.classList.add('open'), 10);
    }

    saveOrder(group) {
        const cid = group.dataset.cid;
        const newOrder = [...group.querySelectorAll('.action-card')].map(c => c.dataset.aid);
        store.updateActionOrder(cid, newOrder);
    }

    getDragAfterElement(container, x, y) {
        const elements = [...container.querySelectorAll('.action-card:not(.dragging)')];
        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            // In tile view, we need both X and Y
            const offset = (this.currentView === 'tile')
                ? (Math.hypot(x - (box.left + box.width / 2), y - (box.top + box.height / 2)))
                : (y - box.top - box.height / 2);

            if (this.currentView === 'list') {
                const listOffset = y - box.top - box.height / 2;
                if (listOffset < 0 && listOffset > closest.offset) return { offset: listOffset, element: child };
                else return closest;
            } else {
                // For grid/tile, just finding the closest for now
                if (y < box.bottom && x < box.right) {
                    if (!closest.element || offset < closest.offset) return { offset, element: child };
                }
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    renderUpdate() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = this.render();
            this.afterRender();
        }
    }

    showConfetti() {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e'];
        const container = document.createElement('div');
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden;';
        document.body.appendChild(container);

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            const startX = Math.random() * 100;
            const startY = -10;
            const endX = startX + (Math.random() - 0.5) * 40;
            const endY = 110;
            const rotation = Math.random() * 720;
            const duration = Math.random() * 1000 + 1500;
            const delay = Math.random() * 300;

            confetti.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                left: ${startX}%;
                top: ${startY}%;
                opacity: 1;
                transform: rotate(0deg);
                animation: confettiFall ${duration}ms ease-out ${delay}ms forwards;
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(${endY - startY}vh) translateX(${(endX - startX)}vw) rotate(${rotation}deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);

            container.appendChild(confetti);
        }

        setTimeout(() => {
            container.remove();
        }, 2500);
    }
}
