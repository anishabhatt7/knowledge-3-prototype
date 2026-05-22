import { LightningElement, api } from 'lwc';

export default class ViolationList extends LightningElement {
  @api violations = [];

  get hasViolations() {
    return this.violations && this.violations.length > 0;
  }

  get enrichedViolations() {
    return (this.violations || []).map((v, idx) => ({
      ...v,
      key: `${v.type}-${idx}`,
      iconName: v.severity === 'error' ? 'utility:error' : 'utility:warning',
      variant: v.severity === 'error' ? 'error' : 'warning'
    }));
  }
}
