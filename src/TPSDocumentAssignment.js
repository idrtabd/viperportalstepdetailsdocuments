import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import './App.css';
import React, { useState, useEffect, useContext } from "react";
import SelectBox from 'devextreme-react/select-box';
// import { Button as DxReactButton } from "devextreme-react/button";
import { Button } from 'devextreme-react/button';
import DataGrid, {
    Column,
    SearchPanel,
    Selection,
    ColumnChooser,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import {
    REACT_APP_RESTURL_SPWEBURL,
    loadSpRestCall,
    UpdateSPListItemGeneric,
} from "./MyUtils"
import { Accordion, Item } from 'devextreme-react/accordion';
import { DOC_ALLOC_STEP, DOC_ALLOC_TPS } from './ConstantStrings';

export default function TPSDocumentAssignment({ tpsid, IsAllocationTypeStep, SetDirtyCallback, RemoveItemOnUnselect }) {

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

    //ConfigureDocumentsShowDebug
    const runConfig = window['runConfig']
    const ConfigureDocumentsShowDebug = runConfig && runConfig.ConfigureDocumentsShowDebug
    const CreateDocumentsFromTemplate_SelectAStepText = runConfig && runConfig.CreateDocumentsFromTemplate_SelectAStepText


    useEffect(() => {
        if (!tpsid) {
            return;
        }


        if (IsAllocationTypeStep) {
            SetAllocationType(DOC_ALLOC_STEP)
        } else {
            SetAllocationType(DOC_ALLOC_TPS)
        }
        LoadPageData();
    }, [tpsid]);

    function PrettyPrint(props) {
        return <pre>{JSON.stringify(props.jsonObj, null, 1)}</pre>
    }

    const LoadPageData = async () => {

        SetSelectedStepData(null)
        SetSelectedRowKeysData(null)

        const allStepsResult =
            await loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('Draft - TPS Steps')/Items?$select=Id,Step_x0020_Procedure,Step&$orderby=Step&$filter=TPSLookupId eq ${tpsid}`)
        allStepsResult.forEach(x => x.Title = `${x.Step} - ${x.Step_x0020_Procedure}`)
        SetDefaultSelectedStepKey(0)
        //SetSelectedStepData(AllStepsData && allStepsResult.length && allStepsResult[0])

        allStepsResult.splice(0, 0,
            {
                Id: 0
                , Title: CreateDocumentsFromTemplate_SelectAStepText
            })
        SetAllStepsData(allStepsResult);
        //SetSelectedStepData(allStepsResult && allStepsResult[0])

        // debugger
        const queryTemplateFolder = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPSDocumentTemplates')/items?`
            + `$expand=Folder&$select=Folder/Name,Folder/ServerRelativeUrl,Folder/ItemCount,DocAllocData,Id,TPSReference0Id&$filter=TPSReference0Id eq ${tpsid} and startswith(ContentTypeId, '0x0120')`
        const templateFolderResult = await loadSpRestCall(queryTemplateFolder, true);
        SetTPSDocumentTemplateData(templateFolderResult);

        let alocDataParsed = []
        if (templateFolderResult && templateFolderResult.DocAllocData) {
            alocDataParsed = JSON.parse(templateFolderResult.DocAllocData)
            SetSelectedRowKeysData(alocDataParsed.map(x => x.Id))
            SetDocAllocData(alocDataParsed)
        } else {
            SetDocAllocData([]);
        }
        SetTpsDocumentNumber(templateFolderResult && templateFolderResult.Folder && templateFolderResult.Folder.Name)

        //DocAllocData
        const queryAllTemplateDocuments =
            `${REACT_APP_RESTURL_SPWEBURL}/_api/web/GetFolderByServerRelativeUrl('/projects/Viper/ETPS/TPSDocumentTemplates/${templateFolderResult.Folder.Name}')/Files?`
            + `$expand=ListItemAllFields&$select=ListItemAllFields/Id,ListItemAllFields/AuthorId,ListItemAllFields/EditorId,Name,Title,UIVersionLabel`
        const resultsAllTemplateDocuments = await loadSpRestCall(queryAllTemplateDocuments)
        resultsAllTemplateDocuments.forEach(x => {
            x.IsSelected = false
            x.Id = x.ListItemAllFields.Id
            x.AssignedToStep = null;
            x.AssignedToStepNumber = null;

        })

        //If IsAllocationTypeStep, Then set AssignedToStepNumber value from alocDataParsed
        alocDataParsed.forEach(a => {
            //find template doc item by id
            const foundTemplateDoc = resultsAllTemplateDocuments.find(x => x.Id === a.Id && a.Type === "Step")
            if (foundTemplateDoc) {
                foundTemplateDoc.AssignedToStep = a.StepId
                foundTemplateDoc.AssignedToStepNumber = a.StepNumber
            }
        })

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


        const queryAllExecutions = `${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('TPS Executions')/Items?$select=Id, Title&$filter=TPSLookupId eq ${tpsid}`
        const resultExecutions = await loadSpRestCall(queryAllExecutions);
        SetExecutionsData(resultExecutions);
    }

    const SelectionChanged = (e) => {
        const { selectedRowsData, currentSelectedRowKeys, currentDeselectedRowKeys } = e;
        const tempDocs = [...TemplateDocs]


        if (SelectedStepData && SelectedStepData.Id === 0) {
            notify("Select a step first using the dropdown control.", "error", 6000)
            return;
        } else if (!SelectedStepData && currentDeselectedRowKeys.length > 0) {

        }
        console.log(selectedRowsData)
        const tempDocAllocData = [...DocAllocData]

        if (SelectedStepData) {
            //Process Added Items
            selectedRowsData.forEach(x => {
                const existsItem = DocAllocData.find(d => d.Id === x.Id && d.Type == allocationType)
                if (!existsItem) {
                    if (IsAllocationTypeStep) {

                        tempDocAllocData.push({
                            Id: x.Id
                            , Type: allocationType
                            , StepId: SelectedStepData.Id
                            , StepNumber: SelectedStepData.Step
                        })

                    } else {
                        tempDocAllocData.push({ Id: x.Id, Type: allocationType })

                    }
                }
            })

            currentSelectedRowKeys.forEach(x => {
                const foundDocItem = tempDocs.find(t => t.Id == x)
                if (foundDocItem) {

                    foundDocItem.AssignedToStep = SelectedStepData.Id
                    foundDocItem.AssignedToStepNumber = SelectedStepData.Step
                }
            })
        }





        currentDeselectedRowKeys.forEach(x => {
            const foundDocItem = tempDocs.find(t => t.Id == x)
            if (foundDocItem) {

                foundDocItem.AssignedToStep = null
                foundDocItem.AssignedToStepNumber = null
            }
        })
        SetTemplateDocs(tempDocs);

        //Process Removed Items
        currentDeselectedRowKeys.forEach(x => {

            if (RemoveItemOnUnselect) {

                const existsItemIndex = tempDocAllocData.findIndex(d => d.Id === x && d.Type == allocationType)
                if (existsItemIndex >= 0) {
                    tempDocAllocData.splice(existsItemIndex, 1)
                }
            } else if (IsAllocationTypeStep) {
                const otherCategoryKey = IsAllocationTypeStep ? "TPS" : "Step";
                const itemRemoved = tempDocAllocData.find(d => d.Id === x && d.Type == allocationType)
                itemRemoved.Type = otherCategoryKey;
            } else {
                console.error("No case for not RemoveItemOnUnselect and not IsAllocationTypeStep")
            }
        })

        SetDocAllocData(tempDocAllocData);
        SetSelectedRowKeysData(tempDocAllocData.map(x => x.Id))
        //SaveDocAllocData();
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
                
                    <div className="">

                        <SelectBox dataSource={AllStepsData}
                            key={DefaultSelectedStepKey}
                            displayExpr="Title"
                            valueExpr="Id"
                            //width="800"
                            defaultValue={DefaultSelectedStepKey}
                            onValueChanged={StepSelectBoxValueChanged}
                        />
                    </div>
                
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
    const GetDebugAccordion = () => {
        if (ConfigureDocumentsShowDebug) {
            return (
                <>
                    <Accordion
                        collapsible={true}
                        multiple={false}
                        animationDuration={500}
                        onContentReady={accordionContentReady}
                    >
                        <Item title="Unavailable Items">
                            These Items are unvailable for selection because they are already assigned to the <b>{IsAllocationTypeStep ? "TPS" : "Step"}</b> - Level
                            <DataGrid
                                dataSource={ItemsSelectedInOtherCategoryData}
                                hoverStateEnabled={true}
                                showBorders={true}
                                allowColumnResizing={true}
                                columnResizingMode={"widget"}
                                columnAutoWidth={true}
                                allowColumnReordering={true}
                                rowAlternationEnabled={false}
                                height="95%"
                                id="TPSDocumentAssignmentGridNotSelectedItems"
                                selectedRowKeys={SelectedRowKeysData}
                                keyExpr="Id"
                            >
                                <ColumnChooser enabled={false} />
                                <Column dataField="ListItemAllFields.Id" caption="Id" visible={false} />
                                <Column dataField="Name" />
                                <Column dataField="Title" visible={false} />
                                <Column dataField="AssignedToStepNumber" visible={!IsAllocationTypeStep} />
                                <Column dataField="UIVersionLabel" caption="Version" />
                            </DataGrid>
                        </Item>
                        <Item title="Debug Data">
                            <div className="dvoGridPanel">
                                <a target="_blank" href={`https://ea.sp.jsc.nasa.gov/projects/Viper/ETPS/TPSDocumentTemplates/${TpsDocumentNumber}`}>Document Set Properties to Apply</a>
                                <PrettyPrint jsonObj={DocAllocData} />
                                {/* {JSON.stringify(DocAllocData)} */}
                            </div>
                        </Item>
                    </Accordion>
                </>
            )
        }
    }

    return (
        <>


            <div className="dvoGridPanel">
                <div className="Panel">
                    <a target="_blank" href={`${runConfig && runConfig.spHostUrl}/${TPSDocumentTemplateData && TPSDocumentTemplateData.Folder.ServerRelativeUrl}`}>{runConfig && runConfig.AddRemoveTemplateDocumentsText}</a>
                </div>
                <div className="Panel">

                <span className="labelSmall">Select Items to Assign to the {allocationType} - Level</span>
                {GetStepDropDownComponent()}
                </div>
                {/* {GetSelectedStepSummary()} */}

                <div className="Panel">

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
                        onSelectionChanged={SelectionChanged}
                        id="TPSDocumentAssignmentGrid"
                        selectedRowKeys={SelectedRowKeysData}
                        keyExpr="Id"
                    >
                        <Selection mode="multiple" />
                        {/* <SearchPanel visible={true} /> */}
                        <ColumnChooser enabled={false} />
                        <Column dataField="AssignedToStepNumber" caption="Step" />
                        <Column dataField="Name" />
                        <Column dataField="ListItemAllFields.Id" caption="Id" visible={false} />
                        <Column dataField="Title" visible={false} />
                        <Column dataField="UIVersionLabel" caption="Version" visible={false} />
                    </DataGrid>
                </div>
                <div className="Panel">


                    <Button
                        className="commandButton"
                        width={110}
                        text={`Save`}
                        onClick={(e) => { SaveDocAllocData() }}
                        type="success"
                        stylingMode="outlined"
                    />
                    <Button
                        className="commandButton"
                        width={110}
                        text={`Clear All`}
                        onClick={(e) => { ClearDocAllocData() }}
                        type="danger"
                        stylingMode='outlined'
                    />
                </div>

            </div>

        </>
    )
}