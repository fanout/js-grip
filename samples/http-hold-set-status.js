const http = require('http');
const { validateSig, GripInstruct } = require('@fanoutio/grip');

http.createServer((req, res) => {
    // Validate the Grip-Sig header:
    if (!validateSig(req.headers['grip-sig'], '<key>')) {
        res.writeHead(401);
        res.end('invalid grip-sig token');
        return;
    }

    // We intend to return a 304 status.

    // Instatiate GripInstruct object
    const gripInstruct = new GripInstruct();
    gripInstruct.addChannel('<channel>');
    gripInstruct.setHoldLongPoll();

    // Set 304 here
    gripInstruct.setStatus(304);

    // Return 200 for this response.
    res.writeHead(200, gripInstruct.toHeaders());

    res.end('[start longpoll]\n');
}).listen(80, '0.0.0.0');

console.log('Server running...');
