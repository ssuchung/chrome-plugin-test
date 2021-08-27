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
function testOutput(){
    console.log("......popup.js OUTPUT....");
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("A new tabId " + tabId);
    console.log("A new tabId " + tab.id);
    console.log(changeInfo);
    url = new URL(tab.url);
    console.log("host is " + url.hostname);

    chrome.storage.sync.clear();

    // // 蠢得可以的语法，用变量作为OBJ的key
    hostnameObj = {};
    hostnameObj[url.hostname] = true;
    console.log(hostnameObj);
    chrome.storage.sync.set(hostnameObj);
    chrome.storage.sync.get(url.hostname, (items) => {
        console.log(items);
    });
    // if (chrome.storage.sync.get(url.hostname)) {
    //     console.log("storage is true");
    // }

})
chrome.browserAction.onClicked.addListener((tab) => {
    
  });

//   chrome.tabs.update(tab.id,{url:tab.url});



 