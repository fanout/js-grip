const http = require('http');
const {
    validateSig,
    decodeWebSocketEvents,
    encodeWebSocketEvents,
    WebSocketContext,
    WebSocketMessageFormat,
    Publisher,
} = require('@fanoutio/grip');

http.createServer(async (req, res) => {
    // Validate the Grip-Sig header:
    if (!validateSig(req.headers['grip-sig'], 'changeme')) {
        res.writeHead(401);
        res.end('invalid grip-sig token');
        return;
    }

    // Make sure we have a connection ID
    let cid = req.headers['connection-id'];
    if (Array.isArray(cid)) {
        cid = cid[0];
    }
    if (req.headers['connection-id'] == null) {
        res.writeHead(401);
        res.end('connection-id required');
        return;
    }

    const inEventsEncoded = await new Promise(resolve => {
        let body = '';
        req.on('data', function (chunk) {
            body += chunk;
        });
        req.on('end', function() {
            resolve(body);
        });
    });

    const inEvents = decodeWebSocketEvents(inEventsEncoded);
    const wsContext = new WebSocketContext(cid, {}, inEvents);

    if (wsContext.isOpening()) {
        // Open the WebSocket and subscribe it to a channel:
        wsContext.accept();
        wsContext.subscribe('<channel>');

        // The above commands made to the wsContext are buffered
        // in the wsContext as "outgoing events".
        // Obtain them and write them to the response.
        const outEvents = wsContext.getOutgoingEvents();
        const outEventsEncoded = encodeWebSocketEvents(outEvents);
        res.write(outEventsEncoded);

        // As an example way to check our subscription, wait and then
        // publish a message to the subscribed channel:
        setTimeout(() => {
            var publisher = new Publisher({
                'control_uri': '<myendpoint>',
            });
            publisher.publishFormats(
                '<channel>',
                new WebSocketMessageFormat('Test WebSocket Publish!!')
            );
        }, 5000);
    }

    // Set the headers required by the GRIP proxy:
    res.writeHead(200, wsContext.toHeaders());
    res.end();

}).listen(80, '0.0.0.0');

console.log('Server running...');
