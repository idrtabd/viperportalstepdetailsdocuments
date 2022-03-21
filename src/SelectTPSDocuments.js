import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import './App.css';
import React, { useState, useEffect, useContext } from "react";
import { HashRouter as Router, Switch, Route, Link, Redirect, useHistory, useLocation } from "react-router-dom";
import { Popup, Position, ToolbarItem } from 'devextreme-react/popup';

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
  RowDragging,
  Selection,
  FilterRow,
  Scrolling,
  ColumnChooser,
  ColumnHeaderFilter,
  Editing
} from "devextreme-react/data-grid";
import DxGrid from 'devextreme/ui/data_grid'
import { Button } from 'devextreme-react/button';
import notify from "devextreme/ui/notify";
import StepDocumentsExecuteView from './StepDocumentsExecuteView';
import StepSelecector from './StepSelector';

export default function SelectTPSDocument({ tpsid, stepid, executionId, IsReadOnly }) {

  const [DocumentSetFiles, SetDocumentSetFiles] = useState([]);
  const [DocumentSetFilesNotSelected, SetDocumentSetFilesNotSelected] = useState([]);
  const [DocumentSetFilesSelectedToExecutionDocuments, SetDocumentSetFilesSelectedToExecutionDocuments] = useState([]);
  const [DocumentSetFilesSelectedToStep, SetDocumentSetFilesSelectedToStep] = useState([]);

  const [TPSExecutionDocuments, SetTPSExecutionDocuments] = useState([]);
  const [TPSStepDocuments, SetTPSStepDocuments] = useState([]);
  const [TPSData, SetTPSData] = useState();
  const [TPSSteps, SetTPSSteps] = useState([]);
  const [SelectedDocumentId, SetSelectedDocumentId] = useState();
  const [popupVisible, SetpopupVisible] = useState(false);


  const TemplateDocumentsGridId = "TemplateDocumentsGrid"
  const StepWorkingDocumentsGridId = "StepWorkingDocumentsGrid"
  const TPSExecutionWorkingDocumentsGridId = "TPSExecutionWorkingDocumentsGrid"

  useEffect(() => {
    LoadPageData();

  }, []);


  //when TPSExecutionDocuments is updated, calculate the DocumentSetFilesSelectedToExecutionDocuments
  useEffect(() => {
    const selectedDocumentSetFiles_Execution = DocumentSetFiles.filter(x => TPSExecutionDocuments.find(t => t.TPSDocumentTemplateId === x.Id))
    const selectedDocumentSetFiles_Steps = DocumentSetFiles.filter(x => TPSStepDocuments.find(t => t.TPSDocumentTemplateId === x.Id))
    SetDocumentSetFilesSelectedToExecutionDocuments(selectedDocumentSetFiles_Execution)
    SetDocumentSetFilesSelectedToStep(selectedDocumentSetFiles_Steps)


    const notSelectedDocumentSetFiles = DocumentSetFiles.filter(x => !TPSExecutionDocuments.find(t => t.TPSDocumentTemplateId === x.Id) && !TPSStepDocuments.find(st => st.TPSDocumentTemplateId === x.Id))
    SetDocumentSetFilesNotSelected(notSelectedDocumentSetFiles)

  }, [DocumentSetFiles, TPSExecutionDocuments, TPSStepDocuments]);


  const LoadPageData = async () => {
    //get all template documents
    //join with selected step

    loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle('Draft%20-%20TPS%20Steps')/Items?%24expand=Tools,Author,Editor&%24select=*,Tools%2FTitle,Author%2FTitle,Editor%2FTitle&%24orderby=Step&%24filter=TPSLookupId eq ${tpsid}`)
      .then(x => {
        x.forEach(item => {
          item.ToolNames = item.Tools && item.Tools.results.join(", ")
          item.Roles = item.TPS_x0020_Role && item.TPS_x0020_Role.results.join(", ")
          SetTPSSteps(x)
        })
      })
      .catch(err => {
        console.error(err);
        notify(`Error Loading Steps ${err}`, "error", 5000)
      })

    const tpsItem = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle('Draft - TPS')/Items(${tpsid})`, true)
    SetTPSData(tpsItem)

    const allExistingWorkingDocuments = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle('TPSStepDocuments')/items?%24filter=TPSId%20eq%20${tpsid} and TPSExecutionId eq ${executionId}&%24top=5000&$expand=TPSStep,TPSExecution&$select=*,TPSStep/Step,TPSExecution/Title`)
    const templateFilesListItems = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle('TPSDocumentTemplates')/items?%24filter=TPSReference0Id eq ${tpsid} and startswith(ContentTypeId,'0x0101')&%24expand=File&%24select=File,*`)

    //Get Template Files
    // const templateFilesListItems = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle('TPSDocumentTemplates')/items?%24filter=TPSReference0Id eq ${tpsid}`)
    //const templateTpsFolderFileList = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFolderByServerRelativeUrl(@folder)?%40folder='%2Fprojects%2FViper%2FETPS%2FTPSDocumentTemplates%2F${tpsItem.Document_x0020_No}'&%24select=Files%2FServerRelativeUrl&%24expand=Files`)

    // const templateFileInfos = []
    // for (let i = 0; i < templateTpsFolderFileList.Files.results.length; i++) {
    //   //?%24select=*,ListItemAllFields&%24expand=ListItemAllFields
    //   const fileInfo = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Web/GetFileByServerRelativeUrl(@file)?%24select=*,ListItemAllFields&%24expand=ListItemAllFields&%40file='${templateTpsFolderFileList.Files.results[i].ServerRelativeUrl}'`)
    //   templateFileInfos.push(fileInfo)
    // }

    // const templateFiles = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFolderByServerRelativeUrl('/projects/Viper/ETPS/TPSDocumentTemplates/${tpsItem.Document_x0020_No}')?%24expand=Folders,Files`)

    //Join Template Documents to Existing Working Documents
    templateFilesListItems.forEach(x => {
      x.AssignmentStatus = ""
      x.WorkingDocuments = allExistingWorkingDocuments.filter(w => w.TPSDocumentTemplateId === x.Id)

      x.StepDocuments = x.WorkingDocuments.filter(w => w.WorkingDocumentType === "Step" && w.TPSDocumentTemplateId == x.Id)
      x.TPSExecutionDocuments = x.WorkingDocuments.find(w => w.WorkingDocumentType === "TPSExecution" && w.TPSDocumentTemplateId == x.Id)
      x.HasStepDocuments = x.StepDocuments && x.StepDocuments.length > 0
      x.HasTPSExecutionDocuments = x.TPSExecutionDocuments

      //x.RelatedFileInfo = templateFileInfos.find(f => f..Id === x.Id)
      // x.StepDocumentsSummary = x.StepDocuments.map(x => x.TPSStep.Step).sort().join(",  ")

    })
    const ExistingTPSExecutionWorkingDocuments = allExistingWorkingDocuments.filter(x => x.WorkingDocumentType === "TPSExecution")
    SetTPSExecutionDocuments(ExistingTPSExecutionWorkingDocuments)

    SetDocumentSetFiles(templateFilesListItems)
    // LoadExistingFileRefsFromTPSStepDocuments(templateFiles.Files.results, tpsExecution.Id)
  }

  const GetTPSStepsGrid = () => {
    return (
      <React.Fragment>
        <DataGrid

          id={`TPSSteps`}
          dataSource={TPSSteps}
          hoverStateEnabled={true}
          showBorders={true}
          allowColumnResizing={true}
          columnResizingMode={"widget"}
          columnAutoWidth={true}
          allowColumnReordering={true}
          rowAlternationEnabled={true}
          height="95%"
          // disabled={!GridStateEnabled}
          keyExpr="Id"
          onSelectionChanged={dataGrid_onSelectionChanged}
        >
          <Selection mode="multiple" allowSelectAll={false} />
          {/* <Selection mode={IsReadOnly ? "none" : "multiple"} allowSelectAll={false} /> */}
          <LoadPanel enabled={true} showIndicator={true} />
          <ColumnChooser enabled={true} />
          <Scrolling mode="virtual" />
          <FilterRow visible={true} />
          <GroupPanel visible={false} />
          <SearchPanel visible={true} />
          <Column dataField="Step" />
          <Column dataField="Roles" />
          <Column dataField="ToolNames" visible={false} />
          <Column dataField="Warnings" visible={false} />
          <Column dataField="Step_x0020_Procedure" visible={true} caption="Procedure" />
          <Column dataField="Step_x0020_Notes" visible={false} />
          <Column dataField="Pass_x0020_Criteria" visible={false} />
          <Column dataField="Fail_x0020_Criteria" visible={false} />
          <Column dataField="Cautions_x002F_Warnings" visible={false} />
          <Column dataField="Author.Title" visible={false} />
          <Column dataField="Editor.Title" visible={false} />
          <Column dataField="Modified" caption="Modified" dataType="date" format="shortDate" />
          {/* <Column dataField="UIVersionLabel" caption="Version" /> */}

        </DataGrid>
      </React.Fragment>

    )
  }



  const GetTemplateDocumentsGrid = () => {
    return (
      <React.Fragment>
        <DataGrid

          id={TemplateDocumentsGridId}
          dataSource={DocumentSetFilesNotSelected}
          hoverStateEnabled={true}
          showBorders={true}
          allowColumnResizing={true}
          columnResizingMode={"widget"}
          columnAutoWidth={true}
          allowColumnReordering={true}
          rowAlternationEnabled={true}
          height="95%"
          // disabled={!GridStateEnabled}
          keyExpr="Id"
        >
          <RowDragging
            // data={currentDataItemDraggedFromAllGSE}
            group="workingDocuments"
            onAdd={onAddAll}
            onRemove={onRemoveAll}
          />

          <LoadPanel enabled={true} showIndicator={true} />
          <ColumnChooser enabled={true} />
          <Scrolling mode="virtual" />
          <FilterRow visible={true} />
          <GroupPanel visible={false} />
          <SearchPanel visible={true} />
          <Column dataField="Id" visible={true} />
          <Column dataField="File.Name" cellRender={CellRenderDocName} caption="Template File Name" />
          <Column dataField="Title" />
          <Column dataField="DocumentSetDescription" />
          <Column dataField="File.UIVersionLabel" caption="Version" />
          <Column dataField="Modified" caption="Modified" dataType="date" format="shortDate" />
          {/* <Column dataField="UIVersionLabel" caption="Version" /> */}

        </DataGrid>
      </React.Fragment>

    )
  }


  const GetStepWorkingDocumentsGrid = () => {
    return (
      <React.Fragment>
        <DataGrid
          dataSource={DocumentSetFilesSelectedToStep}
          hoverStateEnabled={true}
          showBorders={true}
          allowColumnResizing={true}
          columnResizingMode={"widget"}
          columnAutoWidth={true}
          allowColumnReordering={true}
          rowAlternationEnabled={true}
          height="95%"
          id={DocumentSetFilesSelectedToStep}
        >
          <RowDragging
            // data={currentDataItemDraggedFromAllGSE}
            group="workingDocuments"
            onAdd={onAddSelectedSteps}
            onRemove={onRemoveSelectedSteps}
          />
          <Column dataField="Id" visible={true} />
          <Column dataField="SelectedSteps" cellRender={CellRenderSelectedSteps} />
          <Column dataField="File.Name" cellRender={CellRenderDocName} caption="Template File Name" />
          <Column dataField="Title" />
          <Column dataField="File.UIVersionLabel" caption="Version" />
          <Column dataField="Modified" caption="Modified" dataType="date" format="shortDate" />
        </DataGrid>
      </React.Fragment>

    )
  }
  const GetTPSExecutionWorkingDocumentsGrid = () => {
    return (
      <React.Fragment>
        <DataGrid

          id={TPSExecutionWorkingDocumentsGridId}
          dataSource={DocumentSetFilesSelectedToExecutionDocuments}
          hoverStateEnabled={true}
          showBorders={true}
          allowColumnResizing={true}
          columnResizingMode={"widget"}
          columnAutoWidth={true}
          allowColumnReordering={true}
          rowAlternationEnabled={true}
          height="95%"
          // disabled={!GridStateEnabled}
          keyExpr="Id"
        >
          <LoadPanel enabled={true} showIndicator={true} />
          <ColumnChooser enabled={true} />
          <Scrolling mode="virtual" />
          <FilterRow visible={true} />
          <GroupPanel visible={false} />
          <SearchPanel visible={true} />
          <RowDragging
            // data={currentDataItemDraggedFromAllGSE}
            group="workingDocuments"
            onAdd={onAddSelected}
            onRemove={onRemoveSelected}
          />

          <Column dataField="Id" visible={true} />
          <Column dataField="File.Name" cellRender={CellRenderDocName} caption="Template File Name" />
          <Column dataField="Title" />
          <Column dataField="File.UIVersionLabel" caption="Version" />
          <Column dataField="Modified" caption="Modified" dataType="date" format="shortDate" />
          {/* <Column dataField="UIVersionLabel" caption="Version" /> */}


        </DataGrid>
      </React.Fragment>

    )
  }

  const dataGrid_onSelectionChanged = async (e) => {
    // console.log("dataGrid_onSelectionChanged")
    console.log("Selected: ")
    console.log(e.currentSelectedRowKeys)
    console.log("DESelected: ")
    console.log(e.currentDeselectedRowKeys)
    // return;

    // SetGridStateEnabled(false)
    // GetGridInstance().beginCustomLoading("Updating")

    // const tempSelectedKeys = [...SelectedItemKeys]
    // SetSelectedItemKeys(e.selectedRowsData.map(x => x.Id))

    // try {

    //   if (e.currentSelectedRowKeys.length === 1) {

    //     await ProcessAddFileItems(e.currentSelectedRowKeys)
    //   } else if (e.currentSelectedRowKeys.length > 1) {
    //     SetSelectedItemKeys(tempSelectedKeys)
    //   }
    //   if (e.currentDeselectedRowKeys.length === 1) {
    //     await ProcessRemoveFileItems(e.currentDeselectedRowKeys)
    //   } else if (e.currentDeselectedRowKeys.length > 1) {
    //     SetSelectedItemKeys(tempSelectedKeys)
    //   }
    // } catch (err) {
    //   SetSelectedItemKeys(tempSelectedKeys)
    // } finally {
    //   GetGridInstance().endCustomLoading()
    //   SetGridStateEnabled(true)

    // }

  }



  //row dragged event
  const onAddAll = (e) => {
    // var temp = gseData
    // temp.push(e.itemData)
    // setGseData(temp)

    // refreshGrids("allGseGrid")
  }
  const onRemoveAll = (e) => {
    // let temp = gseData
    // const foundItemIndex = temp.findIndex(x => x.Id === e.itemData.Id)
    // temp.splice(foundItemIndex, 1)
    // setGseData(temp)

    // refreshGrids("allGseGrid")
  }

  const onAddSelected = (e) => {
    var values = e.itemData;


    var temp = [...TPSExecutionDocuments]
    temp.push({
      TPSDocumentTemplateId: values.Id

    })
    SetTPSExecutionDocuments(temp)

  }
  const onRemoveSelected = (e) => {
    var temp = [...TPSExecutionDocuments]
    const foundItemIndex = temp.findIndex(x => x.TPSDocumentTemplateId == e.itemData.Id)
    temp.splice(foundItemIndex, 1)
    SetTPSExecutionDocuments(temp)

  }
  const onAddSelectedSteps = (e) => {
    console.log("onAddSelectedSteps")
    console.log(e.itemData)
    var temp = [...TPSStepDocuments]
    temp.push({
      TPSDocumentTemplateId: e.itemData.Id
      , SelectedSteps: [1, 2, 3]
    })
    SetTPSStepDocuments(temp)

  }
  const onRemoveSelectedSteps = (e) => {
    console.log("onRemoveSelectedSteps")
    console.log(e.itemData)
    var temp = [...TPSStepDocuments]
    const foundItemIndex = temp.findIndex(x => x.TPSDocumentTemplateId == e.itemData.Id)
    temp.splice(foundItemIndex, 1)
    SetTPSStepDocuments(temp)
  }

  const refreshGrids = (gridId) => {
    const gridElement = document.getElementById(gridId)
    const gridInstance = DxGrid.getInstance(gridElement)
    if (gridInstance)
      gridInstance.refresh();
  }

  const CellRenderDocName = (cellData) => {
    return (
      <React.Fragment>
        <a target="_blank" href={`${cellData.data.LinkingUrl}`}>{cellData.text}</a>
      </React.Fragment>
    );
  }
  const CellRenderSelectedSteps = (cellData) => {
    return (
      <React.Fragment>
        <span></span>
        <div>
          <Button className="commandButton"
            text={`Selected Steps: ${TPSStepDocuments && TPSStepDocuments.find(x => x.TPSDocumentTemplateId == cellData.data.Id) && TPSStepDocuments.find(x => x.TPSDocumentTemplateId == cellData.data.Id).SelectedSteps.join(", ")}`}
            type="default"
            stylingMode="contained"
            onClick={(e) => SetSelectedSteps(e, cellData.data.Id)}
          />
        </div>
      </React.Fragment>
    );
  }

  const SetSelectedSteps = (e, documentTemplateId) => {
    SetSelectedDocumentId(documentTemplateId);
    SetpopupVisible(true);
    // const relatedTpsStepDoc = TPSStepDocuments.find(x => x.TPSDocumentTemplateId == documentTemplateId)
  }

  const StepSelectorCallback=(SelectedTPSSteps)=>{
      //set selected Steps for selected document id
      const xx = DocumentSetFilesSelectedToStep
      const relatedTpsStepDoc = TPSStepDocuments.find(x => x.TPSDocumentTemplateId == SelectedDocumentId)
      SetpopupVisible(false);
  }

  return (
    <React.Fragment>
      <div className="dvoGridPanel"><h3>Unassigned Documents</h3>
        <div>{GetTemplateDocumentsGrid()}</div></div>

      {/* <div>{GetStepWorkingDocumentsGrid()}</div> */}
      <div className="dvoGridPanel"><h3>Assigned to TPS Execution</h3>
        <div>{GetTPSExecutionWorkingDocumentsGrid()}</div>
      </div>


      <div className="dvoGridPanel"><h3>Assigned to TPS Steps</h3>
        <div>{GetStepWorkingDocumentsGrid()}</div>
      </div>

      {/* <div>
        {DocumentSetFilesSelectedToStep.map(x =>
          <div key={x.Id}>
            {x.Id}
          </div>
        )}
      </div> */}
      <div>
        {GetTPSStepsGrid()}
      
      </div>
      

      <Popup
          key={SelectedDocumentId}
          visible={popupVisible}
          onHiding={() => SetpopupVisible(false)}
          dragEnabled={true}
          closeOnOutsideClick={true}
          showTitle={true}
          title="Set Selected Steps"
          width={600}
          height={700}
        >

          <StepSelecector IsReadOnly={IsReadOnly} setStepsCallback={StepSelectorCallback} tpsid={tpsid}/>
        </Popup>


    </React.Fragment>
  );
}
