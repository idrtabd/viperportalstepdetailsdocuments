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
import CreateDocumentsFromTemplate from './CreateDocumentsFromTemplate';
import TPSExecutionSummary from './TPSExecutionSummary';
import TPSExecutionStepDocuments from './TPSExecutionStepDocuments';

function App({ IsStepView, stepid }) {

  const [TpsIdParam, SetTpsIdParam] = useState();
  const [TpsExeIDParam, SetTpsExeIDParam] = useState();
  const [StepsKey, SetStepsKey] = useState(1);
  const [TPSKey, SetTPSKey] = useState(1);
  const [TpsDocumementsRefreshedFlag, SetTpsDocumementsRefreshedFlag] = useState(1);
  const [RunConfigSeconds, SetRunConfigDataSeconds] = useState(5);
  const [RunConfigData, SetRunConfigData] = useState();
  const [TpsReadOnly, SetTpsReadOnly] = useState(true);

  const GridId = "DocumentSetFilesGrid"
  const location = useLocation();
  console.debug(location.pathname);
  let selectInitRunning = false;

  let history = useHistory();
  useEffect(() => {
    console.log(`TPS Key Changed to ${TPSKey}`)
  }, [TPSKey]);

  useEffect(() => {
    SetTpsIdParam(getQueryStringParameterByName("TpsID"));
    SetTpsExeIDParam(getQueryStringParameterByName("TpsExeID"));
    const runConfig = window['runConfig']
    SetRunConfigData(runConfig);

    if (runConfig && runConfig.refreshSeconds > 5) {
      SetRunConfigDataSeconds(runConfig.refreshSeconds)
    }

    pollTpsKey(runConfig.refreshSeconds);


  }, []);

  const pollTpsKey = (sec) => {
    setTimeout(() => {
      console.log("incrementing refresh key")
      const newTpsKeyVal = new Date().toISOString();
      SetTPSKey(newTpsKeyVal)
      console.log(`Updating TPS Key to ${newTpsKeyVal}`)

      pollTpsKey(sec);
    }, (sec * 1000));
  }

  const SetDirtyCallback = (e) => {
    if (e === "TPS") {
      SetStepsKey(StepsKey + 1)
    } else if (e === "Step") {
      SetTPSKey(TPSKey + 1)
    }
  }

  const SetRefreshFlag = () => {
    SetTpsDocumementsRefreshedFlag(TpsDocumementsRefreshedFlag + 1)
  }

  if (!TpsIdParam) {
    return (<div>Missing TPSId Query String Parameter</div>)
  }

  const GetRootPath = () => {
    if (IsStepView) {
      return (
        <TPSExecutionStepDocuments stepid={stepid} TPSKey={TPSKey} tpsid={TpsIdParam} TpsExeID={TpsExeIDParam} refreshFlag={TpsDocumementsRefreshedFlag} />
      )
    } else {
      return (
        <div className="Panel SPLeftAligned">
          <CreateDocumentsFromTemplate showOutput={RunConfigData && RunConfigData.CreateDocumentsFromTemplateShow} tpsid={TpsIdParam} TpsExeID={TpsExeIDParam} targetLibraryServerRelUrl={'/projects/Viper/ETPS/TPSStepDocuments'} SetRefreshFlag={SetRefreshFlag} />
          <TPSExecutionSummary TPSKey={TPSKey} tpsid={TpsIdParam} TpsExeID={TpsExeIDParam} refreshFlag={TpsDocumementsRefreshedFlag} />
        </div>
      )
    }
  }

  return (
    <React.Fragment>
      <div className='debug'>Is Step View: {IsStepView && IsStepView.toString()}</div>
      <div className='debug'>Step ID: {stepid}</div>
      <Router>
        <Switch>
          <Route path="/ConfigureDocuments">
            {/* <TPSDocumentAssignment key={TPSKey} RemoveItemOnUnselect={true} tpsid={TpsIdParam} IsAllocationTypeStep={false} SetDirtyCallback={() => SetDirtyCallback("TPS")} /> */}
            <div className="">
              <TPSDocumentAssignment key={StepsKey} TpsExeID={TpsExeIDParam} tpsid={TpsIdParam} RemoveItemOnUnselect={true} IsAllocationTypeStep={true} SetDirtyCallback={() => SetDirtyCallback("Step")} />
            </div>
            {/* <div><DocumentSummary tpsid={TpsIdParam}  /></div> */}
          </Route>


          <Route path="/">
            {GetRootPath()}
          </Route>
        </Switch>
      </Router>

    </React.Fragment>


  );
}

export default App;
