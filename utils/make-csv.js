const csvStringify = require('csv-stringify');
const detection = require('./detection.js');
const xmlSimpleCreator = require('./xml-creator.js');
const googleApi = require('./google-api.js');

const makeCSV = (original, oauth, rl, filename) => {
  var data = {};
  const stringifier = csvStringify({delimiter: ','});
  var output = '';
  var count = 0;
  var polygonCount = 0;
  var currentTableId = '';
  var polygonString = '';
  var polygonStringCount = 0;
  const maxPolygon = 4;
  const max = 500;
  const maxTable = 10000;
  const headers = [];
  
  const getHeader = (f) => {
    if (f.attributes && f.attributes.name) {
      headers.push(f.attributes.name);
      data[f.attributes.name] = f.content;
    }
  };
  
  const getPolygon = (e) => {
    const polygon = xmlSimpleCreator(e);
    polygonString += polygon;
    polygonStringCount++;
    if (polygonStringCount > maxPolygon) {
      var list = [];
      for (var k in data) {
        list.push(data[k]);
      }
      list.push(filename.split('.')[0].split(' ')[0]);
      list.push(`<MultiGeometry>${polygonString}</MultiGeometry>`);
      if (list.length !== 5) console.log(list);
      stringifier.write(list);
      polygonString = '';
      polygonStringCount = 0;
      
      count++;
      polygonCount++;
      if (count > max) {
        count = 0;
        // send data
        googleApi.uploadFiles(currentTableId, output);
        output = '';
      }
      // if (polygonCount > maxTable) {
      //   polygonCount = 0;
      //   if (!output.trim() === '') {
      //     // send data
      //     googleApi.uploadFiles(currentTableId, output);
      //     output = '';
      //   }
      //   // create table
      // }
    }
  };
  
  stringifier.on('readable', () => {
    while(row = stringifier.read()){
      output += row;
    }
  });
  
  stringifier.on('error', function(err){
    throw err;
  });
  
  stringifier.on('finish', function(){
    googleApi.uploadFiles(currentTableId, output);
    googleApi.importRows(oauth, googleApi, rl, (err) => {
      if (err) throw err;
      rl.close();
    });
    // r1.close();
  });
  
  detection.gen(original, detection, [
    getHeader,
    'simple',
    'schema',
    'extended',
    'placemark',
    'folder',
    'doc'
  ]);
  
  headers.push('crop');
  headers.push('locations');
  
  // create Table
  googleApi.createTable(filename, headers, oauth, (err, tableId) => {
    if (err) throw err;
    currentTableId = tableId;
    detection.gen(original, detection, [
      getPolygon,
      'polygon',
      'multigeometry',
      'placemark',
      'folder',
      'doc'
    ]);
    
    stringifier.end();
  });
};

module.exports = makeCSV;
