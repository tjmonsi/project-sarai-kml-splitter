const fs = require('fs');
const google = require('googleapis');
const readline = require('readline');
const clientId = require('./api.json').clientId;
const clientSecret = require('./api.json').clientSecret;
const parseFiles = require('./utils/parse-files.js');
const folder = process.argv[2] || 'kml';
const files = fs.readdirSync(folder);
const oauth2 = google.auth.OAuth2;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getAccessToken = (oauth2Client, callback) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/fusiontables',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });
  
  console.log('Copy URL Below and get the code from there\n');
  console.log(url);
  console.log('');
  
  rl.question('Enter the code here:', (code) => {
    oauth2Client.getToken(code, (err, tokens) => {
      if (err) throw err;
      oauth2Client.setCredentials(tokens);
      callback();
    });
  });
};

if (clientId && clientId.trim() !== '' && clientSecret && clientSecret.trim() !== '') {
  const oauth2Client = new oauth2(clientId, clientSecret, 'http://localhost');  
  
  getAccessToken(oauth2Client, () => {
    parseFiles(folder, files, rl, oauth2Client);
  });
} else {
  throw Error('Please get Google OAuth2 clientId and clientSecret and put it at api.json');
}
