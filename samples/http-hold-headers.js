var http = require('http');
var grip = require('grip');

http.createServer(function (req, res) {
    // Validate the Grip-Sig header:
    if (!grip.validateSig(req.headers['grip-sig'], '<key>')) {
        return;
    }

    // Instruct the client to long poll via the response headers:
    res.writeHead(200, {
            'Grip-Hold': 'response',
            'Grip-Channel': grip.createGripChannelHeader('<channel>')});
    res.end();
}).listen(80, '0.0.0.0');

console.log('Server running...')
