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
import notify from 'devextreme/ui/notify';
import { Template } from 'devextreme-react';
import { DOC_ALLOC_STEP, DOC_ALLOC_TPS } from './ConstantStrings';

// import { Button } from 'devextreme-react/button';
// import notify from "devextreme/ui/notify";

export default function CreateDocumentsFromTemplate({ showOutput, tpsid, TpsExeID, targetLibraryServerRelUrl, SetRefreshFlag }) {

    /*1*/const [TpsDocumentTemplateDataItem, SetTpsDocumentTemplateDataItem] = useState();
    /*2*/const [DocAllocDataItem, SetDocAllocDataItem] = useState();
    /*3*/const [TpsDocumentNumber, SetTpsDocumentNumber] = useState();
    /*4*/const [TemplateDocs, SetTemplateDocs] = useState([]);
    /*5*/const [ExecutionsData, SetExecutionsData] = useState([]);
    /*6*/const [PageState, SetPageState] = useState("");
    /*7*/const [InitOperationStatus, SetInitOperationStatus] = useState("");

    useEffect(() => {

        if (!tpsid || tpsid == "") {
            return;
        } else {

            LoadPageData();
        }
    }, [tpsid]);

    useEffect(() => {
        if (tpsid && TpsDocumentTemplateDataItem && TpsDocumentTemplateDataItem.Folder && ExecutionsData && ExecutionsData.Id && DocAllocDataItem && DocAllocDataItem.length >= 0) {
            SetPageState("Loaded")
            SetInitOperationStatus("Validating Working Documents")
            ValidateOrCreateDocuments();
        }
    }, [tpsid, TpsDocumentTemplateDataItem, ExecutionsData, DocAllocDataItem]);

    const LoadPageData = async () => {

        const queryTemplateFolder = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPSDocumentTemplates')/items?`
            + `$expand=Folder&$select=Folder%2FName,Folder%2FItemCount,DocAllocData,Id,TPSReference0Id&$filter=TPSReference0Id eq ${tpsid} and startswith(ContentTypeId, '0x0120')`
        const templateFolderResult = await loadSpRestCall(queryTemplateFolder, true);
        SetDocAllocDataItem(JSON.parse(templateFolderResult.DocAllocData));
        SetTpsDocumentTemplateDataItem(templateFolderResult);

        const folderName_tpsDocumentNumber = templateFolderResult && templateFolderResult.Folder && templateFolderResult.Folder.Name;
        SetTpsDocumentNumber(folderName_tpsDocumentNumber)

        // const queryTemplateDocs = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPSDocumentTemplates')/items?$filter=TPSReference0Id eq ${tpsid} and startswith(ContentTypeId, '0x0101')&$expand=File&$select=File,*`
        // const resultTemplateDocs = await loadSpRestCall(queryTemplateDocs)
        // SetTemplateDocs(resultTemplateDocs)

        //DocAllocData
        const queryAllTemplateDocuments =
            `${REACT_APP_RESTURL_SPWEBURL}/_api/web/GetFolderByServerRelativeUrl('/projects/Viper/ETPS/TPSDocumentTemplates/${folderName_tpsDocumentNumber}')/Files?`
            + `$expand=ListItemAllFields&$select=ServerRelativeUrl,ListItemAllFields%2FId,ListItemAllFields%2FAuthorId,ListItemAllFields%2FEditorId,Name,Title,UIVersionLabel`
        const resultsAllTemplateDocuments = await loadSpRestCall(queryAllTemplateDocuments)
        SetTemplateDocs(resultsAllTemplateDocuments)


        const queryAllExecutions = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPS Executions')/Items?$select=Id, Title&$filter=Id eq ${TpsExeID}`
        const resultExecutions = await loadSpRestCall(queryAllExecutions, true);
        SetExecutionsData(resultExecutions);




    }

    const ValidateOrCreateDocuments = async () => {
        if (!(ExecutionsData && ExecutionsData.Title)) {
            alert("Missing Execution Data, cannot continue.");
            return;
        }

        const existingDocumentsForTps = await loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPSStepDocuments')/items?%24select=WorkingDocumentType,TPSDocumentTemplateId,TPSExecutionId,TPSStepId&%24filter=TPSId eq ${tpsid}`)

        var wasUpdated = false;
        //for (var i = 0; i < DocAllocDataItem.length; i++) {
        for (var i = 0; i < TemplateDocs.length; i++) {
            //const x = DocAllocDataItem[i];
            const tDoc = TemplateDocs[i];
            //if docAllocStepEntry is null, then this document belongs to the entire TPS... Create it as a TPS entry, if not already exists there
            const docAllocStepEntry = DocAllocDataItem.find(docAlloc => docAlloc.Id === tDoc.ListItemAllFields.Id);

            const docTypeStepOrTPS = docAllocStepEntry ? DOC_ALLOC_STEP : DOC_ALLOC_TPS
            const templateDocId = tDoc.ListItemAllFields.Id;
            const stepId = docAllocStepEntry ? docAllocStepEntry.StepId : null

            //get the file reference, copy file to TPSStepDocuments
            const foundExistingDocument = existingDocumentsForTps.find(e => e.WorkingDocumentType == docTypeStepOrTPS && e.TPSDocumentTemplateId == templateDocId && e.TPSExecutionId == TpsExeID)

            if (!foundExistingDocument) {   //only create if not exists

                const relatedTemplateDoc = tDoc; // TemplateDocs.find(t => t.ListItemAllFields.Id == docAllocStepEntry.Id)
                const newFileName = `${targetLibraryServerRelUrl}/[${ExecutionsData.Title}] ${relatedTemplateDoc.Name}`
                //CopySPFile(x.ServerRelativeUrl, "")
                SetInitOperationStatus(`${i + 1} of ${DocAllocDataItem.length} - Creating`)
                const copyResult = await CopySPFile(relatedTemplateDoc.ServerRelativeUrl, newFileName, true)
                notify(`Creating File: ${relatedTemplateDoc.ServerRelativeUrl}   ===> ${newFileName}`)
                SetInitOperationStatus(`${i + 1} of ${DocAllocDataItem.length} - Setting Properties`)
                await UpdateSPListItemGeneric("TPSStepDocuments", {
                    Id: copyResult.destinationSPItem.ListItemAllFields.Id
                    , Title: relatedTemplateDoc.Name
                    , TPSId: tpsid
                    , TPSExecutionId: TpsExeID
                    , TPSDocumentTemplateId: templateDocId
                    , TPSStepId: stepId
                    , WorkingDocumentType: docTypeStepOrTPS

                })
                wasUpdated = true;
                SetInitOperationStatus(`${i + 1} of ${DocAllocDataItem.length} - Initialized`)
                notify(`Created ${relatedTemplateDoc.Name}`, "success")
                console.log(`Created ${relatedTemplateDoc.Name}`)
            }
        }
        if(wasUpdated){
            SetRefreshFlag();
        }
        SetInitOperationStatus(`${DocAllocDataItem.length} Documents Verified`)
        setTimeout(() => {
            SetInitOperationStatus("")
        }, 3 * 1000);
    }


    const GetButton = () => {

        if (PageState == "Loaded")
            return (
                <>
                    <Button text="Create Documents"
                        type="default"
                        stylingMode="contained"
                        onClick={ValidateOrCreateDocuments}
                    />
                </>
            )
    }
    const getHeader=()=>{
        if(showOutput){
            return (
                <div>{TpsDocumentNumber} eTPS Template Documents Validator/Creator</div>
            )
        }
    }
    const getContent = () => {
        if (showOutput) {
            return (
                <div className="Panel SPLeftAligned">
                    {getHeader()}
                    <h4>{InitOperationStatus}</h4>
                </div>
            )
        }
    }

    return (
        <>
            {getContent()}
        </>
    )
}