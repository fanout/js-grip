import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebSocketEvent } from '../../../../src/index.js';

describe('WebSocketEvent', () => {
    describe('#constructor', () => {
        it('test case', () => {
            const we = new WebSocketEvent('type');
            assert.strictEqual(we.type, 'type');
            assert.strictEqual(we.content, null);
        });
        it('test case', () => {
            const we = new WebSocketEvent('type', 'content');
            assert.strictEqual(we.type, 'type');
            assert.strictEqual(we.content, 'content');
        });
    });
    describe('#getType', () => {
        it('test case', () => {
            const we = new WebSocketEvent('type');
            assert.strictEqual(we.getType(), 'type');
        });
    });
    describe('#getContent', () => {
        it('test case', () => {
            const we = new WebSocketEvent('type', 'content');
            assert.strictEqual(we.getContent(), 'content');
        });
    });
});
