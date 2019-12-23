import buffer from 'buffer';
import jspackModule from "jspack";
const { jspack } = jspackModule;

import WebSocketEvent from "./WebSocketEvent.mjs";

const { Buffer } = buffer;

export default class WebSocketContext {
	id;
	inEvents;
	readIndex = 0;
	accepted = false;
	closeCode = null;
	closed = false;
	outCloseCode = null;
	outEvents = [];
	origMeta;
	meta;
	prefix;

	constructor(id, meta, inEvents, prefix = '') {
		this.id = id;
		this.inEvents = inEvents;
		this.origMeta = meta;
		this.meta = JSON.parse(JSON.stringify(meta));
		this.prefix = prefix;
	}

	isOpening() {
		return Array.isArray(this.inEvents) &&
			this.inEvents.length > 0 &&
			this.inEvents[0].type === 'OPEN';
	}

	accept() {
		this.accepted = true;
	}

	close(code = 0) {
		this.closed = true;
		this.outCloseCode = code;
	}

	canRecv() {
		for (let n = this.readIndex; n < this.inEvents.length; n++) {
			if (['TEXT', 'BINARY', 'CLOSE', 'DISCONNECT'].indexOf(
					this.inEvents[n].type) > -1) {
				return true;
			}
		}
		return false;
	}

	disconnect() {
		this.outEvents.push(new WebSocketEvent('DISCONNECT'));
	}

	recvRaw() {
		let e = null;
		while (e == null && this.readIndex < this.inEvents.length) {
			if (['TEXT', 'BINARY', 'CLOSE', 'DISCONNECT'].indexOf(
					this.inEvents[this.readIndex].type) > -1
			) {
				e = this.inEvents[this.readIndex];
			} else if (this.inEvents[this.readIndex].type === 'PING') {
				this.outEvents.push(new WebSocketEvent('PONG'));
			}
			this.readIndex += 1;
		}
		if (e == null) {
			throw new Error('Read from empty buffer.');
		}

		const { type } = e;

		if (type === 'TEXT') {
			const { content = '' } = e;
			return content.toString();
		}

		if (type === 'BINARY') {
			const { content = Buffer(0) } = e;
			return content;
		}

		if (type === 'CLOSE') {
			const { content } = e;
			if (Array.isArray(content) && content.length === 2) {
				this.closeCode = jspack.Unpack('>H', [...content])[0];
			}
			return null;
		} else {
			throw new Error('Client disconnected unexpectedly.');
		}
	}

	recv() {
		const result = this.recvRaw();
		if (result == null) {
			return null;
		} else {
			return result.toString();
		}
	}

	send(message) {
		this.outEvents.push(new WebSocketEvent('TEXT', Buffer.concat(
				[Buffer.from('m:'), Buffer.from(message)])));
	}
	sendBinary(message) {
		this.outEvents.push(new WebSocketEvent('BINARY', Buffer.concat(
				[Buffer.from('m:'), Buffer.from(message)])));
	}
	sendControl(message) {
		this.outEvents.push(new WebSocketEvent('TEXT', Buffer.concat(
				[Buffer.from('c:'), Buffer.from(message)])));
	}
	subscribe(channel) {
		this.sendControl(buildWebSocketControlMessage('subscribe',
				{'channel': this.prefix + channel}));
	}
	unsubscribe(channel) {
		this.sendControl(buildWebSocketControlMessage('unsubscribe',
				{'channel': this.prefix + channel}));
	}
	detach() {
		this.sendControl(buildWebSocketControlMessage('detach'));
	}
}

// Generate a WebSocket control message with the specified type and optional
// arguments. WebSocket control messages are passed to GRIP proxies and
// example usage includes subscribing/unsubscribing a WebSocket connection
// to/from a channel.
export function buildWebSocketControlMessage(type, args = null) {
	const out = Object.assign({}, args, { type });
	return JSON.stringify(out);
}
