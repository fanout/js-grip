/// <reference types="@fastly/js-compute" />
import { SecretStore } from 'fastly:secret-store';
import {
    parseGripUri,
    Publisher,
    encodeWebSocketEvents,
    WebSocketMessageFormat,
    isWsOverHttp,
    getWebSocketContextFromReq,
} from '@fanoutio/grip';

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {

    // Configure the Publisher.
    // Settings are stored in a secret store
    const secretStore = new SecretStore('fastly_websocket_config');
    const gripUrl = (await secretStore.get('GRIP_URL'))?.plaintext() ?? 'http://localhost:5561/';
    const gripVerifyKey = (await secretStore.get('GRIP_VERIFY_KEY')).plaintext();
    const gripConfig = parseGripUri(gripUrl, { 'verify-key': gripVerifyKey });

    // In Compute, we create a custom Publisher config that adds a backend
    // to the fetch parameter
    const publisher = new Publisher(gripConfig, {
        fetch(input, init) {
            return fetch(String(input), { ...init, backend: 'publisher' });
        },
    });

    const request = event.request;
    const requestUrl = new URL(event.request.url);

    // Find whether we are behind GRIP
    const gripStatus = await publisher.validateGripSig(request.headers.get('grip-sig'));

    // Find whether we have a WebSocket context
    let wsContext = null;
    if (gripStatus.isProxied && isWsOverHttp(request)) {
        wsContext = await getWebSocketContextFromReq(request);
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/websocket') {

        // Make sure we're behind a GRIP proxy before we proceed
        if (!gripStatus.isProxied) {
            return new Response(
                '[not proxied]\n',
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                },
            );
        }

        // Make sure we have a WebSocket context
        if (wsContext == null) {
            return new Response(
                '[not a websocket request]\n',
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                },
            );
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

        // Return the response
        return new Response(
            responseBody,
            {
                status: 200,
                headers: wsContext.toHeaders(),
            },
        );
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/broadcast') {

        // Only accept text bodies
        if (request.headers.get('content-type')?.split(';')[0] !== 'text/plain') {
            return new Response(
                'Body must be test/plain\n', {
                    status: 415,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                },
            );
        }

        // Read the body
        const body = await request.text();

        // Publish the body to GRIP clients that listen to ws-over-http format
        await publisher.publishFormats('test', new WebSocketMessageFormat(body));

        // Return a success response
        return new Response(
            'Ok\n',
            {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                },
            },
        );
    }

    // Return an error response
    return new Response('Not found\n', { status: 404 });
}
