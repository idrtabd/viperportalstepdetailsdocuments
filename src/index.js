import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom";
import { render } from "react-dom";
import App from "./App";
import { BrowserRouter, HashRouter, Switch, Route } from "react-router-dom";
import Store from "./Store";
const Index = ({IsStepView, stepid}) => {
  return (
    <React.Fragment>
      <div className="mainPanel">
        <Store>
          <HashRouter>
              <App IsStepView={IsStepView} stepid={stepid} />
          </HashRouter>
        </Store>
      </div>
    </React.Fragment>
  );
};

function loadMainReactComponent() {
  var elementRoot = document.getElementById("root-etpsdocumentsreactapp");
  if(elementRoot){

    ReactDOM.render(<Index />, elementRoot)
  }
}

function loadReactComponentPerStepDiv() {
  document.querySelectorAll(".renderReactStepDetailsDocuments").forEach(domContainer => {
    const dataParamstepId = domContainer.dataset.stepid
    ReactDOM.render(
      <HashRouter>
        <Index  IsStepView={true} stepid={dataParamstepId} />
      </HashRouter>, domContainer
    )
  })
}

window.addEventListener("DOMContentLoaded", (event) => {
  loadMainReactComponent();
  loadReactComponentPerStepDiv();
})