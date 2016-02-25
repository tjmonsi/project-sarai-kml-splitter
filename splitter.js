const fs = require('fs');
const parse = require('xml-parser');
const filename = process.argv[2];
const xml = fs.readFileSync(`suitability/${filename}`, 'utf8');
const csvStringify = require('csv-stringify');

var obj = parse(xml);

const xmlSimpleCreator = (o) => {
  var content = '';
  var children = '';
  var openTag = `<${o.name}`;
  if (o.attributes) {
    for (var i in o.attributes) {
      openTag = `${openTag} ${i}="${o.attributes[i]}"`;
    }
  }
  openTag = `${openTag}>`;
  
  if (o.content) content = o.content;
  if (o.children && o.children.length > 0) {
    for (var j in o.children) {
      children = `${children}${xmlSimpleCreator(o.children[j])}`;
    }
  }
  const closeTag = `</${o.name}>`;
  return openTag + content + children + closeTag;
};

const writeToFile = (output, index) => {
  fs.writeFileSync(`output/${filename.split('.')[0]}-${index}.csv`, output, 'utf8');
}

const makeCSV = (original) => {
  var data = {};
  const wholeData = [];
  const stringifier = csvStringify( {delimiter: ',', columns: headers, header: true});
  var output = '';
  var index = 0;
  var count = 0;
  
  stringifier.on('readable', () => {
    while(row = stringifier.read()){
      // console.log(row);
      output += row;
    }
  });
  
  stringifier.on('error', function(err){
    // console.log(err);
    throw err;
  });
  
  stringifier.on('finish', function(){
    writeToFile(output, index);
  });
  
  original.children.map((a) => {
    if (a.name === 'Document') {
      return a.children.map((b) => {
        if (b.name === 'Folder') {
          return b.children.map((c) => {
            if (c.name === 'Placemark') {
              return c.children.map((d) => {
                if (d.name === 'ExtendedData') {
                  return d.children.map((e) => {
                    if (e.name === 'SchemaData') {
                      return e.children.map((f) => {
                        if (f.name === 'SimpleData') {
                          if (f.attributes && f.attributes.name) {
                            data[f.attributes.name] = f.content;
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
  
  const headers = [];
  
  for (var k in data) {
    headers.push(k);
  }
  
  headers.push('crop');
  headers.push('locations');
  
  original.children.map((a) => {
    if (a.name === 'Document') {
      return a.children.map((b) => {
        if (b.name === 'Folder') {
          return b.children.map((c) => {
            if (c.name === 'Placemark') {
              return c.children.map((d) => {
                if (d.name === 'MultiGeometry') {
                  return d.children.map((e) => {
                    if (e.name === 'Polygon') {
                      const polygon = xmlSimpleCreator(e);
                      var list = [];
                      for (var k in data) {
                        list.push(data[k]);
                      }
                      list.push(filename.split('.')[0].split(' ')[0]);
                      list.push(polygon);
                      
                      stringifier.write(list);
                      count++;
                      if (count >= 3000) {
                        count = 0;
                        writeToFile(output, index);
                        index++;
                        output = ''
                        stringifier.write(headers);
                      }
                      
                      // wholeData.push(list);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
  
  stringifier.end();
  
  
  
  
  // console.log(wholeData[0]);
  
  // csvStringify(wholeData, {columns: headers, header: true}, (err, output) => {
  //   if (err) throw err;
  //   // console.log(output);
  //   fs.writeFileSync(`output/${filename}.csv`, output, 'utf8');
  // });
};

makeCSV(obj.root);
