import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import './App.css';
import React, { useState, useEffect, useContext } from "react";
import List, { ItemDragging } from 'devextreme-react/list';
import DropDownBox from 'devextreme-react/drop-down-box';
import SelectBox from 'devextreme-react/select-box';
// import { Button as DxReactButton } from "devextreme-react/button";
import { Button } from 'devextreme-react/button';
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
import notify from "devextreme/ui/notify";
import DxGrid from 'devextreme/ui/data_grid'
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
import { Accordion, Item } from 'devextreme-react/accordion';

// import { Button } from 'devextreme-react/button';
// import notify from "devextreme/ui/notify";

export default function AutoAssignTPSDocumentAssignment({ tpsid, IsAllocationTypeStep, SetDirtyCallback }) {

    const [TemplateDocs, SetTemplateDocs] = useState([]);
    const [TPSDocumentTemplateData, SetTPSDocumentTemplateData] = useState();
    const [TPSDocumentTemplateDataNotFiltered, SetTPSDocumentTemplateDataNotFiltered] = useState();
    const [ItemsSelectedInOtherCategoryData, SetItemsSelectedInOtherCategoryData] = useState([]);
    const [TpsDocumentNumber, SetTpsDocumentNumber] = useState();
    const [DocAllocData, SetDocAllocData] = useState();
    const [ExecutionsData, SetExecutionsData] = useState([]);
    const [SelectedRowKeysData, SetSelectedRowKeysData] = useState([]);
    const [AllStepsData, SetAllStepsData] = useState([]);
    const [allocationType, SetAllocationType] = useState([]);
    const [DefaultSelectedStepKey, SetDefaultSelectedStepKey] = useState();
    const [SelectedStepData, SetSelectedStepData] = useState();


    useEffect(() => {
        if (!tpsid) {
            return;
        }


        if (IsAllocationTypeStep) {
            SetAllocationType("Step")
        } else {
            SetAllocationType("TPS")
        }
        LoadPageData();
    }, [tpsid]);


    useEffect(() => {
        if (!(TemplateDocs && TemplateDocs.length)) { return; }

        ForceSelectAll();
    }, [TemplateDocs]);

    function PrettyPrint(props) {
        return <pre>{JSON.stringify(props.jsonObj, null, 1)}</pre>
    }

    const LoadPageData = async () => {

        SetSelectedStepData(null)
        SetSelectedRowKeysData(null)

        const allStepsResult =
            await loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27Draft - TPS Steps%27)/Items?%24select=Id,Step_x0020_Procedure,Step&%24orderby=Step&%24filter=TPSLookupId eq ${tpsid}`)
        allStepsResult.forEach(x => x.Title = `${x.Step} - ${x.Step_x0020_Procedure}`)
        SetDefaultSelectedStepKey(allStepsResult && allStepsResult[0].Id)
        SetSelectedStepData(AllStepsData && allStepsResult[0])
        SetAllStepsData(allStepsResult);

        // debugger
        const queryTemplateFolder = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27TPSDocumentTemplates%27)/items?`
            + `%24expand=Folder&%24select=Folder%2FName,Folder%2FItemCount,DocAllocData,Id,TPSReference0Id&%24filter=TPSReference0Id eq ${tpsid} and startswith(ContentTypeId, '0x0120')`
        const templateFolderResult = await loadSpRestCall(queryTemplateFolder, true);
        SetTPSDocumentTemplateData(templateFolderResult);

        let alocDataParsed = []
        if (templateFolderResult.DocAllocData && templateFolderResult != "") {
            alocDataParsed = JSON.parse(templateFolderResult.DocAllocData)
            SetSelectedRowKeysData(alocDataParsed.map(x => x.Id))
            SetDocAllocData(alocDataParsed)
        } else {
            SetDocAllocData([]);
        }
        SetTpsDocumentNumber(templateFolderResult.Folder.Name)

        //DocAllocData
        const queryAllTemplateDocuments =
            `${REACT_APP_RESTURL_SPWEBURL}/_api/web/GetFolderByServerRelativeUrl(%27/projects/Viper/ETPS/TPSDocumentTemplates/${templateFolderResult.Folder.Name}%27)/Files?`
            + `%24expand=ListItemAllFields&%24select=ListItemAllFields%2FId,ListItemAllFields%2FAuthorId,ListItemAllFields%2FEditorId,Name,Title,UIVersionLabel`
        const resultsAllTemplateDocuments = await loadSpRestCall(queryAllTemplateDocuments)
        resultsAllTemplateDocuments.forEach(x => {
            x.IsSelected = false
            x.Id = x.ListItemAllFields.Id
            x.AssignedToStep = null;
            x.AssignedToStepNumber = null;

        })

        //If IsAllocationTypeStep, Then set AssignedToStepNumber value from alocDataParsed
        if (alocDataParsed) {
            alocDataParsed.forEach(a => {
                //find template doc item by id
                const foundTemplateDoc = resultsAllTemplateDocuments.find(x => x.Id === a.Id && a.Type === "Step")
                if (foundTemplateDoc) {
                    foundTemplateDoc.AssignedToStep = a.StepId
                    foundTemplateDoc.AssignedToStepNumber = a.StepNumber
                }
            })
        }

        //remove selected items that are not for this type TPS vs Step
        let externallySelectedItems = [];

        const otherCategoryKey = IsAllocationTypeStep ? "TPS" : "Step";
        const itemsSelectedInOtherCategory = alocDataParsed.filter(x => x.Type === otherCategoryKey)
        itemsSelectedInOtherCategory.map(x => x.Id).forEach(x => {
            const idx = resultsAllTemplateDocuments.findIndex(all => all.Id === x);
            const itemsRemoved = resultsAllTemplateDocuments.splice(idx, 1);
            externallySelectedItems.push(...itemsRemoved)
        })
        SetItemsSelectedInOtherCategoryData(externallySelectedItems);

        SetTemplateDocs(resultsAllTemplateDocuments)


        const queryAllExecutions = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPS Executions')/Items?%24select=Id, Title&%24filter=TPSLookupId eq ${tpsid}`
        const resultExecutions = await loadSpRestCall(queryAllExecutions);
        SetExecutionsData(resultExecutions);
    }

    const ForceSelectAll = (e) => {
        // const { selectedRowsData, currentSelectedRowKeys, currentDeselectedRowKeys } = e;
        // console.log(selectedRowsData)
        const tempDocAllocData = [...DocAllocData]

        //Process Added Items
        // selectedRowsData.forEach(x => {
        TemplateDocs.forEach(x => {
            const existsItem = DocAllocData.find(d => d.Id === x.Id && d.Type == allocationType)
            if (!existsItem) {
                tempDocAllocData.push({ Id: x.Id, Type: allocationType })
            }
        })

        SetDocAllocData(tempDocAllocData);
        SetSelectedRowKeysData(tempDocAllocData.map(x => x.Id))
        
        const secondsDelay = 5;
        notify(`Auto-Saving in all Assignments in ${secondsDelay} seconds`, "Info", 4000)
        setTimeout(() => {
            SaveDocAllocData();
            
        }, secondsDelay * 1000);
    }

    const SaveDocAllocData = () => {
        notify("Saving Assignments", "Info", 4000)
        UpdateSPListItemGeneric("TPSDocumentTemplates",
            {
                Id: TPSDocumentTemplateData.Id
                , DocAllocData: JSON.stringify(DocAllocData)
            })
            .then(x => {
                SetDirtyCallback()
                notify("Assignments Saved", "Success", 4000)
            })
    }
    const ClearDocAllocData = () => {
        notify("Clearing all Assignments", "Info", 4000)
        UpdateSPListItemGeneric("TPSDocumentTemplates",
            {
                Id: TPSDocumentTemplateData.Id
                , DocAllocData: null
            })
            .then(x => {
                LoadPageData().then(x => {
                    SetDirtyCallback()
                    notify("Assignments Cleared", "Success", 4000)
                })
            })
    }


    const StepSelectBoxValueChanged = (e) => {
        const SelectedStep = AllStepsData.find(x => x.Id === e.value)
        SetSelectedStepData(SelectedStep);
    }


    const GetStepDropDownComponent = () => {
        if (IsAllocationTypeStep) {

            return (
                <div className="dvoGridPanel Alternate">
                    <div className="section">

                        <SelectBox dataSource={AllStepsData}
                            key={DefaultSelectedStepKey}
                            displayExpr="Title"
                            valueExpr="Id"
                            //width="800"
                            defaultValue={DefaultSelectedStepKey}
                            onValueChanged={StepSelectBoxValueChanged}
                        />
                    </div>
                </div>
            )
        } else {
            return (<></>);
        }
    }
    const GetSelectedStepSummary = () => {
        if (IsAllocationTypeStep) {

            return (
                <div className="completedText">{SelectedStepData && SelectedStepData.Title.substring(0, 100) + "..."} </div>
            )
        } else {
            return (<></>);
        }
    }

    const accordionContentReady = (e) => {
        if (e.component.option().items.length > 0) {
            e.component.collapseItem(0)
        }
    }

    return (
        <>
            <div className="dvoGridPanel Alternate">
                <h5>Will Auto Assign Template Documents to {allocationType}</h5>
                {/* <span>{SelectedStepData.Title.substring(0,200)} </span> */}

                {/* <div>
                    <Button
                        className="commandButton"
                        width={110}
                        text={`Save`}
                        onClick={(e) => { SaveDocAllocData() }}
                        type="success"
                        stylingMode="contained"
                    />
                    <Button
                        className="commandButton"
                        width={110}
                        text={`Clear All`}
                        onClick={(e) => { ClearDocAllocData() }}
                        type="danger"
                        stylingMode="contained"
                    />
                </div> */}

                <div className="dvoGridPanel">

                    <DataGrid
                        dataSource={TemplateDocs}
                        hoverStateEnabled={true}
                        showBorders={true}
                        allowColumnResizing={true}
                        columnResizingMode={"widget"}
                        columnAutoWidth={true}
                        allowColumnReordering={true}
                        rowAlternationEnabled={true}
                        height="95%"
                        // onSelectionChanged={SelectionChanged}
                        id="TPSDocumentAssignmentGridAuto"
                        selectedRowKeys={SelectedRowKeysData}
                        keyExpr="Id"
                    >
                        <Selection mode="multiple" /> 
                        <SearchPanel visible={true} />
                        <ColumnChooser enabled={false} />
                        <Column dataField="ListItemAllFields.Id" caption="Id" visible={false} />
                        <Column dataField="Name" />
                        <Column dataField="AssignedToStepNumber" visible={IsAllocationTypeStep} />
                        <Column dataField="Title" visible={false} />
                        <Column dataField="UIVersionLabel" caption="Version" />
                    </DataGrid>
                </div>

                <div className="dvoGridPanel">
                    <a target="_blank" href={`https://ea.sp.jsc.nasa.gov/projects/Viper/ETPS/TPSDocumentTemplates/${TpsDocumentNumber}`}>Document Set Properties to Apply</a>
                    <PrettyPrint jsonObj={DocAllocData} />
                    {/* {JSON.stringify(DocAllocData)} */}
                </div>
            </div>
        </>
    )
}