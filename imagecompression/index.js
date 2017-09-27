
const fs = require("fs")
const path = require("path")
const {app, BrowserWindow, ipcMain, shell, dialog} = require("electron")

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
        height: 600,
		maximizable: false,
		resizable: false,
		show: false
    })
	
	win.once("ready-to-show", () => {
		win.show()
	})

    //打开控制台
    //win.webContents.openDevTools()
    
    //隐藏菜单
    win.setMenu(null)
    
    //加载index.html
    win.loadURL(`file://${__dirname}/index.html`)
    
    ipcMain.on("client_address_translation", function (event, arg) {
        let result = arg.map(t => getbuild(t))
        
        event.sender.send("server_address_translation", result)
    })
    
    ipcMain.on("client_open_file", function (event, arg) {      
        shell.openItem(arg)
    })
    
    //监听客户端消息
    ipcMain.on("client_message", function (event, arg) {        
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
        
        let dirfile = arg.filter(t => path.extname(t))
        let dirfile_flag = arg.length == dirfile.length
        let dirfile_dirname = ""
        let dirfile_tmp = ""
        let len = arg.length

        while(len) {
            let filePath = arg[len - 1]
            let _stats = fs.statSync(filePath)

            if (_stats.isFile()) {  
                if (extname.indexOf(path.extname(filePath)) != -1) {
                    dirfile_dirname = path.dirname(filePath)
                    dirfile_tmp = path.resolve(dirfile_dirname, "build")
                    list.push({src: filePath, dir: dirfile_tmp})
                }
            } else if (_stats.isDirectory()) {              
                getFile(filePath, path.resolve(filePath, "build"))
            }
            --len
        }
        
        if (arg.length > 1 && !dirfile_flag) {
            list.forEach(t => {
                let tmp = t.dir.replace(dirfile_dirname, "").replace(/build(\\)?/,"")               
                t.dir = path.join(dirfile_tmp, tmp)
            })
        }
        
        let i = list.length

        function promise(t) {
            let ext = path.extname(t.src)
            let _use = use[extname.indexOf(ext)]

            imagemin([t.src], t.dir, {use: [_use()]}).then(function(){                              
                if (i) {
                    promise(list[--i])
                } else {
                    //收到消息向客户端发送结果
                    event.sender.send("server_message", list)
                }
            }).catch(function() {
                console.log("catch", arguments)
            })
        }
        
        if (i) {
            promise(list[0])
        } else {
            event.sender.send("server_message", list)
        }

    })
    
    ipcMain.on("client_open_file_dialog", function (event) {     
    
        dialog.showOpenDialog({
            properties: ["multiSelections"]
        }, function (files) {         
            if (files) {
                files.push(getbuild(files[0]))
                event.sender.send("server_selected_file", files)
            }
        })
        
    })
    
    ipcMain.on("client_open_directory_dialog", function (event) {       
    
        dialog.showOpenDialog({
            properties: ["openDirectory"]
        }, function (files) {         
            if (files) {
                files.push(getbuild(files[0]))
                event.sender.send("server_selected_directory", files)
            }
        })
        
    })
    
    function getbuild(filePath) {
        let result = path.resolve(filePath + "/build")
        
        if (path.extname(filePath)) {
            result = path.resolve(path.dirname(filePath), "build")
        }
        return result
    }
	
	ipcMain.on("client_info_alert", function (event, text) {
		const options = {
			type: "info",
			title: "信息",
			message: text || "",
			buttons: ["确定"]
		}
		
		dialog.showMessageBox(options, function (index) {
			event.sender.send("server_info_alert", index)
		})
	})
	
})


app.on("window-all-closed", () => {
    app.quit()
})








