/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2015 Fanout, Inc.
 * File name: httpresponseformat.js
 * File contains: the HttpResponseFormat class.
 * File authors: 
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var utilities = require('./utilities');

// The HttpResponseFormat class is the format used to publish messages to
// HTTP response clients connected to a GRIP proxy.
var HttpResponseFormat = utilities.defineClass(function(code,
        reason, headers, body) {

    // Initialize with the message code, reason, headers, and body to send
    // to the client when the message is published. If only one parameter
    // is passed then treat it as a dictionary object containing all of
    // the data in the form of key/value pairs. 
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

    // The name used when publishing this format.
    name: function() { return 'http-response'; },

    // Export the message into the required format and include only the fields
    // that are set. The body is exported as base64 as 'body-bin' (as opposed
    // to 'body') if the value is a buffer.
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

exports.HttpResponseFormat = HttpResponseFormat;
