// noinspection DuplicatedCode

import { WebSocketMessageFormat } from '@fanoutio/grip';
import publisher from '@/utils/publisher';

export async function POST(request: Request) {
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
