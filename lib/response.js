/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2015 Fanout, Inc.
 * File name: response.js
 * File contains: the Response class.
 * File authors: 
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var utilities = require('./utilities');

// The Response class is used to represent a set of HTTP response data.
// Populated instances of this class are serialized to JSON and passed
// to the GRIP proxy in the body. The GRIP proxy then parses the message
// and deserialized the JSON into an HTTP response that is passed back 
// to the client.
var Response = utilities.defineClass(function(code, reason, headers, body) {

    // Initialize with an HTTP response code, reason, headers, and body.
    // If only one parameter is passed then treat it as the HTTP body.
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
    if (this.code === undefined) {
        this.code = null;
    }
    if (this.reason === undefined) {
        this.reason = null;
    }
    if (this.headers === undefined) {
        this.headers = null;
    }
    if (this.body === undefined) {
        this.body = null;
    }
}, {

    // Export this Response instance into a dictionary containing all
    // of the non-null data. If the body is set to a buffer then export
    // it as 'body-bin' (as opposed to 'body') and encode it as base64.
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

exports.Response = Response;
