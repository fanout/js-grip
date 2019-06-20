/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2018 Fanout, Inc.
 * File name: websocketcontext.js
 * File contains: the WebSocketContext class.
 * File authors: 
 * Justin Karneges <justin@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var jspack = require('jspack').jspack;
var websocketevent = require('./websocketevent');
var utilities = require('./utilities');

var WebSocketContext = utilities.defineClass(function(id, meta, inEvents, prefix) {
	this.id = id;
	this.inEvents = inEvents;
	this.readIndex = 0;
	this.accepted = false;
	this.closeCode = null;
	this.closed = false;
	this.outCloseCode = null;
	this.outEvents = [];
	this.origMeta = meta;
	this.meta = JSON.parse(JSON.stringify(meta));
	this.prefix = '';
	if (prefix) {
		this.prefix = prefix;
	}
}, {
	isOpening: function() { return this.inEvents != null &&
			this.inEvents.length > 0 && this.inEvents[0].type == 'OPEN'; },
	accept: function() { this.accepted = true; },
	close: function(code) {
		this.closed = true;
		if (code !== undefined) {
			this.outCloseCode = code;
		} else {
			this.outCloseCode = 0;
		}
	},
	canRecv: function() {
		for (n = this.readIndex; n < this.inEvents.length; n++) {
			if (['TEXT', 'BINARY', 'CLOSE', 'DISCONNECT'].indexOf(
					this.inEvents[n].type) > -1) {
				return true;
			}
		}
		return false;
	},
	disconnect: function() {
		this.outEvents.push(new websocketevent.WebSocketEvent('DISCONNECT'));
	},
	recvRaw: function() {
		var e = null;
		while (e == null && this.readIndex < this.inEvents.length) {
			if (['TEXT', 'BINARY', 'CLOSE', 'DISCONNECT'].indexOf(
					this.inEvents[this.readIndex].type) > -1) {
				e = this.inEvents[this.readIndex];
			} else if (this.inEvents[this.readIndex].type == 'PING') {
				this.outEvents.push(new websocketevent.WebSocketEvent('PONG'));
			}
			this.readIndex += 1;
		}
		if (e == null) {
			throw new Error('Read from empty buffer.');
		}
		if (e.type == 'TEXT') {
			if (e.content) {
				return e.content.toString();
			} else {
				return '';
			}
		} else if (e.type == 'BINARY') {
			if (e.content) {
				return e.content;
			} else {
				return new Buffer(0);
			}
		} else if (e.type == 'CLOSE') {
			if (e.content && e.content.length == 2) {
				this.closeCode = jspack.Unpack('>H', [e.content[0],
					e.content[1]])[0];
			}
			return null;
		} else {
			throw new Error('Client disconnected unexpectedly.');
		}
	},
	recv: function() {
		var result = this.recvRaw();
		if (result == null) {
			return null;
		} else {
			return result.toString();
		}
	},
	send: function(message) {
		this.outEvents.push(new websocketevent.WebSocketEvent('TEXT', Buffer.concat(
				[new Buffer('m:'), new Buffer(message)])));
	},
	sendBinary: function(message) {
		this.outEvents.push(new websocketevent.WebSocketEvent('BINARY', Buffer.concat(
				[new Buffer('m:'), new Buffer(message)])));
	},
	sendControl: function(message) {
		this.outEvents.push(new websocketevent.WebSocketEvent('TEXT', Buffer.concat(
				[new Buffer('c:'), new Buffer(message)])));
	},
	subscribe: function(channel) {
		this.sendControl(utilities.webSocketControlMessage('subscribe',
				{'channel': this.prefix + channel}));
	},
	unsubscribe: function(channel) {
		this.sendControl(utilities.webSocketControlMessage('unsubscribe',
				{'channel': this.prefix + channel}));
	},
	detach: function() {
		this.sendControl(utilities.webSocketControlMessage('detach'));
	}
});

exports.WebSocketContext = WebSocketContext;
