/**************************************************************************************************************
Name    :   UserLookupSearchController
Purpose :   This class will fetch and return the users list from the system, to be displayed on the
 			UI in the user lookup search dropdown list.
===============================================================================================================
History
-------                                                            
VERSION     AUTHOR                  DATE                DETAIL                  
1.0         Sfdcchampsa           04/15/2024          INITIAL DEVELOPMENT     
*****************************************************************************************************************/
public with sharing class UserLookupSearchController {
    
    public class UserResultWrapper {
        @AuraEnabled
        public String Id {get; set;}
        @AuraEnabled
        public String Name {get; set;}
        public UserResultWrapper(String id, String name) {
            this.Id = id;
            this.Name = name;
        }
    }
    
    /*****************************************************************************************************************************
    * Method Name   :   fetchLookUpValues
    * Purpose       :   Fetch the users from the system after excluding all the 
    *                   1- User Ids with which current record Id is already shared (excludeRecordIds). 
	*					2- User Ids which is already selected from dropdown on the UI (excludeIds) to share the current record with.
 	*					return the resultant User List to be displayed on UI dropdown on LWC.
    *******************************************************************************************************************************/
    @AuraEnabled(cacheable=true)
    public static List<UserResultWrapper> fetchLookUpValues(String searchKeyWord, List<sObject> excludeIds, String objectAPIName, String recordTypeId, List<String> excludeRecordIds) {
        Set<String> excludeitems = new Set<String>();
        for(sObject item : excludeIds) {
            excludeitems.add(item.Id);
        }
        if(!excludeRecordIds.isEmpty()) {
            excludeitems.addAll(excludeRecordIds);
        }
        
        String query = 'Select Id, Name From User';
        if(String.isNotBlank(searchKeyWord)) {
            query += ' where Name LIKE \'%'+searchKeyWord+'%\'';
            if (!excludeitems.isEmpty()) {
                query += ' and Id not in :excludeitems';
            }
        } else if(!excludeitems.isEmpty()) {
            query += ' where Id not in :excludeitems';
        }
        query += ' order by Name limit 1000';
        List<User> userList = Database.query(query);
        List<UserResultWrapper> userResultWrapperList = new List<UserResultWrapper>();
        for (User userObj : userList) {
            userResultWrapperList.add(new UserResultWrapper(userObj.Id, userObj.Name));
        }
        return userResultWrapperList;
    }
}