import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom";
import { render } from "react-dom";
import App from "./App";
import { BrowserRouter, HashRouter, Switch, Route } from "react-router-dom";
import Store from "./Store";
const Index = () => {
  return (
    <React.Fragment>
      <div className="mainPanel">
        <Store>
          <HashRouter>
              <App />
          </HashRouter>
        </Store>
      </div>
    </React.Fragment>
  );
};
render(<Index />, document.getElementById("root"));