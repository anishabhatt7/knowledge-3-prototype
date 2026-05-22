import { LightningElement, api } from 'lwc';

/**
 * Knowledge list-view page header — ported from
 * knowledge_hackathon_v2 main/knowledgePageHeader. Stays a "dumb"
 * presentational component; consumers listen for its custom events.
 */
export default class KnowledgePageHeader extends LightningElement {
  static renderMode = 'light';

  @api isKbCreationFlow = false;

  get headerEntityName() {
    return this.isKbCreationFlow ? 'Knowledge Blocks' : 'Knowledge';
  }

  get headerIcon() {
    return this.isKbCreationFlow ? 'standard:knowledge' : 'standard:knowledge';
  }

  get newButtonLabel() {
    return this.isKbCreationFlow ? 'Create New Block' : 'New Article';
  }

  handleNew() {
    this.dispatchEvent(
      new CustomEvent('opennewknowledge', { bubbles: true, composed: true })
    );
  }
  handlePublish() {}
  handleAssign() {}
  handleArchive() {}
  handleDelete() {}
  handleNewMenuSelect(event) {
    const value = event.detail.value;
    this.dispatchEvent(
      new CustomEvent('pageheadernewmenuselect', {
        bubbles: true,
        composed: true,
        detail: { value }
      })
    );
  }
  handleMenuSelect(event) {
    const value = event.detail.value;
    this.dispatchEvent(
      new CustomEvent('pageheadermenuselect', {
        bubbles: true,
        composed: true,
        detail: { value }
      })
    );
  }
}
