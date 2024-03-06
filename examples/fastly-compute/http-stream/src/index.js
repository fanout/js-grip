// noinspection DuplicatedCode

/// <reference types="@fastly/js-compute" />
import { SecretStore } from 'fastly:secret-store';
import { GripInstruct, parseGripUri, Publisher } from '@fanoutio/grip';
import { buildFanoutGripConfig } from '@fanoutio/grip/fastly-fanout';

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));

async function handleRequest({request}) {

    const requestUrl = new URL(request.url);

    // Configure the Publisher.
    // Settings are stored in a secret store
    const secretStore = new SecretStore('fastly_http_stream_config');
    let gripConfig = 'http://127.0.0.1:5561/';
    const gripUrl = (await secretStore.get('GRIP_URL'))?.plaintext();
    if (gripUrl) {
        gripConfig = parseGripUri(gripUrl, { 'verify-key': (await secretStore.get('GRIP_VERIFY_KEY'))?.plaintext() });
    } else {
        const fanoutServiceId = (await secretStore.get('FANOUT_SERVICE_ID'))?.plaintext();
        const fanoutApiToken = (await secretStore.get('FANOUT_API_TOKEN'))?.plaintext();
        if (fanoutServiceId != null && fanoutApiToken != null) {
            gripConfig = buildFanoutGripConfig({
                serviceId: fanoutServiceId,
                apiToken: fanoutApiToken,
            });
        }
    }

    // In Compute, we create a custom Publisher config that adds a backend
    // to the fetch parameter
    const publisher = new Publisher(gripConfig, {
        fetch(input, init) {
            return fetch(String(input), { ...init, backend: 'publisher' });
        },
    });

    // Find whether we are behind GRIP
    const gripStatus = await publisher.validateGripSig(request.headers.get('grip-sig'));

    if (request.method === 'GET' && requestUrl.pathname === '/api/stream') {
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

        // Create some GRIP instructions and hold the stream
        const gripInstruct = new GripInstruct('test');
        gripInstruct.setHoldStream();

        // Return the response
        // Include the GRIP instructions in the response headers
        return new Response(
            '[stream open]\n',
            {
                status: 200,
                headers: {
                    ...gripInstruct.toHeaders(),
                    'Content-Type': 'text/plain',
                },
            },
        );
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/publish') {
        // Only accept text bodies
        if (request.headers.get('content-type')?.split(';')[0] !== 'text/plain') {
            return new Response(
                'Body must be text/plain\n', {
                    status: 415,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                },
            );
        }

        // Read the body
        const body = await request.text();

        // Publish the body to GRIP clients that listen to http-stream format
        await publisher.publishHttpStream('test', body + '\n');

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
