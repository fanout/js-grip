import debug from './debug';

import { decodeWebSocketEvents } from "./webSocketEvents";
import { IApiRequest } from "../engine";
import { ConnectionIdMissingException, WebSocketContext, WebSocketDecodeEventException } from "../data";
import { IncomingMessage } from "http";
import { NodeApiRequest } from "../node";

const CONTENT_TYPE_WEBSOCKET_EVENTS = 'application/websocket-events';

export function isApiRequestWsOverHttp(req: IApiRequest<any>) {
    let contentTypeHeader = req.getHeaderValue('content-type');
    if (contentTypeHeader != null) {
        const at = contentTypeHeader.indexOf(';');
        if (at >= 0) {
            contentTypeHeader = contentTypeHeader.substring(0, at);
        }
        debug("content-type header", contentTypeHeader);
    } else {
        debug("content-type header not present");
    }

    const acceptTypesHeader = req.getHeaderValue('accept');
    if (acceptTypesHeader != null) {
        debug("accept header", acceptTypesHeader);
    } else {
        debug("accept header not present");
    }
    const acceptTypes = acceptTypesHeader?.split(',').map((item) => item.trim());
    debug("accept types", acceptTypes);

    return req.getMethod() === 'POST' && (
        contentTypeHeader === CONTENT_TYPE_WEBSOCKET_EVENTS ||
        acceptTypes?.includes(CONTENT_TYPE_WEBSOCKET_EVENTS)
    );
}

export async function getWebSocketContextFromApiRequest(req: IApiRequest<any>, prefix: string = '') {

    const cid = req.getHeaderValue('connection-id');
    if (cid == null) {
        throw new ConnectionIdMissingException();
    }

    debug("Connection ID", cid);

    // Handle meta keys
    debug("Handling Meta - start");
    const meta = {};
    for (const [key, value] of Object.entries(req.getHeaders())) {
        const lKey = key.toLowerCase();
        if (lKey.startsWith('meta-')) {
            const k = lKey.substring(5);
            meta[k] = value;
            debug(k, "=", value);
        }
    }
    debug("Handling Meta - end");

    const body = await req.getBody();

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
    const wsContext = new WebSocketContext(cid, meta, events, prefix);
    debug("Creating Websocket Context - end");

    return wsContext;
}

// Node.js implementations
export function isWsOverHttp(req: IncomingMessage) {
    return isApiRequestWsOverHttp(NodeApiRequest.for(req));
}

export function getWebSocketContextFromReq(req: IncomingMessage, prefix: string = '') {
    return getWebSocketContextFromApiRequest(NodeApiRequest.for(req), prefix);
}
