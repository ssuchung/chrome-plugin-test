// 因为 chrome 的安全策略，popup.html 不能混入 js 代码
// 只能通过 src 引入 js 文件，在 popup.html 头部写：
// <script type="text/javascript" src="../js/popup.js"></script>
var btnQd;
var saveurl;
var checked;
var time;
var bg;
function btnClick() {
    // 获取当前活动的 tab 
    chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
            var tab = tabs[0];
            var msTime;
            if (time.value != "") {
                // time.value 是字符串，转换成数字
                msTime = parseInt(time.value) * 60 * 1000;
            }
            var saved = saveurl.checked;
            var refreshInfo = new bg.RefreshInfo(tab, msTime, saved);
            if (checked.checked) {
                // 发送消息，和 background.js 进行通信
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
    window.close(); //关闭 popup
}

// 通过事件，在 popup.html 载入后绑定 Element
document.addEventListener('DOMContentLoaded', function () {
    btnQd = document.getElementById("btnQd");
    // 绑定处理点击的函数
    btnQd.onclick = btnClick;
    checked = document.getElementById("autorefresh");
    saveurl = document.getElementById("saveurl");
    time = document.getElementById("timetofresh");
    // 获取 background.js
    bg = chrome.extension.getBackgroundPage();
    // 获取当前活动的 tab 
    chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
            var tab = tabs[0];
            var refreshInfo;
            // 设置 Element 的初始值
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
