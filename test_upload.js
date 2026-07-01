const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

const form = new FormData();
form.append('name', 'Test');
form.append('type', 'PARTICIPATION');
form.append('orientation', 'LANDSCAPE');
// Create a dummy PPTX file to test
fs.writeFileSync('test.pptx', 'dummy content for testing raw upload');
form.append('file', fs.createReadStream('test.pptx'));

const request = http.request({
  method: 'POST',
  host: 'localhost',
  port: 5000,
  path: '/api/v1/certificates/templates',
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer DUMMY' // it will fail auth, but I just want to see if it even reaches the route or fails in multer
  }
});

form.pipe(request);

request.on('response', function(res) {
  console.log('Status: ' + res.statusCode);
  res.on('data', function(chunk) {
    console.log('Body: ' + chunk);
  });
});
