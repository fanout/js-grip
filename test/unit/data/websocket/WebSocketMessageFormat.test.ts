import { describe, it } from 'node:test';
import assert from 'node:assert';

import { encodeBytesToBase64String, WebSocketMessageFormat } from '../../../../src/index.js';

const textEncoder = new TextEncoder();

describe('WebSocketMessageFormat', function () {
    describe('#constructor', function () {
        it('test case', function () {
            const ws = new WebSocketMessageFormat('content');
            assert.equal(ws.content, 'content');
        });
    });
    describe('#name', function () {
        it('test case', function () {
            const ws = new WebSocketMessageFormat('content');
            assert.equal(ws.name(), 'ws-message');
        });
    });
    describe('#export', function () {
        it('test case', function () {
            const ws = new WebSocketMessageFormat('message');
            assert.equal(ws.export()['content'], 'message');
        });
        it('test case', function () {
            const ws = new WebSocketMessageFormat(textEncoder.encode('message'));
            assert.deepStrictEqual(
              ws.export()['content-bin'],
              encodeBytesToBase64String(textEncoder.encode('message')),
            );
        });
        it('test case', function () {
            const ws = new WebSocketMessageFormat(null, true, 1009);
            assert.equal(ws.export()['action'], 'close');
            assert.equal(ws.export()['code'], 1009);
        });
    });
});
