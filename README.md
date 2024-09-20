# Custom-Sharing-Button-LWC

**Background on Custom Business Requirements for Sharing:**

I had specific business needs, where the feature was needed to support sharing custom object records based on:

  👤 Users: Select multiple users to share the record with.

  🏢 Departments: Enable selection of multiple departments to share the record with all users belonging to those departments (e.g., IT Support, IT Admin).

  🌐 Everyone: Share the record with the group ‘AllInternalUsers’ in the system.

**Note**: The standard sharing interface provides additional options, such as Public Groups, Roles, and Roles and Subordinates, which were not required by the client.

📝 **Overview**

The “customSharingButtonLwc” Lightning Web Component (LWC) provides a custom interface for sharing Salesforce records with users, departments, or all internal users. It allows users to select sharing options, set access levels, and manage shared records efficiently. All the components involved in this feature are dynamic, so you can simply clone the project and use it in your system for any custom Salesforce object. We can easily derive the Share object API name related to any custom object by dynamically first finding their Object API name based on the incoming @recordId in the LWC JavaScript file and appending ‘__share’ at the end in place of ‘__c’. 

However, the current feature does not support sharing standard object records, as each standard object's related Share Object will have specific field API names. (For example, for the AccountShare object, the AccessLevel field will be named 'AccountAccessLevel,' and this pattern is similar for other standard objects). However, the method can be leveraged for standard objects in the future by dynamically finding their respective field Api name using Sobject class methods.

**Features**

•	**Sharing Options:** Users can choose to share records with:
1.	Users: Select multiple users.
2.	Departments: Select multiple departments, sharing with users in those departments.
3.	Everyone: Share with all internal users.
   
•	**Access Levels:** Select access levels for shared records, such as:

🔓Read Only

📝 Read/Write

•	**Shared Records Management:**
1.	View, filter, and edit shared records in a custom datatable 
2.	Update or delete existing shared records.
3.	Display sharing hierarchy based on user permissions.
   
**Parent Component Structure**

•	HTML File: Defines the layout and structure of the component, including sharing options, user search, department search, and shared records display.

•	JavaScript File: Handles the logic for sharing options, user/department selection/Everyone, record management, and toast notifications. It uses Apex methods to interact with the Salesforce backend for operations like inserting, updating, and deleting shared records.

**Features by Various Child LWC Components**

🔍**User Lookup**

Component: userLookupSearchLwc

Provides user lookup functionality with dynamic search capabilities and a selection interface, allowing users to search for and select internal users from a dropdown, display selected users in pill format, and manage these selections.

Features

•	Search Bar: Contains a lightning-input element for entering search keywords, triggering the userSearch method for keyword-based search and handleFocus for displaying all users.

•	Pills for Selected Users: Displays selected user records as pills, with labels and icons, and the ability to remove the user from the selection.

•	Search Results Dropdown: Shows the search results as a list of users, appearing when users click on the search box or enter a keyword, and auto-closes if the mouse leaves the dropdown area.

🏢 **Department Lookup**

Component: multiselectOptions

Designed for selecting multiple departments from a dropdown list with search and filtering capabilities, supporting checking/unchecking individual options and providing controls to select or deselect all options at once.

Features

•	Search Box: A lightning-input field for searching departments by name, triggering the handleSearch method and displaying the search results.

•	Dropdown List: Shows filtered departments based on the search term, with checkboxes to select or deselect items. The list auto-closes if the mouse leaves the dropdown area.

•	Select/Deselect All: Provides "Check All" and "Uncheck All" options to quickly select or clear all departments in the dropdown.

•	Pills for Selected Items: Displays selected departments as pills with a remove option, controlled by pillDisplayFlag.

📊**Shared Records Management**

LWC Components “customTypesForDatatable” and “datatablePicklist” work together to enhance Salesforce datatables by integrating a custom picklist cell type and managing picklist selections in a user-friendly manner.

•	customTypesForDatatable

Extends the lightning/datatable component to introduce a custom cell type for displaying picklist options. It integrates the c-datatable-picklist component to render picklist cells, such as Access Level, using attributes passed from typeAttributes. The component imports LightningDatatable and a custom HTML template, customOptionsTemplate. The new cell type, CustomOptionsType, utilizes this template and supports attributes like label, value, options, context, disabled, and placeholder, with standard cell layout settings.

•	datatablePicklist

Provides a custom picklist component used within datatable cells to facilitate user selection from a dropdown list. It leverages lightning-combobox to display the picklist, allowing configuration of attributes such as name, value, options, and placeholder text. The component supports a disabled state and dropdown alignment. The handleChange method updates the component's value with the selected option and dispatches a custom accesslevelpicklistchanged event, including the context and updated value, enabling parent components to respond to changes.

**Usage**

To use this component, add it to a Lightning Page or a Record Page as a Quick Action.

**Installation**

To use Custom Sharing Button complete features, follow these steps:

•	🛠️ Clone the Repository: [git clone https://github.com/ SanaIrshadTech/Custom-Sharing-Button-LWC](https://github.com/SanaIrshadTech/Custom-Sharing-Button-LWC)

•	🚀 Deploy to Salesforce: Deploy the complete components available on the above Git repo to your Salesforce organization using your preferred method (e.g., Salesforce CLI, ANT, or directly in Salesforce Developer Console).

**Contributing**

Contributions are welcome! Please follow these guidelines:

•	🍴 Fork the repository.

•	🌿 Create a new branch (git checkout -b feature-branch).

•	📝 Commit your changes (git commit -am 'Add new feature').

•	⬆️ Push to the branch (git push origin feature-branch).

•	🔄 Open a Pull Request.

**License**: This project is licensed under the MIT License - see the LICENSE file for details.

**Contact**: For any questions or support, please contact sfdcchampsa@gmail.com.


