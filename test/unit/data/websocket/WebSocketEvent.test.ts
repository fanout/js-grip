import { describe, it } from 'node:test';
import assert from 'node:assert';

import { WebSocketEvent } from '../../../../src/index.js';

describe('WebSocketEvent', function () {
    describe('#constructor', function () {
        it('test case', function () {
            const we = new WebSocketEvent('type');
            assert.equal(we.type, 'type');
            assert.equal(we.content, null);
        });
        it('test case', function () {
            const we = new WebSocketEvent('type', 'content');
            assert.equal(we.type, 'type');
            assert.equal(we.content, 'content');
        });
    });
    describe('#getType', function () {
        it('test case', function () {
            const we = new WebSocketEvent('type');
            assert.equal(we.getType(), 'type');
        });
    });
    describe('#getContent', function () {
        it('test case', function () {
            const we = new WebSocketEvent('type', 'content');
            assert.equal(we.getContent(), 'content');
        });
    });
});
