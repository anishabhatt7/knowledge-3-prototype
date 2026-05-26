import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
  @track selectedFlow = 'pm';
  @track prototypeDropdownOpen = false;

  _docClickHandler = null;

  get prototypeOptions() {
    return [
      { label: 'V1 - Knowledge 3.0', value: 'v1' },
      { label: 'V2 - Knowledge 3.0', value: 'v2' },
      { label: "PM's version - AI Ready Knowledge", value: 'pm' },
    ].map((opt) => ({
      ...opt,
      isSelected: opt.value === this.selectedFlow,
      optionClass: `ps-option${opt.value === this.selectedFlow ? ' ps-option--selected' : ''}`,
    }));
  }

  get selectedFlowLabel() {
    const match = this.prototypeOptions.find((o) => o.value === this.selectedFlow);
    return match ? match.label : "PM's version - AI Ready Knowledge";
  }

  handleTogglePrototypeDropdown(event) {
    event.stopPropagation();
    this.prototypeDropdownOpen = !this.prototypeDropdownOpen;
  }

  handleFlowSelect(event) {
    event.stopPropagation();
    const newValue = event.currentTarget.dataset.value;
    this.prototypeDropdownOpen = false;
    if (newValue === this.selectedFlow) return;
    const isLocal =
      typeof window !== 'undefined' &&
      /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    const urls = isLocal
      ? {
          v1: 'http://localhost:5001/',
          v2: 'http://localhost:8001/',
          pm: 'http://localhost:8002/',
        }
      : {
          v1: 'https://git.soma.salesforce.com/pages/anisha-bhatt/knowledge-3-prototype/v1/',
          v2: 'https://git.soma.salesforce.com/pages/anisha-bhatt/knowledge-3-prototype/v2/',
          pm: 'https://git.soma.salesforce.com/pages/anisha-bhatt/knowledge-3-prototype/pm/',
        };
    if (urls[newValue]) {
      window.location.href = urls[newValue];
    }
  }

  connectedCallback() {
    // Outside-click closes the dropdown. Clicks inside the switcher call
    // stopPropagation, so this handler only fires on true outside clicks.
    this._docClickHandler = () => {
      if (this.prototypeDropdownOpen) {
        this.prototypeDropdownOpen = false;
      }
    };
    document.addEventListener('click', this._docClickHandler);
  }

  disconnectedCallback() {
    if (this._docClickHandler) {
      document.removeEventListener('click', this._docClickHandler);
      this._docClickHandler = null;
    }
  }
}
