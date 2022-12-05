'use strict';

const getVersion = new Promise((resolve, reject) => {
  const process = require('child_process').spawn('git', ['describe', '--long', '--tags', '--dirty', '--always']);
  let result = '';
  process.stdout.on('data', data => result += data.toString());
  process.on('error', err => reject(-1));
  process.on('close', (code) => {
    if (code !== 0) return reject(-2);
    resolve(result.replace(/[\r\n]/g, ''));
  });
});

getVersion.then(ver => {
  const tokens = ver.split('-');
  if (tokens.length < 3) { process.exit(-3); }
  const version = `${tokens[0]}.${tokens[1]} (${tokens[2].substr(1)}${tokens[3]?'.'+tokens[3]:''})`;

  require('fs').writeFile('version.js', `module.exports = '${version}';\n`, err => {
    if (err) process.exit(-4);
  });
}).catch(err => process.exit(err));
