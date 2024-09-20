import { LightningElement, api } from 'lwc';
import fetchLookUpValues from '@salesforce/apex/UserLookupSearchController.fetchLookUpValues';

export default class UserLookupSearchLwc extends LightningElement {
    @api title;
    @api objectApiName;
    @api iconName;
	@api recordTypeId;
	@api excludeRecordIds;
	allRecords;
	error;
	searchString = '';
	availableUsersList = [];
	selectedUsers=[];
	selectedIdList=[];
    userDisplayPillFlag = false;
    userListDisplayFlag = false;

	connectedCallback() {
		this.fetchLookUpAllValues(); //to get all the Internal users from the system to be displayed on UI
	}

	fetchLookUpAllValues() {
		fetchLookUpValues({
			'searchKeyWord':this.searchString,
			'excludeIds':this.selectedUsers,
            'objectAPIName' : this.objectApiName,
			'recordTypeId' : this.recordTypeId,
			'excludeRecordIds' : this.excludeRecordIds
		})
		.then(result => {
			this.allRecords = result;
			this.error = undefined;			
		})
		.catch(error => {
			console.log(error);
			this.error = error;
			this.allRecords = undefined;
		});
	}

	/*
    * 'handleFocus' method to display all the users in the dropdown if someone just click on the lookup search box 
	*	but has not searched any keyword yet. This scenario mainly occurs when someone load the share component and for the first
	*   time went on the lookup search box and click on it. It will get all the users (currently 1000 limit) in dropdown.
	*/ 
	handleFocus(event) {
        this.searchString = '';
        this.userListDisplayFlag = true;
        this.userDisplayPillFlag = false;
		this.availableUsersList = this.allRecords.filter(item => !this.selectedIdList.includes(item.Id));
	}

    /*
    * 'userSearch' method to get invoked when someone search any keyword on the User lookup input box.
    */    
	userSearch(event){
		let searchString = event.target.value;
		if( searchString.length > 2 ) {
		this.searchString = searchString;
		this.searchUsers();
		}
	}

	searchUsers() {
		//Get list of users on the basis of search keywords on the lookup search input box.
		fetchLookUpValues({
			'searchKeyWord':this.searchString,
			'excludeIds':this.selectedUsers,
            'objectAPIName' : this.objectApiName,
			'recordTypeId' : this.recordTypeId,
			'excludeRecordIds' : this.excludeRecordIds
		})
		.then(result => {
			this.availableUsersList = result;
			this.error = undefined;
		})
		.catch(error => {
			this.error = error;
			this.availableUsersList = undefined;
		});
	}

	/*
    * 'getSelectedRows' method to select any user from the dropdown user list, and add it to the selected user list.
	*/ 
	getSelectedRows(event) {
        this.userDisplayPillFlag = true;
		let selectedRowId = event.target.id.split('-')[0];
		let selected = {};
		this.availableUsersList.forEach(item => {
			if( item.Id === selectedRowId ) {
				selected = item;
			}
		});

		let found = this.selectedUsers.find(element => element.Id === selected.Id);
		if( found === undefined ) {
			this.selectedUsers.push(selected);
		}

        this.selectedIdList = [...this.selectedIdList, selectedRowId];
		this.dispatchEvent(new CustomEvent('selected', { detail: this.selectedUsers }));
		this.searchString = '';
		this.availableUsersList = [];
        this.userListDisplayFlag = false;
	}

	/*
    * 'removeSelection' method to remove any user from the selected user list, if someone remove it from the Pills section.
    */  
	removeSelection(event) {
		let selectedRowId = event.currentTarget.id.split('-')[0];
		this.selectedUsers = this.selectedUsers.filter(element => element.Id !== selectedRowId);
		this.selectedIdList = this.selectedIdList.filter(userId => userId !== selectedRowId);
        if(this.selectedIdList.length === 0) {
            this.userDisplayPillFlag = false;
        }
        this.dispatchEvent(new CustomEvent('removed', { detail: this.selectedUsers }));
	}

	/*
    * 'userMouseLeft' method to auto close the dropdown user list after 3 sec, if someone leave or remove the mouse from the dropdown box.
	*/ 
    userMouseLeft(){
        setTimeout(() => {
            this.userListDisplayFlag = false;
			this.searchString = '';
            if(this.selectedIdList.length !== 0) {
                this.userDisplayPillFlag = true;
            }    
        }, 3000);
    }

}