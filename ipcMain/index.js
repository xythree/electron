


const {app, BrowserWindow, ipcMain} = require("electron")

let win

app.on("ready", () => {

    //���ô�������
    win = new BrowserWindow({
        width: 500,
        height: 500,
        title: "ipcMain_demo"
    })

    //�򿪿���̨
    win.webContents.openDevTools()

    //����index.html
    win.loadURL(`file://${__dirname}/index.html`)

    //�����ͻ�����Ϣ
    ipcMain.on("client_message", function (event, arg) {

        //arg�ӿͻ����յ�������(type Array)
        console.log(arg)
        //�յ���Ϣ��ͻ��˷��ͽ��
        setTimeout(function() {
            event.sender.send("server_message", "server message ok!")
        }, 5000)


    })

})


app.on("window-all-closed", () => {
    app.quit()
})








