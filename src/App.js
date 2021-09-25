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
} from "./MyUtils"

import DataGrid, {
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
import notify from "devextreme/ui/notify";

function App({ tpsid, stepid, tpsdocumentnumber, executionid }) {

  const [DocumentSetFiles, SetDocumentSetFiles] = useState([]);
  const [SelectedItems, SetSelectedItems] = useState([]);

  let runConfig = {}

  useEffect(() => {
    runConfig = window['runConfig']
    loadTpsAndDocuments()
  }, []);

  const loadTpsAndDocuments = async () => {
    const tpsItem = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle(%27Draft - TPS%27)/Items?%24select=Document_x0020_No&%24filter=Id eq 448&%24top=1`, true)
    const templateFiles = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFolderByServerRelativeUrl('/projects/Viper/ETPS/TPSDocumentTemplates/${tpsItem.Document_x0020_No}')?%24expand=Folders,Files`)

    await LoadListItemAllFieldsFromTemplateFiles(templateFiles && templateFiles.Files && templateFiles.Files.results);
    SetDocumentSetFiles(templateFiles && templateFiles.Files && templateFiles.Files.results)
    LoadExistingFileRefsFromTPSStepDocuments(templateFiles.Files.results)
  }

  //get existing items to pre-set checkboxes
  const LoadListItemAllFieldsFromTemplateFiles = async (templateFiles) => {
    return new Promise(async (resolve, reject) => {

      if (!templateFiles) { resolve() }
      for (let i = 0; i < templateFiles.length; i++) {
        const res = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Web/GetFileByServerRelativeUrl(%27${templateFiles[i].ServerRelativeUrl}%27)/ListItemAllFields?%24select=Id,TPSReference0Id`, true)
        templateFiles[i].ListItemAllFields = res;
        templateFiles[i].Id = res.Id;
      }
      resolve()
    })
  }
  const LoadExistingFileRefsFromTPSStepDocuments = async (templateFiles) => {
    const existingItems = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle(%27TPSStepDocuments%27)/Items?%24select=TPSDocumentTemplateId,Id,TPSId,TPSStepId,TPSExecutionId,Title&%24filter=TPSId eq ${tpsid} and TPSStepId eq ${stepid} and TPSExecutionId eq ${executionid}`)
    const matches = []
    existingItems.forEach(x=>{
       const match = templateFiles.find(t=>t.ListItemAllFields.Id === x.TPSDocumentTemplateId)
       if(match){
         matches.push(match)
       }
    })
    SetSelectedItems(matches)
  }

  const dataGrid_onSelectionChanged = async (e) => {
    SetSelectedItems(e.selectedRowsData)
    e.currentSelectedRowKeys.forEach(sel => {
      const destinationPath = `/projects/Viper/ETPS/TPSStepDocuments/${sel.Name}`
      CopySPFile(sel.ServerRelativeUrl, destinationPath)
        .then(({ sourceSPItem, destinationSPItem }) => {
          notify(`${sel.Name} copied to ${tpsdocumentnumber} documents`, "success", 5000)

          UpdateSPListItemGeneric("TPSStepDocuments", {
            Id: destinationSPItem.ListItemAllFields.Id
            , TPSDocumentTemplateId: sourceSPItem.ListItemAllFields.Id
            , TPSId: tpsid
            , TPSStepId: stepid
            , TPSExecutionId: executionid
            , Title: sourceSPItem.ListItemAllFields.Title
          }).then(itemUpdate => {
            notify(`${sel.Name} Fields Set`, "success", 5000)
          })

        })
        .catch(err => {
          notify(`Error ${JSON.stringify(err)}`, "error", 5000)
        })
    })

    e.currentDeselectedRowKeys.forEach(dSel => {
      notify(`${dSel.Name} removed from ${tpsdocumentnumber} documents`, "success", 5000)
    })
    // CopySPFile(e.)
  }





  const CellRenderDocName = (cellData) => {
    return (
      <React.Fragment>
        <a target="_blank" href={`${cellData.data.LinkingUrl}`}>{cellData.text}</a>
      </React.Fragment>
    );
  }

  return (

    <React.Fragment>
      <DataGrid


        dataSource={DocumentSetFiles}
        onSelectionChanged={dataGrid_onSelectionChanged}
        selectedRowKeys={SelectedItems}
        hoverStateEnabled={true}
        showBorders={true}
        allowColumnResizing={true}
        columnResizingMode={"widget"}
        columnAutoWidth={true}
        allowColumnReordering={true}
        height="95%"

      >
        <ColumnChooser enabled={true} />
        <Selection mode="multiple" allowSelectAll={true} />
        <Scrolling mode="virtual" />
        <FilterRow visible={true} />
        <GroupPanel visible={true} />
        <SearchPanel visible={true} />
        <Column dataField="Id" visible={false} />
        <Column dataField="Name" cellRender={CellRenderDocName} />
        <Column dataField="Title" />
        <Column dataField="TimeLastModified" caption="Modified" dataType="date" format="shortDate" />
        <Column dataField="UIVersionLabel" caption="Version" />

      </DataGrid>
    </React.Fragment>

  );
}

export default App;
