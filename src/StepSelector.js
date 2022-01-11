import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import './App.css';
import React, { useState, useEffect, useContext } from "react";
import List, { ItemDragging } from 'devextreme-react/list';
import { Button } from 'devextreme-react/button';

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

// import { Button } from 'devextreme-react/button';
// import notify from "devextreme/ui/notify";

export default function StepSelecector({ tpsid, IsReadOnly, setStepsCallback }) {

    const [TPSSteps, SetTPSSteps] = useState([]);
    const [SelectedTPSSteps, SetSelectedTPSSteps] = useState([]);
    const [NotSelectedTPSSteps, SetNotSelectedTPSSteps] = useState([]);

    useEffect(() => {
        LoadPageData();

    }, []);

    const GetStateData = () => {
        return {
            NotSelectedTPSSteps
            , SelectedTPSSteps
        }
    }

    const GetSetStateData = () => {
        const d = new Map();
        d.set("NotSelectedTPSSteps", (val) => SetNotSelectedTPSSteps(val))
        d.set("SelectedTPSSteps", (val) => SetSelectedTPSSteps(val))
        return d;
    }
    const LoadPageData = async () => {
        const result = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/Lists/GetByTitle(%27Draft - TPS Steps%27)/Items?%24select=Id,Step_x0020_Procedure,Step&%24orderby=Step&%24filter=TPSLookupId eq ${tpsid}`)
        result.forEach(x => x.Title = `${x.Step} - ${x.Step_x0020_Procedure}`);

        SetTPSSteps(result);
        SetNotSelectedTPSSteps(result);
    }

    function onDragStart(e) {
        //  e.itemData = GetStateData[e.fromData][e.fromIndex];
    }
    function onAdd(e, gridType) {


        if (gridType == "NotSelectedTPSSteps") {
            //adding to Not Selected Steps
            let tempSteps = [...NotSelectedTPSSteps];
            const movedItem = SelectedTPSSteps[e.fromIndex];
            tempSteps.push(movedItem)
            tempSteps = tempSteps.sort((a, b) => { return a.Step < b.Step ? -1 : 1 })

            SetNotSelectedTPSSteps(tempSteps);

            tempSteps = [...SelectedTPSSteps]
            tempSteps.splice(e.fromIndex, 1);
            tempSteps = tempSteps.sort((a, b) => { return a.Step < b.Step ? -1 : 1 })
            SetSelectedTPSSteps(tempSteps);

        } else if (gridType == "SelectedTPSSteps") {
            //adding to Selected Steps
            let tempSteps = [...SelectedTPSSteps];
            const movedItem = NotSelectedTPSSteps[e.fromIndex];
            tempSteps.push(movedItem)
            tempSteps = tempSteps.sort((a, b) => { return a.Step < b.Step ? -1 : 1 })
            SetSelectedTPSSteps(tempSteps);

            tempSteps = [...NotSelectedTPSSteps]
            tempSteps.splice(e.fromIndex, 1);
            tempSteps = tempSteps.sort((a, b) => { return a.Step < b.Step ? -1 : 1 })
            SetNotSelectedTPSSteps(tempSteps);

        }

    }
    function onRemove(e, gridType) {
        return
        debugger
        const steps = GetStateData()[e.fromData];
        const setState = GetSetStateData().get(e.toData);
        setState({
            [e.fromData]: [...steps.slice(0, e.fromIndex), ...steps.slice(e.fromIndex + 1)]
        });
    }
    function onReorder(e) {
        onRemove(e);
        onAdd(e);
    }

    return (
        <>
            <div className="commandRow">
                <Button className="commandButton"
                    text={`Save`}
                    type="default"
                    stylingMode="contained"
                    onClick={(e) => {setStepsCallback(SelectedTPSSteps)}}
                />
            </div>
            <div className="widget-container">
                <List
                    dataSource={NotSelectedTPSSteps}
                    keyExpr="Id"
                    displayExpr="Title"
                    repaintChangesOnly={true}>
                    <ItemDragging
                        allowReordering={false}
                        group="steps"
                        data="NotSelectedTPSSteps"
                        onDragStart={onDragStart}
                        onAdd={(e) => onAdd(e, "NotSelectedTPSSteps")}
                        onRemove={(e) => onRemove(e, "NotSelectedTPSSteps")}>
                    </ItemDragging>
                </List>
                <List
                    dataSource={SelectedTPSSteps}
                    keyExpr="Id"
                    displayExpr="Title"
                    repaintChangesOnly={true}>
                    <ItemDragging
                        allowReordering={false}
                        group="steps"
                        data="SelectedTPSSteps"
                        onDragStart={onDragStart}
                        onAdd={(e) => onAdd(e, "SelectedTPSSteps")}
                        onRemove={(e) => onRemove(e, "SelectedTPSSteps")}>
                    </ItemDragging>
                </List>
            </div>
        </>
    )
}