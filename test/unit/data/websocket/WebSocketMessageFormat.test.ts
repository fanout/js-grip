import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encodeBytesToBase64String, WebSocketMessageFormat } from '../../../../src/index.js';

const textEncoder = new TextEncoder();

describe('WebSocketMessageFormat', () => {
    describe('#constructor', () => {
        it('test case', () => {
            const ws = new WebSocketMessageFormat('content');
            assert.strictEqual(ws.content, 'content');
        });
    });
    describe('#name', () => {
        it('test case', () => {
            const ws = new WebSocketMessageFormat('content');
            assert.strictEqual(ws.name(), 'ws-message');
        });
    });
    describe('#export', () => {
        it('test case', () => {
            const ws = new WebSocketMessageFormat('message');
            assert.strictEqual(ws.export()['content'], 'message');
        });
        it('test case', () => {
            const ws = new WebSocketMessageFormat(textEncoder.encode('message'));
            assert.deepStrictEqual(
              ws.export()['content-bin'],
              encodeBytesToBase64String(textEncoder.encode('message')),
            );
        });
        it('test case', () => {
            const ws = new WebSocketMessageFormat(null, true, 1009);
            assert.strictEqual(ws.export()['action'], 'close');
            assert.strictEqual(ws.export()['code'], 1009);
        });
    });
});
