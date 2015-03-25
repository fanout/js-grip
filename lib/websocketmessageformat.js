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
var WebSocketMessageFormat = utilities.defineClass(function(content) {

    // Initialize with the message content.
    this.content = content;
}, {

    // The name used when publishing this format.
    name: function() { return 'ws-message'; },

    // Exports the message in the required format depending on whether the
    // message content is a buffer or not.
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

exports.WebSocketMessageFormat = WebSocketMessageFormat;
