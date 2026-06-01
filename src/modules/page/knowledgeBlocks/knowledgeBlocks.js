import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
import { navigate } from '../../../router';
import 'ui/knowledgePageHeader';
import 'ui/knowledgeDataTable';
import 'ui/newKnowledgeBlockModal';
import 'ui/savedKnowledgeBlockRecord';

export default class KnowledgeBlocks extends LightningElement {
    static renderMode = 'light';

    @track _railExpanded = true;
    _railAnimating = false;

    // Views: 'list' | 'create' | 'saved'
    @track _currentView = 'list';
    @track _savedArticle = null;
    @track _savedKbListItems = [];
    @track _kbCreationDraftTitle = '';
    @track showToast = false;
    @track _toastMessage = '';
    _toastTimer = null;

    _railTopItems = [
        { id: 'home', label: 'Home', icon: 'utility:home', active: false },
    ];

    railMaintain = [
        { id: 'command-center', label: 'Knowledge Health', icon: 'utility:graph' },
    ];

    railCreate = [
        { id: 'kb-base', label: 'Knowledge Base', icon: 'utility:knowledge_base' },
        { id: 'kb-blocks', label: 'Knowledge Blocks', icon: 'utility:process', active: true },
    ];

    get railTopItems() {
        return this._railTopItems.map((item) => ({
            ...item,
            rowClass: item.active ? 'kh-rail__row kh-rail__row--active' : 'kh-rail__row',
        }));
    }

    get railMaintainComputed() {
        return this.railMaintain.map((item) => ({
            ...item,
            rowClass: item.active ? 'kh-rail__row kh-rail__row--active' : 'kh-rail__row',
        }));
    }

    get railCreateComputed() {
        return this.railCreate.map((item) => ({
            ...item,
            rowClass: item.active ? 'kh-rail__row kh-rail__row--active' : 'kh-rail__row',
        }));
    }

    get railClass() {
        return this._railExpanded ? 'kh-rail kh-rail--expanded' : 'kh-rail';
    }

    get collapseIconName() {
        return this._railExpanded ? 'utility:left' : 'utility:right';
    }

    get collapseAriaLabel() {
        return this._railExpanded ? 'Collapse navigation' : 'Expand navigation';
    }

    // ── View state getters ──────────────────────────────────────────
    get isListView() {
        return this._currentView === 'list';
    }

    get isCreateView() {
        return this._currentView === 'create';
    }

    get isSavedView() {
        return this._currentView === 'saved';
    }

    get showLeftRail() {
        return this._currentView === 'list';
    }

    get toastMessage() {
        if (this._toastMessage) return this._toastMessage;
        const title = this._savedArticle && this._savedArticle.articleTitle
            ? `"${this._savedArticle.articleTitle}"`
            : 'Knowledge block';
        return `${title} was saved as draft`;
    }

    // ── Rail animation ──────────────────────────────────────────────
    handleToggleRail() {
        if (this._railAnimating) return;
        const next = !this._railExpanded;
        const rail = this.querySelector('.kh-rail');
        if (!rail || !gsap) {
            this._railExpanded = next;
            return;
        }

        const COLLAPSED_W = 48;
        const EXPANDED_W = 267;
        const targetW = next ? EXPANDED_W : COLLAPSED_W;
        this._railAnimating = true;

        if (next) {
            this._railExpanded = true;
            requestAnimationFrame(() => {
                const labels = this.querySelectorAll('.kh-rail .kh-rail__label, .kh-rail .kh-rail__group-header');
                gsap.fromTo(
                    rail,
                    { width: COLLAPSED_W },
                    {
                        width: targetW,
                        duration: 0.32,
                        ease: 'power2.out',
                        onComplete: () => {
                            rail.style.width = '';
                            this._railAnimating = false;
                        },
                    }
                );
                gsap.fromTo(
                    labels,
                    { opacity: 0, x: -8 },
                    { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out', delay: 0.08, stagger: 0.02 }
                );
            });
        } else {
            const labels = this.querySelectorAll('.kh-rail .kh-rail__label, .kh-rail .kh-rail__group-header');
            gsap.to(labels, {
                opacity: 0,
                x: -8,
                duration: 0.16,
                ease: 'power2.in',
            });
            gsap.to(rail, {
                width: targetW,
                duration: 0.32,
                ease: 'power2.in',
                delay: 0.04,
                onComplete: () => {
                    this._railExpanded = false;
                    rail.style.width = '';
                    this._railAnimating = false;
                },
            });
        }
    }

    handleRailNav(event) {
        const id = event.currentTarget?.dataset?.id;
        if (id === 'home') {
            navigate('/');
        } else if (id === 'knowledge-agents') {
            navigate('/knowledge-agents');
        } else if (id === 'healing-graph') {
            navigate('/healing-graph');
        } else if (id === 'kb-base') {
            navigate('/knowledge-base');
        } else if (id === 'command-center') {
            navigate('/command-center');
        }
    }

    // ── Flow handlers ───────────────────────────────────────────────
    handleOpenNewKnowledge() {
        this._currentView = 'create';
        this._kbCreationDraftTitle = 'New Block title';
    }

    handleCloseModal() {
        this._currentView = 'list';
        this._kbCreationDraftTitle = '';
    }

    handleSaveDraft(event) {
        this._savedArticle = event.detail;
        this._toastMessage = '';
        const now = new Date();
        const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        this._savedKbListItems = [
            { id: `saved-kb-${Date.now()}`, title: event.detail.articleTitle || 'New Block title', date: dateStr, recordType: 'Knowledge Block' },
            ...this._savedKbListItems,
        ];
        this._currentView = 'saved';
        this._kbCreationDraftTitle = '';
        this.showToast = true;
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this.showToast = false;
        }, 4000);
    }

    handleViewKbRecord(event) {
        const detail = event.detail;
        this._savedArticle = {
            articleTitle: detail.title,
            summary: '',
            detailsContent: '',
            recordType: 'Knowledge Block',
        };
        this._currentView = 'saved';
    }

    handleKbToast(event) {
        this._toastMessage = (event.detail && event.detail.message) || 'Knowledge block updated successfully.';
        this.showToast = true;
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this.showToast = false;
            this._toastMessage = '';
        }, 4000);
    }
}
