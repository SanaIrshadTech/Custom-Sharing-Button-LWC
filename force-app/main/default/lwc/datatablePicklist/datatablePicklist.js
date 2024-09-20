import { LightningElement, api } from 'lwc';

export default class DatatablePicklist extends LightningElement {
    @api label;
    @api options;
    @api value;
    @api context;
    @api disabled;
    @api placeholder;


    handleChange(event) {
        //show the selected value on UI
        this.value = event.detail.value;

        /* Dispatch custom event to Parent LWC when any already shared records Access Level picklist value changed
        *  and send context (i.e. shared recordId here) and selected value (i.e. Access Level updated value here).
        */
        this.dispatchEvent(new CustomEvent('accesslevelpicklistchanged', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {
                data: { context: this.context, value: this.value }
            }
        }));
    }

}