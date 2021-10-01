import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import './App.css';
import React, { useState, useEffect, useContext } from "react";
import { HashRouter as Router, Switch, Route, Link, Redirect, useHistory, useLocation } from "react-router-dom";
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
import StepDocumentsExecuteView from './StepDocumentsExecuteView';

export default function SelectTPSDocument({ DocumentSetFiles, tpsid, stepid, executionId, IsReadOnly }) {

  // const [DocumentSetFiles, SetDocumentSetFiles] = useState([]);
  const [SelectedItemKeys, SetSelectedItemKeys] = useState([]);
  const [SelectedItems, SetSelectedItems] = useState([]);
  const [ExistingTpsStepDocuments, SetExistingTpsStepDocuments] = useState([]);
  const [GridStateEnabled, SetGridStateEnabled] = useState(true);
  const [TPSStepData, SetTPSStepData] = useState({});
  const [TPSData, SetTPSData] = useState({});
  const [ExecutionData, SetExecutionData] = useState();

  const [currentUser, setCurrentUser] = useState();
  const [currentUserGroups, setCurrentUserGroups] = useState([]);
  const [tpsReadOnlyState, settpsReadOnlyState] = useState("not set");


  const GridId = "DocumentSetFilesGrid"
  let runConfig = {}
  const location = useLocation();
  // console.info(location.pathname);
  console.debug(location.pathname);
  let selectInitRunning = false;

  let history = useHistory();
  useEffect(() => {
  }, []);

  const GetGridInstance = () => {
    let element = document.getElementById(GridId);
    const instance = DxGrid.getInstance(element);
    return instance;
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




  const LoadTPSStep = async () => {
    const tpsStepData = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle(%27Draft - TPS Steps%27)/Items?%24filter=Id eq ${stepid}`, true)
    SetTPSStepData(tpsStepData)
  }

  const ProcessAddFileItems = (currentSelectedRowKeys) => {
    //Process SELECTED ITEMS
    // const selectedRowData = []
    // selectedRowKeys.forEach(x=>DocumentSetFiles.find())

    return new Promise(async (resolve, reject) => {
      currentSelectedRowKeys.forEach(x => {


        try{

        
        const sel = DocumentSetFiles.find(d => d.Id === x)
        const fileextension = sel.Name.substring(sel.Name.lastIndexOf("."))
        const fileNameNoExtension = sel.Name.substring(0, sel.Name.lastIndexOf("."))

        //const newFileName = `${fileNameNoExtension}${fileextension}`
         const newFileName = `${fileNameNoExtension}  [${ExecutionData.Title}.${(TPSStepData.Step + "").padStart(3, '0')}]${fileextension}`
        const destinationPath = `/projects/Viper/ETPS/TPSStepDocuments/${newFileName}`

        CopySPFile(sel.ServerRelativeUrl, destinationPath)
          .then(({ sourceSPItem, destinationSPItem }) => {
            notify(`${sel.Name} copied to ${TPSData && TPSData.Document_x0020_No} documents`, "success", 5000)

            UpdateSPListItemGeneric("TPSStepDocuments", {
              Id: destinationSPItem.ListItemAllFields.Id
              , TPSDocumentTemplateId: sourceSPItem.ListItemAllFields.Id
              , TPSId: tpsid
              , TPSStepId: stepid
              , TPSExecutionId: ExecutionData && ExecutionData.Id
              , Title: sourceSPItem.ListItemAllFields.Title
            }).then(itemUpdate => {
              notify(`${sel.Name} Fields Set - ${TPSData && TPSData.Document_x0020_No} - ${newFileName}`, "success", 5000)
              let temp = [...ExistingTpsStepDocuments];
              temp.push(itemUpdate)
              SetExistingTpsStepDocuments(temp)
              resolve()
            })
            .catch(err => {

              reject(err)
              notify(`Error ${JSON.stringify(err)}`, "error", 5000)
              throw err
            })

          })
          .catch(err => {
            notify(`Error ${JSON.stringify(err)}`, "error", 5000)
            reject(err)
          })

        }catch(err){
          notify(`Error ${JSON.stringify(err)}`, "error", 5000)
            reject(err)
        }
      })

    })//promise
  }



  const ProcessRemoveFileItems = (currentDeselectedRowKeys) => {
    return new Promise(async (resolve, reject) => {
      currentDeselectedRowKeys.forEach(dSel => {
        //find existing step item
        const foundItem = ExistingTpsStepDocuments.find(x => x.TPSDocumentTemplateId === dSel)
        RemoveSPListItemGeneric("TPSStepDocuments", foundItem.Id)
          .then(x => {
            console.log("removed item")
            let temp = [...ExistingTpsStepDocuments];
            const foundIndex = temp.findIndex(x => x.Id === foundItem.Id)
            temp.splice(foundIndex, 1);
            SetExistingTpsStepDocuments(temp)
            resolve()
          })
          .catch(err => {
            notify(`Error ${JSON.stringify(err)}`, "error", 5000)
            reject(err)
          })
      })
    })//promise

  }

  const dataGrid_onSelectionChanged = async (e) => {
    // console.log("dataGrid_onSelectionChanged")
    console.log("Selected: ")
    console.log(e.currentSelectedRowKeys)
    console.log("DESelected: ")
    console.log(e.currentDeselectedRowKeys)
    // return;

    SetGridStateEnabled(false)
    GetGridInstance().beginCustomLoading("Updating")

    const tempSelectedKeys = [...SelectedItemKeys]
    SetSelectedItemKeys(e.selectedRowsData.map(x => x.Id))
    
    try{

      if (e.currentSelectedRowKeys.length === 1) {
        
        await ProcessAddFileItems(e.currentSelectedRowKeys)
      }else if (e.currentSelectedRowKeys.length > 1){
        SetSelectedItemKeys(tempSelectedKeys)
      }
      if (e.currentDeselectedRowKeys.length === 1) {
        await ProcessRemoveFileItems(e.currentDeselectedRowKeys)
      }else if (e.currentDeselectedRowKeys.length > 1){
        SetSelectedItemKeys(tempSelectedKeys)
      }
    }catch(err){
      SetSelectedItemKeys(tempSelectedKeys)
    }finally{
      GetGridInstance().endCustomLoading()
      SetGridStateEnabled(true)

    }
    
  }





  const CellRenderDocName = (cellData) => {
    return (
      <React.Fragment>
        <a target="_blank" href={`${cellData.data.LinkingUrl}`}>{cellData.text}</a>
      </React.Fragment>
    );
  }
  const dataGrid_onSelectedRowKeysChange = (e, val) => {
    console.log("dataGrid_onSelectedRowKeysChange")
  }

  const LoadExistingFileRefsFromTPSStepDocuments = async (templateFiles, executionId) => {
    const existingItems = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle(%27TPSStepDocuments%27)/Items?%24select=TPSDocumentTemplateId,Id,TPSId,TPSStepId,TPSExecutionId,Title&%24filter=TPSId eq ${tpsid} and TPSStepId eq ${stepid} and TPSExecutionId eq ${executionId}`)
    const matches = []
    SetExistingTpsStepDocuments(existingItems)
    existingItems.forEach(x => {
      const match = templateFiles.find(t => t.ListItemAllFields.Id === x.TPSDocumentTemplateId)
      if (match) {
        matches.push(match)
      }
    })

    // SetSelectedItems(matches)
    const keys = matches.map(x => x.Id)
    SetSelectedItemKeys(keys)
    //   const gridIns = GetGridInstance();
    //    gridIns.off("onSelectionChanged")
  }

  const GetDataGrid = () => {
    return (
      <React.Fragment>
        <DataGrid

          id={GridId}
          dataSource={DocumentSetFiles}
          selectedRowKeys={SelectedItemKeys}
          // selectedRowsData={SelectedItems}
          onSelectionChanged={dataGrid_onSelectionChanged}
          // onSelectedRowKeysChange={dataGrid_onSelectedRowKeysChange}
          // defaultSelectedRowKeys={SelectedItemKeys}
          hoverStateEnabled={true}
          showBorders={true}
          allowColumnResizing={true}
          columnResizingMode={"widget"}
          columnAutoWidth={true}
          allowColumnReordering={true}
          height="95%"
          disabled={!GridStateEnabled}
          keyExpr="Id"
        >
          <LoadPanel enabled={true} showIndicator={true} />
          <ColumnChooser enabled={true} />
          <Selection mode={IsReadOnly ? "none" : "multiple"} allowSelectAll={false}/>
          <Scrolling mode="virtual" />
          <FilterRow visible={true} />
          <GroupPanel visible={false} />
          <SearchPanel visible={true} />
          <Column dataField="Id" visible={true} />
          <Column dataField="Name" cellRender={CellRenderDocName} />
          <Column dataField="Title" />
          <Column dataField="TPSExecutionDocumentsSummary" />
          <Column dataField="StepDocumentsSummary" />
          <Column dataField="TimeLastModified" caption="Modified" dataType="date" format="shortDate" />
          <Column dataField="UIVersionLabel" caption="Version" />

        </DataGrid>
      </React.Fragment>

    )
  }

  const GetSummaryInstructions = () => {
    return (
      <React.Fragment>
        <div className="instructionText">
          Select from the following <a className="amplifiedhref" href={`/projects/Viper/ETPS/TPSDocumentTemplates/${TPSData && TPSData.Document_x0020_No}`} target="_blank">Template Files</a> to associate documents to this step.  Each TPS Execution will have it's own version of the selected files.
        </div>
      </React.Fragment>
    )
  }

  return (
    <React.Fragment>
              {GetSummaryInstructions()}
              {GetDataGrid()}
    </React.Fragment>


  );
}
