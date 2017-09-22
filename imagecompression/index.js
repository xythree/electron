
const fs = require("fs")
const path = require("path")
const {app, BrowserWindow, ipcMain, shell} = require("electron")

const imagemin = require("imagemin")
const imageminJpegtran = require("imagemin-jpegtran")
const imageminGifsicle = require("imagemin-gifsicle")
const imageminPngquant = require("imagemin-pngquant")

let use = [imageminPngquant, imageminJpegtran, imageminGifsicle]

let win

let extname = [".png", ".jpg", ".gif"]

app.on("ready", () => {

    //设置窗口属性
    win = new BrowserWindow({
		title: "图片压缩",
		icon: `${__dirname}/favicon.ico`,
        width:  500,
        height: 600
    })

    //打开控制台
    //win.webContents.openDevTools()
    
    //隐藏菜单
    win.setMenu(null)
    
    //加载index.html
    win.loadURL(`file://${__dirname}/index.html`)
    
    ipcMain.on("client_address_translation", function (event, arg) {
        let result = path.resolve(arg + "/build")
        
        if (path.extname(arg)) {
            result = path.resolve(path.dirname(arg), "build")
        }
        
        event.sender.send("server_address_translation", result)
    })
    
    ipcMain.on("client_open_file", function (event, arg) {      
        shell.openItem(arg)
    })
    
    //监听客户端消息
    ipcMain.on("client_message", function (event, arg) {
        let filePath = arg
        //arg从客户端收到的数据(type Array)
        let list = []
        
        function getFile(dir, build) {    
            let files = fs.readdirSync(dir)

            files.forEach((filename, i) => {
                let src = path.join(dir, filename)
                let stats = fs.statSync(src)

                if (stats.isFile() && extname.indexOf(path.extname(filename)) != -1) {          
                    list.push({src, dir: build})
                } else if (stats.isDirectory() && filename != "build") {                    
                    getFile(src, path.join(build,filename))
                }

            })
        }
        
        let _stats = fs.statSync(filePath)
        if (_stats.isFile()) {  
            if (extname.indexOf(path.extname(filePath)) != -1) {
                list.push({src: filePath, dir: path.resolve(path.dirname(filePath), "build")})
            }
        } else if (_stats.isDirectory()) {
            getFile(filePath, path.resolve(filePath, "build"))
        }
        
        let i = list.length

        function promise(t) {
            let ext = path.extname(t.src)
            let _use = use[extname.indexOf(ext)]

            imagemin([t.src], t.dir, {use: [_use()]}).then(() => {                
                if (i) {
                    promise(list[--i])
                } else {
                    //收到消息向客户端发送结果
                    event.sender.send("server_message", list)
                }
            })
        }
        
        if (i) {
            promise(list[0])
        } else {
            event.sender.send("server_message", list)
        }


    })

})


app.on("window-all-closed", () => {
    app.quit()
})








