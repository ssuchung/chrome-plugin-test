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
chrome.browserAction.onClicked.addListener((tab) => {
    chrome.tabs.update(tab.id,{url:tab.url});
    testOutput();
    testOutput();
  });
 