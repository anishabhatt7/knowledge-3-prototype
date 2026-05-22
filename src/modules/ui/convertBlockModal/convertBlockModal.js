import LightningModal from 'lightning/modal';
import { api, track } from 'lwc';

export default class ConvertBlockModal extends LightningModal {
    @api blockContent = '';
    @track _title = '';
    @track _description = '';

    get isConfirmDisabled() {
        return !this._title.trim();
    }

    get contentPreview() {
        const c = this.blockContent || '';
        return c.length > 120 ? c.slice(0, 120) + '...' : c;
    }

    handleTitleInput(event) {
        this._title = event.target.value;
    }

    handleDescriptionInput(event) {
        this._description = event.target.value;
    }

    handleTitleKeyDown(event) {
        if (event.key === 'Enter' && this._title.trim()) {
            this._confirm();
        }
    }

    handleCancel() {
        this.close(undefined);
    }

    handleConfirm() {
        this._confirm();
    }

    _confirm() {
        if (!this._title.trim()) return;
        this.close({
            title: this._title.trim(),
            description: this._description.trim(),
        });
    }
}
