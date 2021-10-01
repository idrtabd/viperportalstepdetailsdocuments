var sprLib = require("sprestlib");


export const ETPS_Tps_Status_Created = 'Created';
export const ETPS_Tps_Status_InCollaboration = 'In Collaboration';
export const ETPS_Tps_Status_RoutedforApproval = 'Routed for Approval';
export const ETPS_Tps_Status_Accepted = 'Accepted';
export const ETPS_Tps_Status_Closed = 'Closed';
export const ETPS_Tps_Status_Revised = 'Revised';
export const ETPS_Tech_GroupId = "ETPS Tech";
export const ETPS_MIP_Authority_GroupId = "ETPS MIP Authority";
export const ETPS_Editor_GroupId = "ETPS Editor";
export const ETPS_Engineering_Step_Verifier_GroupId = "ETPS Engineering Step Verifier";
export const ETPS_Quality_Assurance_GroupId = "ETPS Quality Assurance";
export const ETPS_Certified_Verifier_GroupId = "ETPS Certified Verifier";

export const hostUrl = "https://ea.sp.jsc.nasa.gov";
export const REACT_APP_RESTURL_SPWEBURL = hostUrl + "/projects/Viper/ETPS";

const REACT_APP_RESTURL_SITEUSERS = REACT_APP_RESTURL_SPWEBURL +
    "/_api/web/SiteUserInfoList/items?%24filter=ContentTypeId%20eq%20'0x010A0074236F46CA27854788495BF1A9EEF8F0'%20and%20EMail%20gt%20''%20and%20startswith(Name,'i%3A0%23.w%7Cndc')&%24orderby=Title&%24select=Name,EMail,MobilePhone,Department,Office,JobTitle,Title,Id,WorkPhone&%24top=5000";

const propName = f => /\.([^\.;]+);?\s*\}$/.exec(f.toString())[1]

export const GetFilterTypeOrString = (filterValuesArray) => {
    if (!filterValuesArray) {
        return null;
    }
    let filterClause = ""
    filterValuesArray.forEach(x => {
        filterClause += "or Id eq " + x + " "
    })
    filterClause = filterClause.substring(3).trim()
    return filterClause
}

export const GetCurrentUserAndRoles = () => {
    return new Promise((resolve, reject) => {

        loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/web/currentuser?%24expand=Groups&%24select=*,Groups%2FTitle`, true)
            .then(u => {
                let UserInfo = u;
                UserInfo.Groups = u.Groups.results.map(g => g.Title)
                resolve(UserInfo)
            })
            .catch(e => {
                console.error("Error Getting User Info " + JSON.stringify(e))
            })
    })
}

export const PartsLoadAll = () => {
    return loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle('MEL')/Items?%24top=5000&%24orderby=Title&$expand=ContentType,HardwareType&%24select=*,ContentType/Name,HardwareType/Title`)
}
export const PartsLoadByTPS = (tpsId) => {
    return loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27TPS%20Parts%27)/Items?%24top=5000&$expand=ContentType&%24select=*,ContentType/Name&%24orderby=Line&%24filter=TPSLookupId%20eq%20${tpsId}`)
}


export const GSELoadAll = () => {
    return loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27GSE%27)/Items?%24top=5000&%24orderby=Title`)
}
export const GetTpsData = (tpsid) => {
    return loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27Draft%20-%20TPS%27)/Items(${tpsid})?%24select=*,HardwareType/Title,Author%2FTitle,Author%2FEMail,Author%2FName&%24expand=Author,HardwareType`)
}
export const GSELoadByTps = (tpsid) => {
    return loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/Lists/GetByTitle(%27Draft%20-%20TPS%27)/Items(${tpsid})?%24select=GSEId,TPS_x0020_Status,AuthorId,Author%2FTitle,Author%2FEMail,Author%2FName&%24expand=Author`)
}

export const GetCurrentUser = () => {
    return loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/web/currentuser`)
}

export const GetUsersGroups = (userid) => {
    return loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}/_api/web/getuserbyid(${userid})/Groups?%24select=Title`)
}


export const CreateSPListItemGeneric = (listName, data) => {
    return new Promise((resolve, reject) => {

        delete data.Id
        sprLib.rest({ url: REACT_APP_RESTURL_SPWEBURL + '/_api/contextinfo', type: 'POST' })
            .then(arr => {
                const digest = arr[0].GetContextWebInformation.FormDigestValue
                sprLib.list({ name: listName, baseUrl: REACT_APP_RESTURL_SPWEBURL, requestDigest: digest })
                    .create(data)
                    .then(result => {
                        resolve(result)
                    })
            });
    })
}


export const DeleteSPFile = async (sourcePath) => {
    return new Promise(async (resolve, reject) => {
        const requestDigest = await GetRequestDigestVal()
        await fetch(REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFileByServerRelativeUrl(%27${sourcePath}%27)`
            , {
                "method": "DELETE",
                "headers": {
                    "Content-Type": "application/json",
                    "accept": "application/json;odata=verbose",
                    "X-RequestDigest": requestDigest
                },
                "body": null
            })
        resolve()
    })
}
export const CopySPFile = async (sourcePath, destPath, shouldOverwrite) => {
    return new Promise(async (resolve, reject) => {
        const requestDigest = await GetRequestDigestVal()

        const overwriteVal = shouldOverwrite ? "true" : "false"
        // const copyResults = await fetch(REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFileByServerRelativeUrl(%27${sourcePath}%27)/copyTo(strNewUrl=%27${destPath}%27,bOverWrite=${overwriteVal})`
        const url = REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFileByServerRelativeUrl(@s)/copyTo(strNewUrl=@d,bOverWrite=true)?@s='${sourcePath}'&@d='${destPath}'`
        const copyResults = await fetch(url
            , {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json",
                    "accept": "application/json;odata=verbose",
                    "X-RequestDigest": requestDigest
                },
                "body": null
            })
        const jsonResults = await copyResults.json();
        if (jsonResults.error) {
            reject(jsonResults.error)
        } else {

            //get list item ID and list item data
            const fileInfoJsonSource = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFileByServerRelativeUrl(%27${sourcePath}%27)?%24expand=ListItemAllFields`)
            const fileInfoJsonDest = await loadSpRestCall(REACT_APP_RESTURL_SPWEBURL + `/_api/web/GetFileByServerRelativeUrl(%27${destPath}%27)?%24expand=ListItemAllFields`)

            resolve({
                sourceSPItem: fileInfoJsonSource
                , destinationSPItem: fileInfoJsonDest
            })
        }
    })
}

export const UpdateSPListItemGeneric = (listName, data) => {
    return new Promise((resolve, reject) => {

        sprLib.rest({ url: REACT_APP_RESTURL_SPWEBURL + '/_api/contextinfo', type: 'POST' })
            .then(arr => {
                const digest = arr[0].GetContextWebInformation.FormDigestValue
                sprLib.list({ name: listName, baseUrl: REACT_APP_RESTURL_SPWEBURL, requestDigest: digest })
                    .update(data)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err=>{
                        reject(err)
                    })
            })
            .catch(err=>{
                reject(err)
            })
    })
}
export const UpSertSPListItemGeneric = (listName, data, Id) => {
    return new Promise((resolve, reject) => {
        loadSpRestCall(`${REACT_APP_RESTURL_SPWEBURL}}/_api/Lists/GetByTitle('${listName}')/Items(${Id})?%24select=Id`, true)
            .then(exists => {
                if (exists && exists.Id) {
                    UpdateSPListItemGeneric(listName, data)
                        .then(x => (resolve(x)))
                } else {
                    CreateSPListItemGeneric(listName, data)
                        .then(x => (resolve(x)))
                }
            })


    })
}

export const RemoveSPListItemGeneric = (listName, spid) => {
    return new Promise((resolve, reject) => {

        sprLib.rest({ url: REACT_APP_RESTURL_SPWEBURL + '/_api/contextinfo', type: 'POST' })
            .then(arr => {
                const digest = arr[0].GetContextWebInformation.FormDigestValue
                //console.log(digest)
                sprLib.list({ name: listName, baseUrl: REACT_APP_RESTURL_SPWEBURL, requestDigest: digest })
                    .recycle({ ID: spid })
                    .then(result => {
                        resolve("Deleted")
                    })
            });
    })
}



export const loadSiteUsers = () => {
    return new Promise((resolve, reject) => {
        const url = REACT_APP_RESTURL_SITEUSERS;
        //console.log("loadSiteUsers REST Call: " + url);
        fetch(url, {
            method: "GET",
            headers: {
                accept: "application/json;odata=verbose"
            }
        })
            .then((response) => response.json())
            .then((data) => {
                //console.log("loading Site Users");
                let tempAry = [];
                const allResults = data.d.results;
                //console.log("completed loading Site Users, count: " + data.d.results.length);
                allResults.forEach((element) => {
                    tempAry.push(element);
                });
                resolve(tempAry);
            });
    });
};



Date.prototype.formatUnique = function () {
    return (
        this.getMonth() +
        1 +
        "/" +
        this.getDate() +
        "/" +
        this.getFullYear()
    );
};
Date.prototype.formatMMDDYYYY = function () {
    return this.getMonth() + 1 + "/" + this.getDate() + "/" + this.getFullYear();
};

export const getUrlHashKey = () => {
    var myH = window.location.hash;
    var idx1 = myH.lastIndexOf("/");
    return myH.substring(idx1 + 1);
};
export const getQueryStringParameterByName = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
};

export const loadSpRestCall = (requestUrl, isSingle, isNotList) => {
    return new Promise((resolve, reject) => {
        fetch(requestUrl, {
            method: "GET",
            headers: {
                accept: "application/json;odata=verbose"
                , "Content-Type": "application/json"
            }
        })
            .then((response) => response.json())
            .then((data) => {
                if (isNotList) {
                    resolve(data)
                }
                else if (isSingle) {
                    if (data.d.results && data.d.results[0]) {
                        resolve(data.d.results && data.d.results[0]);
                    } else if (data.d && data.d.__metadata) {
                        resolve(data.d)
                    } else {
                        resolve(null)
                    }
                } else {
                    if (data.d && !data.d.results) {
                        resolve(data.d);

                    } else {

                        resolve(data.d.results);
                    }
                }
            });
    });
};

// export const loadSpRestCall = (requestUrl) => {
//     return new Promise((resolve, reject) => {
//         fetch(requestUrl, {
//             method: "GET",
//             headers: {
//                 accept: "application/json;odata=verbose"
//             }
//         })
//             .then((response) => response.json())
//             .then((data) => {
//                 try{
//                     if (data.d.results) {
//                         resolve(data.d.results);
//                     } else if (data.d) {
//                         resolve(data.d)
//                     }
//                 }catch(e){
//                     reject(e)
//                 }
//             })

//     });
// };
export const refreshRequestDigestVal = (numSeconds) => {
    return new Promise((resolve, reject) => {
        fetch(REACT_APP_RESTURL_SPWEBURL + "/_api/contextinfo", {
            method: "POST",
            headers: {
                accept: "application/json;odata=verbose"
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const formDigestValue = data.d.GetContextWebInformation.FormDigestValue;
                //console.log("formDigestValue: " + formDigestValue);
                resolve(formDigestValue);
                setTimeout(() => {
                    refreshRequestDigestVal(numSeconds);
                }, 2 * 1000000);
            });
    });
};

export const GetRequestDigestVal = () => {
    return new Promise((resolve, reject) => {
        fetch(REACT_APP_RESTURL_SPWEBURL + "/_api/contextinfo", {
            method: "POST",
            headers: {
                accept: "application/json;odata=verbose"
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const formDigestValue = data.d.GetContextWebInformation.FormDigestValue;
                resolve(formDigestValue);
            });
    });
}

export const JoinSPData = (sourceList, pkFieldName, listToFilter, fkFieldName, joinPropertyName, joinPropertyFieldName) => {
    sourceList.forEach(x => {
        const relatedItems = listToFilter.filter(l => l[fkFieldName] && (l[fkFieldName] == x[pkFieldName]))
        if (joinPropertyFieldName) {

            x[joinPropertyName] = relatedItems.map(x => x[joinPropertyFieldName])
        } else {

            x[joinPropertyName] = relatedItems
        }
    })
}


// export const UrlHandlerTitle=(cellData)=> {
//     return (
//         <React.Fragment>
//             <a href={cellData.text} target='_blank'>{cellData.data.Link_x0020_Title}</a>
//         </React.Fragment>
//     );
//   }

// export const UrlHandlerPartTitle=(cellData)=> {
//     const url = `${REACT_APP_RESTURL_SPWEBURL}/Lists/MELInventory/DispForm.aspx?ID=${cellData.row.data.MEL.Id}`
//     return (<React.Fragment>
//         <a href={url} target="_blank">{cellData.text}</a>
//     </React.Fragment>)
//   }


