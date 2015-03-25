/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2015 Fanout, Inc.
 * File name: websocketevent.js
 * File contains: the WebSocketEvent class.
 * File authors: 
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var utilities = require('./utilities');

// The WebSocketEvent class represents WebSocket event information that is
// used with the GRIP WebSocket-over-HTTP protocol. It includes information
// about the type of event as well as an optional content field.
var WebSocketEvent = utilities.defineClass(function(type, content) {

    // Initialize with a specified event type and optional content information.
    this.type = type;
    this.content = content;
    if (this.content === undefined) {
        this.content = null;
    }
}, {

    // Get the event type.
    getType: function() {
        return this.type;
    },

    // Get the event content.
    getContent: function() {
        return this.content;
    }
});

exports.WebSocketEvent = WebSocketEvent;
