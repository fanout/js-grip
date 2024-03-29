// noinspection DuplicatedCode

import http from 'node:http';
import { GripInstruct, parseGripUri, Publisher } from '@fanoutio/grip';
import { buildFanoutGripConfig } from '@fanoutio/grip/fastly-fanout';
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

    if (req.method === 'GET' && requestUrl.pathname === '/api/stream') {
        // Make sure we're behind a GRIP proxy before we proceed
        if (!gripStatus.isProxied) {
            res.writeHead(200, {
                'Content-Type': 'text/plain',
            });
            res.end('[not proxied]\n');
            return;
        }

        // Create some GRIP instructions and hold the stream
        const gripInstruct = new GripInstruct('test');
        gripInstruct.setHoldStream();

        // Write the response
        // Include the GRIP instructions in the response headers
        res.writeHead(200, {
            ...gripInstruct.toHeaders(),
            'Content-Type': 'text/plain',
        });
        res.end('[stream open]\n');
        return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/publish') {
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

        // Publish the body to GRIP clients that listen to http-stream format
        await publisher.publishHttpStream('test', body + '\n');

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
