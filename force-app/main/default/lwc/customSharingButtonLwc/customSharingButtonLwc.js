import { LightningElement,api,wire } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle } from "lightning/platformResourceLoader";
import modalCustomCSS from '@salesforce/resourceUrl/modal';
import getSobjectSharedRecords from "@salesforce/apex/ShareRecordController.getSobjectSharedRecords";
import insertShareRecordMethod from '@salesforce/apex/ShareRecordController.insertShareRecordMethod';
import updateRecordMethod from '@salesforce/apex/ShareRecordController.updateRecordMethod';
import deleteRecordMethod from '@salesforce/apex/ShareRecordController.deleteRecordMethod';
import getUserPermissionSets from "@salesforce/apex/ShareRecordController.getUserPermissionSets";
import getAllInternalUserData from "@salesforce/apex/ShareRecordController.getAllInternalUserData";

//custom datatable columns
const datatableColumns = [
    {
        label: "Name",
        fieldName: 'Name',
        editable: false,
    },
    {
        label: "Type",
        fieldName: 'Type',
        editable: false,
    },
    { 
        label: "Access Level", 
        fieldName: 'AccessLevel', 
        editable: false, 
        type: 'CustomOptionsType', //custom picklist type
        typeAttributes: {
            options: [
                { label: 'Read Only', value: 'Read Only' },
                { label: 'Read/Write', value: 'Read/Write'},
            ],
            value: {fieldName: 'AccessLevel'},
            disabled: { fieldName: 'accessLevelDisabled' },
            placeholder: {fieldName: 'AccessLevel'},
            context: { fieldName: 'Id' }//shared record Id with context variable to be returned back
          }
    },
    {
        type: 'button',
        fieldName: 'closeIconDisabled',
        typeAttributes: {
            iconName: 'utility:close',
            name: 'close',
            variant: 'base',
            disabled: { fieldName: 'closeIconDisabled' },
            class: 'slds-button slds-button_icon slds-button_icon-container'
        },
        width: 10
    },
  ];

export default class CustomSharingButtonLwc extends NavigationMixin(LightningElement) {
	@api objectApiName;
    @api recordId;
    allInternalUserRec;
    getSharedDataList;
    recLength = 0;
    shareOptionSelectedValue = '';
    accessLevelValue='';
    columns = datatableColumns; 
    userOrDeptListToShare = [];
    totalSharedRecList = [];
    sobjectSharedList = [];
    searchStringForShared='';
    deletingShareRecList = [];
    updateShareRecList = [];
    excludeSharedRecFromSearch = [];
    departmentDisplay = false;
    userSearch = false;
    DisplaySharedRecord = false;
    displaySelectionHierarchy = false;
    accessLevelOptions = [
        { label: 'Read Only', value: 'Read Only' },
        { label: 'Read/Write', value: 'Read/Write'},
    ];
    shareOptions = [
        {label: 'Users', value: 'Users'},
        {label: 'Departments', value: 'Departments'},
        {label: 'Everyone', value: 'Everyone'},
    ];

    /*  Variable 'departmentsOptionsForChild' holds different departments value available in the system. 
    *   User can belong to one of the below department.
    *   (Change it as per your system requirement)
    */
    departmentsOptionsForChild = ["It Consultant","It Admin","It Support","System Admin", "Support Associate", "Support Manager"];
    
    connectedCallback() {
        loadStyle(this, modalCustomCSS);
        this.shareOptionSelectedValue = 'Users';
        this.accessLevelValue = 'Read/Write';
    }

    /*
    * Wire method to get all the shared records in the system w.r.t to current record 'recordId'.
    * method 'getSobjectSharedRecords' will dynamically get the records.
    */
    @wire(getSobjectSharedRecords, { recId: "$recordId" })
    wireGetSharedRecord({ error, data }) {
        if(error){
            this.userSearch = true;
            this.showToast('','Error in retrieving the shared records','error');
            console.error(JSON.stringify(error));
        } else if(data){
            this.getSharedDataList = data;
            this.getSharedDataList.forEach(item=>{
                this.excludeSharedRecFromSearch.push(item.UserOrGroupId);
            });
            this.userSearch = true;
            this.recLength = this.getSharedDataList.length;
           }
    }  

    @wire(getAllInternalUserData, { developerName: "AllInternalUsers" })
    wireGetAllInternalUserRecord({ data }) {
         if(data){
            this.allInternalUserRec = data;
           }
    }  

    /*
    * 'selectShareOptions' method will get invoked when user select the respective share options on the UI.
    *  Currently, providing the sharing options to share the record to Multiple Users/Departments/Everyone(all Internal users) in the system.
    */
    selectShareOptions(event) {
        this.userSearch = false;
        this.departmentDisplay = false;
        this.userOrDeptListToShare = [];
        this.accessLevelValue = '';
        this.shareOptionSelectedValue = event.detail.value;
        if(this.shareOptionSelectedValue === 'Users') {
            this.userSearch = true;
            this.accessLevelValue = 'Read/Write';
        } else if(this.shareOptionSelectedValue === 'Departments') {
            this.departmentDisplay = true;
           this.accessLevelValue = 'Read/Write';
        } else if(this.shareOptionSelectedValue === 'Everyone') {
            this.accessLevelValue = 'Read Only';
        }
    }

    selectAccessLevelOptions(event) {
        this.accessLevelValue = event.detail.value;
        console.log('selectAccessLevelOptions  : '+this.accessLevelValue);
    }

    /*
    * 'handleUserSelected' method to maintain all the selected users list to insert the shared records for them.
    */
    handleUserSelected(event) {
        this.userOrDeptListToShare = [];
        var selectedData = event.detail;
        selectedData.forEach(item =>{            
            this.userOrDeptListToShare.push(item.Id);
        }); 
    }

    /*
    * 'selectDepartmentsOptionsFromChild' method to maintain all the selected department list to 
    *  insert the shared records related to all the users belongs to those departments.
    */
    selectDepartmentsOptionsFromChild(event){
        this.userOrDeptListToShare = [];
        const selectedValues = event.detail;
        selectedValues.forEach(element => {
                this.userOrDeptListToShare.push(element.Name);
        });
    }

    /*
    * 'handleShareRecordMethod' method to handle Insertion/deletion/Modification of the share records w.r.t to current record 'recordId'.
    */
    handleShareRecordMethod() {

        //Below if is for inserting the shared Records
        if (this.userOrDeptListToShare.length !== 0 || this.shareOptionSelectedValue === 'Everyone') {
            this.insertShareRecordMethod();
        }

        //Below if is for deleting the selected shared Records
        if(this.deletingShareRecList.length > 0) {
            this.deleteShareRecordMethod();
        }

        //Below if is for updating the shared Records
        if (this.updateShareRecList.length > 0) {
            let finalUpdateShareList = [];
            this.updateShareRecList.forEach(updateShareRecItem => {
                this.totalSharedRecList.forEach(totalShareRecItem => {
                    if(updateShareRecItem.recId === totalShareRecItem.Id && updateShareRecItem.accessLevel !== totalShareRecItem.AccessLevel) {
                        finalUpdateShareList.push(updateShareRecItem);
                    }
                });
            });
            this.updateShareRecList = finalUpdateShareList;
            if(finalUpdateShareList.length > 0 ) {
                this.updateShareRecordMethod();
            }
        }

        setTimeout(() => {
            this.closePopup();
        }, 4000);
        
    }

    insertShareRecordMethod() {
        insertShareRecordMethod({ recordId: this.recordId, userOrDeptList: this.userOrDeptListToShare, shareOptionValue: this.shareOptionSelectedValue, accessLevel: this.accessLevelValue, allInternalUserId: this.allInternalUserRec.Id})
        .then(result => {
            if(result) {
                this.showToast('', result, 'success');            
            } else {
                this.showToast('', 'Error inserting the share records', 'error');
            }
        })
        .catch(error => {
            this.showToast('', 'Error inserting the share records : '+error, 'error');
        });

    }

    deleteShareRecordMethod() {
        deleteRecordMethod({ recordId: this.recordId, shareRecDeletionIds: this.deletingShareRecList})
        .then(result => {
            if(result !== null) {
                this.showToast('', result, 'success');            
            } else {
                this.showToast('', 'Error deleting the shared records', 'error');
            }
        })
        .catch(error => {
            this.showToast('', 'Error deleting the shared records : '+error, 'error');
        });
    }

    updateShareRecordMethod() {
        updateRecordMethod({ recordId: this.recordId, shareRecUpdateList: JSON.stringify(this.updateShareRecList)})
        .then(result => {
            if(result !== null) {
                this.showToast('', result, 'success');            
            } else {
                this.showToast('', 'Error updating the shared records','error');
            }
        })
        .catch(error => {
            this.showToast('', 'Error updating the shared records : '+error, 'error');
        });
    }  

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    closePopup() {
        const closeAction = new CloseActionScreenEvent();
        this.dispatchEvent(closeAction);
    }

    /*
    * 'handleEditButtonMethod' method to let user modify the already shared records which are displayed in table.
    */
    handleEditButtonMethod(event) {
        if(this.getSharedDataList.length > 0) {
            let options = [];
            this.getSharedDataList.forEach(item => {
                let shareRec = {};
                shareRec.Id = item.Id;
                shareRec.ParentId = item.ParentId;
                shareRec.UserOrGroupId = item.UserOrGroupId;
                shareRec.Name = (item.UserOrGroupId ===  this.allInternalUserRec.Id) ? 'All Internal Users' : item.UserOrGroup.Name;   
                shareRec.Type = item.UserOrGroup.Type; 
                shareRec.AccessLevel = (item.AccessLevel === 'Read') ? 'Read Only' : (item.AccessLevel === 'Edit') ? 'Read/Write' : 'All';
                shareRec.closeIconDisabled = (shareRec.AccessLevel === 'All') ? true : false;
                shareRec.accessLevelDisabled = (shareRec.AccessLevel === 'All') ? true : false;
                options.push(shareRec);
            });

            this.totalSharedRecList  = options;
            this.sobjectSharedList = options;
            this.recLength = this.totalSharedRecList.length;        
            this.DisplaySharedRecord = true;
        } else {
            this.DisplaySharedRecord = false;
        }
        this.recLength = this.totalSharedRecList.length;

        // method to check if user is eligible to see the Sharing hierarchy or not.
        getUserPermissionSets()
        .then(result => {
            this.displaySelectionHierarchy = result;
        });
    }

    /*
    * 'handleSelectionHierarchyMethod' method to redirect user who has permission to the recordShareHierarchy standrad salesforce page.
    */
    handleSelectionHierarchyMethod(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: this.objectApiName,
                actionName: 'recordShareHierarchy'
            }
        });
    }

    /*
    * 'searchSharedRecordMethod' method to allow the user to search for particular record in the list of shared records
    *   displayed in the Table at the bottom on UI.
    */
    searchSharedRecordMethod(event) {
        const searchString = event.target.value;
        this.searchStringForShared = searchString.toLowerCase();
        let options = [];
        this.totalSharedRecList.forEach(item=>{
            const name = item.Name;
            if(name !== undefined && name !== null && name.toLowerCase().includes(this.searchStringForShared)) {
                options.push(item);
            }
        });
        this.sobjectSharedList = options;
        this.searchStringForShared = '';
    }

    /*
    * 'handleRowAction' method to allow the user to remove the already shared 
    *  record by clicking 'X' symbol available against any record in the Table.
    */    
    handleRowAction(event) {
        const row = event.detail.row;
        this.totalSharedRecList = this.totalSharedRecList.filter(item => item.Id !== row.Id);
        this.sobjectSharedList = this.sobjectSharedList.filter(item => item.Id !== row.Id);
        if(this.updateShareRecList.length > 0) {
            this.updateShareRecList = this.updateShareRecList.filter(item => item.recId !== row.Id);
        }
        this.recLength = this.totalSharedRecList.length;
        this.deletingShareRecList = [...this.deletingShareRecList, row.Id];    
    }

    /*
    * 'picklistChanged' method to allow the user to change the existing Access level of 
    *  the already shared record in the Table.
    */   
    picklistChanged(event) {
        let shareRecId = event.detail.data.context;
        let shareRecAccessLevel = event.detail.data.value;
        if(this.updateShareRecList !== undefined && this.updateShareRecList.length !== 0) {
            let copyUpdateShareData = [... this.updateShareRecList];
            let existingIdFlag = false;
            copyUpdateShareData.forEach(item => {
                if (item.recId === shareRecId) {
                    item['accessLevel'] = shareRecAccessLevel;
                    existingIdFlag = true;
                }
            });

            if(existingIdFlag) {
                this.updateShareRecList = [...copyUpdateShareData];
            } else {
                let options = {};
                options.recId = shareRecId;
                options.accessLevel = shareRecAccessLevel;
                this.updateShareRecList.push(options);
            }
        } else {
            let options = {};
            options.recId = shareRecId;
            options.accessLevel = shareRecAccessLevel;
            this.updateShareRecList.push(options);
        }
    }
}