import LightningDatatable from "lightning/datatable";
import customOptionsTemplate from './optionsTypeForDatatable.html' //custom template designed in HTML for custom datatable
export default class CustomTypesForDatatable extends LightningDatatable {
    
    static customTypes = {
        CustomOptionsType: {
          template: customOptionsTemplate,
          standardCellLayout: true,
          typeAttributes: ['label','value','options','context','disabled','placeholder'],
        }
    };


}