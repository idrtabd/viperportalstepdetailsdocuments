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
import SelectTPSDocument from './SelectTPSDocuments';

function App({ tpsid, stepid, paramExecutionid, viewPage }) {

  const [DocumentSetFiles, SetDocumentSetFiles] = useState([]);
  const [SelectedItemKeys, SetSelectedItemKeys] = useState([]);
  const [SelectedItems, SetSelectedItems] = useState([]);
  const [ExistingTpsStepDocuments, SetExistingTpsStepDocuments] = useState([]);
  const [GridStateEnabled, SetGridStateEnabled] = useState(true);
  const [TPSStepData, SetTPSStepData] = useState({});
  const [TPSData, SetTPSData] = useState({});
  const [ExecutionData, SetExecutionData] = useState();

  const [currentUser, setCurrentUser] = useState();
  const [currentUserGroups, setCurrentUserGroups] = useState([]);
  const [IsReadOnly, SetIsReadOnly] = useState(true);
  const [tpsReadOnlyState, settpsReadOnlyState] = useState("not set");


  const GridId = "DocumentSetFilesGrid"
  let runConfig = {}
  const location = useLocation();
  // console.info(location.pathname);
  console.debug(location.pathname);
  let selectInitRunning = false;

  let history = useHistory();
  useEffect(() => {
    CalcIsReacOnly();
    if (viewPage === "StepExecution" && location.pathname !== "/StepExecution") {
      history.push("/StepExecution")
    } else if (viewPage === "SelectTPSDocuments" && location.pathname !== "/SelectTPSDocuments") {
      history.push("/SelectTPSDocuments")
    }
    else {

      runConfig = window['runConfig']
      loadTpsAndDocuments()
    }

  }, []);

  useEffect(() => {
    CalcIsReacOnly();
  }, [TPSData]);

  const GetGridInstance = () => {
    let element = document.getElementById(GridId);
    const instance = DxGrid.getInstance(element);
    return instance;
  }

  const loadTpsAndDocuments = async () => {
    const tpsExecution = await LoadTPSExecutionLatest()
    SetExecutionData(tpsExecution)
    LoadTPSStep();
    const tpsItem = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle(%27Draft - TPS%27)/Items(${tpsid})`, true)
    SetTPSData(tpsItem)
    const templateFiles = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFolderByServerRelativeUrl('/projects/Viper/ETPS/TPSDocumentTemplates/${tpsItem.Document_x0020_No}')?%24expand=Folders,Files`)

    await LoadListItemAllFieldsFromTemplateFiles(templateFiles && templateFiles.Files && templateFiles.Files.results);
    const allWorkingDocuments = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle(%27TPSStepDocuments%27)/items?%24filter=TPSId%20eq%20${tpsid} and TPSExecutionId eq ${paramExecutionid}&%24top=5000&$expand=TPSStep,TPSExecution&$select=*,TPSStep/Step,TPSExecution/Title`)


    templateFiles && templateFiles.Files && templateFiles.Files.results.forEach(x => {
      x.Id = x.ListItemAllFields.Id
      x.AssignmentStatus = ""
      x.WorkingDocuments = allWorkingDocuments.filter(w => w.TPSDocumentTemplateId === x.Id)
      x.StepDocuments = x.WorkingDocuments.filter(w => w.WorkingDocumentType === "Step")
      x.TPSExecutionDocuments = x.WorkingDocuments.filter(w => w.WorkingDocumentType === "TPSExecution")
      x.HasStepDocuments = x.StepDocuments && x.StepDocuments.length > 0
      x.HasTPSExecutionDocuments = x.TPSExecutionDocuments && x.TPSExecutionDocuments.length > 0
      x.TPSExecutionDocumentsSummary = x.TPSExecutionDocuments.map(x=>x.TPSExecution.Title).join(",  ")
      x.StepDocumentsSummary = x.StepDocuments.map(x=>x.TPSStep.Step).sort().join(",  ")

    })
    SetDocumentSetFiles(templateFiles && templateFiles.Files && templateFiles.Files.results)
    LoadExistingFileRefsFromTPSStepDocuments(templateFiles.Files.results, tpsExecution.Id)
  }

  const CalcIsReacOnly = async () => {
    const usr = await GetCurrentUser();
    const userGroups = await GetUsersGroups(usr.Id)
    let tempTpsReadOnlyState = ""
    setCurrentUserGroups(userGroups)
    setCurrentUser(usr)
    const foundEditorGroup = currentUserGroups.find(x => x.Title === ETPS_Editor_GroupId)

    if (TPSData.TPS_x0020_Status === ETPS_Tps_Status_Accepted || TPSData.TPS_x0020_Status === ETPS_Tps_Status_Closed) {
      // settpsReadOnlyState("readonly")
      tempTpsReadOnlyState = "readonly"
    } else if (usr && usr.Id === TPSData.EditorId) {
      // settpsReadOnlyState("open")
      tempTpsReadOnlyState = "open"
    } else if (foundEditorGroup) {
      tempTpsReadOnlyState = "open"
    }
    settpsReadOnlyState(tempTpsReadOnlyState)
    SetIsReadOnly(tempTpsReadOnlyState != "open")

  }

  const LoadTPSExecutionLatest = () => {

    return loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/lists/GetByTitle(%27TPS%20Executions%27)/items?%24filter=TPSLookupId eq ${tpsid}&%24orderby=ID desc&%24top=1`, true)

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


        try {


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

        } catch (err) {
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

    try {

      if (e.currentSelectedRowKeys.length === 1) {

        await ProcessAddFileItems(e.currentSelectedRowKeys)
      } else if (e.currentSelectedRowKeys.length > 1) {
        SetSelectedItemKeys(tempSelectedKeys)
      }
      if (e.currentDeselectedRowKeys.length === 1) {
        await ProcessRemoveFileItems(e.currentDeselectedRowKeys)
      } else if (e.currentDeselectedRowKeys.length > 1) {
        SetSelectedItemKeys(tempSelectedKeys)
      }
    } catch (err) {
      SetSelectedItemKeys(tempSelectedKeys)
    } finally {
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
          <Selection mode={IsReadOnly ? "none" : "multiple"} allowSelectAll={false} />
          <Scrolling mode="virtual" />
          <FilterRow visible={true} />
          <GroupPanel visible={false} />
          <SearchPanel visible={true} />
          <Column dataField="Id" visible={true} />
          <Column dataField="Name" cellRender={CellRenderDocName} />
          <Column dataField="Title" />
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
      <Router>
        <Switch>
          <Route path="/StepExecution">
            <StepDocumentsExecuteView
             
              executionId={paramExecutionid}
              stepid={stepid}
              tpsid={tpsid}
              IsReadOnly={IsReadOnly}
            />
          </Route>
          <Route path="/SelectTPSDocuments">
            <SelectTPSDocument
             DocumentSetFiles={DocumentSetFiles}
              executionId={paramExecutionid}
              stepid={stepid}
              tpsid={tpsid}
              IsReadOnly={IsReadOnly}
            />
          </Route>
          {/* <Route path="/NotesEditor">
            <StepExecutionNotesEditor notesText="fdf dfjdkslafjdsal;f jdasfldjafk;"/>
          </Route> */}
          <Route path="/">
            <React.Fragment>
              {GetSummaryInstructions()}
              {GetDataGrid()}
            </React.Fragment>
            {/* No Route Selected use #/PartsPage or #/GSEPage for example */}
          </Route>
        </Switch>
      </Router>
    </React.Fragment>


  );
}

export default App;
