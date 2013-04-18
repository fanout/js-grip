/*
 * nodegrip
 * GRIP interface library for NodeJS
 * (C) 2013 Fan Out Networks, Inc.
 * File author: Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Licensed under the MIT License, see file COPYING for details.
 */

// Version String
var version = "0.1.4";

// Dependencies
var pubcontrol = require('pubcontrol');
var jwt = require('jwt-simple');

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
var stringObjectIdentifier = objectToString.call("");
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
                obj["body-bin"] = this.body.toString('base64');
            } else {
                obj["body"] = this.body.toString();
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
    name: function() { return "http-response"; },
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
                obj["body-bin"] = this.body.toString('base64');
            } else {
                obj["body"] = this.body.toString();
            }
        }
        return obj;
    }
});

// HttpStreamFormat
var HttpStreamFormat = defineClass(function(content, close) {
    if (typeof content === "undefined" && !close) {
        throw new Error("HttpStreamFormat requires content.");
    }
    this.content = content;
    this.close = close;
}, {
    name: function() { return "http-stream"; },
    export: function() {
        var obj = {};
        if(this.close) {
            obj["action"] = "close";
        } else {
            if(Buffer.isBuffer(this.content)) {
                obj["content-bin"] = this.content.toString('base64');
            } else {
                obj["content"] = this.content.toString();
            }
        }
        return obj;
    }
});

// GripPubControl publisher class
var GripPubControl = defineClass(function(uri, auth) {
    this.pubControl = new pubcontrol.PubControl(uri, auth);
}, {
    getUri: function () {
        return this.pubControl.getUri();
    },
    setUri: function (uri) {
        this.pubControl.setUri(uri);
    },
    getAuth: function () {
        return this.pubControl.getAuth();
    },
    setAuth: function (auth) {
        this.pubControl.setAuth(auth);
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
            httpStream = new HttpResponseStream(httpStream);
        }
        var item = new pubcontrol.Item(httpStream, id, prevId);
        this.pubControl.publish(channel, item, cb);
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
var createHoldResponse = function(channels, response) {
    return createHoldWorker("response", channels, response);
};
var createHoldStream = function(channels, response) {
    return createHoldWorker("stream", channels, response);
};
var createHoldWorker = function(mode, channels, response) {
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

    var instruct = {
        hold: {
            mode: mode,
            channels: holdChannels
        }
    };

    if(isString(response)) {
        response = new Response(response);
    }
    if(response instanceof Response) {
        instruct.response = response.export();
    }

    return JSON.stringify(instruct);
};

// Exports
exports.version = version;
exports.Channel = Channel;
exports.Response = Response;
exports.HttpResponseFormat = HttpResponseFormat;
exports.HttpStreamFormat = HttpStreamFormat;
exports.GripPubControl = GripPubControl;
exports.createHoldResponse = createHoldResponse;
exports.createHoldStream = createHoldStream;
exports.validateSig = validateSig;
