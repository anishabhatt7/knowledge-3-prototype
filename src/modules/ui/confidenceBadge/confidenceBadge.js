import { LightningElement, api } from 'lwc';

export default class ConfidenceBadge extends LightningElement {
  @api confidence;
  @api size = 'small';

  get displayConfidence() {
    return Math.round((this.confidence || 0) * 100);
  }

  get badgeClass() {
    const percent = this.displayConfidence;
    let colorClass = 'confidence-low';

    if (percent >= 85) {
      colorClass = 'confidence-high';
    } else if (percent >= 60) {
      colorClass = 'confidence-medium';
    }

    return `confidence-badge ${colorClass} size-${this.size}`;
  }
}
