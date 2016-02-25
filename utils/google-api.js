const google = require('googleapis');
const fs = require('fs');
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
      name: `${name}`,
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
    filesToUpload.push({
      tableId: tableId, 
      csv: csv
    });
  },
  importRows: (oauth, self, rl, next) => {
    if (filesToUpload.length > 0) {
      var obj = filesToUpload.pop();
      var tableId = obj.tableId;
      var body = obj.csv;
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
            }, 10000);
          } else if (err.message.indexOf("Content has a different number of columns than the table") >= 0) {
            rl.write('\n');
            rl.write(err.message);
            fs.writeFileSync(`log-${tableId}-${filesToUpload.length}.csv`, obj.csv, 'utf8');
            rl.write('\n');
            setTimeout(() => {
              self.importRows(oauth, self, rl, next);
            }, 10000);
          } else {
            console.log(err);
            fs.writeFileSync(`log-${tableId}-${filesToUpload.length}-error.csv`, obj, 'utf8');
            next(err);
          }
        } else {
          rl.write('.');
          setTimeout(() => {
            self.importRows(oauth, self, rl, next);
          }, 5000);
        }
      });
    } else {
      next();
    }
  }
};
