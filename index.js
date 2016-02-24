const fs = require('fs');
const parse = require('xml-parser');
const filename = process.argv[2];
const folder = process.argv[3];
const xml = fs.readFileSync(`suitability/${filename}`, 'utf8');
const csvStringify = require('csv-stringify');
var inspect = require('util').inspect;

var obj = parse(xml);

// console.log(inspect(obj, { colors: true, depth: Infinity }));

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
}

const xmlCreator = (o, level) => {
  var indent = '';
  var content = '';
  var children = '';
  for (var k = 0; k < level; k++) {
    indent = `${indent} `;
  }
  var openTag = `${indent}<${o.name}`;
  if (o.attributes) {
    for (var i in o.attributes) {
      openTag = `${openTag} ${i}="${o.attributes[i]}"`;
    }
  }
  openTag = `${openTag}>`;
  
  if (o.content) content = `\n${indent}  ${o.content}`;
  if (o.children && o.children.length > 0) {
    for (var j in o.children) {
      children = `${children}\n${xmlCreator(o.children[j], level+2)}`;
    }
  }
  const closeTag = `\n${indent}</${o.name}>`;
  return openTag + content + children + closeTag;
};

const xmlDeclaration = (dec) => {
  var declaration = `<?xml `;
  if (dec.attributes) {
    for (var i in dec.attributes) {
      declaration = `${declaration} ${i}="${dec.attributes[i]}"`;
    }
  }
  declaration = `${declaration} ?>`;
  return declaration;
};

const createXML = (file, o, i) => {
  var str = '';
  str += xmlDeclaration(o.declaration);
  str += xmlCreator(o.root, 0);
  fs.writeFileSync(`suitability/${folder}/file-${i}-${file}`, str, 'utf8');
};

const makeCSV = (original) => {
  const polygons = [];
  var data = {};
  
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
                if (d.name === 'MultiGeometry') {
                  return d.children.map((e) => {
                    if (e.name === 'Polygon') {
                      polygons.push(e);
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  });
  
  const wholeData = [];
  
  for (var j in polygons) {
    
    var polygon = xmlSimpleCreator(polygons[j], 0);
    var list = [];
    for (var k in data) {
      list.push(data[k]);
    }
    list.push(polygon);
    wholeData.push(list);
  }
  
  // console.log(wholeData[0]);
  
  csvStringify(wholeData, (err, output) => {
    if (err) throw err;
    // console.log(output);
    fs.writeFileSync(`output/${filename}.csv`, output, 'utf8');
  })
}

makeCSV(obj.root);

const getPolygons = (original) => {
  const polygons = []
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
                      polygons.push(e);
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  });
  
  // console.log(polygons);
  
  const newObjs = [];
  
  for (var i in polygons) {
    const o = {
      declaration: obj.declaration
    };
    
    o.root = {
      name: original.name,
      attributes: original.attributes,
      content: original.content,
      children: original.children.map((a) => {
        if (a.name === 'Document') {
          return {
            name: a.name,
            attributes: a.attributes,
            content: a.content,
            children: a.children.map((b) => {
              if (b.name === 'Folder') {
                return {
                  name: b.name,
                  attributes: b.attributes,
                  content: b.content,
                  children: b.children.map((c) => {
                    if (c.name === 'Placemark') {
                      return {
                        name: c.name,
                        attributes: c.attributes,
                        content: c.content,
                        children: c.children.map((d) => {
                          if (d.name === 'MultiGeometry') {
                            return {
                              name: d.name,
                              attributes: d.attributes,
                              content: d.content,
                              children: [polygons[i]]
                            }
                          }
                          return d;
                        })
                      }
                    }
                    return c;
                  })
                }
              }
              return b;
            })
          }
        }
        return a;
      })
    }
    
    // console.log(inspect(polygons[i], { colors: true, depth: Infinity }));
    // newObjs.push(o);
    // createXML(filename, o, i);
    // break;
  }
}

// getPolygons(obj.root);

// createXML(filename, obj);
