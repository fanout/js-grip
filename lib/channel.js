/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2015 Fanout, Inc.
 * File name: channel.js
 * File contains: the Channel class.
 * File authors: 
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var utilities = require('./utilities');

// The Channel class is used to represent a channel in for a GRIP proxy and
// tracks the previous ID of the last message.
var Channel = utilities.defineClass(function(name, prevId) {

    // Initialize with the channel name and an optional previous ID.
    this.name = name;
    this.prevId = prevId;
    if (this.prevId === undefined) {
        this.prevId = null;
    }
}, {

    // Export this channel instance into a dictionary containing the
    // name and previous ID value.
    export: function() {
        var obj = {name: this.name};
        if (this.prevId) {
            obj.prevId = this.prevId;
        }
        return obj;
    }
});

exports.Channel = Channel;
