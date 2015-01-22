var http = require('http');
var grip = require('grip');

http.createServer(function (req, res) {
    // Validate the Grip-Sig header:
    if (!grip.validateSig(req.headers['grip-sig'], '<key>')) {
        return;
    }

    // Instruct the client to long poll via the response body:
    res.writeHead(200, {'Content-Type': 'application/grip-instruct'});
    res.end(grip.createHoldResponse('<channel>'));
}).listen(80, '0.0.0.0');

console.log('Server running...')
