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

module.exports = xmlSimpleCreator;
