import { IncomingHttpHeaders, IncomingMessage } from "http";

import debug from './debug';
import { readRequestBody } from "./http";
import WebSocketContext from "../data/websocket/WebSocketContext";
import { decodeWebSocketEvents } from "./webSocketEvents";
import ConnectionIdMissingException from "../data/websocket/ConnectionIdMissingException";
import WebSocketDecodeEventException from "../data/websocket/WebSocketDecodeEventException";

const CONTENT_TYPE_WEBSOCKET_EVENTS = 'application/websocket-events';

export interface IRequest {
    headers: IncomingHttpHeaders | NodeJS.Dict<string>;
    method?: string;
}

/**
 * Checks if a request is an Websocket-over-HTTP request.
 * This is true if the request meets these conditions:
 * - method is POST
 * - content-type header is 'application/websocket-events'
 * - accepts header contains 'application/websocket-events'
 * @param req
 * @returns boolean
 */
export function isWsOverHttp(req: IRequest): boolean {
    if (req.method !== 'POST') {
        return false;
    }

    let contentTypeHeader = req.headers['content-type'];
    if (contentTypeHeader != null) {
        [ contentTypeHeader ] = contentTypeHeader.split(';');
        contentTypeHeader = contentTypeHeader.trim();
    }
    if (contentTypeHeader == null || contentTypeHeader === '') {
        debug("content-type header not present");
        return false;
    }
    debug("content-type header", contentTypeHeader);

    const acceptTypesHeader = req.headers['accept'];
    if (acceptTypesHeader == null || acceptTypesHeader === '') {
        debug("accept header not present");
        return false;
    }
    debug("accept header", acceptTypesHeader);

    const acceptTypes = acceptTypesHeader.split(',')
        .map((item) => item.trim());
    debug("accept types", acceptTypes);

    return req.method === 'POST' && (
        contentTypeHeader === CONTENT_TYPE_WEBSOCKET_EVENTS ||
        acceptTypes?.includes(CONTENT_TYPE_WEBSOCKET_EVENTS)
    );
}

export async function getWebSocketContextFromReq(req: IncomingMessage, prefix: string = '') {

    const body = await readRequestBody(req);

    if (body == null) {
        debug("ERROR - body is null!");
        throw new WebSocketDecodeEventException();
    }

    return getWebSocketContext(req, body, prefix);

}

export async function getWebSocketContext(req: IRequest, body: string | Buffer, prefix: string = '') {

    let cid = req.headers['connection-id'];
    if (Array.isArray(cid)) {
        cid = cid.join(',');
    }
    if (cid != null) {
        [ cid ] = cid.split(',')
            .map(item => item.trim());
    }
    if (cid == null || cid === '') {
        throw new ConnectionIdMissingException();
    }

    let subprotocols = req.headers['sec-websocket-protocol'];
    if (Array.isArray(subprotocols)) {
        subprotocols = subprotocols.join(',');
    }
    if (subprotocols != null) {
        subprotocols = subprotocols.split(',')
            .map(item => item.trim());
    }
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

    debug("Decode body - start");
    let events = null;
    try {
        events = decodeWebSocketEvents(body);
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
