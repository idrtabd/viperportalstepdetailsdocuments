import React, { useState } from "react";

export const SiteUsersContext = React.createContext([]);
export const TPSExecutionDataContext = React.createContext([]);
export const RuntimeConfigStaticStringsContext = React.createContext();
export const SecurityConfigContext = React.createContext();

const Store = ({ children }) => {
  const [siteUsersData, setsiteUsersData] = useState([]);
  const [TPSExecutionData, setTPSExecutionData] = useState({ TpsID: null, TpsRevision: null, TpsExeID: null });
  const [RuntimeConfigStaticStringsData, SetRuntimeConfigStaticStringsData] = useState();
  const [SecurityConfigData, SetSecurityConfigData] = useState();


  return (
    <SecurityConfigContext.Provider value={[SecurityConfigData, SetSecurityConfigData]}>
      <RuntimeConfigStaticStringsContext.Provider value={[RuntimeConfigStaticStringsData, SetRuntimeConfigStaticStringsData]}>
        <TPSExecutionDataContext.Provider value={[TPSExecutionData, setTPSExecutionData]}>
          <SiteUsersContext.Provider value={[siteUsersData, setsiteUsersData]}>{children}</SiteUsersContext.Provider>
        </TPSExecutionDataContext.Provider>
      </RuntimeConfigStaticStringsContext.Provider>
    </SecurityConfigContext.Provider>
  );
};

export default Store;
