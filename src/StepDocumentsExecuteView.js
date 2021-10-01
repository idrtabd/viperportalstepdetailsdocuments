import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import './App.css';
import React, { useState, useEffect, useContext } from "react";
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
} from "./MyUtils"

import DataGrid, {
    LoadPanel,
    GroupPanel,
    Column,
    SearchPanel,
    Selection,
    FilterRow,
    Scrolling,
    ColumnChooser,
    ColumnHeaderFilter,
    Editing
} from "devextreme-react/data-grid";
import DxGrid from 'devextreme/ui/data_grid'

import notify from "devextreme/ui/notify";

export default function StepDocumentsExecuteView({ tpsid, stepid, tpsdocumentnumber, executionId, IsReadOnly }) {
    const [DocumentSetFiles, SetDocumentSetFiles] = useState([]);
    const [SelectedItems, SetSelectedItems] = useState([]);
    const [ExistingTpsStepDocuments, SetExistingTpsStepDocuments] = useState([]);
    const [TPSStepData, SetTPSStepData] = useState({});
    const [TPSData, SetTPSData] = useState({});
    const [ExecutionData, SetExecutionData] = useState();

    let runConfig = {}
    const GridId=`TPSStepExecutionDocuments${tpsid}_${executionId}_${stepid}`

    useEffect(() => {
        runConfig = window['runConfig']
        loadTpsAndDocuments()
    }, []);

    const loadTpsAndDocuments = async () => {
        const existingStepDocs = await LoadExistingFileRefsFromTPSStepDocuments(executionId)
    }

    const LoadExistingFileRefsFromTPSStepDocuments = async (executionId) => {
        const existingItems = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle(%27TPSStepDocuments%27)/Items?$expand=Author,File&%24select=Author/Title,Author/EMail,File,TPSDocumentTemplateId,Id,TPSId,TPSStepId,TPSExecutionId,Title,Modified&%24filter=TPSId eq ${tpsid} and TPSStepId eq ${stepid} and TPSExecutionId eq ${executionId}`)
        SetExistingTpsStepDocuments(existingItems)
    }

    const CellRenderDocName = (cellData) => {
        return (
          <React.Fragment>
            <a target="_blank" href={`${cellData.data.File.LinkingUrl}`}>{cellData.text}</a>
          </React.Fragment>
        );
      }
    
      const CellRenderEMail = (cellData) => {
        return (
          <React.Fragment>
            <a href={`mailto:${cellData.data.Author.EMail}?body=${cellData.data.File.Name}`}>{cellData.text}</a>
          </React.Fragment>
        );
      }
    const GetStepDocumentsGrid = () => {
        return (
            <React.Fragment>
                <DataGrid

                    id={GridId}
                    dataSource={ExistingTpsStepDocuments}
                    hoverStateEnabled={true}
                    showBorders={true}
                    allowColumnResizing={true}
                    columnResizingMode={"widget"}
                    columnAutoWidth={true}
                    allowColumnReordering={true}
                    height="95%"

                >
                    <LoadPanel enabled={true} showIndicator={true} />
                    <ColumnChooser enabled={true} />
                    <Scrolling mode="virtual" />
                    <FilterRow visible={false} />
                    <GroupPanel visible={false} />
                    <SearchPanel visible={true} />
                    <Column dataField="Id" visible={false} />
                    <Column dataField="File.Name" cellRender={CellRenderDocName} />
                    <Column dataField="File.Title" />
                    <Column dataField="Author.Title" caption="Author" visible={false}/>
                    <Column dataField="Author.EMail" caption="Author Email" visible={false} cellRender={CellRenderEMail}/>
                    <Column dataField="Modified" caption="Modified" dataType="date" format="shortDate" />

                </DataGrid>
            </React.Fragment>
        )
    }

    return (
        <React.Fragment>
            {GetStepDocumentsGrid()}
        </React.Fragment>
    )

}

