const key = require('../api.json').key;
const https = require('https');
const google = require('googleapis');
const fusiontables = google.fusiontables('v2');
const drive = google.drive('v3');
const filesToUpload = [];

module.exports = {
  createTable: (name, headers, oauth, next) =>{
    const columns = [];
    
    for (var i in headers) {
      var obj = {
        name: headers[i]
      };
      obj.type = obj.name === 'locations' ? 'LOCATION' : 'STRING';
      columns.push(obj);
    }
    
    const postData = {
      name: name,
      isExportable: true,
      columns: columns
    };
    
    fusiontables.table.insert({
      auth: oauth,
      resource: postData
    }, (err, result) => {
      if (err) {
        next(err);
      } else {
        if (result) console.log(`created ${result.tableId}`);  
        drive.permissions.create({
          auth: oauth,
          fileId: result.tableId,
          resource: {
            role: 'reader',
            type: 'anyone'
          }
        }, (err, driveResult) => {
          console.log(driveResult.id);
          next(err, result.tableId);
        });
      }
    });
  },
  uploadFiles: (tableId, csv) => {
    filesToUpload.push([tableId, csv]);
  },
  importRows: (oauth, self, rl, next) => {
    if (filesToUpload.length > 0) {
      var obj = filesToUpload.pop();
      var tableId = obj[0];
      var body = obj[1];
      fusiontables.table.importRows({
        auth: oauth,
        tableId: tableId,
        media: {
          mimeType: 'application/octet-stream',
          body: body
        }
      }, (err) => {
        if (err) {
          
          if (err.message === 'Internal error when processing import.  Please try again.') {
            filesToUpload.push(obj);
            rl.write('-');
            setTimeout(() => {
              self.importRows(oauth, self, rl, next);
            }, 1000);
          } else if (err.message === "Content has a different number of columns than the table") {
            rl.write('\n');
            console.log(obj);
            setTimeout(() => {
              self.importRows(oauth, self, rl, next);
            }, 1000);
          } else {
            console.log(err);
            next(err);
          }
        } else {
          rl.write('.');
          self.importRows(oauth, self, rl, next);  
        }
      });
    } else {
      next();
    }
  }
};
