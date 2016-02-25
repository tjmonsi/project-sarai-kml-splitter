module.exports = {
  gen: (a, self, next) => {
    const c = next.pop();
    a.children.map((b) => {
      self[c](b, self, next);
    });
  },
  doc: (a, self, next) => {
    if (a.name === "Document") {
      self.gen(a, self, next);
    }
  },
  folder: (a, self, next) => {
    if (a.name === "Folder") {
      self.gen(a, self, next);
    }
  },
  placemark: (a, self, next) => {
    if (a.name === "Placemark") {
      self.gen(a, self, next);
    }
  },
  extended: (a, self, next) => {
    if (a.name === "ExtendedData") {
      self.gen(a, self, next);
    }
  },
  schema: (a, self, next) => {
    if (a.name === "SchemaData") {
      self.gen(a, self, next);
    }
  },
  simple: (a, self, next) => {
    if (a.name === "SimpleData") {
      
      self.render(a, next[0]);
    }
  },
  multigeometry: (a, self, next) => {
    if (a.name === "MultiGeometry") {
      self.gen(a, self, next);
    }
  },
  polygon: (a, self, next) => {
    if (a.name === "Polygon") {
      self.render(a, next[0]);
    }
  },
  render: (a, next) => {
    next(a);
  }
};