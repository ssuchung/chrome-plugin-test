// 常驻后台的 background.js

// 正在自动刷新的 tab 的 refreshInfo 数组
var refInfoTable = [];
// 保存的 urlData 数组
var savedData = [];

// 保存在浏览器内的数据是一个 js 对象：
// {data: [{url: xxx， msTime: 60000}]}

// 切换插件图标，开和关
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
    console.log(refInfoTable);
    for (var i = 0; i < refInfoTable.length; i++) {
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
// 生成用于刷新的函数
function refresher(refreshInfo) {
    const tab = refreshInfo.tab;
    const tabId = tab.id;
    return () => {
        console.log("refresher id: " + tabId);
        chrome.tabs.update(tabId, { url: tab.url });
    }
}
function popRefInfoFromRT(refreshInfo, func) {
    // func 可以是 sameRefInfo、sameRefInfoId 之一
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
// 设置自动刷新
function setRefresh(refreshInfo) {
    const msTime = refreshInfo.msTime;
    if (isRefreshing(refreshInfo.tab)) {
        clearRefresh(getRefInfo(refreshInfo.tab));
    }
    // setInterval 按时调用刷新函数
    // 返回值用于 clearInterval 停止按时调用
    refreshInfo.iterval = setInterval(refresher(refreshInfo), msTime);
    refInfoTable.push(refreshInfo);
    turnOnIcon();
    // 确保 savedData 和浏览器保存的数据一致
    saveUrlData(refreshInfo);
}
// 取消自动刷新
function clearRefresh(refreshInfo) {
    var r = getRefInfo(refreshInfo.tab);
    if (r) {
        clearInterval(r.iterval);
        r.iterval = null;
        popRefInfoFromRT(r, sameRefInfoId);
        turnOffIcon();
    }
    saveUrlData(refreshInfo);
}
function saveUrlData(refreshInfo) {
    var urlData = getUrlData(refreshInfo);
    var msTime = refreshInfo.msTime;
    // 操作 savedData
    if (urlData) {
        if (refreshInfo.saved) {
            urlData.msTime = msTime;
        }
        else {
            popUrlData(refreshInfo);
        }
    }
    else if (refreshInfo.saved) {
        urlData = new UrlData(refreshInfo.tab.url, msTime);
        savedData.push(urlData);
    }
    // 浏览器保存 savedData
    chrome.storage.sync.set({ data: savedData });
}
function UrlData(url, msTime) {
    this.url = url;
    this.msTime = msTime;
}
function getUrlData(refreshInfo) {
    for (var i = 0; i < savedData.length; i++) {
        if (refreshInfo.tab.url == savedData[i].url) {
            return savedData[i];
        }
    }
    return null;
}
function popUrlData(refreshInfo) {
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

// 以上是定义 
// 以下是执行

// 打开浏览器窗口时，读取浏览器保存的数据
chrome.windows.onCreated.addListener((win) => {
    // key 设为 null 获取所有保存的数据
    // 虽然实际上只有一个 key，即 data
    // {data: [{url: xxx， msTime: 60000}]}
    chrome.storage.sync.get(null, (items) => {
        // js 就是垃圾，不能通过 items === {} 来判定是否空对象
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

// 处理 tab 更新事件，只处理 complete 状态的
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete") {
        console.log("tabId: " + tabId + " is completed");
        var refreshInfo = new RefreshInfo(tab);
        // 如果 tab 本来正在自动刷新
        // 判断更新后的 url 是否原来的 url 
        // 若不是原来的 url 则取消原来的自动刷新
        // 再根据 savedData 设置新的自动刷新
        // 对应的情况就是输入新网址、跳转等情况
        if (isRefreshing(refreshInfo.tab)) {
            console.log("tabId: " + tabId + " is refreshing");
            var oldRefInfo = getRefInfo(tab);
            if (refreshInfo.tab.url != oldRefInfo.tab.url) {
                clearRefresh(oldRefInfo);
                var urlData = getUrlData(refreshInfo);
                if (urlData) {
                    refreshInfo.msTime = urlData.msTime;
                    refreshInfo.saved = true;
                    setRefresh(refreshInfo);
                }
            }
            // 若还是原来的 url 则什么也不用做
            // 对应的情况就是刷新后 url 不变
        }
        // 如果 tab 本来没在自动刷新
        // 根据 savedData 设置新的自动刷新
        else {
            console.log("tabId: " + tabId + " is NOT refreshing");
            var urlData = getUrlData(refreshInfo);
            if (urlData) {
                refreshInfo.msTime = urlData.msTime;
                refreshInfo.saved = true;
                setRefresh(refreshInfo);
            }
        }
        // 根据是否正在自动刷新来切换图标
        chrome.tabs.get(tabId, (tab) => {
            if (isRefreshing(tab)) {
                turnOnIcon();
            }
            else {
                turnOffIcon();
            }
        });
    }
}
);

// 处理在 popup.html 点击确认后的事件
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
// 切换 tab 时根据是否正在自动刷新切换图标
chrome.tabs.onActivated.addListener((activeInfo) => {
    var tabId = activeInfo.tabId;
    chrome.tabs.get(tabId, (tab) => {
        if (isRefreshing(tab)) {
            turnOnIcon();
        }
        else {
            turnOffIcon();
        }
    });
});
// 关闭 tab 时停止自动刷新
chrome.tabs.onRemoved.addListener((tabId, info) => {
    if (isRefreshing({ id: tabId })) {
        clearRefresh(getRefInfo({ id: tabId }));
    }
});



// 蠢得可以的语法，用变量作为OBJ的key
// obj = {};
// k = "something";
// obj[k] = true;
// obj is {"something": true}
// 或者这样，这个中括号就尼玛莫名其妙
// obj = {[k]: true};
// 哪怕从 Lisp 里面抄个反引号（quote）呢