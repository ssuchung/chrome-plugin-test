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

// function startRefresh(){
//     chrome.browserAction.setIcon({
//         // 又是一个坑，图标大小不能超了，见文档：
//         // https://developer.chrome.com/extensions/manifest/icons
//         path: {
//             "16": "images/icon-off16.png",
//             "48": "images/icon-off48.png",
//             "128": "images/icon-off128.png"
//         }
//     })
// }

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete") {
        console.log("A new tabId " + tabId);
        console.log(changeInfo);
        const url = new URL(tab.url);
        console.log("host is " + url.hostname);
        chrome.storage.sync.get(url.hostname, (items) => {
            if (JSON.stringify(items) == '{}') {
                console.log("turn     off");
                chrome.browserAction.setIcon({
                    // 又是一个坑，图标大小不能超了，见文档：
                    // https://developer.chrome.com/extensions/manifest/icons
                    path: {
                        "16": "images/icon-off16.png",
                        "48": "images/icon-off48.png",
                        "128": "images/icon-off128.png"
                    }
                });
            }
            else {
                console.log("turn    on");
                chrome.browserAction.setIcon({
                    path: {
                        "16": "images/icon-on16.png",
                        "48": "images/icon-on48.png",
                        "128": "images/icon-on128.png"
                    }
                });
            }
        });
    }
});
    // if (chrome.storage.sync.get(url.hostname)) {
    //     console.log("storage is true");
    // }
function tabUpdater(tab){
    // const url = new URL(tab.url);
    return () => {
        console.log("updater")
        chrome.tabs.update(tab.id,{url:tab.url});
    };
}

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
            chrome.storage.sync.set({[url.hostname]: items});
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

//   chrome.tabs.update(tab.id,{url:tab.url});

// // 蠢得可以的语法，用变量作为OBJ的key
        // hostnameObj = {};
        // hostnameObj[url.hostname] = true;
        // console.log(hostnameObj);
        // chrome.storage.sync.set(hostnameObj);
        // chrome.storage.sync.clear();
 