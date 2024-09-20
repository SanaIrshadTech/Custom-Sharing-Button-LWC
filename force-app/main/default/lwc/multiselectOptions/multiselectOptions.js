import { LightningElement, api } from 'lwc';

export default class MultiselectOptions extends LightningElement {

    @api picklistInput;
    @api title;
    pillDisplayFlag = false;
    selectedObject = false;
    showDropdown = false;
    valuesVal = undefined;
    selectedItems = [];
    allValues = []; 
    searchTerm = '';
    itemcounts = '';

    /* 
    *   'filteredResults' method to show departments values in the dropdown list
    */
    get filteredResults() {

        if (this.valuesVal === undefined) {
            this.valuesVal = this.picklistInput;
            Object.keys(this.valuesVal).map(dept => {
                this.allValues.push({ Id: dept, Name: this.valuesVal[dept] });
            })
            this.valuesVal = this.allValues.sort(function (a, b) { return a.Id - b.Id });
            this.allValues = [];
        }

        if (this.valuesVal != null && this.valuesVal.length != 0) {
            if (this.valuesVal) {
                const selectedDeptNames = this.selectedItems.map(dept => dept.Name);
                return this.valuesVal.map(dept => {
                    const isChecked = selectedDeptNames.includes(dept.Name);
                    return {
                        ...dept,
                        isChecked
                    };
                }).filter(dept =>
                    dept.Name.toLowerCase().includes(this.searchTerm.toLowerCase())
                ).slice(0, 20);
            } else {
                return [];
            }
        }
    }

    /*
    * 'handleSearch' method to get invoked when someone search any keyword on the Department lookup input box.
    */    
    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.showDropdown = true;
        this.mouse = false;
        this.focus = false;
        this.blurred = false;
    }

    /*
    * 'handleSelection' method to manage selected department from the dropdown list, and add/remove it from the selectedItems list depending on 
    *   user has checked or unchecked the particular 'Department' value.
	*/ 
    handleSelection(event) {
        const selectedDeptId = event.target.value;
        const isChecked = event.target.checked;
            if (isChecked) {
                const selectedDept = this.valuesVal.find(dept => dept.Id === selectedDeptId);
                if (selectedDept) {
                    this.selectedItems = [...this.selectedItems, selectedDept];
                    this.allValues.push(selectedDeptId);
                }
            } else {
                this.selectedItems = this.selectedItems.filter(dept => dept.Id !== selectedDeptId);
                this.allValues.splice(this.allValues.indexOf(selectedDeptId), 1);
            }
        this.itemcounts = this.selectedItems.length > 0 ? `${this.selectedItems.length} departments selected` : 'Select Department...';
        if (this.itemcounts == '') {
            this.selectedObject = false;
        } else {
            this.selectedObject = true;
        }
        this.sendSelectedValues();
    }

	/*
    * 'clickhandler' method gets invoked when user just click on the department input lookup search box
	*/ 
    clickhandler() {
        this.showDropdown = true;
        this.pillDisplayFlag = false;
    }
 
	/*
    * 'userMouseLeft' method to auto close the dropdown department list after 3 sec, if someone leave or remove the mouse from the dropdown box.
	*/ 
    userMouseLeft(){
        setTimeout(() => {
            this.searchTerm = '';
            this.showDropdown = false;
            if(this.selectedItems && this.selectedItems.length > 0) {
                this.pillDisplayFlag = true;
            }
        }, 3000);
    }

    /*
    * 'handleRemove' method to remove any department from the alreday selected list, if someone remove it from the Pills section.
    */  
    handleRemove(event) {
        const valueRemoved = event.target.name;
        this.selectedItems = this.selectedItems.filter(dept => dept.Id !== valueRemoved);
        this.allValues.splice(this.allValues.indexOf(valueRemoved), 1);
        this.itemcounts = this.selectedItems.length > 0 ? `${this.selectedItems.length} departments selected` : '';
        if (this.itemcounts == '') {
            this.selectedObject = false;
        } else {
            this.selectedObject = true;
        }
        console.log('this.selectedItems in handle remove : '+JSON.stringify(this.selectedItems));
        if(this.selectedItems.length === 0) {
            this.pillDisplayFlag = false;
        }

        const sendSelectedValuesEvt = new CustomEvent('picklistselectionchanged', { detail: this.selectedItems });
        this.dispatchEvent(sendSelectedValuesEvt);
    }

    /*
    * 'handleclearall' method to remove all the selected department from the alreday selected list in one go.
    */  
    handleclearall(event) {
        event.preventDefault();
        this.showDropdown = false;
        this.selectedItems = [];
        this.allValues = [];
        this.itemcounts = '';
        this.searchTerm = '';
        this.selectedObject = false;
        this.pillDisplayFlag = false;
    }

    /*
    * 'handleselectall' method to select all the departments in one go.
    */  
    handleselectall(event) {
        event.preventDefault();
        this.showDropdown = false;
        if (this.valuesVal == undefined) {
            this.valuesVal = this.picklistinput;
            Object.keys(this.valuesVal).map(dept => {
                this.allValues.push({ Id: dept, Name: this.valuesVal[dept] });
            })

            this.valuesVal = this.allValues.sort(function (a, b) { return a.Id - b.Id });
            this.allValues = [];
        }
        this.selectedItems = this.valuesVal;
        this.pillDisplayFlag = true;
        this.itemcounts = this.selectedItems.length + ' departments selected';
        this.allValues = [];
        this.valuesVal.map((value) => {
            for (let property in value) {
                if (property == 'Id') {
                    this.allValues.push(`${value[property]}`);
                }
            }
        });
        this.selectedObject = true;
    }

    /*
    * 'sendSelectedValues' method to dispatch custom event with selected departments 'selectedItems' to parent LWC.
    */  
    sendSelectedValues(){
        const sendSelectedValuesEvt = new CustomEvent('departmentselectionchanged', { detail: this.selectedItems });
        this.dispatchEvent(sendSelectedValuesEvt);
    }

}