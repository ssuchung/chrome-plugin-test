var btnQd;
var saveurl;
var checked;
var time;
var bg;
function btnClick() {
    var rT = bg.refInfoTable;
    chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
            var tab = tabs[0];
            var msTime;
            if (time.value != "") {
                msTime = parseInt(time.value) * 60 * 1000;
            }
            var saved = saveurl.checked;
            var refreshInfo = new bg.RefreshInfo(tab, msTime, saved);
            if (checked.checked) {
                chrome.runtime.sendMessage(
                    { action: "setRefresh", data: refreshInfo },
                    undefined
                    // (response) =>{
                    //     console.log(response);
                    // }
                );
            }
            else {
                chrome.runtime.sendMessage(
                    { action: "clearRefresh", data: refreshInfo },
                    undefined
                    // (response) =>{
                    //     console.log(response);
                    // }
                );
            }
        }
    );
    // window.close(); //关闭 popup
}

document.addEventListener('DOMContentLoaded', function () {
    btnQd = document.getElementById("btnQd");
    btnQd.onclick = btnClick;
    checked = document.getElementById("autorefresh");
    saveurl = document.getElementById("saveurl");
    time = document.getElementById("timetofresh");
    bg = chrome.extension.getBackgroundPage();
    chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
            var tab = tabs[0];
            var refreshInfo;
            if (bg.isRefreshing(tab)) {
                refreshInfo = bg.getRefInfo(tab);
                checked.checked = true;
                saveurl.checked = refreshInfo.saved;
                time.value = refreshInfo.msTime / 60 / 1000;
            }
            else{
                refreshInfo = new bg.RefreshInfo(tab);
                var urlData = bg.getUrlData(refreshInfo);
                if(urlData){
                    saveurl.checked = true;
                    time.value = urlData.msTime / 60 / 1000;
                }
            }
        }
    )
});
