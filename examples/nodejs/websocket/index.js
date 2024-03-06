// noinspection DuplicatedCode

import http from 'node:http';
import { parseGripUri, Publisher, encodeWebSocketEvents, WebSocketMessageFormat } from '@fanoutio/grip';
import { buildFanoutGripConfig } from '@fanoutio/grip/fastly-fanout';
import { isNodeReqWsOverHttp, getWebSocketContextFromNodeReq } from '@fanoutio/grip/node';
import 'isomorphic-fetch'; // Only needed for Node < 16.15

// Configure the Publisher.
let gripConfig = 'http://127.0.0.1:5561/';
const gripUrl = process.env.GRIP_URL;
if (gripUrl) {
    gripConfig = parseGripUri(gripUrl, { 'verify-key': process.env.GRIP_VERIFY_KEY });
} else {
    const fanoutServiceId = process.env.FANOUT_SERVICE_ID;
    const fanoutApiToken = process.env.FANOUT_API_TOKEN;
    if (fanoutServiceId != null && fanoutApiToken != null) {
        gripConfig = buildFanoutGripConfig({
            serviceId: fanoutServiceId,
            apiToken: fanoutApiToken,
        });
    }
}
const publisher = new Publisher(gripConfig);

const server = http.createServer(async (req, res) => {

    const requestUrl = new URL(req.url, (req.socket.encrypted ? 'https://' : 'http://') + req.headers['host']);

    // Find whether we are behind GRIP
    const gripStatus = await publisher.validateGripSig(req.headers['grip-sig']);

    // Find whether we have a WebSocket context
    let wsContext = null;
    if (gripStatus.isProxied && isNodeReqWsOverHttp(req)) {
        wsContext = await getWebSocketContextFromNodeReq(req);
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/websocket') {
        // Make sure we're behind a GRIP proxy before we proceed
        if (!gripStatus.isProxied) {
            res.writeHead(200, {
                'Content-Type': 'text/plain',
            });
            res.end('[not proxied]\n');
            return;
        }

        // Make sure we have a WebSocket context
        if (wsContext == null) {
            res.writeHead(400, {
                'Content-Type': 'text/plain',
            });
            res.end('[not a websocket request]\n');
            return;
        }

        // If this is a new connection, accept it and subscribe it to a channel
        if (wsContext.isOpening()) {
            wsContext.accept();
            wsContext.subscribe('test');
        }

        // wsContext has a buffer of queued-up incoming WebSocket messages.

        // Iterate this queue
        while (wsContext.canRecv()) {
            const message = wsContext.recv();

            if (message == null) {
                // If return value is undefined then connection is closed
                // Messages like this go into a queue of outgoing WebSocket messages
                wsContext.close();
                break;
            }

            // Echo the message
            // This is also a message that goes into the queue of outgoing WebSocket messages.
            wsContext.send(message);
        }

        // Serialize the outgoing messages
        const events = wsContext.getOutgoingEvents();
        const responseBody = encodeWebSocketEvents(events);

        // Write the response
        res.writeHead(200, wsContext.toHeaders());
        res.end(responseBody);
        return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/broadcast') {
        // Only accept text bodies
        if (req.headers['content-type'].split(';')[0] !== 'text/plain') {
            res.writeHead(415, {
                'Content-Type': 'text/plain',
            });
            res.end('Body must be text/plain\n');
            return;
        }

        // Read the body
        const body = await new Promise((resolve) => {
            const bodyParts = [];
            req.on('data', (chunk) => {
                bodyParts.push(chunk);
            });
            req.on('end', () => {
                resolve(Buffer.concat(bodyParts).toString());
            });
        });

        // Publish the body to GRIP clients that listen to ws-over-http format
        await publisher.publishFormats('test', new WebSocketMessageFormat(body));

        // Write a success response
        res.writeHead(200, {
            'Content-Type': 'text/plain',
        });
        res.end('Ok\n');
        return;
    }

    // Write an error response
    res.writeHead(404, {
        'Content-Type': 'text/plain',
    });
    res.end('Not found\n');
});

server.listen(3000, '0.0.0.0');

console.log('Server running...');
