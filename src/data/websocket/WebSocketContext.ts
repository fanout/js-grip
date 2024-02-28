import { jspack } from 'jspack';
import { createWebSocketControlMessage, concatUint8Arrays } from '../../utilities/index.js';
import { WebSocketEvent } from './WebSocketEvent.js';
import type { IWebSocketEvent } from './IWebSocketEvent.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class WebSocketContext {
    id: string;
    _inEvents: IWebSocketEvent[];
    opening: boolean = false;
    accepted: boolean = false;
    closeCode: number | null = null;
    closed: boolean = false;
    outCloseCode: number | null = null;
    outEvents: IWebSocketEvent[] = [];
    origMeta: Record<string, string>;
    meta: Record<string, string>;
    prefix: string;

    constructor(id: string, meta: Record<string, string>, inEvents: IWebSocketEvent[], prefix = '') {
        this.id = id;
        this.meta = JSON.parse(JSON.stringify(meta));
        this.origMeta = meta;
        this._inEvents = inEvents;
        if (inEvents[0]?.type === 'OPEN') {
            this.opening = true;
        }
        this.prefix = prefix;
    }

    isOpening() {
        return this.opening;
    }

    accept() {
        this.accepted = true;
    }

    close(code = 0) {
        this.closed = true;
        this.outCloseCode = code;
    }

    canRecv() {
        return this._inEvents.some(event =>
            ['TEXT', 'BINARY', 'CLOSE', 'DISCONNECT'].includes(event.type)
        );
    }

    disconnect() {
        this.outEvents.push(new WebSocketEvent('DISCONNECT'));
    }

    recvRaw() {
        let e: IWebSocketEvent | undefined = undefined;
        while (true) {
            e = this._inEvents.shift();
            if (e == null) {
                throw new Error('Read from empty buffer.');
            }
            if (['TEXT', 'BINARY', 'CLOSE', 'DISCONNECT'].includes(e.type)) {
                break;
            }
            if (e.type === 'PING') {
                this.outEvents.push(new WebSocketEvent('PONG'));
            }
        }

        const { type } = e;

        if (type === 'TEXT') {
            if (e.content == null) {
                return '';
            }
            if (typeof e.content === 'string') {
                return e.content;
            }
            return textDecoder.decode(e.content);
        }

        if (type === 'BINARY') {
            if (e.content == null) {
                return new Uint8Array();
            }
            if (typeof e.content === 'string') {
                return textEncoder.encode(e.content);
            }
            return e.content;
        }

        if (type === 'CLOSE') {
            const { content } = e;
            if (content instanceof Uint8Array && content.length === 2) {
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
        const metaToSet = Object.entries(this.meta).reduce((acc: Record<string, string>, [nk, nv]) => {
            const lname = nk.toLowerCase();
            if (Object.entries(this.origMeta).every(([k, v]) => lname !== k || nv !== v)) {
                acc[lname] = nv;
            }
            return acc;
        }, {});

        const headers: Record<string, string> = {
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
