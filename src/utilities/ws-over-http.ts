import { IncomingMessage } from "http";

import debug from './debug';
import { flattenHeader } from "./http";
import WebSocketContext from "../data/websocket/WebSocketContext";
import { decodeWebSocketEvents } from "./webSocketEvents";
import ConnectionIdMissingException from "../data/websocket/ConnectionIdMissingException";
import WebSocketDecodeEventException from "../data/websocket/WebSocketDecodeEventException";

const CONTENT_TYPE_WEBSOCKET_EVENTS = 'application/websocket-events';

export type ApiRequest = IncomingMessage & {
    body?: Buffer | string;
};

export function isWsOverHttp(req: IncomingMessage) {
    let contentTypeHeader = flattenHeader(req.headers['content-type']);
    if (contentTypeHeader != null) {
        const at = contentTypeHeader.indexOf(';');
        if (at >= 0) {
            contentTypeHeader = contentTypeHeader.substring(0, at);
        }
        debug("content-type header", contentTypeHeader);
    } else {
        debug("content-type header not present");
    }

    const acceptTypesHeader = flattenHeader(req.headers['accept']);
    if (acceptTypesHeader != null) {
        debug("accept header", acceptTypesHeader);
    } else {
        debug("accept header not present");
    }
    const acceptTypes = acceptTypesHeader?.split(',').map((item) => item.trim());
    debug("accept types", acceptTypes);

    return req.method === 'POST' && (
        contentTypeHeader === CONTENT_TYPE_WEBSOCKET_EVENTS ||
        acceptTypes?.includes(CONTENT_TYPE_WEBSOCKET_EVENTS)
    );
}

export async function getWebSocketContextFromReq(req: ApiRequest, prefix: string = '') {

    const cid = flattenHeader(req.headers['connection-id']);
    if (cid == null) {
        throw new ConnectionIdMissingException();
    }

    debug("Connection ID", cid);

    const subprotocols = ((req.headers['sec-websocket-protocol'] ?? '') as string).split(',');
    debug("Request subprotocols", subprotocols);

    // Handle meta keys
    debug("Handling Meta - start");
    const meta = {};
    for (const [key, value] of Object.entries(req.headers)) {
        const lKey = key.toLowerCase();
        if (lKey.startsWith('meta-')) {
            const k = lKey.substring(5);
            meta[k] = value;
            debug(k, "=", value);
        }
    }
    debug("Handling Meta - end");

    if (req.body == null) {
        debug("Reading body - start");
        req.body = await new Promise((resolve) => {
            const bodySegments: any[] = [];
            req.on('data', (chunk) => {
                bodySegments.push(chunk);
            });
            req.on('end', () => {
                const bodyBuffer = Buffer.concat(bodySegments);
                resolve(bodyBuffer);
            });
        });
        if (req.body != null) {
            if (req.body instanceof Buffer) {
                debug("body (Buffer)", req.body.toString('base64'));
            } else {
                debug("body (string)", req.body);
            }
        } else {
            debug("body is null");
        }
        debug("Reading body - end");
    }

    debug("Decode body - start");
    let events = null;
    try {
        events = decodeWebSocketEvents(req.body!);
    } catch (err) {
        throw new WebSocketDecodeEventException();
    }
    debug("Decode body - end");

    debug("Websocket Events", events);

    debug("Creating Websocket Context - start");
    const wsContext = new WebSocketContext(cid, meta, events, { prefix, subprotocols });
    debug("Creating Websocket Context - end");

    return wsContext;
}
