import { Buffer } from 'buffer';
import * as url from 'url';
import * as querystring from 'querystring';
import * as jwt from 'jwt-simple';

import WebSocketEvent from "./data/websocket/WebSocketEvent";
import Channel from "./data/Channel";

import { isString, parseQueryString, toBuffer } from "./utilities";
import IWebSocketEvent from "./data/websocket/IWebSocketEvent";

type Channels = Channel | Channel[] | string | string[];

// This file provides utilities that can be used in conjunction
// with GRIP proxies. This includes facilitating the creation of hold
// instructions for HTTP long-polling and HTTP streaming, parsing GRIP URIs
// into config objects, validating the GRIP-SIG header coming from GRIP
// proxies, creating GRIP channel headers, and also WebSocket-over-HTTP
// features such as encoding/decoding web socket events and generating
// control messages.

// Validate the specified JWT token and key. This method is used to validate
// the GRIP-SIG header coming from GRIP proxies such as Pushpin or Fanout.io.
// Note that the token expiration is also verified.
export function validateSig(token: string, key: any) {
    const keyBuffer = toBuffer(key);

    let claim;
    try {
        // HACK: jwt-simple's d.ts says decode takes a string, but
        // it works fine with buffer.
        claim = jwt.decode(token, keyBuffer as unknown as string);
    } catch(e) {
        return false;
    }

    if (!('exp' in claim)) {
        return false;
    }

    const { exp } = claim;
    return new Date().getTime() / 1000 <= exp;
}

// Decode the specified HTTP request body into an array of WebSocketEvent
// instances when using the WebSocket-over-HTTP protocol. A RuntimeError
// is raised if the format is invalid.
export function decodeWebSocketEvents(body: Buffer | string): IWebSocketEvent[] {
    const out = [];
    let start = 0;
    let makeContentString = false;
    if (isString(body)) {
        body = Buffer.from(body);
        makeContentString = true;
    }
    while (start < body.length) {
        let at = body.indexOf('\r\n', start);
        if (at === -1) {
            throw new Error('bad format');
        }
        const typeline = body.slice(start, at);
        start = at + 2;
        at = typeline.indexOf(' ');
        let e = null;
        if (at !== -1) {
            const etype = typeline.slice(0, at);
            const clen = parseInt(typeline.slice(at + 1).toString(), 16);
            const content = body.slice(start, start + clen);
            start = start + clen + 2;
            if (makeContentString) {
                e = new WebSocketEvent(etype.toString(),
                    content.toString());
            } else {
                e = new WebSocketEvent(etype.toString(), content);
            }
        } else {
            e = new WebSocketEvent(typeline.toString());
        }
        out.push(e);
    }
    return out;
}

// Encode the specified array of WebSocketEvent instances. The returned string
// value should then be passed to a GRIP proxy in the body of an HTTP response
// when using the WebSocket-over-HTTP protocol.
export function encodeWebSocketEvents(events: IWebSocketEvent[]) {
    let out = Buffer.alloc(0);
    const bufferNewLine = Buffer.from('\r\n');
    for (const e of events) {
        let content = e.getContent();
        if (content != null) {
            if (isString(content)) {
                content = Buffer.from(content);
            } else {
                if (!Buffer.isBuffer(content)) {
                    content = Buffer.from(content);
                }
            }
            out = Buffer.concat([out, Buffer.from(e.getType()), Buffer.from(' '),
                Buffer.from(content.length.toString(16)),
                bufferNewLine, content, bufferNewLine]);
        } else {
            out = Buffer.concat([out, Buffer.from(e.getType()),
                bufferNewLine]);
        }
    }
    return out;
}

// Create a GRIP channel header for the specified channels. The channels
// parameter can be specified as a string representing the channel name,
// a Channel instance, or an array of Channel instances. The returned GRIP
// channel header is used when sending instructions to GRIP proxies via
// HTTP headers.
export function createGripChannelHeader(channels: Channels) {
    channels = parseChannels(channels);
    const parts = [];
    for (const channel of channels) {
        const channelExport = channel.export();
        let s = channelExport.name;
        if (channelExport.prevId) {
            s += '; prev-id=' + channelExport.prevId;
        }
        parts.push(s);
    }
    return parts.join(', ');
}

// Parse the specified GRIP URI into a config object that can then be passed
// to the Publisher class. The URI can include 'iss' and 'key' JWT
// authentication query parameters as well as any other required query string
// parameters. The JWT 'key' query parameter can be provided as-is or in base64
// encoded format.
export function parseGripUri(uri: string) {
    const parsedUri = url.parse(uri);
    let iss: string | null = null;
    let key: Buffer | string | null = null;

    const params = parseQueryString(parsedUri.query || '');
    if ('iss' in params) {
        iss = params['iss'];
        delete params['iss'];
    }
    if ('key' in params) {
        key = params['key'];
        delete params['key'];
    }
    if (key != null && isString(key) && key.startsWith('base64:')) {
        key = Buffer.from(key.substring(7), 'base64');
    }
    const qs = querystring.stringify(params);
    let path = parsedUri.pathname;
    if (path != null && path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    let controlUri = parsedUri.protocol + '//' + parsedUri.host + path;
    if (qs != null && qs !== '') {
        controlUri = controlUri + '?' + qs;
    }
    const out = {'control_uri': controlUri};
    if (iss) {
        out['control_iss'] = iss;
    }
    if (key) {
        out['key'] = key;
    }
    return out;
}

// An internal method for parsing the specified parameter into an
// array of Channel instances. The specified parameter can either
// be a string, a Channel instance, or an array of Channel instances.
export function parseChannels(inChannels: Channels): Channel[] {
    const channels = !Array.isArray(inChannels) ? [inChannels] : inChannels;
    return channels.map(channel => isString(channel) ? new Channel(channel) : channel);
}

// Generate a WebSocket control message with the specified type and optional
// arguments. WebSocket control messages are passed to GRIP proxies and
// example usage includes subscribing/unsubscribing a WebSocket connection
// to/from a channel.
export function buildWebSocketControlMessage(type: string, args: object | null = null) {
    const out = Object.assign({}, args, { type });
    return JSON.stringify(out);
}
