import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

function loadMyReactComponent() {
  document.querySelectorAll(".renderReactStepDetailsDocuments").forEach(domContainer => {
    const xxx = 2
    const dataParamtpsId = domContainer.dataset.tpsid
    const dataParamstepId = domContainer.dataset.stepid
    const dataParamexecutionid = domContainer.dataset.executionid
    ReactDOM.render(<App stepid={dataParamstepId} tpsid={dataParamtpsId} executionid={dataParamexecutionid} />, domContainer)
  })
}

window.addEventListener("DOMContentLoaded", (event) => {
  loadMyReactComponent();
})
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
