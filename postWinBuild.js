'use strict';
if ((process.env.npm_config_platform || require('os').platform()) !== 'win32') {
  console.error('OS not supported...');
  process.exit(-100);
}

const makeFourTokens = arr => {
  arr.splice(4);
  if (arr.length < 4) {
    const pvLen = arr.length;
    for (let i = 0; i < 4 - pvLen; ++i) arr.push('0');
  }
};

const fs = require('fs');
const versionStr = require('./version');
const versionTokens = versionStr.split(' ')[0].split('.');
makeFourTokens(versionTokens);
const version = versionTokens.reduce((p, c) => p + (p.length ? ',' : '') + parseInt(c, 10), '');

const makeRcFile = new Promise((resolve, reject) => {
  fs.readFile('res/VERSIONINFO_template.rc', { encoding: 'ucs2' }, (err, data) => {
    if (err) return reject(err);

    fs.writeFile('res/VERSIONINFO.rc', data.replace(/\${VER}/g, version).replace(/\${VERSTR}/g, versionStr), { encoding: 'ucs2' }, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

const resHack = (resolve, reject, args) => {
  const process = require('child_process').spawn('tool/ResourceHacker.exe', args);
  process.on('error', err => reject(-1));
  process.on('close', (code) => {
    if (code !== 0) return reject(-2);
    resolve(code);
  });
};

makeRcFile.then(() => {
  const compile = new Promise((resolve, reject) =>
    resHack(resolve, reject, ['-open', 'res/VERSIONINFO.rc', '-save', 'res/VERSIONINFO.res', '-action', 'compile', '-log', 'log.log']));
  const inject = new Promise((resolve, reject) =>
    compile.then(() => resHack(resolve, reject, ['-script', 'tool/resource_inject.ini'])).catch(e => e));

  inject.then(() => {
    console.log('success');
  }).catch(e => e).then(err => {
    fs.unlink('res/VERSIONINFO.rc', () => {});
    fs.unlink('res/VERSIONINFO.res', () => {});
    if (err) { process.exit(err); }
  });
}).catch(err => process.exit(-1));
