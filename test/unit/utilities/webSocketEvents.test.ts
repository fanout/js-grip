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

describe('gripUtilities', function () {
    describe('#encodeWebSocketEvents', function () {
        it('test case', function() {
            const events = encodeWebSocketEvents([
                new WebSocketEvent('TEXT', 'Hello'),
                new WebSocketEvent('TEXT', ''),
                new WebSocketEvent('TEXT', null),
            ]);
            assert.equal(textDecoder.decode(events), 'TEXT 5\r\nHello\r\nTEXT 0\r\n\r\nTEXT\r\n');
        });
        it('test case', function() {
            const events = encodeWebSocketEvents([
                new WebSocketEvent('OPEN'),
            ]);
            assert.equal(textDecoder.decode(events), 'OPEN\r\n');
        });
    });
    describe('#decodeWebSocketEvents', function () {
        it('test case', function() {
            const events = decodeWebSocketEvents('OPEN\r\nTEXT 5\r\nHello' +
                '\r\nTEXT 0\r\n\r\nCLOSE\r\nTEXT\r\nCLOSE\r\n');
            assert.equal(events.length, 6);
            assert.equal(events[0].type, 'OPEN');
            assert.equal(events[0].content, null);
            assert.equal(events[1].type, 'TEXT');
            assert.equal(events[1].content, 'Hello');
            assert.equal(events[2].type, 'TEXT');
            assert.equal(events[2].content, '');
            assert.equal(events[3].type, 'CLOSE');
            assert.equal(events[3].content, null);
            assert.equal(events[4].type, 'TEXT');
            assert.equal(events[4].content, null);
            assert.equal(events[5].type, 'CLOSE');
            assert.equal(events[5].content, null);
        });
        it('test case', function() {
            const events = decodeWebSocketEvents(
              textEncoder.encode('OPEN\r\nTEXT 5\r\nHello' +
                '\r\nTEXT 0\r\n\r\nCLOSE\r\nTEXT\r\nCLOSE\r\n')
            );
            assert.equal(events.length, 6);
            assert.equal(events[0].type, 'OPEN');
            assert.equal(events[0].content, null);
            assert.equal(events[1].type, 'TEXT');
            assert.deepStrictEqual(events[1].content, textEncoder.encode('Hello'));
            assert.equal(events[2].type, 'TEXT');
            assert.deepStrictEqual(events[2].content, new Uint8Array());
            assert.equal(events[3].type, 'CLOSE');
            assert.equal(events[3].content, null);
            assert.equal(events[4].type, 'TEXT');
            assert.equal(events[4].content, null);
            assert.equal(events[5].type, 'CLOSE');
            assert.equal(events[5].content, null);
        });
        it('test case', function() {
            const events = decodeWebSocketEvents('OPEN\r\n');
            assert.equal(events.length, 1);
            assert.equal(events[0].type, 'OPEN');
            assert.equal(events[0].content, null);
        });
        it('test case', function() {
            const events = decodeWebSocketEvents('TEXT 5\r\nHello\r\n');
            assert.equal(events.length, 1);
            assert.equal(events[0].type, 'TEXT');
            assert.equal(events[0].content, 'Hello');
        });
        it('test case that should throw', function() {
            assert.throws(
                function () {
                    decodeWebSocketEvents('TEXT 5');
                },
                Error
            );
        });
        it('test case that should throw', function() {
            assert.throws(
                function () {
                    decodeWebSocketEvents('OPEN\r\nTEXT');
                },
                Error
            );
        });
    });
    describe('#createWebSocketControlMessage', function () {
        it('test case', function() {
            const message = createWebSocketControlMessage('type');
            assert.equal(JSON.stringify({'type': 'type'}), message);
        });
        it('test case', function() {
            const message = createWebSocketControlMessage('type', {'arg': 'val'});
            assert.equal(JSON.stringify({'arg': 'val', 'type': 'type'}), message);
        });
    });
});
