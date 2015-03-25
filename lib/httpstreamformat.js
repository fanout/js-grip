/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2015 Fanout, Inc.
 * File name: httpstreamformat.js
 * File contains: the HttpStreamFormat class.
 * File authors: 
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var utilities = require('./utilities');

// The HttpStreamFormat class is the format used to publish messages to
// HTTP stream clients connected to a GRIP proxy.
var HttpStreamFormat = utilities.defineClass(function(content, close) {

    // Initialize with either the message content or a boolean indicating that
    // the streaming connection should be closed. If neither the content nor
    // the boolean flag is set then an error will be thrown.
    if (typeof content === 'undefined' && !close) {
        throw new Error('HttpStreamFormat requires content.');
    }
    this.content = content;
    this.close = close;
    if (this.content === undefined) {
        this.content = null;
    }
    if (this.close === undefined) {
        this.close = null;
    }
}, {

    // The name used when publishing this format.
    name: function() { return 'http-stream'; },

    // Exports the message in the required format depending on whether the
    // message content is binary or not, or whether the connection should
    // be closed.
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

exports.HttpStreamFormat = HttpStreamFormat;
