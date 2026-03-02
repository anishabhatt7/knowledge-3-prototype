import { LightningElement, track } from 'lwc';

const ROUTES = {
    '/icons': 'iconTest',
};

function pageFromPath(pathname) {
    return ROUTES[pathname] ?? 'main';
}

export default class App extends LightningElement {
    @track currentPage = pageFromPath(window.location.pathname);

    connectedCallback() {
        this._onPopState = (event) => {
            this.currentPage = event.state?.page ?? pageFromPath(window.location.pathname);
        };
        window.addEventListener('popstate', this._onPopState);
    }

    disconnectedCallback() {
        window.removeEventListener('popstate', this._onPopState);
    }

    get showIconTest() {
        return this.currentPage === 'iconTest';
    }

    handleNavigateToIconTest() {
        history.pushState({ page: 'iconTest' }, '', '/icons');
        this.currentPage = 'iconTest';
    }

    handleNavigateBack() {
        history.back();
    }

    @track inputValue = '';
    @track checkboxGroupValues = []; // Array for checkbox group
    @track selectedRadioValue = 'option1';
    @track selectedComboboxValue = 'option1';
    @track sliderValue = 50;
    @track textAreaValue = '';
    @track dateValue = '';
    @track toggleValue = false;

    // Combobox options
    get comboboxOptions() {
        return [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
            { label: 'Option 3', value: 'option3' },
        ];
    }

    // Radio group options
    get radioOptions() {
        return [
            { label: 'Radio Option 1', value: 'option1' },
            { label: 'Radio Option 2', value: 'option2' },
            { label: 'Radio Option 3', value: 'option3' },
        ];
    }

    // Checkbox group options
    get checkboxOptions() {
        return [
            { label: 'Checkbox Option 1', value: 'checkbox1' },
            { label: 'Checkbox Option 2', value: 'checkbox2' },
            { label: 'Checkbox Option 3', value: 'checkbox3' },
        ];
    }

    handleInputChange(event) {
        this.inputValue = event.detail.value;
    }

    handleCheckboxChange(event) {
        this.checkboxGroupValues = event.detail.value;
    }

    handleRadioChange(event) {
        this.selectedRadioValue = event.detail.value;
    }

    handleComboboxChange(event) {
        this.selectedComboboxValue = event.detail.value;
    }

    handleSliderChange(event) {
        this.sliderValue = event.detail.value;
    }

    handleTextAreaChange(event) {
        this.textAreaValue = event.detail.value;
    }

    handleDateChange(event) {
        this.dateValue = event.detail.value;
    }

    handleToggleChange(event) {
        this.toggleValue = event.detail.checked;
    }

    handleButtonClick() {
        // Show alert when button is clicked
        alert('Button clicked! Check the console for form values.');
        console.log('Form Values:', {
            input: this.inputValue,
            checkboxGroup: this.checkboxGroupValues,
            radio: this.selectedRadioValue,
            combobox: this.selectedComboboxValue,
            slider: this.sliderValue,
            textArea: this.textAreaValue,
            date: this.dateValue,
            toggle: this.toggleValue
        });
    }

    handleSuccessButton() {
        alert('Success button clicked!');
    }

    handleNeutralButton() {
        alert('Neutral button clicked!');
    }

    handleBrandButton() {
        alert('Brand button clicked!');
    }
}