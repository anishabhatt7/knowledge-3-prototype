import { LightningElement, api } from 'lwc';

export default class ScoreCard extends LightningElement {
  @api title;
  @api value;
  @api subtitle;
  @api status = 'neutral';
  @api iconName;

  get cardClass() {
    return `score-card-content status-${this.status}`;
  }

  get iconVariant() {
    const variantMap = {
      success: 'success',
      warning: 'warning',
      error: 'error',
      neutral: 'default'
    };
    return variantMap[this.status] || 'default';
  }
}
