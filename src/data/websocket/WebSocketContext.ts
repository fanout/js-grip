import { Buffer } from 'buffer';

import { jspack } from "jspack";
/// <reference path="../../../types/jspack.d.ts" />

import { createWebSocketControlMessage } from "../../utilities/webSocketEvents";

import WebSocketEvent from "./WebSocketEvent";
import IWebSocketEvent from "./IWebSocketEvent";

export default class WebSocketContext {
	id: string;
	inEvents: IWebSocketEvent[];
	readIndex: number = 0;
	accepted: boolean = false;
	closeCode: number | null = null;
	closed: boolean = false;
	outCloseCode: number | null = null;
	outEvents: IWebSocketEvent[] = [];
	origMeta: object;
	meta: object;
	prefix: string;

	constructor(id: string, meta: object, inEvents: IWebSocketEvent[], prefix = '') {
		this.id = id;
		this.meta = JSON.parse(JSON.stringify(meta));
		this.origMeta = meta;
		this.inEvents = inEvents;
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
			return e.content != null ? e.content.toString() : '';
		}

		if (type === 'BINARY') {
			return e.content != null ? e.content : Buffer.alloc(0);
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

	send(message: string | Buffer) {
		this.outEvents.push(new WebSocketEvent('TEXT', Buffer.concat(
				[Buffer.from('m:'), message instanceof Buffer ? message : Buffer.from(message)])));
	}
	sendBinary(message: string | Buffer) {
		this.outEvents.push(new WebSocketEvent('BINARY', Buffer.concat(
				[Buffer.from('m:'), message instanceof Buffer ? message : Buffer.from(message)])));
	}
	sendControl(message: string | Buffer) {
		this.outEvents.push(new WebSocketEvent('TEXT', Buffer.concat(
				[Buffer.from('c:'), message instanceof Buffer ? message : Buffer.from(message)])));
	}
	subscribe(channel: string) {
		this.sendControl(createWebSocketControlMessage('subscribe',
				{'channel': this.prefix + channel}));
	}
	unsubscribe(channel: string) {
		this.sendControl(createWebSocketControlMessage('unsubscribe',
				{'channel': this.prefix + channel}));
	}
	detach() {
		this.sendControl(createWebSocketControlMessage('detach'));
	}
}
