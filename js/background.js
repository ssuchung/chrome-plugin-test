var refInfoTable = [];
// {data: [{url: xxx， msTime: 60000}]}
var savedData = [];

function turnOnIcon() {
    chrome.browserAction.setIcon({
        // 又是一个坑，图标大小不能超了，见文档：
        // https://developer.chrome.com/extensions/manifest/icons
        path: {
            "16": "images/icon-on16.png",
            "48": "images/icon-on48.png",
            "128": "images/icon-on128.png"
        }
    });
}
function turnOffIcon() {
    chrome.browserAction.setIcon({
        path: {
            "16": "images/icon-off16.png",
            "48": "images/icon-off48.png",
            "128": "images/icon-off128.png"
        }
    });
}
function RefreshInfo(tab, msTime = 60000, saved = false) {
    this.tab = tab;
    this.url = new URL(tab.url);
    this.hostname = this.url.hostname;
    this.msTime = msTime;
    this.iterval = null;
    this.saved = saved;
}
// function sameRefInfo(refreshInfoA, refreshInfoB) {
//     const idA = refreshInfoA.tab.id;
//     const idB = refreshInfoB.tab.id;
//     const urlA = refreshInfoA.tab.url;
//     const urlB = refreshInfoB.tab.url;
//     if (idA == idB && urlA == urlB) {
//         return true;
//     }
//     else {
//         return false;
//     }
// }
function sameRefInfoId(refreshInfoA, refreshInfoB) {
    const idA = refreshInfoA.tab.id;
    const idB = refreshInfoB.tab.id;
    if (idA == idB) {
        return true;
    }
    else {
        return false;
    }
}
function isRefreshing(tab) {
    console.log("isRefreshing refInfoTable is ");
    console.log(refInfoTable);
    for (var i = 0; i < refInfoTable.length; i++) {
        console.log("tabID: " + tab.id + " && refInfoTable[i].tab.id: " + refInfoTable[i].tab.id);
        if (tab.id == refInfoTable[i].tab.id) {
            return true;
        }
    }
    return false;
}
function getRefInfo(tab) {
    for (var i = 0; i < refInfoTable.length; i++) {
        if (tab.id == refInfoTable[i].tab.id) {
            return refInfoTable[i];
        }
    }
    return null;
}
function refresher(refreshInfo) {
    const tab = refreshInfo.tab;
    const tabId = tab.id;
    return () => {
        console.log("refresher id: " + tabId);
        chrome.tabs.update(tabId, { url: tab.url });
    }
}
function popRefInfoFromRT(refreshInfo, func) {
    // func 是 sameRefInfo sameRefInfoId 之一
    var t = [];
    var r;
    for (var i = 0; i < refInfoTable.length; i++) {
        if (func(refreshInfo, refInfoTable[i])) {
            r = refInfoTable[i];
        }
        else {
            t.push(refInfoTable[i]);
        }
    }
    refInfoTable = t;
    return r;
}
function setRefresh(refreshInfo) {
    const msTime = refreshInfo.msTime;
    if(isRefreshing(refreshInfo.tab)){
        clearRefresh(getRefInfo(refreshInfo.tab));
    }
    refreshInfo.iterval = setInterval(refresher(refreshInfo), msTime);
    refInfoTable.push(refreshInfo);   
    turnOnIcon();
    saveUrlData(refreshInfo);
}
function clearRefresh(refreshInfo) {
    var r = getRefInfo(refreshInfo.tab);
    if(r){
        clearInterval(r.iterval);
        r.iterval = null;
        popRefInfoFromRT(r, sameRefInfoId);
        turnOffIcon();
    }
    saveUrlData(refreshInfo);
}
function saveUrlData(refreshInfo){
    var urlData = getUrlData(refreshInfo);
    var msTime = refreshInfo.msTime;
    if(urlData){
        if(refreshInfo.saved){
            urlData.msTime = msTime;
        }
        else{
            popUrlData(refreshInfo);
        }
    }
    else if(refreshInfo.saved){
        urlData = new UrlData(refreshInfo.tab.url, msTime);
        savedData.push(urlData);
    }
    chrome.storage.sync.set({data: savedData}); 
}
function UrlData(url, msTime){
    this.url = url;
    this.msTime = msTime;
}
function getUrlData(refreshInfo){
    for(var i = 0; i < savedData.length; i++){
        if(refreshInfo.tab.url == savedData[i].url){
            return savedData[i];
        }
    }
    return null;
}
function popUrlData(refreshInfo){
    var t = [];
    var r;
    var urlData = new UrlData(refreshInfo.tab.url, refreshInfo.msTime);
    for (var i = 0; i < savedData.length; i++) {
        if (savedData[i].url == urlData.url) {
            r = savedData[i];
        }
        else {
            t.push(savedData[i]);
        }
    }
    savedData = t;
    return r;
}
/********************************************************** */
// chrome.storage.sync.set({ rT: refInfoTable });

chrome.windows.onCreated.addListener((win) => {
    chrome.storage.sync.get(null, (items) => {
        if (JSON.stringify(items) != '{}') {
            // items 类似 {data: [{url: xxx， msTime: 60000}]}
            savedData = items.data;
        }
        else {
            savedData = [];
        }
        refInfoTable = [];
        console.log("savedData is: " + savedData);
        console.log("refInfoTable is: " + refInfoTable);
    });
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete") {
        console.log("tabId: " + tabId + " updated completed");
        var refreshInfo = new RefreshInfo(tab);
        if (isRefreshing(refreshInfo.tab)) {
            console.log("tabId: " + tabId + " is refreshing");
            var oldRefInfo = getRefInfo(tab);
            if (refreshInfo.tab.url != oldRefInfo.tab.url) {
                clearRefresh(oldRefInfo);
                var urlData = getUrlData(refreshInfo);
                if (urlData && urlData.url == refreshInfo.tab.url) {
                    refreshInfo.msTime = urlData.msTime;
                    refreshInfo.saved = true;
                    setRefresh(refreshInfo);
                }
            }
        }
        else {
            console.log("tabId: " + tabId + " is NOT refreshing");
            var urlData = getUrlData(refreshInfo);
            if (urlData) {
                refreshInfo.msTime = urlData.msTime;
                refreshInfo.saved = true;
                setRefresh(refreshInfo);
            }
        }
        chrome.tabs.get(tabId, (tab) => {
            if(isRefreshing(tab)){
                turnOnIcon();
            }
            else{
                turnOffIcon();
            }
        });
    }}
);
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        var { action, data } = request;
        switch (action) {
            case "setRefresh":
                setRefresh(data);
                break;
            case "clearRefresh":
                clearRefresh(data);
                break;
        }
    }
);
chrome.tabs.onActivated.addListener((activeInfo) =>{
    var tabId = activeInfo.tabId;
    chrome.tabs.get(tabId, (tab) => {
        if(isRefreshing(tab)){
            turnOnIcon();
        }
        else{
            turnOffIcon();
        }
    });
});
chrome.tabs.onRemoved.addListener((tabId, info) =>{
    if(isRefreshing({id: tabId})){
        clearRefresh(getRefInfo({id: tabId}));
    }
});

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status == "complete") {
//         const url = new URL(tab.url);
//         const hostname = url.hostname;

//         console.log("New tabId: " + tabId + url);
//         console.log(changeInfo);
//         console.log("refInfoTable is ");
//         console.log(refInfoTable);
//         if (hostname in refInfoTable){
//             turnOnIcon();
//         }
//         else{
//             turnOffIcon();
//         }
//     }
// });


// chrome.browserAction.onClicked.addListener((tab) => {
//     var url = new URL(tab.url);
//     console.log("url click happened" + url.hostname);
//     chrome.storage.sync.get(url.hostname, (items) => {
//         console.log("items is ");
//         console.log(items);
//         // 垃圾语法，不能通过 items === {} 来判定是否空对象
//         if (JSON.stringify(items) == '{}') {
//             console.log("it is off,turn it on");
//             chrome.browserAction.setIcon({
//                 path: {
//                     "16": "images/icon-on16.png",
//                     "48": "images/icon-on48.png",
//                     "128": "images/icon-on128.png"
//                 }
//             });
//             items = setInterval(tabUpdater(tab), 2000);
//             chrome.storage.sync.set({ [url.hostname]: items });
//             console.log("interval return value is " + items);
//         }
//         else {
//             console.log("it is off")
//             chrome.browserAction.setIcon({
//                 path: {
//                     "16": "images/icon-off16.png",
//                     "48": "images/icon-off48.png",
//                     "128": "images/icon-off128.png"
//                 }
//             });
//             // 返回值 items 是一个对象，要获取值，用 []
//             clearInterval(items[url.hostname]);
//             console.log("it is isisisisis " + items[url.hostname]);
//             chrome.storage.sync.remove(url.hostname, () => {
//                 console.log("remove successful")
//             });
//         }
//     });
// });




// 获取当前选项卡ID
// function getCurrentTabId(callback) {
//     chrome.tabs.query({ active: true, currentWindow: true },
//         function (tabs) {
//             if (callback) callback(tabs.length ? tabs[0].id : null);
//         });
// }

// $(function () {
//     var currentTabId = getCurrentTabId();
//     chrome.storage.sync.set({ currentTabId: currentTabId }, function () {
//         console.log('保存成功！');
//     });

//     console.log("实时监控ing");

//     setInterval(function () {
//         location.reload();
//     }, 5000);  // 5秒刷新一下

// })

//tab = getCurrentTabId();
// function testOutput(){
//     console.log("......popup.js OUTPUT....");
// };


// var urlTable = {};
// chrome.windows.onCreated.addListener((win) => {
//     urlTable = chrome.storage.sync.get(null, (items) => {
//         urlTable = items;
//     });
// });

// function getCurrentTab(callback) {
//     var t;
//     chrome.tabs.query({ active: true, currentWindow: true },
//         (tabs) => {
//             console.log(tabs[0]);
//             console.log('over');
//             if (callback && tabs && tabs[0]) {
//                 callback(tabs[0]);
//             }
//             t = tabs[0];
//         });
//     return t;
// }


//   chrome.tabs.update(tab.id,{url:tab.url});

// // 蠢得可以的语法，用变量作为OBJ的key
        // hostnameObj = {};
        // hostnameObj[url.hostname] = true;
        // console.log(hostnameObj);
        // chrome.storage.sync.set(hostnameObj);
        // chrome.storage.sync.clear();
