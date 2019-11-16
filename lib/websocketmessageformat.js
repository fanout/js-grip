/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2015 Fanout, Inc.
 * File name: websocketmessageformat.js
 * File contains: the WebSocketMessageFormat class.
 * File authors: 
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var utilities = require('./utilities');

// The WebSocketMessageFormat class is the format used to publish data to
// WebSocket clients connected to GRIP proxies.
var WebSocketMessageFormat = utilities.defineClass(function(content, close, code) {

    // Initialize with either the message content or a boolean indicating that
    // the streaming connection should be closed. If neither the content nor
    // the boolean flag is set then an error will be thrown.
    if (typeof content === 'undefined' && !close) {
        throw new Error('WebSocketMessageFormat requires content.');
    }
    this.content = content;
    this.close = close;
    this.code = code;
    if (this.content === undefined) {
        this.content = null;
    }
    if (this.close === undefined) {
        this.close = null;
    }
    if (this.code === undefined) {
        this.code = null;
    }
}, {

    // The name used when publishing this format.
    name: function() { return 'ws-message'; },

    // Exports the message in the required format depending on whether the
    // message content is a buffer or not, or whether the connection should
    // be closed.
    export: function() {
        var obj = {};
        if(this.close) {
            obj['action'] = 'close';
            if(this.code != null) {
                obj['code'] = this.code;
            }
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

exports.WebSocketMessageFormat = WebSocketMessageFormat;
