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

export default function TPSExecutionSummary({ tpsid, TpsExeID, refreshFlag}) {

    const [TpsStepDocumentsData, SetTpsStepDocumentsData] = useState([]);
    const [TpsStepDocuments_Step_Data, SetTpsStepDocuments_Step_Data] = useState([]);
    const [RunConfigData, SetRunConfigData] = useState({});


    useEffect(() => {
        const runConfig = window['runConfig']
        SetRunConfigData(runConfig);
    }, []);


    useEffect(() => {

        if (!TpsExeID || TpsExeID == "") {
            return;
        } else {

            LoadPageData();
        }
    }, [TpsExeID, refreshFlag]);

    const LoadPageData = async () => {

        const resultStepDocs = await loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27TPSStepDocuments%27)/Items?&$filter=TPSExecutionId eq ${TpsExeID}&$top=4000&$expand=Editor,TPSStep,File&$select=Editor/EMail,File/UIVersionLabel,TPSStep/Step,Id,Title,TPSStepId,Modified,WorkingDocumentType,File/ServerRelativeUrl,File/Name,File/LinkingUrl&$orderby=Title`)
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


    }

    const CellRenderDocName = (cellData) => {

        const fileVer = cellData.data.File.UIVersionLabel;

        if (cellData.data.File.LinkingUrl != "") {

            return (
                <React.Fragment>
                    <div >
                        <a target="_blank" href={`${cellData.data.File.LinkingUrl}`}>{cellData.text}</a>
                    </div>
                    <div>
                        <span>
                            Version {fileVer}
                        </span>
                    </div>
                </React.Fragment>
            )
        } else {
            //File/ServerRelativeUrl
            const relUrl = `${RunConfigData.spHostUrl}${cellData.data.File.ServerRelativeUrl}`
            return (
                <React.Fragment>
                    <div className="nonOfficeDocRow">

                        <a target="_blank" href={`${relUrl}`}>{cellData.text} </a>
                    </div>
                    <div>
                        Version {fileVer}
                    </div>
                </React.Fragment>
            )
        }
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

    const RenderTpsWorkingDocuments = () => {
        return (


            <DataGrid

                id={`TpsWorkingDocuments`}
                dataSource={TpsStepDocumentsData}
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

                {/* <Column dataField="UIVersionLabel" caption="Version" /> */}
                <Column dataField="Modified" caption="Modified" dataType="date" format="dd/MM/yyyy HH:mm:ss" />
                <Column dataField="Editor.EMail" caption="Editor" />

            </DataGrid>
        )
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
                <Column dataField="TPSStep.Step" cellRender={CellRenderStepName} />
                <Column dataField="Modified" caption="Modified" dataType="date" format="dd/MM/yyyy HH:mm:ss" />
                <Column dataField="Editor.EMail" caption="Editor" />
                {/* <Column dataField="UIVersionLabel" caption="Version" /> */}

            </DataGrid>
        )
    }


    return (
        <>

            <div className="">

                {RenderTpsWorkingDocuments()}
            </div>

            <div className="">
                {RenderStepWorkingDocuments()}
            </div>



        </>
    )
}