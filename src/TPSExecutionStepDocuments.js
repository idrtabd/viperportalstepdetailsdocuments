import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import './App.css';
import React, { useState, useEffect, useContext } from "react";
import List, { ItemDragging } from 'devextreme-react/list';
import { Button } from 'devextreme-react/button';
import DataGrid, {
    LoadPanel,
    GroupPanel,
    Column,
    SearchPanel,
    RowDragging,
    Selection,
    FilterRow,
    Scrolling,
    ColumnChooser,
    ColumnHeaderFilter,
    Editing
} from "devextreme-react/data-grid";
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

// import { Button } from 'devextreme-react/button';
// import notify from "devextreme/ui/notify";

export default function TPSExecutionStepDocuments({ tpsid, stepid, TpsExeID, refreshFlag, TPSKey }) {

    const [RunConfigData, SetRunConfigData] = useState({});
    const [TpsStepDocumentsData, SetTpsStepDocumentsData] = useState([]);
    const [TpsStepDocuments_Step_Data, SetTpsStepDocuments_Step_Data] = useState([]);
    const [RefreshedTimestamp, SetRefreshedTimestamp] = useState();


    useEffect(() => {
        const runConfig = window['runConfig']
        SetRunConfigData(runConfig);
    }, []);


    useEffect(() => {

        if (!TpsExeID || TpsExeID == "" || !stepid || stepid == "") {
            return;
        } else {

            LoadPageData();
        }
    }, [TpsExeID, refreshFlag, TPSKey]);

    const LoadPageData = async () => {

        const resultStepDocs = await loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPSStepDocuments')/Items?&$filter=TPSStepId eq ${stepid} and TPSExecutionId eq ${TpsExeID}&$top=4000&$expand=Editor,TPSStep,File&$select=Editor/EMail,File/UIVersionLabel,TPSStep/Step,Id,Title,TPSStepId,Modified,WorkingDocumentType,LockStatus,File/ServerRelativeUrl,File/Name,File/LinkingUrl&$orderby=Title`)
        resultStepDocs.forEach(x => {
            x.Modified = new Date(x.Modified);
        })
        const tpsDocsData = resultStepDocs.filter(x => x.WorkingDocumentType && x.WorkingDocumentType.toLowerCase() === "tps")
        SetTpsStepDocumentsData(tpsDocsData)

        const stepDocsData = resultStepDocs.filter(x => x.WorkingDocumentType && x.WorkingDocumentType.toLowerCase() === "step")
        stepDocsData.sort((a, b) => {
            return a.TPSStep.Step - b.TPSStep.Step
        })
        SetTpsStepDocuments_Step_Data(stepDocsData);

        SetRefreshedTimestamp(new Date().toLocaleTimeString())


    }

    const GetLockedSpan = (isLocked) => {
        if (isLocked) {
            return (
                <div>
                    File is Locked, Step is Signed Off
                </div>
            )
        }
    }
    const GetIsOfficeDocumentSpan = (isOfficeDocument) => {
        if (!isOfficeDocument) {
            return (
                <div>
                    Not an office document
                </div>
            )
        }
    }

    const GetDocumentLink = (cellData) => {
        const isLocked = cellData.data.LockStatus == "Lock" || cellData.data.LockStatus == "Locked";
        const fileVer = cellData.data.File.UIVersionLabel;

        if (cellData.data.File.LinkingUrl != "") {
            return (
                <React.Fragment>
                    <div>
                        <a className={isLocked ? "lockedFile" : ""} target="_blank" href={`${cellData.data.File.LinkingUrl}`}>{cellData.text}</a>
                        {GetLockedSpan(isLocked)}
                    </div>
                </React.Fragment>
            )
        } else {
            const relUrl = `${RunConfigData.spHostUrl}${cellData.data.File.ServerRelativeUrl}`
            return (
                <React.Fragment>

                    <a target="_blank" href={`${relUrl}`}>{cellData.text} </a>
                    {GetLockedSpan(isLocked)}
                </React.Fragment>
            )
        }
    }

    const CellRenderDocName = (cellData) => {
        return (
            <React.Fragment>
                <div >
                    {GetDocumentLink(cellData)}
                </div>
            </React.Fragment>
        )
    }
    const CellRenderStepName = (cellData) => {
        if (cellData.data.TPSStep && cellData.data.TPSStep.Step) {
            // const stepAnchorLink = `step${cellData.data.TPSStepId}StepNumber`;
            return (
                <React.Fragment>
                    {/* <a target="" href={`#${stepAnchorLink}`}><span>Step #{cellData.text}</span></a> */}
                    <span>Step {cellData.text}</span>
                </React.Fragment>
            );
        }
    }

    const RenderStepWorkingDocuments = () => {
        return (


            <DataGrid

                id={`StepWorkingDocuments`}
                dataSource={TpsStepDocuments_Step_Data}
                hoverStateEnabled={true}
                showBorders={true}
                allowColumnResizing={true}
                columnResizingMode={"widget"}
                columnAutoWidth={true}
                allowColumnReordering={true}
                rowAlternationEnabled={true}
                height="95%"
                keyExpr="Id"
            >
                {/* <Scrolling mode="virtual" /> */}
                {/* <FilterRow visible={true} /> */}
                
                <Column dataField="File.Name" cellRender={CellRenderDocName} />
                <Column dataField="TPSStep.Step" cellRender={CellRenderStepName} visible={false} />
                <Column dataField="Modified" caption="Modified" dataType="date" format="dd/MM/yyyy HH:mm:ss" visible={false} />
                <Column dataField="Editor.EMail" caption="Editor" visible={false} />
                {/* <Column dataField="UIVersionLabel" caption="Version" /> */}

            </DataGrid>
        )
    }


    return (
        <>
            <div className="Panel SPLeftAligned">
                {RenderStepWorkingDocuments()}
            </div>
            {/* <div className="labelSmall">Refreshed on : {RefreshedTimestamp} </div> */}


        </>
    )
}