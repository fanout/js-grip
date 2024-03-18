// noinspection DuplicatedCode

import { type IGripConfig, GripInstruct, parseGripUri, Publisher } from 'npm:@fanoutio/grip@^4.1';
import { buildFanoutGripConfig } from 'npm:@fanoutio/grip@^4.1/fastly-fanout';

// Configure the Publisher.
let gripConfig: string | IGripConfig = 'http://127.0.0.1:5561/';
const gripUrl = Deno.env.GRIP_URL;
if (gripUrl) {
    gripConfig = parseGripUri(gripUrl, { 'verify-key': Deno.env.GRIP_VERIFY_KEY });
} else {
    const fanoutServiceId = Deno.env.FANOUT_SERVICE_ID;
    const fanoutApiToken = Deno.env.FANOUT_API_TOKEN;
    if (fanoutServiceId != null && fanoutApiToken != null) {
        gripConfig = buildFanoutGripConfig({
            serviceId: fanoutServiceId,
            apiToken: fanoutApiToken,
        });
    }
}
const publisher = new Publisher(gripConfig);

async function handler(request: Request) {

    const requestUrl = new URL(request.url);

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

Deno.serve({ port: 3000 }, handler);
