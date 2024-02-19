import { jspack } from 'jspack';

import { createWebSocketControlMessage } from '../../utilities/index.js';

import { WebSocketEvent } from './WebSocketEvent.js';
import { IWebSocketEvent } from './IWebSocketEvent.js';
import { concatUint8Arrays } from '../../utilities/typedarray.js';

const textEncoder = new TextEncoder();

export class WebSocketContext {
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
        return Array.isArray(this.inEvents) && this.inEvents.length > 0 && this.inEvents[0].type === 'OPEN';
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
            if (['TEXT', 'BINARY', 'CLOSE', 'DISCONNECT'].indexOf(this.inEvents[n].type) > -1) {
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
            if (['TEXT', 'BINARY', 'CLOSE', 'DISCONNECT'].indexOf(this.inEvents[this.readIndex].type) > -1) {
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
            return e.content != null ? e.content : new Uint8Array();
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

    send(message: string | Uint8Array) {
        this.outEvents.push(
            new WebSocketEvent(
                'TEXT',
                concatUint8Arrays(textEncoder.encode('m:'), message instanceof Uint8Array ? message : textEncoder.encode(message)),
            ),
        );
    }
    sendBinary(message: string | Uint8Array) {
        this.outEvents.push(
            new WebSocketEvent(
                'BINARY',
                concatUint8Arrays(textEncoder.encode('m:'), message instanceof Uint8Array ? message : textEncoder.encode(message)),
            ),
        );
    }
    sendControl(message: string | Uint8Array) {
        this.outEvents.push(
            new WebSocketEvent(
                'TEXT',
                concatUint8Arrays(textEncoder.encode('c:'), message instanceof Uint8Array ? message : textEncoder.encode(message)),
            ),
        );
    }
    subscribe(channel: string) {
        this.sendControl(createWebSocketControlMessage('subscribe', { channel: this.prefix + channel }));
    }
    unsubscribe(channel: string) {
        this.sendControl(createWebSocketControlMessage('unsubscribe', { channel: this.prefix + channel }));
    }
    detach() {
        this.sendControl(createWebSocketControlMessage('detach'));
    }

    getOutgoingEvents() {
        const events = [];
        if (this.accepted) {
            events.push(new WebSocketEvent('OPEN'));
        }
        for (const event of this.outEvents) {
            events.push(event);
        }
        if (this.closed) {
            const octets = jspack.Pack('>H', [this.outCloseCode]);
            if (octets) {
                events.push(new WebSocketEvent('CLOSE', new Uint8Array(octets)));
            }
        }
        return events;
    }

    toHeaders() {
        // Find all keys of wsContext.origMeta that don't have the same key
        // in wsContext.meta
        const metaToRemove = Object.keys(this.origMeta).filter((k) =>
            Object.keys(this.meta).every((nk) => nk.toLowerCase() !== k),
        );

        // Find all items in wsContext.meta whose keys and values don't match
        // any in wsContext.origMeta
        const metaToSet = Object.entries(this.meta).reduce((acc: { [name: string]: string }, [nk, nv]) => {
            const lname = nk.toLowerCase();
            if (Object.entries(this.origMeta).every(([k, v]) => lname !== k || nv !== v)) {
                acc[lname] = nv;
            }
            return acc;
        }, {});

        const headers: { [name: string]: string } = {
            'Content-Type': 'application/websocket-events',
        };

        if (this.accepted) {
            headers['Sec-WebSocket-Extensions'] = 'grip';
        }
        for (const k of metaToRemove) {
            headers['Set-Meta-' + k] = '';
        }
        for (const [k, v] of Object.entries(metaToSet)) {
            headers['Set-Meta-' + k] = String(v);
        }

        return headers;
    }
}
