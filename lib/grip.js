/*
 * node-grip
 * GRIP interface library for NodeJS
 * (C) 2013 Fanout, Inc.
 * File authors:
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

// Version String
var version = '1.3.0';

// Dependencies
var jwt = require('jwt-simple');
var url = require('url');
var querystring = require('querystring');
var pubcontrol = require('pubcontrol');
var jspack = require('jspack').jspack;

////////////////////////////////////////
// General Utilities

// Type Detection
var objectToString = Object.prototype.toString;
var functionObjectIdentifier = objectToString.call(function(){});
var isFunction = function(obj) {
    return obj && objectToString.call(obj) === functionObjectIdentifier;
};
var arrayObjectIdentifier = objectToString.call([]);
var isArray = function(obj) {
    return obj && objectToString.call(obj) === arrayObjectIdentifier;
};
var stringObjectIdentifier = objectToString.call('');
var isString = function(obj) {
    return obj && objectToString.call(obj) === stringObjectIdentifier;
};

// Check if input is a buffer already.
// If not, turn it into a string and then encode the bits of its UTF-8 representation
// into a new Buffer.
var toBuffer = function(input) {
    return Buffer.isBuffer(input) ? input : new Buffer(input.toString(), 'utf8');
};

// Objects
var extend = function() {
    var args = Array.prototype.slice.call(arguments);

    var obj;
    if (args.length > 1) {
        obj = args.shift();
    } else {
        obj = {};
    }

    while(args.length > 0) {
        var opts = args.shift();
        if(opts != null) {
            for(prop in opts) {
                obj[prop] = opts[prop];
            }
        }
    }

    return obj;
};

var extendClass = function(prototype) {
    var constructor, properties;
    var argc = arguments.length;
    if (argc >= 3) {
        constructor = arguments[1];
        properties = arguments[2];
    } else if (argc == 2) {
        var arg = arguments[1];
        if(isFunction(arg)) {
            constructor = arg;
            properties = null;
        } else {
            constructor = function(){};
            properties = arg;
        }
    } else if (argc == 1) {
        constructor = function(){};
        properties = null;
    }

    if (isFunction(prototype)) {
        prototype = new prototype();
    }

    if(prototype) {
        constructor.prototype = prototype;
    }
    if(properties) {
        extend(constructor.prototype, properties);
    }
    return constructor;
};

var defineClass = function() {
    var args = [null].concat(Array.prototype.slice.call(arguments));
    return extendClass.apply(this, args);
};

// String or Binary?  returns a hash with either the string or buffer
// value set.
var isStringOrBinary = function(data) {
    var string = null;
    var buffer = null;
    if(Buffer.isBuffer(data)) {
        buffer = data;
    } else {
        string = data.toString();
    }
    return {string: string, buffer: buffer};
};

////////////////////////////////////////
// Classes

var Channel = defineClass(function(name, prevId) {
    this.name = name;
    this.prevId = prevId;
}, {
    export: function() {
        var obj = {name: this.name};
        if (this.prevId) {
            obj.prevId = this.prevId;
        }
        return obj;
    }
});

var Response = defineClass(function(code, reason, headers,body) {
    if(arguments.length == 1) {
        var obj = arguments[0];
        code = obj.code;
        reason = obj.reason;
        headers = obj.headers;
        body = obj.body;
    }
    this.code = code;
    this.reason = reason;
    this.headers = headers;
    this.body = body;
}, {
    export: function() {
        var obj = {};
        if (this.code) {
            obj.code = this.code;
        }
        if (this.reason) {
            obj.reason = this.reason;
        }
        if (this.headers) {
            obj.headers = this.headers;
        }
        if (this.body) {
            if(Buffer.isBuffer(this.body)) {
                obj['body-bin'] = this.body.toString('base64');
            } else {
                obj['body'] = this.body.toString();
            }
        }
        return obj;
    }
});

// HttpResponseFormat
var HttpResponseFormat = defineClass(function(code, reason, headers, body) {
    // If only one parameter, then treat it as an options object
    if(arguments.length == 1) {
        var obj = arguments[0];
        code = obj.code;
        reason = obj.reason;
        headers = obj.headers;
        body = obj.body;
    }
    this.code = code;
    this.reason = reason;
    this.headers = headers;
    this.body = body;
}, {
    name: function() { return 'http-response'; },
    export: function() {
        var obj = {};
        if(this.code) {
            obj.code = this.code;
        }
        if(this.reason) {
            obj.reason = this.reason;
        }
        if(this.headers) {
            obj.headers = this.headers;
        }
        if(this.body) {
            if(Buffer.isBuffer(this.body)) {
                obj['body-bin'] = this.body.toString('base64');
            } else {
                obj['body'] = this.body.toString();
            }
        }
        return obj;
    }
});

// HttpStreamFormat
var HttpStreamFormat = defineClass(function(content, close) {
    if (typeof content === 'undefined' && !close) {
        throw new Error('HttpStreamFormat requires content.');
    }
    this.content = content;
    this.close = close;
}, {
    name: function() { return 'http-stream'; },
    export: function() {
        var obj = {};
        if(this.close) {
            obj['action'] = 'close';
        } else {
            if(Buffer.isBuffer(this.content)) {
                obj['content-bin'] = this.content.toString('base64');
            } else {
                obj['content'] = this.content.toString();
            }
        }
        return obj;
    }
});

// GripPubControl publisher class
var GripPubControl = defineClass(function(config) {
    if (arguments.length == 1) {
        this.applyGripConfig(config);
    }
    else {
        this.pubControl = new pubcontrol.PubControl();
    }
}, {
    applyGripConfig: function (config) {
        pubControl = null;
        if (typeof this.pubControl !== 'undefined') {
            pubControl = this.pubControl;
        }
        else {
            pubControl = new pubcontrol.PubControl();
        } 
        var config = isArray(config) ? config : [config];
        config.forEach(function(entry) {
            if (!('control_uri' in entry)) {
                return;
            }
            var client = new pubcontrol.PubControlClient(entry['control_uri']);
            if ('control_iss' in entry) {
                client.setAuthJwt({'iss': entry['control_iss']}, entry['key']);
            }
            pubControl.addClient(client);
        });
        this.pubControl = pubControl;
    },
    removeAllClients: function () {
        this.pubControl.removeAllClients();
    },
    addClient: function (client) {
        this.pubControl.addClient(client);
    },
    publish: function (channel, item, cb) {
        this.pubControl.publish(channel, item, cb);
    },
    applyConfig: function (config) {
        this.pubControl.applyConfig(config);
    },
    publishHttpResponse: function (channel, httpResponse, id, prevId, cb) {
        // id and prevId are optional, so if cb is passed as third parameter, then
        // remap params.
        if (isFunction(id)) {
            cb = id;
            id = undefined;
            prevId = undefined;
        }
        if (!(httpResponse instanceof HttpResponseFormat)) {
            httpResponse = new HttpResponseFormat({body: httpResponse});
        }
        var item = new pubcontrol.Item(httpResponse, id, prevId);
        this.pubControl.publish(channel, item, cb);
    },
    publishHttpStream: function (channel, httpStream, id, prevId, cb) {
        // id and prevId are optional, so if cb is passed as third parameter, then
        // remap params.
        if (isFunction(id)) {
            cb = id;
            id = undefined;
            prevId = undefined;
        }
        if (!(httpStream instanceof HttpStreamFormat)) {
            httpStream = new HttpStreamFormat(httpStream);
        }
        var item = new pubcontrol.Item(httpStream, id, prevId);
        this.pubControl.publish(channel, item, cb);
    }
});

// WebSocketMessageFormat
var WebSocketMessageFormat = defineClass(function(content) {
    this.content = content;
}, {
    name: function() { return 'ws-message'; },
    export: function() {
        var obj = {};
        if(Buffer.isBuffer(this.content)) {
            obj['content-bin'] = this.content.toString('base64');
        } else {
            obj['content'] = this.content.toString();
        }
        return obj;
    }
});

// WebSocketEvent
var WebSocketEvent = defineClass(function(type, content) {
    this.type = type;
    this.content = content;
}, {
    getType: function() {
        return this.type;
    },
    getContent: function() {
        return this.content;
    }
});

// Signature Validation
var validateSig = function(token, key) {
    var keyBuffer = toBuffer(key);

    var claim;
    try {
        claim = jwt.decode(token, key);
    } catch(e) {
        return false;
    } 
    
    if(!('exp' in claim)) {
        return false;
    }
    
    var exp = claim['exp'];
    if (new Date().getTime()/1000 > exp) {
        return false;
    }
    
    return true;
};

// Utility
var decodeWebSocketEvents = function(body) {
    var out = [];
    var start = 0;
    while (start < body.length) {
        at = body.indexOf("\r\n", start);
        if (at == -1) {
            throw new Error('bad format');
        }
        var typeline = body.substring(start, at);
        start = at + 2;
        at = typeline.indexOf(' ');
        e = null;
        if (at != -1) {
            var etype = typeline.substring(0, at);
            var clen = parseInt(typeline.substring(at + 1), 16);
            var content = body.substring(start, start + clen);
            start = start + clen + 2;
            e = new WebSocketEvent(etype, content);
        }
        else {
            e = new WebSocketEvent(typeline);
        }
        out.push(e);
    }
    return out;
};
var encodeWebSocketEvents = function(events) {
    var out = '';
    events.forEach(function(e) {
        var content = e.getContent();
        if (content) {
            out = out + e.getType() + ' ' + content.length.toString(16) +
                    "\r\n" + content + "\r\n";
        }
        else {
            out = out + e.getType() + "\r\n";
        }
    });
    return out;
};
var webSocketControlMessage = function(type, args) {
    var out = [];
    if (args) {
        out = JSON.parse(JSON.stringify(args));
    }
    out['type'] = type;
    return JSON.stringify(out);
}
var createGripChannelHeader = function(channels) {
    if (channels instanceof Channel) {
        channels = [channels];
    }
    else if (isString(channels)) {
        channels = [new Channel(channels)]
    }
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
var createHoldResponse = function(channels, response, timeout) {
    return createHold('response', channels, response, timeout);
};
var createHoldStream = function(channels, response) {
    return createHold('stream', channels, response);
};
var createHold = function(mode, channels, response, timeout) {
    if(!isArray(channels)) {
        channels = [channels];
    }

    var holdChannels = [];
    channels.forEach(function(channel) {
        if(isString(channel)) {
            channel = new Channel(channel);
        }
        if(channel instanceof Channel) {
            holdChannels.push(channel.export());
        }
    });

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

    if(isString(response)) {
        response = new Response(response);
    }
    if(response instanceof Response) {
        instruct.response = response.export();
    }

    return JSON.stringify(instruct);
};
var parseGripUri = function(uri) {
    uri = url.parse(uri, true);
    var iss = null;
    var key = null;
    var params = JSON.parse(JSON.stringify(uri.query));
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

// Exports
exports.version = version;
exports.Channel = Channel;
exports.Response = Response;
exports.HttpResponseFormat = HttpResponseFormat;
exports.HttpStreamFormat = HttpStreamFormat;
exports.GripPubControl = GripPubControl;
exports.createHold = createHold;
exports.createHoldResponse = createHoldResponse;
exports.createHoldStream = createHoldStream;
exports.createGripChannelHeader = createGripChannelHeader;
exports.validateSig = validateSig;
exports.parseGripUri = parseGripUri;
exports.WebSocketMessageFormat = WebSocketMessageFormat;
exports.WebSocketEvent = WebSocketEvent;
exports.decodeWebSocketEvents = decodeWebSocketEvents;
exports.encodeWebSocketEvents = encodeWebSocketEvents;
exports.webSocketControlMessage = webSocketControlMessage;
