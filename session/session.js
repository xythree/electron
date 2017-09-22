

const electron = require("electron")
const {app,BrowserWindow,session} = electron


let win, ses

app.on("ready",() => {

    win = new BrowserWindow({
        width: 500,
        height: 500
    })

    ses = win.webContents.session

    let cookies = session.defaultSession.cookies

    cookies.get({url: "http://www.github.com"}, function(error, cookies) {
        console.log(arguments)
    })

    ses.getCacheSize(function() {
        console.log(arguments)
    })

})










