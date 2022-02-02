import './App.css';
import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
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
  getQueryStringParameterByName,
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
import StepSelecector from './StepSelector';
import DocumentSummary from './DocumentSummary';
import TPSDocumentAssignment from './TPSDocumentAssignment';
import { Accordion, Item } from 'devextreme-react/accordion';
import AutoAssignTPSDocumentAssignment from './AutoAssignTPSDocumentAssignment';

// function App({ tpsid, stepid, paramExecutionid, viewPage }) {
function App() {

  // const [DocumentSetFiles, SetDocumentSetFiles] = useState([]);
  // const [SelectedItemKeys, SetSelectedItemKeys] = useState([]);
  // const [SelectedItems, SetSelectedItems] = useState([]);
  // const [ExistingTpsStepDocuments, SetExistingTpsStepDocuments] = useState([]);
  // const [GridStateEnabled, SetGridStateEnabled] = useState(true);
  // const [TPSStepData, SetTPSStepData] = useState({});
  // const [TPSData, SetTPSData] = useState({});
  // const [ExecutionData, SetExecutionData] = useState();

  // const [currentUser, setCurrentUser] = useState();
  // const [currentUserGroups, setCurrentUserGroups] = useState([]);
  // const [IsReadOnly, SetIsReadOnly] = useState(true);
  // const [tpsReadOnlyState, settpsReadOnlyState] = useState("not set");


  const [TpsIdParam, SetTpsIdParam] = useState();
  const [StepsKey, SetStepsKey] = useState(1);
  const [TPSKey, SetTPSKey] = useState(1);


  const GridId = "DocumentSetFilesGrid"
  const location = useLocation();
  console.debug(location.pathname);
  let selectInitRunning = false;

  let history = useHistory();
  useEffect(() => {
    // SetNavigation()
    const tpsidparam = getQueryStringParameterByName("TpsID")
    SetTpsIdParam(tpsidparam);
  }, []);

  // useEffect(() => {
  //   CalcIsReadOnly();
  // }, [TPSData]);

  // const CalcIsReadOnly = async () => {
  //   const usr = await GetCurrentUser();
  //   const userGroups = await GetUsersGroups(usr.Id)
  //   let tempTpsReadOnlyState = ""
  //   setCurrentUserGroups(userGroups)
  //   setCurrentUser(usr)
  //   const foundEditorGroup = currentUserGroups.find(x => x.Title === ETPS_Editor_GroupId)

  //   if (TPSData.TPS_x0020_Status === ETPS_Tps_Status_Accepted || TPSData.TPS_x0020_Status === ETPS_Tps_Status_Closed) {
  //     // settpsReadOnlyState("readonly")
  //     tempTpsReadOnlyState = "readonly"
  //   } else if (usr && usr.Id === TPSData.EditorId) {
  //     // settpsReadOnlyState("open")
  //     tempTpsReadOnlyState = "open"
  //   } else if (foundEditorGroup) {
  //     tempTpsReadOnlyState = "open"
  //   }
  //   settpsReadOnlyState(tempTpsReadOnlyState)
  //   SetIsReadOnly(tempTpsReadOnlyState != "open")

  // }

  // const SetNavigation = () => {
  //   if (viewPage === "StepExecution" && location.pathname !== "/StepExecution") {
  //     history.push("/StepExecution")
  //   } else if (viewPage === "SelectTPSDocuments" && location.pathname !== "/SelectTPSDocuments") {
  //     history.push("/SelectTPSDocuments")
  //   }
  // }
  const accordionContentReady = (e) => {
    if (e.component.option().items.length > 0) {
      //  e.component.collapseItem(0)
    }
  }

  const SetDirtyCallback = (e) => {
    if (e === "TPS") {
      SetStepsKey(StepsKey + 1)
    } else if (e === "Step") {
      SetTPSKey(TPSKey + 1)
    }
  }

  if (!TpsIdParam) {
    return (<div>Missing TPSId Query String Parameter</div>)
  }
  return (
    <React.Fragment>
      <Router>
        <Switch>
          {/* <Route path="/StepExecution">
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
          </Route> */}
          {/* <Route path="/NotesEditor">
            <StepExecutionNotesEditor notesText="fdf dfjdkslafjdsal;f jdasfldjafk;"/>
          </Route> */}

          <Route path="/">
            {/* <StepSelecector tpsid="340"/> */}
            {/* {TPSKey} - {StepsKey} */}
              {/* <AutoAssignTPSDocumentAssignment key={TPSKey} tpsid={TpsIdParam} IsAllocationTypeStep={false} SetDirtyCallback={() => SetDirtyCallback("TPS")} /> */}
            <div className="dvoGridPanel">
              <TPSDocumentAssignment key={TPSKey} RemoveItemOnUnselect={true} tpsid={TpsIdParam} IsAllocationTypeStep={false} SetDirtyCallback={() => SetDirtyCallback("TPS")} />


              <div className="dvoGridPanel Alternate">
                <TPSDocumentAssignment key={StepsKey} tpsid={TpsIdParam} RemoveItemOnUnselect={true} IsAllocationTypeStep={true} SetDirtyCallback={() => SetDirtyCallback("Step")} />
              </div>

              <div><DocumentSummary tpsid={TpsIdParam} /></div>
            </div>

          </Route>
        </Switch>
      </Router>
    </React.Fragment>


  );
}

export default App;
