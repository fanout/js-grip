const http = require('http');
const { validateSig, GripInstruct } = require('@fanoutio/grip');

http.createServer((req, res) => {
    // Validate the Grip-Sig header:
    if (!validateSig(req.headers['grip-sig'], '<key>')) {
        res.writeHead(401);
        res.end('invalid grip-sig token');
        return;
    }

    // Instatiate GripInstruct object
    const gripInstruct = new GripInstruct();
    gripInstruct.addChannel('<channel>');
    gripInstruct.setHoldLongPoll();
    // To optionally set a timeout value in seconds:
    // gripInstruct.setHoldLongPoll(<timeout_value>);

    // Instruct the client to long poll via the response headers:
    res.writeHead(200, gripInstruct.toHeaders());

    res.end('[start longpoll]\n');
}).listen(80, '0.0.0.0');

console.log('Server running...');
