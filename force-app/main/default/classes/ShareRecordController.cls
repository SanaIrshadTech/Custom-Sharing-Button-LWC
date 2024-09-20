/**************************************************************************************************************
Name    :   ShareRecordController
Purpose :   This class will insert/update/delete the share record w.r.t to current record Id for which 
			"Custom Share Component" LWC is loaded
===============================================================================================================
History
-------                                                            
VERSION     AUTHOR                  DATE                DETAIL                  
1.0         Sfdcchampsa           04/15/2024          INITIAL DEVELOPMENT     
*****************************************************************************************************************/
public with sharing class ShareRecordController {
    
    /*************************************************************************************************************************************
    * Method Name   :   getShareObjectName
    * Purpose       :   method to dynamically find the share object related to any custom object. 
	*					[Current design doesnot support sharing Standard objects records, as each standard object's related Share Object 
	*					will have specific fields Api name. (eg: for for the AccountShare object, the AccessLevel field 
	*					will be named 'AccountAccessLevel,' and this pattern is similar for other standard objects).
    *                   However, the method can be leveraged for standard objects in future.
    **************************************************************************************************************************************/
    public static string getShareObjectName(String recordId) {
        String sObjName = Id.valueOf(recordId).getSObjectType().getDescribe().getName();
        if(sObjName.right(3)=='__c') {
            sObjName = sObjName.replace('__c','__share');
        } 
        return sObjName;
    }
    
    @AuraEnabled(Cacheable=True)
    public static Group getAllInternalUserData(String developerName) {
        List<Group> internalUsersPublicGroup = new List<Group>();
        internalUsersPublicGroup = [Select Id,Name,DeveloperName,Type from Group where DeveloperName=:developerName Limit 1];
        return internalUsersPublicGroup[0];
    }
    
    /*****************************************************************************************************************************
    * Method Name   :   insertShareRecordMethod
    * Purpose       :   method to insert share records in the system
	*******************************************************************************************************************************/
    @AuraEnabled
    public static string insertShareRecordMethod(String recordId, List<String> userOrDeptList, String shareOptionValue, String accessLevel, String allInternalUserId) {
        
        try {
            
            String sobjectName = getShareObjectName(recordId);
            String accessLevelValue = (accessLevel=='Read Only')?'Read':'Edit';
            List<Sobject> shareRecList = new List<Sobject>();
            if(sobjectName != Null) {
                if(shareOptionValue == 'Users') {
                    for(String userId :userOrDeptList) {
                        SObject SObjectRec = Schema.getGlobalDescribe().get(sobjectName).newSObject();
                        SObjectRec.put('ParentId',recordId);
                        SObjectRec.put('UserOrGroupId',Id.valueOf(userId));
                        SObjectRec.put('AccessLevel',accessLevelValue);
                        shareRecList.add(SObjectRec);
                    }
                } else if(shareOptionValue == 'Departments') {
                    Map<Id,User> userList = new Map<Id,User>([Select Id, Name,Department From User Where Department In :userOrDeptList limit 50000]);
                    for(Id userId :userList.keyset()) {
                        SObject SObjectRec = Schema.getGlobalDescribe().get(sobjectName).newSObject();
                        SObjectRec.put('ParentId',recordId);
                        SObjectRec.put('UserOrGroupId',userId);
                        SObjectRec.put('AccessLevel',accessLevelValue);
                        shareRecList.add(SObjectRec);
                    }
                } else if(shareOptionValue == 'Everyone') {
                    if(String.isNotEmpty(allInternalUserId)) {
                        SObject SObjectRec = Schema.getGlobalDescribe().get(sobjectName).newSObject();
                        SObjectRec.put('ParentId',recordId);
                        SObjectRec.put('UserOrGroupId',Id.ValueOf(allInternalUserId));
                        SObjectRec.put('AccessLevel',accessLevelValue);
                        shareRecList.add(SObjectRec);
                   }
                }
                
                if(!shareRecList.isEmpty()) {
                    insert shareRecList;
                    return shareRecList.size()+' record shares were created.';
                }
                return null;
            } 
            return null;
        } catch (Exception excep) {
            throw new AuraHandledException('Error sharing record: ' + excep);
        }
    }
    
    /*****************************************************************************************************************************
    * Method Name   :   getSobjectSharedRecords
    * Purpose       :   method to get and return all the shared record w.r.t current recId
	*******************************************************************************************************************************/
    @AuraEnabled(cacheable=true)
    public static List<Sobject> getSobjectSharedRecords(String recId) {
        String sobjectName = getShareObjectName(recId);
        String query = 'Select Id, ParentId, UserOrGroupId,UserOrGroup.Name, UserOrGroup.Type, AccessLevel from '+sobjectName+' where ParentId = :recId';
        List<Sobject> sharedRecList = Database.query(query);
        return sharedRecList;
    }

   /*****************************************************************************************************************************
    * Method Name   :   deleteRecordMethod
    * Purpose       :   method to delete already shared records in the system
	*******************************************************************************************************************************/    
    @AuraEnabled
    public static String deleteRecordMethod(String recordId, List<String> shareRecDeletionIds) {
        try {
            String sobjectName = getShareObjectName(recordId);
            List<Sobject> shareRecDeleteList = new List<Sobject>();
            for(String recDeletionId : shareRecDeletionIds) {
                SObject SObjectRec = Schema.getGlobalDescribe().get(sobjectName).newSObject();
                SObjectRec.Id = Id.valueOf(recDeletionId);
                shareRecDeleteList.add(SObjectRec);
            }
            if(!shareRecDeleteList.isEmpty()) {
                delete shareRecDeleteList;
                return shareRecDeleteList.size()+' record shares were deleted.';
            }
            return null;
        } catch (Exception excep) {
            throw new AuraHandledException('Error deleting record: ' + excep);
        }
    }
    
   /*****************************************************************************************************************************
    * Method Name   :   getUserPermissionSets
    * Purpose       :   method to check if Current user which invoked share component are allowed to access standard 
    *                   'Sharing Hierarchy' (available on the component as a hyperlink) or not.
	*					Here, we have dummy permission set to check if that is assigned to the current user then they can
	*  					get the Sharing Hierarchy hyperlink else user wont get that option on the UI. Please change it as per whatever
	* 					PS you want in your system to decide this access. 
	*******************************************************************************************************************************/    
   @AuraEnabled(cacheable=true)
    public static boolean getUserPermissionSets() {
        for (PermissionSetAssignment assignment : [SELECT PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = :UserInfo.getUserId()]) {
            if(assignment.PermissionSet.Name == 'PickList_Check_Developer') {
                return true;
            }
        }
        return false;
    }
 
    /*****************************************************************************************************************************
    * Method Name   :   updateRecordMethod
    * Purpose       :   method to update already shared records in the system
	*******************************************************************************************************************************/    
    @AuraEnabled
    public static String updateRecordMethod(String recordId, String shareRecUpdateList) {
        
        try {
            String sobjectName = getShareObjectName(recordId);
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sobjectName);
            List<Sobject> shareRecUpdateFinalList = new List<Sobject>();
            List<UpdateShareRecWrapper> shareRecordUpdateList = (List<UpdateShareRecWrapper>)JSON.deserialize(shareRecUpdateList,List<UpdateShareRecWrapper>.Class);
         
            for(UpdateShareRecWrapper wrapperObj : shareRecordUpdateList) {
                SObject sobj = sObjectType.newSObject(); 
                sobj.put('Id',Id.valueOf(wrapperObj.recId));
                sobj.put('AccessLevel',(wrapperObj.accessLevel == 'Read Only')?'Read':'Edit');
                shareRecUpdateFinalList.add(sobj);
            }
            if(!shareRecUpdateFinalList.isEmpty()) {
                update shareRecUpdateFinalList;
                return shareRecUpdateFinalList.size()+' record shares were updated.';
            }
            return null;
        } catch (Exception excep) {
            throw new AuraHandledException('Error deleting record: ' + excep);
        }
    }
    
    /*****************************************************************************************************************************
    * Method Name   :   UpdateShareRecWrapper
    * Purpose       :   wrapper to split the shared record data into the record ID and the access level with which it has been shared.
	*******************************************************************************************************************************/    
    public Class UpdateShareRecWrapper{
        @AuraEnabled Public String recId;
        @AuraEnabled Public String accessLevel;
    }
}