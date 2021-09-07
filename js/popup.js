var btnQd;
var checked;
var time;
var bg;
function btnClick() {
    var rT = bg.refInfoTable;
    console.log('你好');
    console.log(rT);
    console.log('我好');
    console.log("checked " + checked.checked);
    console.log("time " + time.value);
    chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
            var tab = tabs[0];
            var msTime = parseInt(time.value) * 60 * 1000;
            var refreshInfo = new bg.RefreshInfo(tab, msTime);
            if (checked.checked && time.value != "") {
                chrome.runtime.sendMessage(
                    {action: "setRefresh", data: refreshInfo},
                    undefined
                    // (response) =>{
                    //     console.log(response);
                    // }
                );
                // setRefresh(refreshInfo);
                // rT.push(refreshInfo);
            }
            else if (!checked.checked) {
                console.log("not checked!!")
                chrome.runtime.sendMessage(
                    {action: "clearRefresh", data: refreshInfo},
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

document.addEventListener('DOMContentLoaded', function() {
    btnQd = document.getElementById("btnQd");
    btnQd.onclick = btnClick;
    checked = document.getElementById("autorefresh");
    time = document.getElementById("timetofresh");
    bg = chrome.extension.getBackgroundPage();
});
