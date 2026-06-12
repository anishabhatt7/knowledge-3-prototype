import { api } from 'lwc';
import LightningModal from 'lightning/modal';

/**
 * Reusable confirm dialog that extends LightningModal.
 *
 * Mirrors the resolve contract of `lightning/confirm` (resolves true on
 * confirm, false on cancel) so callers can keep the
 *   const proceed = await ConfirmDialog.open({ ... });
 *   if (!proceed) return;
 * pattern used previously with `LightningConfirm.open()`. Unlike
 * LightningConfirm, this component lets the caller customize the
 * confirm and cancel button labels.
 *
 * Open imperatively:
 *   const proceed = await ConfirmDialog.open({
 *       size: 'small',
 *       label: 'Discard unsaved changes?',
 *       message: 'Continue and discard your edits?',
 *       confirmLabel: 'Yes, continue', // optional, defaults to 'Yes, continue'
 *       cancelLabel: 'Cancel',         // optional, defaults to 'Cancel'
 *       theme: 'warning',              // optional; 'warning' | 'destructive' renders confirm as destructive
 *   });
 *
 * `label` and `size` are inherited from LightningModal — no need to
 * redeclare them here.
 */
export default class ConfirmDialog extends LightningModal {
    @api message = '';
    @api confirmLabel = 'Yes, continue';
    @api cancelLabel = 'Cancel';
    @api theme = '';

    get confirmVariant() {
        return this.theme === 'warning' || this.theme === 'destructive'
            ? 'destructive'
            : 'brand';
    }

    handleCancel() {
        this.close(false);
    }

    handleConfirm() {
        this.close(true);
    }
}
