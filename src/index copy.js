import React from 'react';
import { BrowserRouter, HashRouter, Switch, Route } from "react-router-dom";
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

function loadMyReactComponent() {
  document.querySelectorAll(".renderReactStepDetailsDocuments").forEach(domContainer => {
    const dataParamtpsId = domContainer.dataset.tpsid
    const dataParamstepId = domContainer.dataset.stepid
    const dataParamexecutionid = domContainer.dataset.executionid
    const dataParamviewpage = domContainer.dataset.viewpage
    ReactDOM.render(
      <HashRouter>
        {/* <App stepid={dataParamstepId} tpsid={dataParamtpsId} paramExecutionid={dataParamexecutionid} viewPage={dataParamviewpage} /> */}
        <App tpsid={dataParamtpsId} />
      </HashRouter>, domContainer
    )
  })
}

window.addEventListener("DOMContentLoaded", (event) => {
  loadMyReactComponent();
})

