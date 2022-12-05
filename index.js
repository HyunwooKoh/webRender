'use strict';
const { app, BrowserWindow } = require('electron');
const { session } = require('electron');
const parseArgs = require('electron-args');
const fs = require('fs');
var logFile;
var window;

//==================== Exit(Error) code ======================== //
const INPUT_FILE_NOT_FOUND = 100;
const LOCAL_FILE_NOT_FOUND = 101;
const UNSUPPORT_INPUT_FILE_TYPE = 102;
const COOKIES_FILE_NOT_FOUND = 103;
const LOG_DIRECTORY_NOT_FOUND = 104;
const WRITE_LOG_SYNC_ERROR = 105;
//============================================================== //

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});

const checkArgsAvailable = (input,cookies,logDir) => {
  if( !(input.startsWith('http://') || input.startsWith('https://')) && !fs.existsSync(input)) {
    app.exit(INPUT_FILE_NOT_FOUND);
  }
  if( typeof cookies == 'string' && !fs.existsSync(cookies)) {
    app.exit(COOKIES_FILE_NOT_FOUND);
  }
  if(typeof logDir == 'string' && logDir.length > 0) {
    if(!fs.existsSync(logDir)) {
      app.exit(LOG_DIRECTORY_NOT_FOUND);
    } else {
      makeLogFile(logDir);
    }
  }
}

const makeLogFile = (logDir) => {
  var today = new Date();
  var month, date;

  if(!logDir.endsWith('/'))
    logDir = logDir + "/";

  if(today.getMonth() < 9) {
    month = "0" + (today.getMonth() + 1).toString();
  }
  else {
    month = (today.getMonth() + 1).toString();
  }
  
  if(today.getDate() <10) {
    date = "0" + today.getDate().toString();
  }
  else {
    date = today.getDate().toString();
  }

  logFile = logDir + today.getFullYear().toString() + month + date + today.getHours().toString() + today.getMinutes().toString() + "_log.txt";
}

const logging = (type,context) => {
  if(logFile) {
    try{
      var today = new Date();
      var timeStamp = today.getHours().toString() + "_" + today.getMinutes().toString() + "_" + today.getSeconds().toString() + " :: ";
      fs.appendFileSync(logFile, timeStamp + "[ " + type + " ] : " + context + "\n", {encoding: 'utf8'});
    }
    catch {
      app.exit(WRITE_LOG_SYNC_ERROR);
    }
  }
}

const insertCookies = (url, cookies) => {
  if( typeof cookies == 'string' && cookies.length > 0) {
    const cookieFile = fs.readFileSync(cookies);
    if(cookieFile) {
      const cookieData = JSON.parse(cookieFile.toString());
      logging("INFO", "cookies file size : " + Object.keys(cookieData.cookies).length.toString() + " cookieFile.toString() : " + cookieFile.toString());
      for(var i = 0 ; i < Object.keys(cookieData.cookies).length; i++) {
        const cookie = {
          url : url,
          name : cookieData.cookies[i].name,
          value : cookieData.cookies[i].value,
          expirationDate : new Date().getTime() + 60000, //Set Expiration Sec Here.
          path : cookieData.cookies[i].path != undefined ? cookieData.cookies[i].path : ""
        }
        session.defaultSession.cookies.set(cookie , function(error) {
          if(error)
            logging("ERROR","Insert Cookie Error, error : " + error);
        });
      }
    }
  }
}

const makeURLOption = (reqHeader) => {
  let header = {
    extraHeaders : fs.readFileSync(reqHeader).toString()
  }
  return header;
}

const checkFileFormat = (input) => {
  var extensions = [".mhtml", ".mht", ".html", ".htm", ".xml"];
  for(var i = 0 ; i < extensions.length ; i++) {
    if(input.endsWith(extensions[i]))
      return true;
  }
  return false;
}

const applyAttribute = (margin, header, footer) => {
  let marginsType = 0;
  logging("INFO","### Start writePdf ###");
  window.webContents.executeJavaScript(`const createStyleSheet = () => {
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
    return styleEl.sheet;
  };`);

  logging("INFO","### After 1st js execute ###");
  window.webContents.executeJavaScript(`const appendPrintDiv = (name, contents) => {
    const elem = document.createElement('div');
    elem.className = name;
    elem.innerText = contents;
    document.body.appendChild(elem);
  };`);

  logging("INFO","### Before Set margin ###");
  if (margin === undefined || margin === 'default') {
    marginsType = 0;
  } else if (margin === 'no-margin') {
    marginsType = 1;
  } else if (margin === 'minimum') {
    marginsType = 2;
  } else if (margin.split(',').length === 4) {
    const margins = margin.split(',');
    window.webContents.executeJavaScript(`
      (() => {
        const styleSheet = createStyleSheet();
        styleSheet.insertRule('@page { margin: ${margins[0]} ${margins[1]} ${margins[2]} ${margins[3]}; }');
      })();
    `);
  }
  logging("INFO","### After Set margin ###");

  if (header !== undefined) {
    logging("INFO","Apply Header : " + header);
    window.webContents.executeJavaScript(`
      (() => {
        const divName = 'divHeaderForPrinting';
        appendPrintDiv(divName, '${header}');
        const styleSheet = createStyleSheet();
        styleSheet.insertRule('@media print { div.' + divName + ' { position: fixed; top: 0mm; }}');
      })();
    `);
  }

  if (footer !== undefined) {
    logging("INFO","Apply footer : " + footer);
    window.webContents.executeJavaScript(`
      (() => {
        const divName = 'divFooterForPrinting';
        appendPrintDiv(divName, '${footer}');
        const styleSheet = createStyleSheet();
        styleSheet.insertRule('@media print { div.' + divName + ' { position: fixed; bottom: 0mm; }}');
      })();
    `);
  }
  return marginsType;
};

const printToPdf = (filePath, marginsType, printBackground, landscape, pageSize, postCallback) => {
  logging("INFO","### start webContents.printToPDF() ###");
  window.webContents.printToPDF({
    marginsType: marginsType,
    printBackground: printBackground,
    landscape: landscape,
    pageSize: pageSize
  }).then(data => {
    logging("INFO","filePath : " + filePath);
    require('fs').writeFile(filePath, data, () => {
      if (typeof postCallback === 'function') {
        postCallback();
      }
    }); 
  }).catch(error => {
    logging(`Failed to write PDF: `, error)
  })
  logging("INFO","### finish writePdf ###");
};

const printPage = async (input, output, cookies, requestHeader, delay, timeout, margin, printBackground, landscape, header, footer, pageSize, debugMode) => {
  logging("INFO","### Start printPage ### --input : " + input + "\t --output : " + output + "\n\t --cookies : " + cookies
          + "\t --request Header : " + requestHeader + "\t --header : " + header + "\t --footer : " + footer);
  window = new BrowserWindow({
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      javascript: true,
      nodeIntegration: false,
      webSecurity: false,
      allowDisplayingInsecureContent: true,
      allowRunningInsecureContent: true,
      // preload: path.join(__dirname, 'browser.js')
    }
  });

  if (debugMode === true) {
    window.show();
    window.webContents.openDevTools();
  }

  window.webContents.on('did-finish-load', () => {
    logging("INFO","### Finished Load PDF ###");
    window.webContents.executeJavaScript(`window.alert = function(){}; 0;`); // 0; -> To avoid console Warning!
    let marginsType = applyAttribute(margin, header, footer);
    let delayTime = (delay === undefined || delay === 0) ? 
      (margin === undefined && footer === undefined && header === undefined) ? 0 : 100 
      : delay;
    if(delay !== delayTime) {
      logging("INFO","Set delay time " + delay + " to " + delayTime + "for apply attribute");
    }
    setTimeout(() => {
        printToPdf(output, marginsType, printBackground, landscape, pageSize, () => app.exit(0));
    }, delayTime); // To Set Attribute on Web, we need tick!
  });

  if (typeof timeout !== 'undefined') {
    setTimeout(() => {
      app.exit(-3);
    }, +timeout);
  }

  window.on('close', (event) => {
    app.exit(-100);
  });

  var localFilePath;
  var urlFilePath;
  if(input.startsWith('http://') || input.startsWith('https://')) {
    urlFilePath = input;
  } else if(input.endsWith('.url') && fs.existsSync(input)) {
    var line = fs.readFileSync(input).toString().split('\n');
    for( var i = 0; i < line.length; i++) {
      if (line[i].toLowerCase().startsWith('url=')) {
        if(line[i].indexOf('https://') != -1 || line[i].indexOf('http://') != -1) {
          urlFilePath = line[i].substr('url='.length);
        }
        else {
          localFilePath = line[i];
          if (localFilePath.indexOf('file:///') != -1) {
            localFilePath = localFilePath.substr('url=file:///'.length)
          } else {
            localFilePath = localFilePath.substr('url='.length)
          }
          localFilePath = localFilePath.replace('\r','');
          localFilePath = fs.existsSync(localFilePath) ? localFilePath : null;
        }
      }
    }
  } else if(checkFileFormat(input) && fs.existsSync(input)) {
    localFilePath = input;
  } else {
    app.exit(UNSUPPORT_INPUT_FILE_TYPE);
  }

  if(localFilePath) {
    logging("INFO","Open localFile Path : " + localFilePath);
    window.loadFile(localFilePath);
  }
  else if(urlFilePath) {
    session.defaultSession.clearStorageData();
    insertCookies(urlFilePath, cookies);
    if(requestHeader !== undefined) {
      let header = makeURLOption(requestHeader);
      logging("INFO","Open urlFile Path(With requestHeader) : " + urlFilePath + 
          "\n\tRequest-Header : \n" + header.extraHeaders +"\n");
      window.loadURL(urlFilePath, header);
    } else {
      logging("INFO","Open urlFile Path : " + urlFilePath);
      window.loadURL(urlFilePath);
    }
  } else {
    logging("INFO","LocalFile not Found! From : " + input);
    app.exit(LOCAL_FILE_NOT_FOUND);
  }
};

app.on('ready', () => {
  const arg = parseArgs(`WebRender : ${require('./version')}
  require:
    --input=Input URL or local file path
    --output=Result PDF File path
  optional:
    --delay=[millisecond]
        Wait this time after the page loads. 
    --printBackground
    --footer=[some text]
    --header=[some text]
    --landscape
    --margin=[no-margin|minimum|n,n,n,n]
    --timeout=[millisecond]
    --pageSize=[A4|A3 ...]
    --cookies=[json file path]
    --requestHeader=[Text file path]
      Text Format:key:value
                  key:value
                  ...
    --logDir=[log directory]
  `, {
    alias: {
      h: 'help',
      i: 'input',
      o: 'output',
      d: 'delay',
      t: 'timeout',
      m: 'margin',
    }
  });
  
  const input = arg.flags.input;
  const output = arg.flags.output;
  const cookies = arg.flags.cookies;
  const requestHeader = arg.flags.requestHeader;
  const delay = arg.flags.delay;
  const timeout = arg.flags.timeout;
  const margin = arg.flags.margin;
  const printBackground = arg.flags.printBackground;
  const landscape = arg.flags.landscape;
  const header = arg.flags.header;
  const footer = arg.flags.footer;
  const pageSize = arg.flags.pageSize;
  const debugMode = arg.flags.debugMode;
  const logDir = arg.flags.logDir;
  if (typeof input != 'string' || typeof output != 'string') {
    arg.showHelp(-1);
  } else {
    checkArgsAvailable(input,cookies,logDir);
    printPage(input, output, cookies, requestHeader, delay, timeout, margin, printBackground, landscape, header, footer, pageSize, debugMode, logDir);
  }
});