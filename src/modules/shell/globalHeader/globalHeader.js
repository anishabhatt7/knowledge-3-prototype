import { LightningElement, track } from 'lwc';

export default class GlobalHeader extends LightningElement {
    static renderMode = 'light';

    @track _agentforceOpen = false;
    _boundAgentforceToggle = null;

    connectedCallback() {
        this._boundAgentforceToggle = (e) => {
            const next = e.detail?.open;
            if (typeof next === 'boolean' && next !== this._agentforceOpen) {
                this._agentforceOpen = next;
            }
        };
        window.addEventListener('agentforce:toggle', this._boundAgentforceToggle);
    }

    disconnectedCallback() {
        if (this._boundAgentforceToggle) {
            window.removeEventListener('agentforce:toggle', this._boundAgentforceToggle);
            this._boundAgentforceToggle = null;
        }
    }

    get agentforceBtnClass() {
        const base = 'lightning-button-icon_custom slds-m-right_small';
        return this._agentforceOpen ? `${base} lightning-button-icon_agentforce-active` : base;
    }

    handleAgentforceClick() {
        this._agentforceOpen = !this._agentforceOpen;
        window.dispatchEvent(
            new CustomEvent('agentforce:toggle', { detail: { open: this._agentforceOpen } })
        );
    }

    handleTrailheadClick() {
        this.dispatchEvent(new CustomEvent('panelselect', {
            detail: { name: 'trailhead_panel' },
            bubbles: true,
            composed: true
        }));
    }

    handleSettingsClick() {
        this.dispatchEvent(new CustomEvent('panelselect', {
            detail: { name: 'settings_panel' },
            bubbles: true,
            composed: true
        }));
    }

    handleNotificationClick() {
        this.dispatchEvent(new CustomEvent('panelselect', {
            detail: { name: 'notification_panel' },
            bubbles: true,
            composed: true
        }));
    }
}