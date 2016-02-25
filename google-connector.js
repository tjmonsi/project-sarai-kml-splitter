const fs = require('fs');
const parse = require('xml-parser');
const filename = process.argv[2];
const xml = fs.readFileSync(`suitability/${filename}`, 'utf8');
const makeCSV = require('./utils/make-csv.js');
const readline = require('readline');
const clientId = require('./api.json').clientId;
const clientSecret = require('./api.json').clientSecret;
const google = require('googleapis');
const oauth2 = google.auth.OAuth2;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var obj = parse(xml);

const getAccessToken = (oauth2Client, callback) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/fusiontables',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });
  
  console.log('Copy URL Below and get the code from there');
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
    makeCSV(obj.root, oauth2Client, rl, filename);  
  });
} else {
  throw Error('Please get Google OAuth2 clientId and clientSecret and put it at api.json');
}
