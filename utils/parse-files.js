const fs = require('fs');
const a = require('async');
const makeCSV = require('./make-csv.js');
const parse = require('xml-parser');

const parseFiles = (folder, files, rl, oauth) => {
  a.eachLimit(files, 1, (filename, next) => {
    console.log(`\nStarting ${folder}/${filename}`);
    const xml = fs.readFileSync(`${folder}/${filename}`, 'utf8');
    const obj = parse(xml);
    makeCSV(obj.root, oauth, rl, filename, (err) => {
      if (err) {
        next(err);
      } else {
        fs.renameSync(`${folder}/${filename}`, `done/${filename}`);
        next();
      }
    });
  }, (err) => {
    rl.write('\n');
    if (err) throw err;
    rl.close();
  });
};

module.exports = parseFiles;