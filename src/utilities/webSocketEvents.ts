import { IWebSocketEvent, WebSocketEvent } from '../data/index.js';
import { concatUint8Arrays } from './typedarray.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Encode the specified array of WebSocketEvent instances. The returned string
// value should then be passed to a GRIP proxy in the body of an HTTP response
// when using the WebSocket-over-HTTP protocol.
export function encodeWebSocketEvents(events: IWebSocketEvent[]) {
    const eventSegments: Uint8Array[] = [];
    const bufferNewLine = new Uint8Array([13, 10]);
    for (const e of events) {
        let content = e.getContent();
        if (content != null) {
            if (typeof content === 'string') {
                content = textEncoder.encode(content);
            } else if (Array.isArray(content)) {
                content = new Uint8Array(content);
            }
            eventSegments.push(
              textEncoder.encode(e.getType() + ' ' + content.length.toString(16)),
              bufferNewLine,
              content,
              bufferNewLine,
            );
        } else {
            eventSegments.push(
              textEncoder.encode(e.getType()),
              bufferNewLine,
            );
        }
    }
    return concatUint8Arrays(...eventSegments);
}

// Decode the specified HTTP request body into an array of WebSocketEvent
// instances when using the WebSocket-over-HTTP protocol. A RuntimeError
// is raised if the format is invalid.
export function decodeWebSocketEvents(body: Uint8Array | string): IWebSocketEvent[] {
    const out = [];
    let start = 0;
    let makeContentString = false;
    if (typeof body === 'string') {
        body = textEncoder.encode(body);
        makeContentString = true;
    }
    while (start < body.length) {
        let at = body.findIndex((val, x) => {
            if (x < start || x === body.length - 1) {
                return false;
            }
            if (val !== 13 || body.at(x+1) !== 10) {
                return false;
            }
            return true;
        });
        if (at === -1) {
            throw new Error('bad format');
        }
        const typeline = body.slice(start, at);
        start = at + 2;
        at = typeline.indexOf(32);
        let e = null;
        if (at !== -1) {
            const etype = typeline.slice(0, at);
            const clen = parseInt(textDecoder.decode(typeline.slice(at + 1)), 16);
            const content = body.slice(start, start + clen);
            start = start + clen + 2;
            if (makeContentString) {
                e = new WebSocketEvent(textDecoder.decode(etype), textDecoder.decode(content));
            } else {
                e = new WebSocketEvent(textDecoder.decode(etype), content);
            }
        } else {
            e = new WebSocketEvent(textDecoder.decode(typeline));
        }
        out.push(e);
    }
    return out;
}

// Generate a WebSocket control message with the specified type and optional
// arguments. WebSocket control messages are passed to GRIP proxies and
// example usage includes subscribing/unsubscribing a WebSocket connection
// to/from a channel.
export function createWebSocketControlMessage(type: string, args: object | null = null) {
    const out = Object.assign({}, args, { type });
    return JSON.stringify(out);
}
