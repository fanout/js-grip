/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2015 Fanout, Inc.
 * File name: grip.js
 * File contains: the GRIP interface functionality.
 * File authors: 
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var jwt = require('jwt-simple');
var url = require('url');
var querystring = require('querystring');
var grChannel = require('./channel');
var grResponse = require('./response');
var httpstreamformat = require('./httpstreamformat');
var httpresponseformat = require('./httpresponseformat');
var websocketevent = require('./websocketevent');
var websocketmessageformat = require('./websocketmessageformat');
var grippubcontrol = require('./grippubcontrol');
var utilities = require('./utilities');

// The GripControl class provides functionality that is used in conjunction
// with GRIP proxies. This includes facilitating the creation of hold
// instructions for HTTP long-polling and HTTP streaming, parsing GRIP URIs
// into config objects, validating the GRIP-SIG header coming from GRIP
// proxies, creating GRIP channel headers, and also WebSocket-over-HTTP
// features such as encoding/decoding web socket events and generating
// control messages.

// Validate the specified JWT token and key. This method is used to validate
// the GRIP-SIG header coming from GRIP proxies such as Pushpin or Fanout.io.
// Note that the token expiration is also verified.
var validateSig = function(token, key) {
    var keyBuffer = utilities.toBuffer(key);

    var claim;
    try {
        claim = jwt.decode(token, key);
    } catch(e) {
        return false;
    } 
    
    if (!('exp' in claim)) {
        return false;
    }
    
    var exp = claim['exp'];
    if (new Date().getTime()/1000 > exp) {
        return false;
    }
    
    return true;
};

// Decode the specified HTTP request body into an array of WebSocketEvent
// instances when using the WebSocket-over-HTTP protocol. A RuntimeError
// is raised if the format is invalid.
var decodeWebSocketEvents = function(body) {
    var out = [];
    var start = 0;
    var makeContentString = false;
    if (utilities.isString(body)) {
        body = new Buffer(body);
        makeContentString = true;
    }
    while (start < body.length) {
        var at = body.indexOf('\r\n', start)
        if (at == -1) {
            throw new Error('bad format');
        }
        var typeline = body.slice(start, at);
        start = at + 2;
        at = typeline.indexOf(' ')
        var e = null;
        if (at != -1) {
            var etype = typeline.slice(0, at);
            var clen = parseInt(typeline.slice(at + 1).toString(), 16);
            var content = body.slice(start, start + clen);
            start = start + clen + 2;
            if (makeContentString) {
                e = new websocketevent.WebSocketEvent(etype.toString(),
                        content.toString());
            } else {
                e = new websocketevent.WebSocketEvent(etype.toString(), content);
            }
        }
        else {
            e = new websocketevent.WebSocketEvent(typeline.toString());
        }
        out.push(e);
    }
    return out;
};

// Encode the specified array of WebSocketEvent instances. The returned string
// value should then be passed to a GRIP proxy in the body of an HTTP response
// when using the WebSocket-over-HTTP protocol.
var encodeWebSocketEvents = function(events) {
    var out = new Buffer(0);
    var bufferNewLine = new Buffer('\r\n');
    events.forEach(function(e) {
        var content = e.getContent();
        if (content != null) {
            if (!Buffer.isBuffer(content)) {
                content = new Buffer(content);
            }
            out = Buffer.concat([out, new Buffer(e.getType()), new Buffer(' '),
                    new Buffer(content.length.toString(16)),
                    bufferNewLine, content, bufferNewLine]);
        }
        else {
            out = Buffer.concat([out, new Buffer(e.getType()),
                    bufferNewLine]);
        }
    });
    return out;
};

// Generate a WebSocket control message with the specified type and optional
// arguments. WebSocket control messages are passed to GRIP proxies and
// example usage includes subscribing/unsubscribing a WebSocket connection
// to/from a channel.
var webSocketControlMessage = function(type, args) {
    var out = {};
    if (args) {
        out = JSON.parse(JSON.stringify(args));
    }
    out['type'] = type;
    return JSON.stringify(out);
}

// Create a GRIP channel header for the specified channels. The channels
// parameter can be specified as a string representing the channel name,
// a Channel instance, or an array of Channel instances. The returned GRIP
// channel header is used when sending instructions to GRIP proxies via
// HTTP headers.
var createGripChannelHeader = function(channels) {
    channels = parseChannels(channels);
    var parts = [];
    channels.forEach(function(channel) {
        var channelExport = channel.export();
        var s = channelExport.name;
        if (channelExport.prevId) {
            s += '; prev-id=' + channelExport.prevId;
        }
        parts.push(s);
    });
    return parts.join(', ');
};

// A convenience method for creating GRIP hold response instructions for HTTP
// long-polling. This method simply passes the specified parameters to the
// create_hold method with 'response' as the hold mode.
var createHoldResponse = function(channels, response, timeout) {
    return createHold('response', channels, response, timeout);
};

// A convenience method for creating GRIP hold stream instructions for HTTP
// streaming. This method simply passes the specified parameters to the
// create_hold method with 'stream' as the hold mode.
var createHoldStream = function(channels, response) {
    return createHold('stream', channels, response);
};

// Create GRIP hold instructions for the specified mode, channels, response
// and optional timeout value. The channel parameter can be specified as
// either a string representing the channel name, a Channel instance or an
// array of Channel instances. The response parameter can be specified as
// either a string representing the response body or a Response instance.
var createHold = function(mode, channels, response, timeout) {
    channels = parseChannels(channels);
    var holdChannels = getHoldChannels(channels);
    var instruct = {};
    if (typeof timeout === 'undefined') {
        instruct = {
            hold: {
                mode: mode,
                channels: holdChannels
            }
        };
    }
    else {
        instruct = {
            hold: {
                mode: mode,
                channels: holdChannels,
                timeout: timeout
            }
        };
    }

    if (utilities.isString(response)) {
        response = new grResponse.Response(null, null, null, response);
    }
    if (response instanceof grResponse.Response) {
        instruct.response = response.export();
    }

    return JSON.stringify(instruct);
};

// Parse the specified GRIP URI into a config object that can then be passed
// to the GripPubControl class. The URI can include 'iss' and 'key' JWT
// authentication query parameters as well as any other required query string
// parameters. The JWT 'key' query parameter can be provided as-is or in base64
// encoded format.
var parseGripUri = function(uri) {
    uri = url.parse(uri);
    var iss = null;
    var key = null;
    var query = uri.query || '';
    // HACK: work around '+' character in base64-encoded values
    query = query.replace(/\+/g, '%2B');
    var params = querystring.parse(query);
    if ('iss' in params) {
        iss = params['iss'];
        delete params['iss'];
    }
    if ('key' in params) {
        key = params['key'];
        delete params['key'];
    }
    if (key && key.indexOf('base64:') == 0) {
        key = new Buffer(key.substring(7), 'base64');
    }
    var qs = querystring.stringify(params);
    var path = uri.pathname;
    if (path.substring(path.length - 1) == '/') {
        path = path.substring(0, path.length - 1);
    }
    var controlUri = uri.protocol + '//' + uri.host + path;
    if (qs && qs != '') {
        controlUri = controlUri + '?' + qs;
    }
    var out = {'control_uri': controlUri};
    if (iss) {
        out['control_iss'] = iss;
    }
    if (key) {
        out['key'] = key;
    }
    return out;
};

// An internal method for parsing the specified parameter into an
// array of Channel instances. The specified parameter can either
// be a string, a Channel instance, or an array of Channel instances.
var parseChannels = function(channels) {
    if (channels instanceof grChannel.Channel) {
        channels = [channels];
    }
    else if (utilities.isString(channels)) {
        channels = [new grChannel.Channel(channels)];
    }
    return channels;
};

// An internal Get an array of hashes representing the specified channels parameter. The
// resulting array is used for creating GRIP proxy hold instructions.
var getHoldChannels = function(channels) {
    var holdChannels = [];
    channels.forEach(function(channel) {
        if (utilities.isString(channel)) {
            channel = new grChannel.Channel(channel);
        }
        if (channel instanceof grChannel.Channel) {
            holdChannels.push(channel.export());
        }
    });
    return holdChannels;
};

exports.Channel = grChannel.Channel;
exports.Response = grResponse.Response;
exports.HttpResponseFormat = httpresponseformat.HttpResponseFormat;
exports.HttpStreamFormat = httpstreamformat.HttpStreamFormat;
exports.GripPubControl = grippubcontrol.GripPubControl;
exports.createHold = createHold;
exports.createHoldResponse = createHoldResponse;
exports.createHoldStream = createHoldStream;
exports.createGripChannelHeader = createGripChannelHeader;
exports.validateSig = validateSig;
exports.parseGripUri = parseGripUri;
exports.WebSocketMessageFormat = websocketmessageformat.WebSocketMessageFormat;
exports.WebSocketEvent = websocketevent.WebSocketEvent;
exports.decodeWebSocketEvents = decodeWebSocketEvents;
exports.encodeWebSocketEvents = encodeWebSocketEvents;
exports.webSocketControlMessage = webSocketControlMessage;
exports.parseChannels = parseChannels;
exports.getHoldChannels = getHoldChannels;
