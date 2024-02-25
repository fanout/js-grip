/// <reference types="@fastly/js-compute" />
import { SecretStore } from 'fastly:secret-store';
import { GripInstruct, parseGripUri, Publisher } from '@fanoutio/grip';

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {

    const request = event.request;
    const requestUrl = new URL(event.request.url);

    // Configure the Publisher.
    // Settings are stored in a secret store
    const secretStore = new SecretStore('fastly_http_stream_config');
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

    const gripStatus = await publisher.validateGripSig(request.headers.get('grip-sig'));

    if (request.method === 'GET' && requestUrl.pathname === '/api/stream') {
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

        const gripInstruct = new GripInstruct('test');
        gripInstruct.setHoldStream();

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
        await publisher.publishHttpStream('test', body + '\n');

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

    return new Response('Not found\n', { status: 404 });
}
