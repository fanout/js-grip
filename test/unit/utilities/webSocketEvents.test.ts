// noinspection DuplicatedCode

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    WebSocketEvent,
    decodeWebSocketEvents,
    encodeWebSocketEvents,
    createWebSocketControlMessage,
} from '../../../src/index.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

describe('gripUtilities', () => {
    describe('#encodeWebSocketEvents', () => {
        it('test case', () => {
            const events = encodeWebSocketEvents([
                new WebSocketEvent('TEXT', 'Hello'),
                new WebSocketEvent('TEXT', ''),
                new WebSocketEvent('TEXT', null),
            ]);
            assert.strictEqual(textDecoder.decode(events), 'TEXT 5\r\nHello\r\nTEXT 0\r\n\r\nTEXT\r\n');
        });
        it('test case', () => {
            const events = encodeWebSocketEvents([
                new WebSocketEvent('OPEN'),
            ]);
            assert.strictEqual(textDecoder.decode(events), 'OPEN\r\n');
        });
    });
    describe('#decodeWebSocketEvents', () => {
        it('test case', () => {
            const events = decodeWebSocketEvents('OPEN\r\nTEXT 5\r\nHello' +
                '\r\nTEXT 0\r\n\r\nCLOSE\r\nTEXT\r\nCLOSE\r\n');
            assert.strictEqual(events.length, 6);
            assert.strictEqual(events[0].type, 'OPEN');
            assert.strictEqual(events[0].content, null);
            assert.strictEqual(events[1].type, 'TEXT');
            assert.strictEqual(events[1].content, 'Hello');
            assert.strictEqual(events[2].type, 'TEXT');
            assert.strictEqual(events[2].content, '');
            assert.strictEqual(events[3].type, 'CLOSE');
            assert.strictEqual(events[3].content, null);
            assert.strictEqual(events[4].type, 'TEXT');
            assert.strictEqual(events[4].content, null);
            assert.strictEqual(events[5].type, 'CLOSE');
            assert.strictEqual(events[5].content, null);
        });
        it('test case', () => {
            const events = decodeWebSocketEvents(
              textEncoder.encode('OPEN\r\nTEXT 5\r\nHello' +
                '\r\nTEXT 0\r\n\r\nCLOSE\r\nTEXT\r\nCLOSE\r\n')
            );
            assert.strictEqual(events.length, 6);
            assert.strictEqual(events[0].type, 'OPEN');
            assert.strictEqual(events[0].content, null);
            assert.strictEqual(events[1].type, 'TEXT');
            assert.deepStrictEqual(events[1].content, textEncoder.encode('Hello'));
            assert.strictEqual(events[2].type, 'TEXT');
            assert.deepStrictEqual(events[2].content, new Uint8Array());
            assert.strictEqual(events[3].type, 'CLOSE');
            assert.strictEqual(events[3].content, null);
            assert.strictEqual(events[4].type, 'TEXT');
            assert.strictEqual(events[4].content, null);
            assert.strictEqual(events[5].type, 'CLOSE');
            assert.strictEqual(events[5].content, null);
        });
        it('test case', () => {
            const events = decodeWebSocketEvents('OPEN\r\n');
            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].type, 'OPEN');
            assert.strictEqual(events[0].content, null);
        });
        it('test case', () => {
            const events = decodeWebSocketEvents('TEXT 5\r\nHello\r\n');
            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].type, 'TEXT');
            assert.strictEqual(events[0].content, 'Hello');
        });
        it('test case that should throw', () => {
            assert.throws(
                () => {
                    decodeWebSocketEvents('TEXT 5');
                },
                Error
            );
        });
        it('test case that should throw', () => {
            assert.throws(
                () => {
                    decodeWebSocketEvents('OPEN\r\nTEXT');
                },
                Error
            );
        });
    });
    describe('#createWebSocketControlMessage', () => {
        it('test case', () => {
            const message = createWebSocketControlMessage('type');
            assert.strictEqual(JSON.stringify({'type': 'type'}), message);
        });
        it('test case', () => {
            const message = createWebSocketControlMessage('type', {'arg': 'val'});
            assert.strictEqual(JSON.stringify({'arg': 'val', 'type': 'type'}), message);
        });
    });
});
