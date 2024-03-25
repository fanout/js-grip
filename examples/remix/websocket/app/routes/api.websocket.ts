// noinspection DuplicatedCode

import { ActionFunctionArgs } from '@remix-run/node';
import { getWebSocketContextFromReq, isWsOverHttp, encodeWebSocketEvents } from '@fanoutio/grip';
import publisher from '~/utils/publisher';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return new Response(
            'Method not allowed',
            {
                status: 405,
            },
        );
    }

    // Find whether we are behind GRIP
    const gripStatus = await publisher.validateGripSig(request.headers.get('grip-sig'));

    // Find whether we have a WebSocket context
    let wsContext = null;
    if (gripStatus.isProxied && isWsOverHttp(request)) {
        wsContext = await getWebSocketContextFromReq(request);
    }

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
