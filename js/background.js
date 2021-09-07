var refInfoTable = [];

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
function RefreshInfo(tab, msTime) {
    this.tab = tab;
    this.tabId = tab.id;
    this.url = new URL(tab.url);
    this.hostname = this.url.hostname;
    this.msTime = msTime;
    this.iterval = 0;
}
function sameRefInfo(refreshInfoA, refreshInfoB) {
    const idA = refreshInfoA.tabId;
    const idB = refreshInfoB.tabId;
    const urlA = refreshInfoA.tab.url;
    const urlB = refreshInfoB.tab.url;
    if (idA == idB && urlA == urlB) {
        return true;
    }
    else {
        return false;
    }
}
function refresher(refreshInfo) {
    const tab = refreshInfo.tab;
    const tabId = refreshInfo.tabId;
    return () => {
        chrome.tabs.get(tabId, (t) => {
            if (t && t.url == tab.url) {
                console.log("refresher" + tabId);
                chrome.tabs.update(tabId, { url: tab.url });
            }
        });
    };
}
function popRefInfoFromRT(refreshInfo) {
    var t =[];
    var r;
    for (var i = 0; i < refInfoTable.length; i++) {
        if (sameRefInfo(refreshInfo, refInfoTable[i])) {
            r = refInfoTable[i];
        }
        else{
            t.push(refInfoTable[i]);
        }
    }
    refInfoTable = t;
    return r;
}
function setRefresh(refreshInfo) {
    const time = refreshInfo.msTime;
    const old = popRefInfoFromRT(refreshInfo);
    if (old && old.iterval) {
        clearInterval(old.iterval);
    }
    refreshInfo.iterval = setInterval(refresher(refreshInfo), time);
    refInfoTable.push(refreshInfo);
}
function clearRefresh(refreshInfo){
    const old = popRefInfoFromRT(refreshInfo);
    if(old && old.iterval){
        clearInterval(old.iterval);
    }
}
/********************************************************** */



chrome.windows.onCreated.addListener((win) => {
    chrome.storage.sync.get(null, (items) => {
        if (JSON.stringify(items) != '{}') {
            refInfoTable = items.rT
        }
        else {
            refInfoTable = [];
        }
    });
});
// chrome.windows.onClosed.addListener((win) => {
//     for (var i = 0; i < refInfoTable.length; i++) {
//         refInfoTable[i].tab = null;
//         refInfoTable[i].tabId = null;
//         refInfoTable[i].iterval = null;
//         // 保存的 data
//         // refInfoTable[i].url
//         // refInfoTable[i].hostname
//         // refInfoTable[i].msTime
//     }
//     chrome.storage.sync.set({ rT: refInfoTable });
// });
// chrome.tabs.onUpdate.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status == "complete") {

//     }
// });

// chrome.storage.onChanged.addListener((changes, areaName) => {
//     chrome.storage.sync.get(null, (items) => {
//         if(JSON.stringify(items) != '{}'){
//             refInfoTable = items.rT
//         }
//         else{
//             refInfoTable = [];
//         }
//     });
// });

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


chrome.browserAction.onClicked.addListener((tab) => {
    var url = new URL(tab.url);
    console.log("url click happened" + url.hostname);
    chrome.storage.sync.get(url.hostname, (items) => {
        console.log("items is ");
        console.log(items);
        // 垃圾语法，不能通过 items === {} 来判定是否空对象
        if (JSON.stringify(items) == '{}') {
            console.log("it is off,turn it on");
            chrome.browserAction.setIcon({
                path: {
                    "16": "images/icon-on16.png",
                    "48": "images/icon-on48.png",
                    "128": "images/icon-on128.png"
                }
            });
            items = setInterval(tabUpdater(tab), 2000);
            chrome.storage.sync.set({ [url.hostname]: items });
            console.log("interval return value is " + items);
        }
        else {
            console.log("it is off")
            chrome.browserAction.setIcon({
                path: {
                    "16": "images/icon-off16.png",
                    "48": "images/icon-off48.png",
                    "128": "images/icon-off128.png"
                }
            });
            // 返回值 items 是一个对象，要获取值，用 []
            clearInterval(items[url.hostname]);
            console.log("it is isisisisis " + items[url.hostname]);
            chrome.storage.sync.remove(url.hostname, () => {
                console.log("remove successful")
            });
        }
    });
});




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

function getCurrentTab(callback) {
    var t;
    chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
            console.log(tabs[0]);
            console.log('over');
            if (callback && tabs && tabs[0]) {
                callback(tabs[0]);
            }
            t = tabs[0];
        });
    return t;
}


//   chrome.tabs.update(tab.id,{url:tab.url});

// // 蠢得可以的语法，用变量作为OBJ的key
        // hostnameObj = {};
        // hostnameObj[url.hostname] = true;
        // console.log(hostnameObj);
        // chrome.storage.sync.set(hostnameObj);
        // chrome.storage.sync.clear();
