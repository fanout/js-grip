const http = require('http');
const {
    validateSig,
    decodeWebSocketEvents,
    encodeWebSocketEvents,
    WebSocketContext,
    WebSocketMessageFormat,
    Publisher,
} = require('@fanoutio/grip');

const PUBLISHER = new Publisher({
    'control_uri': 'http://localhost:5561',
});

const CHANNEL = 'all';

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

    let responseBody;

    // Manually set headers to accept Websocket-over-HTTP
    res.setHeader('Content-Type', 'application/websocket-events');
    res.setHeader('Sec-WebSocket-Extensions', 'grip');

    // This header causes issues with Node v20.8.1 — wscat hangs and disconnects in 5 seconds
    res.removeHeader("Transfer-Encoding");

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

        // This adds a control messsage to output that goes to client (?)
        wsContext.subscribe(CHANNEL);
        // It doesn't work without it
        res.setHeader('Grip-Channel', CHANNEL);

        // The above commands made to the wsContext are buffered
        // in the wsContext as "outgoing events".
        // Obtain them and write them to the response.
        const outEvents = wsContext.getOutgoingEvents();
        const outEventsEncoded = encodeWebSocketEvents(outEvents);
        responseBody = outEventsEncoded;

        // As an example way to check our subscription, wait and then
        // publish a message to the subscribed channel:
        setTimeout(() => {
            PUBLISHER.publishFormats(CHANNEL, new WebSocketMessageFormat('Test WebSocket Publish!!'));
        }, 5000);
    } else {
        const [command, payload] = inEventsEncoded.split("\n").map(s => s.trim());
        const messageToClient = JSON.stringify({command, payload});
        PUBLISHER.publishFormats(CHANNEL, new WebSocketMessageFormat(messageToClient));
    }

    // Set the headers required by the GRIP proxy:
    res.writeHead(200);
    if (responseBody) { res.write(responseBody) };
    res.end();

}).listen(80, '0.0.0.0');

console.log('Server running...');
