// let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
function testPutput(){
    console.log("popup.js OUTPUT....");
}
tab = getCurrentTabId()
chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: testOutput
});
});