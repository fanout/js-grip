import * as assert from "assert";

import { WebSocketMessageFormat } from "../../../src";

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
            const ws = new WebSocketMessageFormat(Buffer.from('message'));
            assert.equal(ws.export()['content-bin'], Buffer.from('message').
            toString('base64'));
        });
        it('test case', function () {
            const ws = new WebSocketMessageFormat(null, true, 1009);
            assert.equal(ws.export()['action'], 'close');
            assert.equal(ws.export()['code'], 1009);
        });
    });
});
