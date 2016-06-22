


const {app, BrowserWindow, ipcMain} = require("electron")

let win

app.on("ready", () => {

    //设置窗口属性
    win = new BrowserWindow({
        width: 500,
        height: 500,
        title: "ipcMain_demo"
    })

    //打开控制台
    win.webContents.openDevTools()

    //加载index.html
    win.loadURL(`file://${__dirname}/index.html`)

    //监听客户端消息
    ipcMain.on("client_message", function (event, arg) {

        //arg从客户端收到的数据(type Array)
        console.log(arg)
        //收到消息向客户端发送结果
        setTimeout(function() {
            event.sender.send("server_message", "server message ok!")
        }, 5000)


    })

})


app.on("window-all-closed", () => {
    app.quit()
})








