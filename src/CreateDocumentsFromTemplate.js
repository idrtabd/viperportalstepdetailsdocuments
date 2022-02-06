import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import './App.css';
import React, { useState, useEffect, useContext } from "react";
import List, { ItemDragging } from 'devextreme-react/list';
import { Button } from 'devextreme-react/button';

import {
    REACT_APP_RESTURL_SPWEBURL,
    loadSpRestCall,
    UpdateSPListItemGeneric,
    UpSertSPListItemGeneric,
    RemoveSPListItemGeneric,
    CreateSPListItemGeneric,
    GetCurrentUser,
    JoinSPData,
    hostUrl,
    CopySPFile,
    DeleteSPFile,
    GetUsersGroups,
    ETPS_Editor_GroupId,
    ETPS_Tps_Status_Accepted,
    ETPS_Tps_Status_Closed,
} from "./MyUtils"
import dxButton from 'devextreme/ui/button';

// import { Button } from 'devextreme-react/button';
// import notify from "devextreme/ui/notify";

export default function CreateDocumentsFromTemplate({ tpsid }) {

    const [TemplateFolderData, SetTemplateFolderData] = useState();
    const [TpsDocumentNumber, SetTpsDocumentNumber] = useState();
    const [TemplateDocs, SetTemplateDocs] = useState([]);
    const [ExecutionsData, SetExecutionsData] = useState([]);
    const [SelectedTPSSteps, SetSelectedTPSSteps] = useState([]);

    useEffect(() => {

        LoadPageData();
    }, [tpsid]);

    const LoadPageData = async () => {

        const queryTemplateFolder = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27TPSDocumentTemplates%27)/items?`
            + `%24expand=Folder&%24select=Folder%2FName,Folder%2FItemCount,DocAllocData,Id,TPSReference0Id&%24filter=TPSReference0Id eq ${tpsid} and startswith(ContentTypeId, '0x0120')`
        const templateFolderResult = await loadSpRestCall(queryTemplateFolder, true);
        SetTemplateFolderData(templateFolderResult);

        const folderName_tpsDocumentNumber = templateFolderResult && templateFolderResult.Folder && templateFolderResult.Folder.Name;
        SetTpsDocumentNumber(folderName_tpsDocumentNumber)

        // const queryTemplateDocs = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27TPSDocumentTemplates%27)/items?%24filter=TPSReference0Id eq ${tpsid} and startswith(ContentTypeId, '0x0101')&%24expand=File&%24select=File,*`
        // const resultTemplateDocs = await loadSpRestCall(queryTemplateDocs)
        // SetTemplateDocs(resultTemplateDocs)

        //DocAllocData
        const queryAllTemplateDocuments =
            `${REACT_APP_RESTURL_SPWEBURL}/_api/web/GetFolderByServerRelativeUrl(%27/projects/Viper/ETPS/TPSDocumentTemplates/${folderName_tpsDocumentNumber}%27)/Files?`
            + `%24expand=ListItemAllFields&%24select=ListItemAllFields%2FId,ListItemAllFields%2FAuthorId,ListItemAllFields%2FEditorId,Name,Title,UIVersionLabel`
        const resultsAllTemplateDocuments = await loadSpRestCall(queryAllTemplateDocuments)
        SetTemplateDocs(resultsAllTemplateDocuments)


        const queryAllExecutions = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPS Executions')/Items?%24select=Id, Title&%24filter=TPSLookupId eq ${tpsid}`
        const resultExecutions = await loadSpRestCall(queryAllExecutions);
        SetExecutionsData(resultExecutions);


    }

    const CreateDocumentsClicked = () => {

    }

    return (
        <>
            <h4>{TpsDocumentNumber} Create Documents From Template</h4>
            <div className="Panel Alternate">
                <Button text="Create Documents"
                    type="default"
                    stylingMode="contained"
                    onClick={CreateDocumentsClicked}
                />
            </div>
            <div>{ TemplateFolderData && TemplateFolderData.DocAllocData && JSON.stringify(TemplateFolderData.DocAllocData)}</div>
        </>
    )
}