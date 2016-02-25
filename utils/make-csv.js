const csvStringify = require('csv-stringify');
const detection = require('./detection.js');
const xmlSimpleCreator = require('./xml-creator.js');
const googleApi = require('./google-api.js');

const makeCSV = (original, oauth, rl, filename, next) => {
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
  const headers = [];
  
  const getHeader = (f) => {
    if (f.attributes && f.attributes.name) {
      headers.push(f.attributes.name);
      data[f.attributes.name] = f.content;
    }
  };
  
  const writePolygon = (polygonString) => {
    var list = [];
    for (var k in data) {
      list.push(data[k]);
    }
    list.push(filename.split('.')[0].split(' ')[0]);
    list.push(`<MultiGeometry>${polygonString}</MultiGeometry>`);
    stringifier.write(list);
    count++;
    polygonCount++;
    if (count > max) {
      count = 0;
      googleApi.uploadFiles(currentTableId, output);
      output = '';
    }
  };
  
  const getPolygon = (e) => {
    const polygon = xmlSimpleCreator(e);
    if (polygon.length > 1000000) {
      var list = [];
      for (var k in data) {
        list.push(data[k]);
      }
      list.push(filename.split('.')[0].split(' ')[0]);
      console.log(polygon.length);
      list.push(JSON.stringify(`<MultiGeometry>${polygonString}</MultiGeometry>`));
      googleApi.uploadFiles(currentTableId, list.join(','));
    } else {
      polygonString += polygon;
      polygonStringCount++;
      if (polygonStringCount > maxPolygon) {
        writePolygon(polygonString);
        polygonString = '';
        polygonStringCount = 0;
      }
    }
    
    
    
  };
  
  stringifier.on('readable', () => {
    while(row = stringifier.read()){
      output += row;
    }
  });
  
  stringifier.on('error', function(err){
    next(err);
  });
  
  stringifier.on('finish', function(){
    googleApi.uploadFiles(currentTableId, output);
    googleApi.importRows(oauth, googleApi, rl, (err) => {
      next(err);
    });
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
    if (err) {
      next(err);
    } else {
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
    }
  });
};

module.exports = makeCSV;
