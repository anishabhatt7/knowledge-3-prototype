import { LightningElement, api, track } from 'lwc';

export default class GlobalNavigation extends LightningElement {
    @api currentPage = 'home';
    @track isWaffleMenuOpen = false;

    get waffleDropdownTriggerClass() {
        const base = 'slds-context-bar__item slds-context-bar__dropdown-trigger slds-dropdown-trigger slds-dropdown-trigger_click slds-no-hover';
        return this.isWaffleMenuOpen ? `${base} slds-is-open` : base;
    }

    get isHomePage() {
        return this.currentPage === 'home';
    }

    get isIconsPage() {
        return this.currentPage === 'icons';
    }

    get isSettingsPage() {
        return this.currentPage === 'settings';
    }

    get isUserPage() {
        return this.currentPage === 'user';
    }

    get homeTabClass() {
        return `slds-context-bar__item ${this.isHomePage ? 'slds-is-active' : ''}`;
    }

    get iconsTabClass() {
        return `slds-context-bar__item ${this.isIconsPage ? 'slds-is-active' : ''}`;
    }

    get settingsTabClass() {
        return `slds-context-bar__item ${this.isSettingsPage ? 'slds-is-active' : ''}`;
    }

    get userTabClass() {
        return `slds-context-bar__item ${this.isUserPage ? 'slds-is-active' : ''}`;
    }

    handleHomeClick(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page: 'home' },
            bubbles: true,
            composed: true
        }));
    }

    handleIconsClick(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page: 'icons' },
            bubbles: true,
            composed: true
        }));
    }

    handleSettingsClick(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page: 'settings' },
            bubbles: true,
            composed: true
        }));
    }

    handleUserClick(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page: 'user' },
            bubbles: true,
            composed: true
        }));
    }

    handleMenuNavigate(event) {
        const page = event.detail.value;
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page },
            bubbles: true,
            composed: true
        }));
    }

    handleWaffleOpen() {
        const wasOpen = this.isWaffleMenuOpen;
        this.isWaffleMenuOpen = !this.isWaffleMenuOpen;
        if (!wasOpen && this.isWaffleMenuOpen) {
            this._focusMenuOnNextRender = true;
        }
    }

    handleWaffleMenuItemClick(event) {
        event.preventDefault();
        this.isWaffleMenuOpen = false;
        const page = event.currentTarget.dataset.value;
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page },
            bubbles: true,
            composed: true
        }));
    }

    handleWaffleMenuKeydown(event) {
        const menu = this.template.querySelector('.slds-dropdown');
        if (!menu || !menu.contains(event.target)) return;

        const key = event.key;
        if (key === 'Escape') {
            event.preventDefault();
            this.isWaffleMenuOpen = false;
            setTimeout(() => this._focusWaffle(), 0);
            return;
        }
        if (key === 'Tab') {
            this.isWaffleMenuOpen = false;
            return;
        }
        if (key === 'ArrowDown' || key === 'ArrowUp') {
            event.preventDefault();
            const items = Array.from(this.template.querySelectorAll('[role="menuitem"]'));
            const currentIndex = items.indexOf(event.target);
            if (currentIndex === -1) return;
            let nextIndex;
            if (key === 'ArrowDown') {
                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            } else {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            }
            items[nextIndex].focus();
        }
    }

    _focusWaffle() {
        const waffle = this.template.querySelector('main-waffle');
        if (waffle && typeof waffle.focus === 'function') {
            waffle.focus();
        }
    }

    connectedCallback() {
        this._boundHandleDocumentClick = this._handleDocumentClick.bind(this);
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._boundHandleDocumentClick);
    }

    renderedCallback() {
        if (this.isWaffleMenuOpen) {
            document.addEventListener('click', this._boundHandleDocumentClick);
            if (this._focusMenuOnNextRender) {
                this._focusMenuOnNextRender = false;
                this._focusFirstMenuItem();
            }
        } else {
            document.removeEventListener('click', this._boundHandleDocumentClick);
        }
    }

    _focusFirstMenuItem() {
        const first = this.template.querySelector('[role="menuitem"]');
        if (first) {
            setTimeout(() => first.focus(), 0);
        }
    }

    _handleDocumentClick(event) {
        const trigger = this.template.querySelector('[class*="slds-dropdown-trigger"]');
        // Use composedPath() so we see the real click path across shadow boundaries (event.target is retargeted to host nodes)
        const path = event.composedPath ? event.composedPath() : [];
        const clickInsideTrigger = trigger && path.includes(trigger);
        if (trigger && !clickInsideTrigger) {
            this.isWaffleMenuOpen = false;
        }
    }
}
