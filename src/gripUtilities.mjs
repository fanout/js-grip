import { Buffer } from 'buffer';
import url from 'url';
import querystring from 'querystring';
import jwt from 'jwt-simple';

import WebSocketEvent from "./data/websocket/WebSocketEvent.mjs";
import Response from "./data/Response.mjs";
import Channel from "./data/Channel.mjs";

import { isString, toBuffer } from "./utilities.mjs";

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
export function validateSig(token, key) {
    const keyBuffer = toBuffer(key);

    let claim;
    try {
        claim = jwt.decode(token, keyBuffer);
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
export function decodeWebSocketEvents(body) {
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
export function encodeWebSocketEvents(events) {
    let out = Buffer.alloc(0);
    const bufferNewLine = Buffer.from('\r\n');
    for (const e of events) {
        let content = e.getContent();
        if (content != null) {
            if (!Buffer.isBuffer(content)) {
                content = Buffer.from(content);
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
export function createGripChannelHeader(channels) {
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

// A convenience method for creating GRIP hold response instructions for HTTP
// long-polling. This method simply passes the specified parameters to the
// create_hold method with 'response' as the hold mode.
export function createHoldResponse(channels, response, timeout) {
    return createHold('response', channels, response, timeout);
}

// A convenience method for creating GRIP hold stream instructions for HTTP
// streaming. This method simply passes the specified parameters to the
// create_hold method with 'stream' as the hold mode.
export function createHoldStream(channels, response) {
    return createHold('stream', channels, response);
}

// Create GRIP hold instructions for the specified mode, channels, response
// and optional timeout value. The channel parameter can be specified as
// either a string representing the channel name, a Channel instance or an
// array of Channel instances. The response parameter can be specified as
// either a string representing the response body or a Response instance.
export function createHold(mode, channels, response, timeout) {
    channels = parseChannels(channels);
    const holdChannels = getHoldChannels(channels);
    let instruct = {};
    if (typeof timeout === 'undefined') {
        instruct = {
            hold: {
                mode: mode,
                channels: holdChannels
            }
        };
    } else {
        instruct = {
            hold: {
                mode: mode,
                channels: holdChannels,
                timeout: timeout
            }
        };
    }

    if (isString(response)) {
        response = new Response(null, null, null, response);
    }
    if (response instanceof Response) {
        instruct.response = response.export();
    }

    return JSON.stringify(instruct);
}

// Parse the specified GRIP URI into a config object that can then be passed
// to the GripPubControl class. The URI can include 'iss' and 'key' JWT
// authentication query parameters as well as any other required query string
// parameters. The JWT 'key' query parameter can be provided as-is or in base64
// encoded format.
export function parseGripUri(uri) {
    uri = url.parse(uri);
    let iss = null;
    let key = null;
    let query = uri.query || '';
    // HACK: work around '+' character in base64-encoded values
    query = query.replace(/\+/g, '%2B');
    const params = querystring.parse(query);
    if ('iss' in params) {
        iss = params['iss'];
        delete params['iss'];
    }
    if ('key' in params) {
        key = params['key'];
        delete params['key'];
    }
    if (key != null && key.startsWith('base64:')) {
        key = Buffer.from(key.substring(7), 'base64');
    }
    const qs = querystring.stringify(params);
    let path = uri.pathname;
    if (path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    let controlUri = uri.protocol + '//' + uri.host + path;
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
export function parseChannels(channels) {
    if (channels instanceof Channel) {
        channels = [channels];
    } else if (isString(channels)) {
        channels = [new Channel(channels)];
    }
    return channels;
}

// An internal Get an array of hashes representing the specified channels parameter. The
// resulting array is used for creating GRIP proxy hold instructions.
export function getHoldChannels(channels) {
    const holdChannels = [];
    for (let channel of channels) {
        if (isString(channel)) {
            channel = new Channel(channel);
        }
        if (channel instanceof Channel) {
            holdChannels.push(channel.export());
        }
    }
    return holdChannels;
}

// Generate a WebSocket control message with the specified type and optional
// arguments. WebSocket control messages are passed to GRIP proxies and
// example usage includes subscribing/unsubscribing a WebSocket connection
// to/from a channel.
export function buildWebSocketControlMessage(type, args = null) {
    const out = Object.assign({}, args, { type });
    return JSON.stringify(out);
}
